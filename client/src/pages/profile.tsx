import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Copy, User, Bitcoin, ExternalLink, Shield, ArrowLeft, TrendingUp, Activity, Calendar, Mail, Award, Wallet, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useCurrency } from "@/hooks/use-currency";
import { formatBitcoin, formatCurrency } from "@/lib/utils";
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price";
import { useQuery } from "@tanstack/react-query";
import type { Investment, Transaction } from "@shared/schema";
import { ProtectedRoute } from "@/components/protected-route";

function ProfileContent() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { currency } = useCurrency();
  const { data: price } = useBitcoinPrice();
  const [showBalance, setShowBalance] = useState(true);

  const { data: investments } = useQuery<Investment[]>({
    queryKey: ['/api/investments/user', user?.id],
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    enabled: !!user,
    refetchInterval: 30000,
  });

  const fiatValue = parseFloat(user.balance) * (currency === 'USD' ? (price?.usd.price || 0) : (price?.gbp.price || 0));
  const totalInvested = investments?.reduce((sum, inv) => sum + parseFloat(inv.amount || '0'), 0) || 0;
  const totalProfit = investments?.reduce((sum, inv) => sum + parseFloat(inv.currentProfit || '0'), 0) || 0;
  const activeInvestments = investments?.filter(inv => inv.isActive === true).length || 0;
  const completedInvestments = investments?.filter(inv => inv.isActive === false).length || 0;
  const userTransactions = transactions?.filter(tx => tx.userId === user.id).length || 0;

  const accountAge = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const username = user.email.split('@')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Navigation Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Profile</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">Account overview & settings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-6 pb-24">
        {/* Profile Header */}
        <div className="relative mb-8">
          <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

            <CardContent className="relative p-8 text-white">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">{username}</h2>
                  <div className="flex items-center gap-2">
                    {user.isAdmin ? (
                      <Badge className="bg-amber-500/20 text-amber-100 border-amber-300/30 hover:bg-amber-500/30">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                    ) : (
                      <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                        Premium Member
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-white/70 text-sm mb-1">Member Since</p>
                  <p className="text-white font-semibold">{accountAge} days</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-white/70 text-sm mb-1">Transactions</p>
                  <p className="text-white font-semibold">{userTransactions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Balance Card */}
        <Card className="mb-8 border-0 shadow-lg bg-white dark:bg-slate-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-slate-900 dark:text-white">Portfolio Balance</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalance(!showBalance)}
                className="h-8 w-8 p-0 rounded-lg"
              >
                {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              {showBalance ? (
                <>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    {formatBitcoin(user.balance)} BTC
                  </p>
                  <p className="text-lg text-slate-600 dark:text-slate-400">
                    ≈ {price ? formatCurrency(fiatValue, currency) : 'Loading...'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">••••••••</p>
                  <p className="text-lg text-slate-600 dark:text-slate-400">••••••••</p>
                </>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Securely Protected</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Investment Overview */}
        <Card className="mb-8 border-0 shadow-lg bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              Investment Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <Activity className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeInvestments}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active Plans</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <Award className="w-6 h-6 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{completedInvestments}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Completed</p>
              </div>
            </div>

            {showBalance && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Total Invested</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{formatBitcoin(totalInvested.toString())} BTC</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Total Profit</span>
                    <span className="font-semibold text-green-600">+{formatBitcoin(totalProfit.toString())} BTC</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-600">
                    <span className="text-slate-600 dark:text-slate-400">Portfolio Value</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatBitcoin((totalInvested + totalProfit).toString())} BTC</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card className="mb-8 border-0 shadow-lg bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </div>
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <span className="font-medium text-slate-900 dark:text-white">Email</span>
              </div>
              <span className="text-slate-600 dark:text-slate-400">{user.email}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <span className="font-medium text-slate-900 dark:text-white">Joined</span>
              </div>
              <span className="text-slate-600 dark:text-slate-400">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <span className="font-medium text-slate-900 dark:text-white">Security</span>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700">
                Protected
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/settings">
            <Button className="w-full h-14 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl font-medium">
              <User className="w-5 h-5 mr-2" />
              Settings
            </Button>
          </Link>
          <Button
            onClick={logout}
            variant="outline"
            className="w-full h-14 border-2 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20 rounded-xl font-medium"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}

export default function Profile() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}