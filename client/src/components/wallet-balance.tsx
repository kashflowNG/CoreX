import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price";
import { useCurrency } from "@/hooks/use-currency";
import { formatBitcoin, formatCurrency, calculateCurrencyValue } from "@/lib/utils";

export function WalletBalance() {
  const { user } = useAuth();
  const { data: bitcoinPrice } = useBitcoinPrice();
  const { currency } = useCurrency();

  if (!user) return null;

  const currentPriceData = bitcoinPrice ? (currency === 'USD' ? bitcoinPrice.usd : bitcoinPrice.gbp) : null;
  const fiatValue = currentPriceData ? calculateCurrencyValue(user.balance, currentPriceData.price) : 0;

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
            ≈ {formatCurrency(fiatValue, currency)}
          </p>
          <div className="mt-4 pt-4 border-t border-orange-200 border-opacity-30">
            <p className="text-orange-100 text-xs mb-1">Account Status</p>
            <p className="text-white text-sm">
              Active • Custodial Vault
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
