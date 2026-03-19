import { useInfiniteQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface TeamMemberItem {
  id: number;
  username: string;
  nickname: string;
  receive_commission: string;
  payment_commission: string;
  received_amount: string;
  punish_commission: string;
  extraction_commission: string;
  last_login_time: string;
  status: number;
  tg_account: number;
  user_id: number;
  password: string;
  receive_fee: string;
  payment_fee: string;
  auto_c2c_sell_status: number;
  auto_c2c_buy_status: number;
  wallet_id?: string; // 钱包ID
  // 新增财务字段
  margin_amount: string;        // 保证金
  pending_settlement: string;   // 待结算金额
  today_received: string;       // 今日收款
  today_paid: string;          // 今日付款
  // 额度预警数据
  amount?: {
    [currency: string]: {
      settle: string | number; // 待结算金额
      margin: string | number; // 保证金
    };
  };
}

interface TeamDataResponse {
  code: number;
  msg: string;
  data: {
    page: {
      all_page: number;
      current_page: number;
      page_size: number;
      total: number
    };
    list: TeamMemberItem[];
  };
}

interface TeamParams {
  status?: string;
  tg_account?: string;
  user_id?: string;
  wallet_id?: string; // 钱包ID搜索
}

export function useTeamData(data: TeamParams= {}, pageSize?: number, options?: { enabled?: boolean }) {
  const page_size = pageSize ? pageSize: 10;
  // 明确处理 enabled 选项：如果提供了 options.enabled，使用它；否则默认为 true
  const enabled = options?.enabled !== undefined ? options.enabled : true;
  
  return useInfiniteQuery<TeamDataResponse>({
    queryKey: ["teamMembers", data],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiRequest<TeamDataResponse>(
         "POST", `/Api/Index/users?pageNum=${pageParam}&pageSize=${page_size}`, data
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
    enabled,
    staleTime: 0,
    refetchInterval: false,
  });
} 