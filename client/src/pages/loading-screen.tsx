import { Loader2 } from "lucide-react";
import { useEffect } from "react";

// 纯加载页面组件
export default function LoadingScreen() {
  // 在组件加载时添加特殊类到body
  useEffect(() => {
    // 添加背景色到body
    document.body.style.background = "#0b121c";
    
    return () => {
      // 清除样式
      document.body.style.background = "";
    }
  }, []);
  
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
          <p className="text-gray-300">正在加载数据，请稍候...</p>
        </div>
      </div>
    </div>
  );
}