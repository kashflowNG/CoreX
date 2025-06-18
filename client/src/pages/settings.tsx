
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { 
  Bell, 
  Shield, 
  Globe, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  User,
  Crown,
  ArrowLeft,
  Settings as SettingsIcon,
  Palette,
  Smartphone,
  Lock
} from "lucide-react";
import { useState } from "react";
import { useCurrency } from "@/hooks/use-currency";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

function SettingsContent() {
  const { user, logout } = useAuth();
  const { currency, toggleCurrency } = useCurrency();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("account");
  const [notifications, setNotifications] = useState(true);
  
  const username = user.email.split('@')[0];

  const handleLogout = () => {
    logout();
    toast({
      title: "Signed Out",
      description: "You have been signed out successfully",
    });
  };

  const menuItems = [
    {
      id: "account",
      label: "Account Settings",
      icon: User,
      description: "Personal information and preferences",
      color: "blue"
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      description: "Manage alerts and updates",
      color: "orange"
    },
    {
      id: "security",
      label: "Security & Privacy",
      icon: Shield,
      description: "Account protection settings",
      color: "green"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Enhanced Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Settings</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">Manage your account preferences</p>
            </div>
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 pb-24">
        {/* Enhanced Profile Card */}
        <Card className="mt-6 mb-8 overflow-hidden border-0 shadow-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          
          <CardContent className="relative p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <User className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-1">{username}</h3>
                <p className="text-white/80 text-sm mb-3">{user.email}</p>
                <div className="flex items-center gap-2">
                  {user.isAdmin ? (
                    <Badge className="bg-amber-500/30 text-amber-100 border-amber-300/50 hover:bg-amber-500/40">
                      <Crown className="w-3 h-3 mr-1" />
                      Administrator
                    </Badge>
                  ) : (
                    <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                      Premium Member
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Navigation Menu */}
        <div className="space-y-4 mb-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const colorClasses = {
              blue: isActive ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800' : '',
              orange: isActive ? 'bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800' : '',
              green: isActive ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' : ''
            };

            return (
              <Card 
                key={item.id}
                className={`cursor-pointer transition-all duration-300 border-2 shadow-md hover:shadow-lg ${
                  isActive 
                    ? colorClasses[item.color as keyof typeof colorClasses]
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
                onClick={() => setActiveTab(item.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isActive 
                        ? item.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/50' 
                          : item.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/50'
                          : 'bg-green-100 dark:bg-green-900/50'
                        : 'bg-slate-100 dark:bg-slate-700'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        isActive 
                          ? item.color === 'blue' ? 'text-blue-600 dark:text-blue-400' 
                            : item.color === 'orange' ? 'text-orange-600 dark:text-orange-400'
                            : 'text-green-600 dark:text-green-400'
                          : 'text-slate-600 dark:text-slate-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 dark:text-white">{item.label}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${
                      isActive ? 'text-slate-900 dark:text-white rotate-90' : 'text-slate-400'
                    }`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Enhanced Content Sections */}
        <div className="space-y-6">
          {activeTab === "account" && (
            <Card className="border-0 shadow-xl bg-white dark:bg-slate-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Email Address</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{user.email}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700">
                        Verified
                      </Badge>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">Display Currency</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Price display preference</p>
                        </div>
                      </div>
                      <Button
                        onClick={toggleCurrency}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                      >
                        {currency}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card className="border-0 shadow-xl bg-white dark:bg-slate-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Push Notifications", desc: "Receive alerts and updates", checked: notifications, onChange: setNotifications },
                  { label: "Price Alerts", desc: "Bitcoin price movements", checked: true },
                  { label: "Investment Updates", desc: "Portfolio performance reports", checked: true },
                  { label: "Security Alerts", desc: "Login and security events", checked: true },
                  { label: "Marketing Communications", desc: "Product updates and offers", checked: false }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{item.label}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{item.desc}</p>
                    </div>
                    <Switch 
                      checked={item.checked} 
                      onCheckedChange={item.onChange || (() => {})}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="border-0 shadow-xl bg-white dark:bg-slate-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  Security & Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-5 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h4 className="font-semibold text-green-900 dark:text-green-100">Security Status</h4>
                  </div>
                  <ul className="text-sm text-green-800 dark:text-green-200 space-y-2">
                    <li>• End-to-end encryption enabled</li>
                    <li>• Multi-signature wallet protection</li>
                    <li>• Secure custody protocols active</li>
                    <li>• 24/7 security monitoring</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Support Section */}
        <Card className="mt-8 border-0 shadow-lg bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
              <HelpCircle className="w-5 h-5" />
              <span className="text-sm">Need assistance? Our support team is here to help 24/7</span>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Logout Section */}
        <Card className="mt-6 border-0 shadow-xl overflow-hidden bg-gradient-to-r from-red-500 to-pink-600">
          <div className="absolute inset-0 bg-black/10"></div>
          <CardContent className="relative p-8">
            <Button 
              onClick={handleLogout}
              className="w-full h-14 bg-white/20 hover:bg-white/30 text-white border-2 border-white/30 hover:border-white/50 rounded-xl font-semibold transition-all duration-300 backdrop-blur-sm"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out of Account
            </Button>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}

export default function Settings() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
