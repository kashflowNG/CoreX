import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/use-currency";
import { formatBitcoin, formatCurrency } from "@/lib/utils";
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price";
import { Bitcoin, TrendingUp, Eye, EyeOff, Wallet, Shield } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export function WalletBalance() {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { data: price } = useBitcoinPrice();
  const [showBalance, setShowBalance] = useState(true);

  if (!user) return null;

  const fiatValue = parseFloat(user.balance) * (currency === 'USD' ? (price?.usd.price || 0) : (price?.gbp.price || 0));

  return (
    <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700/50 overflow-hidden relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-bitcoin rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500 rounded-full translate-y-24 -translate-x-24"></div>
      </div>

      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 bg-bitcoin/20 rounded-full flex items-center justify-center">
              <Wallet className="w-4 h-4 text-bitcoin" />
            </div>
            Portfolio Balance
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBalance(!showBalance)}
            className="text-gray-300 hover:text-white h-8 w-8 p-0"
          >
            {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0 relative z-10">
        <div className="space-y-4">
          {/* Main Balance Display */}
          <div className="text-center py-4">
            <div className="mb-2">
              <p className="text-3xl font-bold text-white">
                {showBalance ? formatBitcoin(user.balance) : '••••••••'} 
                <span className="text-lg text-bitcoin ml-2">BTC</span>
              </p>
              {price && (
                <p className="text-gray-300 text-lg">
                  {showBalance ? formatCurrency(fiatValue, currency) : '••••••••'}
                </p>
              )}
            </div>

            {/* Security Badge */}
            <div className="flex justify-center">
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                <Shield className="w-3 h-3 mr-1" />
                Secured Wallet
              </Badge>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700/50">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Bitcoin className="w-4 h-4 text-bitcoin" />
                <span className="text-xs text-gray-400">Network</span>
              </div>
              <p className="text-sm font-medium text-white">Bitcoin</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400">Status</span>
              </div>
              <p className="text-sm font-medium text-green-400">Active</p>
            </div>
          </div>

          {/* Professional Note */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-4">
            <p className="text-xs text-blue-300 text-center">
              💎 Your Bitcoin is secured with institutional-grade custody solutions
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}