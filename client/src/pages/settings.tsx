import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from "@/hooks/use-currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BottomNavigation } from "@/components/bottom-navigation";
import { User, Globe, LogOut, Shield, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  const { user, logout } = useAuth();
  const { currency, toggleCurrency } = useCurrency();
  const { toast } = useToast();


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
              <h1 className="text-xl font-bold dark-text">Settings</h1>
              <p className="text-muted-foreground text-sm">Manage your preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-sm mx-auto p-4 pb-20">
        <div className="mb-6">
          {/* <h1 className="text-2xl font-bold dark-text mb-2">Settings</h1> */}
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <div className="space-y-4">
          {/* Profile Section */}
          <Card className="dark-card dark-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark-text">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
                <p className="text-sm dark-text mt-1">{user.email}</p>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Account Type</Label>
                <div className="flex items-center gap-2 mt-1">
                  {user.isAdmin && <Shield className="w-4 h-4 text-bitcoin" />}
                  <p className="text-sm dark-text">
                    {user.isAdmin ? "Administrator" : "Standard User"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences Section */}
          <Card className="dark-card dark-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark-text">
                <Globe className="w-5 h-5" />
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium dark-text">Currency Display</Label>
                  <p className="text-xs text-muted-foreground">
                    Choose your preferred currency for displaying values
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${currency === 'USD' ? 'dark-text font-medium' : 'text-muted-foreground'}`}>
                    USD
                  </span>
                  <Switch
                    checked={currency === 'GBP'}
                    onCheckedChange={toggleCurrency}
                  />
                  <span className={`text-sm ${currency === 'GBP' ? 'dark-text font-medium' : 'text-muted-foreground'}`}>
                    GBP
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card className="dark-card dark-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark-text">
                <Shield className="w-5 h-5" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Account Created</Label>
                <p className="text-sm dark-text mt-1">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <Separator />

              <div className="pt-2">
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* App Info */}
          <Card className="dark-card dark-border">
            <CardContent className="p-4">
              <div className="text-center">
                <h3 className="font-semibold dark-text mb-1">CoreX Wallet</h3>
                <p className="text-xs text-muted-foreground">
                  Version 1.0.0 • Secure Bitcoin Investment Platform
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}