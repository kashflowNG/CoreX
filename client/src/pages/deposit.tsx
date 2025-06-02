import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ArrowLeft, Copy, Check, QrCode, Wallet } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface AdminConfig {
  vaultAddress: string;
  depositAddress: string;
}

export default function Deposit() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  // Fetch admin configuration for deposit addresses
  const { data: adminConfig } = useQuery<AdminConfig>({
    queryKey: ['/api/admin/config'],
    queryFn: () => fetch('/api/admin/config').then(res => res.json()),
  });

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast({
        title: "Address Copied",
        description: `${type} address copied to clipboard`,
      });
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy address to clipboard",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return <div>Please log in to access deposits</div>;
  }

  return (
    <div className="max-w-sm mx-auto bg-background min-h-screen relative">
      {/* Header */}
      <header className="px-4 py-6 border-b dark-border">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation('/')}
            className="rounded-full"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Deposit Bitcoin</h1>
            <p className="text-xs text-muted-foreground">Add Bitcoin to your wallet</p>
          </div>
        </div>
      </header>

      <div className="p-4 pb-20 space-y-6">
        {/* Vault Address */}
        <Card className="dark-card dark-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-bitcoin" />
              Investment Vault
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Vault Address</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={adminConfig?.vaultAddress || "Loading..."}
                    readOnly
                    className="text-xs font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => adminConfig?.vaultAddress && copyToClipboard(adminConfig.vaultAddress, "Vault")}
                    disabled={!adminConfig?.vaultAddress}
                  >
                    {copied === "Vault" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Send Bitcoin to this address for long-term investment storage
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Deposit Address */}
        <Card className="dark-card dark-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-bitcoin" />
              Instant Deposit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Deposit Address</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={adminConfig?.depositAddress || "Loading..."}
                    readOnly
                    className="text-xs font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => adminConfig?.depositAddress && copyToClipboard(adminConfig.depositAddress, "Deposit")}
                    disabled={!adminConfig?.depositAddress}
                  >
                    {copied === "Deposit" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Send Bitcoin to this address for immediate balance update
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Import */}
        <Card className="dark-card dark-border">
          <CardHeader>
            <CardTitle>Import Existing Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setLocation('/import-wallet')}
            >
              <Wallet className="w-4 h-4 mr-2" />
              Import Private Key or Seed Phrase
            </Button>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="dark-card dark-border">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3 text-foreground">Deposit Instructions</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>• Use vault address for investment deposits</p>
              <p>• Use deposit address for trading balance</p>
              <p>• Minimum deposit: 0.00001 BTC</p>
              <p>• Confirmations required: 1</p>
              <p>• Your balance updates automatically</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}