import { useInfiniteQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface ApiOrderItem {
  id: string;
  otype: string;
  userid: string;
  orderid: string;
  out_order_id: string;
  payment_order_id: string;
  mch_no: string;
  appid: string;
  amount: string;
  amount_actual: string;
  mch_fee_amount: string;
  bank_name: string;
  account_name: string;
  account_no: string;
  currency: string;
  status: string;
  remarks: string;
  clientip: string;
  created_at: string;
  success_time: string;
  req_time: string;
  addtime: string;
  updatetime: string;
  username: string | null;
  pay_bank: string | null;
  pay_proof: string;
}

export interface PageResponseInfo {
  all_page: number;
  current_page: number;
  page_size: number;
  total: number;
}

export interface ApiReportResInfo {
  today_all_order: number;
  pending_receive_order: number;
  pending_payment_order: number;
  time_out_order: number;
  auto_sell_status: string;
  auto_buy_status: string;
}

export interface ApiOrdersResponse {
  code: number;
  msg: string;
  data: {
    list: ApiOrderItem[];
    page: PageResponseInfo;
    report: ApiReportResInfo;
  };
}

export interface ApiOrdersParams {
  currency?: string;
  status?: string;
  otype?: string;
  orderid?: string;
  out_order_id?: string;
  payment_order_id?: string;
  userid?: string;
}

export function useApiOrdersData(params: ApiOrdersParams) {
  return useInfiniteQuery({
    queryKey: ["apiOrders", params],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiRequest<ApiOrdersResponse>('POST', `/Api/Index/myApiOrderList?pageNum=${pageParam}&pageSize=10`, params);
      return response;
    },
    getNextPageParam: (lastPage) => {
      const { all_page, current_page, page_size, total } = lastPage.data?.page || {};
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

