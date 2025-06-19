
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Moon, 
  Sun, 
  Globe, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  User,
  Smartphone,
  Lock,
  CreditCard,
  Palette,
  ArrowLeft,
  Crown,
  Star,
  CheckCircle
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useCurrency } from "@/hooks/use-currency";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

function SettingsContent() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { currency, toggleCurrency } = useCurrency();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("account");
  const [notifications, setNotifications] = useState(true);

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
      label: "Account",
      icon: User,
      description: "Profile and personal information",
      color: "blue"
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      description: "Manage your notification preferences",
      color: "orange"
    },
    {
      id: "security",
      label: "Security",
      icon: Shield,
      description: "Privacy and security settings",
      color: "green"
    }
  ];

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
              <h1 className="text-xl font-bold text-white">Settings</h1>
              <p className="text-sm text-gray-300">Manage your account</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-sm mx-auto px-6 pb-24">
        {/* Profile Summary Card */}
        <Card className="mt-6 mb-8 bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-gray-700/50 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-bitcoin/10 rounded-full -translate-y-12 translate-x-12"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-bitcoin to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{user.email.split('@')[0]}</h3>
                <p className="text-sm text-gray-300">{user.email}</p>
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
          </CardContent>
        </Card>

        {/* Navigation Menu */}
        <div className="space-y-3 mb-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <Card 
                key={item.id}
                className={`cursor-pointer transition-all duration-300 border-0 shadow-sm hover:shadow-md ${
                  isActive 
                    ? 'bg-gradient-to-r from-gray-800/80 to-gray-700/80 border-gray-600/50' 
                    : 'bg-gray-900/50 hover:bg-gray-800/50'
                } backdrop-blur-sm`}
                onClick={() => setActiveTab(item.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isActive ? `bg-${item.color}-500/20` : 'bg-gray-700/50'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        isActive ? `text-${item.color}-400` : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{item.label}</h4>
                      <p className="text-sm text-gray-400">{item.description}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 transition-transform ${
                      isActive ? 'text-bitcoin rotate-90' : 'text-gray-400'
                    }`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {activeTab === "account" && (
            <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-white">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-400" />
                  </div>
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/30 border border-gray-700/30">
                    <div>
                      <p className="font-medium text-white">Email Address</p>
                      <p className="text-sm text-gray-400">{user.email}</p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  </div>

                  <Separator className="bg-gray-700/50" />

                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/30 border border-gray-700/30">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-white">Currency</p>
                        <p className="text-sm text-gray-400">Display preference</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={toggleCurrency}
                      className="bg-bitcoin/20 border-bitcoin/30 text-bitcoin hover:bg-bitcoin hover:text-white"
                    >
                      {currency}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-white">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-orange-400" />
                  </div>
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {[
                    { label: "Push Notifications", desc: "Receive alerts and updates", checked: notifications, onChange: setNotifications },
                    { label: "Price Alerts", desc: "Bitcoin price changes", checked: true },
                    { label: "Investment Updates", desc: "Portfolio performance", checked: true },
                    { label: "Security Alerts", desc: "Login and security events", checked: true },
                    { label: "Marketing", desc: "Product updates and offers", checked: false }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-gray-800/30 border border-gray-700/30">
                      <div>
                        <p className="font-medium text-white">{item.label}</p>
                        <p className="text-sm text-gray-400">{item.desc}</p>
                      </div>
                      <Switch 
                        checked={item.checked} 
                        onCheckedChange={item.onChange}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-white">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-green-400" />
                  </div>
                  Security & Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                  <h4 className="font-medium text-green-300 mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Your Account is Secure
                  </h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Multi-signature wallet protection</li>
                    <li>• Encrypted data storage</li>
                    <li>• 24/7 security monitoring</li>
                    <li>• Regular security audits</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Help Section */}
        <Card className="mt-8 bg-gray-900/30 backdrop-blur-sm border border-gray-700/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-gray-400">
              <HelpCircle className="w-5 h-5" />
              <span className="text-sm">Need help? Contact our support team</span>
            </div>
          </CardContent>
        </Card>

        {/* Logout Section */}
        <Card className="mt-6 bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-500/30">
          <CardContent className="p-6">
            <Button 
              onClick={handleLogout}
              variant="destructive"
              className="w-full h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg transition-all duration-300 group"
            >
              <LogOut className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
              Sign Out
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
