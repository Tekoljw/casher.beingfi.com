import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ChannelData {
  code: number;
  msg: string;
  data: any[];
}

export function useAllChannelDataList(
  paytype: string
) {
  return useQuery<ChannelData>({
    queryKey: ['channelAllData', paytype],
    queryFn: async () => {
      const res = await apiRequest<ChannelData>('POST', '/Api/Index/payTypeList', { paytype });
      return res;
    },
    enabled: !!paytype,
    refetchInterval: 30000,
    staleTime: 0,
  });
}