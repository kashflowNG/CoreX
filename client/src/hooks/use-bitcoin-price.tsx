import { useQuery } from '@tanstack/react-query';
import { fetchBitcoinPrice } from '@/lib/bitcoin';

export function useBitcoinPrice() {
  return useQuery({
    queryKey: ['/api/bitcoin/price'],
    queryFn: fetchBitcoinPrice,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
