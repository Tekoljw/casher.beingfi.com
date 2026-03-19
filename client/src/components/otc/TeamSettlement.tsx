import { useState, useMemo, useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, Search, Filter, X, Calendar, Check, AlertTriangle, Plus, Minus, CircleDollarSign, Settings, Wallet, Eye, Copy } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useCurrencyList } from "@/hooks/use-currency-list";
import { useAgents, Agent } from '@/hooks/use-agents';
import { useTeamData, TeamMemberItem } from '@/hooks/use-team-data';
import clsx from "clsx";
import { useTeamSettlementData } from "@/hooks/use-team-settlement-data";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatNumberWithCommas } from "@/lib/utils";

interface SettlementRecord {
  id: string;
  amount: number;
  currency: string;
  finalAmount: number;
  finalCurrency: string;
  fee: number;
  status: number | string;
  date: string;
  remark: string;
  addtime: string;
  executetime: string;
  received_amount: string;
  orderid: string;
  type: number;
  rate: string;
  received_currency: string;
  actual_rate: string;
  title?: string;
}

// 格式化时间戳函数
const formatTimestamp = (timestamp: string | number | undefined): string => {
  if (!timestamp) return '-';
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString(); // Or format as needed
};

// 获取状态颜色类名函数
const getStatusColorClass = (status: number | string): string => {
  const s = String(status);
  switch (s) {
    case "1": // 待处理
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "2": // 已完成/已完清
      return "bg-green-100 text-green-800 border-green-300";
    case "3": // 已拒绝
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

export function TeamSettlement() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("all");
  const [activeCurrency, setActiveCurrency] = useState("All");
  const [activeRecordType, setActiveRecordType] = useState("settlementRecords");
  const [activeMember, setActiveMember] = useState("All");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SettlementRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<number | undefined>(undefined);
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [remark, setRemark] = useState("");
  const [actualRate, setActualRate] = useState("");
  
  // 结算设置相关状态
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settlementConfig, setSettlementConfig] = useState({
    auto_settle_wallet_address: [] as string[],
    auto_settle_enabled: false,
    auto_settle_exchange_loss: "",
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [newWalletAddress, setNewWalletAddress] = useState("");

  const typeMap: { [key: number]: string } = useMemo(() => ({
    1: t('otc.settlements.type.addDeposit', '增加保证金'),
    2: t('otc.settlements.type.reduceDeposit', '减少保证金'),
    5: t('otc.settlements.type.manualFine', '手动罚款'),
    6: t('otc.settlements.type.autoFine', '自动罚款'),
    7: t('otc.settlements.type.salaryPayment', '底薪发放'),
    8: t('otc.settlements.type.minSystemFee', '保底系统费'),
  }), [t]);

  
  // 获取币种对象数组（用于币种tab）
  const { data: currencyList = [], isLoading: isCurrencyLoading } = useCurrencyList();
  
  // 根据用户角色判断：支付供应商后台（otcRole === '1'）使用 /Api/Index/users，管理员后台使用 /Api/Index/agents
  const isAdmin = localStorage.getItem('otcRole') !== '1';
  const { data: agentsData, isLoading: isAgentsLoading } = useAgents({});
  const { data: membersData, isLoading: isMembersLoading } = useTeamData({}, 1000);
  
  // 根据角色决定使用哪个数据源
  const renderMembers = useMemo(() => {
    if (isAdmin) {
      // 管理员后台：使用 /Api/Index/agents 获取供应商数据
      if (!agentsData?.pages) return [{ user_id: 'All', id: 'All', username: t('common.all'), nickname: t('common.all')}];
      const agents = agentsData.pages.flatMap(page => page.data.list || []);
      return [
        { user_id: 'All', id: 'All', username: t('common.all'), nickname: t('common.all')},
        ...agents.map((agent: Agent) => ({
          ...agent,
          user_id: agent.id, // 使用 id 作为 user_id
        }))
      ];
    } else {
      // 支付供应商后台：使用 /Api/Index/users 获取团队成员数据
      if (!membersData?.pages) return [{ user_id: 'All', id: 'All', username: t('common.all'), nickname: t('common.all')}];
      const members = membersData.pages.flatMap(page => page.data.list || []);
      return [
        { user_id: 'All', id: 'All', username: t('common.all'), nickname: t('common.all')},
        ...members.map((member: TeamMemberItem) => ({
          ...member,
          id: member.user_id || member.id, // 确保有 id 字段
        }))
      ];
    }
  }, [agentsData, membersData, isAdmin, t]);

  const isMemberDataLoading = isAdmin ? isAgentsLoading : isMembersLoading;

  // 使用 hook 获取数据
  const getSettlementType = () => {
    switch (activeRecordType) {
      case "settlementRecords":
        return 3;
      case "increaseDeposit":
        return 1;
      case "decreaseDeposit":
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

  const { data: settlementData, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading: isSettlementsLoading, refetch: refetchSettlements, isRefetching: isSettlementsRefetching } = useTeamSettlementData({
    currency: activeCurrency === "All" ? undefined : activeCurrency,
    type: getSettlementType(),
    user_id: activeMember === 'All' ? undefined : activeMember,
    isAdmin: isAdmin
  });

  const isSearchingOrRefreshing = isSearching || isRefreshing || isSettlementsRefetching;
  
  // 筛选结算记录
  const getFilteredRecords = () => {
    // 数据过滤逻辑已移至 useSettlementData hook 中
    return settlementData?.pages.flatMap(page => page.data.list) || [];
  };

  const reportData: any = settlementData ? settlementData?.pages[0]?.data?.report : {};
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
  
  // 处理查看记录详情
  const handleViewDetail = (record: SettlementRecord) => {
    setSelectedRecord(record);
    setDetailDialogOpen(true);
  };
  
  const getStatusBadge = (status: number | string) => {
    const statusText = statusMap[Number(status)] || String(status);
    switch (statusText) {
      case t('otc.settlements.status.completed', '已完成'):
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300 flex items-center px-2 py-1">
            <Check className="h-3 w-3 mr-1" />
            {statusText}
          </Badge>
        );
      case t('otc.settlements.status.pending', '待处理'):
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 flex items-center px-2 py-1">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {statusText}
          </Badge>
        );
      case t('otc.settlements.status.rejected', '已拒绝'):
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300 flex items-center px-2 py-1">
            <X className="h-3 w-3 mr-1" />
            {statusText}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-300">
            {statusText}
          </Badge>
        );
    }
  };
  
    const statusMap: { [key: number]: string } = useMemo(() => ({
    1: t('otc.settlements.status.pending', '待处理'),
    2: t('otc.settlements.status.verified', '已审核'),
    3: t('otc.settlements.status.rejected', '已拒绝'),
    4: t('otc.settlements.status.completed', '已完成'),
  }), [t]);
    const { toast } = useToast();
    
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

  const handleApprove = async (record: SettlementRecord) => {
    try {
      if (!actualRate) {
        toast({
          title: t('otc.settlements.enterActualRate'),
          variant: "destructive",
        });
        return;
      }
      await apiRequest("POST", '/Api/Index/editSettles', {
        id: record.id,
        status: 4, // 放款成功
        actual_rate: actualRate,
        remark: remark,
        received_amount: record.received_amount
      });
      toast({
        title: t('otc.settlements.toast.operationSuccess')
      });
      
      // 关闭对话框并刷新数据
      setDetailDialogOpen(false);
      setRemark("");
      setActualRate("");
      refetchSettlements();
    } catch (error: any) {
      toast({
        title: t('otc.settlements.toast.operationFailed'),
        description: error?.message|| t('otc.settlements.toast.operationFailed'),
        variant: "destructive",
      });
      console.error('审核失败:', error);
    }
  };

  const handleReject = async (record: SettlementRecord) => {
    try {
      if (!actualRate) {
        toast({
          title: t('otc.settlements.enterActualRate'),
          variant: "destructive",
        });
        return;
      }
      await apiRequest("POST", '/Api/Index/editSettles', {
        id: record.id,
        actual_rate: actualRate,
        remark: remark,
        status: 3 // 拒绝
      });
      toast({
        title: t('otc.settlements.toast.operationSuccess'),
        description: t('otc.settlements.toast.updateSuccess'),
      });
      // 关闭对话框并刷新数据
      setDetailDialogOpen(false);
      setRemark("");
      setActualRate("");
      refetchSettlements();
    } catch (error: any) {
      toast({
        title: t('otc.settlements.toast.operationFailed'),
        description: error?.message|| t('otc.settlements.toast.operationFailed'),
        variant: "destructive",
      });
      console.error('拒绝失败:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-center mb-3 sm:mb-6">
          <h2 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900">{t('otc.nav.agentSettlements')}</h2>
          <Button 
            variant="outline" 
            className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 rounded-lg hidden"
            onClick={openSettingsDialog}
          >
            <Settings className="h-4 w-4 mr-2" />
            结算设置
          </Button>
        </div>
        
        {/* 钱包余额卡片 - 显示在第一个位置 */}
        {walletData && (
          <div className="mb-4 sm:mb-6">
            <Card className="border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="pt-3 sm:pt-4 md:pt-6 p-3 sm:p-4 md:p-6">
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
              </div>
            </Card>
          </div>
        )}
        
        {/* 统计卡片 - 移动端每行展示三个 */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
          <Card className="p-2.5 sm:p-3 md:p-4 bg-white border border-blue-200 shadow-sm">
            <div className="flex flex-col">
              <span className="text-gray-600 text-xs sm:text-sm">{t('otc.settlements.pending')}</span>
              <div className="flex items-center justify-between mt-1.5 sm:mt-2">
                <span className="text-sm sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-blue-600 break-words overflow-hidden flex-1 min-w-0 leading-tight">
                  {typeof reportData?.pending_settles === 'number' ? reportData.pending_settles.toLocaleString('en-US') : (reportData?.pending_settles || 0)}
                </span>
                <span className="text-blue-500 cursor-pointer flex-shrink-0 ml-1 hidden md:block">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 21H4.6C4.03995 21 3.75992 21 3.54601 20.891C3.35785 20.7951 3.20487 20.6422 3.10899 20.454C3 20.2401 3 19.9601 3 19.4V3M21 7L15.5657 12.4343C15.3677 12.6323 15.2687 12.7313 15.1545 12.7684C15.0541 12.8011 14.9459 12.8011 14.8455 12.7684C14.7313 12.7313 14.6323 12.6323 14.4343 12.4343L12.5657 10.5657C12.3677 10.3677 12.2687 10.2687 12.1545 10.2316C12.0541 10.1989 11.9459 10.1989 11.8455 10.2316C11.7313 10.2687 11.6323 10.3677 11.4343 10.5657L7 15M21 7H17M21 7V11" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </div>
            </div>
          </Card>
          
          <Card className="p-2.5 sm:p-3 md:p-4 bg-white border border-green-200 shadow-sm">
            <div className="flex flex-col">
              <span className="text-gray-600 text-xs sm:text-sm">{t('otc.settlements.addDeposit')}</span>
              <div className="flex items-center justify-between mt-1.5 sm:mt-2">
                <span className="text-sm sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-green-600 break-words overflow-hidden flex-1 min-w-0 leading-tight">
                  {typeof reportData?.pending_add_margin_settles === 'number' ? reportData.pending_add_margin_settles.toLocaleString('en-US') : (reportData?.pending_add_margin_settles || 0)}
                </span>
                <span className="text-green-500 flex-shrink-0 ml-1 hidden md:block">
                  <Plus className="h-5 w-5 md:h-6 md:w-6" />
                </span>
              </div>
            </div>
          </Card>
          
          <Card className="p-2.5 sm:p-3 md:p-4 bg-white border border-red-200 shadow-sm">
            <div className="flex flex-col">
              <span className="text-gray-600 text-xs sm:text-sm">{t('otc.settlements.reduceDeposit')}</span>
              <div className="flex items-center justify-between mt-1.5 sm:mt-2">
                <span className="text-sm sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-red-600 break-words overflow-hidden flex-1 min-w-0 leading-tight">
                  {typeof reportData?.pending_reduce_margin_settles === 'number' ? reportData.pending_reduce_margin_settles.toLocaleString('en-US') : (reportData?.pending_reduce_margin_settles || 0)}
                </span>
                <span className="text-red-500 flex-shrink-0 ml-1 hidden md:block">
                  <Minus className="h-5 w-5 md:h-6 md:w-6" />
                </span>
              </div>
            </div>
          </Card>
        </div>
        
        {/* 客户筛选标签 - 可滚动显示 */}
        <div className="mb-4 bg-gray-50 p-2 rounded-md overflow-x-auto whitespace-nowrap sm:whitespace-normal">
          <div className="flex space-x-2">
            { renderMembers && renderMembers.map((member: any) => (
              <Button 
                key={member.user_id || member.id}
                variant="ghost"
                className={clsx(
                  'text-gray-700 rounded-md py-1 px-3 text-sm hover:bg-gray-200 flex-shrink-0',
                  activeMember == (member.user_id || member.id) && 'bg-gray-200'
                )}
                onClick={()=> {
                  setActiveMember(member.user_id || member.id)
                }}
              >
                {member.nickname || member.username || '-'}
              </Button>
            ))}
          </div>
        </div>
        
        {/* 币种筛选 - 深蓝色背景、白色文字样式 */}
        <div className="mb-4">
          <Tabs value={activeCurrency} onValueChange={setActiveCurrency}>
            <div className="bg-blue-900 rounded-md p-1 overflow-x-auto">
              <TabsList className="bg-transparent border-0 inline-flex min-w-max">
                <TabsTrigger key="All" value="All" className="rounded-sm text-white text-sm data-[state=active]:bg-blue-700 data-[state=active]:text-white flex-shrink-0"
                  >
                    {t('common.all')}
                  </TabsTrigger>
                {currencyList.map((item) => (
                  <TabsTrigger
                    key={item.currency}
                    value={item.currency}
                    className="rounded-sm text-white text-sm data-[state=active]:bg-blue-700 data-[state=active]:text-white flex-shrink-0"
                  >
                    {item.currency}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>
        </div>
        
        {/* 记录类型标签 - 深蓝色背景、白色文字样式 */}
        <Tabs 
          defaultValue="settlementRecords" 
          className="w-full"
          value={activeRecordType}
          onValueChange={setActiveRecordType}
        >
          <TabsList className="grid w-full grid-cols-7 mb-4 bg-blue-900 rounded-md p-1">
            <TabsTrigger 
              value="settlementRecords"
              className="rounded-sm text-white text-sm data-[state=active]:bg-blue-700 data-[state=active]:text-white"
            >
              {t('otc.settlements.records')}
            </TabsTrigger>
            <TabsTrigger 
              value="increaseDeposit"
              className="rounded-sm text-white text-sm data-[state=active]:bg-blue-700 data-[state=active]:text-white"
            >
              {t('otc.settlements.addDepositAction')}
            </TabsTrigger>
            <TabsTrigger 
              value="decreaseDeposit"
              className="rounded-sm text-white text-sm data-[state=active]:bg-blue-700 data-[state=active]:text-white"
            >
              {t('otc.settlements.reduceDepositAction')}
            </TabsTrigger>
            <TabsTrigger 
              value="manualFine"
              className="rounded-sm text-white text-sm data-[state=active]:bg-blue-700 data-[state=active]:text-white"
            >
              {t('otc.settlements.type.manualFine', '手动罚款')}
            </TabsTrigger>
            <TabsTrigger 
              value="autoFine"
              className="rounded-sm text-white text-sm data-[state=active]:bg-blue-700 data-[state=active]:text-white"
            >
              {t('otc.settlements.type.autoFine', '自动罚款')}
            </TabsTrigger>
            <TabsTrigger 
              value="salaryPayment"
              className="rounded-sm text-white text-sm data-[state=active]:bg-blue-700 data-[state=active]:text-white"
            >
              {t('otc.settlements.type.salaryPayment', '底薪发放')}
            </TabsTrigger>
            <TabsTrigger 
              value="minSystemFee"
              className="rounded-sm text-white text-sm data-[state=active]:bg-blue-700 data-[state=active]:text-white"
            >
              {t('otc.settlements.type.minSystemFee', '保底系统费')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeRecordType} className="mt-0">
            {/* 响应式表格 - 桌面端 */}
            <div className="hidden md:block overflow-x-auto bg-white rounded-md border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('otc.settlements.settlementTitle')}
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('otc.settlements.orderNumber')}
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('otc.settlements.userid')}
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('otc.settlements.operateAmount')}
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('otc.settlements.operateCurrency')}
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('otc.settlements.arrivalAmount')}
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('otc.settlements.arrivalCurrency')}
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('otc.settlements.exchangeRate')}
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('otc.settlements.actualRate')}
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('otc.settlements.lossAmount')}
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('otc.settlements.status')}
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('otc.settlements.addTime')}
                    </th>
                     <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('otc.settlements.operateTime')}
                    </th>
                     <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('otc.settlements.remark')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isSettlementsLoading || isSearchingOrRefreshing || isMemberDataLoading || isCurrencyLoading ? (
                    <tr>
                      <td colSpan={14} className="text-center p-8">
                        <div className="flex flex-col items-center gap-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                          {/* <div className="text-gray-500">{t('common.loading')}</div> */}
                        </div>
                      </td>
                    </tr>
                  ) : settlementData?.pages.flatMap(page => page.data.list).length === 0 ? (
                    <tr>
                      <td colSpan={14} className="text-center p-8 text-gray-500">暂无结算记录</td>
                    </tr>
                  ) : (
                    settlementData?.pages.flatMap(page => page.data.list).map((settlement: any, index) => (
                      <tr className={`border-t border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer`}
                        onClick={() => handleViewDetail(settlement as SettlementRecord)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 truncate max-w-[150px]" title={settlement.title || '-'}>{settlement.title || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 truncate max-w-[150px]" title={settlement.orderid}>{settlement.orderid}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 truncate max-w-[150px]" title={settlement.orderid}>{settlement.user_id}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{formatNumberWithCommas(settlement.amount, 2)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{settlement.currency}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{settlement.received_amount ? formatNumberWithCommas(settlement.received_amount, 2) : '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{settlement.received_currency || '-'}</td> {/* Assuming arrival currency is same as operate currency for now */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{settlement.rate || '-'}</td> {/* Exchange rate not available in hook data */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{(settlement.actual_rate !== '0.00' && settlement.actual_rate) ?  settlement.actual_rate: '-'}</td> {/* Exchange rate not available in hook data */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{settlement.loss_amount || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getStatusBadge(settlement.status)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatTimestamp(settlement.addtime)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatTimestamp(settlement.executetime || '-')}</td>
                         <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{settlement.remark || '-'}</td>
                      </tr>
                    ))
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

            {/* 移动端卡片式布局 */}
            <div className="md:hidden space-y-4">
              {isSettlementsLoading || isSearchingOrRefreshing ? (
                <div className="w-full h-[400px] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    {/* <div className="text-gray-500">{t('common.loading')}</div> */}
                  </div>
                </div>
              ) : settlementData?.pages.flatMap(page => page.data.list).length === 0 ? (
                <div className="text-center p-8 text-gray-500">暂无数据</div>
              ) : (
                settlementData?.pages.flatMap(page => page.data.list).map((settlement) => (
                  <Card 
                    key={settlement.orderid} 
                    className="bg-white shadow-sm hover:shadow transition-shadow cursor-pointer"
                    onClick={() => handleViewDetail(settlement as unknown as SettlementRecord) }
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-3/4">
                          <p className="text-xs text-gray-500 truncate" title={settlement.title || '-'}>{settlement.title || '-'}</p>
                          <p className="text-xs text-gray-400 truncate mt-1" title={settlement.orderid}>{settlement.orderid}</p>
                        </div>
                        <div>{getStatusBadge(settlement.status)}</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-y-2 text-sm mb-2">
                        <div className="text-gray-500">{t('otc.settlements.userid')}:</div>
                        <div className="text-gray-900 font-medium">{settlement.user_id}</div>

                        <div className="text-gray-500">{t('otc.settlements.operateAmount')}:</div>
                        <div className="text-gray-900 font-medium">{formatNumberWithCommas(settlement.amount, 2)} {settlement.currency}</div>
                        
                        <div className="text-gray-500">{t('otc.settlements.arrivalAmount')}:</div>
                        <div className="text-gray-900 font-medium">{settlement.received_amount ? formatNumberWithCommas(settlement.received_amount, 2) : '-'} {settlement.received_currency}</div> {/* Assuming arrival currency is same as operate currency for now */}
                        
                        <div className="text-gray-500">{t('otc.settlements.exchangeRate')}:</div>
                        <div className="text-gray-900">{settlement.rate || '-' }</div> {/* Exchange rate not available in hook data */}

                        <div className="text-gray-500">{t('otc.settlements.actualRate')}:</div>
                        <div className="text-gray-900">{(settlement.actual_rate !== '0.00' && settlement.actual_rate) ?  settlement.actual_rate: '-'}</div> {/* Exchange rate not available in hook data */}
                        
                        <div className="text-gray-500">{t('otc.settlements.lossAmount')}:</div>
                        <div className="text-gray-900">{settlement.loss_amount || '-' }</div> {/* Exchange rate not available in hook data */}
                      </div>
                      
                      <div className="border-t pt-2 flex justify-between items-center">
                        <div className="text-xs text-gray-500">{formatTimestamp(settlement.addtime)}</div>
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          
          {/* <TabsContent value="increaseDeposit" className="mt-0">
            <div className="p-8 text-center text-gray-500">
              {t('otc.settlements.addDeposit.empty', '暂无待处理的增加保证金订单')}
            </div>
          </TabsContent>
          
          <TabsContent value="decreaseDeposit" className="mt-0">
            <div className="p-8 text-center text-gray-500">
              {t('otc.settlements.reduceDeposit.empty', '暂无待处理的减少保证金订单')}
            </div>
          </TabsContent> */}
        </Tabs>
      </div>
      
      {/* 详情对话框 */}
      {selectedRecord && (
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('otc.settlements.details', '结算详情')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('otc.settlements.settlementTitle')}</label>
                  <p className="text-sm text-gray-900">{selectedRecord.title || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('otc.settlements.orderNumber')}</label>
                  <p className="text-sm text-gray-900">{selectedRecord.orderid}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('otc.settlements.status')}</label>
                  <div>{getStatusBadge(selectedRecord.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('otc.settlements.operateAmount')}</label>
                  <p className="text-sm text-gray-900">{Number(selectedRecord.amount).toFixed(2)} {selectedRecord.currency}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('otc.settlements.arrivalAmount')}</label>
                  <p className="text-sm text-gray-900">{Number(selectedRecord.received_amount).toFixed(2)} {selectedRecord.received_currency}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('otc.settlements.addTime')}</label>
                  <p className="text-sm text-gray-900">{formatTimestamp(selectedRecord.addtime)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('otc.settlements.operateTime')}</label>
                  <p className="text-sm text-gray-900">{formatTimestamp(selectedRecord.executetime || '-' )}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">{t('otc.settlements.exchangeRate')}</label>
                  <p className="text-sm text-gray-900">{selectedRecord.rate || '-' }</p>
                </div>

                { (selectedRecord.status === '1' || selectedRecord.status === '2') ? 
                
                <div>
                  <Label htmlFor="exchangeRate" className="text-sm font-medium text-gray-500">{t('otc.settlements.actualRate')}</Label>
                  <Input
                      id="exchangeRate"
                      placeholder={t('otc.settlements.enterActualRate')}
                      value={actualRate}
                      type="number"
                      onChange={(e) => setActualRate(e.target.value)}
                      className="w-full bg-white border-gray-300 text-gray-700 mt-1"
                    />
                </div> :
                <div>
                  <label className="text-sm font-medium text-gray-500 mt-1">{t('otc.settlements.actualRate')}</label>
                  <p className="text-sm text-gray-900">{ selectedRecord.actual_rate || '-' }</p>
                </div>
                }

                { (selectedRecord.status === '1' || selectedRecord.status === '2') ? 
                
                <div>
                  <Label htmlFor="remark" className="text-sm font-medium text-gray-500">{t('otc.settlements.remark')}</Label>
                  <Input
                      id="remark"
                      placeholder="请输入备注"
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      className="w-full bg-white border-gray-300 text-gray-700 mt-1"
                    />
                </div>: 
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('otc.settlements.remark')}</label>
                  <p className="text-sm text-gray-900">{selectedRecord.remark || '-' }</p>
                </div>
                }
              </div>
              
              {getStatusBadge(selectedRecord.status).props.children[1] === t('otc.settlements.status.pending', '待处理') && (
                <div className="flex space-x-2 justify-end mt-4">
                  <Button 
                    variant="outline" 
                    className="bg-white border-gray-300 text-gray-700"
                    onClick={() => handleReject(selectedRecord)}
                  >
                    {t('otc.settlements.action.reject', '拒绝')}
                  </Button>
                  <Button 
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => handleApprove(selectedRecord)}
                  >
                    {t('otc.settlements.action.approve', '通过')}
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* 结算设置对话框 */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium text-gray-900">结算设置</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              配置自动结算相关参数
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
                  自动结算钱包地址
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="wallet_address"
                    placeholder="请输入钱包地址"
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
                    添加
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
                  <p className="text-xs text-gray-500">暂无钱包地址，请添加</p>
                )}
              </div>
              
              {/* 是否开启自动结算 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto_settle_enabled" className="text-sm font-medium text-gray-700">
                    是否开启自动结算
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
                  自动结算汇损差
                </Label>
                <Input
                  id="exchange_loss"
                  placeholder="请输入汇损差"
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
                <p className="text-xs text-gray-500">请输入汇损差值（例如：0.01 表示1%）</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSettingsOpen(false)}
              className="mr-2 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              取消
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={isLoadingSettings}
              className="bg-black text-white hover:bg-gray-800"
            >
              保存
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