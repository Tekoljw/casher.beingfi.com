import { useInfiniteQuery, InfiniteData, keepPreviousData } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface ReportItem {
  date: string;
  receive_amount: string;
  receive_fee: string;
  team_receive_amount: string;
  payment_amount: string;
  payment_fee: string;
  team_payment_amount: string;
  punish_amount: string;
  team_punish_amount: string;
  income_amount: string;
  system_fee: string;
}

export interface PageResponseInfo {
  all_page: number;
  current_page: number;
  page_size: number;
  total: number
}

interface ReportsDataResponse {
  code: number;
  msg: string;
  data: {
    list: ReportItem[];
    page: PageResponseInfo;
  };
}

export function useReportsData(currency: string | undefined, timeRange: 'month' | 'last_month' | 'yeatr' | 'total' = 'month') {
  return useInfiniteQuery<ReportsDataResponse, Error, InfiniteData<ReportsDataResponse>, [string, string | undefined, string]>({
    queryKey: ['reportsData', currency, timeRange],
    queryFn: async ({ pageParam = 1 }) => {
      // 构造请求参数
      const params: any = { currency };
      if (timeRange !== 'total') {
        params.time = timeRange;
      }
      const res = await apiRequest<ReportsDataResponse>('POST', `/Api/Index/reposts?pageNum=${pageParam}&pageSize=10`, params);
      return res;
    },
    getNextPageParam: (lastPage) => {
      const { all_page, current_page, page_size, total} = lastPage.data?.page;
      const totalPages = Math.ceil(total / page_size);
      if (current_page < totalPages) {
        return current_page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !!currency,
    staleTime: 0,
    refetchInterval: false,
  });
} 