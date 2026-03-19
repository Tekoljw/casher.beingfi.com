import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Eye, 
  RotateCcw, 
  ChevronDown,
  QrCode
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Account {
  id: string;
  holder: string;
  bank: string;
  accountNumber: string;
  balance: number;
  currency: string;
  type: string;
  lastUpdated: string;
  status: string;
  qrCodeUrl?: string;
}

// 生成随机个人账户数据
const generateRandomAccounts = (count: number): Account[] => {
  const currencies = ["CNY", "INR", "MMK", "VND"];
  const accountTypes = ["payment", "collection", "exchange"];
  const bankOptions = ["支付宝", "微信支付", "银联", "PayPal", "Stripe", "Bank Transfer"];
  const statuses = ["active", "paused", "risk_control", "low_success"];
  
  // 为团队只生成少量账户（3-5个）
  const actualCount = Math.floor(3 + Math.random() * 3);
  
  return Array.from({ length: actualCount }, (_, i) => {
    const id = `ACC${Math.floor(1000 + Math.random() * 9000)}`;
    const currency = currencies[Math.floor(Math.random() * currencies.length)];
    const bank = bankOptions[Math.floor(Math.random() * bankOptions.length)];
    const accountType = accountTypes[Math.floor(Math.random() * accountTypes.length)];
    
    return {
      id,
      holder: "团队账户",
      bank,
      accountNumber: `${bank.substring(0, 2).toUpperCase()}${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      balance: Math.floor(1000 + Math.random() * 20000),
      currency,
      type: accountType,
      lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 30)).toLocaleString(),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      qrCodeUrl: Math.random() > 0.3 ? `/qrcodes/${id}.png` : undefined
    };
  });
};

export default function StaffAccountManagement() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [qrCodeViewOpen, setQrCodeViewOpen] = useState(false);
  const [expandedAccounts, setExpandedAccounts] = useState<{[key: string]: boolean}>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 初始化随机数据
  useEffect(() => {
    setAccounts(generateRandomAccounts(5));
  }, []);
  
  // 展开或折叠账户卡片
  const toggleAccountExpand = (accountId: string) => {
    setExpandedAccounts(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };
  
  // 查看QR码
  const handleViewQrCode = (account: Account) => {
    setSelectedAccount(account);
    setQrCodeViewOpen(true);
  };
  
  // 处理刷新
  const handleRefresh = () => {
    setIsRefreshing(true);
    
    setTimeout(() => {
      setAccounts(generateRandomAccounts(5));
      setIsRefreshing(false);
      toast({
        title: t('otc.accounts.refreshSuccess'),
        description: t('otc.accounts.refreshSuccessDescription'),
      });
    }, 800);
  };
  
  // 获取状态样式类
  const getStatusClass = (status: string) => {
    switch(status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "paused":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "risk_control":
        return "bg-red-100 text-red-800 border-red-200";
      case "low_success":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  
  // 获取状态文本
  const getStatusText = (status: string) => {
    switch(status) {
      case "active":
        return t('otc.accounts.statusActive');
      case "paused":
        return t('otc.accounts.statusPaused');
      case "risk_control":
        return t('otc.accounts.statusRiskControl');
      case "low_success":
        return t('otc.accounts.statusLowSuccess');
      default:
        return status;
    }
  };
  
  return (
    <div className="p-6 bg-[#f5f7fa] min-h-[calc(100vh-64px)] rounded-lg">
      <div className="mb-6 flex justify-between items-center rounded-lg bg-white p-4 shadow-sm">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-900">{t('otc.accounts.title')}</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white text-gray-600 border-gray-200 hover:bg-gray-50 font-normal"
            onClick={handleRefresh}
          >
            <RotateCcw className={cn("mr-1.5 h-4 w-4", isRefreshing && "animate-spin")} />
            {t('common.refresh')}
          </Button>
        </div>
      </div>
      
      {/* 账户列表 */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {accounts.map(account => (
          <Card key={account.id} className="p-4 bg-white shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Badge 
                  className={cn(
                    "mr-2 font-normal",
                    getStatusClass(account.status)
                  )}
                >
                  {getStatusText(account.status)}
                </Badge>
                <span className="text-lg font-semibold text-gray-900">{account.currency}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={() => toggleAccountExpand(account.id)}
              >
                <ChevronDown className={cn(
                  "h-5 w-5 text-gray-500 transition-transform",
                  expandedAccounts[account.id] && "transform rotate-180"
                )} />
              </Button>
            </div>
            
            <div className="flex justify-between mb-2">
              <div className="text-sm text-gray-500">{t('otc.accounts.accountId')}</div>
              <div className="text-sm font-medium text-gray-900">{account.id}</div>
            </div>
            
            <div className="flex justify-between mb-2">
              <div className="text-sm text-gray-500">{t('otc.accounts.accountType')}</div>
              <div className="text-sm font-medium text-gray-900">{account.bank}</div>
            </div>
            
            {expandedAccounts[account.id] && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex justify-between mb-2">
                  <div className="text-sm text-gray-500">{t('otc.accounts.accountNumber')}</div>
                  <div className="text-sm font-medium text-gray-900">{account.accountNumber}</div>
                </div>
                
                <div className="flex justify-between mb-2">
                  <div className="text-sm text-gray-500">{t('otc.accounts.balance')}</div>
                  <div className="text-sm font-medium text-gray-900">{account.currency} {account.balance.toLocaleString()}</div>
                </div>
                
                <div className="flex justify-between mb-2">
                  <div className="text-sm text-gray-500">{t('otc.accounts.lastUpdated')}</div>
                  <div className="text-sm font-medium text-gray-900">{account.lastUpdated}</div>
                </div>
                
                <div className="mt-3 flex items-center justify-center">
                  <div className="grid grid-cols-1 gap-4 place-items-center">
                    {account.qrCodeUrl && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-11 w-11 p-0 rounded-lg border-green-500 bg-green-50 hover:bg-green-100"
                        onClick={() => handleViewQrCode(account)}
                      >
                        <QrCode className="h-5 w-5 text-green-600" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
      
      {/* QR码查看弹窗 */}
      <Dialog open={qrCodeViewOpen} onOpenChange={setQrCodeViewOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>{t('otc.accounts.qrCodeView')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4">
            {selectedAccount?.qrCodeUrl ? (
              <div className="border-2 border-gray-300 p-2 rounded-lg">
                <img 
                  src="/bepay_image.jpg" 
                  alt={t('otc.accounts.paymentQrCode')} 
                  className="w-64 h-64 object-contain"
                />
              </div>
            ) : (
              <div className="text-gray-500 my-8">{t('otc.accounts.noQrCodeAvailable')}</div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setQrCodeViewOpen(false)}
            >
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}