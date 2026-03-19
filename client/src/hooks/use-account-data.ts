import { useInfiniteQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface AccountItem {
  id?: string | undefined;
  userid?: string;
  username?: string;
  truename?: string;
  paytype?: string;
  channelid?: string;
  mch_id?: string;
  signkey?: string;
  appid?: string;
  appsecret?: string;
  subject?: string;
  domain_record?: string;
  addtime?: string;
  is_personal?: string;
  select_memberid?: string;
  check_status?: string;
  status?: string;
  offline_status?: string;
  control_status?: string;
  paying_money?: string;
  all_money?: string;
  all_pay_num?: string;
  paying_num?: string;
  last_paying_time?: string;
  updatetime?: string;
  start_time?: string;
  end_time?: string;
  min_money?: string;
  max_money?: string;
  is_defined?: string;
  is_manual_account?: string;
  weight?: string;
  before_weight?: string;
  weight_time?: string;
  low_money_count?: string| number,
  max_fail_count?: string;
  qrcode?: string;
  limit_amount_status?: string;
  success_rate_list?: string;
  pay_amount_list?: string;
  sales_name?: string;
  success_rate?: string | number;
  currency?: string;
  daily_calls?: string | number;
  amount?: string | number; // 余额
  max_amount?: string | number; // 最大账户余额
  receive_status?: string | number; // 收款状态：1-开启，0-关闭
  payment_status?: string | number; // 付款状态：1-开启，0-关闭
  owner_name?: string; // 户主姓名
  owner_idcard?: string; // 户主身份证
  owner_mobile?: string; // 户主联系方式
  owner_photo?: string; // 户主照片
  owner_idcard_img1?: string; // 户主身份证正面
  owner_idcard_img2?: string; // 户主身份证反面
  is_login?: string | number; // 是否可以登录：0-不可登录，1-可登录
}

export interface PageResponseInfo {
  all_page: number;
  current_page: number;
  page_size: number;
  total: number
}


export interface OrdersResponse {
  code: number;
  msg: string;
  data: {
    list: AccountItem[];
    page: PageResponseInfo;
  };
}

export interface AccountParams {
  channelid: string;
  username?: string;
  offline_status?: string;
  status?: string;
  orderid?: string;
  currency?: string;
  userid?: string;
  check_status?: string; // 冻结状态：0=冻结，1=启用
}

export function useAccountData(params: AccountParams) {
  return useInfiniteQuery({
    queryKey: ["accountData", params],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiRequest<OrdersResponse>('POST', `/Api/Index/payParams?pageNum=${pageParam}&pageSize=12`, params);
      return response;
    },
    getNextPageParam: (lastPage: any) => {
      const { all_page, current_page, page_size, total} = lastPage.data?.page;
      const totalPages = Math.ceil(total / page_size);
      if (current_page < totalPages) {
        return current_page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 0,
    enabled: !!params.channelid,
    refetchInterval: false,
  });
} 