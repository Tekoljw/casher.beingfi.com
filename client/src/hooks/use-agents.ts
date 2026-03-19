import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface CurrencyFeeConfig {
  min_fee: string; // 每月最低服务费
  max_fee: string; // 每月最高服务费
}

export interface OvertimePenaltyConfig {
  overtime_minutes: string; // 超时(分钟)
  penalty_percentage: string; // 手续费惩罚(%)
  fixed_penalty: string; // 固定罚款金额
}

export interface ChannelFeeConfig {
  receive_commission: string; // 代收手续费 (%)
  receive_fee: string; // 代收单笔固定手续费
  payment_commission: string; // 代付手续费 (%)
  payment_fee: string; // 代付单笔固定手续费
  punish_commission?: string; // 超时手续费 (%) - 保留兼容性
  overtime_penalties?: OvertimePenaltyConfig[]; // 超时罚款配置（表格形式）
}

export interface Agent {
  id: string;
  nickname: string;
  username: string;
  last_login_time: string;
  status: string;
  tg_account: string;
  receive_commission: string;
  payment_commission: string;
  punish_commission: string;
  receive_fee: string;
  payment_fee: string;
  password: string;
  wallet_id?: string;
  is_system?: string;
  currency_fees?: { [currency: string]: CurrencyFeeConfig }; // 币种服务费配置
  channel_fees?: { [channelid: string]: ChannelFeeConfig }; // 通道手续费配置
  amount?: { // 额度信息
    [currency: string]: {
      settle: string | number; // 待结算金额
      margin: string | number; // 保证金
    };
  };
  // 非系统模式字段
  salary_currency?: string; // 底薪币种
  salary_money?: string; // 底薪金额
  salary_starttime?: string; // 开始底薪时间（11位时间戳）
  // 系统模式字段
  system_fee_currency?: string; // 系统最低服务费币种
  system_fee_money?: string; // 系统最低服务费金额
  system_fee_starttime?: string; // 系统最低服务费开始时间（11位时间戳）
}

export interface AgentsResponse {
  code: number;
  msg: string;
  data: {
    page: {
      total: number;
      all_page: number;
      current_page: number;
      page_size: number;
    };
    list: Agent[];
  };
}

// 编辑供应商的请求参数接口
export interface EditAgentParams {
  id?: string; // 编辑时必传,新增时不需要
  nickname: string;
  username: string;
  tg_account: string;
  receive_commission: string;
  payment_commission: string;
  punish_commission: string;
  receive_fee: string;
  payment_fee: string;
  is_system?: string;
  currency_fees?: { [currency: string]: CurrencyFeeConfig }; // 币种服务费配置
  channel_fees?: { [channelid: string]: ChannelFeeConfig }; // 通道手续费配置
  // 非系统模式字段
  salary_currency?: string; // 底薪币种
  salary_money?: string; // 底薪金额
  salary_starttime?: string; // 开始底薪时间（11位时间戳）
  // 系统模式字段
  system_fee_currency?: string; // 系统最低服务费币种
  system_fee_money?: string; // 系统最低服务费金额
  system_fee_starttime?: string; // 系统最低服务费开始时间（11位时间戳）
}

// 编辑供应商的API函数
export async function editAgent(params: EditAgentParams) {
  return apiRequest('POST', '/Api/Index/agentsEdit', params);
}

// 删除供应商的API函数
export async function deleteAgent(id: string) {
  return apiRequest('POST', '/Api/Index/agentsDel', { id });
}

export interface AgentsParams {
  wallet_id?: string; // 钱包ID搜索
}

export function useAgents(params?: AgentsParams) {
  const queryClient = useQueryClient();

  return useInfiniteQuery<AgentsResponse>({
    queryKey: ['agents', params],
    queryFn: async ({ pageParam = 1 }) => {
      const requestParams: any = {
        pageNum: pageParam,
        pageSize: 10
      };
      if (params?.wallet_id) {
        requestParams.wallet_id = params.wallet_id;
      }
      const res = await apiRequest<AgentsResponse>('POST', '/Api/Index/agents', requestParams);
      return res;
    },
    getNextPageParam: (lastPage) => {
      const { current_page, all_page } = lastPage.data.page;
      if (current_page < all_page) {
        return current_page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
} 