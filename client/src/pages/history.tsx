import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BottomNavigation } from "@/components/bottom-navigation";
import { useCurrency } from "@/hooks/use-currency";
import { formatBitcoinAmount } from "@/lib/bitcoin";
import { Clock, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, ArrowLeft, DollarSign } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price";
import { formatBitcoin, formatCurrency, calculateInvestmentProgress, formatDate } from "@/lib/utils";
import type { Investment, Transaction, Notification } from "@shared/schema";
import { useLocation } from "wouter";

export default function History() {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { data: bitcoinPrice } = useBitcoinPrice();

  const { data: investments, isLoading } = useQuery<Investment[]>({
    queryKey: ['/api/investments/user', user?.id],
    queryFn: () => fetch(`/api/investments/user/${user?.id}`).then(res => res.json()),
    enabled: !!user?.id,
  });

  const { data: notifications, isLoading: loadingNotifications } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: () => fetch(`/api/notifications/${user?.id}`).then(res => res.json()),
    enabled: !!user?.id,
  });

  const { data: transactions, isLoading: loadingTransactions } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    enabled: !!user?.id,
  });

  if (!user) {
    return <div>Please log in to view your history</div>;
  }

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
              <h1 className="text-xl font-bold dark-text">History</h1>
              <p className="text-muted-foreground text-sm">Transaction history</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6 pb-20">
        <div className="mb-6">
          <h1 className="text-2xl font-bold dark-text mb-2">Transaction History</h1>
          <p className="text-muted-foreground">Your investment and transaction history</p>
        </div>

        {isLoading || loadingNotifications || loadingTransactions ? (
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
            {/* Display all transactions (deposits, withdrawals, investments) */}
            {transactions && transactions.length > 0 && (
              <div className="space-y-4">
                {transactions.map((transaction) => {
                  const getTransactionIcon = () => {
                    switch (transaction.type) {
                      case 'deposit':
                        return <ArrowDownLeft className="w-5 h-5 text-green-500" />;
                      case 'withdrawal':
                        return <ArrowUpRight className="w-5 h-5 text-red-500" />;
                      case 'investment':
                        return <TrendingUp className="w-5 h-5 text-blue-500" />;
                      default:
                        return <Clock className="w-5 h-5 text-gray-500" />;
                    }
                  };

                  const getStatusBadge = () => {
                    switch (transaction.status) {
                      case 'confirmed':
                        return <Badge variant="default" className="bg-green-500 text-white">Confirmed</Badge>;
                      case 'pending':
                        return <Badge variant="secondary" className="bg-yellow-500 text-white">Pending</Badge>;
                      case 'rejected':
                        return <Badge variant="destructive">Rejected</Badge>;
                      default:
                        return <Badge variant="outline">{transaction.status}</Badge>;
                    }
                  };

                  const currencyPrice = currency === 'USD' ? bitcoinPrice?.usd.price : bitcoinPrice?.gbp.price;
                  const fiatValue = currencyPrice ? parseFloat(transaction.amount) * currencyPrice : 0;

                  return (
                    <Card key={`transaction-${transaction.id}`} className="dark-card dark-border">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getTransactionIcon()}
                            <CardTitle className="text-lg dark-text">
                              {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                            </CardTitle>
                          </div>
                          {getStatusBadge()}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Amount</span>
                            <div className="text-right">
                              <div className="font-semibold dark-text">
                                {formatBitcoin(transaction.amount)} BTC
                              </div>
                              {currencyPrice && (
                                <div className="text-sm text-muted-foreground">
                                  {formatCurrency(fiatValue, currency)}
                                </div>
                              )}
                            </div>
                          </div>

                          {transaction.type === 'withdrawal' && transaction.transactionHash && (
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Address</span>
                              <span className="text-sm dark-text font-mono">
                                {transaction.transactionHash.slice(0, 8)}...{transaction.transactionHash.slice(-8)}
                              </span>
                            </div>
                          )}

                          {transaction.transactionHash && transaction.type !== 'withdrawal' && (
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Transaction Hash</span>
                              <span className="text-sm dark-text font-mono">
                                {transaction.transactionHash.slice(0, 8)}...{transaction.transactionHash.slice(-8)}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Date</span>
                            <span className="text-sm dark-text">{formatDate(new Date(transaction.createdAt))}</span>
                          </div>

                          {transaction.status === 'rejected' && transaction.notes && (
                            <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded">
                              <div className="text-sm text-red-600 dark:text-red-400">
                                <span className="font-medium">Reason: </span>
                                {transaction.notes}
                              </div>
                            </div>
                          )}

                          {transaction.status === 'pending' && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                              <div className="text-sm text-yellow-600 dark:text-yellow-400">
                                Transaction is under review and will be processed shortly
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

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

            {/* Show empty state only if no transactions, investments, or notifications */}
            {(!investments || investments.length === 0) && 
             (!transactions || transactions.length === 0) &&
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