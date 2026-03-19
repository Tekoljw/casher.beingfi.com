import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { queryClient } from "@/lib/queryClient";
import AgentDashboard from "../components/otc/AgentDashboard";
import StaffDashboard from "../components/otc/StaffDashboard";
import AdminDashboard from "../components/otc/AdminDashboard";
import SystemDashboard from "../components/otc/SystemDashboard";

// 简化版OTC仪表盘页面 - 不做重定向
export default function OtcDashboard() {
  const { user, isLoading, otcAutoLoginMutation } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAutoLoginAttempted, setIsAutoLoginAttempted] = useState(false);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoLoginExecutedRef = useRef<boolean>(false);
  
  // 改进的数据预加载和用户恢复逻辑
  useEffect(() => {
    // 立即开始预渲染关键UI组件
    const preloadDashboard = async () => {
      try {
        // 检查URL参数，看是否需要自动登录 - 优先级最高
        const urlParams = new URLSearchParams(window.location.search);
        const autologin = urlParams.get('autologin');
        const userid = urlParams.get('userid');
        const pin = urlParams.get('pin');
        
        // 如果URL中有autologin=1参数且userid存在，优先处理自动登录
        if (autologin === '1' && userid && !autoLoginExecutedRef.current && !otcAutoLoginMutation.isPending) {
          console.log('检测到自动登录参数，开始自动登录:', { autologin, userid, pin });
          autoLoginExecutedRef.current = true; // 标记已执行，防止重复调用
          setIsAutoLoginAttempted(true);
          otcAutoLoginMutation.mutate({ walletId: userid, pin: pin || undefined });
          return; // 不继续执行后续逻辑，等待自动登录结果
        }
        
        // 只有在没有自动登录参数时，才尝试从localStorage恢复用户数据
        if (!user && !isAutoLogin) {
          const storedUser = localStorage.getItem('otcUserData');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            console.log("正在从localStorage恢复OTC用户数据", userData);
            // 使用setTimeout避免阻塞渲染
            // 注释掉不存在的接口调用
            // setTimeout(() => {
            //   queryClient.setQueryData(["/api/user"], userData);
            // }, 0);
          }
        }
      } catch (e) {
        console.error("无法从localStorage恢复用户数据", e);
      } finally {
        // 短暂延迟确保加载动画显示，避免闪烁
        setTimeout(() => {
          setIsInitialized(true);
        }, 300);
      }
    };
    
    preloadDashboard();
  }, []); // 只在组件挂载时执行一次

  // 处理非自动登录情况下的自动跳转
  useEffect(() => {
    console.log('otc-dashboard useEffect - user:', user);
    if (!user) {
      const urlParams = new URLSearchParams(window.location.search);
      const autologin = urlParams.get('autologin');
      const userid = urlParams.get('userid');
      const isAutoLogin = autologin === '1' && userid;
      
      console.log('otc-dashboard - isAutoLogin:', isAutoLogin, 'autologin:', autologin, 'userid:', userid);
      
      // 非自动登录情况下，2秒后自动跳转到登录页
      if (!isAutoLogin && !redirectTimerRef.current) {
        console.log('otc-dashboard - 设置2秒后跳转到登录页');
        const timer = setTimeout(() => {
          console.log('otc-dashboard - 执行跳转到登录页');
          window.location.href = '/auth';
        }, 2000);
        redirectTimerRef.current = timer;
        
        return () => {
          if (timer) clearTimeout(timer);
          redirectTimerRef.current = null;
        };
      }
    }
    
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, [user]);

  // 优化过的加载指示器 - 添加顶部加载进度条样式
  const urlParams = new URLSearchParams(window.location.search);
  const autologin = urlParams.get('autologin');
  const userid = urlParams.get('userid');
  const isAutoLogin = autologin === '1' && userid;
  
  // 如果有自动登录参数，优先等待自动登录结果，不依赖本地缓存
  if (isAutoLogin && (otcAutoLoginMutation.isPending || !isAutoLoginAttempted)) {
    return (
      <div className="min-h-screen bg-[#0b121c] flex flex-col">
        {/* 顶部加载进度条 */}
        <div className="h-1 bg-[#0b121c] relative overflow-hidden">
          <div className="h-full bg-[#3b82f6] absolute left-0 animate-[loadingBar_2s_ease-in-out_infinite]" style={{width: '30%'}}></div>
        </div>
        
        {/* 中央加载指示器 */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center bg-[#1c293a] p-6 rounded-lg shadow-lg max-w-sm mx-auto">
            <Loader2 className="h-10 w-10 animate-spin text-[#3b82f6] mx-auto mb-4" />
            <h3 className="text-white text-xl font-medium mb-2">OTC管理后台</h3>
            <p className="text-gray-300">正在自动登录，请稍候...</p>
            <p className="text-gray-400 text-sm mt-2">用户ID: {userid}</p>
          </div>
        </div>
      </div>
    );
  }
  
  // 普通加载状态
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-[#0b121c] flex flex-col">
        {/* 顶部加载进度条 */}
        <div className="h-1 bg-[#0b121c] relative overflow-hidden">
          <div className="h-full bg-[#3b82f6] absolute left-0 animate-[loadingBar_2s_ease-in-out_infinite]" style={{width: '30%'}}></div>
        </div>
        
        {/* 中央加载指示器 */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center bg-[#1c293a] p-6 rounded-lg shadow-lg max-w-sm mx-auto">
            <Loader2 className="h-10 w-10 animate-spin text-[#3b82f6] mx-auto mb-4" />
            <h3 className="text-white text-xl font-medium mb-2">OTC管理后台</h3>
            <p className="text-gray-300">正在加载您的仪表盘数据，请稍候...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // 如果没有登录，显示登录提示
  if (!user) {
    const urlParams = new URLSearchParams(window.location.search);
    const autologin = urlParams.get('autologin');
    const userid = urlParams.get('userid');
    const isAutoLogin = autologin === '1' && userid;
    
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b121c]">
        <div className="text-center max-w-md p-8 rounded-lg bg-[#1c293a]">
          {isAutoLogin && otcAutoLoginMutation.isError ? (
            <>
              <h3 className="text-xl text-red-400 font-bold mb-2">自动登录失败</h3>
              <p className="text-gray-300 mb-4">
                自动登录失败：{otcAutoLoginMutation.error?.message || '未知错误'}
              </p>
            </>
          ) : (
            <>
          <h3 className="text-xl text-white font-bold mb-2">请先登录</h3>
          <p className="text-gray-300 mb-4">您需要先登录OTC账号才能访问此页面。</p>
              <p className="text-gray-400 text-sm mb-4">2秒后将跳转到登录页面</p>
          <a href="/auth" className="bg-[#3b82f6] text-white px-4 py-2 rounded-md">前往登录</a>
            </>
          )}
        </div>
      </div>
    );
  }
  
  // 如果没有用户对象但有OTC会话，尝试从会话中使用角色信息
  // 这允许即使在用户对象暂时丢失的情况下，OTC用户仍能继续使用
  // 直接从localStorage读取角色，如果没有则从用户名判断
  let role = localStorage.getItem('otcRole') || '1';
  
  // 如果有用户对象，从用户名判断角色
  // if (user) {
  //   const lowerUsername = user.username.toLowerCase();
  //   if (lowerUsername.includes('admin')) {
  //     role = 'admin';
  //   } else if (lowerUsername.includes('staff')) {
  //     role = 'staff';
  //   } else {
  //     role = 'agent';
  //   }
  // }

  // 根据角色渲染相应的仪表盘组件
  return (
    <>
      {role === '1' && <AgentDashboard user={user} />}
      {role === '2' && <StaffDashboard user={user} />}
      {role === '3' && <AdminDashboard user={user} />}
      {role === '4' && <SystemDashboard user={user} />}
    </>
  );
}