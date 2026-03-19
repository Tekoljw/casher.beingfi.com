import { useInfiniteQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface SettingData {
  code: number;
  msg: string;
  data: {
    api: {
      key: string;
      'test-key': string;
    };
    ip: {
      callback: string;
      payment: string;
    };
    fee: {
      [currency: string]: {
        page: {
          total: number;
          all_page: number;
          current_page: number;
          page_size: number;
        };
        list: Array<{
          channelid: string;
          channel_name: string;
          receive_commission: string;
          payment_commission: string;
          punish_commission: string;
        }>;
      };
    };
  };
}

export function useSettingData(currency: string) {
  return useInfiniteQuery<SettingData>({
    queryKey: ['settingData', currency],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await apiRequest<SettingData>('POST', '/Api/Index/config', {
        currency,
        pageNum: pageParam,
        pageSize: 10
      });
      return res;
    },
    getNextPageParam: (lastPage) => {
      const { current_page, all_page } = lastPage.data.fee[currency].page;
      if (current_page < all_page) {
        return current_page + 1;
      }
      return undefined;
    },
    enabled: !!currency,
    initialPageParam: 1,
  });
}