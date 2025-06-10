import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Bitcoin } from 'lucide-react';

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
        title: "Blockchain Sync Complete",
        description: `Balance synchronized from blockchain: ${parseFloat(data.balance).toFixed(8)} BTC`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error) => {
      toast({
        title: "Refresh Failed",
        description: error instanceof Error ? error.message : "Failed to refresh account balance",
        variant: "destructive",
      });
    },
  });



  if (!user) return null;

  return (
    <Card className="dark-card dark-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark-text">
          <Bitcoin className="w-5 h-5 text-orange-500" />
          Account Balance Refresh
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground bg-muted/20 p-2 rounded">
            <strong>Blockchain Sync:</strong> This will check your Bitcoin address on the blockchain 
            and update your balance with real on-chain data.
          </div>
          {user.bitcoinAddress && (
            <div className="text-xs font-mono bg-muted/10 p-2 rounded border">
              <strong>Address:</strong> {user.bitcoinAddress.slice(0, 8)}...{user.bitcoinAddress.slice(-8)}
            </div>
          )}
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

        <Button
          onClick={() => syncBalanceMutation.mutate()}
          disabled={syncBalanceMutation.isPending || !user.bitcoinAddress}
          className="w-full"
        >
          {syncBalanceMutation.isPending ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          {user.bitcoinAddress ? 'Sync with Blockchain' : 'No Wallet Address'}
        </Button>

        <div className="text-xs text-muted-foreground bg-muted/20 p-2 rounded">
          <strong>Note:</strong> This checks your Bitcoin address on the blockchain using multiple APIs 
          (BlockCypher, Blockstream, Blockchair) to ensure accurate balance data.
        </div>
      </CardContent>
    </Card>
  );
}