import { useState, useEffect } from "react";
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
  Code,
  Terminal,
  Globe,
  Zap,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Info,
  Database
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useCurrencyList, CurrencyItem } from '@/hooks/use-currency-list';
import { formatLargeNumber, formatTimestamp } from "@/lib/utils";
import OtcLayout from "./OtcLayout";
import OrderManagement from "./OrderManagement";
import ApiOrderManagement from "./ApiOrderManagement";
import AccountManagement from "./AccountManagement";
import TeamManagement from "./TeamManagement";
import { PlatformSettlement } from "./PlatformSettlement";
import { TeamSettlement } from "./TeamSettlement";
import { SubMerchantsManagement } from "./SubMerchantsManagement";
import { MerchantSettlementManagement } from "./MerchantSettlementManagement";
import { MySettings } from "./MySettings";
import { MyReports } from "./MyReports";
import { ApiManagement } from "./ApiManagement";
import { ApiInterfaceManagement } from "./ApiInterfaceManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

// 统计卡片组件
interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  iconColor: string;
}

function StatsCard({ title, value, icon: Icon, iconColor }: StatsCardProps) {
  // 格式化数值（如果是数字）
  const formattedValue = typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value))) 
    ? formatLargeNumber(value) 
    : value;
  
  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 flex justify-between items-center">
      <div className="flex-1">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <div className="mt-1">
          <span className="text-gray-900 font-bold" style={{ fontSize: '0.8rem' }}>{formattedValue}</span>
        </div>
      </div>
      {/* 图标：手机端隐藏，桌面端显示 */}
      <div className={`hidden md:flex p-2 rounded-lg ${iconColor}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

// 趋势卡片组件
interface TrendCardProps {
  title: string;
  value: string;
  trend?: 'up' | 'down';
  icon?: LucideIcon;
  iconColor: string;
}

function TrendCard({ title, value, trend, icon: CustomIcon, iconColor }: TrendCardProps) {
  const Icon = trend === 'up' ? TrendingUp : 
              trend === 'down' ? TrendingDown : 
              CustomIcon || Info;
  
  // 格式化数值（如果是数字）
  const formattedValue = typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value))) 
    ? formatLargeNumber(value) 
    : value;
  
  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 flex justify-between items-center">
      <div className="flex-1">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <div className="mt-1">
          <span className="text-gray-900 font-bold" style={{ fontSize: '0.8rem' }}>{formattedValue}</span>
        </div>
      </div>
      {/* 图标：手机端隐藏，桌面端显示 */}
      <div className={`hidden md:flex p-2 rounded-lg ${trend === 'up' ? 'bg-green-50' : trend === 'down' ? 'bg-red-50' : 'bg-blue-50'}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
    </div>
  );
}

// 日期卡片组件
interface DateCardProps {
  title: string;
  value: string;
  iconColor: string;
  skipFormatting?: boolean; // 是否跳过格式化
}

function DateCard({ title, value, iconColor, skipFormatting = false }: DateCardProps) {
  // 如果 skipFormatting 为 true，直接显示原始值；否则格式化数值（如果是数字），日期字符串保持不变
  const formattedValue = skipFormatting 
    ? value
    : (typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)) && value !== 'N/A') 
      ? formatLargeNumber(value) 
      : value);
  
  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 flex justify-between items-center">
      <div className="flex-1">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <div className="mt-1">
          <span className="text-gray-900 font-bold" style={{ fontSize: '0.8rem' }}>{formattedValue}</span>
        </div>
      </div>
      {/* 图标：手机端隐藏，桌面端显示 */}
      <div className={`hidden md:flex p-2 rounded-lg ${iconColor}`}>
        <Clock className="h-5 w-5" />
      </div>
    </div>
  );
}

// 兜底函数，保证所有字段有值
function safeCurrencyData(data: any, currency: string, timeRange: string): Record<string, string | number> {
  const d = data?.[currency] || {};
  return {
    [`${timeRange}_receive_amount`]: d[`${timeRange}_receive_amount`] ?? '0',
    [`${timeRange}_receive_fee`]: d[`${timeRange}_receive_fee`] ?? '0',
    [`${timeRange}_receive_status`]: d[`${timeRange}_receive_status`] ?? 0,
    [`${timeRange}_paymeny_amount`]: d[`${timeRange}_paymeny_amount`] ?? '0',
    [`${timeRange}_paymeny_fee`]: d[`${timeRange}_paymeny_fee`] ?? '0',
    [`${timeRange}_paymeny_status`]: d[`${timeRange}_paymeny_status`] ?? 0,
    // 可根据UI需要继续补充其它字段
  };
}

// 供应商（Agent）的仪表盘
export default function AgentDashboard({ user }: { user: User | null }) {
  const { t } = useLanguage();
  const [activeItem, setActiveItem] = useState("dashboard");
  const [activeCurrency, setActiveCurrency] = useState<string | undefined>(undefined);

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

  // 数据快报数据
  const { data: reportsData, isLoading: isReportsLoading } = useDashboardData(undefined, 'dashboard_reposts');
  // 数据快报币种key数组（字符串数组）
  const reportCurrencyKeys = Object.keys(reportsData?.data || {});
  const [activeTimeRangeMap, setActiveTimeRangeMap] = useState<{ [currency: string]: string }>({});

  // 供应商侧边栏菜单项 - 已移除所有二级菜单
  const sidebarItems: SidebarItem[] = [
    {
      icon: BarChart3,
      label: t('otc.nav.dashboard'),
      href: "#dashboard",
      active: activeItem === "dashboard",
    },
    {
      icon: ShoppingCart,
      label: t('otc.nav.orders'),
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
      icon: DollarSign,
      label: t('otc.nav.accounts'),
      href: "#accounts",
      active: activeItem === "accounts",
    },
    {
      icon: CircleDollarSign,
      label: t('otc.nav.settlements'),
      href: "#settlements",
      active: activeItem === "settlements",
    },
    {
      icon: Users,
      label: t('otc.nav.team'),
      href: "#team",
      active: activeItem === "team",
    },
    {
      icon: Code,
      label: t('otc.nav.apiInterfaces', 'API接口管理'),
      href: "#apiInterfaces",
      active: activeItem === "apiInterfaces",
    },
    {
      icon: Clock,
      label: t('otc.settlements.team'),
      href: "#teamSettlements",
      active: activeItem === "teamSettlements",
    },
    {
      icon: Users,
      label: "下级商户",
      href: "#subMerchants",
      active: activeItem === "subMerchants",
    },
    {
      icon: Receipt,
      label: "商户结算",
      href: "#merchantSettlement",
      active: activeItem === "merchantSettlement",
    },
    {
      icon: Settings,
      label: t('otc.nav.config'),
      href: "#mySettings",
      active: activeItem === "mySettings",
    },
    {
      icon: FileText,
      label: t('otc.nav.reports'),
      href: "#myReports",
      active: activeItem === "myReports",
    },
    {
      icon: Code,
      label: t('otc.nav.api'),
      href: "#api",
      active: activeItem === "api",
    },
  ];
  
  return (
    <OtcLayout 
      sidebarItems={sidebarItems} 
      activeItem={activeItem} 
      setActiveItem={setActiveItem}
      user={user}
      dashboardTitle={t('otc.layout.agentDashboard')}
      role="agent"
    >
      {/* Dashboard Content */}
      {activeItem === "dashboard" && (
        <div className="space-y-6">
          {/* 仪表盘卡片 */}
          <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">{t('otc.dashboard.title')}</h2>
            {/* 动态币种tab */}
            <Tabs value={activeCurrency} className="w-full" onValueChange={setActiveCurrency}>
              <div className="bg-[#f5f7fa] rounded-lg overflow-hidden w-full p-1.5">
                <TabsList className="bg-transparent border-0 w-full flex justify-start gap-x-2 p-0">
                  {currencyList.map(item => (
                    <TabsTrigger
                      key={item.currency}
                      value={item.currency}
                      className="currency-tab-trigger flex-none min-w-[55px] rounded-lg"
                    >
                      {item.currency}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              {/* loading效果 */}
              {(isCurrencyLoading || isDashboardLoading) ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatsCard
                  title={t('otc.dashboard.realTimeOrders')}
                      value={dashboardData?.data?.order_num ?? 0}
                  icon={ShoppingCart}
                  iconColor="text-[#3b82f6] bg-blue-50"
                />
                <StatsCard
                  title={t('otc.dashboard.activeAccounts')}
                      value={dashboardData?.data?.active_user ?? 0}
                  icon={UserCheck}
                  iconColor="text-[#10b981] bg-green-50"
                />
                <StatsCard
                  title={t('otc.dashboard.subordinateCount')}
                      value={dashboardData?.data?.all_user ?? 0}
                  icon={Users}
                  iconColor="text-[#8b5cf6] bg-purple-50"
                />
                <TrendCard
                  title={t('otc.dashboard.realTimeCollection')}
                      value={dashboardData?.data?.receive_amount ?? 0}
                      trend={dashboardData?.data?.receive_trend === "up" ? "up" : "down"}
                  iconColor="text-green-500"
                />
                <TrendCard
                  title={t('otc.dashboard.realTimePayment')}
                      value={dashboardData?.data?.payment_amount ?? 0}
                      trend={dashboardData?.data?.paymeny_trend === "up" ? "up" : "down"}
                  iconColor="text-red-500"
                />
                <TrendCard
                  title={t('otc.dashboard.currentBalance')}
                      value={dashboardData?.data?.unsettled_amount ?? 0}
                  icon={Info}
                  iconColor="text-blue-500"
                />
                <DateCard
                  title={t('otc.dashboard.lastLoginTime')}
                      value={formatTimestamp(dashboardData?.data?.last_login_time)}
                  iconColor="text-amber-500 bg-amber-50"
                  skipFormatting={true}
                />
                <DateCard
                  title={t('otc.dashboard.lastOperationTime')}
                      value={formatTimestamp(dashboardData?.data?.last_operate_time)}
                  iconColor="text-purple-500 bg-purple-50"
                  skipFormatting={true}
                />
                <DateCard
                  title={t('otc.dashboard.totalCommission')}
                      value={dashboardData?.data?.fee_amount ?? 0}
                  iconColor="text-emerald-500 bg-emerald-50"
                />
              </div>
                </>
              )}
            </Tabs>
          </div>
          
          {/* 数据快报 */}
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('otc.dashboard.dataReport')}</h2>
            {reportCurrencyKeys.map(currency => {
              const currencyData = reportsData?.data?.[currency] || {};
              return (
                <div key={currency} className="space-y-3">
                  <h3 className="text-[#1e2834] font-medium">{currency}</h3>
                  <Tabs
                    value={activeTimeRangeMap[currency] || 'today'}
                    onValueChange={newValue => setActiveTimeRangeMap(prev => ({ ...prev, [currency]: newValue }))}
                    className="w-full"
                  >
                <div className="rounded-md overflow-hidden w-full">
                    <TabsList className="bg-transparent border-0 w-full grid grid-cols-4 gap-1 p-0">
                        <TabsTrigger value="today">{t('otc.dashboard.today')}</TabsTrigger>
                        <TabsTrigger value="yesterday">{t('otc.dashboard.yesterday')}</TabsTrigger>
                        <TabsTrigger value="month">{t('otc.dashboard.thisMonth')}</TabsTrigger>
                        <TabsTrigger value="all">{t('otc.dashboard.total')}</TabsTrigger>
                    </TabsList>
                  </div>
                    {['today', 'yesterday', 'month', 'all'].map(range => {
                      // 代收和代付的status
                      const receiveStatus = currencyData[`${range}_receive_status`] ?? 0;
                      const paymenyStatus = currencyData[`${range}_paymeny_status`] ?? 0;
                      // 箭头渲染函数
                      const renderArrow = (status: number) => {
                        if (status > 0) return <ArrowUp className="h-3 w-3 text-green-500 ml-1" />;
                        if (status < 0) return <ArrowDown className="h-3 w-3 text-red-500 ml-1" />;
                        return null;
                      };
                      return (
                        <TabsContent key={range} value={range} className="mt-3">
                          <div className="bg-[#f8fafc] rounded-md p-4">
                            <div className="grid grid-cols-4 gap-2">
                              <div className="flex items-center space-x-1">
                                        {renderArrow(receiveStatus)}
                                        <span className="text-gray-700">{t('otc.dashboard.collection')}</span>
                              </div>
                              <div></div>
                              <div className="flex items-center space-x-1">
                                        {renderArrow(paymenyStatus)}
                                        <span className="text-gray-700">{t('otc.dashboard.payment')}</span>
                              </div>
                              <div></div>
                            </div>
                                    <div className="otc-data-grid mt-2 grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2">
                                      {/* 代收金额 */}
                              <div className="bg-white p-3 rounded-md">
                                <div className="flex items-center">
                                          <span className="text-gray-500 text-sm">{t('otc.dashboard.amount')}</span>
                                          {renderArrow(receiveStatus)}
                                </div>
                                        <p className="otc-data-value text-gray-900 text-sm font-semibold">
                                          {currencyData[`${range}_receive_amount`] ?? 0}
                                        </p>
                              </div>
                                      {/* 代收平均值 */}
                              <div className="bg-white p-3 rounded-md">
                                <div className="flex items-center">
                                          <span className="text-gray-500 text-sm">{t('otc.dashboard.average')}</span>
                                          {renderArrow(receiveStatus)}
                                </div>
                                        <p className="otc-data-value text-gray-900 text-sm font-semibold">
                                          {currencyData[`${range}_receive_fee`] ?? 0}
                                        </p>
                              </div>
                                      {/* 代付金额 */}
                              <div className="bg-white p-3 rounded-md">
                                <div className="flex items-center">
                                          <span className="text-gray-500 text-sm">{t('otc.dashboard.amount')}</span>
                                          {renderArrow(paymenyStatus)}
                                </div>
                                        <p className="otc-data-value text-gray-900 text-sm font-semibold">
                                          {currencyData[`${range}_paymeny_amount`] ?? 0}
                                        </p>
                              </div>
                                      {/* 代付平均值 */}
                              <div className="bg-white p-3 rounded-md">
                                <div className="flex items-center">
                                          <span className="text-gray-500 text-sm">{t('otc.dashboard.average')}</span>
                                          {renderArrow(paymenyStatus)}
                                </div>
                                        <p className="otc-data-value text-gray-900 text-sm font-semibold">
                                          {currencyData[`${range}_paymeny_fee`] ?? 0}
                                        </p>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                      );
                    })}
              </Tabs>
            </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* 订单管理页面 - 跑分订单 */}
      {activeItem === "runningScoreOrders" && (
        <OrderManagement />
      )}
      
      {/* 订单管理页面 - API订单 */}
      {activeItem === "apiOrders" && (
        <ApiOrderManagement showToggleControls={true} />
      )}
      
      {/* 账户管理页面 */}
      {activeItem === "accounts" && (
        <AccountManagement />
      )}
      
      {/* 团队管理页面 */}
      {activeItem === "team" && (
        <TeamManagement />
      )}
      
      {/* 平台结算页面 */}
      {activeItem === "settlements" && (
        <PlatformSettlement />
      )}
      
      {/* API接口管理页面 */}
      {activeItem === "apiInterfaces" && (
        <ApiInterfaceManagement isAdmin={false} />
      )}
      
      {/* 团队结算页面 */}
      {activeItem === "teamSettlements" && (
        <TeamSettlement />
      )}
      
      {/* 下级商户页面 */}
      {activeItem === "subMerchants" && (
        <SubMerchantsManagement />
      )}
      
      {/* 商户结算页面 */}
      {activeItem === "merchantSettlement" && (
        <MerchantSettlementManagement />
      )}
      
      {/* 我的配置页面 */}
      {activeItem === "mySettings" && (
        <MySettings />
      )}
      
      {/* 我的报表页面 */}
      {activeItem === "myReports" && (
        <MyReports />
      )}
      
      {/* API管理页面 */}
      {activeItem === "api" && (
        <ApiManagement />
      )}
      
      {/* Placeholder content for other sections */}
      {activeItem !== "dashboard" && activeItem !== "runningScoreOrders" && activeItem !== "apiOrders" && activeItem !== "accounts" && activeItem !== "team" && activeItem !== "settlements" && activeItem !== "apiInterfaces" && activeItem !== "teamSettlements" && activeItem !== "subMerchants" && activeItem !== "merchantSettlement" && activeItem !== "mySettings" && activeItem !== "myReports" && activeItem !== "api" && (
        <div className="flex items-center justify-center min-h-[300px] bg-white rounded-lg shadow-sm">
          <div className="text-center max-w-md p-6">
            <h3 className="text-xl font-bold text-[#1e2834] mb-2">{getPageTitle(activeItem)}</h3>
            <p className="text-gray-500">此页面正在开发中，敬请期待...</p>
          </div>
        </div>
      )}
    </OtcLayout>
  );
}

// 获取页面标题
function getPageTitle(activeItem: string): string {
  switch (activeItem) {
    case "dashboard": return "仪表盘";
    case "runningScoreOrders": return "跑分订单";
    case "apiOrders": return "API订单";
    case "accounts": return "账户管理";
    case "settlements": return "平台结算";
    case "team": return "团队管理";
    case "apiInterfaces": return "我的接口";
    case "teamSettlements": return "团队结算";
    case "subMerchants": return "下级商户";
    case "merchantSettlement": return "商户结算";
    case "mySettings": return "我的配置";
    case "myReports": return "我的报表";
    case "api": return "API管理";
    default: return "功能页面";
  }
}