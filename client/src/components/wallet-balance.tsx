import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price";
import { useCurrency } from "@/hooks/use-currency";
import { formatBitcoin, formatCurrency, calculateCurrencyValue } from "@/lib/utils";
import { Eye, EyeOff, Shield, Zap, RefreshCw } from "lucide-react";
import { useState } from "react";

export function WalletBalance() {
  const { user, refreshUser } = useAuth();
  const { data: bitcoinPrice } = useBitcoinPrice();
  const { currency } = useCurrency();
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!user) return null;

  const currentPriceData = bitcoinPrice ? (currency === 'USD' ? bitcoinPrice.usd : bitcoinPrice.gbp) : null;
  const fiatValue = currentPriceData ? calculateCurrencyValue(user.balance, currentPriceData.price) : 0;

  const handleRefreshBalance = async () => {
    if (!user) return;

    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/bitcoin/sync-balance/${user.id}`, {
        method: 'POST'
      });

      if (response.ok) {
        await refreshUser();
      } else {
        throw new Error('Failed to sync balance');
      }
    } catch (error) {
      console.error("Failed to sync balance with blockchain:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="px-4 mb-6">
      <Card className="gradient-primary rounded-2xl p-6 relative overflow-hidden border-0 shadow-xl">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-8 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full translate-y-12 -translate-x-12"></div>

        {/* Security indicators */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          <div className="w-6 h-6 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
            <Shield className="w-3 h-3 text-white" />
          </div>
          <div className="w-6 h-6 rounded-full bg-white bg-opacity-20 flex items-center justify-center animate-pulse">
            <Zap className="w-3 h-3 text-white" />
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          {/* Header */}
          <div>
            <p className="text-black text-opacity-70 text-xs font-medium mb-2">Total Portfolio Balance</p>
            {/* Wallet Balance Removed */}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-black border-opacity-20">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald animate-pulse"></div>
              <p className="text-black text-opacity-70 text-xs font-medium">
                Secure Vault Protected
              </p>
            </div>
            <div className="text-right">
              <p className="text-black text-opacity-70 text-xs">Live</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}