import { InfiniteData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';


export interface PageResponseInfo {
  all_page: number;
  current_page: number;
  page_size: number;
  total: number
}

export interface Channel {
  id?: string;
  paytype?: string;
  channelid?: string;
  channel_title?: string;
  currency?: string;
  is_web?: string | number; // 是否为网站操作：1-网站操作，2-APP操作
  website_url?: string; // 网站URL
  proxy_country?: string; // 代理国家
  receive_params?: string; // 收款解析（文本）
  payment_params?: string; // 付款流程解析（文本）
  is_personal?: string;
  is_auto_notify?: string;
  title?: string;
  code?: string;
  status?: string;
  addtime?: string;
  offline_status?: string;
  control_status?: string;
  paying_money?: string;
  all_money?: string;
  last_paying_time?: string;
  updatetime?: string;
  start_time?: string;
  end_time?: string;
  min_money?: string;
  max_money?: string;
  sale_sell_rate?: string;
  auto_buy_rate?: string;
  mch_id?: string;
  signkey?: string;
  appid?: string;
  appsecret?: string;
  domain_record?: string;
  subject?: string;
  default_weight?: string;
  note?: string;
  min_success_rate?: string;
  channel_type?: string | number; // 通道类型：1-代付，2-代收
  is_random_money?: string | number; // 是否开启随机金额：1-开启，0-关闭
  is_add_random_money?: string | number; // 递增/递减：1-递增，2-递减
  min_unit?: string; // 最小随机单位
  min_random_money?: string; // 最小随机金额（可为负数）
  max_random_money?: string; // 最大随机金额（可为负数）
  exclude_random_money?: string; // 排除整数：0.1；1；10；100；1000；10000
  random_time_range?: string; // 随机金额时间范围（分钟）
  unique_key?: string; // 唯一标识
  payment_format?: string; // 代收账户格式，多个选项用逗号分隔，例如：name,account
}

interface ChannelPayTypeData {
  code: number;
  msg: string;
  data: {
    list: Channel[];
    page: PageResponseInfo;
  };
}

export interface ChannelParams {
  paytype?: string;
  currency?: string;
  channel_type?: string | number; // 通道类型：1-代付，2-代收
}


export function useChannelPayTypeData(params: ChannelParams) {
  return useInfiniteQuery({
    queryKey: ['POST', 'channelPayTypeData', params ],
    queryFn: async ({ pageParam = 1 }) => {
      // 构造请求参数
      const res = await apiRequest<ChannelPayTypeData>('POST', `/Api/Index/payType?pageNum=${pageParam}&pageSize=10`, params);
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
    staleTime: 0,
    refetchInterval: false,
  });
} 