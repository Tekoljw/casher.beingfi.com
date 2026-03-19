import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// OTC登录调试页面
export default function OtcDebugPage() {
  const { user, mockOtcLogin } = useAuth();
  const [, setLocation] = useLocation();
  const [sessionData, setSessionData] = useState<any>({});
  const [localStorageData, setLocalStorageData] = useState<any>({});
  
  // 检查存储数据
  useEffect(() => {
    const checkStorageData = () => {
      // 检查 sessionStorage
      const sessionData = {
        otcRole: sessionStorage.getItem('otcRole'),
        isOtcUser: sessionStorage.getItem('isOtcUser')
      };
      setSessionData(sessionData);
      
      // 检查 localStorage
      try {
        const userData = localStorage.getItem('otcUserData');
        setLocalStorageData({
          otcUserData: userData ? JSON.parse(userData) : null
        });
      } catch (e) {
        console.error("无法解析localStorage数据", e);
        setLocalStorageData({ error: "解析错误" });
      }
    };
    
    checkStorageData();
    // 每秒检查一次存储
    const interval = setInterval(checkStorageData, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // 直接跳转到OTC仪表盘函数
  const directToOtcDashboard = () => {
    setLocation('/otc-dashboard');
  };
  
  // 直接跳转到结算页面函数
  const directToSettlement = () => {
    setLocation('/settlement');
  };
  
  // 直接跳转到团队管理页面
  const directToTeamManagement = () => {
    setLocation('/team-management');
  };
  
  // 快速登录函数 - 现在使用自定义事件进行导航
  const quickLogin = (role: string) => {
    // 通过修改用户数据的方式直接触发登录效果
    const username = `otc_${role}_${Math.floor(Math.random() * 1000)}`;
    mockOtcLogin(username, role);
    
    // 留在当前页面，而不是自动跳转
    setTimeout(() => {
      // 如果导航事件没有正确工作，可以手动触发
      const navigateEvent = new CustomEvent('otcNavigate', { 
        detail: '/otc-dashboard' 
      });
      window.dispatchEvent(navigateEvent);
    }, 100);
  };
  
  // 清除所有存储
  const clearAllStorage = () => {
    // 清除会话存储
    sessionStorage.removeItem('otcRole');
    sessionStorage.removeItem('isOtcUser');
    
    // 清除本地存储
    localStorage.removeItem('otcUserData');
    
    // 清除用户状态
    // 注释掉不存在的接口调用
    // queryClient.setQueryData(["/api/user-info"], null);
    
    // 更新UI状态
    setSessionData({
      otcRole: null,
      isOtcUser: null
    });
    setLocalStorageData({
      otcUserData: null
    });
  };

  return (
    <div className="min-h-screen bg-[#0b121c] flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-3xl bg-[#111827] border-[#1e293b] shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">OTC登录调试工具</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 用户信息 */}
          <div className="p-4 rounded-md bg-[#1c293a]">
            <h3 className="text-lg font-medium text-white mb-2">当前用户状态</h3>
            <pre className="text-xs bg-[#0d1829] p-3 rounded overflow-auto max-h-40 text-gray-300">
              {JSON.stringify(user, null, 2) || "未登录"}
            </pre>
          </div>
          
          {/* 会话存储信息 */}
          <div className="p-4 rounded-md bg-[#1c293a]">
            <h3 className="text-lg font-medium text-white mb-2">Session Storage</h3>
            <pre className="text-xs bg-[#0d1829] p-3 rounded overflow-auto max-h-40 text-gray-300">
              {JSON.stringify(sessionData, null, 2)}
            </pre>
          </div>
          
          {/* localStorage存储信息 */}
          <div className="p-4 rounded-md bg-[#1c293a]">
            <h3 className="text-lg font-medium text-white mb-2">Local Storage</h3>
            <pre className="text-xs bg-[#0d1829] p-3 rounded overflow-auto max-h-40 text-gray-300">
              {JSON.stringify(localStorageData, null, 2)}
            </pre>
            <Button 
              variant="destructive" 
              className="mt-2" 
              onClick={clearAllStorage}
            >
              清除所有存储数据
            </Button>
          </div>
          
          {/* 快速登录按钮 */}
          <div className="p-4 rounded-md bg-[#1c293a]">
            <h3 className="text-lg font-medium text-white mb-2">快速OTC登录</h3>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => quickLogin('agent')}
                variant="outline"
                className="border-[#2a3749] text-white hover:bg-[#1c293a]"
              >
                供应商登录
              </Button>
              <Button 
                onClick={() => quickLogin('staff')}
                variant="outline"
                className="border-[#2a3749] text-white hover:bg-[#1c293a]"
              >
                团队登录
              </Button>
              <Button 
                onClick={() => quickLogin('admin')}
                variant="outline"
                className="border-[#2a3749] text-white hover:bg-[#1c293a]"
              >
                管理员登录
              </Button>
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button 
                onClick={directToOtcDashboard}
                variant="default"
                className="w-full gradient-btn"
              >
                直接跳转到OTC仪表盘
              </Button>
              <Button 
                onClick={directToSettlement}
                variant="default"
                className="w-full gradient-btn"
                style={{background: 'linear-gradient(to right, #059669, #0ea5e9)'}}
              >
                直接跳转到结算管理
              </Button>
              <Button 
                onClick={directToTeamManagement}
                variant="default"
                className="w-full gradient-btn"
                style={{background: 'linear-gradient(to right, #4f46e5, #8b5cf6)'}}
              >
                直接跳转到团队管理
              </Button>
            </div>
          </div>
          
          {/* 导航链接 */}
          <div className="p-4 rounded-md bg-[#1c293a]">
            <h3 className="text-lg font-medium text-white mb-2">导航</h3>
            <div className="flex flex-wrap gap-3">
              <Link href="/auth">
                <Button variant="outline" className="border-[#2a3749] text-white hover:bg-[#1c293a]">
                  登录页
                </Button>
              </Link>
              <Link href="/otc-dashboard">
                <Button variant="outline" className="border-[#2a3749] text-white hover:bg-[#1c293a]">
                  OTC仪表盘
                </Button>
              </Link>
              <Link href="/settlement">
                <Button variant="outline" className="border-[#2a3749] text-white hover:bg-[#1c293a]">
                  结算管理
                </Button>
              </Link>
              <Link href="/team-management">
                <Button variant="outline" className="border-[#2a3749] text-white hover:bg-[#1c293a]">
                  团队管理
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="border-[#2a3749] text-white hover:bg-[#1c293a]">
                  首页
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}