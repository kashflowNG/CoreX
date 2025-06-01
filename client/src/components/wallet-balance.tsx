import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price";
import { formatBitcoin, formatUSD, calculateUSDValue } from "@/lib/utils";

export function WalletBalance() {
  const { user } = useAuth();
  const { data: bitcoinPrice } = useBitcoinPrice();
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(user.bitcoinAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const usdValue = bitcoinPrice ? calculateUSDValue(user.balance, bitcoinPrice.price) : 0;

  return (
    <div className="px-4 mb-6">
      <Card className="bitcoin-gradient rounded-2xl p-6 relative overflow-hidden border-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="relative z-10">
          <p className="text-orange-100 text-sm mb-1">Total Balance</p>
          <h2 className="text-3xl font-bold text-white mb-2">
            {formatBitcoin(user.balance)} BTC
          </h2>
          <p className="text-orange-100 text-lg">
            ≈ {formatUSD(usdValue)} USD
          </p>
          <div className="mt-4 pt-4 border-t border-orange-200 border-opacity-30">
            <p className="text-orange-100 text-xs mb-1">Wallet Address</p>
            <div className="flex items-center gap-2">
              <p className="text-white text-sm font-mono truncate">
                {user.bitcoinAddress}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyAddress}
                className="text-orange-100 hover:text-white hover:bg-white/10 p-1 h-auto"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
