import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Copy, User, Bitcoin, Key, ExternalLink, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Profile() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!user) {
      setLocation('/login');
    }
  }, [user, setLocation]);

  if (!user) {
    return <div>Redirecting to login...</div>;
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  const openBlockExplorer = (address: string) => {
    window.open(`https://blockstream.info/address/${address}`, '_blank');
  };

  return (
    <div className="min-h-screen dark-bg">
      <div className="max-w-sm mx-auto p-4 pb-20">
        <div className="mb-6">
          <h1 className="text-2xl font-bold dark-text mb-2">Profile</h1>
          <p className="text-muted-foreground">Your account information and Bitcoin wallet details</p>
        </div>

        <div className="space-y-6">
          {/* User Info */}
          <Card className="dark-card dark-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark-text">
                <User className="w-5 h-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium dark-text">Email Address</label>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-muted-foreground">{user.email}</span>
                  {user.isAdmin && (
                    <Badge variant="secondary">Admin</Badge>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium dark-text">User ID</label>
                <p className="text-muted-foreground mt-1">#{user.id}</p>
              </div>
            </CardContent>
          </Card>

          {/* Account Balance */}
          <Card className="dark-card dark-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark-text">
                <Bitcoin className="w-5 h-5 text-orange-500" />
                Account Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium dark-text">Current Balance</label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="font-mono text-lg">
                    {parseFloat(user.balance).toFixed(8)} BTC
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium dark-text">Security</label>
                <div className="text-xs text-muted-foreground bg-green-50 dark:bg-green-950 p-2 rounded mt-1">
                  <strong>Secure:</strong> Your funds are safely managed by our custodial system. All deposits and withdrawals are processed through our secure infrastructure.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Information */}
          <Card className="dark-card dark-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark-text">
                <Shield className="w-5 h-5" />
                Security & Platform Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                <h4 className="font-medium dark-text mb-2">How It Works:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>All Bitcoin funds are securely managed in our custodial vault</li>
                  <li>Deposits are made to our official deposit addresses</li>
                  <li>Withdrawals are processed from our secure vault to your specified address</li>
                  <li>Your account balance reflects your share in our managed fund</li>
                  <li>All transactions require admin approval for security</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={logout}
            variant="outline"
            className="w-full"
          >
            Sign Out
          </Button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}