import { useAuth } from "@/hooks/use-auth";
import { WalletBalance } from "@/components/wallet-balance";
import { BitcoinPrice } from "@/components/bitcoin-price";
import { InvestmentPlans } from "@/components/investment-plans";
import { BitcoinSync } from "@/components/bitcoin-sync";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bell, User, Send, QrCode, Plus, ArrowUpDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Investment } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { formatBitcoin, calculateInvestmentProgress, formatDate } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data: investments } = useQuery<Investment[]>({
    queryKey: ['/api/investments/user', user?.id],
    enabled: !!user,
  });

  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications', user?.id, 'unread-count'],
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!user) {
      setLocation('/login');
    }
  }, [user, setLocation]);

  if (!user) {
    return <div>Redirecting to login...</div>;
  }

  const activeInvestments = investments?.filter(inv => inv.isActive) || [];

  return (
    <div className="max-w-sm mx-auto bg-background min-h-screen relative">
      {/* Status Bar */}
      <div className="flex justify-between items-center px-4 py-2 text-sm text-muted-foreground">
        <span>9:41</span>
        <div className="flex gap-1">
          <span>•••</span>
          <span>📶</span>
          <span>🔋</span>
        </div>
      </div>

      {/* Header */}
      <header className="px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-bitcoin flex items-center justify-center">
            <span className="text-black text-sm font-bold">₿</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">CoreX</h1>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" size="icon" className="rounded-full relative" onClick={() => setLocation('/notifications')}>
            <Bell className="w-4 h-4" />
            {unreadCount && unreadCount.count > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center">
                {unreadCount.count > 9 ? '9+' : unreadCount.count}
              </Badge>
            )}
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setLocation('/profile')}>
            <User className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Wallet Balance */}
      <WalletBalance />

      {/* Bitcoin Price */}
      <BitcoinPrice />

      {/* Bitcoin Sync */}
      <div className="px-4 mb-6">
        <BitcoinSync />
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-4 gap-3">
          <Button className="bg-card rounded-xl p-4 text-center border dark-border hover:border-bitcoin transition-colors flex flex-col items-center gap-2 h-auto">
            <Send className="w-5 h-5 text-bitcoin" />
            <span className="text-xs text-muted-foreground">Send</span>
          </Button>
          <Button className="bg-card rounded-xl p-4 text-center border dark-border hover:border-bitcoin transition-colors flex flex-col items-center gap-2 h-auto">
            <QrCode className="w-5 h-5 text-bitcoin" />
            <span className="text-xs text-muted-foreground">Receive</span>
          </Button>
          <Button className="bg-card rounded-xl p-4 text-center border dark-border hover:border-bitcoin transition-colors flex flex-col items-center gap-2 h-auto">
            <Plus className="w-5 h-5 text-bitcoin" />
            <span className="text-xs text-muted-foreground">Buy</span>
          </Button>
          <Button className="bg-card rounded-xl p-4 text-center border dark-border hover:border-bitcoin transition-colors flex flex-col items-center gap-2 h-auto">
            <ArrowUpDown className="w-5 h-5 text-bitcoin" />
            <span className="text-xs text-muted-foreground">Swap</span>
          </Button>
        </div>
      </div>

      {/* Investment Plans */}
      <InvestmentPlans />

      {/* Active Investments */}
      {activeInvestments.length > 0 && (
        <div className="px-4 mb-20">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Active Investments</h3>
          <div className="space-y-3">
            {activeInvestments.map((investment) => {
              const progress = calculateInvestmentProgress(
                new Date(investment.startDate),
                new Date(investment.endDate)
              );
              const daysLeft = Math.ceil(
                (new Date(investment.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <Card key={investment.id} className="dark-card rounded-xl p-4 dark-border">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gold">Investment #{investment.id}</h4>
                      <p className="text-muted-foreground text-sm">
                        Started: {formatDate(new Date(investment.startDate))}
                      </p>
                    </div>
                    <span className="bg-green-500 bg-opacity-20 text-green-400 px-2 py-1 rounded-full text-xs">
                      Active
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Invested</span>
                      <span className="text-foreground">{formatBitcoin(investment.amount)} BTC</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current Profit</span>
                      <span className="text-green-400">+{formatBitcoin(investment.currentProfit)} BTC</span>
                    </div>
                  </div>
                  <Progress value={progress} className="w-full mb-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    {daysLeft > 0 ? `${daysLeft} days remaining` : 'Completed'}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom spacing for navigation */}
      <div className="h-20"></div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
