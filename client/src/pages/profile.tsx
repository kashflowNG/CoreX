
<old_str>import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Calendar, Bitcoin, ArrowLeft, Settings, LogOut, Shield, Crown } from "lucide-react";
import { Link } from "wouter";
import { BottomNavigation } from "@/components/bottom-navigation";
import { formatBitcoin, formatDate } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { Investment, InvestmentPlan } from "@shared/schema";

export default function Profile() {
  const { user, logout } = useAuth();

  const { data: investments } = useQuery<Investment[]>({
    queryKey: ['/api/investments/user', user?.id],
    enabled: !!user?.id,
  });

  const { data: investmentPlans } = useQuery<InvestmentPlan[]>({
    queryKey: ['/api/investment-plans'],
    enabled: !!user,
  });

  if (!user) {
    return <div>Please log in to view your profile.</div>;
  }

  const totalInvestedAmount = investments?.reduce((total, inv) => 
    total + parseFloat(inv.amount), 0
  ) || 0;

  const totalProfit = investments?.reduce((total, inv) => 
    total + parseFloat(inv.currentProfit), 0
  ) || 0;

  const currentPlan = user?.currentPlanId 
    ? investmentPlans?.find(plan => plan.id === user.currentPlanId)
    : null;

  return (
    <div className="max-w-sm mx-auto bg-background min-h-screen relative">
      {/* Header */}
      <header className="px-4 py-3 flex justify-between items-center sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b dark-border">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-foreground">Profile</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Profile Section */}
      <div className="px-4 py-6">
        {/* User Info Card */}
        <Card className="dark-card rounded-xl p-6 dark-border mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-bitcoin flex items-center justify-center relative">
              <User className="w-8 h-8 text-black" />
              {user.role === 'admin' && (
                <Crown className="absolute -top-2 -right-2 w-6 h-6 text-gold" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">{user.email}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                  {user.role === 'admin' ? 'Admin' : 'User'}
                </Badge>
                {currentPlan && (
                  <Badge className="bg-bitcoin text-black text-xs">
                    {currentPlan.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm text-foreground ml-auto">{user.email}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Member since</span>
              <span className="text-sm text-foreground ml-auto">
                {formatDate(new Date(user.createdAt))}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant="outline" className="ml-auto text-xs text-green-400 border-green-400">
                Verified
              </Badge>
            </div>
          </div>
        </Card>

        {/* Account Balance Section */}
        <Card className="dark-card rounded-xl p-6 dark-border mb-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bitcoin className="w-5 h-5 text-bitcoin" />
              Account Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-bold text-foreground mb-2">
              {user.bitcoinBalance ? formatBitcoin(user.bitcoinBalance) : '0.00000000'} BTC
            </div>
            <p className="text-sm text-muted-foreground">Available Balance</p>
          </CardContent>
        </Card>

        {/* Investment Summary */}
        <Card className="dark-card rounded-xl p-6 dark-border mb-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-lg">Investment Summary</CardTitle>
            <CardDescription>Your overall investment performance</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Invested</p>
                <p className="text-lg font-semibold text-foreground">
                  {formatBitcoin(totalInvestedAmount.toString())} BTC
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Profit</p>
                <p className="text-lg font-semibold text-green-400">
                  +{formatBitcoin(totalProfit.toString())} BTC
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-3 mb-6">
          <Link href="/settings">
            <Button className="w-full justify-start rounded-xl dark-card dark-border" variant="outline">
              <Settings className="w-4 h-4 mr-3" />
              Account Settings
            </Button>
          </Link>
          
          <Button 
            className="w-full justify-start rounded-xl border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10 text-red-400"
            variant="outline"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </Button>
        </div>

        {/* Bottom spacing for navigation */}
        <div className="h-20"></div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}</old_str>
<new_str>import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Calendar, Bitcoin, ArrowLeft, Settings, LogOut, Shield, Crown, TrendingUp, Activity, Award, Star, Zap } from "lucide-react";
import { Link } from "wouter";
import { BottomNavigation } from "@/components/bottom-navigation";
import { formatBitcoin, formatDate } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { Investment, InvestmentPlan } from "@shared/schema";

export default function Profile() {
  const { user, logout } = useAuth();

  const { data: investments } = useQuery<Investment[]>({
    queryKey: ['/api/investments/user', user?.id],
    enabled: !!user?.id,
  });

  const { data: investmentPlans } = useQuery<InvestmentPlan[]>({
    queryKey: ['/api/investment-plans'],
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bitcoin"></div>
      </div>
    );
  }

  const totalInvestedAmount = investments?.reduce((total, inv) => total + parseFloat(inv.amount), 0) || 0;
  const totalProfit = investments?.reduce((total, inv) => total + parseFloat(inv.currentProfit), 0) || 0;
  const activeInvestments = investments?.filter(inv => inv.isActive) || [];
  const currentPlan = user?.currentPlanId ? investmentPlans?.find(plan => plan.id === user.currentPlanId) : null;

  return (
    <div className="max-w-sm mx-auto min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-black opacity-50"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-bitcoin/10 via-transparent to-transparent"></div>
      
      {/* Floating orbs */}
      <div className="absolute top-40 right-10 w-24 h-24 bg-bitcoin/20 rounded-full blur-xl animate-pulse delay-500"></div>
      <div className="absolute bottom-60 left-10 w-16 h-16 bg-purple-500/20 rounded-full blur-xl animate-pulse delay-1500"></div>

      <div className="relative z-10">
        {/* Enhanced Header */}
        <header className="px-6 py-6 backdrop-blur-xl bg-black/20 border-b border-white/10 sticky top-0 z-20">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon" className="rounded-2xl backdrop-blur-sm bg-white/10 hover:bg-white/20 border border-white/20">
                  <ArrowLeft className="w-5 h-5 text-white" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Profile</h1>
            </div>
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="rounded-2xl backdrop-blur-sm bg-white/10 hover:bg-white/20 border border-white/20">
                <Settings className="w-5 h-5 text-white" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Enhanced Profile Hero Section */}
        <div className="px-6 py-8">
          <Card className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl overflow-hidden">
            <div className="p-8">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative mb-4">
                  <Avatar className="w-24 h-24 ring-4 ring-bitcoin/30 ring-offset-4 ring-offset-transparent">
                    <AvatarFallback className="bg-gradient-to-br from-bitcoin to-yellow-400 text-black text-2xl font-bold">
                      {user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {user.role === 'admin' && (
                    <div className="absolute -top-2 -right-2 p-2 rounded-full bg-gradient-to-r from-gold to-yellow-300">
                      <Crown className="w-5 h-5 text-black" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-4 border-white/20 animate-pulse"></div>
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2">{user.email}</h2>
                
                <div className="flex items-center gap-2 mb-4">
                  <Badge className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.role === 'admin' 
                      ? 'bg-gradient-to-r from-gold to-yellow-300 text-black' 
                      : 'bg-gradient-to-r from-blue-500 to-blue-400 text-white'
                  }`}>
                    {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                  </Badge>
                  {currentPlan && (
                    <Badge className="bg-gradient-to-r from-bitcoin to-yellow-400 text-black px-3 py-1 rounded-full text-sm font-medium">
                      ⭐ {currentPlan.name}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 w-full mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{activeInvestments.length}</div>
                    <div className="text-xs text-gray-400">Active Investments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">+{totalProfit > 0 ? formatBitcoin(totalProfit.toString()) : '0.000'}</div>
                    <div className="text-xs text-gray-400">Total Profit (BTC)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-bitcoin">{Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))}</div>
                    <div className="text-xs text-gray-400">Days Member</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Enhanced Tabs Section */}
        <div className="px-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20">
              <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-white/20 data-[state=active]:text-white">Overview</TabsTrigger>
              <TabsTrigger value="stats" className="rounded-xl data-[state=active]:bg-white/20 data-[state=active]:text-white">Stats</TabsTrigger>
              <TabsTrigger value="settings" className="rounded-xl data-[state=active]:bg-white/20 data-[state=active]:text-white">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 mt-6">
              {/* Account Balance Card */}
              <Card className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-bitcoin/20">
                      <Bitcoin className="w-5 h-5 text-bitcoin" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Account Balance</h3>
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">
                    {user.bitcoinBalance ? formatBitcoin(user.bitcoinBalance) : '0.00000000'} BTC
                  </div>
                  <p className="text-sm text-gray-400">Available for investment</p>
                </div>
              </Card>

              {/* Investment Summary */}
              <Card className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl">
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Investment Performance
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-sm text-gray-400 mb-1">Total Invested</p>
                      <p className="text-xl font-bold text-white">
                        {formatBitcoin(totalInvestedAmount.toString())} BTC
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-sm text-gray-400 mb-1">Total Profit</p>
                      <p className="text-xl font-bold text-green-400">
                        +{formatBitcoin(totalProfit.toString())} BTC
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="stats" className="space-y-4 mt-6">
              {/* Member Info */}
              <Card className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl">
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-400">Email</span>
                    <span className="text-sm text-white ml-auto">{user.email}</span>
                  </div>
                  
                  <Separator className="bg-white/10" />
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-400">Member since</span>
                    <span className="text-sm text-white ml-auto">
                      {formatDate(new Date(user.createdAt))}
                    </span>
                  </div>
                  
                  <Separator className="bg-white/10" />
                  
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-400">Account Status</span>
                    <Badge className="ml-auto bg-green-500/20 text-green-400 border-green-500/30">
                      ✅ Verified
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* Achievement Badges */}
              <Card className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl">
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-gold" />
                    Achievements
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-bitcoin/20 to-yellow-600/10 border border-bitcoin/30">
                      <Star className="w-6 h-6 text-bitcoin mb-2" />
                      <p className="text-xs text-bitcoin font-semibold">Early Adopter</p>
                    </div>
                    {totalInvestedAmount > 0 && (
                      <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30">
                        <TrendingUp className="w-6 h-6 text-green-400 mb-2" />
                        <p className="text-xs text-green-400 font-semibold">Investor</p>
                      </div>
                    )}
                    {user.role === 'admin' && (
                      <div className="p-3 rounded-xl bg-gradient-to-br from-gold/20 to-yellow-600/10 border border-gold/30">
                        <Crown className="w-6 h-6 text-gold mb-2" />
                        <p className="text-xs text-gold font-semibold">Administrator</p>
                      </div>
                    )}
                    {activeInvestments.length > 0 && (
                      <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30">
                        <Zap className="w-6 h-6 text-purple-400 mb-2" />
                        <p className="text-xs text-purple-400 font-semibold">Active Trader</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-6">
              {/* Quick Actions */}
              <div className="space-y-3">
                <Link href="/settings">
                  <Button className="w-full justify-start rounded-2xl backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white h-14">
                    <Settings className="w-5 h-5 mr-4" />
                    <div className="text-left">
                      <div className="font-semibold">Account Settings</div>
                      <div className="text-xs text-gray-400">Manage your preferences</div>
                    </div>
                  </Button>
                </Link>
                
                <Button 
                  className="w-full justify-start rounded-2xl backdrop-blur-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 h-14"
                  onClick={logout}
                >
                  <LogOut className="w-5 h-5 mr-4" />
                  <div className="text-left">
                    <div className="font-semibold">Sign Out</div>
                    <div className="text-xs text-red-300">Logout from your account</div>
                  </div>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Bottom spacing for navigation */}
        <div className="h-28"></div>
      </div>

      {/* Enhanced Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}</new_str>
