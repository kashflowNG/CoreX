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

  const totalInvestedAmount = investments?.reduce((total, inv) => 
    total + parseFloat(inv.amount), 0
  ) || 0;

  const totalProfit = investments?.reduce((total, inv) => 
    total + parseFloat(inv.currentProfit), 0
  ) || 0;

  const totalInvestmentValue = totalInvestedAmount + totalProfit;

  const currentPlan = user?.currentPlanId 
    ? investmentPlans?.find(plan => plan.id === user.currentPlanId)
    : null;

  return (
    <div className="max-w-sm mx-auto bg-background min-h-screen relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background opacity-50"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-bitcoin opacity-5 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald opacity-5 rounded-full blur-3xl animate-pulse-slow"></div>

      {/* Header */}
      <header className="relative px-6 py-4 flex justify-between items-center backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center animate-glow shadow-lg">
            <span className="text-black text-lg font-bold">₿</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground bg-gradient-to-r from-bitcoin to-gold bg-clip-text text-transparent">
              CoreX
            </h1>
            <p className="text-sm text-muted-foreground font-medium">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-2xl relative glass-card hover:glow-bitcoin transition-all duration-300" 
            onClick={() => setLocation('/notifications')}
          >
            <Bell className="w-5 h-5" />
            {unreadCount && unreadCount.count > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 text-xs p-0 flex items-center justify-center animate-pulse glow-ruby">
                {unreadCount.count > 9 ? '9+' : unreadCount.count}
              </Badge>
            )}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-2xl glass-card hover:glow-emerald transition-all duration-300" 
            onClick={() => setLocation('/profile')}
          >
            <User className="w-5 h-5" />
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
      <div className="relative px-6 mb-8">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <Button 
            className="neo-card rounded-2xl p-6 text-center hover:glow-ruby transition-all duration-300 transform hover:scale-105 flex flex-col items-center gap-3 h-auto group"
            onClick={() => setLocation('/withdraw')}
          >
            <div className="w-12 h-12 rounded-xl bg-ruby bg-opacity-20 flex items-center justify-center group-hover:bg-opacity-30 transition-all">
              <ArrowUpRight className="w-6 h-6 text-ruby" />
            </div>
            <span className="text-sm font-medium text-foreground">Withdraw</span>
            <span className="text-xs text-muted-foreground">Send Bitcoin</span>
          </Button>
          <Button 
            className="neo-card rounded-2xl p-6 text-center hover:glow-emerald transition-all duration-300 transform hover:scale-105 flex flex-col items-center gap-3 h-auto group"
            onClick={() => setLocation('/deposit')}
          >
            <div className="w-12 h-12 rounded-xl bg-emerald bg-opacity-20 flex items-center justify-center group-hover:bg-opacity-30 transition-all">
              <ArrowDownLeft className="w-6 h-6 text-emerald" />
            </div>
            <span className="text-sm font-medium text-foreground">Deposit</span>
            <span className="text-xs text-muted-foreground">Receive Bitcoin</span>
          </Button>
        </div>
      </div>

      {/* Current Investment Plan */}
      <div className="relative px-6 mb-8">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Investment Plan</h3>
        <Card className="neo-card rounded-2xl p-6 hover:glow-bitcoin transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                currentPlan 
                  ? 'bg-emerald bg-opacity-20' 
                  : 'bg-sapphire bg-opacity-20'
              }`}>
                <TrendingUp className={`w-6 h-6 ${
                  currentPlan ? 'text-emerald' : 'text-sapphire'
                }`} />
              </div>
              <div>
                <h4 className="font-bold text-lg text-foreground">
                  {currentPlan ? currentPlan.name : "Free Plan"}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {currentPlan 
                    ? `${(parseFloat(currentPlan.dailyReturnRate) * 100).toFixed(2)}% daily return`
                    : "3.67% every 10 minutes"
                  }
                </p>
              </div>
            </div>
            <Badge className={`px-3 py-1 rounded-xl text-sm font-medium ${
              currentPlan 
                ? 'bg-emerald bg-opacity-20 text-emerald border-emerald' 
                : 'bg-sapphire bg-opacity-20 text-sapphire border-sapphire'
            }`}>
              {currentPlan ? 'Premium' : 'Free'}
            </Badge>
          </div>
          {!currentPlan && (
            <Button 
              className="w-full gradient-primary text-black font-medium rounded-xl hover:scale-105 transition-all duration-300"
              onClick={() => setLocation('/investment')}
            >
              Upgrade Plan
            </Button>
          )}
        </Card>
      </div>

      {/* Portfolio Overview */}
      <div className="relative px-6 mb-8">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Portfolio Overview</h3>
        <div className="grid grid-cols-2 gap-4">
          <Card className="neo-card rounded-2xl p-5 hover:glow-emerald transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald bg-opacity-20 flex items-center justify-center group-hover:bg-opacity-30 transition-all">
                <TrendingUp className="w-5 h-5 text-emerald" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">Total Invested</span>
            </div>
            <p className="text-xl font-bold text-foreground">{formatBitcoin(totalInvestedAmount.toString())}</p>
            <p className="text-xs text-bitcoin font-medium">BTC</p>
          </Card>

          <Card className="neo-card rounded-2xl p-5 hover:glow-bitcoin transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-bitcoin bg-opacity-20 flex items-center justify-center group-hover:bg-opacity-30 transition-all">
                <Activity className="w-5 h-5 text-bitcoin" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">Total Profit</span>
            </div>
            <p className="text-xl font-bold text-emerald">+{formatBitcoin(totalProfit.toString())}</p>
            <p className="text-xs text-bitcoin font-medium">BTC</p>
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