import { Card, CardContent } from "@/components/ui/card";
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
    <div>
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-bitcoin via-bitcoin/90 to-gold rounded-2xl shadow-2xl">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-16 translate-x-16 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full translate-y-12 -translate-x-12 animate-float"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>

        {/* Security indicators */}
        <div className="absolute top-5 right-5 flex gap-2">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse">
            <Zap className="w-4 h-4 text-white" />
          </div>
        </div>

        <CardContent className="p-8 relative z-10">
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
        </CardContent>
      </Card>
    </div>
  );
}