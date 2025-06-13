
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ArrowLeft, Copy, Check, QrCode, Wallet, Send, Info, Zap, Shield, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

interface AdminConfig {
  vaultAddress: string;
  depositAddress: string;
}

// Simple QR Code component (you can replace with a proper QR library)
function QRCodeDisplay({ value, size = 200 }: { value: string; size?: number }) {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;
  
  return (
    <div className="flex justify-center p-4 bg-white rounded-lg">
      <img 
        src={qrCodeUrl} 
        alt="QR Code" 
        width={size} 
        height={size}
        className="rounded"
      />
    </div>
  );
}

export default function Deposit() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [selectedTab, setSelectedTab] = useState<'vault' | 'instant'>('instant');
  const [showQR, setShowQR] = useState(false);

  // Fetch admin configuration for deposit addresses
  const { data: adminConfig } = useQuery<AdminConfig>({
    queryKey: ['/api/admin/config'],
    queryFn: () => fetch('/api/admin/config').then(res => res.json()),
  });

  // Fetch recent deposit transactions
  const { data: recentDeposits } = useQuery({
    queryKey: ['/api/transactions'],
    queryFn: () => fetch('/api/transactions').then(res => res.json()),
    select: (data: any[]) => data.filter(tx => tx.type === 'deposit').slice(0, 3),
  });

  // Submit deposit transaction
  const submitDepositMutation = useMutation({
    mutationFn: async (data: { amount: string; transactionHash?: string }) => {
      const response = await fetch('/api/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Deposit failed');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Deposit Submitted Successfully! 🎉",
        description: "Your deposit is being processed and will be confirmed shortly.",
      });
      setAmount("");
      setTransactionHash("");
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Deposit Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast({
        title: "Copied! 📋",
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

  const currentAddress = selectedTab === 'vault' ? adminConfig?.vaultAddress : adminConfig?.depositAddress;

  return (
    <div className="max-w-sm mx-auto bg-background min-h-screen relative">
      {/* Header */}
      <header className="px-4 py-6 border-b dark-border bg-gradient-to-r from-bitcoin/5 to-transparent">
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
            <p className="text-xs text-muted-foreground">Secure & Instant Funding</p>
          </div>
        </div>
      </header>

      <div className="p-4 pb-20 space-y-6">
        {/* Deposit Method Selector */}
        <div className="flex p-1 bg-muted rounded-lg">
          <button
            onClick={() => setSelectedTab('instant')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              selectedTab === 'instant' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground'
            }`}
          >
            <Zap className="w-4 h-4 inline mr-2" />
            Instant
          </button>
          <button
            onClick={() => setSelectedTab('vault')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              selectedTab === 'vault' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground'
            }`}
          >
            <Wallet className="w-4 h-4 inline mr-2" />
            Vault
          </button>
        </div>

        {/* Deposit Address Card */}
        <Card className="dark-card dark-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedTab === 'instant' ? (
                  <Zap className="w-5 h-5 text-bitcoin" />
                ) : (
                  <Shield className="w-5 h-5 text-bitcoin" />
                )}
                {selectedTab === 'instant' ? 'Instant Deposit' : 'Investment Vault'}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQR(!showQR)}
                className="h-8 px-2"
              >
                <QrCode className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* QR Code Display */}
              {showQR && currentAddress && (
                <div className="border rounded-lg p-4 bg-white">
                  <QRCodeDisplay value={currentAddress} size={180} />
                  <p className="text-center text-xs text-muted-foreground mt-2">
                    Scan with your Bitcoin wallet
                  </p>
                </div>
              )}

              {/* Address Input */}
              <div>
                <Label className="text-xs text-muted-foreground">
                  {selectedTab === 'instant' ? 'Instant Deposit Address' : 'Vault Address'}
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={currentAddress || "Loading..."}
                    readOnly
                    className="text-xs font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => currentAddress && copyToClipboard(currentAddress, selectedTab === 'instant' ? 'Instant' : 'Vault')}
                    disabled={!currentAddress}
                  >
                    {copied === (selectedTab === 'instant' ? 'Instant' : 'Vault') ? 
                      <Check className="w-4 h-4 text-green-500" /> : 
                      <Copy className="w-4 h-4" />
                    }
                  </Button>
                </div>
              </div>

              {/* Method Description */}
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-bitcoin mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-muted-foreground space-y-1">
                    {selectedTab === 'instant' ? (
                      <>
                        <p className="font-medium text-foreground">Instant Balance Update</p>
                        <p>• Send Bitcoin to this address for immediate balance update</p>
                        <p>• Perfect for trading and quick investments</p>
                        <p>• Confirmations: 1 required</p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-foreground">Long-term Investment Storage</p>
                        <p>• Secure vault for long-term Bitcoin storage</p>
                        <p>• Enhanced security with multi-signature protection</p>
                        <p>• Ideal for large investments</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Deposit */}
        <Card className="dark-card dark-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-bitcoin" />
              Submit Deposit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount (BTC)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.00000001"
                  placeholder="0.00100000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum: 0.00001 BTC
                </p>
              </div>
              
              <div>
                <Label htmlFor="txHash">Transaction Hash (Optional)</Label>
                <Input
                  id="txHash"
                  placeholder="Enter your transaction hash for faster processing"
                  value={transactionHash}
                  onChange={(e) => setTransactionHash(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Adding your transaction hash speeds up confirmation
                </p>
              </div>

              <Button 
                onClick={() => submitDepositMutation.mutate({ amount, transactionHash })}
                disabled={!amount || parseFloat(amount) < 0.00001 || submitDepositMutation.isPending}
                className="w-full bg-bitcoin hover:bg-bitcoin/90 text-black font-semibold"
              >
                {submitDepositMutation.isPending ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Deposit
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Deposits */}
        {recentDeposits && recentDeposits.length > 0 && (
          <Card className="dark-card dark-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Recent Deposits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentDeposits.map((deposit: any, index: number) => (
                  <div key={deposit.id} className="flex justify-between items-center py-2">
                    <div>
                      <p className="text-sm font-medium">{deposit.amount} BTC</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(deposit.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        deposit.status === 'confirmed' ? 'default' : 
                        deposit.status === 'pending' ? 'secondary' : 
                        'destructive'
                      }
                      className="text-xs"
                    >
                      {deposit.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Features */}
        <Card className="dark-card dark-border">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3 text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-bitcoin" />
              Security & Processing
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-muted-foreground">SSL Encrypted</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-muted-foreground">Auto-confirmation</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-muted-foreground">24/7 Monitoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-muted-foreground">Instant Updates</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}
