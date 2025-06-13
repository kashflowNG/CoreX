
import { useAuth } from "@/hooks/use-auth";
import { WalletBalance } from "@/components/wallet-balance";
import { BitcoinPrice } from "@/components/bitcoin-price";
import { BitcoinSync } from "@/components/bitcoin-sync";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, User, ArrowUpRight, ArrowDownLeft, TrendingUp, Activity, Wallet, Target, BarChart3, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Investment, InvestmentPlan } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { formatBitcoin, calculateInvestmentProgress, formatDate } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const currentPlan = user?.currentPlanId 
    ? investmentPlans?.find(plan => plan.id === user.currentPlanId)
    : null;

  const handleRefreshBalance = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background">
      <div className="max-w-md mx-auto relative">
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-bitcoin to-gold flex items-center justify-center shadow-lg">
                    <span className="text-black text-xl font-bold">₿</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-bitcoin via-gold to-bitcoin bg-clip-text text-transparent">
                    CoreX
                  </h1>
                  <p className="text-sm text-muted-foreground font-medium">
                    Welcome back, {user.email.split('@')[0]}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative h-10 w-10 rounded-xl hover:bg-primary/10 transition-all duration-300" 
                  onClick={() => setLocation('/notifications')}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount && unreadCount.count > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center bg-ruby animate-pulse">
                      {unreadCount.count > 9 ? '9+' : unreadCount.count}
                    </Badge>
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all duration-300" 
                  onClick={() => setLocation('/profile')}
                >
                  <User className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-6 pb-24 space-y-8">
          {/* Wallet Balance Section */}
          <section className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Wallet Balance</h2>
                <p className="text-sm text-muted-foreground">Your Bitcoin holdings</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefreshBalance}
                disabled={isRefreshing}
                className="h-9 w-9 rounded-xl hover:bg-primary/10 transition-all duration-300"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <WalletBalance />
          </section>

          {/* Market Data */}
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-foreground">Market Overview</h2>
              <p className="text-sm text-muted-foreground">Real-time Bitcoin price</p>
            </div>
            <BitcoinPrice />
            <div className="mt-4">
              <BitcoinSync />
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground">Quick Actions</h2>
              <p className="text-sm text-muted-foreground">Manage your Bitcoin</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card 
                className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-ruby/20 border-border/50 hover:border-ruby/30"
                onClick={() => setLocation('/withdraw')}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-ruby/20 to-ruby/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <ArrowUpRight className="w-7 h-7 text-ruby" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Withdraw</h3>
                  <p className="text-xs text-muted-foreground">Send Bitcoin</p>
                </CardContent>
              </Card>
              
              <Card 
                className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-emerald/20 border-border/50 hover:border-emerald/30"
                onClick={() => setLocation('/deposit')}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald/20 to-emerald/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <ArrowDownLeft className="w-7 h-7 text-emerald" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Deposit</h3>
                  <p className="text-xs text-muted-foreground">Receive Bitcoin</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Investment Plan */}
          <section>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground">Investment Plan</h2>
              <p className="text-sm text-muted-foreground">Your current subscription</p>
            </div>
            <Card className="border-border/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      currentPlan 
                        ? 'bg-gradient-to-br from-emerald/20 to-emerald/10' 
                        : 'bg-gradient-to-br from-sapphire/20 to-sapphire/10'
                    }`}>
                      <TrendingUp className={`w-6 h-6 ${
                        currentPlan ? 'text-emerald' : 'text-sapphire'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">
                        {currentPlan ? currentPlan.name : "Free Plan"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {currentPlan 
                          ? `${(parseFloat(currentPlan.dailyReturnRate) * 100).toFixed(2)}% daily return`
                          : "3.67% every 10 minutes"
                        }
                      </p>
                    </div>
                  </div>
                  <Badge variant={currentPlan ? "default" : "secondary"} className="px-3 py-1">
                    {currentPlan ? 'Premium' : 'Free'}
                  </Badge>
                </div>
                {!currentPlan && (
                  <Button 
                    className="w-full bg-gradient-to-r from-bitcoin to-gold hover:from-bitcoin/90 hover:to-gold/90 text-black font-semibold"
                    onClick={() => setLocation('/investment')}
                  >
                    Upgrade to Premium
                  </Button>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Portfolio Overview */}
          <section>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground">Portfolio Overview</h2>
              <p className="text-sm text-muted-foreground">Your investment statistics</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-border/50 hover:shadow-lg hover:shadow-emerald/10 transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald/20 to-emerald/10 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-emerald" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground font-medium">Total Invested</p>
                      <p className="text-lg font-bold text-foreground">{formatBitcoin(totalInvestedAmount.toString())}</p>
                    </div>
                  </div>
                  <p className="text-xs text-bitcoin font-medium">BTC</p>
                </CardContent>
              </Card>

              <Card className="border-border/50 hover:shadow-lg hover:shadow-bitcoin/10 transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-bitcoin/20 to-bitcoin/10 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-bitcoin" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground font-medium">Total Profit</p>
                      <p className="text-lg font-bold text-emerald">+{formatBitcoin(totalProfit.toString())}</p>
                    </div>
                  </div>
                  <p className="text-xs text-bitcoin font-medium">BTC</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Active Investments */}
          {activeInvestments.length > 0 && (
            <section>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground">Active Investments</h2>
                <p className="text-sm text-muted-foreground">{activeInvestments.length} active position{activeInvestments.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="space-y-4">
                {activeInvestments.slice(0, 3).map((investment) => {
                  const progress = calculateInvestmentProgress(
                    new Date(investment.startDate),
                    new Date(investment.endDate)
                  );
                  const daysLeft = Math.ceil(
                    (new Date(investment.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <Card key={investment.id} className="border-border/50 hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
                              <Target className="w-5 h-5 text-gold" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">Investment #{investment.id}</h4>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(new Date(investment.startDate))}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-emerald/20 text-emerald border-emerald/30">
                            Active
                          </Badge>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Invested</span>
                            <span className="font-medium">{formatBitcoin(investment.amount)} BTC</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Current Profit</span>
                            <span className="font-medium text-emerald">+{formatBitcoin(investment.currentProfit)} BTC</span>
                          </div>
                          <div className="space-y-2">
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                              <Clock className="w-3 h-3" />
                              {daysLeft > 0 ? `${daysLeft} days remaining` : 'Completed'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {activeInvestments.length > 3 && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setLocation('/investment')}
                  >
                    View All Investments ({activeInvestments.length})
                  </Button>
                )}
              </div>
            </section>
          )}
        </main>

        {/* Bottom Navigation */}
        <BottomNavigation />
      </div>
    </div>
  );
}
