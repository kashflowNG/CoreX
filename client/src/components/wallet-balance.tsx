
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price";
import { useCurrency } from "@/hooks/use-currency";
import { formatBitcoin, formatCurrency, calculateCurrencyValue } from "@/lib/utils";
import { Eye, EyeOff, Shield, Zap, RefreshCw, TrendingUp } from "lucide-react";
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
    <div className="px-6 mb-8">
      <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 dark:from-slate-800 dark:via-blue-800 dark:to-indigo-800">
        {/* Enhanced Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-white/10 to-transparent rounded-full -translate-y-24 translate-x-24 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-400/20 to-transparent rounded-full translate-y-16 -translate-x-16"></div>
          <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-gradient-to-br from-purple-400/10 to-transparent rounded-full -translate-x-12 -translate-y-12"></div>
        </div>

        {/* Security & Status Indicators */}
        <div className="absolute top-6 right-6 flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          </div>
        </div>

        <div className="relative z-10 p-8">
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <p className="text-white/80 text-sm font-medium tracking-wide">PORTFOLIO BALANCE</p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {isBalanceVisible ? (
                  <>
                    <h2 className="text-4xl font-bold text-white tracking-tight mb-2">
                      {formatBitcoin(user.balance)} BTC
                    </h2>
                    <p className="text-white/70 text-xl font-medium">
                      ≈ {formatCurrency(fiatValue, currency)}
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-4xl font-bold text-white tracking-tight mb-2">
                      ••••••••
                    </h2>
                    <p className="text-white/70 text-xl font-medium">
                      ≈ ••••••••
                    </p>
                  </>
                )}
              </div>
              
              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300 backdrop-blur-sm border border-white/20"
                  onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                >
                  {isBalanceVisible ? (
                    <EyeOff className="w-5 h-5 text-white" />
                  ) : (
                    <Eye className="w-5 h-5 text-white" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300 backdrop-blur-sm border border-white/20"
                  onClick={handleRefreshBalance}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-5 h-5 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between pt-6 border-t border-white/20">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-white/80 text-sm font-medium">Secure Vault</span>
              </div>
              <div className="w-1 h-1 bg-white/40 rounded-full"></div>
              <span className="text-white/60 text-sm">Multi-Sig Protected</span>
            </div>
            
            <div className="text-right">
              <p className="text-white/60 text-xs">Last Sync</p>
              <p className="text-white/80 text-sm font-medium">Live</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
