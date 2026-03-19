import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { LOGIN_CONFIG } from "@/config/login";
import { formatLargeNumber, formatTimestamp } from "@/lib/utils";
import { 
  BarChart3, 
  Clock, 
  CreditCard,
  User, 
  Users, 
  FileText,
  Settings, 
  LucideIcon, 
  Package2, 
  Receipt, 
  RefreshCw, 
  CircleDollarSign, 
  ChevronRight,
  ShoppingCart,
  DollarSign,
  UserCheck,
  Building,
  UserPlus,
  Globe,
  Handshake,
  Pencil,
  Trash2,
  Ban,
  ChevronDown,
  Search,
  Eye,
  X,
  AlertCircle,
  Database
} from "lucide-react";
import OtcLayout from "./OtcLayout";
import { TeamSettlement } from "./TeamSettlement";
import OrderManagement from "./OrderManagement";
import ApiOrderManagement from "./ApiOrderManagement";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import AgentDialog from "./AgentDialog";
import ConfirmDialog from "./ConfirmDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useCurrencyList, CurrencyItem } from '@/hooks/use-currency-list';
import { useAgents, Agent, AgentsResponse, editAgent, deleteAgent } from '@/hooks/use-agents';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { UseInfiniteQueryResult, InfiniteData } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';

interface SidebarItem {
  icon: LucideIcon;
  label: string;
  href?: string;
  submenu?: SidebarItem[];
  active?: boolean;
}

interface User {
  id: number;
  username: string;
  email: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

// 仪表盘卡片组件
function DashboardCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendUp, 
  description,
  currency = ""
}: { 
  title: string; 
  value: string; 
  icon: LucideIcon; 
  trend: string; 
  trendUp: boolean; 
  description: string;
  currency?: string;
}) {
  // 使用 formatLargeNumber 格式化大数值（K, M 单位）
  const formattedValue = formatLargeNumber(value);
  
  // 根据总长度（货币代码 + 数值）动态调整字体大小
  const getFontSize = (val: string, curr: string): string => {
    const totalLength = (curr ? curr.length + 1 : 0) + val.length; // +1 for space
    if (totalLength <= 10) return 'text-base sm:text-lg';
    if (totalLength <= 15) return 'text-sm sm:text-base';
    return 'text-xs sm:text-sm';
  };

  return (
    <Card className="bg-white">
      <CardContent className="p-[0.8rem] md:p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0 pr-2 md:pr-2">
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <h3 className={`${getFontSize(formattedValue, currency)} font-bold text-gray-900 whitespace-nowrap`}>
              {currency && <span className="text-gray-500 mr-1">{currency}</span>}
              <span>{formattedValue}</span>
            </h3>
          </div>
          {/* 图标：手机端隐藏，桌面端显示 */}
          <div className="hidden md:flex bg-gray-100 p-2 rounded-md flex-shrink-0">
            <Icon className="h-5 w-5 text-gray-700" />
          </div>
        </div>
        <div className="flex items-center mt-4">
          <div className={`text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'} flex items-center`}>
            {trendUp ? '↑' : '↓'} {trend}
          </div>
          <span className="text-xs text-gray-500 ml-2">{description}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// 币种类型
type CurrencyType = "CNY" | "USD" | "MMK" | "INR";

// 平台管理员（Admin）的仪表盘
export default function AdminDashboard({ user }: { user: User | null }) {
  const [activeItem, setActiveItem] = useState("dashboard");
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);
  const [activeCurrency, setActiveCurrency] = useState<string | undefined>(undefined);
  const [walletIdSearch, setWalletIdSearch] = useState<string>("");
  const [viewAccountsAgent, setViewAccountsAgent] = useState<Agent | null>(null);
  const [accountsDialogOpen, setAccountsDialogOpen] = useState(false);
  const [agentAccounts, setAgentAccounts] = useState<any[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [amountDetailAgent, setAmountDetailAgent] = useState<Agent | null>(null);
  const [isAmountDetailOpen, setIsAmountDetailOpen] = useState(false);
  const [isFineDialogOpen, setIsFineDialogOpen] = useState(false);
  const [fineAgent, setFineAgent] = useState<Agent | null>(null);
  const [fineCurrency, setFineCurrency] = useState<string>("");
  const [fineAmount, setFineAmount] = useState<string>("");
  const [fineRemark, setFineRemark] = useState<string>("");
  const [isSubmittingFine, setIsSubmittingFine] = useState(false);
  
  // 获取币种对象数组（用于币种tab）
  const { data: currencyList = [], isLoading: isCurrencyLoading } = useCurrencyList();
  
  // 页面加载后设置默认币种
  useEffect(() => {
    if (currencyList.length > 0 && !activeCurrency) {
      setActiveCurrency(currencyList[0].currency);
    }
  }, [currencyList, activeCurrency]);
  
  // 获取仪表盘数据，activeCurrency变化时自动请求
  const { data: dashboardData, isLoading: isDashboardLoading } = useDashboardData(activeCurrency, 'dashboard');

  const {
    data: agentsData,
    isLoading: isAgentsLoading,
    fetchNextPage: fetchAgentsNextPage,
    hasNextPage: hasAgentsNextPage,
    isFetchingNextPage: isFetchingAgentsNextPage,
    refetch,
  }: UseInfiniteQueryResult<InfiniteData<AgentsResponse>> = useAgents(
    walletIdSearch ? { wallet_id: walletIdSearch } : undefined
  );

  // 合并所有页面的数据
  const allAgents = agentsData?.pages.flatMap((page) => page.data.list) || [];

  // 管理员侧边栏菜单项
  const sidebarItems: SidebarItem[] = [
    {
      icon: BarChart3,
      label: t('otc.dashboard.title'),
      href: "#dashboard",
      active: activeItem === "dashboard",
    },
    {
      icon: ShoppingCart,
      label: t('otc.nav.orders', '订单管理'),
      active: activeItem === "runningScoreOrders" || activeItem === "apiOrders",
      submenu: [
        {
          icon: CreditCard,
          label: t('otc.nav.runningScoreOrders', '跑分订单'),
          href: "#runningScoreOrders",
          active: activeItem === "runningScoreOrders",
        },
        {
          icon: Database,
          label: t('otc.nav.apiOrders', 'API订单'),
          href: "#apiOrders",
          active: activeItem === "apiOrders",
        },
      ],
    },
    {
      icon: Building,
      label: t('otc.nav.agents'),
      href: "#agents",
      active: activeItem === "agents",
    },
    {
      icon: CircleDollarSign,
      label: t('otc.nav.agentSettlements'),
      href: "#settlements",
      active: activeItem === "settlements",
    },
  ];

  // 处理添加供应商
  const handleAddAgent = () => {
    setIsAddDialogOpen(true);
  };

  // 处理编辑供应商
  const handleEditAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsEditDialogOpen(true);
  };

  // 处理手动罚款
  const handleFineAgent = (agent: Agent) => {
    setFineAgent(agent);
    setFineCurrency("");
    setFineAmount("");
    setFineRemark("");
    setIsFineDialogOpen(true);
  };

  // 提交手动罚款
  const handleSubmitFine = async () => {
    if (!fineAgent || !fineCurrency || !fineAmount) {
      toast({
        title: '操作失败',
        description: '请选择币种并输入金额',
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(fineAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: '操作失败',
        description: '请输入有效的金额',
        variant: "destructive"
      });
      return;
    }

    setIsSubmittingFine(true);
    try {
      const response = await apiRequest('POST', '/Api/Index/doAgentFine', {
        currency: fineCurrency,
        amount: fineAmount,
        userid: fineAgent.user_id || fineAgent.id,
        type: 5, // 手动罚款
        remark: fineRemark || ""
      });

      if (response.code === 0) {
        toast({
          title: '操作成功',
          description: '手动罚款已提交'
        });
        setIsFineDialogOpen(false);
        setFineAgent(null);
        setFineCurrency("");
        setFineAmount("");
        setFineRemark("");
        // 刷新供应商列表数据
        await refetch();
      } else {
        toast({
          title: '操作失败',
          description: response.msg || '提交失败',
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: '操作失败',
        description: error.message || '提交失败',
        variant: "destructive"
      });
    } finally {
      setIsSubmittingFine(false);
    }
  };

  // 格式化金额
  const formatAmount = (value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === '') return '-';
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return String(value);
    return numericValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // 格式化成功率
  const formatSuccessRate = (value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === '') return '-';
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return String(value);
    return `${numericValue.toFixed(2)}%`;
  };

  // 处理查看供应商账户
  const handleViewAccounts = async (agent: Agent) => {
    setViewAccountsAgent(agent);
    setAccountsDialogOpen(true);
    setIsLoadingAccounts(true);
    try {
      // 调用API获取该供应商的账户列表
      const response = await apiRequest('POST', '/Api/Index/accountList', { 
        userid: agent.id,
        id: agent.id,
        page: 1,
        limit: 100
      });

      if (response.code === 0) {
        const accountsData = Array.isArray(response.data)
          ? response.data
          : response.data?.list || [];
        setAgentAccounts(accountsData);
      } else {
        toast({
          title: '获取账户失败',
          description: response.msg || '无法获取账户信息',
          variant: "destructive"
        });
        setAgentAccounts([]);
      }
    } catch (error: any) {
      toast({
        title: '获取账户失败',
        description: error.message || '无法获取账户信息',
        variant: "destructive"
      });
      setAgentAccounts([]);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  // 处理保存供应商
  const handleSaveAgent = async (updatedAgent: Agent) => {
    try {
      // 准备请求参数
      const params:any = {
        ...(isEditDialogOpen && { id: updatedAgent.id }), // 编辑时传入id
        receive_commission: updatedAgent.receive_commission,
        payment_commission: updatedAgent.payment_commission,
        punish_commission: updatedAgent.punish_commission,
        receive_fee: updatedAgent.receive_fee,
        payment_fee: updatedAgent.payment_fee,
        status: updatedAgent.status,
        is_system: updatedAgent.is_system || "0" // 是否为系统服务模式，默认为0（否）
      };
      
      // 如果选择了系统服务模式，传递币种服务费配置
      if (updatedAgent.is_system === "1" && updatedAgent.currency_fees) {
        params.currency_fees = updatedAgent.currency_fees;
      }
      
      // 传递通道手续费配置
      if (updatedAgent.channel_fees && Object.keys(updatedAgent.channel_fees).length > 0) {
        params.channel_fees = updatedAgent.channel_fees;
      }
      
      // 根据系统服务模式传递不同的字段
      if (updatedAgent.is_system === "1") {
        // 系统模式：传递系统最低服务费配置
        params.system_fee_currency = updatedAgent.system_fee_currency || "";
        params.system_fee_money = updatedAgent.system_fee_money || "";
        params.system_fee_starttime = updatedAgent.system_fee_starttime || "";
      } else {
        // 非系统模式：传递底薪配置
        params.salary_currency = updatedAgent.salary_currency || "";
        params.salary_money = updatedAgent.salary_money || "";
        params.salary_starttime = updatedAgent.salary_starttime || "";
      }
      
      // 根据登录模式传递不同的参数
      if (LOGIN_CONFIG.DISPLAY_MODE === 2) {
        // 模式2：传递客户名称和钱包ID
        params.nickname = updatedAgent.nickname;
        params.wallet_id = updatedAgent.wallet_id;
      } else {
        // 模式1：传递传统字段
        params.nickname = updatedAgent.nickname;
        params.username = updatedAgent.username;
        params.tg_account = updatedAgent.tg_account;
      if(updatedAgent.password){
        params.password = updatedAgent.password
        }
      }

      // 调用编辑供应商接口
      const response = await editAgent(params);

      if (response.code === 0) {
        // 刷新供应商列表数据
        await queryClient.invalidateQueries({ queryKey: ['agents'] });

        // 显示成功提示
        toast({
          title: '操作成功',
          description: isAddDialogOpen 
            ?  '添加成功'
            : '更新成功'
        });

        // 关闭对话框
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
        refetch();
      } else {
        // 显示错误提示
        toast({
          title: '失败',
          description: response.msg,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      // 显示错误提示
      toast({
        title: '失败',
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // 处理删除供应商（确认前）
  const handleDeleteAgentConfirm = (id: string) => {
    setAgentToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  // 处理删除供应商（确认后）
  const handleDeleteAgent = async () => {
    if (!agentToDelete) return;

    try {
      // 调用删除供应商接口
      const response = await deleteAgent(agentToDelete);

      if (response.code === 0) {
        // 刷新供应商列表数据
        await refetch();

        // 显示成功提示
        toast({
          title: '操作成功',
          description: '删除成功'
        });

        // 关闭确认对话框
        setIsDeleteConfirmOpen(false);
        setAgentToDelete(null);
      } else {
        // 显示错误提示
        toast({
          title: '操作失败',
          description: response.msg,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      // 显示错误提示
      toast({
        title: '操作失败',
        description: error.message || '操作失败',
        variant: "destructive"
      });
    }
  };

  // 处理禁用/启用供应商
  // 计算额度预警信息
  const calculateAmountWarning = (amount?: Agent['amount']) => {
    if (!amount || Object.keys(amount).length === 0) {
      return { items: [{ text: '正常', color: 'text-gray-600', bgColor: 'bg-gray-100' }] };
    }

    const warnings: Array<{ currency: string; text: string; percentage: number; color: string; bgColor: string }> = [];

    // 计算每个币种的剩余百分比
    for (const [currency, data] of Object.entries(amount)) {
      const margin = parseFloat(String(data.margin || 0));
      const settle = parseFloat(String(data.settle || 0));
      
      if (margin === 0) continue;
      
      // 剩余金额 = 保证金 - 待结算金额
      const remaining = margin - settle;
      // 剩余百分比 = 剩余金额 / 保证金 * 100
      const percentage = (remaining / margin) * 100;

      if (percentage < 10) {
        // 低于10%：红色
        warnings.push({ 
          currency, 
          text: `${currency}: ${remaining.toFixed(2)} (${percentage.toFixed(1)}%)`, 
          percentage,
          color: 'text-red-800',
          bgColor: 'bg-red-100'
        });
      } else if (percentage < 20) {
        // 低于20%：黄色
        warnings.push({ 
          currency, 
          text: `${currency}: ${remaining.toFixed(2)} (${percentage.toFixed(1)}%)`, 
          percentage,
          color: 'text-yellow-800',
          bgColor: 'bg-yellow-100'
        });
      }
    }

    // 按百分比排序（从低到高）
    warnings.sort((a, b) => a.percentage - b.percentage);

    // 如果全部高于20%，只显示"正常"
    if (warnings.length === 0) {
      return { items: [{ text: '正常', color: 'text-gray-600', bgColor: 'bg-gray-100' }] };
    }

    // 最多显示3个具体币种的预警
    const displayWarnings = warnings.slice(0, 3);

    return { items: displayWarnings };
  };

  const handleToggleAgentStatus = async (id: string) => {
    try {
      const agent = allAgents.find(a => a.id === id);
      if (!agent) return;

      // 切换状态
      const newStatus = agent.status === "1" ? "2" : "1";
      const statusText = newStatus === "1" ? t('agents.status.enable') : t('agents.status.disable');

      // 准备请求参数
      const params = {
        id: agent.id,
        nickname: agent.nickname,
        username: agent.username,
        tg_account: agent.tg_account,
        receive_commission: agent.receive_commission,
        payment_commission: agent.payment_commission,
        punish_commission: agent.punish_commission,
        receive_fee: agent.receive_fee,
        payment_fee: agent.payment_fee,
        status: newStatus // 添加状态参数
      };

      // 调用编辑供应商接口
      const response = await editAgent(params);

      if (response.code === 0) {
        // 刷新供应商列表数据
        await queryClient.invalidateQueries({ queryKey: ['agents'] });

        // 显示成功提示
        toast({
          title: '操作成功'
        });
        refetch();
      } else {
        // 显示错误提示
        toast({
          title: '失败',
          description: response.msg || t('common.operationFailed'),
          variant: "destructive"
        });
      }
    } catch (error: any) {
      // 显示错误提示
      toast({
        title: '失败',
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case '2':
        return (
          <Badge variant="outline" className="bg-gray-200 text-gray-700 border-gray-300 flex items-center">
            <span className="h-2 w-2 rounded-full bg-gray-500 mr-1.5"></span>
            {t('agents.frozen')}
          </Badge>
        );
      case "1":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 flex items-center">
            <span className="h-2 w-2 rounded-full bg-blue-500 mr-1.5"></span>
            {t('agents.normal')}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
            {t('agents.frozen')}
          </Badge>
        );
    }
  };

  return (
    <OtcLayout 
      sidebarItems={sidebarItems} 
      activeItem={activeItem} 
      setActiveItem={setActiveItem}
      user={user}
      dashboardTitle={t('otc.layout.adminDashboard')}
      role="admin"
    >
      {/* Dashboard Content - 平台总览使用白色卡片 */}
      {activeItem === "dashboard" && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          {/* 币种选项卡 - 深蓝色背景、白色文字样式 */}
          <div className="mb-4">
            <Tabs value={activeCurrency}  onValueChange={setActiveCurrency}>
              <div className="bg-blue-900 rounded-md p-1 overflow-x-auto">
                <TabsList className="bg-transparent border-0 inline-flex min-w-max">
                  {currencyList.map(item => (
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
        {/* loading效果 */}
        {(isCurrencyLoading || isDashboardLoading) ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : <>
          {/* 仪表盘卡片 */}
          <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <DashboardCard
              title={t('otc.nav.agents')}
              value={dashboardData?.data?.agent_user ?? 0}
              icon={Building}
              trend={ dashboardData?.data?.agent_change > 0 ? `+${dashboardData?.data?.agent_change}` : dashboardData?.data?.agent_change }
              trendUp={dashboardData?.data?.agent_change >0 ? true : false}
              description={t('otc.dashboard.thisMonth')}
              currency=""
            />
            <DashboardCard
              title={t('otc.dashboard.totalCustomers')}
              value={dashboardData?.data?.all_user ?? 0}
              icon={Users}
              trend={ dashboardData?.data?.all_user_change > 0 ? `+${dashboardData?.data?.all_user_change}` : dashboardData?.data?.all_user_change }
              trendUp={dashboardData?.data?.all_user_change >0 ? true : false}
              description={t('otc.dashboard.thisMonth')}
              currency=""
            />
            <DashboardCard
              title={t('otc.dashboard.collection')}
              value={dashboardData?.data?.receive_amount ?? 0}
              icon={DollarSign}
              trend={ dashboardData?.data?.receive_amount_change > 0 ? `+${dashboardData?.data?.receive_amount_change}%` : dashboardData?.data?.receive_amount_change+'%'}
              trendUp={dashboardData?.data?.receive_amount_change >0 ? true : false}
              description={t('otc.dashboard.average')}
              currency={activeCurrency}
            />
            <DashboardCard
              title={t('otc.dashboard.payment')}
              value={dashboardData?.data?.payment_amount ?? 0}
              icon={CircleDollarSign}
              trend={ dashboardData?.data?.payment_amount_change > 0 ? `+${dashboardData?.data?.payment_amount_change}%` : dashboardData?.data?.payment_amount_change+'%' }
              trendUp={dashboardData?.data?.payment_amount_change >0 ? true : false}
              description={t('otc.dashboard.average')}
              currency={activeCurrency}
            />
            <DashboardCard
              title={t('otc.dashboard.today')}
              value={dashboardData?.data?.today_amount ?? 0}
              icon={ShoppingCart}
              trend={ dashboardData?.data?.today_amount_change > 0 ? `+${dashboardData?.data?.today_amount_change}%` : dashboardData?.data?.today_amount_change+'%' }
              trendUp={dashboardData?.data?.today_amount_change >0 ? true : false}
              description={t('otc.dashboard.yesterday')}
              currency={activeCurrency}
            />
            <DashboardCard
              title={t('otc.dashboard.activeAccounts')}
              value={dashboardData?.data?.active_user ?? 0}
              icon={UserCheck}
              trend={ dashboardData?.data?.active_user_change > 0 ? `+${dashboardData?.data?.active_user_change}` : dashboardData?.data?.active_user_change }
              trendUp={dashboardData?.data?.active_user_change >0 ? true : false}
              description={t('otc.dashboard.thisMonth')}
              currency=""
            />
            <DashboardCard
              title={t('otc.dashboard.realTimeOrders')}
              value={dashboardData?.data?.order_num ?? 0}
              icon={RefreshCw}
              trend={ dashboardData?.data?.order_rate_growth > 0 ? `+${dashboardData?.data?.order_rate_growth}%` : dashboardData?.data?.order_rate_growth+'%'}
              trendUp={dashboardData?.data?.order_rate_growth >0 ? true : false}
              description={t('otc.dashboard.thisMonth')}
              currency=""
            />
            <DashboardCard
              title={t('otc.settlements.pending')}
              value={dashboardData?.data?.agent_settled_pending ?? 0}
              icon={Receipt}
              trend={ dashboardData?.data?.last_agent_settled_pending > 0 ? `+${dashboardData?.data?.last_agent_settled_pending}` : dashboardData?.data?.last_agent_settled_pending }
              trendUp={dashboardData?.data?.last_agent_settled_pending >0 ? true : false}
              description={t('otc.dashboard.yesterday')}
              currency=""
            />
          </div>
          </>
        }
        </div>
      )}
      
      {/* 订单管理内容 - 跑分订单 */}
      {activeItem === "runningScoreOrders" && <OrderManagement showToggleControls={false} />}
      
      {/* 订单管理内容 - API订单 */}
      {activeItem === "apiOrders" && <ApiOrderManagement showToggleControls={false} />}
      
      {/* 供应商管理内容 - 进一步优化移动端适配 */}
      {activeItem === "agents" && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-0">{t('otc.nav.agents')}</h2>
            <Button 
              variant="outline"
              className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50 flex items-center w-full sm:w-auto"
              onClick={handleAddAgent}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {t('common.add')}
            </Button>
          </div>
          <p className="text-gray-600 mb-4 sm:mb-6">{t('agents.list')}</p>
          
          {/* 搜索框 */}
          <div className="mb-4 sm:mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('agents.searchWalletId')}
                value={walletIdSearch}
                onChange={(e) => setWalletIdSearch(e.target.value)}
                className="pl-10 bg-white border-gray-300 text-gray-900"
              />
            </div>
          </div>
          
          {/* 供应商列表 - 桌面端 */}
          <div className="hidden md:block bg-white rounded-md overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left border-b border-gray-200">
                      <th className="py-3 px-4 text-sm font-medium text-gray-600">ID</th>
                      {LOGIN_CONFIG.DISPLAY_MODE === 2 ? (
                        <>
                          <th className="py-3 px-4 text-sm font-medium text-gray-600">{t('agents.name')}</th>
                          <th className="py-3 px-4 text-sm font-medium text-gray-600">{t('agents.walletId')}</th>
                          <th className="py-3 px-4 text-sm font-medium text-gray-600">{t('agents.status')}</th>
                          <th className="py-3 px-4 text-sm font-medium text-gray-600">
                            {t('agents.supplierType', '供应商类型')}
                          </th>
                        </>
                      ) : (
                        <>
                      <th className="py-3 px-4 text-sm font-medium text-gray-600">{t('agents.name')}</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-600">{t('agents.tgAccount')}</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-600">{t('agents.status')}</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-600">{t('agents.account')}</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-600">
                        {t('agents.supplierType', '供应商类型')}
                      </th>
                        </> 
                      )}
                      <th className="py-3 px-4 text-sm font-medium text-gray-600">
                        {t('agents.quotaWarning', '额度预警')}
                      </th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-600">{t('agents.lastActive')}</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-600">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isAgentsLoading ? (
                    <tr>
                      <td colSpan={LOGIN_CONFIG.DISPLAY_MODE === 2 ? 7 : 8} className="py-4 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        </div>
                      </td>
                    </tr>
                  ) : allAgents.length === 0 ? (
                    <tr>
                      <td colSpan={LOGIN_CONFIG.DISPLAY_MODE === 2 ? 7 : 8} className="py-4 text-center text-gray-500">
                        {t('agents.noData')}
                      </td>
                    </tr>
                  ) : (
                    allAgents.map((agent: Agent, index: number) => (
                      <tr
                        key={agent.id}
                        className={cn(
                          "border-b border-gray-200",
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        )}
                      >
                        <td className="py-3 px-4 text-sm text-gray-900">{agent.id || '-'}</td>
                        {LOGIN_CONFIG.DISPLAY_MODE === 2 ? (
                          <>
                            <td className="py-3 px-4 text-sm text-gray-900">{agent.nickname || '-'}</td>
                            <td className="py-3 px-4 text-sm text-gray-900">{agent.wallet_id || '-'}</td>
                            <td className="py-3 px-4 text-sm text-gray-900">
                              <span className={cn(
                                "px-2 py-1 rounded-full text-xs",
                                agent.status === "1" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              )}>
                                {agent.status === "1" ? t('agents.normal') : t('agents.frozen')}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <span className={cn(
                                "px-2 py-1 rounded-full text-xs",
                                agent.is_system === "1" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                              )}>
                                {agent.is_system === "1" ? "系统合作" : "普通模式"}
                              </span>
                            </td>
                          </>
                        ) : (
                          <>
                        <td className="py-3 px-4 text-sm text-gray-900">{agent.nickname || '-'}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{agent.tg_account || '-'}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs",
                            agent.status === "1" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          )}>
                            {agent.status === "1" ? t('agents.normal') : t('agents.frozen')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">{agent.username}</td>
                        <td className="py-3 px-4 text-sm">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs",
                            agent.is_system === "1" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                          )}>
                            {agent.is_system === "1" ? "系统合作" : "普通模式"}
                          </span>
                        </td>
                          </> 
                        )}
                        {(() => {
                          const warning = calculateAmountWarning(agent.amount);
                          return (
                            <td className="py-3 px-4 text-sm">
                              <div 
                                className="flex flex-col gap-1 cursor-pointer"
                                onClick={() => {
                                  setAmountDetailAgent(agent);
                                  setIsAmountDetailOpen(true);
                                }}
                              >
                                {warning.items.map((item, index) => (
                                  <span key={index} className={cn("px-2 py-1 rounded-full text-xs whitespace-nowrap", item.bgColor, item.color)}>
                                    {item.text}
                                  </span>
                                ))}
                              </div>
                            </td>
                          );
                        })()}
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {formatTimestamp(agent.last_login_time)}
                        </td>
                         <td className="py-3 px-4 text-sm">
                          <div className="flex space-x-3">
                            <button 
                              className="text-purple-600 hover:text-purple-800"
                              onClick={() => handleViewAccounts(agent)}
                              aria-label={t('agents.viewAccounts')}
                              title={t('agents.viewAccounts')}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              className="text-blue-600 hover:text-blue-800"
                              onClick={() => handleEditAgent(agent)}
                              aria-label={t('common.edit')}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button 
                              className="text-red-600 hover:text-red-800"
                              onClick={() => handleDeleteAgentConfirm(agent.id)}
                              aria-label={t('common.delete')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button 
                              className="text-gray-600 hover:text-gray-800"
                              onClick={() => handleToggleAgentStatus(agent.id)}
                              aria-label={agent.status === "1" ? t('common.disable') : t('common.enable')}
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                            <button 
                              className="text-orange-600 hover:text-orange-800"
                              onClick={() => handleFineAgent(agent)}
                              aria-label="手动罚款"
                              title="手动罚款"
                            >
                              <DollarSign className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>
          </div>
           {/* 供应商列表 - 手机端卡片式布局 */}
          <div className="md:hidden space-y-4">
            {allAgents.map((agent) => (
              <Card key={agent.id} className="bg-white shadow-sm hover:shadow transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      {LOGIN_CONFIG.DISPLAY_MODE === 2 ? (
                        <>
                          <p className="font-medium text-gray-900">{agent.nickname}</p>
                          <p className="text-sm text-gray-500">{t('agents.walletId')}: {agent.wallet_id || '-'}</p>
                        </>
                      ) : (
                        <>
                      <p className="font-medium text-gray-900">{agent.nickname}</p>
                      <p className="text-sm text-gray-500">{agent.tg_account}</p>
                        </>
                      )}
                    </div>
                    <div>{getStatusBadge(agent.status)}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-2 text-sm mb-4">
                    <div className="text-gray-500">ID:</div>
                    <div className="text-gray-900">{agent.id}</div>

                    {LOGIN_CONFIG.DISPLAY_MODE === 1 && (
                      <>
                    <div className="text-gray-500">{t('agents.account')}:</div>
                    <div className="text-gray-900">{agent.username}</div>
                      </>
                    )}
                    
                    <div className="text-gray-500">
                      {t('agents.supplierType', '供应商类型')}
                    </div>
                    <div>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs",
                        agent.is_system === "1" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                      )}>
                        {agent.is_system === "1" ? "系统合作" : "普通模式"}
                      </span>
                    </div>
                    
                    {(() => {
                      const warning = calculateAmountWarning(agent.amount);
                      return (
                        <>
                          <div className="text-gray-500">
                            {t('agents.quotaWarning', '额度预警')}:
                          </div>
                          <div 
                            className="flex flex-col gap-1 cursor-pointer"
                            onClick={() => {
                              setAmountDetailAgent(agent);
                              setIsAmountDetailOpen(true);
                            }}
                          >
                            {warning.items.map((item, index) => (
                              <span key={index} className={cn("px-2 py-1 rounded-full text-xs whitespace-nowrap", item.bgColor, item.color)}>
                                {item.text}
                              </span>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                    
                    <div className="text-gray-500">{t('agents.lastActive')}:</div>
                    <div className="text-gray-900">{formatTimestamp(agent.last_login_time)}</div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-9 w-full bg-white border-purple-300 text-purple-700 hover:bg-purple-50 flex items-center justify-center px-2"
                      onClick={() => handleViewAccounts(agent)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                      <span className="truncate text-xs">{t('agents.viewAccounts')}</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-9 w-full bg-white border-blue-300 text-blue-700 hover:bg-blue-50 flex items-center justify-center px-2"
                      onClick={() => handleEditAgent(agent)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                      <span className="truncate text-xs">{t('common.edit')}</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-9 w-full bg-white border-red-300 text-red-700 hover:bg-red-50 flex items-center justify-center px-2"
                      onClick={() => handleDeleteAgentConfirm(agent.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                      <span className="truncate text-xs">{t('common.delete')}</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-9 w-full bg-white border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center px-2"
                      onClick={() => handleToggleAgentStatus(agent.id)}
                    >
                      <Ban className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                      <span className="truncate text-xs">{agent.status === "1" ? t('common.disable') : t('common.enable')}</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-9 w-full bg-white border-orange-300 text-orange-700 hover:bg-orange-50 flex items-center justify-center px-2"
                      onClick={() => handleFineAgent(agent)}
                    >
                      <DollarSign className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                      <span className="truncate text-xs">手动罚款</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {/* 加载更多按钮 */}
          {hasAgentsNextPage && (
            <div className="flex justify-center mt-4">
              <Button
                onClick={() => fetchAgentsNextPage()}
                disabled={isFetchingAgentsNextPage}
                variant="outline"
                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {isFetchingAgentsNextPage ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                    {t('common.loading')}
                  </div>
                ) : (
                  t('common.loadMore')
                )}
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* 供应商结算内容 */}
      {activeItem === "settlements" && <TeamSettlement />}
      
      {/* 添加供应商对话框 */}
      <AgentDialog 
        isOpen={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen} 
        onSave={handleSaveAgent}
        mode="add"
      />
      
      {/* 编辑供应商对话框 */}
      {selectedAgent && (
        <AgentDialog 
          isOpen={isEditDialogOpen} 
          onOpenChange={setIsEditDialogOpen} 
          onSave={handleSaveAgent}
          mode="edit"
          initialData={selectedAgent}
        />
      )}
      
      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="确认删除"
        description="确认删除此供应商"
        onConfirm={handleDeleteAgent}
      />
      
      {/* 供应商账户列表对话框 */}
      <Dialog open={accountsDialogOpen} onOpenChange={setAccountsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-white animate-in fade-in-50 zoom-in-95 duration-300 flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-black">
              供应商详情 - {viewAccountsAgent?.nickname || viewAccountsAgent?.username}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              账户列表
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto flex-1 pr-2">
            {isLoadingAccounts ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">加载中...</span>
              </div>
            ) : agentAccounts.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                暂无账户
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">收款账户</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">收款人姓名</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">通道</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">账户余额</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">成功率</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 text-sm text-gray-900">
                      {agentAccounts.map((account: any, index: number) => {
                        const accountNumber = account.appid || account.mch_id || account.username || '-';
                        return (
                          <tr key={account.id || index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-mono text-gray-800 break-all">{accountNumber}</td>
                            <td className="px-4 py-3">{account.truename || '-'}</td>
                            <td className="px-4 py-3">{account.channel_title || '-'}</td>
                            <td className="px-4 py-3">{formatAmount(account.amount)}</td>
                            <td className="px-4 py-3">{formatSuccessRate(account.success_rate)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-3">
                  {agentAccounts.map((account: any, index: number) => {
                    const accountNumber = account.appid || account.mch_id || account.username || '-';
                    return (
                      <div
                        key={account.id || index}
                        className="rounded-lg border border-gray-200 bg-white shadow-sm p-4 space-y-2"
                      >
                        <div className="text-xs text-gray-500">收款账户</div>
                        <div className="text-sm font-mono text-gray-900 break-all">{accountNumber}</div>

                        <div className="text-xs text-gray-500">收款人姓名</div>
                        <div className="text-sm text-gray-900">{account.truename || '-'}</div>

                        <div className="text-xs text-gray-500">通道</div>
                        <div className="text-sm text-gray-900">{account.channel_title || '-'}</div>

                        <div className="text-xs text-gray-500">账户余额</div>
                        <div className="text-sm text-gray-900">{formatAmount(account.amount)}</div>

                        <div className="text-xs text-gray-500">成功率</div>
                        <div className="text-sm text-gray-900">{formatSuccessRate(account.success_rate)}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          
          <DialogFooter className="flex-shrink-0 border-t border-gray-100 pt-4 mt-4">
            <Button
              variant="outline"
              className="bg-white border-black text-black"
              onClick={() => setAccountsDialogOpen(false)}
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 额度详情 - 桌面端右侧弹窗 / 移动端居中弹窗 */}
      {isAmountDetailOpen && amountDetailAgent && (
        <>
          {/* 桌面端：右侧滑入面板 */}
          {isAmountDetailOpen && (
            <div 
              className="hidden md:block fixed inset-0 z-[100]"
              onMouseDown={(e) => {
                // 阻止所有鼠标按下事件传播到父元素
                e.stopPropagation();
              }}
              onClick={(e) => {
                // 阻止所有点击事件传播到父元素
                e.stopPropagation();
              }}
            >
              {/* 背景遮罩 - 不响应任何点击事件 */}
              <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity pointer-events-none" />
              {/* 右侧弹窗 */}
              <div className="fixed inset-y-0 right-0 z-[101] pointer-events-none">
                <div 
                  className="bg-white w-full max-w-3xl h-full shadow-xl overflow-y-auto pointer-events-auto"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    // 不要 preventDefault，否则会阻止滚动
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {amountDetailAgent.nickname}-额度详情
                      </h2>
                      <button
                        onClick={() => setIsAmountDetailOpen(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                  {amountDetailAgent.amount && Object.keys(amountDetailAgent.amount).length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="py-3 px-4 text-sm font-medium text-gray-700">币种</th>
                              <th className="py-3 px-4 text-sm font-medium text-gray-700">保证金</th>
                              <th className="py-3 px-4 text-sm font-medium text-gray-700">待结算金额</th>
                              <th className="py-3 px-4 text-sm font-medium text-gray-700">总额度</th>
                              <th className="py-3 px-4 text-sm font-medium text-gray-700">已使用额度</th>
                              <th className="py-3 px-4 text-sm font-medium text-gray-700">剩余额度</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(amountDetailAgent.amount).map(([currency, data]) => {
                              const margin = parseFloat(String(data.margin || 0));
                              const settle = parseFloat(String(data.settle || 0));
                              
                              // 剩余金额 = 保证金 - 待结算金额
                              const remaining = margin - settle;
                              // 剩余百分比 = 剩余金额 / 保证金 * 100
                              const percentage = margin > 0 ? (remaining / margin) * 100 : 0;
                              
                              // 确定颜色
                              let textColor = 'text-gray-900';
                              if (percentage < 10) {
                                textColor = 'text-red-600';
                              } else if (percentage < 20) {
                                textColor = 'text-yellow-600';
                              }

                              // 格式化数字
                              const formatNumber = (num: number) => {
                                return num.toLocaleString('en-US', { 
                                  minimumFractionDigits: 2, 
                                  maximumFractionDigits: 2 
                                });
                              };

                              return (
                                <tr key={currency} className="border-b border-gray-100">
                                  <td className="py-3 px-4 text-sm text-gray-900">{currency}</td>
                                  <td className="py-3 px-4 text-sm text-gray-900">{formatNumber(margin)}</td>
                                  <td className="py-3 px-4 text-sm text-gray-900">{formatNumber(settle)}</td>
                                  <td className="py-3 px-4 text-sm text-gray-900">{formatNumber(margin)}</td>
                                  <td className="py-3 px-4 text-sm text-gray-900">{formatNumber(settle)}</td>
                                  <td className={`py-3 px-4 text-sm ${textColor}`}>
                                    {formatNumber(remaining)} ({percentage.toFixed(1)}%)
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mt-6 space-y-2 text-sm text-gray-600">
                        <p>保证金: 供应商缴纳的保证金金额</p>
                        <p>待结算金额: 尚未结算的交易金额</p>
                        <p>
                          <span className="text-red-600">红色</span>: 剩余额度&lt;10%, 
                          <span className="text-yellow-600 ml-2">黄色</span>: 剩余额度&lt;20%
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      暂无额度信息
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 移动端：居中弹窗 */}
          <Dialog 
            open={isAmountDetailOpen} 
            onOpenChange={(open) => {
              // PC端不允许通过点击外部关闭，只能通过关闭按钮
              if (window.innerWidth >= 768) {
                // 如果是PC端，不允许关闭（除非用户点击关闭按钮）
                return;
              }
              setIsAmountDetailOpen(open);
            }}
          >
            <DialogContent className="md:hidden max-w-[95vw] max-h-[85vh] bg-white flex flex-col overflow-hidden">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  {amountDetailAgent.nickname}-额度详情
                </DialogTitle>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {amountDetailAgent.amount && Object.keys(amountDetailAgent.amount).length > 0 ? (
                  <>
                    {Object.entries(amountDetailAgent.amount).map(([currency, data]) => {
                      const margin = parseFloat(String(data.margin || 0));
                      const settle = parseFloat(String(data.settle || 0));
                      
                      // 剩余金额 = 保证金 - 待结算金额
                      const remaining = margin - settle;
                      // 剩余百分比 = 剩余金额 / 保证金 * 100
                      const percentage = margin > 0 ? (remaining / margin) * 100 : 0;
                      
                      // 确定颜色
                      let textColor = 'text-gray-900';
                      let bgColor = 'bg-gray-50';
                      if (percentage < 10) {
                        textColor = 'text-red-600';
                        bgColor = 'bg-red-50';
                      } else if (percentage < 20) {
                        textColor = 'text-yellow-600';
                        bgColor = 'bg-yellow-50';
                      }

                      // 格式化数字
                      const formatNumber = (num: number) => {
                        return num.toLocaleString('en-US', { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        });
                      };

                      return (
                        <div key={currency} className={`${bgColor} rounded-lg p-4 border border-gray-200`}>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-base font-semibold text-gray-900">{currency}</h3>
                            <span className={`text-sm font-medium ${textColor}`}>
                              剩余额度: {formatNumber(remaining)} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">保证金</p>
                              <p className="text-sm font-medium text-gray-900">{formatNumber(margin)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">待结算金额</p>
                              <p className="text-sm font-medium text-gray-900">{formatNumber(settle)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">总额度</p>
                              <p className="text-sm font-medium text-gray-900">{formatNumber(margin)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">已使用额度</p>
                              <p className="text-sm font-medium text-gray-900">{formatNumber(settle)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    <div className="mt-4 space-y-2 text-xs text-gray-600 pt-4 border-t border-gray-200">
                      <p>保证金: 供应商缴纳的保证金金额</p>
                      <p>待结算金额: 尚未结算的交易金额</p>
                      <p>
                        <span className="text-red-600">红色</span>: 剩余额度&lt;10%, 
                        <span className="text-yellow-600 ml-1">黄色</span>: 剩余额度&lt;20%
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    暂无额度信息
                  </div>
                )}
              </div>
              
              <DialogFooter className="flex-shrink-0 mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsAmountDetailOpen(false)}
                  className="w-full"
                >
                  关闭
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* 手动罚款对话框 */}
      <Dialog open={isFineDialogOpen} onOpenChange={setIsFineDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-black">手动罚款</DialogTitle>
            <DialogDescription className="text-gray-600">
              为供应商 {fineAgent?.nickname || fineAgent?.username} 添加手动罚款
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="fine-currency" className="text-sm font-medium text-gray-700">
                币种
              </label>
              <Select value={fineCurrency} onValueChange={setFineCurrency}>
                <SelectTrigger id="fine-currency" className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="请选择币种" />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-900">
                  {currencyList.map((currency) => (
                    <SelectItem key={currency.id} value={currency.currency} className="text-gray-900">
                      {currency.currency} {currency.desc && `(${currency.desc})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="fine-amount" className="text-sm font-medium text-gray-700">
                金额
              </label>
              <Input
                id="fine-amount"
                type="number"
                step="0.01"
                value={fineAmount}
                onChange={(e) => setFineAmount(e.target.value)}
                placeholder="请输入罚款金额"
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="fine-remark" className="text-sm font-medium text-gray-700">
                罚款原因
              </label>
              <Input
                id="fine-remark"
                type="text"
                value={fineRemark}
                onChange={(e) => setFineRemark(e.target.value)}
                placeholder="请输入罚款原因"
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsFineDialogOpen(false)}
              disabled={isSubmittingFine}
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              取消
            </Button>
            <Button
              onClick={handleSubmitFine}
              disabled={isSubmittingFine || !fineCurrency || !fineAmount}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isSubmittingFine ? '提交中...' : '确认提交'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OtcLayout>
  );
}