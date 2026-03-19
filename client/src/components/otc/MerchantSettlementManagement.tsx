import { useState, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Receipt, Search, Check, Copy, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// 类型定义
interface SettlementRequest {
  id: string; // 显示用的申请编号（title + id）
  settlementId: string; // API返回的原始ID，用于API调用
  merchantName: string;
  merchantId: string;
  currency: string;
  amount: number;
  usdtAmount: number;
  usdtAddress: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  exchangeRate: number;
  rejectReason?: string;
  rate?: string;
  actualRate?: string;
  receivedAmount?: number;
  receivedCurrency?: string;
}

// API响应类型
interface SettlementApiItem {
  id: string;
  is_team: string;
  user_id: string;
  type: string;
  orderid: string;
  currency: string;
  received_currency: string;
  amount: string;
  received_amount: string;
  status: string;
  rate: string;
  actual_rate: string;
  loss_amount: string;
  remark: string;
  address: string | null;
  addtime: string;
  executetime: string;
  title: string;
  merchart_name: string;
}

interface SettlementsApiResponse {
  code: number;
  msg?: string;
  data?: {
    page?: {
      total: number;
      all_page: number;
      current_page: number;
      page_size: number;
    };
    list?: SettlementApiItem[];
  };
}

// 将API响应数据转换为SettlementRequest格式
const convertApiSettlementToSettlementRequest = (apiItem: SettlementApiItem): SettlementRequest => {
  // 状态映射：1 -> pending, 3 -> rejected, 4 -> approved
  const statusMap: Record<string, "pending" | "approved" | "rejected"> = {
    "1": "pending",
    "3": "rejected",
    "4": "approved",
  };
  const status = statusMap[apiItem.status] || "pending";

  // 转换时间戳为日期字符串
  const createdAt = apiItem.addtime && apiItem.addtime !== "0"
    ? new Date(parseInt(apiItem.addtime) * 1000).toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : new Date().toLocaleString("zh-CN");

  const amount = parseFloat(apiItem.amount) || 0;
  const receivedAmount = parseFloat(apiItem.received_amount) || 0;
  const rate = parseFloat(apiItem.rate) || 1;
  const actualRate = parseFloat(apiItem.actual_rate) || rate;

  // 申请编号：title + id
  const id = `${apiItem.title || ""}${apiItem.id}`.trim();

  return {
    id,
    settlementId: apiItem.id, // 保存原始ID用于API调用
    merchantName: apiItem.merchart_name || "",
    merchantId: apiItem.user_id || "",
    currency: apiItem.currency || "",
    amount,
    usdtAmount: receivedAmount || (amount / actualRate),
    usdtAddress: apiItem.address || "",
    status,
    createdAt,
    exchangeRate: actualRate || rate,
    rejectReason: apiItem.remark || undefined,
    rate: apiItem.rate,
    actualRate: apiItem.actual_rate,
    receivedAmount,
    receivedCurrency: apiItem.received_currency || "USDT",
  };
};

// 商户结算管理组件
export function MerchantSettlementManagement() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [merchantIdSearch, setMerchantIdSearch] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [viewRejectReasonOpen, setViewRejectReasonOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SettlementRequest | null>(null);
  const [confirmExchangeRate, setConfirmExchangeRate] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // 将日期字符串转换为秒级时间戳
  const dateToTimestamp = (dateStr: string): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return Math.floor(date.getTime() / 1000).toString();
  };

  // 状态映射：组件状态 -> API状态
  const getStatusForApi = (status: string): string | undefined => {
    if (status === "all") return undefined;
    const statusMap: Record<string, string> = {
      "pending": "1",
      "rejected": "3",
      "approved": "4",
    };
    return statusMap[status];
  };

  // 使用useInfiniteQuery获取结算列表
  const {
    data: settlementsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery<SettlementsApiResponse>({
    queryKey: ["merchantSettlements", statusFilter, merchantIdSearch, startDate, endDate],
    queryFn: async ({ pageParam = 1 }) => {
      const params: any = {
        pageNum: pageParam,
        pageSize: 15,
      };

      // 添加状态筛选
      const apiStatus = getStatusForApi(statusFilter);
      if (apiStatus) {
        params.status = apiStatus;
      }

      // 添加商户ID搜索
      if (merchantIdSearch.trim()) {
        params.user_id = merchantIdSearch.trim();
      }

      // 添加时间范围
      if (startDate) {
        params.starttime = dateToTimestamp(startDate);
      }
      if (endDate) {
        // 结束时间设置为当天的23:59:59
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        params.endtime = Math.floor(endDateObj.getTime() / 1000).toString();
      }

      const response = await apiRequest<SettlementsApiResponse>(
        'POST',
        '/api/Index/merchartSettles',
        params
      );
      return response;
    },
    getNextPageParam: (lastPage) => {
      const { all_page, current_page } = lastPage.data?.page || {};
      if (current_page && all_page && current_page < all_page) {
        return current_page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 0,
    refetchInterval: false,
  });

  // 将API数据转换为SettlementRequest数组
  const settlementRequests = useMemo(() => {
    if (!settlementsData?.pages) return [];
    const allSettlements: SettlementRequest[] = [];
    settlementsData.pages.forEach((page) => {
      if (page.data?.list) {
        page.data.list.forEach((item) => {
          allSettlements.push(convertApiSettlementToSettlementRequest(item));
        });
      }
    });
    return allSettlements;
  }, [settlementsData]);


  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleConfirmPayment = (req: SettlementRequest) => {
    setSelectedRequest(req);
    setConfirmExchangeRate(req.exchangeRate.toString());
    setConfirmDialogOpen(true);
  };

  const [isSubmittingConfirm, setIsSubmittingConfirm] = useState(false);
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  const handleSubmitConfirm = async () => {
    if (!selectedRequest || !confirmExchangeRate || parseFloat(confirmExchangeRate) <= 0) {
      return;
    }

    setIsSubmittingConfirm(true);
    try {
      const rate = parseFloat(confirmExchangeRate);
      const receivedAmount = selectedRequest.amount / rate;

      const response = await apiRequest<{ code: number; msg?: string; data?: any }>(
        'POST',
        '/api/Index/editMerchartSettles',
        {
          id: selectedRequest.settlementId,
          status: "4", // 确认
          rate: rate.toString(),
          actual_rate: rate.toString(),
          received_currency: "USDT",
          received_amount: receivedAmount.toFixed(2),
          remark: "",
        }
      );

      if (response.code === 200 || response.code === 0) {
        toast({
          title: "确认成功",
          description: "商户结算已确认",
        });
        setConfirmDialogOpen(false);
        setSelectedRequest(null);
        setConfirmExchangeRate("");
        // 刷新列表
        refetch();
      } else {
        throw new Error(response.msg || "确认失败");
      }
    } catch (error: any) {
      console.error('确认结算失败:', error);
      toast({
        title: "确认失败",
        description: error.message || "网络错误，请重试",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingConfirm(false);
    }
  };

  const handleRejectPayment = (req: SettlementRequest) => {
    setSelectedRequest(req);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleSubmitReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) {
      return;
    }

    setIsSubmittingReject(true);
    try {
      const response = await apiRequest<{ code: number; msg?: string; data?: any }>(
        'POST',
        '/api/Index/editMerchartSettles',
        {
          id: selectedRequest.settlementId,
          status: "3", // 拒绝
          rate: selectedRequest.rate || "0",
          actual_rate: selectedRequest.actualRate || selectedRequest.rate || "0",
          received_currency: "USDT",
          received_amount: "0",
          remark: rejectReason.trim(),
        }
      );

      if (response.code === 200 || response.code === 0) {
        toast({
          title: "拒绝成功",
          description: "商户结算已拒绝",
        });
        setRejectDialogOpen(false);
        setSelectedRequest(null);
        setRejectReason("");
        // 刷新列表
        refetch();
      } else {
        throw new Error(response.msg || "拒绝失败");
      }
    } catch (error: any) {
      console.error('拒绝结算失败:', error);
      toast({
        title: "拒绝失败",
        description: error.message || "网络错误，请重试",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const handleSearch = () => {
    setMerchantIdSearch(searchInput);
    // 重置到第一页
    refetch();
  };

  // 当筛选条件变化时，重新获取数据
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    // 状态变化会自动触发query重新执行
  };

  // 当日期变化时，重新获取数据
  const handleDateChange = () => {
    // 日期变化会自动触发query重新执行
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      pending: { label: "待处理", className: "bg-yellow-100 text-yellow-800" },
      approved: { label: "已确认", className: "bg-green-100 text-green-800" },
      rejected: { label: "已拒绝", className: "bg-red-100 text-red-800" },
    };
    const { label, className } = config[status] || { label: status, className: "bg-gray-100 text-gray-800" };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>{label}</span>;
  };

  const calculatedUsdtAmount = selectedRequest && confirmExchangeRate 
    ? (selectedRequest.amount / parseFloat(confirmExchangeRate)).toFixed(2)
    : "0.00";

  return (
    <div className="space-y-4 md:space-y-6 bg-white rounded-lg p-4 md:p-6 min-h-[calc(100vh-64px)]">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 md:h-6 md:w-6 text-gray-900" />
          <h2 className="text-lg md:text-xl font-bold text-gray-900">商户结算</h2>
        </div>
      </div>

      {/* 筛选区域 - 响应式布局 */}
      <div className="mb-4 md:mb-6 space-y-3">
        {/* 状态筛选 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="bg-gray-100 p-1 rounded-lg inline-flex gap-1 overflow-x-auto">
            {[
              { value: "all", label: "全部" },
              { value: "pending", label: "待处理" },
              { value: "approved", label: "已确认" },
              { value: "rejected", label: "已拒绝" },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => handleStatusFilterChange(item.value)}
                className={`px-3 md:px-4 py-2 text-xs md:text-sm rounded-md transition-colors whitespace-nowrap ${
                  statusFilter === item.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                data-testid={`filter-status-${item.value}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* 时间检索和搜索框 - 桌面端显示在同一行 */}
          <div className="hidden md:flex items-center gap-3">
            {/* 时间检索 */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  handleDateChange();
                }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-testid="input-start-date"
              />
              <span className="text-gray-400">至</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  handleDateChange();
                }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-testid="input-end-date"
              />
            </div>

            {/* 搜索框 */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索商户ID..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
                  data-testid="input-merchant-search"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
                data-testid="button-search"
              >
                搜索
              </button>
            </div>
          </div>
        </div>

        {/* 移动端时间和搜索 */}
        <div className="md:hidden space-y-3">
          {/* 时间检索 */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                handleDateChange();
              }}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="input-start-date-mobile"
            />
            <span className="text-gray-400 text-sm">至</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                handleDateChange();
              }}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="input-end-date-mobile"
            />
          </div>

          {/* 搜索框 */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索商户ID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-testid="input-merchant-search-mobile"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
              data-testid="button-search-mobile"
            >
              搜索
            </button>
          </div>
        </div>
      </div>

      {/* 结算申请列表 - 桌面端表格 */}
      <div className="hidden md:block border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm font-medium text-black">申请编号</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-black">商户信息</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-black">结算金额</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-black">USDT金额</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-black">USDT地址</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-black">状态</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-black">申请时间</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-black">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : settlementRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    暂无结算申请
                  </td>
                </tr>
              ) : (
                settlementRequests.map((req, index) => (
                <tr 
                  key={req.id} 
                  className={`border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                  data-testid={`row-settlement-${req.id}`}
                >
                  <td className="py-3 px-4 text-sm font-mono text-black">{req.id}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-black">{req.merchantName}</span>
                      <span className="text-xs text-gray-500">{req.merchantId}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-black">
                    {req.currency} {req.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-green-600">
                    {req.usdtAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-mono text-gray-600 truncate max-w-[120px]">
                        {req.usdtAddress}
                      </span>
                      <button
                        onClick={() => copyToClipboard(req.usdtAddress)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="复制地址"
                        data-testid={`button-copy-address-${req.id}`}
                      >
                        {copiedAddress === req.usdtAddress ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(req.status)}</td>
                  <td className="py-3 px-4 text-sm text-black">{req.createdAt}</td>
                  <td className="py-3 px-4 text-right">
                    {req.status === "pending" ? (
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => handleConfirmPayment(req)}
                          className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                          data-testid={`button-confirm-${req.id}`}
                        >
                          确认付款
                        </button>
                        <button 
                          onClick={() => handleRejectPayment(req)}
                          className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 transition-colors" 
                          data-testid={`button-reject-${req.id}`}
                        >
                          拒绝
                        </button>
                      </div>
                    ) : req.status === "rejected" && req.rejectReason ? (
                      <button
                        onClick={() => {
                          setSelectedRequest(req);
                          setViewRejectReasonOpen(true);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                        data-testid={`button-view-reject-reason-${req.id}`}
                      >
                        查看拒绝理由
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 结算申请列表 - 移动端卡片 */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            加载中...
          </div>
        ) : settlementRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            暂无结算申请
          </div>
        ) : (
          settlementRequests.map((req) => (
          <div 
            key={req.id}
            className="border border-gray-200 rounded-lg p-4 bg-white"
            data-testid={`card-settlement-${req.id}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-sm font-medium text-gray-900">{req.merchantName}</div>
                <div className="text-xs text-gray-500">{req.merchantId}</div>
              </div>
              {getStatusBadge(req.status)}
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">申请编号</span>
                <span className="font-mono text-gray-900">{req.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">结算金额</span>
                <span className="font-medium text-gray-900">{req.currency} {req.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">USDT金额</span>
                <span className="font-medium text-green-600">{req.usdtAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">USDT地址</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-mono text-gray-600 truncate max-w-[120px]">{req.usdtAddress}</span>
                  <button
                    onClick={() => copyToClipboard(req.usdtAddress)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    data-testid={`button-copy-address-mobile-${req.id}`}
                  >
                    {copiedAddress === req.usdtAddress ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">申请时间</span>
                <span className="text-gray-600">{req.createdAt}</span>
              </div>
            </div>

            {req.status === "pending" ? (
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                <button 
                  onClick={() => handleConfirmPayment(req)}
                  className="flex-1 px-3 py-2 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  data-testid={`button-confirm-mobile-${req.id}`}
                >
                  确认付款
                </button>
                <button 
                  onClick={() => handleRejectPayment(req)}
                  className="flex-1 px-3 py-2 text-sm font-medium bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                  data-testid={`button-reject-mobile-${req.id}`}
                >
                  拒绝
                </button>
              </div>
            ) : req.status === "rejected" && req.rejectReason ? (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => {
                    setSelectedRequest(req);
                    setViewRejectReasonOpen(true);
                  }}
                  className="w-full px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                  data-testid={`button-view-reject-reason-mobile-${req.id}`}
                >
                  查看拒绝理由
                </button>
              </div>
            ) : null}
          </div>
        ))
        )}
      </div>

      {/* 加载更多按钮 */}
      {hasNextPage && (
        <div className="mt-4 md:mt-6 text-center">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full md:w-auto px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-load-more"
          >
            {isFetchingNextPage ? "加载中..." : `加载更多`}
          </button>
        </div>
      )}

      {/* 确认付款弹窗 */}
      {confirmDialogOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">确认付款</h3>
                <button 
                  onClick={() => setConfirmDialogOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  data-testid="button-close-dialog"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* 商户信息 */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">商户名称</span>
                    <span className="text-sm font-medium text-gray-900">{selectedRequest.merchantName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">商户ID</span>
                    <span className="text-sm font-mono text-gray-900">{selectedRequest.merchantId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">结算金额</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedRequest.currency} {selectedRequest.amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* USDT地址 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">USDT收款地址</label>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                    <span className="text-xs font-mono text-gray-600 flex-1 break-all">
                      {selectedRequest.usdtAddress}
                    </span>
                    <button
                      onClick={() => copyToClipboard(selectedRequest.usdtAddress)}
                      className="p-1.5 hover:bg-gray-200 rounded transition-colors shrink-0"
                      title="复制地址"
                      data-testid="button-copy-dialog-address"
                    >
                      {copiedAddress === selectedRequest.usdtAddress ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 汇率输入 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    确认汇率 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={confirmExchangeRate}
                    onChange={(e) => setConfirmExchangeRate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入汇率"
                    data-testid="input-exchange-rate"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    1 USDT = {confirmExchangeRate || "0"} {selectedRequest.currency}
                  </p>
                </div>

                {/* 计算结果 */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-700">实际支付USDT</span>
                    <span className="text-lg font-bold text-blue-900">{calculatedUsdtAmount} USDT</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setConfirmDialogOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  data-testid="button-cancel-confirm"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitConfirm}
                  disabled={!confirmExchangeRate || parseFloat(confirmExchangeRate) <= 0 || isSubmittingConfirm}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-submit-confirm"
                >
                  {isSubmittingConfirm ? "确认中..." : "确认付款"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 拒绝理由弹窗 */}
      {rejectDialogOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">拒绝结算申请</h3>
                <button 
                  onClick={() => setRejectDialogOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  data-testid="button-close-reject-dialog"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* 申请信息 */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">申请编号</span>
                    <span className="text-sm font-mono text-gray-900">{selectedRequest.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">商户名称</span>
                    <span className="text-sm font-medium text-gray-900">{selectedRequest.merchantName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">结算金额</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedRequest.currency} {selectedRequest.amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 拒绝理由输入 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    拒绝理由 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none placeholder:text-gray-400"
                    placeholder="请输入拒绝理由..."
                    rows={3}
                    data-testid="input-reject-reason"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setRejectDialogOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  data-testid="button-cancel-reject"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitReject}
                  disabled={!rejectReason.trim() || isSubmittingReject}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-submit-reject"
                >
                  {isSubmittingReject ? "拒绝中..." : "确认拒绝"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 查看拒绝理由弹窗 */}
      {viewRejectReasonOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">拒绝理由</h3>
                <button 
                  onClick={() => setViewRejectReasonOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  data-testid="button-close-view-reject-reason"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* 申请信息 */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">申请编号</span>
                    <span className="text-sm font-mono text-gray-900">{selectedRequest.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">商户名称</span>
                    <span className="text-sm font-medium text-gray-900">{selectedRequest.merchantName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">结算金额</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedRequest.currency} {selectedRequest.amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 拒绝理由显示 */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-800 mb-2">拒绝理由：</p>
                  <p className="text-sm text-red-600">{selectedRequest.rejectReason}</p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setViewRejectReasonOpen(false)}
                  className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  data-testid="button-close-view-reject-reason-bottom"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

