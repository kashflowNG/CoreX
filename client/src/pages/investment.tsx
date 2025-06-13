
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Target,
  Shield,
  Zap,
  Star,
  Crown,
  Sparkles,
  Calculator,
  ChartBar,
  Award,
  Rocket
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BottomNavigation } from "@/components/bottom-navigation";
import { BitcoinPrice } from "@/components/bitcoin-price";

interface InvestmentPlan {
  id: number;
  name: string;
  minAmount: number;
  maxAmount: number;
  dailyReturn: number;
  duration: number;
  description: string;
  features: string[];
  riskLevel: 'low' | 'medium' | 'high';
  popular?: boolean;
  premium?: boolean;
}

interface UserInvestment {
  id: number;
  planId: number;
  planName: string;
  amount: number;
  currentValue: number;
  roi: number;
  status: string;
  startDate: string;
  maturityDate: string;
  dailyReturn: number;
  totalReturn: number;
}

export default function InvestmentPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorAmount, setCalculatorAmount] = useState('1000');
  const [calculatorDays, setCalculatorDays] = useState('30');

  const { data: plans, isLoading: plansLoading } = useQuery<InvestmentPlan[]>({
    queryKey: ['/api/investment-plans'],
    queryFn: () => fetch('/api/investment-plans').then(res => res.json()),
  });

  const { data: userInvestments, isLoading: investmentsLoading } = useQuery<UserInvestment[]>({
    queryKey: ['/api/investments/user', user?.id],
    queryFn: () => fetch(`/api/investments/user/${user?.id}`).then(res => res.json()),
    enabled: !!user?.id,
  });

  const investMutation = useMutation({
    mutationFn: async (data: { planId: number; amount: number }) => {
      const response = await fetch('/api/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Investment failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Investment Successful! 🚀",
        description: "Your Bitcoin investment has been activated.",
        className: "border-emerald bg-emerald/10",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/investments/user'] });
      setSelectedPlan(null);
      setInvestmentAmount('');
    },
    onError: (error: any) => {
      toast({
        title: "Investment Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-emerald';
      case 'medium': return 'text-bitcoin';
      case 'high': return 'text-ruby';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskBadgeVariant = (risk: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (risk) {
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      default: return 'outline';
    }
  };

  const calculatePotentialReturn = (amount: number, dailyReturn: number, days: number) => {
    const daily = (dailyReturn / 100) * amount;
    return daily * days;
  };

  const handleInvestment = () => {
    if (!selectedPlan || !investmentAmount) return;
    
    const amount = parseFloat(investmentAmount);
    if (amount < selectedPlan.minAmount || amount > selectedPlan.maxAmount) {
      toast({
        title: "Invalid Amount",
        description: `Amount must be between $${selectedPlan.minAmount.toLocaleString()} and $${selectedPlan.maxAmount.toLocaleString()}`,
        variant: "destructive",
      });
      return;
    }

    investMutation.mutate({ planId: selectedPlan.id, amount });
  };

  if (plansLoading || investmentsLoading) {
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
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="slide-in-up">
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Rocket className="w-6 h-6 text-bitcoin float-animation" />
              Investment Plans
              <Sparkles className="w-5 h-5 text-gold float-animation" style={{ animationDelay: '0.5s' }} />
            </h1>
            <p className="text-sm text-muted-foreground">Choose your Bitcoin investment strategy</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCalculator(!showCalculator)}
            className="hover-lift border-bitcoin/50 hover:border-bitcoin"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Calculator
          </Button>
        </div>
        
        <BitcoinPrice />
      </div>

      <div className="p-4 space-y-6">
        {/* Profit Calculator */}
        {showCalculator && (
          <Card className="dark-card dark-border neon-border scale-in">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Calculator className="w-4 h-4 text-bitcoin" />
                Profit Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="calc-amount" className="text-xs">Investment Amount ($)</Label>
                  <Input
                    id="calc-amount"
                    value={calculatorAmount}
                    onChange={(e) => setCalculatorAmount(e.target.value)}
                    type="number"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="calc-days" className="text-xs">Duration (Days)</Label>
                  <Input
                    id="calc-days"
                    value={calculatorDays}
                    onChange={(e) => setCalculatorDays(e.target.value)}
                    type="number"
                    className="mt-1"
                  />
                </div>
              </div>
              
              {plans && (
                <div className="space-y-2">
                  {plans.slice(0, 3).map((plan) => {
                    const amount = parseFloat(calculatorAmount) || 0;
                    const days = parseInt(calculatorDays) || 0;
                    const potential = calculatePotentialReturn(amount, plan.dailyReturn, days);
                    
                    return (
                      <div key={plan.id} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                        <span className="text-xs font-medium">{plan.name}</span>
                        <span className="text-xs text-emerald font-bold">
                          +${potential.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Active Investments Summary */}
        {userInvestments && userInvestments.length > 0 && (
          <Card className="dark-card dark-border hover-lift glass-effect">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <ChartBar className="w-4 h-4 text-bitcoin pulse-glow" />
                Your Active Investments
                <Badge variant="secondary" className="ml-auto">
                  {userInvestments.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total Invested</p>
                  <p className="text-lg font-bold text-foreground">
                    ${userInvestments.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total Returns</p>
                  <p className="text-lg font-bold text-emerald">
                    +${userInvestments.reduce((sum, inv) => sum + inv.totalReturn, 0).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                {userInvestments.slice(0, 2).map((investment, index) => (
                  <div 
                    key={investment.id}
                    className="flex justify-between items-center p-2 bg-muted/30 rounded hover-lift"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div>
                      <p className="font-medium text-xs">{investment.planName}</p>
                      <p className="text-xs text-muted-foreground">${investment.amount.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-emerald">+{investment.roi.toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">{investment.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Investment Plans */}
        <div className="space-y-4">
          {plans?.map((plan, index) => (
            <Card 
              key={plan.id} 
              className={`dark-card dark-border hover-lift transition-all duration-300 ${
                plan.popular ? 'neon-border' : ''
              } ${plan.premium ? 'border-gold' : ''} ${
                selectedPlan?.id === plan.id ? 'ring-2 ring-bitcoin' : ''
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    {plan.premium && <Crown className="w-4 h-4 text-gold" />}
                    {plan.name}
                    {plan.popular && <Star className="w-4 h-4 text-bitcoin pulse-glow" />}
                  </CardTitle>
                  <div className="flex gap-2">
                    {plan.popular && (
                      <Badge className="bg-bitcoin text-white">Popular</Badge>
                    )}
                    {plan.premium && (
                      <Badge className="bg-gold text-black">Premium</Badge>
                    )}
                    <Badge variant={getRiskBadgeVariant(plan.riskLevel)}>
                      {plan.riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{plan.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 bg-muted/30 rounded">
                    <TrendingUp className="w-4 h-4 text-emerald mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Daily Return</p>
                    <p className="font-bold text-emerald">{plan.dailyReturn}%</p>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded">
                    <Clock className="w-4 h-4 text-bitcoin mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-bold text-foreground">{plan.duration} days</p>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded">
                    <Target className="w-4 h-4 text-sapphire mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Total ROI</p>
                    <p className="font-bold text-sapphire">{(plan.dailyReturn * plan.duration).toFixed(1)}%</p>
                  </div>
                </div>

                {/* Investment Range */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Investment Range</span>
                    <span className="font-medium text-foreground">
                      ${plan.minAmount.toLocaleString()} - ${plan.maxAmount.toLocaleString()}
                    </span>
                  </div>
                  <Progress 
                    value={75} 
                    className="h-1.5"
                  />
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground">Plan Features:</p>
                  <div className="grid grid-cols-1 gap-1">
                    {plan.features?.slice(0, 3).map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <Shield className="w-3 h-3 text-emerald" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Investment Input */}
                {selectedPlan?.id === plan.id && (
                  <div className="space-y-3 scale-in">
                    <Label htmlFor="investment-amount" className="text-xs font-medium">
                      Investment Amount ($)
                    </Label>
                    <Input
                      id="investment-amount"
                      type="number"
                      value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(e.target.value)}
                      placeholder={`Min: $${plan.minAmount.toLocaleString()}`}
                      className="text-center text-lg font-bold"
                    />
                    
                    {investmentAmount && (
                      <div className="p-3 bg-emerald/10 border border-emerald/20 rounded-lg">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">Daily Profit</p>
                            <p className="font-bold text-emerald">
                              ${((parseFloat(investmentAmount) * plan.dailyReturn) / 100).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total Profit</p>
                            <p className="font-bold text-emerald">
                              ${((parseFloat(investmentAmount) * plan.dailyReturn * plan.duration) / 100).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedPlan(null)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleInvestment}
                        disabled={investMutation.isPending}
                        className="flex-1 bg-gradient-to-r from-bitcoin to-bitcoin-dark hover:from-bitcoin-dark hover:to-bitcoin text-white"
                      >
                        {investMutation.isPending ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            Investing...
                          </div>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Invest Now
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Select Plan Button */}
                {selectedPlan?.id !== plan.id && (
                  <Button
                    onClick={() => setSelectedPlan(plan)}
                    className="w-full bg-gradient-to-r from-bitcoin to-bitcoin-dark hover:from-bitcoin-dark hover:to-bitcoin text-white hover-glow"
                  >
                    <Award className="w-4 h-4 mr-2" />
                    Select Plan
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
