import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wallet, TrendingUp, ArrowUpRight, ArrowDownLeft, RefreshCw, Home, FileText, Settings, LogOut } from "lucide-react";

// Telegram WebApp types
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
          auth_date: number;
          hash: string;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          text: string;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
        };
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
        };
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
        colorScheme: 'light' | 'dark';
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
      };
    };
  }
}

interface MerchantAsset {
  currency: string;
  symbol: string;
  balance: number;
  frozen: number;
  available: number;
  usdtValue: number;
}

interface MerchantInfo {
  id: string;
  name: string;
  telegramId: number;
  telegramUsername: string;
  status: string;
  totalUSDT: number;
  assets: MerchantAsset[];
}

// 模拟商户数据
const getMockMerchantData = (telegramId: number, username: string): MerchantInfo => {
  return {
    id: "M100001",
    name: username || `商户${telegramId}`,
    telegramId: telegramId,
    telegramUsername: username,
    status: "active",
    totalUSDT: 125680.50,
    assets: [
      { currency: "CNY", symbol: "¥", balance: 580000, frozen: 50000, available: 530000, usdtValue: 80555.56 },
      { currency: "USDT", symbol: "$", balance: 35000, frozen: 5000, available: 30000, usdtValue: 35000 },
      { currency: "USD", symbol: "$", balance: 8500, frozen: 500, available: 8000, usdtValue: 8500 },
      { currency: "BTC", symbol: "₿", balance: 0.025, frozen: 0, available: 0.025, usdtValue: 1624.94 },
    ]
  };
};

export default function MerchantWebApp() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isTelegram, setIsTelegram] = useState(false);
  const [merchantInfo, setMerchantInfo] = useState<MerchantInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'settings'>('home');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // 检测是否在Telegram WebApp中
    const tg = window.Telegram?.WebApp;
    
    if (tg && tg.initDataUnsafe?.user) {
      setIsTelegram(true);
      
      // 初始化Telegram WebApp
      tg.ready();
      tg.expand();
      
      // 获取用户信息并自动登录
      const user = tg.initDataUnsafe.user;
      const mockData = getMockMerchantData(user.id, user.username || user.first_name);
      
      // 存储登录信息
      localStorage.setItem('merchantToken', 'tg_merchant_token');
      localStorage.setItem('merchantUser', JSON.stringify({
        telegramId: user.id,
        telegramUsername: user.username,
        name: user.first_name + (user.last_name ? ' ' + user.last_name : ''),
        role: 'merchant'
      }));
      
      setMerchantInfo(mockData);
      setIsLoading(false);
    } else {
      // 非Telegram环境，检查是否有本地登录信息
      const savedUser = localStorage.getItem('merchantUser');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        if (userData.telegramId) {
          const mockData = getMockMerchantData(userData.telegramId, userData.telegramUsername || userData.name);
          setMerchantInfo(mockData);
          setIsLoading(false);
        } else {
          // 跳转到登录页
          setLocation('/merchant-login');
        }
      } else {
        // 跳转到登录页
        setLocation('/merchant-login');
      }
    }
  }, [setLocation]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const formatCurrency = (value: number, currency: string) => {
    if (currency === 'BTC') {
      return value.toFixed(6);
    }
    return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getCurrencyColor = (currency: string) => {
    const colors: Record<string, string> = {
      CNY: "bg-red-100 text-red-800",
      USDT: "bg-green-100 text-green-800",
      USD: "bg-blue-100 text-blue-800",
      BTC: "bg-orange-100 text-orange-800",
    };
    return colors[currency] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b121c] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">正在加载商户数据...</p>
        </div>
      </div>
    );
  }

  if (!merchantInfo) {
    return (
      <div className="min-h-screen bg-[#0b121c] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">无法获取商户信息</p>
          <Button 
            className="mt-4"
            onClick={() => setLocation('/merchant-login')}
          >
            前往登录
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b121c] text-white pb-20">
      {/* 顶部头部 */}
      <div className="bg-gradient-to-b from-[#1a2942] to-[#0b121c] px-4 pt-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-gray-400 text-sm">欢迎回来</p>
            <h1 className="text-xl font-bold" data-testid="text-merchant-name">
              {merchantInfo.name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              {merchantInfo.status === 'active' ? '正常' : '待审核'}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
              onClick={handleRefresh}
              disabled={isRefreshing}
              data-testid="button-refresh-assets"
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* 总资产卡片 */}
        <Card className="bg-[#1a2942]/80 border-[#2a3f5f] backdrop-blur">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">总资产 (USDT)</p>
                <p className="text-3xl font-bold text-white" data-testid="text-total-usdt">
                  {merchantInfo.totalUSDT.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-blue-500/20 p-3 rounded-full">
                <Wallet className="h-8 w-8 text-blue-400" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                data-testid="button-deposit"
              >
                <ArrowDownLeft className="h-4 w-4 mr-1" />
                充值
              </Button>
              <Button 
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                data-testid="button-withdraw"
              >
                <ArrowUpRight className="h-4 w-4 mr-1" />
                提现
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 资产列表 */}
      <div className="px-4 -mt-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">我的资产</h2>
          <TrendingUp className="h-5 w-5 text-gray-500" />
        </div>
        
        <div className="space-y-3">
          {merchantInfo.assets.map((asset) => (
            <Card 
              key={asset.currency} 
              className="bg-[#111827] border-[#1e293b]"
              data-testid={`card-asset-${asset.currency.toLowerCase()}`}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={getCurrencyColor(asset.currency)}>
                      {asset.currency}
                    </Badge>
                    <div>
                      <p className="text-white font-medium">
                        {asset.symbol}{formatCurrency(asset.balance, asset.currency)}
                      </p>
                      <p className="text-gray-500 text-xs">
                        可用: {asset.symbol}{formatCurrency(asset.available, asset.currency)}
                        {asset.frozen > 0 && (
                          <span className="text-orange-400 ml-2">
                            冻结: {asset.symbol}{formatCurrency(asset.frozen, asset.currency)}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">
                      ≈ ${formatCurrency(asset.usdtValue, 'USDT')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 快捷功能 */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-semibold mb-3">快捷功能</h2>
        <div className="grid grid-cols-4 gap-3">
          <button 
            className="flex flex-col items-center gap-2 p-3 bg-[#111827] rounded-lg border border-[#1e293b] hover:bg-[#1a2942] transition-colors"
            data-testid="button-quick-orders"
            onClick={() => setLocation('/merchant')}
          >
            <FileText className="h-6 w-6 text-blue-400" />
            <span className="text-xs text-gray-400">订单</span>
          </button>
          <button 
            className="flex flex-col items-center gap-2 p-3 bg-[#111827] rounded-lg border border-[#1e293b] hover:bg-[#1a2942] transition-colors"
            data-testid="button-quick-deposit"
          >
            <ArrowDownLeft className="h-6 w-6 text-green-400" />
            <span className="text-xs text-gray-400">充值</span>
          </button>
          <button 
            className="flex flex-col items-center gap-2 p-3 bg-[#111827] rounded-lg border border-[#1e293b] hover:bg-[#1a2942] transition-colors"
            data-testid="button-quick-withdraw"
          >
            <ArrowUpRight className="h-6 w-6 text-orange-400" />
            <span className="text-xs text-gray-400">提现</span>
          </button>
          <button 
            className="flex flex-col items-center gap-2 p-3 bg-[#111827] rounded-lg border border-[#1e293b] hover:bg-[#1a2942] transition-colors"
            data-testid="button-quick-settings"
            onClick={() => setLocation('/merchant')}
          >
            <Settings className="h-6 w-6 text-gray-400" />
            <span className="text-xs text-gray-400">设置</span>
          </button>
        </div>
      </div>

      {/* 底部导航栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#111827] border-t border-[#1e293b] px-4 py-2 safe-area-inset-bottom">
        <div className="flex justify-around">
          <button 
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${activeTab === 'home' ? 'text-blue-400' : 'text-gray-500'}`}
            onClick={() => setActiveTab('home')}
            data-testid="nav-home"
          >
            <Home className="h-5 w-5" />
            <span className="text-xs">首页</span>
          </button>
          <button 
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${activeTab === 'orders' ? 'text-blue-400' : 'text-gray-500'}`}
            onClick={() => {
              setActiveTab('orders');
              setLocation('/merchant');
            }}
            data-testid="nav-orders"
          >
            <FileText className="h-5 w-5" />
            <span className="text-xs">订单</span>
          </button>
          <button 
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${activeTab === 'settings' ? 'text-blue-400' : 'text-gray-500'}`}
            onClick={() => {
              setActiveTab('settings');
              setLocation('/merchant');
            }}
            data-testid="nav-settings"
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs">设置</span>
          </button>
        </div>
      </div>

      {/* Telegram环境提示 */}
      {isTelegram && (
        <div className="fixed top-0 left-0 right-0 bg-blue-600/90 text-white text-center py-1 text-xs">
          Telegram 小程序模式
        </div>
      )}
    </div>
  );
}
