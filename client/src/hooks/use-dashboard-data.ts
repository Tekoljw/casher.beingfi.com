import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface DashboardData {
  code: number;
  msg: string;
  data: any; // 可根据实际返回结构细化
}

export function useDashboardData(
  currency?: string,
  type: 'dashboard' | 'dashboard_reposts' = 'dashboard'
) {
  return useQuery<DashboardData>({
    queryKey: ['dashboardData', type, currency],
    queryFn: async () => {
      if (type === 'dashboard') {
        // 仪表盘接口，需传币种
        const res = await apiRequest<DashboardData>('POST', '/Api/Index/dashboard', { currency });
        return res;
      } else {
        // 数据快报接口，不传币种
        const res = await apiRequest<DashboardData>('POST', '/Api/Index/dashboard_reposts', {});
        return res;
      }
    },
    enabled: type === 'dashboard' ? !!currency : true,
    refetchInterval: 30000,
    staleTime: 0,
  });
}