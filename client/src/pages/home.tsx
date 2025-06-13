` tags. I will pay close attention to indentation, structure, and completeness, and avoid all forbidden words.

```
<replit_final_file>
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet, 
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Zap,
  Shield,
  Target,
  Crown,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { BottomNavigation } from "@/components/bottom-navigation";
import { BitcoinPrice } from "@/components/bitcoin-price";
import { WalletBalance } from "@/components/wallet-balance";
import { BitcoinSync } from "@/components/bitcoin-sync";

interface Investment {
  id: number;
  planName: string;
  amount: number;
  currentValue: number;
  roi: number;
  status: string;
  startDate: string;
  maturityDate: string;
  profit: number;
}

interface DashboardStats {
  totalInvested: number;
  totalProfit: number;
  totalBalance: number;
  activeInvestments: number;
  portfolioGrowth: number;
}

export default function HomePage() {
  const { user } = useAuth();
  const [animationTrigger, setAnimationTrigger] = useState(0);

  // Trigger animation on mount and periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationTrigger(prev => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const { data: investments, isLoading: investmentsLoading } = useQuery<Investment[]>({
    queryKey: ['/api/investments/user', user?.id],
    queryFn: () => fetch(`/api/investments/user/${user?.id}`).then(res => res.json()),
    enabled: !!user?.id,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats', user?.id],
    queryFn: () => fetch(`/api/dashboard/stats/${user?.id}`).then(res => res.json()),
    enabled: !!user?.id,
  });

  if (investmentsLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="dark-card dark-border shimmer-effect">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-8 bg-muted rounded animate-pulse"></div>
                  <div className="h-3 bg-muted rounded w-3/4 animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with advanced animations */}
      <div className="relative overflow-hidden bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(247,147,26,0.1),transparent_50%)]"></div>
        <div className="relative p-6 pb-20">
          {/* Welcome Header */}
          <div className="mb-8 text-center slide-in-up">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="w-6 h-6 text-gold float-animation" />
              <h1 className="text-2xl font-bold neon-text">Welcome back, {user?.email?.split('@')[0]}!</h1>
              <Sparkles className="w-6 h-6 text-bitcoin float-animation" style={{ animationDelay: '1s' }} />
            </div>
            <p className="text-sm text-muted-foreground">Your Bitcoin investment journey continues</p>
          </div>

          {/* Bitcoin Price Widget */}
          <div className="mb-6 scale-in">
            <BitcoinPrice />
          </div>

          {/* Portfolio Overview */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="dark-card dark-border hover-lift glass-effect">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-bitcoin pulse-glow" />
                  <span className="text-xs text-muted-foreground">Total Balance</span>
                </div>
                <div className="text-lg font-bold text-foreground">
                  ${stats?.totalBalance?.toLocaleString() || '0'}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-emerald" />
                  <span className="text-xs text-emerald">+{stats?.portfolioGrowth || 0}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="dark-card dark-border hover-lift glass-effect">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <PiggyBank className="w-4 h-4 text-emerald pulse-glow" />
                  <span className="text-xs text-muted-foreground">Total Profit</span>
                </div>
                <div className="text-lg font-bold text-emerald">
                  ${stats?.totalProfit?.toLocaleString() || '0'}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 text-gold" />
                  <span className="text-xs text-muted-foreground">{stats?.activeInvestments || 0} active</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Button 
              className="h-16 bg-gradient-to-r from-bitcoin to-bitcoin-dark hover:from-bitcoin-dark hover:to-bitcoin text-white font-semibold shadow-lg hover-glow"
              onClick={() => window.location.href = '/investment'}
            >
              <div className="flex flex-col items-center gap-1">
                <TrendingUp className="w-5 h-5" />
                <span className="text-xs">Invest Now</span>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-16 border-bitcoin/50 hover:border-bitcoin hover:bg-bitcoin/10 font-semibold hover-lift"
              onClick={() => window.location.href = '/deposit'}
            >
              <div className="flex flex-col items-center gap-1">
                <Wallet className="w-5 h-5 text-bitcoin" />
                <span className="text-xs">Deposit</span>
              </div>
            </Button>
          </div>

          {/* Active Investments */}
          {investments && investments.length > 0 && (
            <Card className="dark-card dark-border mb-6 hover-lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4 text-bitcoin" />
                  Active Investments
                  <Badge variant="secondary" className="ml-auto">
                    {investments.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {investments.slice(0, 3).map((investment, index) => (
                  <div 
                    key={investment.id} 
                    className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-300 hover-lift"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-sm text-foreground">{investment.planName}</p>
                        <p className="text-xs text-muted-foreground">
                          Invested: ${investment.amount.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          {investment.profit >= 0 ? (
                            <ArrowUpRight className="w-3 h-3 text-emerald" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3 text-ruby" />
                          )}
                          <span className={`text-xs font-medium ${investment.profit >= 0 ? 'text-emerald' : 'text-ruby'}`}>
                            ${Math.abs(investment.profit).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {investment.roi.toFixed(1)}% ROI
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="text-muted-foreground">{investment.roi.toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={Math.min(investment.roi, 100)} 
                        className="h-1.5"
                      />
                    </div>
                  </div>
                ))}

                {investments.length > 3 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-bitcoin hover:text-bitcoin-dark hover:bg-bitcoin/10"
                    onClick={() => window.location.href = '/investment'}
                  >
                    View All Investments
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Security Badge */}
          <Card className="dark-card dark-border neon-border scale-in">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-emerald pulse-glow" />
                <span className="text-sm font-medium text-foreground">Bank-Level Security</span>
                <Zap className="w-4 h-4 text-bitcoin float-animation" />
              </div>
              <p className="text-xs text-muted-foreground">
                Your investments are protected with military-grade encryption
              </p>
            </CardContent>
          </Card>

          {/* Wallet Components */}
          <div className="mt-6 space-y-4">
            <WalletBalance />
            <BitcoinSync />
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}