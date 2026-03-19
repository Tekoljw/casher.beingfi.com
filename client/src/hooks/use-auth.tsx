import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  email: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
  otcLoginMutation: UseMutationResult<any, Error, OtcLoginData>;
  otcWalletLoginMutation: UseMutationResult<any, Error, OtcLoginData>;
  otcAutoLoginMutation: UseMutationResult<any, Error, { walletId: string; pin?: string }>;
};

type LoginData = {
  username: string;
  password: string;
};

type OtcLoginData = {
  username?: string;
  password?: string;
  ga_verify?: string;
  walletId?: string;
  verificationCode?: string;
  pin?: string;
  role?: string;
};

type RegisterData = {
  username: string;
  password: string;
  email: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  // 注释掉不存在的接口查询
  // const {
  //   data: user,
  //   error,
  //   isLoading,
  // } = useQuery<User | undefined, Error>({
  //   queryKey: ["/api/user-info"],
  //   queryFn: getQueryFn({ on401: "returnNull" }),
  // });
  
  // 使用本地状态管理用户信息
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 从localStorage恢复用户数据（仅在非自动登录情况下）
  useEffect(() => {
    try {
      // 检查是否有自动登录参数
      const urlParams = new URLSearchParams(window.location.search);
      const autologin = urlParams.get('autologin');
      const userid = urlParams.get('userid');
      const isAutoLogin = autologin === '1' && userid;
      
      console.log('use-auth - 检查自动登录参数:', { autologin, userid, isAutoLogin });
      
      // 如果有自动登录参数，不恢复本地缓存，等待自动登录结果
      if (isAutoLogin) {
        console.log('use-auth - 检测到自动登录参数，不恢复本地缓存，等待自动登录结果');
        setUser(null);
        return;
      }
      
      // 只有在没有自动登录参数时，才从localStorage恢复用户数据
      const otcUserData = localStorage.getItem('otcUserData');
      console.log('use-auth - localStorage otcUserData:', otcUserData);
      if (otcUserData) {
        const userData = JSON.parse(otcUserData);
        console.log('use-auth - 恢复用户数据:', userData);
        setUser(userData);
      } else {
        console.log('use-auth - 没有找到用户数据，设置user为null');
        setUser(null);
      }
    } catch (e) {
      console.error("无法从localStorage恢复用户数据", e);
      setUser(null);
    }
  }, []);

  // 获取账户预警数据的函数
  const fetchAccountWarningData = async (): Promise<AccountItem[]> => {
    try {
      // 1. 获取币种列表
      const currencyResponse = await apiRequest<{ code: number; data: any[] }>('POST', '/Api/Index/currencys');
      const currencyList = currencyResponse.data || [];
      
      if (!currencyList.length) {
        return [];
      }
      
      const accountsList: AccountItem[] = [];
      
      // 2. 遍历所有币种获取账户数据
      for (const currencyItem of currencyList) {
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
      
      // 3. 存储账户预警数据到 localStorage
      localStorage.setItem('accountWarningData', JSON.stringify(accountsList));
      localStorage.setItem('accountWarningDataTime', Date.now().toString());
      
      return accountsList;
    } catch (error) {
      console.error('获取账户预警数据失败:', error);
      return [];
    }
  };

  const otcLoginMutation = useMutation({
    mutationFn: async (loginData: any) => {
      const formData = new FormData();
      formData.append('username', loginData?.username);
      formData.append('password', loginData?.password);
      formData.append('ga_verify', loginData?.ga_verify);
      const res = await apiRequest("POST",  '/Api/Login/doLogin', formData);
      return res
    },
    onSuccess: async (res: any) => {
      console.log('账号密码登录接口返回数据:', res);
      
      // 存储用户信息
      localStorage.setItem('otcRole', res?.data?.role);
      localStorage.setItem('isOtcUser', 'true');
      localStorage.setItem('otcUserToken', res?.data?.token);
      localStorage.setItem('otcUserData', JSON.stringify(res?.data));
      // 然后更新React Query状态
      setUser(res?.data);
      
      // 显示登录成功消息
      toast({
        title: "OTC登录成功",
        description: `欢迎回来，${res?.data?.username}！（${res?.data?.role}角色）`,
      });
      
      // 跳转到加载页，加载页会检查并获取账户预警数据
      window.location.href = '/otc/loading?next=/otc-dashboard';
    },
    onError: (error: Error) => {
      console.log('账号密码登录接口错误:', error);
      toast({
        title: "登录失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const otcWalletLoginMutation = useMutation({
    mutationFn: async (loginData: any) => {
      const formData = new FormData();
      formData.append('walletid', loginData?.walletId);
      formData.append('code', loginData?.verificationCode);
      formData.append('pin', loginData?.pin);
      const res = await apiRequest("POST",  '/Api/Login/doWalletLogin', formData);
      return res
    },
    onSuccess: async (res: any) => {
      console.log('钱包登录接口返回数据:', res);
      
      // 存储用户信息
      localStorage.setItem('otcRole', res?.data?.role);
      localStorage.setItem('isOtcUser', 'true');
      localStorage.setItem('otcUserToken', res?.data?.token);
      localStorage.setItem('otcUserData', JSON.stringify(res?.data));
      // 然后更新React Query状态
      setUser(res?.data);
      
      // 显示登录成功消息
      toast({
        title: "OTC钱包登录成功",
        description: `欢迎回来，${res?.data?.username}！（${res?.data?.role}角色）`,
      });
      
      // 跳转到加载页，加载页会检查并获取账户预警数据
      window.location.href = '/otc/loading?next=/otc-dashboard';
    },
    onError: (error: Error) => {
      console.log('钱包登录接口错误:', error);
      toast({
        title: "钱包登录失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const otcAutoLoginMutation = useMutation({
    mutationFn: async (params: { walletId: string; pin?: string }) => {
      const formData = new FormData();
      formData.append('walletid', params.walletId);
      if (params.pin) {
        formData.append('pin', params.pin);
      }
      const res = await apiRequest("POST",  '/Api/Login/walletAutoLogin', formData);
      return res
    },
    onSuccess: async (res: any) => {
      console.log('自动登录接口返回数据:', res);
      
      // 存储用户信息
      localStorage.setItem('otcRole', res?.data?.role);
      localStorage.setItem('isOtcUser', 'true');
      localStorage.setItem('otcUserToken', res?.data?.token);
      localStorage.setItem('otcUserData', JSON.stringify(res?.data));
      // 然后更新React Query状态
      setUser(res?.data);
      
      // 显示登录成功消息
      toast({
        title: "自动登录成功",
        description: `欢迎回来，${res?.data?.username}！`,
      });
      
      // 清除URL参数，避免重复自动登录
      const url = new URL(window.location.href);
      url.searchParams.delete('autologin');
      url.searchParams.delete('userid');
      window.history.replaceState({}, '', url.toString());
      
      // 判断是否需要获取账户预警数据：支付供应商后台（otcRole === '1'）或业务员（otcRole === '2'）
      const otcRole = res?.data?.role;
      const shouldFetchAccountWarning = otcRole === '1' || otcRole === '2';
      
      if (shouldFetchAccountWarning) {
        // 跳转到加载页，加载页会检查并获取账户预警数据
        window.location.href = '/otc/loading?next=/otc-dashboard';
      } else {
        // 不需要获取账户预警数据，直接跳转到仪表盘
        window.location.href = '/otc-dashboard';
      }
    },
    onError: (error: Error) => {
      console.log('自动登录接口错误:', error);
      toast({
        title: "自动登录失败",
        description: error.message,
        variant: "destructive",
      });
      
      // 自动登录失败，只显示错误提示，不自动跳转
      // 用户可以手动点击"前往登录"按钮
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      setUser(user);
      toast({
        title: "登录成功",
        description: `欢迎回来，${user.username}！`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "登录失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (user: User) => {
      setUser(user);
      toast({
        title: "注册成功",
        description: `欢迎，${user.username}！`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "注册失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/Api/Login/loginOut");
    },
    onSuccess: () => {
      setUser(null);
      // 清除所有OTC相关信息
      localStorage.removeItem('otcRole');
      localStorage.removeItem('isOtcUser');
      localStorage.removeItem('otcUserData');
      localStorage.removeItem('otcUserToken');
      // 记录登出状态
      console.log("用户已登出，OTC相关信息已清除");
      toast({
        title: "已登出",
        description: "您已成功退出登录",
      });
      window.location.href = '/auth';
    },
    onError: (error: Error) => {
      toast({
        title: "登出失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        otcLoginMutation,
        otcWalletLoginMutation,
        otcAutoLoginMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}