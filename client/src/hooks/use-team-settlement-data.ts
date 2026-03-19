import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface SettlementItem {
  user_id: number;
  type: number;
  orderid: string;
  currency: string;
  amount: string;
  received_amount: string;
  received_currency: string;
  status: number;
  addtime: string;
  executetime: string;
  remark: string;
  rate: string;
  actual_rate: string;
  loss_amount: string
}

interface WalletData {
  amount: string;
  address: string[];
}

interface SettlementResponse {
  code: number;
  msg: string;
  data: {
    page: {
       all_page: number;
      current_page: number;
      page_size: number;
      total: number
    };
    list: SettlementItem[];
    report: {
      pending_settles: number;
      pending_add_margin_settles: number;
      pending_reduce_margin_settles: number;
    };
    wallet?: WalletData;
  };
}

interface SettlementParams {
  user_id?: string | number;
  currency?: string;
  status?: number;
  type?: number;
  isAdmin?: boolean
}

export function useTeamSettlementData(data: SettlementParams = {}) {
  return useInfiniteQuery<SettlementResponse, Error, InfiniteData<SettlementResponse>>({
    queryKey: ["settlements", data],
    queryFn: async ({ pageParam =1 }) => {
      const url = data.isAdmin ?  `/Api/Index/adminSettles?pageNum=${pageParam}&pageSize=10`: `/Api/Index/agentTeamSettles?pageNum=${pageParam}&pageSize=10`
      const response = await apiRequest<SettlementResponse>(
         "POST", url, data
      );
      return response;
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
    staleTime: 0,
    refetchInterval: false,
  });
} 