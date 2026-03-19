import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import AuthOtc from "@/pages/auth-otc";
import Dashboard from "@/pages/dashboard";
import MyProjects from "@/pages/my-projects";
import NewIntegration from "@/pages/new-integration";
import OtcDashboard from "@/pages/otc-dashboard";
import OtcDebugPage from "@/pages/otc-debug";
import OtcLoading from "@/pages/otc-loading";
import SettlementPage from "@/pages/settlement";
import TeamManagementPage from "@/pages/team-management";
import MerchantDashboard from "@/pages/merchant-dashboard";
import MerchantLogin from "@/pages/merchant-login";
import MerchantWebApp from "@/pages/merchant-webapp";
import { useState, useEffect } from "react";
import { AuthProvider } from "@/hooks/use-auth";
import { LanguageProvider } from "@/hooks/use-language";
import { ProtectedRoute } from "@/lib/protected-route";
import { LOGIN_CONFIG } from "@/config/login";

// Custom cursor component
function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show custom cursor on desktop
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    document.addEventListener("mousemove", updatePosition);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mousemove", updatePosition);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isVisible]);

  if (window.innerWidth < 768) return null;

  return (
    <div 
      className={`custom-cursor fixed w-8 h-8 bg-accent rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-50 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        mixBlendMode: 'exclusion'
      }}
    />
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Home />
      </Route>
      <Route path="/auth">
        <AuthOtc />
      </Route>
      <Route path="/otc/loading">
        <OtcLoading />
      </Route>
      <Route path="/otc/accounts">
        <OtcDashboard />
      </Route>
      <Route path="/otc/:path*">
        <OtcDashboard />
      </Route>
      <Route path="/otc-debug">
        <OtcDebugPage />
      </Route>
      <Route path="/dashboard">
        <Dashboard />
      </Route>
      <Route path="/my-projects">
        <MyProjects />
      </Route>
      <Route path="/new-integration">
        <NewIntegration />
      </Route>
      <Route path="/otc-dashboard">
        <OtcDashboard />
      </Route>
      <Route path="/otc-dashboard/:path*">
        <OtcDashboard />
      </Route>
      <Route path="/settlement">
        <SettlementPage />
      </Route>
      <Route path="/team-management">
        <TeamManagementPage />
      </Route>
      <Route path="/merchant-login">
        <MerchantLogin />
      </Route>
      <Route path="/merchant-webapp">
        <MerchantWebApp />
      </Route>
      <Route path="/merchant">
        <MerchantDashboard />
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

// OTC导航处理组件
function OtcNavigationHandler() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // 登录成功时的导航处理
    const handleOtcNavigation = (event: Event) => {
      const customEvent = event as CustomEvent;
      const path = customEvent.detail;
      console.log(`接收到OTC导航事件，跳转到: ${path}`);
      setLocation(path);
    };
    
    // 添加导航事件监听器
    window.addEventListener('otcNavigate', handleOtcNavigation as EventListener);
    
    return () => {
      window.removeEventListener('otcNavigate', handleOtcNavigation as EventListener);
    };
  }, [setLocation]);
  
  // 处理OTC用户数据加载
  useEffect(() => {
    try {
      // 如果有存储的OTC用户数据，加载到用户状态中
      const otcUserData = localStorage.getItem('otcUserData');
      if (otcUserData) {
        const user = JSON.parse(otcUserData);
        // 注释掉不存在的接口调用
        // queryClient.setQueryData(["/api/user-info"], user);
      }
    } catch (e) {
      console.error("无法从localStorage加载用户数据", e);
    }
  }, []); // 只在组件挂载时执行一次
  
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <CustomCursor />
            <OtcNavigationHandler />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
