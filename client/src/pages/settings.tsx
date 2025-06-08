import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from "@/hooks/use-currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BottomNavigation } from "@/components/bottom-navigation";
import { SecurityFeatures } from "@/components/security-features";
import { User, Globe, LogOut, Shield, ArrowLeft, Settings as SettingsIcon, Palette, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

export default function Settings() {
  const { user, logout } = useAuth();
  const { currency, toggleCurrency } = useCurrency();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [notifications, setNotifications] = useState(true);

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  };

  if (!user) {
    return <div>Please log in to access settings</div>;
  }

  const tabs = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background opacity-50"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-bitcoin opacity-5 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald opacity-5 rounded-full blur-3xl animate-float"></div>

      {/* Navigation Header */}
      <div className="sticky top-0 z-10 glass-card backdrop-blur-xl border-b border-border">
        <div className="max-w-sm mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-2xl hover:glow-bitcoin transition-all duration-300">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your account preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-sm mx-auto p-6 pb-24 relative z-10">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "outline"}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 rounded-2xl h-12 transition-all duration-300 ${
                  activeTab === tab.id 
                    ? 'gradient-primary text-black glow-bitcoin' 
                    : 'glass-card hover:border-bitcoin'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                <span className="font-medium">{tab.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "general" && (
          <div className="space-y-6">
            {/* Profile Section */}
            <Card className="neo-card rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
                  <User className="w-8 h-8 text-black" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{user.email}</h3>
                  <p className="text-sm text-muted-foreground">Account Holder</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Currency</p>
                      <p className="text-xs text-muted-foreground">Display currency preference</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={toggleCurrency}
                    className="rounded-xl border-bitcoin text-bitcoin hover:bg-bitcoin hover:text-black transition-all duration-300"
                  >
                    {currency}
                  </Button>
                </div>
              </div>
            </Card>

            {/* App Preferences */}
            <Card className="neo-card rounded-2xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">App Preferences</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Push Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive alerts and updates</p>
                  </div>
                  <Switch 
                    checked={notifications} 
                    onCheckedChange={setNotifications}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Biometric Login</p>
                    <p className="text-xs text-muted-foreground">Use fingerprint or face ID</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "security" && (
          <SecurityFeatures userEmail={user.email} />
        )}

        {activeTab === "notifications" && (
          <div className="space-y-6">
            <Card className="neo-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-sapphire bg-opacity-20 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-sapphire" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Notification Settings</h3>
                  <p className="text-sm text-muted-foreground">Configure your alerts</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Price Alerts</p>
                      <p className="text-xs text-muted-foreground">Bitcoin price changes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Investment Updates</p>
                      <p className="text-xs text-muted-foreground">Portfolio performance</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Security Alerts</p>
                      <p className="text-xs text-muted-foreground">Login and security events</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Marketing</p>
                      <p className="text-xs text-muted-foreground">Product updates and offers</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Logout Section */}
        <Card className="neo-card rounded-2xl p-6 mt-8">
          <Button 
            onClick={handleLogout}
            variant="destructive"
            className="w-full h-12 rounded-xl bg-ruby hover:bg-ruby/90 transition-all duration-300 group"
          >
            <LogOut className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
            Sign Out
          </Button>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}