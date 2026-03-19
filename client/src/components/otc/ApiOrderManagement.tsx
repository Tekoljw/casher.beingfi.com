import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  RotateCcw, 
  Eye,
  CircleDollarSign,
  ArrowDown,
  ArrowUp,
  Clock,
  DollarSign,
  CreditCard,
  Shield
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn, formatLargeNumber, formatNumberWithCommas } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/hooks/use-language";
import { useCurrencyList } from "@/hooks/use-currency-list";
import { useApiOrdersData, ApiOrderItem } from "@/hooks/use-api-orders-data";
import { useAgents } from "@/hooks/use-agents";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// 状态映射
const getStatusMap = (t: (key: string) => string): Record<string, string> => ({
  '0': t('otc.orders.status.unprocessed'),
  '1': '支付中',
  '2': '支付成功',
  '3': '支付失败',
  '4': '已撤销',
  '5': '已退款',
  '6': '订单关闭',
  '8': t('otc.orders.status.overdue'),
  '9': t('otc.orders.status.rejected'),
  '99': t('otc.orders.status.expired')
});

interface ApiOrderManagementProps {
  showToggleControls?: boolean;
}

export default function ApiOrderManagement({ showToggleControls = true }: ApiOrderManagementProps) {
  const { t } = useLanguage();
  
  // 状态映射
  const statusMap = getStatusMap(t);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState<string>("");
  const [searchType, setSearchType] = useState("otc");
  const [agentFilter, setAgentFilter] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ApiOrderItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("daiyingshou");

  // 判断是否在管理员后台
  const isAdmin = typeof window !== 'undefined' ? localStorage.getItem('otcRole') === '3' : false;

  // 获取币种列表
  const { data: currencyList = [], isLoading: isCurrencyListLoading } = useCurrencyList();

  // 获取供应商列表（仅在管理员后台时获取）
  const { data: agentsData } = useAgents({}, { enabled: isAdmin && !showToggleControls });
  
  // 获取所有供应商数据
  const allAgents = agentsData?.pages.flatMap(page => page.data.list) || [];

  // 获取订单数据
  const {
    data: ordersData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isOrdersLoading,
    refetch
  } = useApiOrdersData({
    currency: currencyFilter,
    status: activeTab === 'yiwancheng' ? '2' :
            activeTab === 'chaoshi' ? '6' :
            activeTab === 'yiquxiao' ? '99' : undefined,
    otype: activeTab === 'daiyingshou' ? '2' :
           activeTab === 'daifukuan' ? '1' : undefined,
    ...(searchType === 'otc' ? { orderid: searchTerm } : {}),
    ...(searchType === 'payment' ? { out_order_id: searchTerm } : {}),
    ...(searchType === 'merchant' ? { payment_order_id: searchTerm } : {}),
    ...(isAdmin && !showToggleControls && agentFilter ? { userid: agentFilter } : {}),
  });

  const { toast } = useToast();

  // 刷新数据
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: t('common.success'),
        description: t('common.refreshSuccess'),
      });
    } catch (error) {
      toast({
        title: t('error.title'),
        description: t('error.refreshFailed'),
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // 搜索处理
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      return;
    }
    setIsSearching(true);
    try {
      await refetch();
    } catch (error) {
      toast({
        title: t('error.title'),
        description: t('error.searchFailed'),
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // 键盘事件处理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 获取状态颜色类名
  const getStatusColorClass = (status: string): string => {
    switch (status) {
      case "2": // 支付成功
        return "bg-green-100 text-green-800 border-green-200";
      case "3": // 支付失败
        return "bg-red-100 text-red-800 border-red-200";
      case "4": // 已撤销
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "5": // 已退款
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "6": // 订单关闭
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "8": // 超时
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "9": // 已驳回
        return "bg-red-100 text-red-800 border-red-200";
      case "99": // 已失效
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "0": // 未处理
      case "1": // 支付中
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  // 格式化时间戳为日期时间字符串
  const formatTimestamp = (timestamp: string) => {
    if (!timestamp || timestamp === '0') return '-';
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleString();
  };

  // 查看详情
  const handleViewDetails = (order: ApiOrderItem) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  // 表格内容
  const renderTable = (orders: ApiOrderItem[], emptyMessage: string) => {
    if (isOrdersLoading || isSearching || isRefreshing) {
      return (
        <div className="w-full h-[400px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </div>
      );
    }

    const allOrders = ordersData?.pages.flatMap(page => page.data.list) || [];

    return (
      <div className="overflow-x-auto">
        {/* 在小屏幕上使用卡片式布局 */}
        <div className="md:hidden space-y-4">
          {allOrders.length === 0 ? (
            <div className="text-center p-8 text-gray-500">{emptyMessage}</div>
          ) : (
            allOrders.map((order) => (
              <Card key={order.id} className="p-4 bg-white border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900 truncate max-w-[150px]" title={`#${order.orderid}`}>#{order.orderid}</span>
                  </div>
                  <div>
                    <Badge className={cn(getStatusColorClass(order.status), "cursor-pointer")}>
                      {statusMap[order.status] || order.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-gray-500">{t('otc.orders.table.amount')}</div>
                    <div className="font-bold text-gray-900">{formatNumberWithCommas(order.amount || 0, 2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{t('otc.orders.table.currency')}</div>
                    <div className="text-gray-900">{order.currency}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">支付系统订单号</div>
                    <div className="text-gray-900 text-xs truncate" title={order.out_order_id}>{order.out_order_id || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">商户订单号</div>
                    <div className="text-gray-900 text-xs truncate" title={order.payment_order_id}>{order.payment_order_id || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">供应商名称</div>
                    <div className="text-gray-900">{order.username || `供应商${order.userid}`}</div>
                  </div>
                  {order.otype === "1" && (
                    <>
                      <div>
                        <div className="text-xs text-gray-500">收款人开户行名称</div>
                        <div className="text-gray-900">{order.bank_name || '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">收款人姓名</div>
                        <div className="text-gray-900">{order.account_name || '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">收款账号</div>
                        <div className="text-gray-900">{order.account_no || '-'}</div>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <div className="text-xs text-gray-500">订单创建时间</div>
                    <div className="text-gray-700 text-sm">{formatTimestamp(order.created_at)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">订单成功时间</div>
                    <div className="text-gray-700 text-sm">{formatTimestamp(order.success_time)}</div>
                  </div>
                </div>
                
                <div className="mt-3 flex justify-end">
                  <Button variant="outline" size="sm" className="flex items-center text-xs border-gray-300 text-gray-700 bg-gray-50 hover:bg-gray-100" onClick={() => handleViewDetails(order)}>
                    <Eye className="h-3 w-3 mr-1" />
                    {t('otc.orders.table.view')}
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
        
        {/* 桌面端表格视图 */}
        <div className="hidden md:block bg-white rounded-lg border border-gray-200 shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#f5f7fa] text-gray-600 text-sm">
                <th className="px-4 py-3 whitespace-nowrap">订单号</th>
                <th className="px-4 py-3 whitespace-nowrap">支付系统订单号</th>
                <th className="px-4 py-3 whitespace-nowrap">商户订单号</th>
                <th className="px-4 py-3 whitespace-nowrap">{t('otc.orders.table.amount')}</th>
                <th className="px-4 py-3 whitespace-nowrap">{t('otc.orders.table.currency')}</th>
                <th className="px-4 py-3 whitespace-nowrap">供应商名称</th>
                {activeTab === "daifukuan" && (
                  <>
                    <th className="px-4 py-3 whitespace-nowrap">收款人开户行名称</th>
                    <th className="px-4 py-3 whitespace-nowrap">收款人姓名</th>
                    <th className="px-4 py-3 whitespace-nowrap">收款账号</th>
                  </>
                )}
                <th className="px-4 py-3 whitespace-nowrap">订单创建时间</th>
                <th className="px-4 py-3 whitespace-nowrap">订单成功时间</th>
                <th className="px-4 py-3 whitespace-nowrap">{t('otc.orders.table.status')}</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">{t('otc.orders.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {allOrders.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === "daifukuan" ? 13 : 10} className="text-center p-8 text-gray-500">{emptyMessage}</td>
                </tr>
              ) : (
                allOrders.map((order, index) => (
                  <tr key={order.id} className={`border-t border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-50 transition-colors`}>
                    <td className="px-4 py-3 text-gray-700 text-center text-sm whitespace-nowrap">
                      <span className="text-gray-900 truncate" title={`${order.orderid}`}>{order.orderid}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-center text-sm whitespace-nowrap">
                      <span className="text-gray-900 truncate max-w-[200px]" title={order.out_order_id}>{order.out_order_id || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-center text-sm whitespace-nowrap">
                      <span className="text-gray-900 truncate max-w-[200px]" title={order.payment_order_id}>{order.payment_order_id || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-900 text-sm whitespace-nowrap">{formatNumberWithCommas(order.amount || 0, 2)}</td>
                    <td className="px-4 py-3 text-gray-700 text-sm whitespace-nowrap">{order.currency || '-'}</td>
                    <td className="px-4 py-3 text-gray-700 text-sm whitespace-nowrap">{order.username || `供应商${order.userid}`}</td>
                    {activeTab === "daifukuan" && (
                      <>
                        <td className="px-4 py-3 text-gray-700 text-sm whitespace-nowrap">{order.bank_name || '-'}</td>
                        <td className="px-4 py-3 text-gray-700 text-sm whitespace-nowrap">{order.account_name || '-'}</td>
                        <td className="px-4 py-3 text-gray-700 text-sm whitespace-nowrap">{order.account_no || '-'}</td>
                      </>
                    )}
                    <td className="px-4 py-3 text-gray-700 text-sm whitespace-nowrap">{formatTimestamp(order.created_at)}</td>
                    <td className="px-4 py-3 text-gray-700 text-sm whitespace-nowrap">{formatTimestamp(order.success_time)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className={cn(getStatusColorClass(order.status), "cursor-pointer")}>
                        {statusMap[order.status] || order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center text-xs border-gray-300 text-gray-700 bg-gray-50 hover:bg-gray-100" 
                        onClick={() => handleViewDetails(order)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        {t('otc.orders.table.view')}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {/* 加载更多按钮 */}
          {hasNextPage && (
            <div className="w-full flex justify-center p-4 border-t border-gray-200 bg-white">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {isFetchingNextPage ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                    {t('common.loading')}
                  </div>
                ) : (
                  t('loadMore')
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-2 md:p-6 bg-[#f5f7fa] min-h-[calc(100vh-64px)] rounded-lg">
      <div className="mb-4 md:mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-0 rounded-lg bg-white p-3 md:p-4 shadow-sm">
        <div className="flex items-center">
          <CircleDollarSign className="h-5 w-5 md:h-6 md:w-6 mr-2" />
          <h1 className="text-lg md:text-2xl font-bold text-gray-900">{t('otc.nav.apiOrders', 'API订单')}</h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white text-gray-600 border-gray-200 hover:bg-gray-50 font-normal text-xs md:text-sm"
            onClick={handleRefresh}
          >
            <RotateCcw className={cn("mr-1 md:mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4", isRefreshing && "animate-spin")} />
            {t('common.refresh')}
          </Button>
        </div>
      </div>
      
      {/* 统计卡片 */}
      <div className="grid grid-cols-4 md:grid-cols-4 gap-2 md:gap-4 mb-6">
        <Card className="p-2 md:p-4 bg-white border border-gray-200 shadow-sm">
          <div className="text-gray-700 text-[10px] md:text-xs mb-1 md:mb-2 rounded-lg bg-gray-50 p-1 md:p-2 leading-tight">{t('otc.orders.pendingReceiptOrders')}</div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900">
              {formatLargeNumber(ordersData?.pages[0]?.data?.report?.pending_receive_order || 0)}
            </span>
            <ArrowDown className="hidden md:flex h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 text-green-500 flex-shrink-0" />
          </div>
        </Card>
        
        <Card className="p-2 md:p-4 bg-white border border-gray-200 shadow-sm">
          <div className="text-gray-700 text-[10px] md:text-xs mb-1 md:mb-2 rounded-lg bg-gray-50 p-1 md:p-2 leading-tight">{t('otc.orders.pendingPaymentOrders')}</div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900">
              {formatLargeNumber(ordersData?.pages[0]?.data?.report?.pending_payment_order || 0)}
            </span>
            <ArrowUp className="hidden md:flex h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 text-red-500 flex-shrink-0" />
          </div>
        </Card>
        
        <Card className="p-2 md:p-4 bg-white border border-gray-200 shadow-sm">
          <div className="text-gray-700 text-[10px] md:text-xs mb-1 md:mb-2 rounded-lg bg-gray-50 p-1 md:p-2 leading-tight">{t('otc.orders.timeoutOrders')}</div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900">
              {formatLargeNumber(ordersData?.pages[0]?.data?.report?.time_out_order || 0)}
            </span>
            <Clock className="hidden md:flex h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 text-yellow-500 flex-shrink-0" />
          </div>
        </Card>
        
        <Card className="p-2 md:p-4 bg-white border border-gray-200 shadow-sm">
          <div className="text-gray-700 text-[10px] md:text-xs mb-1 md:mb-2 rounded-lg bg-gray-50 p-1 md:p-2 leading-tight">{t('otc.orders.todayOrderTotal')}</div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900">
              {formatLargeNumber(ordersData?.pages[0]?.data?.report?.today_all_order || 0)}
            </span>
            <svg className="hidden md:block h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 text-blue-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            </svg>
          </div>
        </Card>
      </div>
      
      {/* 筛选区域 */}
      <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm mb-4 md:mb-6">
        <div className="grid grid-cols-1 gap-3 md:gap-4 mb-3 md:mb-4">
          <div className="overflow-x-auto">
            <Tabs 
              value={searchType} 
              onValueChange={setSearchType}
              className="w-full tab-container"
            >
              <TabsList className="bg-[#f5f7fa] rounded-lg inline-flex md:flex gap-1 py-1 px-1 min-w-max md:min-w-0 md:w-full">
                <TabsTrigger
                  value="otc"
                  className="tab-trigger data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-[10px] md:text-xs py-1.5 px-2 md:px-3 h-auto whitespace-nowrap"
                >
                  {t('otc.orders.otcOrderNumber')}
                </TabsTrigger>
                <TabsTrigger
                  value="payment"
                  className="tab-trigger data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-[10px] md:text-xs py-1.5 px-2 md:px-3 h-auto whitespace-nowrap"
                >
                  {t('otc.orders.paymentSystemOrderNumber')}
                </TabsTrigger>
                <TabsTrigger
                  value="merchant"
                  className="tab-trigger data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-[10px] md:text-xs py-1.5 px-2 md:px-3 h-auto whitespace-nowrap"
                >
                  商户订单号
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div>
            <div className="relative h-[35px] md:h-[37px]">
              <Input
                placeholder={
                  searchType === 'otc' 
                    ? t('otc.orders.enterOtcOrderNumber') 
                    : searchType === 'payment' 
                      ? t('otc.orders.enterPaymentSystemOrderNumber')
                      : '请输入商户订单号'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pr-10 border-gray-200 bg-white rounded-lg h-full text-gray-900 text-sm"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-2"
                onClick={handleSearch}
              >
                <Search className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400" />
              </Button>
            </div>
          </div>
          
        </div>
        
        {/* 供应商筛选（仅管理员后台显示） */}
        {isAdmin && !showToggleControls && (
          <Tabs
            value={agentFilter || ""}
            onValueChange={setAgentFilter}
            className="w-full mb-3 md:mb-4"
          >
            <div className="tab-container w-full overflow-x-auto">
              <TabsList className="bg-[#f5f7fa] rounded-lg inline-flex md:flex md:flex-wrap gap-1 py-1 px-1 min-w-max md:min-w-0 md:w-full">
                <TabsTrigger 
                  value="" 
                  className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-[10px] md:text-xs py-1.5 px-2 md:px-3 h-auto whitespace-nowrap transition-all focus:outline-none"
                >
                  全部供应商
                </TabsTrigger>
                {allAgents.map((agent) => (
                  <TabsTrigger 
                    key={agent.id}
                    value={agent.id} 
                    className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-[10px] md:text-xs py-1.5 px-2 md:px-3 h-auto whitespace-nowrap transition-all focus:outline-none"
                  >
                    {agent.nickname || agent.username || `供应商${agent.id}`}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>
        )}
        
        {/* 币种筛选 */}
        <Tabs
          value={currencyFilter || ""}
          onValueChange={setCurrencyFilter}
          className="w-full mb-3 md:mb-4"
        >
          <div className="tab-container w-full overflow-x-auto">
            <TabsList className="bg-[#f5f7fa] rounded-lg inline-flex md:flex md:flex-wrap gap-1 py-1 px-1 min-w-max md:min-w-0 md:w-full">
              <TabsTrigger 
                value="" 
                className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-[10px] md:text-xs py-1.5 px-2 md:px-3 h-auto whitespace-nowrap transition-all focus:outline-none"
              >
                {t('otc.orders.all')}
              </TabsTrigger>
              {currencyList.map(item => (
                <TabsTrigger 
                  key={item.currency}
                  value={item.currency} 
                  className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-[10px] md:text-xs py-1.5 px-2 md:px-3 h-auto whitespace-nowrap transition-all focus:outline-none"
                >
                  {item.currency}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>
        
        {/* 订单类型页签 */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="tab-container w-full overflow-x-auto">
            <TabsList className="bg-[#f5f7fa] rounded-lg inline-flex md:flex md:w-full flex-nowrap md:flex-wrap gap-1 py-1 px-1 min-w-max md:min-w-0">
              <TabsTrigger 
                value="daiyingshou" 
                className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-[10px] md:text-xs py-1.5 px-2 md:px-3 h-auto whitespace-nowrap transition-all focus:outline-none"
              >
                {t('otc.orders.receiptOrders')}
              </TabsTrigger>
              <TabsTrigger 
                value="daifukuan" 
                className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-[10px] md:text-xs py-1.5 px-2 md:px-3 h-auto whitespace-nowrap transition-all focus:outline-none"
              >
                {t('otc.orders.paymentOrders')}
              </TabsTrigger>
              <TabsTrigger 
                value="yiwancheng" 
                className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-[10px] md:text-xs py-1.5 px-2 md:px-3 h-auto whitespace-nowrap transition-all focus:outline-none"
              >
                {t('otc.orders.completedOrders')}
              </TabsTrigger>
              <TabsTrigger 
                value="chaoshi" 
                className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-[10px] md:text-xs py-1.5 px-2 md:px-3 h-auto whitespace-nowrap transition-all focus:outline-none"
              >
                {t('otc.orders.timeoutOrders')}
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* TabsContent 部分 */}
          <TabsContent value="daiyingshou" className="mt-3 md:mt-4 px-0">
            {renderTable(
              ordersData?.pages.flatMap(page => page.data.list) || [],
              t('otc.orders.noPendingReceiptOrders')
            )}
          </TabsContent>
          
          <TabsContent value="daifukuan" className="mt-3 md:mt-4 px-0">
            {renderTable(
              ordersData?.pages.flatMap(page => page.data.list) || [],
              t('otc.orders.noPendingPaymentOrders')
            )}
          </TabsContent>
          
          <TabsContent value="yiwancheng" className="mt-3 md:mt-4 px-0">
            {renderTable(
              ordersData?.pages.flatMap(page => page.data.list) || [],
              t('otc.orders.noCompletedOrders')
            )}
          </TabsContent>
          
          <TabsContent value="chaoshi" className="mt-3 md:mt-4 px-0">
            {renderTable(
              ordersData?.pages.flatMap(page => page.data.list) || [],
              t('otc.orders.noTimeoutOrders')
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* 订单详情对话框 */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg bg-white max-h-[90vh] flex flex-col">
          <DialogHeader className="p-0 m-0 flex-shrink-0">
            <div className="border-b border-gray-200 pb-2">
              <DialogTitle className="text-lg font-medium text-gray-900">{t('otc.orders.details')}</DialogTitle>
            </div>
            <DialogDescription className="sr-only">{t('otc.orders.details')}</DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="mt-4 space-y-4 overflow-y-auto pr-2">
              {/* 订单号 */}
              <div className="border border-gray-200 px-4 py-3 rounded-md">
                <div className="text-gray-700 text-sm">订单号</div>
                <div className="text-gray-900">{selectedOrder.orderid}</div>
              </div>
              
              {/* 支付系统订单号 */}
              <div className="border border-gray-200 px-4 py-3 rounded-md">
                <div className="text-gray-700 text-sm">支付系统订单号</div>
                <div className="text-gray-900">{selectedOrder.out_order_id || '-'}</div>
              </div>
              
              {/* 商户订单号 */}
              <div className="border border-gray-200 px-4 py-3 rounded-md">
                <div className="text-gray-700 text-sm">商户订单号</div>
                <div className="text-gray-900">{selectedOrder.payment_order_id || '-'}</div>
              </div>
              
              {/* 金额 */}
              <div className="border border-gray-200 px-4 py-3 rounded-md">
                <div className="text-gray-700 text-sm">{t('otc.orders.table.amount')}</div>
                <div className="text-gray-900">{formatNumberWithCommas(selectedOrder.amount || 0, 2)} {selectedOrder.currency}</div>
              </div>
              
              {/* 币种 */}
              <div className="border border-gray-200 px-4 py-3 rounded-md">
                <div className="text-gray-700 text-sm">{t('otc.orders.table.currency')}</div>
                <div className="text-gray-900">{selectedOrder.currency}</div>
              </div>
              
              {/* 供应商名称 */}
              <div className="border border-gray-200 px-4 py-3 rounded-md">
                <div className="text-gray-700 text-sm">供应商名称</div>
                <div className="text-gray-900">{selectedOrder.username || `供应商${selectedOrder.userid}`}</div>
              </div>
              
              {/* 只有代付订单才显示收款信息 */}
              {selectedOrder.otype === "1" && (
                <>
                  {/* 收款人开户行名称 */}
                  <div className="border border-gray-200 px-4 py-3 rounded-md">
                    <div className="text-gray-700 text-sm">收款人开户行名称</div>
                    <div className="text-gray-900">{selectedOrder.bank_name || '-'}</div>
                  </div>
                  
                  {/* 收款人姓名 */}
                  <div className="border border-gray-200 px-4 py-3 rounded-md">
                    <div className="text-gray-700 text-sm">收款人姓名</div>
                    <div className="text-gray-900">{selectedOrder.account_name || '-'}</div>
                  </div>
                  
                  {/* 收款账号 */}
                  <div className="border border-gray-200 px-4 py-3 rounded-md">
                    <div className="text-gray-700 text-sm">收款账号</div>
                    <div className="text-gray-900">{selectedOrder.account_no || '-'}</div>
                  </div>
                </>
              )}
              
              {/* 订单创建时间 */}
              <div className="border border-gray-200 px-4 py-3 rounded-md">
                <div className="text-gray-700 text-sm">订单创建时间</div>
                <div className="text-gray-900">{formatTimestamp(selectedOrder.created_at)}</div>
              </div>
              
              {/* 订单成功时间 */}
              <div className="border border-gray-200 px-4 py-3 rounded-md">
                <div className="text-gray-700 text-sm">订单成功时间</div>
                <div className="text-gray-900">{formatTimestamp(selectedOrder.success_time)}</div>
              </div>
              
              {/* 当前状态 */}
              <div className="border border-gray-200 px-4 py-3 rounded-md">
                <div className="text-gray-700 text-sm">{t('otc.orders.details.currentStatus')}</div>
                <div className="text-gray-900">
                  <Badge className={cn(getStatusColorClass(selectedOrder.status), "cursor-pointer")}>
                    {statusMap[selectedOrder.status] || selectedOrder.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

