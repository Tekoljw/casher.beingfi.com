import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route } from "wouter";

// 极简版ProtectedRoute - 不再处理重定向，只负责条件渲染
export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  
  // 检查是否是OTC路径
  const isOtcPath = path.includes('otc-dashboard');
  
  return (
    <Route path={path}>
      {(params) => {
        // 检查当前状态
        const isOtcUser = localStorage.getItem('isOtcUser') === 'true';
        
        // 加载中
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          );
        }
        
        // OTC路径检查
        if (isOtcPath) {
          if (!isOtcUser) {
            // 如果未登录OTC，自动重定向
            window.location.href = '/auth';
            return <div className="p-4 text-center">正在跳转到OTC登录页...</div>;
          }
          return <Component {...params} />;
        }
        
        // 普通路径检查
        if (!user) {
          window.location.href = '/auth';
          return <div className="p-4 text-center">正在跳转到登录页...</div>;
        }
        return <Component {...params} />;
      }}
    </Route>
  );
}