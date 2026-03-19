import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  ArrowUp, 
  ArrowDown, 
  Clock, 
  Eye, 
  RotateCcw, 
  Ban, 
  Check,
  CircleDollarSign,
  CreditCard,
  User,
  Calendar,
  Banknote,
  Hand,
  X,
  DollarSign,
  Shield,
  Download,
  Send,
  Upload
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn, formatLargeNumber, formatNumberWithCommas } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
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
import { useOrdersData, OrderItem, OrdersResponse } from "@/hooks/use-orders-data";
import { useAccountData, AccountItem } from "@/hooks/use-account-data";
import { useTeamData, TeamMemberItem } from "@/hooks/use-team-data";
import { LOGIN_CONFIG } from "@/config/login";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// 状态映射 - 将在组件内使用 t() 函数
const getStatusMap = (t: (key: string) => string): Record<string, string> => ({
  '0': t('otc.orders.status.unprocessed'),
  '1': t('otc.orders.status.pending'),
  '2': t('otc.orders.status.processing'),
  '3': t('otc.orders.status.completed'),
  '8': t('otc.orders.status.overdue'),
  '9': t('otc.orders.status.rejected'),
  '99': t('otc.orders.status.expired')
});

// 订单类型映射 - 将在组件内使用 t() 函数
const getOrderTypeMap = (t: (key: string) => string): Record<string, string> => ({
  '2': t('otc.dashboard.collection'),
  '1': t('otc.dashboard.payment')
});

interface OrderManagementProps {
  showToggleControls?: boolean; // 是否显示暂停收款/暂停放款控制
}

export default function OrderManagement({ showToggleControls = true }: OrderManagementProps) {
  const { t } = useLanguage();
  
  // 状态映射
  const statusMap = getStatusMap(t);
  
  // 订单类型映射
  const orderTypeMap = getOrderTypeMap(t);
  const [searchTerm, setSearchTerm] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState<string>("");
  const [staffFilter, setStaffFilter] = useState<string>(""); // 业务员筛选
  const [searchType, setSearchType] = useState("otc");
  
  // 判断是否是业务员登录
  const otcRole = typeof window !== 'undefined' ? localStorage.getItem('otcRole') : null;
  const isStaff = otcRole === '2'; // 业务员角色
  // 支付供应商后台且不是业务员登录时才显示业务员搜索
  const shouldShowStaffFilter = showToggleControls && !isStaff;
  const [receiveEnabled, setReceiveEnabled] = useState(false);
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmHandOpen, setConfirmHandOpen] = useState(false);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [orderToComplete, setOrderToComplete] = useState<OrderItem | null>(null);
  const [orderToReject, setOrderToReject] = useState<OrderItem | null>(null);
  const [lastFiveDigits, setLastFiveDigits] = useState<string>('');
  const [paymentAccount, setPaymentAccount] = useState<string>('');
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<OrderItem | null>(null);
  const [activeTab, setActiveTab] = useState("daiyingshou");
  const [orderid, setOrderid] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportStartTime, setExportStartTime] = useState('');
  const [exportEndTime, setExportEndTime] = useState('');
  const [exportCurrency, setExportCurrency] = useState('all');
  const [exportOrderType, setExportOrderType] = useState('all');
  const [exportTimeType, setExportTimeType] = useState('create'); // 'create' 创建时间, 'complete' 完成时间
  const [exportStatus, setExportStatus] = useState('all'); // 订单状态
  const [isExporting, setIsExporting] = useState(false);
  const [paymentProof, setPaymentProof] = useState<string>('');
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const paymentProofInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedPaymentAccountId, setSelectedPaymentAccountId] = useState<string>('');
  const [rejectContent, setRejectContent] = useState<string>('');

  // 获取币种列表
  const { data: currencyList = [], isLoading: isCurrencyListLoading } = useCurrencyList();
  
  // 获取业务员列表（仅支付供应商后台，非业务员登录）
  const { data: teamData } = useTeamData({}, 100, { enabled: shouldShowStaffFilter });
  const allTeamMembers = teamData?.pages.flatMap(page => page.data.list) || [];

  // 获取订单数据
  const {
    data: ordersData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isOrdersLoading,
    refetch
  } = useOrdersData({
    currency: currencyFilter,
    status: activeTab === 'yiwancheng' ? '3' :
            activeTab === 'chaoshi' ? '8' :
            activeTab === 'yiquxiao' ? '99' : undefined,
    otype: activeTab === 'daiyingshou' ? '2' :
           activeTab === 'daifukuan' ? '1' : undefined,
    ...(searchType === 'otc'? { orderid: searchTerm } : {}),
    ...(searchType === 'payment' ? { out_order_id: searchTerm } : {}),
    ...(searchType === 'user'? { userid: searchTerm } : {}),
    ...(searchType === 'uniqueId'? { return_order_id: searchTerm } : {}),
    // 业务员筛选（仅在支付供应商后台且未使用user搜索时）
    ...(shouldShowStaffFilter && staffFilter && searchType !== 'user' ? { userid: staffFilter } : {})
  });

  // 新增：监听ordersData变化后自动设置按钮状态
  useEffect(() => {
    if (ordersData?.pages?.[0]?.data?.report) {
      setReceiveEnabled(ordersData.pages[0].data.report.auto_sell_status == 1);
      setPaymentEnabled(ordersData.pages[0].data.report.auto_buy_status == 1);
    }
  }, [ordersData]);

  useEffect(() => {
    if (!confirmOpen) {
      setPaymentProof('');
      setIsUploadingProof(false);
      setSelectedPaymentAccountId('');
      setPaymentAccount('');
      hasSetDefaultAccount.current = false;
      currentOrderId.current = null;
      if (paymentProofInputRef.current) {
        paymentProofInputRef.current.value = '';
      }
    }
  }, [confirmOpen]);

  const { toast } = useToast();

  // 处理图片URL（去掉@符号）
  const getImageUrl = (url: string | undefined) => {
    if (!url) return '';
    return url.startsWith('@') ? url.substring(1) : url;
  };

  // 打开图片预览
  const handleImagePreview = (url: string | undefined) => {
    if (!url) return;
    const imageUrl = getImageUrl(url);
    if (imageUrl) {
      setSelectedImageUrl(imageUrl);
      setImageDialogOpen(true);
    }
  };

  // 上传付款截图
  const handlePaymentProofChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: '请选择图片文件',
        variant: 'destructive',
      });
      event.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: '图片大小不能超过2MB',
        variant: 'destructive',
      });
      event.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploadingProof(true);
      const response = await apiRequest('POST', '/Api/Index/uploadImage', formData);

      if ((response as any).code === 0 && (response as any).data?.path) {
        setPaymentProof((response as any).data.path);
        toast({
          title: '上传成功',
          variant: 'default',
        });
      } else {
        toast({
          title: (response as any).msg || '上传失败',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: error.message || '上传失败',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingProof(false);
      if (paymentProofInputRef.current) {
        paymentProofInputRef.current.value = '';
      }
      event.target.value = '';
    }
  };

  // 清除付款截图
  const handleRemovePaymentProof = () => {
    setPaymentProof('');
    if (paymentProofInputRef.current) {
      paymentProofInputRef.current.value = '';
    }
  };

  const paymentProofPreviewUrl = paymentProof ? getImageUrl(paymentProof) : '';

  // 打开导出对话框
  const handleExport = () => {
    setExportDialogOpen(true);
  };

  // 格式化日期时间为 YYYY-MM-DD HH:mm:ss 格式
  const formatDateTimeForAPI = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // 执行导出操作
  const handleConfirmExport = async () => {
    try {
      setIsExporting(true);

      // 验证时间范围
      if (!exportStartTime || !exportEndTime) {
        toast({
          title: t('error.title'),
          description: t('otc.orders.selectTimeRange'),
          variant: "destructive",
        });
        setIsExporting(false);
        return;
      }

      const startDate = new Date(exportStartTime);
      const endDate = new Date(exportEndTime);
      
      if (startDate > endDate) {
        toast({
          title: t('error.title'),
          description: t('otc.orders.invalidTimeRange'),
          variant: "destructive",
        });
        setIsExporting(false);
        return;
      }

      // 构建请求参数
      const params: any = {
        time_type: exportTimeType === 'create' ? '1' : '2',
        starttime: formatDateTimeForAPI(exportStartTime),
        endtime: formatDateTimeForAPI(exportEndTime),
      };

      if (exportCurrency && exportCurrency !== 'all') {
        params.currency = exportCurrency;
      }

      if (exportOrderType && exportOrderType !== 'all') {
        params.otype = exportOrderType;
      }

      if (exportStatus && exportStatus !== 'all') {
        params.status = exportStatus;
      }

      // 调用导出API获取数据
      const response = await apiRequest<{code: number; msg: string; data: OrderItem[]}>('POST', '/api/index/exportOrderList', params);
      
      if (response.code !== 0) {
        toast({
          title: t('otc.orders.export.failed'),
          description: response.msg || t('error.getAccountsFailedMessage'),
          variant: "destructive",
        });
        setIsExporting(false);
        return;
      }

      const exportOrders = response.data || [];
      
      if (exportOrders.length === 0) {
        toast({
          title: t('error.title'),
          description: t('otc.orders.noDataInRange'),
          variant: "destructive",
        });
        setIsExporting(false);
        return;
      }

      // 订单状态映射
      const statusTextMap: Record<string, string> = {
        '1': t('otc.orders.status.pending'),
        '2': t('otc.orders.status.processing'),
        '3': t('otc.orders.status.completed'),
        '8': t('otc.orders.status.timeout'),
        '9': t('otc.orders.status.rejected'),
        '99': t('otc.orders.status.unverified')
      };

      // 订单类型映射
      const orderTypeTextMap: Record<string, string> = {
        '1': t('otc.dashboard.payment'),
        '2': t('otc.dashboard.collection')
      };

      // 准备CSV数据
      const headers = [
        t('otc.orders.table.orderType'),
        t('otc.orders.table.orderAmount'),
        t('otc.orders.table.orderNumber'),
        t('otc.orders.table.externalOrderNumber'),
        t('otc.orders.table.realName'),
        t('otc.orders.table.bankName'),
        t('otc.orders.table.collectionAccount'),
        t('otc.orders.table.payerName'),
        t('otc.orders.table.payerBankName'),
        t('otc.orders.table.createTime'),
        t('otc.orders.table.confirmTime'),
        t('otc.orders.table.updateTime'),
        t('otc.orders.table.orderExpireTime'),
        t('otc.orders.table.lastFiveDigits'),
        t('otc.orders.table.orderStatus'),
        t('otc.orders.table.remarks')
      ];

      const csvContent = [
        headers.join(','),
        ...exportOrders.map(order => [
          orderTypeTextMap[order.otype] || '-',
          order.real_amount || '-',
          order.orderid || '-',
          order.out_order_id || '-',
          order.truename || '-',
          order.bankcity || '-',
          order.bankcard || '-',
          order.return_account_name || '-',
          order.return_bank_name || '-',
          formatTimestamp(order.addtime),
          formatTimestamp(order.endtime),
          formatTimestamp(order.updatetime),
          formatTimestamp(order.overtime),
          order.return_order_id ? order.return_order_id.slice(-5) : '-',
          statusTextMap[order.status] || order.status,
          order.remarks || '-'
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // 添加 BOM 以支持中文
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      // 生成文件名
      const fileName = `${t('otc.orders.export.fileName')}_${new Date().toLocaleDateString().replace(/\//g, '-')}_${new Date().toLocaleTimeString().replace(/:/g, '-')}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: t('otc.orders.export.success'),
        description: t('otc.orders.export.successMessage').replace('{count}', exportOrders.length.toString()),
      });

      // 关闭对话框并重置表单
      setExportDialogOpen(false);
      setExportStartTime('');
      setExportEndTime('');
      setExportCurrency('all');
      setExportOrderType('all');
      setExportTimeType('create');
      setExportStatus('all');
    } catch (error: any) {
      console.error('导出失败:', error);
      toast({
        title: t('otc.orders.export.failed'),
        description: error.message || t('otc.orders.export.error'),
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // 处理搜索
  const handleSearch = () => {
    setIsSearching(true);
    refetch().finally(() => {
      setIsSearching(false);
    });
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 处理刷新操作
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refetch();
    } catch (error: any) {
      console.error('刷新数据失败:', error);
      toast({
        title: '操作失败',
        description: error.message || '刷新失败',
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // 处理查看订单详情
  const handleViewDetails = (order: OrderItem) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const handleMatchDetails = (order: OrderItem) => {
    setSelectedOrder(order);
    setConfirmHandOpen(true);
  };

  const confirmMannalMatch = async () => {
    try {
      if (!orderid) {
        toast({
          title: '请输入订单号',
          variant: "destructive",
        });
        return;
      }
      const result = await apiRequest('POST', '/Api/Index/paymentMatchOrder', { id: selectedOrder?.id, return_order_id: selectedOrder?.return_order_id, orderid: orderid});
      
      if (result.code === 0) {
        toast({
          title: t('common.success'),
          description: '操作成功',
        });
        // 刷新页面数据
        refetch();
        setConfirmHandOpen(false);
        setOrderid('');
        setSelectedOrder(null);
      } else {
        toast({
          title: '操作失败',
          description: result.msg || '操作失败',
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('匹配订单错误:', error);
      toast({
        title: '操作失败',
        description: error.message || '操作失败',
        variant: "destructive",
      });
    }
  };

  const completeConfirmOrder = async() => {
    try{
      // 如果是代付订单且不是模式1，必须输入付款账户
      if (orderToComplete?.otype === '1' && LOGIN_CONFIG.DISPLAY_MODE !== 1) {
        if (!paymentAccount.trim()) {
          toast({
            title: '提示',
            description: '请输入付款账户',
            variant: "destructive",
          });
          return;
        }
      }
      
      // 代付订单必须上传付款截图
      if (orderToComplete?.otype === '1') {
        if (!paymentProof) {
          toast({
            title: '提示',
            description: '请上传付款截图',
            variant: 'destructive',
          });
          return;
        }
      }
      
      const params: any = {
        id: orderToComplete?.id,
        orderid: orderToComplete?.orderid
      };
      
      // 如果是代付订单且不是模式1，添加付款账户参数
      if (orderToComplete?.otype === '1' && LOGIN_CONFIG.DISPLAY_MODE !== 1) {
        params.bankcard = paymentAccount.trim();
      }
      
      if (orderToComplete?.otype === '1') {
        params.pay_proof = paymentProof;
      }
      
      // 只有模式1且不是代付订单时才处理后五位
      if (LOGIN_CONFIG.DISPLAY_MODE === 1 && orderToComplete?.otype !== '1') {
        // 检查是否需要后五位（只有模式1且订单没有后五位时才需要）
        const needsLastFive = !orderToComplete?.return_order_id || orderToComplete.return_order_id.length < 5;
        
        // 如果输入了后五位，验证长度必须是5位
        if (needsLastFive && lastFiveDigits.trim() && lastFiveDigits.trim().length !== 5) {
          toast({
            title: '提示',
            description: '后五位必须是5位数字或字母',
            variant: "destructive",
          });
          return;
        }
        
        // 如果订单没有后五位，且用户输入了后五位，则添加到参数中
        // 如果订单有后五位但用户修改了，也传递新的后五位
        if (needsLastFive && lastFiveDigits.trim()) {
          params.return_order_id = lastFiveDigits.trim();
        } else if (!needsLastFive && lastFiveDigits.trim() && 
                   lastFiveDigits.trim() !== orderToComplete?.return_order_id.slice(-5)) {
          // 订单原有后五位，但用户修改了，传递新的后五位
          params.return_order_id = lastFiveDigits.trim();
        }
      }
      // 模式2或代付订单永远不传递后五位参数
      
      const result = await apiRequest('POST', '/Api/Index/orderConfirm', params);
      
      if (result.code === 0) {
        toast({
          title: t('common.success'),
          description: '操作成功',
        });
        refetch();
        setConfirmOpen(false);
        setOrderToComplete(null);
        setLastFiveDigits('');
        setPaymentAccount('');
        setPaymentProof('');
        setSelectedPaymentAccountId('');
        hasSetDefaultAccount.current = false;
        currentOrderId.current = null;
      } else {
        toast({
          title: '操作失败',
          description: result.msg || '操作失败',
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: '操作失败',
        description: error.message || '操作失败',
        variant: "destructive",
      });
    }
  };

  const changeEnabledBtn = async(type: number) => {
    try{
      const result = await apiRequest('POST', '/Api/Index/editOrderConfig', { type: type, status: (type === 2? (!receiveEnabled == true ? 1 : 0) : (!paymentEnabled == true ? 1 : 0) )});
      
      if (result.code === 0) {
        toast({
          title: t('common.success'),
          description: '操作成功',
        });
        refetch();
      } else {
        toast({
          title: '操作失败',
          description: result.msg || '操作失败',
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: '操作失败',
        description: error.message || '操作失败',
        variant: "destructive",
      });
    }
  };

  // 处理完成订单
  const handleCompleteOrder = (order: OrderItem) => {
    // 重置选择标志，允许为新订单设置默认账户
    hasSetDefaultAccount.current = false;
    currentOrderId.current = null;
    setOrderToComplete(order);
    // 如果是代付订单，需要输入付款账户（固定为空，不设置默认值）
    if (order.otype === '1') {
      setLastFiveDigits('');
      setPaymentAccount(''); // 固定为空，等待useEffect设置默认值
      setPaymentProof(order.pay_proof || '');
      setSelectedPaymentAccountId('');
    } else {
      setPaymentAccount('');
      setPaymentProof('');
      setSelectedPaymentAccountId('');
      // 如果订单有 return_order_id，提取后五位；否则清空输入
      if (order.return_order_id && order.return_order_id.length >= 5) {
        setLastFiveDigits(order.return_order_id.slice(-5));
      } else {
        setLastFiveDigits('');
      }
    }
    setConfirmOpen(true);
  };

  // 处理查看业务员详情
  const handleViewUser = (order: OrderItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedUser(order);
    setUserDetailsOpen(true);
  };
  
  // 处理驳回订单
  const handleRejectOrder = (order: OrderItem) => {
    setOrderToReject(order);
    setRejectConfirmOpen(true);
  };
  
  // 确认驳回订单
  const confirmRejectOrder = async () => {
    try {
      if (!orderToReject) return;
      
      if (!rejectContent.trim()) {
        toast({
          title: t('error.title'),
          description: t('otc.orders.reject.reasonPlaceholder'),
          variant: "destructive",
        });
        return;
      }
      
      const result = await apiRequest('POST', '/Api/Index/rejectOrder', { 
        id: orderToReject.id, 
        orderid: orderToReject.orderid,
        content: rejectContent.trim(),
      });
      
      if (result.code === 0) {
        toast({
          title: t('common.success'),
          description: t('otc.orders.reject.success'),
        });
        refetch();
        setRejectConfirmOpen(false);
        setOrderToReject(null);
        setRejectContent('');
      } else {
        toast({
          title: t('error.operationFailed'),
          description: result.msg || t('otc.orders.reject.failed'),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: t('error.operationFailed'),
        description: error.message || t('otc.orders.reject.failed'),
        variant: "destructive",
      });
    }
  };

  // 处理补发通知
  const handleResendNotification = async (order: OrderItem) => {
    try {
      const result = await apiRequest('POST', '/Api/Index/orderSupplyConfirm', {
        orderid: order.orderid
      });
      
      if (result.code === 0) {
        toast({
          title: t('common.success'),
          description: t('otc.orders.resend.success'),
        });
        refetch();
      } else {
        toast({
          title: t('error.operationFailed'),
          description: result.msg || t('otc.orders.resend.failed'),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: t('error.operationFailed'),
        description: error.message || t('otc.orders.resend.failed'),
        variant: "destructive",
      });
    }
  };

  // 获取状态的颜色
  const getStatusColorClass = (status: string, isButton: boolean = false) => {
    const statusText = statusMap[status] || status;
    if (isButton) {
      if (status === '1') {
        return "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200";
      }
      return "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200";
    } else {
      switch (status) {
        case "2":
          return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case "3":
          return "bg-green-100 text-green-800 border-green-200";
        case "1":
          return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case "9":
          return "bg-red-100 text-red-800 border-red-200";
        case "99":
        default:
          return "bg-gray-100 text-gray-800 border-gray-200";
      }
    }
  };

  // 渲染状态单元格
  const renderStatusCell = (order: OrderItem) => {
    const statusText = statusMap[order.status];
    // 已完成、已失效、已驳回状态的订单不可确认完成
    if (order.status !== "3" && order.status !== "99" && order.status !== "9") {
      return (
        <Button 
          variant="outline" 
          size="sm" 
          className={`${getStatusColorClass(order.status, true)} border-gray-300`}
          onClick={() => handleCompleteOrder(order)}
        >
          {statusText}
        </Button>
      );
    } else {
      return (
        <Badge className={getStatusColorClass(order.status)}>
          { statusText }
        </Badge>
      );
    }
  };

  // 渲染业务员单元格
  const renderUserCell = (order: OrderItem) => {
    return (
      <button 
        className="flex items-center text-left hover:text-blue-600 hover:underline"
        onClick={(e) => handleViewUser(order, e)}
      >
        <User className="h-3.5 w-3.5 mr-1.5 text-blue-500 flex-shrink-0" />
        <span>{order.username || `业务员${order.userid}`}</span>
      </button>
    );
  };

  // 格式化时间戳为日期时间字符串
  const formatTimestamp = (timestamp: string) => {
    if (!timestamp || timestamp === '0') return '-';
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleString();
  };

  const getTaskStatusText = (taskStatus: OrderItem["last_task_status"]) => {
    const v = taskStatus?.toString?.() ?? `${taskStatus ?? ""}`;
    if (v === "1") return "失败";
    if (v === "2") return "成功";
    return "-";
  };

  const getTaskStatusClassName = (taskStatus: OrderItem["last_task_status"]) => {
    const v = taskStatus?.toString?.() ?? `${taskStatus ?? ""}`;
    if (v === "1") return "bg-red-50 text-red-700 border-red-200";
    if (v === "2") return "bg-green-50 text-green-700 border-green-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getTaskTimeInfo = (taskSuccessTime: OrderItem["last_task_success_time"]) => {
    const raw = taskSuccessTime?.toString?.() ?? `${taskSuccessTime ?? ""}`;
    const sec = Number(raw);
    if (!raw || raw === "0" || Number.isNaN(sec)) {
      return { text: "-", isStale: false };
    }
    const nowSec = Math.floor(Date.now() / 1000);
    const isStale = nowSec - sec > 300;
    return { text: new Date(sec * 1000).toLocaleString(), isStale };
  };

  const getPayoutTaskStatusText = (taskStatus: OrderItem["task_status"]) => {
    const v = taskStatus?.toString?.() ?? `${taskStatus ?? ""}`;
    if (v === "1") return "待执行";
    if (v === "2") return "处理中";
    if (v === "3") return "任务成功";
    if (v === "4") return "任务失败";
    return "-";
  };

  const getPayoutTaskStatusClassName = (taskStatus: OrderItem["task_status"]) => {
    const v = taskStatus?.toString?.() ?? `${taskStatus ?? ""}`;
    if (v === "1") return "bg-gray-50 text-gray-700 border-gray-200";
    if (v === "2") return "bg-yellow-50 text-yellow-800 border-yellow-200";
    if (v === "3") return "bg-green-50 text-green-700 border-green-200";
    if (v === "4") return "bg-red-50 text-red-700 border-red-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  // 表格内容
  const renderTable = (orders: OrderItem[], emptyMessage: string) => {
    if (isOrdersLoading || isSearching || isRefreshing) {
      return (
        <div className="w-full h-[400px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            {/* <div className="text-gray-500">{t('loading')}</div> */}
          </div>
        </div>
      );
    }

    const allOrders = ordersData?.pages.flatMap(page => page.data.list) || [];
    // 仅收款订单展示任务字段：代付订单不展示
    const shouldShowTaskColumns = activeTab !== 'daifukuan';
    // 仅代付订单展示 task_status
    const shouldShowPayoutTaskStatusColumn = activeTab === 'daifukuan';

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
                    {/* <CircleDollarSign className={`h-4 w-4 mr-1.5 ${order.otype === "2" ? "text-green-500" : "text-red-500"} flex-shrink-0`} /> */}
                    <span className="font-medium text-gray-900 truncate max-w-[150px]" title={`#${order.orderid}`}>#{order.orderid}</span>
                  </div>
                  <div>
                    {renderStatusCell(order)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-gray-500">{t('otc.orders.table.amount')}</div>
                    <div className="font-bold text-gray-900">{formatNumberWithCommas(order.num || 0, 2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{t('otc.orders.table.currency')}</div>
                    <div className="text-gray-900">{order.type}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{t('otc.orders.table.type')}</div>
                    <div className="text-gray-900">{orderTypeMap[order.otype]}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{t('otc.orders.table.username')}</div>
                    <div className="text-gray-900">{order.username}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{t('otc.orders.table.supplierName')}</div>
                    <div className="text-gray-900">{order.agent?.nickname || order.agent?.name || (typeof order.agent === 'string' ? order.agent : '-')}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{t('otc.orders.table.payerName')}</div>
                    <div className="text-gray-900">{order.return_account_name || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{t('otc.orders.table.payerBankName')}</div>
                    <div className="text-gray-900">{order.return_bank_name || '-'}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <div className="text-xs text-gray-500">{t('otc.orders.table.orderTime')}</div>
                    <div className="text-gray-700 text-sm">{formatTimestamp(order.addtime)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{t('otc.orders.table.completeTime')}</div>
                    <div className="text-gray-700 text-sm">{formatTimestamp(order.endtime)}</div>
                  </div>
                </div>

                {/* 仅收款订单展示（代付订单不展示） */}
                {order.otype !== '1' && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <div className="text-xs text-gray-500">上次任务状态</div>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                          getTaskStatusClassName(order.last_task_status)
                        )}
                      >
                        {getTaskStatusText(order.last_task_status)}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">上次任务更新时间</div>
                      {(() => {
                        const info = getTaskTimeInfo(order.last_task_success_time);
                        return (
                          <div className={cn("text-sm", info.isStale ? "text-red-600 font-semibold" : "text-gray-700")}>
                            {info.text}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* 仅代付订单展示 task_status */}
                {order.otype === '1' && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <div className="text-xs text-gray-500">任务状态</div>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                          getPayoutTaskStatusClassName(order.task_status)
                        )}
                      >
                        {getPayoutTaskStatusText(order.task_status)}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="mt-3 flex justify-between items-center flex-wrap gap-2">
                  <div className="flex gap-2">
                    {order.pay_proof && getImageUrl(order.pay_proof) && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center text-xs border-gray-300 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => handleImagePreview(order.pay_proof)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        {t('otc.orders.table.paymentScreenshot')}
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex items-center text-xs border-gray-300 text-gray-700 bg-gray-50 hover:bg-gray-100" onClick={() => handleViewDetails(order)}>
                    <Eye className="h-3 w-3 mr-1" />
                    {t('otc.orders.table.view')}
                  </Button>
                    {order.otype === '1' && order.status !== '3' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center text-xs border-gray-300 text-red-600 bg-white hover:bg-red-50 hover:border-red-300" 
                        onClick={() => handleRejectOrder(order)}
                      >
                        <X className="h-3 w-3 mr-1" />
                        {t('otc.orders.table.rejectOrder')}
                      </Button>
                    )}
                  </div>
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
                <th className="px-4 py-3">{t('otc.orders.table.orderID')}</th>
                <th className="px-4 py-3">{t('otc.orders.paymentSystemOrderNumber')}</th>
                <th className="px-4 py-3">{t('otc.orders.table.amount')}</th>
                <th className="px-4 py-3">{t('otc.orders.table.currency')}</th>
                <th className="px-4 py-3 min-w-[200px]">{t('otc.orders.table.channel')}</th>
                <th className="px-4 py-3">{t('otc.orders.table.username')}</th>
                <th className="px-4 py-3">{t('otc.orders.table.supplierName')}</th>
                <th className="px-4 py-3 min-w-[120px] whitespace-nowrap">{t('otc.orders.table.payerName')}</th>
                <th className="px-4 py-3 min-w-[140px] whitespace-nowrap">{t('otc.orders.table.payerBankName')}</th>
                <th className="px-4 py-3 min-w-[100px] whitespace-nowrap">{t('otc.orders.table.uniqueID')}</th>
                <th className="px-4 py-3 min-w-[120px] whitespace-nowrap">{t('otc.orders.table.agentFee')}</th>
                <th className="px-4 py-3 min-w-[100px] whitespace-nowrap">{t('otc.orders.table.staffCommission')}</th>
                <th className="px-4 py-3">{t('otc.orders.table.status')}</th>
                {shouldShowTaskColumns && (
                  <>
                    <th className="px-4 py-3 min-w-[110px] whitespace-nowrap">上次任务状态</th>
                    <th className="px-4 py-3 min-w-[170px] whitespace-nowrap">上次任务更新时间</th>
                  </>
                )}
                {shouldShowPayoutTaskStatusColumn && (
                  <th className="px-4 py-3 min-w-[110px] whitespace-nowrap">任务状态</th>
                )}
                <th className="px-4 py-3">{t('otc.orders.table.orderTime')}</th>
                <th className="px-4 py-3 text-center">{t('otc.orders.table.completeTime')}</th>
                <th className="px-4 py-3 min-w-[120px] whitespace-nowrap">{t('otc.orders.table.paymentScreenshot')}</th>
                <th className="px-4 py-3">{t('otc.orders.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {allOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      shouldShowTaskColumns ? 18 : (shouldShowPayoutTaskStatusColumn ? 17 : 16)
                    }
                    className="text-center p-8 text-gray-500"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                allOrders.map((order, index) => (
                  <tr key={order.id} className={`border-t border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-50 transition-colors`}>
                    <td className="px-4 py-3 text-gray-700 text-center text-sm">
                      {
                        order.orderid ? <div className="flex items-center">
                        {/* <CircleDollarSign className={`h-4 w-4 mr-1.5 ${order.otype === "1" ? "text-green-500" : "text-red-500"} flex-shrink-0`} /> */}
                        <span className="text-gray-900 truncate" title={`${order.orderid}`}>{order.orderid}</span>
                      </div>: '-'
                      }
                    </td>
                     <td className="px-4 py-3 text-gray-700 text-center text-sm">
                      {
                        order.out_order_id ? <div className="flex items-center">
                        {/* <CircleDollarSign className={`h-4 w-4 mr-1.5 ${order.otype === "1" ? "text-green-500" : "text-red-500"} flex-shrink-0`} /> */}
                        <span className="text-gray-900 truncate" title={`${order.out_order_id}`}>{order.out_order_id}</span>
                      </div>: '-'
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-900 text-sm">{ order.num ? formatNumberWithCommas(order.num, 2) : '-'}</td>
                    <td className="px-4 py-3 text-gray-700 text-sm">{order.currency || '-'}</td>
                    <td className="px-4 py-3 text-gray-700 min-w-[200px] whitespace-nowrap text-sm">{order.channel_title || '-'}</td>
                    {/* <td className="px-4 py-3 text-gray-700">{orderTypeMap[order.otype]}</td> */}
                    <td className="px-4 py-3 text-gray-700 text-sm">
                      {renderUserCell(order)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-sm">
                      {order.agent?.nickname || order.agent?.name || (typeof order.agent === 'string' ? order.agent : '-')}
                    </td>
                    <td className="px-4 py-3 text-gray-700 min-w-[120px] whitespace-nowrap text-sm">{order.return_account_name || '-'}</td>
                    <td className="px-4 py-3 text-gray-700 min-w-[140px] whitespace-nowrap text-sm">{order.return_bank_name || '-'}</td>
                    <td className="px-4 py-3 text-gray-700 min-w-[100px] whitespace-nowrap text-sm">{order.return_order_id || '-'}</td>
                    {/* <td className="px-4 py-3 text-gray-700">
                      <span className="truncate max-w-[150px] block" title={order.return_order_id}>{order.return_order_id}</span>
                    </td> */}
                    <td className="px-4 py-3 text-gray-700 min-w-[120px] whitespace-nowrap text-sm">{order.fee ? formatNumberWithCommas(order.fee, 2) : '-'}</td>
                    <td className="px-4 py-3 text-gray-700 min-w-[100px] whitespace-nowrap text-sm">{order.scale_amount ? formatNumberWithCommas(order.scale_amount, 2) : '-'}</td>
                    <td className="px-4 py-3 text-gray-700 text-sm">
                      {renderStatusCell(order)}
                    </td>
                    {shouldShowTaskColumns && order.otype !== '1' && (
                      <>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                              getTaskStatusClassName(order.last_task_status)
                            )}
                          >
                            {getTaskStatusText(order.last_task_status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          {(() => {
                            const info = getTaskTimeInfo(order.last_task_success_time);
                            return (
                              <span className={cn(info.isStale ? "text-red-600 font-semibold" : "text-gray-700")}>
                                {info.text}
                              </span>
                            );
                          })()}
                        </td>
                      </>
                    )}
                    {shouldShowTaskColumns && order.otype === '1' && (
                      <>
                        <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-400">-</td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-400">-</td>
                      </>
                    )}

                    {shouldShowPayoutTaskStatusColumn && (
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                            getPayoutTaskStatusClassName(order.task_status)
                          )}
                        >
                          {getPayoutTaskStatusText(order.task_status)}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-gray-700 text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1.5 text-blue-500 flex-shrink-0" />
                        {formatTimestamp(order.addtime)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 text-sm">
                      {formatTimestamp(order.endtime)}
                    </td>
                    <td className="px-4 py-3 text-center min-w-[120px] whitespace-nowrap text-sm">
                      {order.pay_proof && getImageUrl(order.pay_proof) ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleImagePreview(order.pay_proof)}
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                          title={t('otc.orders.table.viewPaymentScreenshot')}
                        >
                          <Eye className="h-4 w-4 text-green-600" />
                        </Button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleViewDetails(order)}
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                          title={t('otc.orders.table.viewDetails')}
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </Button>
                      {
                        (!order.orderid && order.return_order_id) &&  <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleMatchDetails(order)}
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                          title={t('otc.orders.table.manualMatch')}
                      >
                        <Hand className="h-4 w-4 text-yellow-600" />
                      </Button>
                      }
                        {
                          order.otype === '1' && order.status !== '3' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRejectOrder(order)}
                              className="h-8 w-8 p-0 hover:bg-gray-100"
                              title={t('otc.orders.table.rejectOrder')}
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          )
                        }
                        {
                          order.status === '3' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleResendNotification(order)}
                              className="h-8 w-8 p-0 hover:bg-gray-100"
                              title={t('otc.orders.table.resendNotification')}
                            >
                              <Send className="h-4 w-4 text-green-600" />
                            </Button>
                          )
                        }
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 加载更多按钮 */}
        {hasNextPage && (
          <div className="flex justify-center mt-4 pb-4">
            <Button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              variant="outline"
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {isFetchingNextPage ? (
                  <div className="flex justify-center items-center h-10 mt-4 pb-4">
                     <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                   </div>
              ) : (
                t('loadMore')
              )}
            </Button>
          </div>
        )}
      </div>
    );
  };

  const accountQueryParams = useMemo(() => ({
    channelid: orderToComplete?.pay_channelid || '',
    userid: orderToComplete?.userid || ''
  }), [orderToComplete?.pay_channelid, orderToComplete?.userid]);

  const {
    data: payoutAccountsData,
    isLoading: isPayoutAccountsLoading,
    refetch: refetchPayoutAccounts
  } = useAccountData(accountQueryParams);

  const payoutAccounts = useMemo(() => {
    if (!payoutAccountsData?.pages) return [] as AccountItem[];
    const accounts = payoutAccountsData.pages.flatMap((page: any) => page?.data?.list || []);
    
    // 如果是代付订单，过滤掉余额不足的账户
    if (orderToComplete?.otype === '1' && orderToComplete?.num) {
      const orderAmount = parseFloat(orderToComplete.num) || 0;
      return accounts.filter((account) => {
        // 获取账户余额
        const accountAmount = typeof account.amount === 'number' 
          ? account.amount 
          : (typeof account.amount === 'string' ? parseFloat(account.amount) || 0 : 0);
        // 只显示余额大于等于订单金额的账户
        return accountAmount >= orderAmount;
      });
    }
    
    return accounts;
  }, [payoutAccountsData, orderToComplete]);

  const getAccountOptionValue = (account: AccountItem) => {
    const key = account.id ?? account.appid ?? account.mch_id ?? account.userid ?? '';
    return key ? String(key) : '';
  };

  // 弹窗打开时，如果是代付订单，重新获取最新的账户数据
  useEffect(() => {
    if (confirmOpen && orderToComplete?.otype === '1' && orderToComplete?.pay_channelid) {
      refetchPayoutAccounts();
    }
  }, [confirmOpen, orderToComplete?.otype, orderToComplete?.pay_channelid, refetchPayoutAccounts]);

  // 使用ref来跟踪是否已经设置过默认账户，避免用户手动选择后被重置
  const hasSetDefaultAccount = useRef(false);
  const currentOrderId = useRef<string | null>(null);

  useEffect(() => {
    if (!orderToComplete || orderToComplete.otype !== '1') {
      hasSetDefaultAccount.current = false;
      currentOrderId.current = null;
      return;
    }

    // 如果订单ID变化，重置标志
    if (currentOrderId.current !== orderToComplete.id) {
      hasSetDefaultAccount.current = false;
      currentOrderId.current = orderToComplete.id || null;
      // 清空当前选择，等待设置默认值
      setSelectedPaymentAccountId('');
      setPaymentAccount('');
    }

    // 只在首次加载订单或账户列表时才设置默认账户
    // 如果用户已经手动选择过，不再自动设置
    if (!hasSetDefaultAccount.current && orderToComplete.payparams_id && payoutAccounts.length > 0) {
      const matchedAccount = payoutAccounts.find((account) => {
        if (!account) return false;
        const accountId = account.id ? String(account.id) : undefined;
        return accountId === String(orderToComplete.payparams_id);
      });

      if (matchedAccount) {
        const optionValue = getAccountOptionValue(matchedAccount);
        if (optionValue) {
          setSelectedPaymentAccountId(optionValue);
          setPaymentAccount(
            matchedAccount.appid
              ? String(matchedAccount.appid)
              : matchedAccount.mch_id
                ? String(matchedAccount.mch_id)
                : ''
          );
          hasSetDefaultAccount.current = true;
        }
      } else {
        // 如果没有找到匹配的账户，也标记为已设置，避免重复查找
        hasSetDefaultAccount.current = true;
      }
    }
  }, [orderToComplete, payoutAccounts]);

  return (
    <div className="p-2 md:p-6 bg-[#f5f7fa] min-h-[calc(100vh-64px)] rounded-lg">
      <div className="mb-4 md:mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-0 rounded-lg bg-white p-3 md:p-4 shadow-sm">
        <div className="flex items-center">
          <CircleDollarSign className="h-5 w-5 md:h-6 md:w-6 mr-2" />
          <h1 className="text-lg md:text-2xl font-bold text-gray-900">{t('otc.orders.title')}</h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          {showToggleControls && (
            <>
              <div className="flex items-center gap-1.5 md:gap-2 bg-white px-2 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50">
                <Switch 
                  checked={receiveEnabled} 
                  onCheckedChange={()=> changeEnabledBtn(2)} 
                  className="data-[state=checked]:bg-blue-500" 
                />
                <span className="text-xs md:text-sm text-gray-700 whitespace-nowrap">
                  {receiveEnabled ? t('otc.orders.enableReceipt') : t('otc.orders.pauseReceipt')}
                </span>
              </div>
              
              <div className="flex items-center gap-1.5 md:gap-2 bg-white px-2 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50">
                <Switch 
                  checked={paymentEnabled}
                  onCheckedChange={()=> changeEnabledBtn(1)} 
                  className="data-[state=checked]:bg-blue-500" 
                />
                <span className="text-xs md:text-sm text-gray-700 whitespace-nowrap">
                  {paymentEnabled ? t('otc.orders.enablePayment') : t('otc.orders.pausePayment')}
                </span>
              </div>
            </>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white text-gray-600 border-gray-200 hover:bg-gray-50 font-normal text-xs md:text-sm"
            onClick={handleRefresh}
          >
            <RotateCcw className={cn("mr-1 md:mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4", isRefreshing && "animate-spin")} />
            {t('common.refresh')}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white text-gray-600 border-gray-200 hover:bg-gray-50 font-normal"
            onClick={handleExport}
          >
            <Download className="mr-1.5 h-4 w-4" />
            {t('otc.orders.export.button')}
          </Button>
        </div>
      </div>
      
      {/* 统计卡片 */}
      <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-2 md:gap-4 mb-6">
        <Card className="p-2 md:p-4 bg-white border border-gray-200 shadow-sm">
          <div className="text-gray-700 text-[10px] md:text-xs mb-1 md:mb-2 rounded-lg bg-gray-50 p-1 md:p-2 leading-tight">{t('otc.orders.pendingReceiptOrders')}</div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900">
              {formatLargeNumber(ordersData?.pages[0]?.data?.report?.pending_receive_order|| 0)}
            </span>
            <ArrowDown className="hidden md:flex h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 text-green-500 flex-shrink-0" />
          </div>
        </Card>
        
        <Card className="p-2 md:p-4 bg-white border border-gray-200 shadow-sm">
          <div className="text-gray-700 text-[10px] md:text-xs mb-1 md:mb-2 rounded-lg bg-gray-50 p-1 md:p-2 leading-tight">{t('otc.orders.pendingPaymentOrders')}</div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900">
              {formatLargeNumber(ordersData?.pages[0]?.data?.report?.pending_payment_order|| 0)}
            </span>
            <ArrowUp className="hidden md:flex h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 text-red-500 flex-shrink-0" />
          </div>
        </Card>
        
        <Card className="p-2 md:p-4 bg-white border border-gray-200 shadow-sm">
          <div className="text-gray-700 text-[10px] md:text-xs mb-1 md:mb-2 rounded-lg bg-gray-50 p-1 md:p-2 leading-tight">{t('otc.orders.timeoutOrders')}</div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900">
               {formatLargeNumber(ordersData?.pages[0]?.data?.report?.time_out_order|| 0)}
            </span>
            <Clock className="hidden md:flex h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 text-yellow-500 flex-shrink-0" />
          </div>
        </Card>
        
        <Card className="p-2 md:p-4 bg-white border border-gray-200 shadow-sm">
          <div className="text-gray-700 text-[10px] md:text-xs mb-1 md:mb-2 rounded-lg bg-gray-50 p-1 md:p-2 leading-tight">{t('otc.orders.todayOrderTotal')}</div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900">
               {formatLargeNumber(ordersData?.pages[0]?.data?.report?.today_all_order|| 0)}
            </span>
            <svg className="hidden md:block h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 text-blue-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            </svg>
          </div>
        </Card>
        
        {/* 新增财务指标卡片 */}
        <Card className="p-2 md:p-4 bg-white border border-gray-200 shadow-sm">
          <div className="text-gray-700 text-[10px] md:text-xs mb-1 md:mb-2 rounded-lg bg-gray-50 p-1 md:p-2 leading-tight">{t('otc.orders.todayReceived')}</div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900">
              {formatLargeNumber(ordersData?.pages[0]?.data?.report?.today_received || 0)}
            </span>
            <DollarSign className="hidden md:flex h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 text-green-500 flex-shrink-0" />
          </div>
        </Card>
        
        <Card className="p-2 md:p-4 bg-white border border-gray-200 shadow-sm">
          <div className="text-gray-700 text-[10px] md:text-xs mb-1 md:mb-2 rounded-lg bg-gray-50 p-1 md:p-2 leading-tight">{t('otc.orders.todayPaid')}</div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900">
              {formatLargeNumber(ordersData?.pages[0]?.data?.report?.today_paid || 0)}
            </span>
            <CreditCard className="hidden md:flex h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 text-blue-500 flex-shrink-0" />
          </div>
        </Card>
        
        <Card className="p-2 md:p-4 bg-white border border-gray-200 shadow-sm">
          <div className="text-gray-700 text-[10px] md:text-xs mb-1 md:mb-2 rounded-lg bg-gray-50 p-1 md:p-2 leading-tight">{t('otc.orders.marginAmount')}</div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900">
              {formatLargeNumber(ordersData?.pages[0]?.data?.report?.margin_amount || 0)}
            </span>
            <Shield className="hidden md:flex h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 text-purple-500 flex-shrink-0" />
          </div>
        </Card>
        
        <Card className="p-2 md:p-4 bg-white border border-gray-200 shadow-sm">
          <div className="text-gray-700 text-[10px] md:text-xs mb-1 md:mb-2 rounded-lg bg-gray-50 p-1 md:p-2 leading-tight">{t('otc.orders.pendingSettlement')}</div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900">
              {formatLargeNumber(ordersData?.pages[0]?.data?.report?.pending_settlement || 0)}
            </span>
            <Clock className="hidden md:flex h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 text-orange-500 flex-shrink-0" />
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
                  value="user"
                  className="tab-trigger data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-[10px] md:text-xs py-1.5 px-2 md:px-3 h-auto whitespace-nowrap"
                >
                  {t('otc.orders.userReferenceId')}
                </TabsTrigger>
                <TabsTrigger
                  value="uniqueId"
                  className="tab-trigger data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-[10px] md:text-xs py-1.5 px-2 md:px-3 h-auto whitespace-nowrap"
                >
                  {t('otc.orders.table.uniqueID')}
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
                      : searchType === 'user' ? t('otc.orders.enterUserReferenceId') : t('otc.orders.table.enterUniqueID')

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
        
        {/* 业务员筛选（仅支付供应商后台，非业务员登录） */}
        {shouldShowStaffFilter && allTeamMembers.length > 0 && (
          <Tabs
            value={staffFilter || ""}
            onValueChange={setStaffFilter}
            className="w-full mb-3 md:mb-4"
          >
            <div className="tab-container w-full overflow-x-auto">
              <TabsList className="bg-[#f5f7fa] rounded-lg inline-flex md:flex md:flex-wrap gap-1 py-1 px-1 min-w-max md:min-w-0 md:w-full">
                <TabsTrigger 
                  value="" 
                  className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-[10px] md:text-xs py-1.5 px-2 md:px-3 h-auto whitespace-nowrap transition-all focus:outline-none"
                >
                  全部业务员
                </TabsTrigger>
                {allTeamMembers.map((member) => (
                  <TabsTrigger 
                    key={member.id}
                    value={member.id.toString()} 
                    className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-[10px] md:text-xs py-1.5 px-2 md:px-3 h-auto whitespace-nowrap transition-all focus:outline-none"
                  >
                    {member.nickname || member.username || `业务员${member.id}`}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>
        )}
        
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
              <TabsTrigger 
                value="yiquxiao" 
                className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-[10px] md:text-xs py-1.5 px-2 md:px-3 h-auto whitespace-nowrap transition-all focus:outline-none"
              >
                {t('otc.orders.expiredOrders')}
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
          
          <TabsContent value="yiquxiao" className="mt-3 md:mt-4 px-0">
            {renderTable(
              ordersData?.pages.flatMap(page => page.data.list) || [],
              t('otc.orders.noExpiredOrders')
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
              {/* 币种 */}
              <div className="border border-gray-200 px-4 py-3 rounded-md">
                <div className="text-gray-700 text-sm">{t('otc.orders.details.currency')}</div>
                <div className="text-gray-900">{selectedOrder.currency}</div>
              </div>
              
              {/* 账户类型 */}
              <div className="border border-gray-200 px-4 py-3 rounded-md">
                <div className="text-gray-700 text-sm">{t('otc.orders.details.channel')}</div>
                <div className="text-gray-900">{selectedOrder.channel_title || '-'}</div>
              </div>
              
              {/* 业务类型 */}
              <div className="border border-gray-200 px-4 py-3 rounded-md">
                <div className="text-gray-700 text-sm">{t('otc.orders.details.businessType')}</div>
                <div className="text-gray-900">{selectedOrder.otype == '2' ? t('otc.dashboard.collection'): t('otc.dashboard.payment')}</div>
              </div>
              
              {/* 业务员姓名 */}
              <div className="border border-gray-200 px-4 py-3 rounded-md">
                <div className="text-gray-700 text-sm">{t('otc.orders.details.staffName')}</div>
                <div className="text-gray-900">{selectedOrder.username}</div>
              </div>
              
              {/* 业务员收款方式 */}
              <div className="border border-gray-200 px-4 py-3 rounded-md">
                <div className="text-gray-700 text-sm">{t('otc.orders.details.staffCollectionMethod')}</div>
                <div className="text-gray-900">{selectedOrder.bank}</div>
              </div>

              {/* 业务员收款账号姓名 */}
              <div className="border border-gray-200 px-4 py-3 rounded-md">
                <div className="text-gray-700 text-sm">{t('otc.orders.details.staffAccountName')}</div>
                <div className="text-gray-900">{selectedOrder.truename}</div>
              </div>

              {/* 业务员收款账号 */}
              <div className="border border-gray-200 px-4 py-3 rounded-md">
                <div className="text-gray-700 text-sm">{t('otc.orders.details.staffAccountNumber')}</div>
                <div className="text-gray-900">{selectedOrder.bankcard}</div>
              </div>
              
              {/* 订单金额 */}
              <div className="border border-gray-200 px-4 py-3 rounded-md">
                <div className="text-gray-700 text-sm">{t('otc.orders.table.orderAmount')}</div>
                <div className="text-gray-900">{selectedOrder.num ? formatNumberWithCommas(selectedOrder.num, 2) : '-'} {selectedOrder.currency}</div>
              </div>
              
              {/* 付款人姓名 */}
              <div className="border border-gray-200 px-4 py-3 rounded-md">
                <div className="text-gray-700 text-sm">{t('otc.orders.details.payerName')}</div>
                <div className="text-gray-900">{selectedOrder.return_account_name || '-'}</div>
              </div>

              {/* 付款银行名称 */}
              <div className="border border-gray-200 px-4 py-3 rounded-md">
                <div className="text-gray-700 text-sm">{t('otc.orders.details.payerBankName')}</div>
                <div className="text-gray-900">{selectedOrder.return_bank_name || '-'}</div>
              </div>
              
              {/* 唯一标识 */}
              <div className="border border-gray-200 px-4 py-3 rounded-md">
                <div className="text-gray-700 text-sm">{t('otc.orders.details.uniqueId')}</div>
                <div className="text-gray-900">{selectedOrder.return_order_id || '-'}</div>
              </div>
              
              {/* 当前状态 */}
              <div className="border border-gray-200 px-4 py-3 rounded-md">
                <div className="text-gray-700 text-sm">{t('otc.orders.details.currentStatus')}</div>
                <div className="text-gray-900">
                  <Badge className={getStatusColorClass(selectedOrder.status)}>
                    {statusMap[selectedOrder.status] || selectedOrder.status}
                  </Badge>
                </div>
              </div>

              {/* 驳回原因 - 仅当订单已驳回时显示 */}
              {selectedOrder.status === '9' && selectedOrder.remarks && (
                <div className="border border-gray-200 px-4 py-3 rounded-md">
                  <div className="text-gray-700 text-sm">{t('otc.orders.details.rejectReason')}</div>
                  <div className="text-gray-900 mt-1">{selectedOrder.remarks}</div>
                </div>
              )}

              {/* 付款截图 */}
              {selectedOrder.pay_proof && getImageUrl(selectedOrder.pay_proof) && (
                <div className="border border-gray-200 px-4 py-3 rounded-md">
                  <div className="text-gray-700 text-sm mb-2">{t('otc.orders.details.paymentScreenshot')}</div>
                  <div className="flex items-center gap-3">
                    <img 
                      src={getImageUrl(selectedOrder.pay_proof)} 
                      alt={t('otc.orders.details.paymentScreenshot')} 
                      className="w-24 h-24 object-cover rounded border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleImagePreview(selectedOrder.pay_proof)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleImagePreview(selectedOrder.pay_proof)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {t('otc.orders.table.viewLargeImage')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* 业务员详情对话框 */}
      <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
        <DialogContent className="max-w-md bg-white max-h-[90vh] flex flex-col">
          <DialogHeader className="p-0 m-0 flex-shrink-0">
            <div className="border-b border-gray-200 pb-2">
              <DialogTitle className="text-lg font-medium text-gray-900">{t('otc.orders.userDetails')}</DialogTitle>
            </div>
            <DialogDescription className="sr-only">{t('otc.orders.userDetails')}</DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="mt-4 space-y-4 overflow-y-auto pr-2">
              {/* 业务员全名 */}
              <div className="border border-gray-200 px-4 py-3 rounded-md">
                <div className="text-gray-700 text-sm">{t('otc.orders.userDetails.fullNameLabel')}</div>
                <div className="text-gray-900">{selectedUser.username}</div>
              </div>
              
              {/* 支付/收款方式 */}
              <div className="border border-gray-200 px-4 py-3 rounded-md">
                <div className="text-gray-700 text-sm">
                  {selectedUser.otype === "2" ? t('otc.orders.userDetails.collectionMethod') : t('otc.orders.userDetails.paymentMethod')}
                </div>
                <div className="text-gray-900">{selectedUser.bank}</div>
              </div>
              
              {/* 账户号码 */}
              <div className="border border-gray-200 px-4 py-3 rounded-md">
                <div className="text-gray-700 text-sm">
                  {selectedUser.otype === "2" ? t('otc.orders.userDetails.collectionAccountNumber') : t('otc.orders.userDetails.paymentAccountNumber')}
                </div>
                <div className="text-gray-900">{selectedUser.bankcard || "-"}</div>
              </div>
              
              {/* 金额 */}
              <div className="border border-gray-200 px-4 py-3 rounded-md">
                <div className="text-gray-700 text-sm">
                  {selectedUser.otype === "2" ? t('otc.orders.userDetails.collectionAmount') : t('otc.orders.userDetails.paymentAmount')}
                </div>
                <div className="text-gray-900">{selectedUser.num ? formatNumberWithCommas(selectedUser.num, 2) : '-'} {selectedUser.currency}</div>
              </div>
              
              {/* 唯一标识ID */}
              <div className="border border-gray-200 px-4 py-3 rounded-md">
                <div className="text-gray-700 text-sm">{t('otc.orders.userDetails.uniqueId')}</div>
                <div className="text-gray-900">{selectedUser.return_order_id || '-'}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
       {/* 确认完成手动匹配对话框 */}
      <Dialog open={confirmHandOpen} onOpenChange={setConfirmHandOpen}>
        <DialogContent className="max-w-md bg-white max-h-[90vh] flex flex-col">
          <DialogHeader className="p-0 m-0 flex-shrink-0">
            <div className="border-b border-gray-200 pb-2">
              <DialogTitle className="text-lg font-medium text-gray-900">{t('otc.orders.manualMatch.title')}</DialogTitle>
            </div>
            <DialogDescription className="mt-4 text-gray-700">
              {t('otc.orders.manualMatch.message')}
            </DialogDescription>
             <div className="mt-4 space-y-1 overflow-y-auto">
                <label htmlFor="orderid" className="text-gray-700">
                  {t('otc.orders.manualMatch.orderNumber')}
                </label>
                <Input
                  id="orderid"
                  value={orderid}
                  onChange={e => setOrderid(e.target.value)}
                  className="w-full bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                />
            </div>
          </DialogHeader>
          
          <DialogFooter className="mt-4">
            <Button className="bg-black text-white hover:bg-gray-800" onClick={() => { setOrderid('');setConfirmHandOpen(false)}}>{t('otc.orders.completeConfirm.cancel')}</Button>
            <Button className="bg-blue-500 text-white hover:bg-blue-600" onClick={ () => confirmMannalMatch() }>{t('otc.orders.completeConfirm.confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 确认驳回订单对话框 */}
      <Dialog
        open={rejectConfirmOpen}
        onOpenChange={(open) => {
          setRejectConfirmOpen(open);
          if (!open) {
            setOrderToReject(null);
            setRejectContent('');
          }
        }}
      >
        <DialogContent className="max-w-md bg-white max-h-[90vh] flex flex-col">
          <DialogHeader className="p-0 m-0 flex-shrink-0">
            <div className="border-b border-gray-200 pb-2">
              <DialogTitle className="text-lg font-medium text-gray-900">{t('otc.orders.reject.title')}</DialogTitle>
            </div>
            <DialogDescription className="mt-4 text-gray-700 overflow-y-auto">
              {t('otc.orders.reject.message')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="reject-content">
                {t('otc.orders.reject.reason')} <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="reject-content"
                placeholder={t('otc.orders.reject.reasonPlaceholder')}
                value={rejectContent}
                onChange={(e) => setRejectContent(e.target.value)}
                className="bg-white border-gray-300 text-gray-900 min-h-[120px] resize-none"
              />
              <p className="text-xs text-gray-500">{t('otc.orders.reject.reasonHint')}</p>
            </div>
          </div>
          
          <DialogFooter className="mt-4">
            <Button 
              className="bg-gray-500 text-white hover:bg-gray-600" 
              onClick={() => {
                setRejectConfirmOpen(false);
                setOrderToReject(null);
                setRejectContent('');
              }}
            >
              {t('channels.cancel')}
            </Button>
            <Button 
              className="bg-red-500 text-white hover:bg-red-600" 
              onClick={confirmRejectOrder}
            >
              {t('otc.orders.reject.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 确认完成订单对话框 */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md bg-white max-h-[90vh] flex flex-col">
          <DialogHeader className="p-0 m-0 flex-shrink-0">
            <div className="border-b border-gray-200 pb-2">
              <DialogTitle className="text-lg font-medium text-gray-900">{t('otc.orders.completeConfirm')}</DialogTitle>
            </div>
            <DialogDescription className="mt-4 text-gray-700 overflow-y-auto">
              {t('otc.orders.completeConfirm.message')}
            </DialogDescription>
          </DialogHeader>
          
          {/* 通道信息：代付订单显示 */}
          {orderToComplete?.otype === '1' && orderToComplete.channel_title && (
            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t('otc.orders.details.channel')}
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
                {orderToComplete.channel_title}
              </div>
            </div>
          )}
          
          {/* 付款账户下拉选择：代付订单且不是模式1时必须选择 */}
          {orderToComplete?.otype === '1' && LOGIN_CONFIG.DISPLAY_MODE !== 1 && (
            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t('otc.orders.paymentAccount')} <span className="text-red-500">*</span>
              </label>
              <Select
                value={selectedPaymentAccountId}
                onValueChange={(value) => {
                  // 用户手动选择账户时，标记为已选择，防止useEffect重置
                  hasSetDefaultAccount.current = true;
                  setSelectedPaymentAccountId(value);
                  const selectedAccount = payoutAccounts.find((account) => getAccountOptionValue(account) === value);
                  setPaymentAccount(
                    selectedAccount?.appid
                      ? String(selectedAccount.appid)
                      : selectedAccount?.mch_id
                        ? String(selectedAccount.mch_id)
                        : ''
                  );
                }}
                disabled={isPayoutAccountsLoading || payoutAccounts.length === 0}
              >
                <SelectTrigger className="w-full bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder={isPayoutAccountsLoading ? t('otc.orders.paymentAccountLoading') : t('otc.orders.paymentAccountPlaceholder')} />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {payoutAccounts.length === 0 ? (
                    <SelectItem value="__empty" disabled>
                      {t('otc.orders.noAccountsInChannel')}
                    </SelectItem>
                  ) : (
                    payoutAccounts.map((account) => {
                      const optionValue = getAccountOptionValue(account);
                      if (!optionValue) {
                        return null;
                      }
                      const displayAccount = account.appid || account.mch_id || '-';
                      const displayName = account.truename || account.subject || t('otc.orders.paymentAccountUnnamed');
                      return (
                        <SelectItem key={optionValue} value={optionValue}>
                          {displayName}（{displayAccount}）
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">{t('otc.orders.selectPaymentAccountInChannel')}</p>
            </div>
          )}
          
          {orderToComplete?.otype === '1' && (
            <div className="mt-4 space-y-3">
              <label className="text-sm font-medium text-gray-700">
                {t('otc.orders.details.paymentScreenshot')} <span className="text-red-500">*</span>
              </label>
              <input
                ref={paymentProofInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePaymentProofChange}
              />
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  onClick={() => paymentProofInputRef.current?.click()}
                  disabled={isUploadingProof}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  {isUploadingProof ? t('otc.orders.uploading') : t('otc.orders.uploadProof')}
                </Button>
                {isUploadingProof && (
                  <span className="text-xs text-gray-500">{t('otc.orders.uploading')}</span>
                )}
              </div>
              {paymentProof && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-md border border-gray-200 p-3 bg-gray-50">
                  {paymentProofPreviewUrl ? (
                    <img
                      src={paymentProofPreviewUrl}
                      alt={t('otc.orders.paymentScreenshotPreview')}
                      className="w-28 h-28 object-cover rounded border border-gray-200 cursor-pointer"
                      onClick={() => handleImagePreview(paymentProof)}
                    />
                  ) : (
                    <div className="text-sm text-gray-600">{t('otc.orders.paymentScreenshotUploaded')}</div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-gray-300 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => paymentProofPreviewUrl && handleImagePreview(paymentProof)}
                      disabled={!paymentProofPreviewUrl}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {t('otc.orders.preview')}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={handleRemovePaymentProof}
                    >
                      <X className="h-4 w-4 mr-1" />
                      移除
                    </Button>
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500">支持 JPG/PNG 图片，大小不超过 2MB。</p>
            </div>
          )}
          
          {/* 后五位输入框：只有模式1且不是代付订单且订单没有后五位时才显示（非必填） */}
          {LOGIN_CONFIG.DISPLAY_MODE === 1 && 
           orderToComplete?.otype !== '1' &&
           (!orderToComplete?.return_order_id || orderToComplete.return_order_id.length < 5) && (
            <div className="mt-4 space-y-2">
              <label htmlFor="lastFiveDigits" className="text-sm text-gray-700">
                唯一标识后五位
              </label>
              <Input
                id="lastFiveDigits"
                value={lastFiveDigits}
                onChange={(e) => {
                  const value = e.target.value;
                  // 限制输入长度为5位
                  if (value.length <= 5) {
                    setLastFiveDigits(value);
                  }
                }}
                placeholder="请输入5位字符（可选）"
                maxLength={5}
                className="w-full bg-white border-gray-300 text-gray-900"
              />
              <p className="text-xs text-gray-500">请输入唯一标识的后五位字符（可选）</p>
            </div>
          )}
          
          <DialogFooter className="mt-4">
            <Button 
              className="bg-black text-white hover:bg-gray-800" 
              onClick={() => { 
                setOrderToComplete(null);
                setLastFiveDigits('');
                setPaymentAccount('');
                setPaymentProof('');
                setSelectedPaymentAccountId('');
                hasSetDefaultAccount.current = false;
                currentOrderId.current = null;
                setConfirmOpen(false);
              }}
            >
              {t('otc.orders.completeConfirm.cancel')}
            </Button>
            <Button 
              className="bg-blue-500 text-white hover:bg-blue-600" 
              onClick={() => {
              completeConfirmOrder();
              }}
            >
              {t('otc.orders.completeConfirm.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* {t('otc.orders.paymentScreenshotDialog')} */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-4xl bg-white max-h-[90vh] flex flex-col">
          <DialogHeader className="p-0 m-0 flex-shrink-0">
            <div className="border-b border-gray-200 pb-2">
              <DialogTitle className="text-lg font-medium text-gray-900">{t('otc.orders.details.paymentScreenshot')}</DialogTitle>
            </div>
            <DialogDescription className="sr-only">{t('otc.orders.table.viewPaymentScreenshot')}</DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 flex justify-center items-center bg-gray-50 rounded-lg p-4 overflow-y-auto">
            {selectedImageUrl && (
              <img
                src={selectedImageUrl}
                alt={t('otc.orders.details.paymentScreenshot')}
                className="max-w-full max-h-[70vh] object-contain rounded"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            )}
          </div>
          
          <DialogFooter className="mt-4 flex-shrink-0">
            <Button 
              className="bg-gray-200 text-gray-700 hover:bg-gray-300" 
              onClick={() => setImageDialogOpen(false)}
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 导出数据对话框 */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="max-w-md bg-white max-h-[90vh] flex flex-col">
          <DialogHeader className="p-0 m-0 flex-shrink-0">
            <div className="border-b border-gray-200 pb-2">
              <DialogTitle className="text-lg font-medium text-gray-900">{t('otc.orders.export.title')}</DialogTitle>
            </div>
            <DialogDescription className="mt-4 text-gray-700">
              {t('otc.orders.export.message')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-4 overflow-y-auto pr-2">
            {/* 时间类型选择 */}
            <div className="space-y-2">
              <label htmlFor="time-type" className="text-sm font-medium text-gray-700">
                {t('otc.orders.export.timeType')} <span className="text-red-500">*</span>
              </label>
              <Select value={exportTimeType} onValueChange={setExportTimeType}>
                <SelectTrigger className="w-full bg-white border-gray-200 text-gray-900">
                  <SelectValue placeholder={t('otc.orders.export.timeTypePlaceholder')} />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="create">{t('otc.orders.export.createTime')}</SelectItem>
                  <SelectItem value="complete">{t('otc.orders.export.completeTime')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 开始时间 */}
            <div className="space-y-2">
              <label htmlFor="start-time" className="text-sm font-medium text-gray-700">
                {t('otc.orders.export.startTime')} <span className="text-red-500">*</span>
              </label>
              <Input
                id="start-time"
                type="datetime-local"
                value={exportStartTime}
                onChange={(e) => setExportStartTime(e.target.value)}
                className="w-full bg-white border-gray-200 text-gray-900"
              />
            </div>

            {/* 结束时间 */}
            <div className="space-y-2">
              <label htmlFor="end-time" className="text-sm font-medium text-gray-700">
                {t('otc.orders.export.endTime')} <span className="text-red-500">*</span>
              </label>
              <Input
                id="end-time"
                type="datetime-local"
                value={exportEndTime}
                onChange={(e) => setExportEndTime(e.target.value)}
                className="w-full bg-white border-gray-200 text-gray-900"
              />
            </div>

            {/* 币种选择 */}
            <div className="space-y-2">
              <label htmlFor="currency" className="text-sm font-medium text-gray-700">
                {t('otc.orders.export.currency')}
              </label>
              <Select value={exportCurrency} onValueChange={setExportCurrency}>
                <SelectTrigger className="w-full bg-white border-gray-200 text-gray-900">
                  <SelectValue placeholder={t('otc.orders.export.currencyPlaceholder')} />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">{t('otc.orders.export.allCurrency')}</SelectItem>
                  {currencyList.map((item) => (
                    <SelectItem key={item.currency} value={item.currency}>
                      {item.currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 订单类型选择 */}
            <div className="space-y-2">
              <label htmlFor="order-type" className="text-sm font-medium text-gray-700">
                {t('otc.orders.export.orderType')}
              </label>
              <Select value={exportOrderType} onValueChange={setExportOrderType}>
                <SelectTrigger className="w-full bg-white border-gray-200 text-gray-900">
                  <SelectValue placeholder={t('otc.orders.export.orderTypePlaceholder')} />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">{t('otc.orders.export.allType')}</SelectItem>
                  <SelectItem value="2">{t('otc.dashboard.collection')}</SelectItem>
                  <SelectItem value="1">{t('otc.dashboard.payment')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 订单状态选择 */}
            <div className="space-y-2">
              <label htmlFor="order-status" className="text-sm font-medium text-gray-700">
                {t('otc.orders.export.orderStatus')}
              </label>
              <Select value={exportStatus} onValueChange={setExportStatus}>
                <SelectTrigger className="w-full bg-white border-gray-200 text-gray-900">
                  <SelectValue placeholder={t('otc.orders.export.orderStatusPlaceholder')} />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">{t('otc.orders.export.allStatus')}</SelectItem>
                  <SelectItem value="1">{t('otc.orders.status.pending')}</SelectItem>
                  <SelectItem value="2">{t('otc.orders.status.processing')}</SelectItem>
                  <SelectItem value="3">{t('otc.orders.status.completed')}</SelectItem>
                  <SelectItem value="8">{t('otc.orders.status.timeout')}</SelectItem>
                  <SelectItem value="99">{t('otc.orders.status.unverified')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter className="mt-6 flex-shrink-0">
            <Button 
              className="bg-gray-200 text-gray-700 hover:bg-gray-300" 
              onClick={() => {
                setExportDialogOpen(false);
                setExportStartTime('');
                setExportEndTime('');
                setExportCurrency('all');
                setExportOrderType('all');
                setExportTimeType('create');
                setExportStatus('all');
              }}
              disabled={isExporting}
            >
              {t('otc.orders.export.cancel')}
            </Button>
            <Button 
              className="bg-blue-500 text-white hover:bg-blue-600" 
              onClick={handleConfirmExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('otc.orders.export.exporting')}
                </div>
              ) : (
                t('otc.orders.export.confirm')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}