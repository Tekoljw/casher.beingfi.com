import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ChannelData {
  code: number;
  msg: string;
  data: any; // 可根据实际返回结构细化
}

export function useChannelData(
  currency: string
) {
  return useQuery<ChannelData>({
    queryKey: ['channelData', currency],
    queryFn: async () => {
      const res = await apiRequest<ChannelData>('POST', '/Api/Index/paytypes', { currency });
      return res;
    },
    enabled: !!currency,
    refetchInterval: 30000,
    staleTime: 0,
  });
}