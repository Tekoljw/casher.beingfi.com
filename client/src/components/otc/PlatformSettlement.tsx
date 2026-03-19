import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { Download, Upload, FileText, ArrowLeft, ArrowRight, X, Settings, Copy, Wallet, Eye } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn, formatLargeNumber, formatNumberWithCommas } from "@/lib/utils";
import { useSettlementData } from "@/hooks/use-settlement-data";
import { apiRequest } from "@/lib/queryClient";

// 货币符号映射
const currencySymbols: Record<string, string> = {
  CNY: "¥",  // 人民币
  INR: "₹",  // 印度卢比 
  MMK: "K",  // 缅甸元
  VND: "₫",  // 越南盾
};

// 状态标签颜色映射
const statusColors: Record<number, string> = {
   4: "bg-green-100 text-green-800",
   2: "bg-yellow-100 text-yellow-800",
   3: "bg-red-100 text-red-800",
   1: "bg-yellow-100 text-yellow-800",
};

// 状态标签文本映射（使用函数以支持多语言）
const getStatusText = (status: number, t: (key: string) => string): string => {
  const statusMap: Record<number, string> = {
    4: t('otc.settlements.status.completed'),
    2: t('otc.settlements.status.approved'),
    3: t('otc.settlements.status.rejected'),
    1: t('otc.settlements.status.pending'),
  };
  return statusMap[status] || '';
};

// 结算记录类型
interface SettlementRecord {
  id: number;
  user_id: number;
  type: number;
  orderid: string;
  currency: string;
  received_currency: string;
  amount: string;
  received_amount: string;
  status: number;
  addtime: string;
  executetime: string;
  remark: string;
  title?: string;
}

// 报表数据类型
interface ReportData {
  amount: number;
  margin_amount: number;
}

interface WalletData {
  amount: string;
  address: string[];
}

interface SettlementResponse {
  code: number;
  msg: string;
  data: {
    page: {
      total: number;
      all_page: number;
      current_page: number;
      page_size: number;
    };
    report: Record<string, ReportData>;
    list: SettlementRecord[];
    wallet?: WalletData;
  };
}

// 货币卡片组件
interface CurrencyCardProps {
  currency: string;
  amount: number;
  marginAmount: number;
  onSettle: (currency: string) => void;
  t: (key: string) => string;
}

const CurrencyCard: React.FC<CurrencyCardProps> = ({ currency, amount, marginAmount, onSettle, t }) => {
  const symbol = currencySymbols[currency] || "";
  
  // 格式化金额，确保默认显示0
  const formatAmount = (value: number | string | undefined): string => {
    const numValue = typeof value === 'number' ? value : (typeof value === 'string' ? parseFloat(value) || 0 : 0);
    return (numValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
  const formattedAmount = formatAmount(amount);
  const formattedMarginAmount = formatLargeNumber(marginAmount || 0);
  
  // 根据不同货币设置不同的背景色及文字颜色
  const getColors = () => {
    switch(currency) {
      case "CNY": return { bg: "bg-red-50", text: "text-red-800" };
      case "INR": return { bg: "bg-blue-50", text: "text-blue-800" };
      case "MMK": return { bg: "bg-green-50", text: "text-green-800" };
      case "VND": return { bg: "bg-purple-50", text: "text-purple-800" };
      default: return { bg: "bg-gray-50", text: "text-gray-800" };
    }
  };
  const { bg, text } = getColors();
  
  return (
    <Card className={cn("border rounded-lg", bg)}>
      <CardContent className="pt-3 sm:pt-4 md:pt-6 p-3 sm:p-4 md:p-6">
        <div className="flex flex-col space-y-2 sm:space-y-3">
          <div className={cn("flex items-center gap-1 sm:gap-2 text-sm sm:text-base md:text-lg font-medium", text)}>
            <span>{symbol}</span>
            <span>{currency}</span>
          </div>
          
          <div className={cn("text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold break-words overflow-hidden leading-tight", text)}>
            {formattedAmount}
          </div>
          
          <div className={cn("text-xs sm:text-sm break-words leading-tight", text)}>
            {t('otc.settlements.depositAmount')}: <span className="font-medium">{formattedMarginAmount}</span>
          </div>
          
          <Button 
            className={cn("w-full mt-2 sm:mt-3 text-xs sm:text-sm")}
            variant="outline"
            onClick={() => onSettle(currency)}
          >
            {t('otc.settlements.instantSettlement')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// 这个本地翻译对象已弃用，使用全局的t()函数代替
// 保留此对象仅用于参考
const translations = {
  'settlement.depositHistory': '保证金充值记录',
  'settlement.withdrawHistory': '保证金提现记录',
  'settlement.margin': '保证金',
  'settlement.settle': '立即结算',
  'settlement.addMargin': '增加保证金',
  'settlement.reduceMargin': '减少保证金',
  'settlement.noDepositHistory': '暂无保证金充值记录',
  'settlement.noWithdrawHistory': '暂无保证金提现记录'
};

// 对话框类型定义
type DialogType = 'settle' | 'addDeposit' | 'reduceDeposit' | 'settings' | null;

// 结算设置接口
interface SettlementConfig {
  auto_settle_wallet_address?: string | string[];
  auto_settle_enabled?: boolean;
  auto_settle_exchange_loss?: string;
}

// 平台结算组件（用于集成到供应商仪表盘）
export function PlatformSettlement() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("settlement_records");
  
  // 根据 activeTab 获取结算类型
  const getSettlementType = () => {
    switch (activeTab) {
      case "settlement_records":
        return 3;
      case "settlement_depositHistory":
        return 1;
      case "settlement_withdrawHistory":
        return 2;
      case "manualFine":
        return 5;
      case "autoFine":
        return 6;
      case "salaryPayment":
        return 7;
      case "minSystemFee":
        return 8;
      default:
        return 3;
    }
  };
  
  // 使用 hook 获取数据
  const { data: settlementData, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading: isSettlementsLoading, refetch: refetchSettlements, isRefetching: isSettlementsRefetching } = useSettlementData({
    type: getSettlementType()
  });
  const { toast } = useToast();
  
  // 对话框相关状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [selectedCurrency, setSelectedCurrency] = useState("CNY");
  const [is_currency, setIs_currency] = useState("0");
  const [amount, setAmount] = useState("");
  const [received_amount, setReceived_amount] = useState("");
  const [pin, setPin] = useState("");
  const [currentCardCurrency, setCurrentCardCurrency] = useState("");
  
  // 结算设置相关状态
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settlementConfig, setSettlementConfig] = useState<{
    auto_settle_wallet_address: string[];
    auto_settle_enabled: boolean;
    auto_settle_exchange_loss: string;
  }>({
    auto_settle_wallet_address: [],
    auto_settle_enabled: false,
    auto_settle_exchange_loss: "",
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [newWalletAddress, setNewWalletAddress] = useState("");
  
  // 获取报表数据
  const reportData = settlementData?.pages[0]?.data?.report || {};
  // 获取钱包数据
  const walletData = settlementData?.pages[0]?.data?.wallet;
  
  // 钱包地址查看相关状态
  const [walletAddressDialogOpen, setWalletAddressDialogOpen] = useState(false);
  
  // 格式化地址（省略中间部分）
  const formatAddress = (address: string, startLength: number = 6, endLength: number = 4): string => {
    if (!address || address.length <= startLength + endLength) {
      return address;
    }
    return `${address.substring(0, startLength)}...${address.substring(address.length - endLength)}`;
  };
  
  // 复制地址到剪贴板
  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast({
        title: '复制成功',
        description: '地址已复制到剪贴板',
      });
    } catch (error) {
      toast({
        title: '复制失败',
        description: '无法复制到剪贴板',
        variant: "destructive",
      });
    }
  };
  
  // 打开立即结算对话框
  const openSettleDialog = (currency: string) => {
    setCurrentCardCurrency(currency);
    setSelectedCurrency(currency);
    setIs_currency("0");
    setReceived_amount("");
    setAmount("");
    setPin("");
    setDialogType('settle');
    setDialogOpen(true);
  };
  
  // 打开增加保证金对话框
  const openAddDepositDialog = () => {
    setSelectedCurrency("CNY");
    setAmount("");
    setIs_currency("0");
    setReceived_amount("");
    setDialogType('addDeposit');
    setDialogOpen(true);
  };
  
  // 打开减少保证金对话框
  const openReduceDepositDialog = () => {
    setSelectedCurrency("CNY");
    setAmount("");
    setIs_currency("0");
    setReceived_amount("");
    setDialogType('reduceDeposit');
    setDialogOpen(true);
  };
  
  // 打开结算设置对话框
  const openSettingsDialog = async () => {
    setSettingsOpen(true);
    setIsLoadingSettings(true);
    setNewWalletAddress("");
    try {
      // 获取结算设置
      const response = await apiRequest("GET", "/Api/Index/autoSettleInfo");
      if (response.code === 0 && response.data) {
        // 处理钱包地址：settle_address 是逗号分隔的字符串
        let walletAddresses: string[] = [];
        if (response.data.settle_address) {
          walletAddresses = response.data.settle_address.split(',').map(addr => addr.trim()).filter(addr => addr);
        }
        setSettlementConfig({
          auto_settle_wallet_address: walletAddresses,
          auto_settle_enabled: response.data.is_auto_settle === "1",
          auto_settle_exchange_loss: response.data.settle_rate_loss || "",
        });
      }
    } catch (error) {
      console.error("获取结算设置失败:", error);
      // 如果接口不存在或失败，使用默认值
    } finally {
      setIsLoadingSettings(false);
    }
  };
  
  // 添加钱包地址
  const handleAddWalletAddress = () => {
    if (newWalletAddress.trim()) {
      if (settlementConfig.auto_settle_wallet_address.includes(newWalletAddress.trim())) {
        toast({
          title: t('otc.settlements.toast.tip'),
          description: t('otc.settlements.toast.walletAddressExists'),
          variant: "destructive",
        });
        return;
      }
      setSettlementConfig({
        ...settlementConfig,
        auto_settle_wallet_address: [...settlementConfig.auto_settle_wallet_address, newWalletAddress.trim()],
      });
      setNewWalletAddress("");
    }
  };
  
  // 删除钱包地址
  const handleRemoveWalletAddress = (index: number) => {
    setSettlementConfig({
      ...settlementConfig,
      auto_settle_wallet_address: settlementConfig.auto_settle_wallet_address.filter((_, i) => i !== index),
    });
  };
  
  // 保存结算设置
  const handleSaveSettings = async () => {
    try {
      // 将钱包地址数组转换为逗号分隔的字符串
      const walletAddressParam = settlementConfig.auto_settle_wallet_address.join(',');
      
      const response = await apiRequest("POST", "/Api/Index/saveAutoSettleInfo", {
        settle_address: walletAddressParam || "",
        is_auto_settle: settlementConfig.auto_settle_enabled ? "1" : "0",
        settle_rate_loss: settlementConfig.auto_settle_exchange_loss || "",
      });
      
      if (response.code === 0) {
        toast({
          title: t('otc.settlements.toast.operationSuccess'),
          description: response.msg || t('otc.settlements.toast.settingsSaved'),
        });
        setSettingsOpen(false);
      } else {
        toast({
          title: t('otc.settlements.toast.operationFailed'),
          description: response.msg || t('otc.settlements.toast.saveSettingsFailed'),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t('otc.settlements.toast.operationFailed'),
        description: t('otc.settlements.toast.networkError'),
        variant: "destructive",
      });
    }
  };
  
  // 处理对话框提交
  const handleDialogSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: t('otc.settlements.toast.inputError'),
        description: t('otc.settlements.toast.enterValidAmount'),
        variant: "destructive",
      });
      return;
    }

    try {
      // 根据对话框类型设置操作类型
      let type = 3; // 默认为结算
      if (dialogType === 'addDeposit') {
        type = 1;
      } else if (dialogType === 'reduceDeposit') {
        type = 2;
      }
      const url = localStorage.getItem('otcRole') === '1'? '/Api/Index/addSettles' : '/Api/Index/addTeamSettles'
      // 构建请求参数
      const requestParams: any = {
        type,
        currency: selectedCurrency,
        amount: parseFloat(amount),
        received_amount: parseFloat(received_amount),
        is_currency: Number(is_currency)
      };
      
      // 只有立即结算且选择USDT结算时，才添加PIN码
      if (dialogType === 'settle' && is_currency === '0' && pin) {
        requestParams.pin = pin;
      }
      
      // 调用 API
      const response = await apiRequest(
        "POST",
        url,
        requestParams
      );

      if (response.code === 0) {
        setDialogOpen(false);
        // 刷新数据
        await refetchSettlements();
        
        // 显示成功提示
        toast({
          title: t('otc.settlements.toast.operationSuccess'),
          description: response.msg || t('otc.settlements.toast.operationSubmitted'),
        });
      } else {
        // 显示错误提示，显示具体的错误信息
        toast({
          title: t('otc.settlements.toast.operationFailed'),
          description: response.msg || t('otc.settlements.toast.operationSubmitFailed'),
          variant: "destructive",
        });
        // 有错误时不关闭对话框，让用户可以看到错误并重新输入
      }
    } catch (error: any) {
      // 显示错误提示
      toast({
        title: t('otc.settlements.toast.operationFailed'),
        description: error?.message || error?.msg || t('otc.settlements.toast.networkError'),
        variant: "destructive",
      });
      // 发生异常时不关闭对话框
    }
  };
  
  // 根据对话框类型获取标题
  const getDialogTitle = () => {
    switch (dialogType) {
      case 'settle': return `${currentCardCurrency} ${t('otc.settlements.instantSettlement')}`;
      case 'addDeposit': return t('otc.settlements.addDepositAction');
      case 'reduceDeposit': return t('otc.settlements.reduceDepositAction');
      default: return '';
    }
  };

    // 格式化时间戳为日期时间字符串
  const formatTimestamp = (timestamp: string) => {
    if (!timestamp || timestamp === '0') return '-';
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleString();
  };
  
  // 渲染结算记录表格（与OrderManagement相同的样式，增加移动端卡片视图）
  const renderSettlementTable = (records: any[], emptyMessage: string) => {
    return (
      <div className="overflow-x-auto">
        {/* 移动端卡片布局 */}
        <div className="md:hidden space-y-4">
          {records.length === 0 ? (
            <div className="text-center p-8 text-gray-500 bg-white rounded-lg border border-gray-200">
              <X className="h-10 w-10 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">{emptyMessage}</p>
            </div>
          ) : (
            <>
              {records.map((record) => (
                <Card key={record.id} className="p-4 bg-white border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900 text-sm truncate max-w-[180px]">{record.id}</span>
                    </div>
                    <div>
                      <span className={cn("px-2 py-1 rounded-full text-xs font-medium", 
                        statusColors[record.status] || "bg-gray-100 text-gray-800")}>
                        {getStatusText(record.status, t)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <div className="text-xs text-gray-500">{t('otc.settlements.settlementTitle')}</div>
                      <div className="font-bold text-gray-900">{record.title || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">{t('otc.settlements.operateAmount')}</div>
                      <div className="font-bold text-gray-900">{formatNumberWithCommas(record.amount || 0, 2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">{t('otc.settlements.operateCurrency')}</div>
                      <div className="text-gray-900">{record.currency}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">{t('otc.settlements.arrivalAmount')}</div>
                      <div className="text-gray-900">{formatNumberWithCommas(record.received_amount || 0, 2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">{t('otc.settlements.arrivalCurrency')}</div>
                      <div className="text-gray-900">{record.received_currency || '-'}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <div className="text-xs text-gray-500">{t('otc.settlements.exchangeRate')}</div>
                      <div className="text-gray-900 text-sm">{record.rate}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">{t('otc.settlements.actualRate')}</div>
                      <div className="text-gray-900 text-sm">{(record.actual_rate !== '0.00' && record.actual_rate) ?  record.actual_rate: '-'}</div>
                    </div>
                     <div>
                      <div className="text-xs text-gray-500">{t('otc.settlements.lossAmount')}</div>
                     <div className="text-gray-900 text-sm">{record.loss_amount}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">{t('otc.settlements.addTime')}</div>
                      <div className="text-gray-900 text-sm">{record.addTime}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">{t('otc.settlements.operateTime')}</div>
                      <div className="text-gray-900">{record.executetime || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">{t('otc.settlements.remark')}</div>
                      <div className="text-gray-900">{record.remark || '-'}</div>
                    </div>
                  </div>
                </Card>
              ))}
              
              {/* 移动端加载更多按钮 */}
              <div className="text-center mt-4">
                <Button 
                  variant="outline" 
                  className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 w-full"
                >
                  {t('loadMore')}
                </Button>
              </div>
            </>
          )}
        </div>
        
        {/* 桌面端表格布局 */}
        <table className="w-full text-left rounded-lg overflow-hidden hidden md:table">
          <thead>
            <tr className="bg-[#f5f7fa] text-gray-600 text-sm">
              <th className="px-4 py-3 font-medium">{t('otc.settlements.settlementTitle')}</th>
              <th className="px-4 py-3 font-medium">{t('otc.settlements.orderNumber')}</th>
              <th className="px-4 py-3 font-medium">{t('otc.settlements.operateAmount')}</th>
              <th className="px-4 py-3 font-medium">{t('otc.settlements.operateCurrency')}</th>
              <th className="px-4 py-3 font-medium">{t('otc.settlements.arrivalAmount')}</th>
              <th className="px-4 py-3 font-medium">{t('otc.settlements.arrivalCurrency')}</th>
              <th className="px-4 py-3 font-medium">{t('otc.settlements.exchangeRate')}</th>
              <th className="px-4 py-3 font-medium">{t('otc.settlements.actualRate')}</th>
              <th className="px-4 py-3 font-medium">{t('otc.settlements.lossAmount')}</th>
              <th className="px-4 py-3 font-medium min-w-[120px]">{t('otc.settlements.status')}</th>
              <th className="px-4 py-3 font-medium">{t('otc.settlements.addTime')}</th>
              <th className="px-4 py-3 font-medium">{t('otc.settlements.operateTime')}</th>
              <th className="px-4 py-3 font-medium">{t('otc.settlements.remark')}</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-4 py-8 text-center text-gray-500">{emptyMessage}</td>
              </tr>
            ) : (
              <>
                {records.map((record, index) => (
                  <tr key={record.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 text-sm text-gray-900">{record.title || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{record.orderid}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatNumberWithCommas(record.amount, 2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{record.currency}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatNumberWithCommas(record.received_amount, 2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{record.received_currency}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{record.rate}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{(record.actual_rate !== '0.00' && record.actual_rate) ?  record.actual_rate: '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{record.loss_amount}</td>
                    <td className="px-4 py-3 text-sm min-w-[120px] whitespace-nowrap">
                      <span className={cn("px-2 py-1 rounded-full text-xs font-medium", 
                        statusColors[record.status] || "bg-gray-100 text-gray-800")}>
                        {getStatusText(record.status, t)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatTimestamp(record.addTime)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatTimestamp(record.executetime)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{record.remark}</td>

                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
        {/* 桌面端加载更多按钮 */}
        {hasNextPage && (
            // Show loading spinner when fetching next page
            isFetchingNextPage ? (
              <div className="flex justify-center items-center h-10 mt-4 pb-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : (
            <div className="flex justify-center mt-4 pb-4">
              <Button
                onClick={() => fetchNextPage()} // Corrected onClick handler
                disabled={isFetchingNextPage}
                variant="outline"
                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50" // Added classes based on original button
              >
                {t('loadMore')}
              </Button>
            </div>
          )
        )}
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-lg">
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-center mb-3 sm:mb-6">
          <div className="flex items-center">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mr-2" />
            <h1 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900">{t('otc.nav.settlements')}</h1>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 rounded-lg text-xs sm:text-sm"
              onClick={openAddDepositDialog}
            >
              <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t('otc.settlements.addDepositAction')}</span>
              <span className="sm:hidden">{t('otc.settlements.add')}</span>
            </Button>
            <Button 
              variant="outline" 
              className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 rounded-lg text-xs sm:text-sm"
              onClick={openReduceDepositDialog}
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t('otc.settlements.reduceDepositAction')}</span>
              <span className="sm:hidden">{t('otc.settlements.reduce')}</span>
            </Button>
          </div>
        </div>
        
        {/* 钱包余额卡片 - 显示在第一个位置 */}
        {walletData && (
          <div className="mb-4 sm:mb-6">
            <Card className="border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="pt-3 sm:pt-4 md:pt-6 p-3 sm:p-4 md:p-6">
                <div className="flex flex-col space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base md:text-lg font-medium text-blue-800">
                    <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>我的钱包余额</span>
                  </div>
                  
                  <div className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-blue-900 break-words overflow-hidden leading-tight">
                    {parseFloat(walletData.amount || "0").toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                  </div>
                  
                  {walletData.address && walletData.address.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs sm:text-sm text-blue-700 break-all">
                        {formatAddress(walletData.address[0])}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 sm:h-8 text-xs sm:text-sm bg-white border-blue-300 text-blue-700 hover:bg-blue-50"
                        onClick={() => setWalletAddressDialogOpen(true)}
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        查看地址
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* 货币卡片部分 - 移动端每行展示三个 */}
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
          {Object.entries(reportData).map(([currency, data]) => (
            <CurrencyCard 
              key={currency}
              currency={currency}
              amount={data.amount}
              marginAmount={data.margin_amount}
              onSettle={openSettleDialog}
              t={t}
            />
          ))}
        </div>
        
        {/* 结算记录部分 */}
        <div className="bg-gray-50 rounded-lg p-4 pb-6">
          <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
            <div className="tab-container w-full">
              <TabsList className="bg-[#f5f7fa] rounded-lg w-full grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-1 py-0.5 px-1">
                <TabsTrigger 
                  value="settlement_records" 
                  className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-xs sm:text-sm py-1 h-8 transition-all focus:outline-none"
                >
                  {t('otc.settlements.records')}
                </TabsTrigger>
                <TabsTrigger 
                  value="settlement_depositHistory" 
                  className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-xs sm:text-sm py-1 h-8 transition-all focus:outline-none"
                >
                  {t('otc.settlements.marginRecords')}
                </TabsTrigger>
                <TabsTrigger 
                  value="settlement_withdrawHistory" 
                  className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-xs sm:text-sm py-1 h-8 transition-all focus:outline-none"
                >
                  {t('otc.settlements.marginWithdrawRecords')}
                </TabsTrigger>
                <TabsTrigger 
                  value="manualFine" 
                  className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-xs sm:text-sm py-1 h-8 transition-all focus:outline-none"
                >
                  {t('otc.settlements.type.manualFine', '手动罚款')}
                </TabsTrigger>
                <TabsTrigger 
                  value="autoFine" 
                  className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-xs sm:text-sm py-1 h-8 transition-all focus:outline-none"
                >
                  {t('otc.settlements.type.autoFine', '自动罚款')}
                </TabsTrigger>
                <TabsTrigger 
                  value="salaryPayment" 
                  className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-xs sm:text-sm py-1 h-8 transition-all focus:outline-none"
                >
                  {t('otc.settlements.type.salaryPayment', '底薪发放')}
                </TabsTrigger>
                <TabsTrigger 
                  value="minSystemFee" 
                  className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-xs sm:text-sm py-1 h-8 transition-all focus:outline-none"
                >
                  {t('otc.settlements.type.minSystemFee', '保底系统费')}
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value={activeTab} className="mt-4 px-0">
              {isSettlementsLoading || isSettlementsRefetching ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                renderSettlementTable(settlementData?.pages.flatMap(page => page.data.list) || [], t('otc.settlements.noData'))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* 对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium text-gray-900">{getDialogTitle()}</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {t('otc.settlements.dialog.enterCurrencyAndAmount')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* 币种选择（结算对话框中币种不可变，其他对话框可选择） */}
            {dialogType !== 'settle' && (
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-sm font-medium text-gray-500">{t('otc.settlements.dialog.currency')}</Label>
                <Select
                  value={selectedCurrency}
                  onValueChange={setSelectedCurrency}
                >
                  <SelectTrigger id="currency" className="w-full bg-white border-gray-300 text-gray-700">
                    <SelectValue placeholder={t('otc.settlements.dialog.selectCurrency')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    {Object.keys(reportData).map((currency) => (
                      <SelectItem key={currency} value={currency} className="text-gray-700 hover:bg-gray-50">
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* 结算对话框显示币种（不可选） */}
            {dialogType === 'settle' && (
              <div className="space-y-2">
                <Label htmlFor="displayCurrency" className="text-sm font-medium text-gray-500">{t('otc.settlements.dialog.currency')}</Label>
                <div className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700">
                  {selectedCurrency}
                </div>
              </div>
            )}
            
            {/* 金额输入 */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium text-gray-500">{t('otc.settlements.dialog.amount')}</Label>
              <Input
                id="amount"
                placeholder={t('otc.settlements.dialog.enterAmount')}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                className="w-full bg-white border-gray-300 text-gray-700"
              />
            </div>
             <div className="space-y-2">
                <Label htmlFor="is_currency" className="text-sm font-medium text-gray-500">{t('otc.settlements.dialog.settlementMethod')}</Label>
                <Select value={is_currency}
                     onValueChange={setIs_currency}>
                    <SelectTrigger className="w-full bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200">
                      <SelectValue placeholder={t('otc.settlements.dialog.select')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">{t('otc.settlements.dialog.fiatSettlement')}</SelectItem>
                      <SelectItem value="0">{t('otc.settlements.dialog.usdtSettlement')}</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
              {
                is_currency === '0' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="received_amount" className="text-sm font-medium text-gray-500">{t('otc.settlements.dialog.settlementAmount')}</Label>
                      <Input
                        id="received_amount"
                        placeholder={t('otc.settlements.dialog.enterReceivedAmount')}
                        value={received_amount}
                        onChange={(e) => setReceived_amount(e.target.value)}
                        type="number"
                        className="w-full bg-white border-gray-300 text-gray-700"
                      />
                    </div>
                    {/* 只有立即结算时才显示PIN码输入框 */}
                    {dialogType === 'settle' && (
                      <div className="space-y-2">
                        <Label htmlFor="pin" className="text-sm font-medium text-gray-500">PIN码</Label>
                        <Input
                          id="pin"
                          placeholder="请输入PIN码"
                          value={pin}
                          onChange={(e) => setPin(e.target.value)}
                          type="password"
                          className="w-full bg-white border-gray-300 text-gray-700"
                        />
                      </div>
                    )}
                  </>
                )
              }
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="mr-2 bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
              {t('otc.orders.completeConfirm.cancel')}
            </Button>
            <Button onClick={handleDialogSubmit} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">
              {t('otc.orders.completeConfirm.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 结算设置对话框 */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium text-gray-900">{t('otc.settlements.settings.title')}</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {t('otc.settlements.settings.description')}
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingSettings ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* 自动结算钱包地址 */}
              <div className="space-y-2">
                  <Label htmlFor="wallet_address" className="text-sm font-medium text-gray-700">
                  {t('otc.settlements.settings.autoSettlementWalletAddress')}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="wallet_address"
                    placeholder={t('otc.settlements.settings.enterWalletAddress')}
                    value={newWalletAddress}
                    onChange={(e) => setNewWalletAddress(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddWalletAddress();
                      }
                    }}
                    className="flex-1 bg-white border-gray-300 text-gray-900"
                  />
                  <Button
                    type="button"
                    onClick={handleAddWalletAddress}
                    disabled={!newWalletAddress.trim()}
                    className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {t('otc.settlements.settings.add')}
                  </Button>
                </div>
                {/* 已添加的钱包地址列表 */}
                {settlementConfig.auto_settle_wallet_address.length > 0 && (
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2">
                    {settlementConfig.auto_settle_wallet_address.map((address, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200"
                      >
                        <span className="text-sm text-gray-700 truncate flex-1 mr-2">{address}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveWalletAddress(index)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {settlementConfig.auto_settle_wallet_address.length === 0 && (
                  <p className="text-xs text-gray-500">{t('otc.settlements.settings.noWalletAddress')}</p>
                )}
              </div>
              
              {/* 是否开启自动结算 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto_settle_enabled" className="text-sm font-medium text-gray-700">
                    {t('otc.settlements.settings.enableAutoSettlement')}
                  </Label>
                  <Switch
                    id="auto_settle_enabled"
                    checked={settlementConfig.auto_settle_enabled || false}
                    onCheckedChange={(checked) =>
                      setSettlementConfig({
                        ...settlementConfig,
                        auto_settle_enabled: checked,
                      })
                    }
                  />
                </div>
              </div>
              
              {/* 自动结算汇损差 */}
              <div className="space-y-2">
                <Label htmlFor="exchange_loss" className="text-sm font-medium text-gray-700">
                  {t('otc.settlements.settings.autoSettlementExchangeLoss')}
                </Label>
                <Input
                  id="exchange_loss"
                  placeholder={t('otc.settlements.settings.enterExchangeLoss')}
                  value={settlementConfig.auto_settle_exchange_loss || ""}
                  onChange={(e) =>
                    setSettlementConfig({
                      ...settlementConfig,
                      auto_settle_exchange_loss: e.target.value,
                    })
                  }
                  type="number"
                  step="0.01"
                  className="w-full bg-white border-gray-300 text-gray-900"
                />
                <p className="text-xs text-gray-500">{t('otc.settlements.settings.enterExchangeLossHelp')}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSettingsOpen(false)}
              className="mr-2 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {t('otc.settlements.settings.cancel')}
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={isLoadingSettings}
              className="bg-black text-white hover:bg-gray-800"
            >
              {t('otc.settlements.settings.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 钱包地址查看对话框 */}
      <Dialog open={walletAddressDialogOpen} onOpenChange={setWalletAddressDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>钱包地址</DialogTitle>
            <DialogDescription>
              所有钱包地址列表，点击复制按钮可复制地址
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {walletData?.address && walletData.address.length > 0 ? (
              walletData.address.map((address, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1 mr-3">
                    <div className="text-xs text-gray-500 mb-1">地址 {index + 1}</div>
                    <div className="text-sm font-mono text-gray-900 break-all">{address}</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0 h-8"
                    onClick={() => copyAddress(address)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    复制
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">暂无钱包地址</div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setWalletAddressDialogOpen(false)}
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}