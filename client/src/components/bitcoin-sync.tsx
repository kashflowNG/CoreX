import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Bitcoin, ExternalLink, Copy } from 'lucide-react';

export function BitcoinSync() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const syncBalanceMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/bitcoin/sync-balance/${user?.id}`, {
        method: 'POST',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to sync balance');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setLastSyncTime(new Date());
      toast({
        title: "Balance Synced",
        description: `Your Bitcoin balance has been updated: ${parseFloat(data.balance).toFixed(8)} BTC`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync Bitcoin balance",
        variant: "destructive",
      });
    },
  });

  const checkBalanceMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/bitcoin/balance/${user?.bitcoinAddress}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to check balance');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Balance Checked",
        description: `Current blockchain balance: ${parseFloat(data.balance).toFixed(8)} BTC`,
      });
    },
    onError: (error) => {
      toast({
        title: "Check Failed",
        description: error instanceof Error ? error.message : "Failed to check Bitcoin balance",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Bitcoin address copied to clipboard",
    });
  };

  const openBlockExplorer = (address: string) => {
    window.open(`https://blockstream.info/address/${address}`, '_blank');
  };

  if (!user) return null;

  return (
    <Card className="dark-card dark-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark-text">
          <Bitcoin className="w-5 h-5 text-orange-500" />
          Bitcoin Wallet Sync
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium dark-text">Bitcoin Address:</span>
            <Badge variant="outline" className="font-mono text-xs">
              {user.bitcoinAddress.substring(0, 8)}...{user.bitcoinAddress.substring(-8)}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(user.bitcoinAddress)}
              className="flex-1"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy Address
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openBlockExplorer(user.bitcoinAddress)}
              className="flex-1"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              View on Explorer
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium dark-text">Current Balance:</span>
            <Badge variant="secondary" className="font-mono">
              {parseFloat(user.balance).toFixed(8)} BTC
            </Badge>
          </div>
          {lastSyncTime && (
            <div className="text-xs text-muted-foreground">
              Last synced: {lastSyncTime.toLocaleString()}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => checkBalanceMutation.mutate()}
            disabled={checkBalanceMutation.isPending}
            variant="outline"
            size="sm"
          >
            {checkBalanceMutation.isPending ? (
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Bitcoin className="w-3 h-3 mr-1" />
            )}
            Check Balance
          </Button>

          <Button
            onClick={() => syncBalanceMutation.mutate()}
            disabled={syncBalanceMutation.isPending}
            size="sm"
          >
            {syncBalanceMutation.isPending ? (
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3 mr-1" />
            )}
            Sync Balance
          </Button>
        </div>

        <div className="text-xs text-muted-foreground bg-muted/20 p-2 rounded">
          <strong>Note:</strong> Use "Check Balance" to view the current blockchain balance without updating your account. 
          Use "Sync Balance" to update your account balance with the actual blockchain balance.
        </div>
      </CardContent>
    </Card>
  );
}