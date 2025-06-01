import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price";
import { formatUSD } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function BitcoinPrice() {
  const { data: bitcoinPrice, isLoading } = useBitcoinPrice();

  if (isLoading) {
    return (
      <div className="px-4 mb-6">
        <Card className="dark-card rounded-xl p-4 dark-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="w-16 h-4" />
              <Skeleton className="w-8 h-3" />
            </div>
            <Skeleton className="w-12 h-4" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <Skeleton className="w-24 h-8 mb-1" />
              <Skeleton className="w-20 h-4" />
            </div>
            <Skeleton className="w-16 h-8 rounded" />
          </div>
        </Card>
      </div>
    );
  }

  if (!bitcoinPrice) {
    return (
      <div className="px-4 mb-6">
        <Card className="dark-card rounded-xl p-4 dark-border">
          <div className="text-center text-gray-400">
            Failed to load Bitcoin price
          </div>
        </Card>
      </div>
    );
  }

  const isPositive = bitcoinPrice.change24h >= 0;

  return (
    <div className="px-4 mb-6">
      <Card className="dark-card rounded-xl p-4 dark-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-bitcoin rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-black">₿</span>
            </div>
            <span className="font-semibold text-foreground">Bitcoin</span>
            <span className="text-muted-foreground text-sm">BTC</span>
          </div>
          <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{isPositive ? '+' : ''}{bitcoinPrice.change24h.toFixed(2)}%</span>
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold text-foreground">
              {formatUSD(bitcoinPrice.price)}
            </p>
            <p className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{formatUSD(bitcoinPrice.price * bitcoinPrice.change24h / 100)} (24h)
            </p>
          </div>
          <div className={`w-16 h-8 rounded opacity-70 ${isPositive ? 'bg-gradient-to-r from-green-400 to-bitcoin' : 'bg-gradient-to-r from-red-400 to-red-600'}`}></div>
        </div>
      </Card>
    </div>
  );
}
