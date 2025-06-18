
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Bitcoin, RefreshCw, Shield, CheckCircle } from "lucide-react";

export function BitcoinSync() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const syncBalanceMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not found');
      
      const response = await fetch(`/api/bitcoin/sync-balance/${user.id}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to sync balance');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setLastSyncTime(new Date());
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      if (data.balanceAdded && parseFloat(data.balanceAdded) > 0) {
        toast({
          title: "Balance Updated!",
          description: `Added ${data.balanceAdded} BTC from blockchain`,
        });
      } else {
        toast({
          title: "Sync Complete",
          description: "Your balance is up to date",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!user) return null;

  return (
    <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <Bitcoin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <span className="text-slate-900 dark:text-white">Balance Sync</span>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-normal">Update from blockchain</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Blockchain Integration</span>
          </div>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Securely check your Bitcoin address on the blockchain and sync any external deposits to your account balance.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
            <div>
              <span className="text-sm font-medium text-slate-900 dark:text-white">Current Balance</span>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Account balance</p>
            </div>
            <Badge variant="secondary" className="font-mono text-sm px-3 py-1">
              {parseFloat(user.balance).toFixed(8)} BTC
            </Badge>
          </div>

          {user.hasWallet && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-900 dark:text-green-100">Wallet Connected</span>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700">
                Active
              </Badge>
            </div>
          )}

          {lastSyncTime && (
            <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Last synced: {lastSyncTime.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        <Button
          onClick={() => syncBalanceMutation.mutate()}
          disabled={syncBalanceMutation.isPending || !user.hasWallet}
          className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-300"
        >
          {syncBalanceMutation.isPending ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              Syncing with Blockchain...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5 mr-2" />
              {user.hasWallet ? 'Sync Balance' : 'Wallet Required'}
            </>
          )}
        </Button>

        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Secure Process:</strong> This feature checks your Bitcoin address using trusted blockchain APIs and automatically adds any detected balance to your account.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
