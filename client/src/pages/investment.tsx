import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { InvestmentPlans } from "@/components/investment-plans";
import { BottomNavigation } from "@/components/bottom-navigation";
import type { Investment, InvestmentPlan, Transaction } from "@shared/schema";
import { formatBitcoin, calculateInvestmentProgress, formatDate } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCurrency } from "@/hooks/use-currency";
import { formatBitcoinAmount } from "@/lib/bitcoin";
import { TrendingUp, Target, Clock, Award, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function Investment() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    setLocation('/login');
    return null;
  }

  const { data: investments } = useQuery<Investment[]>({
    queryKey: ['/api/investments/user', user.id],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: plans } = useQuery<InvestmentPlan[]>({
    queryKey: ['/api/investment-plans'],
  });

  const { data: transactions } = useQuery<any[]>({
    queryKey: ['/api/transactions'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getPlanName = (planId: number) => {
    return plans?.find(plan => plan.id === planId)?.name || `Plan ${planId}`;
  };

  const activeInvestments = investments?.filter(inv => inv.isActive) || [];
  const completedInvestments = investments?.filter(inv => !inv.isActive) || [];
  const pendingInvestments = transactions?.filter(tx => tx.type === 'investment' && tx.status === 'pending') || [];
  const rejectedInvestments = transactions?.filter(tx => tx.type === 'investment' && tx.status === 'rejected') || [];

  return (
    <div className="min-h-screen dark-bg">
      {/* Navigation Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b dark-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold dark-text">Investment</h1>
              <p className="text-muted-foreground text-sm">Grow your Bitcoin</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6 pb-20">
        {/* Investment Plans */}
        <InvestmentPlans />

        {/* Pending Investments */}
        {pendingInvestments.length > 0 && (
          <div className="px-4 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Pending Investments</h3>
            <div className="space-y-3">
              {pendingInvestments.map((transaction) => (
                <Card key={transaction.id} className="dark-card rounded-xl p-4 dark-border">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-orange-400">{getPlanName(transaction.planId || 1)}</h4>
                      <p className="text-muted-foreground text-sm">
                        Submitted: {formatDate(new Date(transaction.createdAt))}
                      </p>
                    </div>
                    <span className="bg-orange-500 bg-opacity-20 text-orange-400 px-2 py-1 rounded-full text-xs">
                      Pending
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="text-foreground">{formatBitcoin(transaction.amount)} BTC</span>
                    </div>
                    {transaction.transactionHash && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Transaction Hash</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {transaction.transactionHash.substring(0, 8)}...{transaction.transactionHash.substring(-8)}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Your investment is under review and will be activated once verified and confirmed.
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Rejected Investments */}
        {rejectedInvestments.length > 0 && (
          <div className="px-4 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Rejected Investments</h3>
            <div className="space-y-3">
              {rejectedInvestments.map((transaction) => (
                <Card key={transaction.id} className="dark-card rounded-xl p-4 dark-border opacity-75">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-red-400">{getPlanName(transaction.planId || 1)}</h4>
                      <p className="text-muted-foreground text-sm">
                        Rejected: {transaction.confirmedAt ? formatDate(new Date(transaction.confirmedAt)) : 'Recently'}
                      </p>
                    </div>
                    <span className="bg-red-500 bg-opacity-20 text-red-400 px-2 py-1 rounded-full text-xs">
                      Rejected
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="text-foreground">{formatBitcoin(transaction.amount)} BTC</span>
                    </div>
                    {transaction.notes && (
                      <div className="bg-red-500 bg-opacity-10 p-2 rounded text-sm">
                        <span className="text-red-400 font-medium">Reason: </span>
                        <span className="text-muted-foreground">{transaction.notes}</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

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