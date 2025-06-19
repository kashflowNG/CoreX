import { useAuth } from "@/hooks/use-auth";
import { WalletBalance } from "@/components/wallet-balance";
import { BitcoinPrice } from "@/components/bitcoin-price";
import { BitcoinSync } from "@/components/bitcoin-sync";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, User, ArrowUpRight, ArrowDownLeft, TrendingUp, Activity, Target, Award, Briefcase, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Investment, InvestmentPlan } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { formatBitcoin, calculateInvestmentProgress, formatDate } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function Home() {
  const { user, logout, refreshUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

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

    // Redirect to wallet setup if user doesn't have a wallet
    if (!user.hasWallet) {
      setLocation('/wallet-setup');
    }
  }, [user, setLocation]);

  if (!user) {
    setLocation('/login');
    return null;
  }

  const handleRefreshBalance = async () => {
    if (!user) return;

    setIsRefreshing(true);
    try {
      // Sync balance with blockchain
      const response = await fetch(`/api/bitcoin/sync-balance/${user.id}`, {
        method: 'POST'
      });

      if (response.ok) {
        await refreshUser();
        toast({
          title: "Balance Updated",
          description: "Your balance has been synced with the blockchain",
        });
      } else {
        throw new Error('Failed to sync balance');
      }
    } catch (error) {
      console.error('Balance refresh error:', error);
      toast({
        title: "Sync Failed",
        description: "Could not sync balance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshUser();
      toast({
        title: "Refreshed",
        description: "Your data has been updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const activeInvestments = investments?.filter(inv => inv.isActive === true) || [];
  const completedInvestments = investments?.filter(inv => inv.isActive === false) || [];

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

  const totalInvested = investments?.reduce((sum, inv) => sum + parseFloat(inv.amount), 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      {/* Professional Header */}
      <div className="bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-sm border-b border-gray-700/50">
        <div className="max-w-sm mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Portfolio</h1>
              <p className="text-sm text-gray-300">Welcome back, {user.email.split('@')[0]}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-gray-300 hover:text-white hover:bg-white/10 h-10 w-10"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Link href="/notifications">
                <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-white/10 h-10 w-10">
                  <Bell className="w-5 h-5" />
                  {unreadCount && unreadCount.count > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 text-xs p-0 flex items-center justify-center animate-pulse glow-ruby">
                      {unreadCount.count > 9 ? '9+' : unreadCount.count}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-white/10 h-10 w-10">
                  <User className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-sm mx-auto p-6 space-y-6 pb-24">
        {/* Wallet Balance */}
        <WalletBalance />

        {/* Bitcoin Price */}
        <BitcoinPrice />

        {/* Bitcoin Sync */}
        <div className="px-4 mb-6">
          <BitcoinSync />
        </div>

        {/* Portfolio Overview */}
        <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Briefcase className="w-5 h-5 text-bitcoin" />
              Investment Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <Activity className="w-6 h-6 mx-auto mb-2 text-green-400" />
                <p className="text-2xl font-bold text-green-400">{activeInvestments.length}</p>
                <p className="text-xs text-gray-300">Active Plans</p>
              </div>
              <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <TrendingUp className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                <p className="text-2xl font-bold text-blue-400">+{formatBitcoin(totalProfit.toString())}</p>
                <p className="text-xs text-gray-300">Total Profit (BTC)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Daily Yield</span>
                  <span className="text-green-400 font-medium">3.67%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Monthly ROI</span>
                  <span className="text-bitcoin font-medium">110.1%</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Risk Level</span>
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">Low</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Next Profit</span>
                  <span className="text-blue-400 font-medium">8 min</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Investments */}
        {activeInvestments.length > 0 && (
          <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-400" />
                  Active Investments
                </div>
                <Link href="/investment">
                  <Button variant="ghost" size="sm" className="text-bitcoin hover:text-white">
                    View All
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeInvestments.slice(0, 2).map((investment) => {
                  const plan = investmentPlans?.find(p => p.id === investment.planId);
                  const progress = calculateInvestmentProgress(
                    new Date(investment.startDate),
                    new Date(investment.endDate)
                  );

                  return (
                    <div key={investment.id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/30">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-white">{plan?.name || `Plan ${investment.planId}`}</h4>
                          <p className="text-sm text-gray-400">{formatBitcoin(investment.amount)} BTC</p>
                        </div>
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                          +{formatBitcoin(investment.currentProfit)} BTC
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Progress</span>
                          <span>{progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/investment">
            <Button className="w-full h-12 bg-gradient-to-r from-bitcoin to-orange-500 hover:from-bitcoin/90 hover:to-orange-500/90 text-white border-0">
              <TrendingUp className="w-4 h-4 mr-2" />
              Invest
            </Button>
          </Link>
          <Link href="/history">
            <Button variant="outline" className="w-full h-12 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
              <Activity className="w-4 h-4 mr-2" />
              History
            </Button>
          </Link>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}