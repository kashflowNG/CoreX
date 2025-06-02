import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ArrowUpRight, ArrowDownLeft, TrendingUp, Bitcoin, Bell } from "lucide-react";
import { formatBitcoin, formatDate, calculateInvestmentProgress } from "@/lib/utils";
import { useCurrency } from "@/hooks/use-currency";
import { formatCurrency } from "@/lib/utils";
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price";
import type { Investment, Notification } from "@shared/schema";

export default function History() {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { data: bitcoinPrice } = useBitcoinPrice();

  const { data: investments, isLoading } = useQuery<Investment[]>({
    queryKey: ['/api/investments/user', user?.id],
    enabled: !!user?.id,
  });

  const { data: notifications, isLoading: loadingNotifications } = useQuery<Notification[]>({
    queryKey: ['/api/notifications', user?.id],
    enabled: !!user?.id,
  });

  if (!user) {
    return <div>Please log in to view your history</div>;
  }

  return (
    <div className="min-h-screen dark-bg">
      <div className="max-w-sm mx-auto p-4 pb-20">
        <div className="mb-6">
          <h1 className="text-2xl font-bold dark-text mb-2">Transaction History</h1>
          <p className="text-muted-foreground">Your investment and transaction history</p>
        </div>

        {isLoading || loadingNotifications ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="dark-card dark-border">
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-2" />
                  <Skeleton className="h-3 w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Bitcoin Transactions from Notifications */}
            {notifications && notifications
              .filter(notif => notif.title.includes("Bitcoin Received") || notif.title.includes("Bitcoin Sent"))
              .map((notification) => {
                const isReceived = notification.title.includes("Bitcoin Received");
                const message = notification.message;
                
                // Extract Bitcoin amount from message
                const amountMatch = message.match(/(\d+\.?\d*) BTC/);
                const amount = amountMatch ? amountMatch[1] : "0";
                
                // Extract transaction ID
                const txMatch = message.match(/Transaction ID: ([a-zA-Z0-9]+)/);
                const txId = txMatch ? txMatch[1] : "";
                
                const currencyPrice = currency === 'USD' ? bitcoinPrice?.usd.price : bitcoinPrice?.gbp.price;
                const fiatValue = currencyPrice ? parseFloat(amount) * currencyPrice : 0;

                return (
                  <Card key={`notif-${notification.id}`} className="dark-card dark-border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isReceived ? (
                            <ArrowDownLeft className="w-5 h-5 text-green-500" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5 text-red-500" />
                          )}
                          <CardTitle className="text-lg dark-text">
                            {isReceived ? "Bitcoin Received" : "Bitcoin Sent"}
                          </CardTitle>
                        </div>
                        <Badge variant={isReceived ? "default" : "secondary"}>
                          {isReceived ? "Received" : "Sent"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Amount</span>
                          <div className="text-right">
                            <div className={`font-semibold ${isReceived ? "text-green-500" : "text-red-500"}`}>
                              {isReceived ? "+" : "-"}{formatBitcoin(amount)} BTC
                            </div>
                            {currencyPrice && (
                              <div className="text-sm text-muted-foreground">
                                {isReceived ? "+" : "-"}{formatCurrency(fiatValue, currency)}
                              </div>
                            )}
                          </div>
                        </div>

                        {txId && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Transaction ID</span>
                            <span className="text-sm dark-text font-mono">{txId}...</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Date</span>
                          <span className="text-sm dark-text">{formatDate(new Date(notification.createdAt))}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Status</span>
                          <Badge variant="default" className="text-xs">Confirmed</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

            {/* Investment History */}
            {investments && investments.length > 0 ? (
              <div className="space-y-4">
                {investments.map((investment) => {
                  const progress = calculateInvestmentProgress(new Date(investment.startDate), new Date(investment.endDate));
                  const currentValue = parseFloat(investment.amount) + parseFloat(investment.currentProfit);
                  const currencyPrice = currency === 'USD' ? bitcoinPrice?.usd.price : bitcoinPrice?.gbp.price;
                  const fiatValue = currencyPrice ? currentValue * currencyPrice : 0;

                  return (
                    <Card key={investment.id} className="dark-card dark-border">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-bitcoin" />
                            <CardTitle className="text-lg dark-text">
                              Investment Plan {investment.planId}
                            </CardTitle>
                          </div>
                          <Badge variant={investment.isActive ? "default" : "secondary"}>
                            {investment.isActive ? "Active" : "Completed"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Investment Amount</span>
                            <div className="text-right">
                              <div className="font-semibold dark-text">{formatBitcoin(investment.amount)} BTC</div>
                              {currencyPrice && (
                                <div className="text-sm text-muted-foreground">
                                  {formatCurrency(parseFloat(investment.amount) * currencyPrice, currency)}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Current Profit</span>
                            <div className="text-right">
                              <div className="font-semibold text-green-500">+{formatBitcoin(investment.currentProfit)} BTC</div>
                              {currencyPrice && (
                                <div className="text-sm text-muted-foreground">
                                  +{formatCurrency(parseFloat(investment.currentProfit) * currencyPrice, currency)}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Total Value</span>
                            <div className="text-right">
                              <div className="font-semibold dark-text">{formatBitcoin(currentValue)} BTC</div>
                              {currencyPrice && (
                                <div className="text-sm text-muted-foreground">
                                  {formatCurrency(fiatValue, currency)}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Start Date</span>
                            <span className="text-sm dark-text">{formatDate(new Date(investment.startDate))}</span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">End Date</span>
                            <span className="text-sm dark-text">{formatDate(new Date(investment.endDate))}</span>
                          </div>

                          {investment.isActive && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="dark-text">{progress.toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-secondary rounded-full h-2">
                                <div 
                                  className="bg-bitcoin h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : null}

            {/* Show empty state only if no transactions or investments */}
            {(!investments || investments.length === 0) && 
             (!notifications || notifications.filter(n => n.title.includes("Bitcoin")).length === 0) && (
              <Card className="dark-card dark-border">
                <CardContent className="p-8 text-center">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold dark-text mb-2">No Transaction History</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't made any transactions or investments yet. Start investing or receive Bitcoin to see your history here.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}