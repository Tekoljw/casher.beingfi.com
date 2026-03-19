import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function MerchantHeader() {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  
  const handleLogout = () => {
    logoutMutation.mutate();
    navigate("/auth");
  };
  
  return (
    <header className="fixed top-0 left-0 right-0 bg-white z-10 shadow-sm">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center">
          <div className="mr-4 font-bold text-xl text-blue-700">BeingFi</div>
          <div className="text-sm text-gray-500">商户后台管理系统</div>
        </div>
        <div className="flex items-center">
          <div className="mr-4 text-sm text-gray-700">
            <span className="font-bold">{user?.merchant?.companyName || "商户"}</span>
            <span className="mx-2">|</span>
            <span>{user?.username}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50"
          >
            退出登录
          </button>
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"></div>
    </header>
  );
}