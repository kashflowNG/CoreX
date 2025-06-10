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
      console.error("Failed to refresh balance:", error);
    } finally {
      setIsRefreshing(false);
    }
  };


  return (
    <div className="px-6 mb-8">
      <Card className="gradient-primary rounded-3xl p-8 relative overflow-hidden border-0 shadow-2xl animate-glow">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full -translate-y-20 translate-x-20 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full translate-y-16 -translate-x-16 animate-float"></div>

        {/* Security indicators */}
        <div className="absolute top-4 right-4 flex gap-2">
          <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center animate-pulse">
            <Zap className="w-4 h-4 text-white" />
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-black text-opacity-70 text-sm font-medium mb-1">Total Portfolio Balance</p>
              <div className="flex items-center gap-3">
                {isBalanceVisible ? (
                  <h2 className="text-4xl font-bold text-black tracking-tight">
                    {formatBitcoin(user.balance)} BTC
                  </h2>
                ) : (
                  <h2 className="text-4xl font-bold text-black tracking-tight">
                    ••••••••
                  </h2>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-xl bg-black bg-opacity-10 hover:bg-opacity-20 transition-all"
                  onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                >
                  {isBalanceVisible ? (
                    <EyeOff className="w-4 h-4 text-black" />
                  ) : (
                    <Eye className="w-4 h-4 text-black" />
                  )}
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 rounded-xl bg-black bg-opacity-10 hover:bg-opacity-20 transition-all"
                    onClick={handleRefreshBalance}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`w-4 h-4 text-black ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
              </div>
            </div>
          </div>

          {isBalanceVisible && (
            <p className="text-black text-opacity-70 text-xl font-semibold mb-6">
              ≈ {formatCurrency(fiatValue, currency)}
            </p>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-black border-opacity-20">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald animate-pulse"></div>
              <p className="text-black text-opacity-70 text-sm font-medium">
                Secure Vault • Multi-Sig Protected
              </p>
            </div>
            <div className="text-right">
              <p className="text-black text-opacity-70 text-xs">Last Updated</p>
              <p className="text-black text-sm font-medium">Just now</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}