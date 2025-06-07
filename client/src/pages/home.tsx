
import { useAuth } from "@/hooks/use-auth";
import { WalletBalance } from "@/components/wallet-balance";
import { BitcoinPrice } from "@/components/bitcoin-price";
import { BitcoinSync } from "@/components/bitcoin-sync";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bell, User, ArrowUpRight, ArrowDownLeft, TrendingUp, Activity, Zap, Shield, Star, Gift, Eye, EyeOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Investment, InvestmentPlan } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { formatBitcoin, calculateInvestmentProgress, formatDate } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

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
            <p className="text-lg font-bold text-foreground">{formatBitcoin(totalInvestedAmount.toString())} BTC</p>
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
}</old_str>
<new_str>import { useAuth } from "@/hooks/use-auth";
import { WalletBalance } from "@/components/wallet-balance";
import { BitcoinPrice } from "@/components/bitcoin-price";
import { BitcoinSync } from "@/components/bitcoin-sync";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bell, User, ArrowUpRight, ArrowDownLeft, TrendingUp, Activity, Zap, Shield, Star, Gift, Eye, EyeOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Investment, InvestmentPlan } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { formatBitcoin, calculateInvestmentProgress, formatDate } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

export default function Home() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [showBalance, setShowBalance] = useState(true);

  const { data: investments } = useQuery<Investment[]>({
    queryKey: ['/api/investments/user', user?.id],
    enabled: !!user?.id,
    refetchInterval: 30000,
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

    if (!user.hasWallet) {
      setLocation('/wallet-setup');
    }
  }, [user, setLocation]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bitcoin"></div>
      </div>
    );
  }

  const activeInvestments = investments?.filter(inv => inv.isActive) || [];
  const totalInvestedAmount = investments?.reduce((total, inv) => total + parseFloat(inv.amount), 0) || 0;
  const totalProfit = investments?.reduce((total, inv) => total + parseFloat(inv.currentProfit), 0) || 0;
  const currentPlan = user?.currentPlanId ? investmentPlans?.find(plan => plan.id === user.currentPlanId) : null;

  return (
    <div className="max-w-sm mx-auto min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-black opacity-50"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-bitcoin/10 via-transparent to-transparent"></div>
      
      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-bitcoin/20 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute top-60 right-10 w-16 h-16 bg-purple-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
      <div className="absolute bottom-40 left-5 w-12 h-12 bg-blue-500/20 rounded-full blur-xl animate-pulse delay-2000"></div>

      <div className="relative z-10">
        {/* Enhanced Header */}
        <header className="px-6 py-6 backdrop-blur-xl bg-black/20 border-b border-white/10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-bitcoin to-yellow-400 flex items-center justify-center shadow-lg shadow-bitcoin/25">
                  <span className="text-black text-lg font-bold">₿</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-black animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">CoreX</h1>
                <p className="text-xs text-gray-400 font-medium">{user.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative rounded-2xl backdrop-blur-sm bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-300"
                onClick={() => setLocation('/notifications')}
              >
                <Bell className="w-5 h-5 text-white" />
                {unreadCount && unreadCount.count > 0 && (
                  <div className="absolute -top-1 -right-1">
                    <Badge className="h-6 w-6 p-0 text-xs bg-red-500 border-0 animate-bounce">
                      {unreadCount.count > 9 ? '9+' : unreadCount.count}
                    </Badge>
                  </div>
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-2xl backdrop-blur-sm bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-300"
                onClick={() => setLocation('/profile')}
              >
                <User className="w-5 h-5 text-white" />
              </Button>
            </div>
          </div>
        </header>

        {/* Enhanced Wallet Balance Card */}
        <div className="px-6 py-6">
          <Card className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Balance</p>
                  <div className="flex items-center gap-3 mt-2">
                    {showBalance ? (
                      <h2 className="text-3xl font-bold text-white">
                        {user.bitcoinBalance ? formatBitcoin(user.bitcoinBalance) : '0.00000000'} BTC
                      </h2>
                    ) : (
                      <h2 className="text-3xl font-bold text-white">••••••••</h2>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-xl hover:bg-white/10"
                      onClick={() => setShowBalance(!showBalance)}
                    >
                      {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-green-400 text-sm font-medium">
                    <TrendingUp className="w-4 h-4" />
                    +12.5%
                  </div>
                  <p className="text-gray-400 text-xs">24h change</p>
                </div>
              </div>
              
              {/* Enhanced Bitcoin Price Display */}
              <div className="bg-black/20 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                <BitcoinPrice />
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions with Enhanced Design */}
        <div className="px-6 mb-6">
          <div className="grid grid-cols-4 gap-3">
            <Button 
              className="h-20 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 hover:border-green-400 transition-all duration-300 flex flex-col items-center gap-2 group"
              onClick={() => setLocation('/deposit')}
            >
              <div className="p-2 rounded-xl bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                <ArrowDownLeft className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-xs text-green-400 font-medium">Deposit</span>
            </Button>
            
            <Button 
              className="h-20 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 hover:border-red-400 transition-all duration-300 flex flex-col items-center gap-2 group"
              onClick={() => setLocation('/withdraw')}
            >
              <div className="p-2 rounded-xl bg-red-500/20 group-hover:bg-red-500/30 transition-colors">
                <ArrowUpRight className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-xs text-red-400 font-medium">Withdraw</span>
            </Button>
            
            <Button 
              className="h-20 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-bitcoin/20 to-yellow-600/10 border border-bitcoin/30 hover:border-bitcoin transition-all duration-300 flex flex-col items-center gap-2 group"
              onClick={() => setLocation('/investment')}
            >
              <div className="p-2 rounded-xl bg-bitcoin/20 group-hover:bg-bitcoin/30 transition-colors">
                <Zap className="w-5 h-5 text-bitcoin" />
              </div>
              <span className="text-xs text-bitcoin font-medium">Invest</span>
            </Button>
            
            <Button 
              className="h-20 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 hover:border-purple-400 transition-all duration-300 flex flex-col items-center gap-2 group"
              onClick={() => setLocation('/history')}
            >
              <div className="p-2 rounded-xl bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-xs text-purple-400 font-medium">History</span>
            </Button>
          </div>
        </div>

        {/* Enhanced Current Plan Card */}
        <div className="px-6 mb-6">
          <Card className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-bitcoin to-yellow-400">
                    <Star className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {currentPlan ? currentPlan.name : "Free Plan"}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {currentPlan 
                        ? `${(parseFloat(currentPlan.dailyReturnRate) * 100).toFixed(2)}% daily return`
                        : "3.67% every 10 minutes"
                      }
                    </p>
                  </div>
                </div>
                <Badge 
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    currentPlan 
                      ? 'bg-gradient-to-r from-green-500 to-green-400 text-black' 
                      : 'bg-gradient-to-r from-blue-500 to-blue-400 text-white'
                  }`}
                >
                  {currentPlan ? 'Premium' : 'Free'}
                </Badge>
              </div>
              
              {!currentPlan && (
                <Button 
                  className="w-full rounded-2xl bg-gradient-to-r from-bitcoin to-yellow-400 text-black font-semibold hover:shadow-lg hover:shadow-bitcoin/25 transition-all duration-300"
                  onClick={() => setLocation('/investment')}
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Upgrade to Premium
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Enhanced Portfolio Overview */}
        <div className="px-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <Card className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-green-500/20">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-sm text-gray-400 font-medium">Invested</span>
              </div>
              <p className="text-xl font-bold text-white">{formatBitcoin(totalInvestedAmount.toString())} BTC</p>
            </Card>

            <Card className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-bitcoin/20">
                  <Activity className="w-4 h-4 text-bitcoin" />
                </div>
                <span className="text-sm text-gray-400 font-medium">Profit</span>
              </div>
              <p className="text-xl font-bold text-green-400">+{formatBitcoin(totalProfit.toString())} BTC</p>
            </Card>
          </div>
        </div>

        {/* Bitcoin Sync with Enhanced Style */}
        <div className="px-6 mb-6">
          <Card className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl">
            <div className="p-4">
              <BitcoinSync />
            </div>
          </Card>
        </div>

        {/* Enhanced Active Investments */}
        {activeInvestments.length > 0 && (
          <div className="px-6 mb-24">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-bitcoin" />
              Active Investments
            </h3>
            <div className="space-y-4">
              {activeInvestments.map((investment) => {
                const progress = calculateInvestmentProgress(
                  new Date(investment.startDate),
                  new Date(investment.endDate)
                );
                const daysLeft = Math.ceil(
                  (new Date(investment.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );

                return (
                  <Card key={investment.id} className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl overflow-hidden">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-bitcoin text-lg">Investment #{investment.id}</h4>
                          <p className="text-gray-400 text-sm">
                            Started: {formatDate(new Date(investment.startDate))}
                          </p>
                        </div>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1 rounded-full">
                          Active
                        </Badge>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">Invested Amount</span>
                          <span className="text-white font-semibold">{formatBitcoin(investment.amount)} BTC</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">Current Profit</span>
                          <span className="text-green-400 font-semibold">+{formatBitcoin(investment.currentProfit)} BTC</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Progress</span>
                          <span className="text-white">{progress.toFixed(1)}%</span>
                        </div>
                        <Progress 
                          value={progress} 
                          className="w-full h-2 bg-white/10" 
                        />
                        <p className="text-xs text-gray-400 text-center">
                          {daysLeft > 0 ? `${daysLeft} days remaining` : 'Completed'}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom spacing for navigation */}
        <div className="h-24"></div>
      </div>

      {/* Enhanced Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}</new_str>
