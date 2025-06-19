
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Copy, User, Bitcoin, Key, ExternalLink, Shield, ArrowLeft, TrendingUp, Activity, Calendar, Mail, Hash, Award, Wallet, Eye, EyeOff, Crown, Star } from "lucide-react";
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
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);

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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      {/* Professional Header */}
      <div className="bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-sm border-b border-gray-700/50">
        <div className="max-w-sm mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-white/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Profile</h1>
              <p className="text-sm text-gray-300">Account overview</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-sm mx-auto p-6 pb-24 space-y-6">
        {/* Profile Header Card */}
        <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-gray-700/50 overflow-hidden relative">
          {/* Background Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-bitcoin/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full translate-y-12 -translate-x-12"></div>
          
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-bitcoin to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">{user.email.split('@')[0]}</h2>
                <p className="text-gray-300 text-sm">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  {user.isAdmin ? (
                    <Badge className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30">
                      <Crown className="w-3 h-3 mr-1" />
                      Administrator
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                      <Star className="w-3 h-3 mr-1" />
                      Premium Member
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-800/50 rounded-lg border border-gray-700/30">
                <Calendar className="w-5 h-5 mx-auto mb-2 text-blue-400" />
                <p className="text-lg font-bold text-white">{accountAge}</p>
                <p className="text-xs text-gray-300">Days Active</p>
              </div>
              <div className="text-center p-3 bg-gray-800/50 rounded-lg border border-gray-700/30">
                <Activity className="w-5 h-5 mx-auto mb-2 text-green-400" />
                <p className="text-lg font-bold text-white">{userTransactions}</p>
                <p className="text-xs text-gray-300">Transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Summary */}
        <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Wallet className="w-5 h-5 text-bitcoin" />
              Portfolio Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Current Balance</p>
                <p className="text-2xl font-bold text-white">{formatBitcoin(user.balance)} BTC</p>
                <p className="text-sm text-gray-400">≈ {price ? formatCurrency(fiatValue, currency) : 'Loading...'}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                className="text-gray-400 hover:text-white"
              >
                {showSensitiveInfo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>

            <Separator className="bg-gray-700/50" />

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <TrendingUp className="w-5 h-5 mx-auto mb-2 text-green-400" />
                <p className="text-lg font-bold text-green-400">{activeInvestments}</p>
                <p className="text-xs text-gray-300">Active Plans</p>
              </div>
              <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <Award className="w-5 h-5 mx-auto mb-2 text-blue-400" />
                <p className="text-lg font-bold text-blue-400">{completedInvestments}</p>
                <p className="text-xs text-gray-300">Completed</p>
              </div>
            </div>

            {showSensitiveInfo && (
              <>
                <Separator className="bg-gray-700/50" />
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Total Invested</span>
                    <span className="font-semibold text-white">{formatBitcoin(totalInvested.toString())} BTC</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Total Profit</span>
                    <span className="font-semibold text-green-400">+{formatBitcoin(totalProfit.toString())} BTC</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Portfolio Value</span>
                    <span className="font-bold text-white">{formatBitcoin((totalInvested + totalProfit).toString())} BTC</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <User className="w-5 h-5 text-blue-400" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Email Address</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(user.email, 'Email')}
                  className="text-gray-400 hover:text-white h-8 w-8 p-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Member Since</p>
                    <p className="text-xs text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Security Level</p>
                    <p className="text-xs text-gray-400">Institutional Grade</p>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  <Shield className="w-3 h-3 mr-1" />
                  High
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Information */}
        <Card className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="w-5 h-5 text-green-400" />
              Security & Custody
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <h4 className="font-medium text-green-300 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Institutional Custody
                </h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Multi-signature security protocols</li>
                  <li>• Cold storage protection</li>
                  <li>• 24/7 monitoring systems</li>
                  <li>• Insurance coverage active</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/settings">
            <Button variant="outline" className="w-full h-12 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
              <User className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </Link>
          <Button
            onClick={logout}
            variant="outline"
            className="w-full h-12 border-red-600/50 text-red-400 hover:bg-red-900/20 hover:text-red-300"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
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
