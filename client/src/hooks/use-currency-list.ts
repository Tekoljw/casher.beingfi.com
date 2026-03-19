import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface CurrencyItem {
  id: number;
  currency: string;
  desc: string;
  addtime: string;
}

export function useCurrencyList() {
  return useQuery<CurrencyItem[]>({
    queryKey: ['currencyList'],
    queryFn: async () => {
      const res = await apiRequest<{ code: number; msg: string; data: CurrencyItem[] }>('POST', '/Api/Index/currencys');
      return res.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  });
} 