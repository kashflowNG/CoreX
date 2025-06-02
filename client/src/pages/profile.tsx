import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Copy, User, Bitcoin, Key, ExternalLink } from "lucide-react";
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

          {/* Bitcoin Wallet Info */}
          <Card className="dark-card dark-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark-text">
                <Bitcoin className="w-5 h-5 text-orange-500" />
                Bitcoin Wallet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium dark-text">Bitcoin Address</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs bg-muted p-2 rounded flex-1 break-all font-mono">
                    {user.bitcoinAddress}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(user.bitcoinAddress, "Bitcoin address")}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openBlockExplorer(user.bitcoinAddress)}
                  className="mt-2 text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View on Block Explorer
                </Button>
              </div>

              <div>
                <label className="text-sm font-medium dark-text">Current Balance</label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="font-mono">
                    {parseFloat(user.balance).toFixed(8)} BTC
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium dark-text">Security</label>
                <div className="text-xs text-muted-foreground bg-green-50 dark:bg-green-950 p-2 rounded mt-1">
                  <strong>Secure:</strong> Your private key is safely managed by our system. Only your public Bitcoin address is displayed for receiving funds.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Information */}
          <Card className="dark-card dark-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark-text">
                <Key className="w-5 h-5" />
                Security Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                <h4 className="font-medium dark-text mb-2">Important Security Notes:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Your private key is securely managed by the system</li>
                  <li>Always verify your Bitcoin address before receiving funds</li>
                  <li>Only administrators can access private keys for recovery purposes</li>
                  <li>Use the sync feature to update your balance with the blockchain</li>
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