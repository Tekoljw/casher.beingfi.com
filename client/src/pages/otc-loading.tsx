import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { AccountItem } from "@/hooks/use-account-data";

/**
 * OTC系统专用加载页面
 * 用于解决跨页面导航时的空白页面闪烁问题
 * 如果用户需要账户预警数据，会在加载页中先获取数据
 */
export default function OtcLoading() {
  const [, setLocation] = useLocation();
  const [loadingMessage, setLoadingMessage] = useState("正在加载后台数据与资源...");
  
  // 获取账户预警数据的函数
  const fetchAccountWarningData = async (): Promise<AccountItem[]> => {
    try {
      setLoadingMessage("正在获取币种列表...");
      // 1. 获取币种列表
      const currencyResponse = await apiRequest<{ code: number; data: any[] }>('POST', '/Api/Index/currencys');
      const currencyList = currencyResponse.data || [];
      
      if (!currencyList.length) {
        return [];
      }
      
      const accountsList: AccountItem[] = [];
      let processedCurrency = 0;
      
      // 2. 遍历所有币种获取账户数据
      for (const currencyItem of currencyList) {
        processedCurrency++;
        setLoadingMessage(`正在获取账户数据 (${processedCurrency}/${currencyList.length})...`);
        
        try {
          // 获取该币种的支付类型
          const payTypeResponse = await apiRequest('POST', '/Api/Index/paytypes', { 
            currency: currencyItem.currency 
          });
          
          if (payTypeResponse.code === 0 && payTypeResponse.data && Array.isArray(payTypeResponse.data)) {
            // 遍历每个支付类型
            for (const payType of payTypeResponse.data) {
              try {
                // 获取该支付类型的通道列表
                const channelResponse = await apiRequest('POST', '/Api/Index/payTypeList', { 
                  paytype: payType.id 
                });
                
                if (channelResponse.code === 0 && channelResponse.data && Array.isArray(channelResponse.data)) {
                  // 获取每个通道的账户列表（仅第一页，每页100条）
                  for (const channel of channelResponse.data) {
                    const channelId = channel.channelid || channel.id;
                    if (!channelId) continue;
                    
                    try {
                      const accountResponse = await apiRequest('POST', `/Api/Index/payParams?pageNum=1&pageSize=100`, {
                        channelid: channelId
                      });
                      
                      if (accountResponse.code === 0 && accountResponse.data?.list) {
                        accountsList.push(...accountResponse.data.list);
                      }
                    } catch (error) {
                      console.error(`获取通道 ${channelId} 的账户列表失败:`, error);
                    }
                  }
                }
              } catch (error) {
                console.error(`加载币种 ${currencyItem.currency} 支付类型 ${payType.id} 的通道失败:`, error);
              }
            }
          }
        } catch (error) {
          console.error(`加载币种 ${currencyItem.currency} 的支付类型失败:`, error);
        }
      }
      
      setLoadingMessage("正在保存账户预警数据...");
      // 3. 存储账户预警数据到 localStorage
      localStorage.setItem('accountWarningData', JSON.stringify(accountsList));
      localStorage.setItem('accountWarningDataTime', Date.now().toString());
      
      return accountsList;
    } catch (error) {
      console.error('获取账户预警数据失败:', error);
      return [];
    }
  };
  
  useEffect(() => {
    // 从URL获取next参数
    const urlParams = new URLSearchParams(window.location.search);
    const nextPath = urlParams.get('next') || '/otc-dashboard';
    
    // 如果localStorage中有otcUserData，继续使用
    const storedUser = localStorage.getItem('otcUserData');
    const hasUserData = storedUser !== null;
    
    // 确保body有正确的背景色
    document.body.style.background = "#0b121c";
    
    // 预加载必要资源（立即执行，不延迟）
    const preloadAndNavigate = async () => {
      // 检查是否需要获取账户预警数据
      const otcRole = localStorage.getItem('otcRole');
      const shouldFetchAccountWarning = otcRole === '1' || otcRole === '2';
      
      // 检查缓存是否有效（5分钟内）
      let needFetch = shouldFetchAccountWarning;
      if (shouldFetchAccountWarning) {
        const cachedData = localStorage.getItem('accountWarningData');
        const cachedTime = localStorage.getItem('accountWarningDataTime');
        if (cachedData && cachedTime) {
          const cacheAge = Date.now() - parseInt(cachedTime, 10);
          if (cacheAge < 5 * 60 * 1000) {
            needFetch = false; // 使用缓存数据
            console.log('使用缓存的账户预警数据');
          } else {
            console.log('缓存已过期，重新获取账户预警数据');
          }
        } else {
          console.log('没有缓存数据，开始获取账户预警数据');
        }
      }
      
      if (needFetch) {
        // 立即获取账户预警数据（不延迟）
        try {
          console.log('开始获取账户预警数据...');
          await fetchAccountWarningData();
          console.log('账户预警数据获取完成');
        } catch (error) {
          console.error('获取账户预警数据失败:', error);
        }
      } else if (hasUserData) {
        // 如果有缓存数据，短暂延迟确保加载动画显示（至少 300ms）
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // 完成后进行页面切换
      if (hasUserData) {
        // 使用replace跳转到目标页面
        window.location.replace(nextPath);
      } else {
        // 如果没有用户数据，跳转回登录页
        window.location.replace('/auth');
      }
    };
    
    // 立即执行，不延迟
    preloadAndNavigate();
    
    return () => {
      // 清理
      document.body.style.background = "";
    };
  }, [setLocation]);
  
  return (
    <div className="fixed inset-0 bg-[#0b121c] flex flex-col">
      {/* 顶部加载进度条 */}
      <div className="h-1 bg-[#0b121c] relative overflow-hidden">
        <div className="h-full bg-[#3b82f6] absolute left-0 animate-[loadingBar_2s_ease-in-out_infinite]" style={{width: '30%'}}></div>
      </div>
      
      {/* 中央加载指示器 */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center bg-[#1c293a] p-6 rounded-lg shadow-lg max-w-sm mx-auto">
          <Loader2 className="h-10 w-10 animate-spin text-[#3b82f6] mx-auto mb-4" />
          <h3 className="text-white text-xl font-medium mb-2">OTC系统</h3>
          <p className="text-gray-300">{loadingMessage}</p>
        </div>
      </div>
    </div>
  );
}