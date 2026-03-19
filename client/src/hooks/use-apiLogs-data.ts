import { useInfiniteQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface ApiLogsDataItem {
  response_time: string;
  endpoint: string;
  method: string;
  response_status: string;
  addtime: string;
}

export interface PageParam {
  all_page: number;
  current_page: number;
  page_size: number;
  total: number
}

export interface ApiLogsDataResponse {
  code: number;
  msg: string;
  data: {
    list: ApiLogsDataItem[];
    page: PageParam;
  };
}

export function useApiLogsData() {
  return useInfiniteQuery<ApiLogsDataResponse, Error>({
    queryKey: ['apiLogsData'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await apiRequest<ApiLogsDataResponse>('POST', `/Api/Index/apiLogs?pageNum=${pageParam}&pageSize=10`);
      return res;
    },
    getNextPageParam: (lastPage) => {
      const { all_page, current_page, page_size, total } = lastPage.data?.page;
      const totalPages = Math.ceil(total / page_size);
      if (current_page < totalPages) {
        return current_page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 0,
    refetchInterval: false,
  });
}