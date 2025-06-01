import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { InvestmentPlans } from "@/components/investment-plans";
import { BottomNavigation } from "@/components/bottom-navigation";
import type { Investment, InvestmentPlan } from "@shared/schema";
import { formatBitcoin, calculateInvestmentProgress, formatDate } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";

export default function Investment() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    setLocation('/login');
    return null;
  }

  const { data: investments } = useQuery<Investment[]>({
    queryKey: ['/api/investments/user', user.id],
  });

  const { data: plans } = useQuery<InvestmentPlan[]>({
    queryKey: ['/api/investment-plans'],
  });

  const getPlanName = (planId: number) => {
    return plans?.find(plan => plan.id === planId)?.name || `Plan ${planId}`;
  };

  const activeInvestments = investments?.filter(inv => inv.isActive) || [];
  const completedInvestments = investments?.filter(inv => !inv.isActive) || [];

  return (
    <div className="max-w-sm mx-auto bg-background min-h-screen relative">
      {/* Header */}
      <header className="px-4 py-6 border-b dark-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-bitcoin flex items-center justify-center">
            <span className="text-black text-sm font-bold">₿</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Investment</h1>
            <p className="text-xs text-muted-foreground">Grow your Bitcoin</p>
          </div>
        </div>
      </header>

      <div className="pb-20">
        {/* Investment Plans */}
        <InvestmentPlans />

        {/* Active Investments */}
        {activeInvestments.length > 0 && (
          <div className="px-4 mb-6">
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
                        <h4 className="font-semibold text-gold">{getPlanName(investment.planId)}</h4>
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

        {/* Completed Investments */}
        {completedInvestments.length > 0 && (
          <div className="px-4 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Completed Investments</h3>
            <div className="space-y-3">
              {completedInvestments.map((investment) => (
                <Card key={investment.id} className="dark-card rounded-xl p-4 dark-border opacity-75">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-muted-foreground">{getPlanName(investment.planId)}</h4>
                      <p className="text-muted-foreground text-sm">
                        Completed: {formatDate(new Date(investment.endDate))}
                      </p>
                    </div>
                    <span className="bg-gray-500 bg-opacity-20 text-gray-400 px-2 py-1 rounded-full text-xs">
                      Completed
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Invested</span>
                      <span className="text-foreground">{formatBitcoin(investment.amount)} BTC</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Final Profit</span>
                      <span className="text-green-400">+{formatBitcoin(investment.currentProfit)} BTC</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!investments || investments.length === 0) && (
          <div className="px-4 text-center py-8">
            <div className="text-muted-foreground">
              <p className="text-lg mb-2">No investments yet</p>
              <p className="text-sm">Choose an investment plan above to get started</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
