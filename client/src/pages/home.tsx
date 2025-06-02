import { useAuth } from "@/hooks/use-auth";
import { WalletBalance } from "@/components/wallet-balance";
import { BitcoinPrice } from "@/components/bitcoin-price";
import { BitcoinSync } from "@/components/bitcoin-sync";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bell, User, ArrowUpRight, ArrowDownLeft, TrendingUp, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Investment, InvestmentPlan } from "@shared/schema";
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
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: investmentPlans } = useQuery<InvestmentPlan[]>({
    queryKey: ['/api/investment-plans'],
    enabled: !!user,
  });

  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications', user?.id, 'unread-count'],
    queryFn: () => fetch(`/api/notifications/${user?.id}/unread-count`).then(res => res.json()),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!user) {
      setLocation('/login');
      return;
    }
    
    // Redirect to wallet setup if user doesn't have a wallet
    if (!user.hasWallet) {
      setLocation('/wallet-setup');
    }
  }, [user, setLocation]);

  if (!user) {
    return <div>Redirecting to login...</div>;
  }

  const activeInvestments = investments?.filter(inv => inv.isActive) || [];

  const totalInvestmentValue = investments?.reduce((total, inv) => 
    total + parseFloat(inv.amount) + parseFloat(inv.currentProfit), 0
  ) || 0;

  const totalProfit = investments?.reduce((total, inv) => 
    total + parseFloat(inv.currentProfit), 0
  ) || 0;

  const currentPlan = user?.currentPlanId 
    ? investmentPlans?.find(plan => plan.id === user.currentPlanId)
    : null;

  return (
    <div className="max-w-sm mx-auto bg-background min-h-screen relative">

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
        <div className="grid grid-cols-2 gap-3">
          <Button 
            className="bg-card rounded-xl p-4 text-center border dark-border hover:border-bitcoin transition-colors flex flex-col items-center gap-2 h-auto"
            onClick={() => setLocation('/withdraw')}
          >
            <ArrowUpRight className="w-5 h-5 text-bitcoin" />
            <span className="text-xs text-muted-foreground">Withdraw</span>
          </Button>
          <Button 
            className="bg-card rounded-xl p-4 text-center border dark-border hover:border-bitcoin transition-colors flex flex-col items-center gap-2 h-auto"
            onClick={() => setLocation('/deposit')}
          >
            <ArrowDownLeft className="w-5 h-5 text-bitcoin" />
            <span className="text-xs text-muted-foreground">Deposit</span>
          </Button>
        </div>
      </div>

      {/* Current Investment Plan */}
      <div className="px-4 mb-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Current Plan</h3>
        <Card className="dark-card rounded-xl p-4 dark-border">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-foreground">
                {currentPlan ? currentPlan.name : "Free Plan"}
              </h4>
              <p className="text-sm text-muted-foreground">
                {currentPlan 
                  ? `${(parseFloat(currentPlan.dailyReturnRate) * 100).toFixed(2)}% daily return`
                  : "3.67% every 10 minutes"
                }
              </p>
            </div>
            <div className="text-right">
              <span className={`px-2 py-1 rounded-full text-xs ${
                currentPlan 
                  ? 'bg-green-500 bg-opacity-20 text-green-400' 
                  : 'bg-blue-500 bg-opacity-20 text-blue-400'
              }`}>
                {currentPlan ? 'Premium' : 'Free'}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Portfolio Overview */}
      <div className="px-4 mb-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Portfolio Overview</h3>
        <div className="grid grid-cols-2 gap-3">
          <Card className="dark-card rounded-xl p-4 dark-border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-muted-foreground">Total Invested</span>
            </div>
            <p className="text-lg font-bold text-foreground">{formatBitcoin(totalInvestmentValue.toString())} BTC</p>
          </Card>

          <Card className="dark-card rounded-xl p-4 dark-border">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-bitcoin" />
              <span className="text-xs text-muted-foreground">Total Profit</span>
            </div>
            <p className="text-lg font-bold text-green-400">+{formatBitcoin(totalProfit.toString())} BTC</p>
          </Card>
        </div>
      </div>

      {/* Investment Plans */}
      {/* <InvestmentPlans /> */}

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