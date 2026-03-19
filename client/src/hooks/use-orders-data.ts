import { useInfiniteQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { number } from "zod";

export interface OrderItem {
  id: string;
  otype: string;
  orderid: string;
  out_order_id: string;
  remarks: string;
  userid: string;
  task_status?: string | number; // 代付订单任务状态：1-待执行 2-处理中 3-任务成功 4-任务失败
  last_task_status?: string | number; // 上次任务状态：1-失败；2-成功
  last_task_success_time?: string | number; // 上次任务更新时间：秒级时间戳
  uprice: string;
  num: string;
  mum: string;
  real_amount: string;
  all_scale: string;
  scale_amount: string;
  type: string;
  aid: string;
  fee: string;
  truename: string;
  bank: string;
  bankprov: string;
  bankcity: string;
  bankaddr: string;
  bankcard: string;
  addtime: string;
  endtime: string;
  updatetime: string;
  overtime: string;
  status: string;
  notifyurl: string;
  callbackurl: any;
  payurl: string;
  pay_channelid: string;
  payparams_id: string;
  repost_num: string;
  rush_status: string;
  punishment_level: string;
  order_encode: string;
  return_order_id: string;
  username: string;
  agent?: {
    nickname?: string;
    name?: string;
    id?: string;
  } | string | null;
  bankname: string;
  buy_fee: number;
  obtain_num: string;
  currency: string;
  pay_bank: string;
  channel_title: string;
  pay_proof?: string;  // 付款截图URL
  return_account_name?: string;  // 付款人姓名
  return_bank_name?: string;  // 付款银行名称
}

export interface PageResponseInfo {
  all_page: number;
  current_page: number;
  page_size: number;
  total: number
}

export interface ReportResInfo {
  today_all_order: number;
  pending_receive_order: number;
  pending_payment_order: number;
  time_out_order: number;
  auto_sell_status: number;
  auto_buy_status: number;
  // 新增财务字段
  today_received: number;        // 今日收款
  today_paid: number;           // 今日付款
  margin_amount: number;        // 保证金
  pending_settlement: number;   // 待结算金额
}


export interface OrdersResponse {
  code: number;
  msg: string;
  data: {
    list: OrderItem[];
    page: PageResponseInfo;
    report: ReportResInfo;
  };
}

export interface OrdersParams {
  currency?: string;
  status?: string;
  otype?: string;
  orderid?: string;
  out_order_id?: string;
}

export function useOrdersData(params: OrdersParams) {
  return useInfiniteQuery({
    queryKey: ["orders", params],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiRequest<OrdersResponse>('POST', `/Api/Index/mytx?pageNum=${pageParam}&pageSize=10`, params);
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