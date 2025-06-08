import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Shield, 
  Smartphone, 
  Key, 
  Lock, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  EyeOff,
  Copy,
  QrCode
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SecurityFeaturesProps {
  userEmail?: string;
}

export function SecurityFeatures({ userEmail }: SecurityFeaturesProps) {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const { toast } = useToast();

  const backupCodes = [
    "AB12-CD34-EF56",
    "GH78-IJ90-KL12", 
    "MN34-OP56-QR78",
    "ST90-UV12-WX34",
    "YZ56-AB78-CD90"
  ];

  const passwordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    return score;
  };

  const getStrengthColor = (score: number) => {
    if (score < 2) return "text-ruby";
    if (score < 4) return "text-bitcoin";
    return "text-emerald";
  };

  const getStrengthText = (score: number) => {
    if (score < 2) return "Weak";
    if (score < 4) return "Medium";
    return "Strong";
  };

  const handle2FAToggle = () => {
    setIs2FAEnabled(!is2FAEnabled);
    toast({
      title: is2FAEnabled ? "2FA Disabled" : "2FA Enabled",
      description: is2FAEnabled 
        ? "Two-factor authentication has been disabled" 
        : "Two-factor authentication has been enabled for enhanced security",
    });
  };

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordStrength(newPassword) < 3) {
      toast({
        title: "Weak Password",
        description: "Please choose a stronger password",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Password Updated",
      description: "Your password has been successfully updated",
    });
    
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Backup code copied to clipboard",
    });
  };

  const strength = passwordStrength(newPassword);

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <Card className="neo-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-emerald bg-opacity-20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-emerald" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Security Status</h3>
            <p className="text-sm text-muted-foreground">Account protection level</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald" />
              <span className="text-sm font-medium">Email Verified</span>
            </div>
            <p className="text-xs text-muted-foreground">{userEmail}</p>
          </div>
          
          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-5 h-5 text-emerald" />
              <span className="text-sm font-medium">Encrypted</span>
            </div>
            <p className="text-xs text-muted-foreground">256-bit AES</p>
          </div>
        </div>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className="neo-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-sapphire bg-opacity-20 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-sapphire" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Two-Factor Authentication</h3>
              <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
            </div>
          </div>
          <Switch checked={is2FAEnabled} onCheckedChange={handle2FAToggle} />
        </div>
        
        {is2FAEnabled && (
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Scan QR code with your authenticator app</span>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => setShowBackupCodes(!showBackupCodes)}
              className="w-full rounded-xl"
            >
              {showBackupCodes ? "Hide" : "Show"} Backup Codes
            </Button>
            
            {showBackupCodes && (
              <div className="glass-card p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-bitcoin" />
                  <span className="text-sm font-medium text-bitcoin">Save these backup codes</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-lg">
                      <code className="text-sm font-mono">{code}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(code)}
                        className="w-6 h-6"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Password Change */}
      <Card className="neo-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-bitcoin bg-opacity-20 flex items-center justify-center">
            <Key className="w-6 h-6 text-bitcoin" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Change Password</h3>
            <p className="text-sm text-muted-foreground">Update your account password</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="current-password" className="text-sm font-medium">Current Password</Label>
            <div className="relative mt-1">
              <Input
                id="current-password"
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pr-10 rounded-xl"
                placeholder="Enter current password"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="new-password" className="text-sm font-medium">New Password</Label>
            <div className="relative mt-1">
              <Input
                id="new-password"
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10 rounded-xl"
                placeholder="Enter new password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8"
                onClick={() => setShowPasswords(!showPasswords)}
              >
                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            {newPassword && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        strength < 2 ? 'bg-ruby' : strength < 4 ? 'bg-bitcoin' : 'bg-emerald'
                      }`}
                      style={{ width: `${(strength / 5) * 100}%` }}
                    />
                  </div>
                  <Badge variant="outline" className={`text-xs ${getStrengthColor(strength)}`}>
                    {getStrengthText(strength)}
                  </Badge>
                </div>
              </div>
            )}
          </div>
          
          <div>
            <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type={showPasswords ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 rounded-xl"
              placeholder="Confirm new password"
            />
          </div>
          
          <Button 
            onClick={handlePasswordChange}
            disabled={!currentPassword || !newPassword || !confirmPassword}
            className="w-full gradient-primary text-black font-medium rounded-xl hover:scale-105 transition-all duration-300"
          >
            Update Password
          </Button>
        </div>
      </Card>
    </div>
  );
}