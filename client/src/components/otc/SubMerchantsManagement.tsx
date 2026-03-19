import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCurrencyList } from "@/hooks/use-currency-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Settings, Plus, Loader2, Globe, Check, Copy, Info, Pencil } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// 类型定义
interface SubMerchantAsset {
  currency: string;
  balance: number;
  frozen: number;
  available: number;
}

interface SubMerchant {
  id: string;
  merchantId: string;
  name: string;
  telegramAccount: string;
  walletId?: string;
  status: "active" | "inactive" | "pending";
  balance: number;
  balanceUSDT: number;
  assets: SubMerchantAsset[];
  totalOrders: number;
  createdAt: string;
  channel_fees?: { [channelid: string]: any };
}

// API 响应类型
interface MerchantApiItem {
  id: string;
  userid: string;
  nickname: string;
  username: string;
  last_login_time: string;
  status: string;
  tg_account: string;
  receive_commission: string;
  payment_commission: string;
  punish_commission: string;
  extraction_commission: string;
  receive_fee: string;
  payment_fee: string;
  wallet_id: string;
  channel_fees: any;
  addtime: string;
  auto_c2c_sell_status: string;
  auto_c2c_buy_status: string;
  amount: {
    [currency: string]: {
      available: string | number;
      freeze: string | number;
    };
  };
  balance: number;
  order_num: number;
}

interface MerchantsApiResponse {
  code: number;
  msg: string;
  data: {
    page: {
      total: number;
      all_page: number;
      current_page: number;
      page_size: number;
    };
    list: MerchantApiItem[];
  };
}


// 将API响应数据转换为SubMerchant格式
const convertApiMerchantToSubMerchant = (apiItem: MerchantApiItem): SubMerchant => {
  // 转换资产数据
  const assets: SubMerchantAsset[] = Object.entries(apiItem.amount || {}).map(([currency, data]) => {
    const available = typeof data.available === 'string' ? parseFloat(data.available) : data.available || 0;
    const frozen = typeof data.freeze === 'string' ? parseFloat(data.freeze) : data.freeze || 0;
    const balance = available + frozen;
    return {
      currency,
      balance,
      frozen,
      available,
    };
  });

  // 转换状态：1 -> active, 0 -> inactive
  const status: SubMerchant["status"] = apiItem.status === "1" ? "active" : "inactive";

  // 转换时间戳为ISO字符串
  const createdAt = apiItem.addtime && apiItem.addtime !== "0" 
    ? new Date(parseInt(apiItem.addtime) * 1000).toISOString()
    : new Date().toISOString();

  return {
    id: apiItem.id,
    merchantId: apiItem.id, // 使用id作为商户ID
    name: apiItem.nickname || "",
    telegramAccount: apiItem.tg_account || "",
    walletId: apiItem.wallet_id || "",
    status,
    balance: apiItem.balance || 0,
    balanceUSDT: apiItem.balance || 0, // API返回的balance已经是USDT
    assets,
    totalOrders: apiItem.order_num || 0,
    createdAt,
    channel_fees: apiItem.channel_fees || {},
  };
};

// 下级商户管理组件
export function SubMerchantsManagement() {
  const [, navigate] = useLocation();
  const [searchNickname, setSearchNickname] = useState("");

  // 使用useInfiniteQuery获取商户列表
  const {
    data: merchantsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery<MerchantsApiResponse>({
    queryKey: ["merchants", searchNickname],
    queryFn: async ({ pageParam = 1 }) => {
      const params: any = {
        pageNum: pageParam,
        pageSize: 15,
      };
      if (searchNickname.trim()) {
        params.nickname = searchNickname.trim();
      }
      const response = await apiRequest<MerchantsApiResponse>(
        'POST',
        '/api/Index/mercharts',
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

  // 将API数据转换为SubMerchant数组
  const subMerchants = useMemo(() => {
    if (!merchantsData?.pages) return [];
    const allMerchants: SubMerchant[] = [];
    merchantsData.pages.forEach((page) => {
      if (page.data?.list) {
        page.data.list.forEach((item) => {
          allMerchants.push(convertApiMerchantToSubMerchant(item));
        });
      }
    });
    return allMerchants;
  }, [merchantsData]);
  const [isAssetDialogOpen, setIsAssetDialogOpen] = useState(false);
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState(false);
  const [isBrandDialogOpen, setIsBrandDialogOpen] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<SubMerchant | null>(null);
  const [editName, setEditName] = useState("");
  const [editTelegram, setEditTelegram] = useState("");
  const [walletId, setWalletId] = useState("");
  const [configCurrencyTab, setConfigCurrencyTab] = useState("CNY");
  const [isAddingMerchant, setIsAddingMerchant] = useState(false);
  const [brandName, setBrandName] = useState("BeingFi");
  const [editBrandName, setEditBrandName] = useState("BeingFi");
  const [telegramBot, setTelegramBot] = useState("");
  const [editTelegramBot, setEditTelegramBot] = useState("");
  const [botUsername, setBotUsername] = useState("");
  const [isSavingBrand, setIsSavingBrand] = useState(false);
  const [customerServiceLink, setCustomerServiceLink] = useState("");
  const [editCustomerServiceLink, setEditCustomerServiceLink] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [editCustomDomain, setEditCustomDomain] = useState("");
  const [domainStatus, setDomainStatus] = useState<"idle" | "checking" | "connected" | "failed">("idle");
  const [domainError, setDomainError] = useState("");
  const [copiedCname, setCopiedCname] = useState(false);
  const { toast } = useToast();
  const { data: currencyList = [] } = useCurrencyList();

  // 所有通道列表
  const [allChannels, setAllChannels] = useState<Array<{
    channelid: string;
    channel_title: string;
    currency: string;
    paytype: string;
    paytype_name?: string;
    channel_type?: string | number;
  }>>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);

  // 通道手续费配置
  const [channelFees, setChannelFees] = useState<{ [channelid: string]: {
    receive_commission: string;
    receive_fee: string;
    payment_commission: string;
    payment_fee: string;
    punish_commission?: string;
    overtime_penalties?: any[];
  } }>({});

  // 正在编辑的通道ID
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);

  // 加载所有通道数据
  useEffect(() => {
    const loadAllChannels = async () => {
      if (currencyList.length === 0) return;
      
      setIsLoadingChannels(true);
      try {
        const channels: Array<{
          channelid: string;
          channel_title: string;
          currency: string;
          paytype: string;
          paytype_name?: string;
          channel_type?: string | number;
        }> = [];
        
        // 遍历所有币种
        for (const currencyItem of currencyList) {
          try {
            // 获取该币种的支付类型
            const payTypeResponse = await apiRequest('POST', '/Api/Index/paytypes', { 
              currency: currencyItem.currency 
            });
            
            if (payTypeResponse.code === 0 && payTypeResponse.data && Array.isArray(payTypeResponse.data)) {
              // 遍历每个支付类型
              for (const payType of payTypeResponse.data) {
                try {
                  // 获取该支付类型的通道列表
                  const channelResponse = await apiRequest('POST', '/Api/Index/payTypeList', { 
                    paytype: payType.id 
                  });
                  
                  if (channelResponse.code === 0 && channelResponse.data && Array.isArray(channelResponse.data)) {
                    // 添加通道到列表
                    channelResponse.data.forEach((channel: any) => {
                      channels.push({
                        channelid: channel.channelid || channel.id,
                        channel_title: channel.channel_title || channel.title || channel.name || '',
                        currency: currencyItem.currency,
                        paytype: payType.id,
                        paytype_name: payType.name || payType.title,
                        channel_type: channel.channel_type,
                      });
                    });
                  }
                } catch (error) {
                  console.error(`加载币种 ${currencyItem.currency} 支付类型 ${payType.id} 的通道失败:`, error);
                }
              }
            }
          } catch (error) {
            console.error(`加载币种 ${currencyItem.currency} 的支付类型失败:`, error);
          }
        }
        
        setAllChannels(channels);
      } catch (error) {
        console.error('加载通道列表失败:', error);
      } finally {
        setIsLoadingChannels(false);
      }
    };
    
    loadAllChannels();
  }, [currencyList]);

  // 初始化通道手续费配置（从商户数据中加载）
  useEffect(() => {
    if (selectedMerchant) {
      // 从subMerchants中找到对应的商户数据，获取channel_fees
      const merchant = subMerchants.find(m => m.id === selectedMerchant.id);
      if (merchant && merchant.channel_fees) {
        // 转换channel_fees格式，确保字段类型正确
        const fees: { [channelid: string]: {
          receive_commission: string;
          receive_fee: string;
          payment_commission: string;
          payment_fee: string;
          punish_commission?: string;
          overtime_penalties?: any[];
        } } = {};
        Object.entries(merchant.channel_fees).forEach(([channelid, feeConfig]: [string, any]) => {
          fees[channelid] = {
            receive_commission: feeConfig.receive_commission?.toString() || "",
            receive_fee: feeConfig.receive_fee?.toString() || "",
            payment_commission: feeConfig.payment_commission?.toString() || "",
            payment_fee: feeConfig.payment_fee?.toString() || "",
            punish_commission: feeConfig.punish_commission?.toString() || "",
            overtime_penalties: feeConfig.overtime_penalties || [],
          };
        });
        setChannelFees(fees);
      } else {
        setChannelFees({});
      }
    } else {
      setChannelFees({});
    }
  }, [selectedMerchant, subMerchants]);

  // 搜索功能已通过API参数实现，这里不需要前端过滤
  const filteredMerchants = subMerchants;

  const getStatusBadge = (status: SubMerchant["status"]) => {
    const config = {
      active: { label: "正常", className: "bg-green-100 text-green-800" },
      inactive: { label: "停用", className: "bg-gray-100 text-gray-800" },
      pending: { label: "待审核", className: "bg-yellow-100 text-yellow-800" },
    };
    const { label, className } = config[status];
    return <Badge className={className}>{label}</Badge>;
  };

  const handleViewAssets = (merchant: SubMerchant) => {
    setSelectedMerchant(merchant);
    setIsAssetDialogOpen(true);
  };

  const handleOpenConfigDrawer = (merchant: SubMerchant) => {
    setSelectedMerchant(merchant);
    setEditName(merchant.name);
    setWalletId(merchant.walletId || "");
    // 设置默认币种为第一个币种
    if (currencyList.length > 0) {
      setConfigCurrencyTab(currencyList[0].currency);
    } else {
      setConfigCurrencyTab("CNY");
    }
    setIsConfigDrawerOpen(true);
  };

  const handleSaveName = async () => {
    if (!selectedMerchant || !editName.trim()) {
      toast({ 
        title: "请填写完整", 
        description: "商户名称不能为空", 
        variant: "destructive" 
      });
      return;
    }

    try {
      const response = await apiRequest<{ code: number; msg?: string; data?: any }>(
        'POST',
        '/api/Index/editMerchart',
        {
          id: selectedMerchant.id,
          nickname: editName.trim(),
          wallet_id: selectedMerchant.walletId || "",
        }
      );

      if (response.code === 200 || response.code === 0) {
        toast({ title: "保存成功", description: "商户名称已更新" });
        // 刷新商户列表
        refetch();
      } else {
        throw new Error(response.msg || "更新失败");
      }
    } catch (error: any) {
      console.error('保存商户名称失败:', error);
      toast({
        title: "保存失败",
        description: error.message || "网络错误，请重试",
        variant: "destructive",
      });
    }
  };

  const handleSaveWalletId = async () => {
    if (!selectedMerchant || !walletId.trim()) {
      toast({ 
        title: "请填写完整", 
        description: "钱包ID不能为空", 
        variant: "destructive" 
      });
      return;
    }

    try {
      const response = await apiRequest<{ code: number; msg?: string; data?: any }>(
        'POST',
        '/api/Index/editMerchart',
        {
          id: selectedMerchant.id,
          nickname: selectedMerchant.name,
          wallet_id: walletId.trim(),
        }
      );

      if (response.code === 200 || response.code === 0) {
        toast({ title: "保存成功", description: "钱包ID已更新" });
        // 刷新商户列表
        refetch();
      } else {
        throw new Error(response.msg || "更新失败");
      }
    } catch (error: any) {
      console.error('保存钱包ID失败:', error);
      toast({
        title: "保存失败",
        description: error.message || "网络错误，请重试",
        variant: "destructive",
      });
    }
  };

  // 处理通道手续费变化
  const handleChannelFeeChange = (channelid: string, field: "receive_commission" | "receive_fee" | "payment_commission" | "payment_fee" | "punish_commission", value: string) => {
    setChannelFees(prev => ({
      ...prev,
      [channelid]: {
        ...prev[channelid] || { 
          receive_commission: "", 
          receive_fee: "",
          payment_commission: "", 
          payment_fee: "",
          punish_commission: "",
          overtime_penalties: []
        },
        [field]: value
      }
    }));
  };

  // 保存通道手续费配置
  const handleSaveChannelFee = async (channelid: string) => {
    if (!selectedMerchant) return;

    try {
      const feeConfig = channelFees[channelid];
      if (!feeConfig) return;

      const response = await apiRequest<{ code: number; msg?: string; data?: any }>(
        'POST',
        '/api/Index/editMerchart',
        {
          id: selectedMerchant.id,
          nickname: selectedMerchant.name,
          wallet_id: selectedMerchant.walletId || "",
          channel_fees: {
            [channelid]: feeConfig
          }
        }
      );

      if (response.code === 200 || response.code === 0) {
        toast({ title: "保存成功", description: "通道费率已更新" });
        setEditingChannelId(null);
        refetch();
      } else {
        throw new Error(response.msg || "更新失败");
      }
    } catch (error: any) {
      console.error('保存通道费率失败:', error);
      toast({
        title: "保存失败",
        description: error.message || "网络错误，请重试",
        variant: "destructive",
      });
    }
  };

  const handleOpenAddDrawer = () => {
    setSelectedMerchant(null);
    setEditName("");
    setWalletId("");
    // 设置默认币种为第一个币种
    if (currencyList.length > 0) {
      setConfigCurrencyTab(currencyList[0].currency);
    } else {
      setConfigCurrencyTab("CNY");
    }
    setIsConfigDrawerOpen(true);
  };

  const handleAddMerchant = async () => {
    if (!editName.trim() || !walletId.trim()) {
      toast({ 
        title: "请填写完整", 
        description: "商户名称和钱包ID不能为空", 
        variant: "destructive" 
      });
      return;
    }

    setIsAddingMerchant(true);
    try {
      const response = await apiRequest<{ code: number; msg?: string; data?: any }>(
        'POST',
        '/api/Index/addMerchart',
        {
          nickname: editName.trim(),
          wallet_id: walletId.trim(),
        }
      );

      if (response.code === 200 || response.code === 0) {
        setIsConfigDrawerOpen(false);
        setEditName("");
        setWalletId("");
        toast({ 
          title: "添加成功", 
          description: "下级商户已成功添加" 
        });
        // 刷新商户列表
        refetch();
      } else {
        throw new Error(response.msg || "添加失败");
      }
    } catch (error: any) {
      console.error('添加商户失败:', error);
      toast({
        title: "添加失败",
        description: error.message || "网络错误，请重试",
        variant: "destructive",
      });
    } finally {
      setIsAddingMerchant(false);
    }
  };

  // 获取品牌配置
  const handleGetBrandConfig = async () => {
    try {
      const response = await apiRequest<{
        code: number;
        msg?: string;
        data?: {
          name: string;
          bot_token: string;
          domain: string;
          support_link: string;
        };
      }>('POST', '/api/Index/getTgbotConfig');

      if (response.code === 200 || response.code === 0) {
        const configData = response.data || {};
        setBrandName(configData.name || "");
        setEditBrandName(configData.name || "");
        setTelegramBot(configData.bot_token || "");
        setEditTelegramBot(configData.bot_token || "");
        setCustomerServiceLink(configData.support_link || "");
        setEditCustomerServiceLink(configData.support_link || "");
        setCustomDomain(configData.domain || "");
        setEditCustomDomain(configData.domain || "");
        setDomainStatus(configData.domain ? "connected" : "idle");
        setDomainError("");
      }
    } catch (error: any) {
      console.error('获取品牌配置失败:', error);
      toast({
        title: "获取配置失败",
        description: error.message || "网络错误，请重试",
        variant: "destructive",
      });
    }
  };

  // 打开品牌配置对话框
  const handleOpenBrandDialog = async () => {
    setIsBrandDialogOpen(true);
    await handleGetBrandConfig();
  };

  const handleSaveBrand = async () => {
    if (!editBrandName.trim()) {
      toast({ title: "品牌名称不能为空", variant: "destructive" });
      return;
    }
    setIsSavingBrand(true);
    
    try {
      const response = await apiRequest<{ code: number; msg?: string; data?: any }>(
        'POST',
        '/api/Index/setTgbotConfig',
        {
          name: editBrandName.trim(),
          bot_token: editTelegramBot.trim(),
          domain: editCustomDomain.trim(),
          support_link: editCustomerServiceLink.trim(),
        }
      );

      if (response.code === 200 || response.code === 0) {
        setBrandName(editBrandName.trim());
        setTelegramBot(editTelegramBot.trim());
        setCustomerServiceLink(editCustomerServiceLink.trim());
        setCustomDomain(editCustomDomain.trim());
        if (editCustomDomain.trim()) {
          setDomainStatus("connected");
        }
        toast({ 
          title: "保存成功", 
          description: "品牌配置已更新" 
        });
      } else {
        throw new Error(response.msg || "保存失败");
      }
    } catch (error: any) {
      console.error('保存配置失败:', error);
      toast({ 
        title: "保存失败", 
        description: error.message || "网络错误，请重试", 
        variant: "destructive" 
      });
    } finally {
      setIsSavingBrand(false);
    }
  };

  const handlePreviewMerchantDashboard = () => {
    navigate('/merchant');
  };

  const handleVerifyDomain = async () => {
    if (!editCustomDomain.trim()) {
      toast({ title: "请输入域名", variant: "destructive" });
      return;
    }
    
    setDomainStatus("checking");
    setDomainError("");
    
    try {
      // 模拟DNS验证过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 验证域名格式
      const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
      if (!domainRegex.test(editCustomDomain.trim())) {
        setDomainStatus("failed");
        setDomainError("域名格式无效，请检查后重试");
        return;
      }
      
      // 模拟随机成功/失败（实际环境中会真正验证DNS）
      const isSuccess = Math.random() > 0.3;
      
      if (isSuccess) {
        setDomainStatus("connected");
        setCustomDomain(editCustomDomain.trim());
        toast({ title: "域名连接成功", description: "您的自定义域名已成功绑定" });
      } else {
        setDomainStatus("failed");
        setDomainError("DNS记录未检测到，请确认CNAME记录已正确配置并等待DNS生效（最长可能需要48小时）");
      }
    } catch (error) {
      console.error('域名验证失败:', error);
      setDomainStatus("failed");
      setDomainError("网络错误，请稍后重试");
    }
  };

  const handleCopyCname = () => {
    navigator.clipboard.writeText("merchant.bepay.app");
    setCopiedCname(true);
    setTimeout(() => setCopiedCname(false), 2000);
    toast({ title: "已复制", description: "CNAME记录值已复制到剪贴板" });
  };

  return (
    <div className="space-y-4 md:space-y-6 bg-white rounded-lg p-4 md:p-6 min-h-[calc(100vh-64px)]">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">下级商户</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            size="sm"
            onClick={handleOpenBrandDialog}
            data-testid="button-brand-config"
          >
            <Settings className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">品牌配置</span>
          </Button>
          <Button 
            className="bg-gray-900 text-white hover:bg-gray-800"
            size="sm"
            onClick={handleOpenAddDrawer}
            data-testid="button-add-sub-merchant"
          >
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">添加商户</span>
          </Button>
        </div>
      </div>

      <Card className="bg-white">
        <CardContent className="p-3 md:p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索商户名称"
                className="pl-10 bg-white border-gray-300 w-full text-black"
                value={searchNickname}
                onChange={(e) => setSearchNickname(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && refetch()}
                data-testid="input-search-sub-merchant"
              />
            </div>
            <Button 
              className="bg-gray-900 text-white hover:bg-gray-800 shrink-0" 
              size="sm" 
              onClick={() => refetch()}
              data-testid="button-search-sub-merchant"
            >
              <Search className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">搜索</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 桌面端表格 */}
      <Card className="bg-white hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-black font-medium">商户ID</TableHead>
                <TableHead className="text-black font-medium">商户名称</TableHead>
                <TableHead className="text-black font-medium">钱包ID</TableHead>
                <TableHead className="text-black font-medium">资产余额</TableHead>
                <TableHead className="text-black font-medium">订单数</TableHead>
                <TableHead className="text-black font-medium">状态</TableHead>
                <TableHead className="text-black font-medium">注册时间</TableHead>
                <TableHead className="text-right text-black font-medium">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && filteredMerchants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : filteredMerchants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                filteredMerchants.map((merchant) => (
                  <TableRow key={merchant.id}>
                    <TableCell className="font-mono text-sm text-black">{merchant.merchantId}</TableCell>
                    <TableCell className="font-medium text-black">{merchant.name}</TableCell>
                    <TableCell className="font-mono text-sm text-black">{merchant.walletId || "-"}</TableCell>
                    <TableCell className="text-black">
                      <button
                        onClick={() => handleViewAssets(merchant)}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        data-testid={`button-view-assets-${merchant.id}`}
                      >
                        {merchant.balanceUSDT.toLocaleString("zh-CN", { minimumFractionDigits: 2 })} USDT
                      </button>
                    </TableCell>
                    <TableCell className="text-black">{merchant.totalOrders}</TableCell>
                    <TableCell className="text-black">{getStatusBadge(merchant.status)}</TableCell>
                    <TableCell className="text-black text-sm">
                      {new Date(merchant.createdAt).toLocaleDateString("zh-CN")}
                    </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleOpenConfigDrawer(merchant)}
                      className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
                      data-testid={`button-config-merchant-${merchant.id}`}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      配置
                    </Button>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {hasNextPage && (
            <div className="flex justify-center py-4 border-t border-gray-100">
              <Button 
                variant="outline" 
                className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                data-testid="button-load-more-merchants"
              >
                {isFetchingNextPage ? "加载中..." : "加载更多"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 移动端卡片列表 */}
      <div className="md:hidden space-y-3">
        {isLoading && filteredMerchants.length === 0 ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : filteredMerchants.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无数据</div>
        ) : (
          filteredMerchants.map((merchant) => (
            <div 
              key={merchant.id}
              className="border border-gray-200 rounded-lg p-4 bg-white"
              data-testid={`card-merchant-${merchant.id}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">{merchant.name}</div>
                  <div className="text-xs font-mono text-gray-500">{merchant.merchantId}</div>
                </div>
                {getStatusBadge(merchant.status)}
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">钱包ID</span>
                  <span className="font-mono text-gray-900">{merchant.walletId || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">资产余额</span>
                  <button
                    onClick={() => handleViewAssets(merchant)}
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    data-testid={`button-view-assets-mobile-${merchant.id}`}
                  >
                    {merchant.balanceUSDT.toLocaleString("zh-CN", { minimumFractionDigits: 2 })} USDT
                  </button>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">订单数</span>
                  <span className="text-gray-900">{merchant.totalOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">注册时间</span>
                  <span className="text-gray-600">{new Date(merchant.createdAt).toLocaleDateString("zh-CN")}</span>
                </div>
              </div>

            <div className="mt-4 pt-3 border-t border-gray-100">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleOpenConfigDrawer(merchant)}
                className="w-full bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
                data-testid={`button-config-merchant-mobile-${merchant.id}`}
              >
                <Settings className="h-4 w-4 mr-1" />
                配置
              </Button>
            </div>
          </div>
          ))
        )}
        {hasNextPage && (
          <div className="flex justify-center py-4">
            <Button 
              variant="outline" 
              className="w-full bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              data-testid="button-load-more-merchants-mobile"
            >
              {isFetchingNextPage ? "加载中..." : "加载更多"}
            </Button>
          </div>
        )}
      </div>

      <Sheet open={isConfigDrawerOpen} onOpenChange={setIsConfigDrawerOpen}>
        <SheetContent className="w-full sm:w-[480px] sm:max-w-[480px] overflow-y-auto bg-white">
          <SheetHeader>
            <SheetTitle className="text-gray-900">
              {selectedMerchant ? "商户配置" : "添加商户"}
            </SheetTitle>
          </SheetHeader>
          <div className="py-6 space-y-6">
            {/* 基本信息 */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">基本信息</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-gray-600">商户名称</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-white border-gray-300 text-gray-900 flex-1"
                      placeholder="请输入商户名称"
                      data-testid="input-config-name"
                    />
                    {selectedMerchant && (
                      <Button 
                        size="sm"
                        onClick={handleSaveName}
                        disabled={!editName.trim() || editName === selectedMerchant?.name}
                        className="bg-gray-900 text-white hover:bg-gray-800"
                        data-testid="button-save-name"
                      >
                        保存
                      </Button>
                    )}
                  </div>
                </div>
                {selectedMerchant && (
                  <div className="space-y-2">
                    <Label className="text-gray-600">钱包ID <span className="text-red-500">*</span></Label>
                    <div className="flex gap-2">
                      <Input 
                        value={walletId}
                        onChange={(e) => setWalletId(e.target.value)}
                        className="bg-white border-gray-300 text-gray-900 flex-1"
                        placeholder="请输入钱包ID"
                        data-testid="input-config-wallet-id"
                      />
                      <Button 
                        size="sm"
                        onClick={handleSaveWalletId}
                        disabled={!walletId.trim() || walletId === selectedMerchant?.walletId}
                        className="bg-gray-900 text-white hover:bg-gray-800"
                        data-testid="button-save-wallet-id"
                      >
                        保存
                      </Button>
                    </div>
                  </div>
                )}
                {!selectedMerchant && (
                  <div className="space-y-2">
                    <Label className="text-gray-600">钱包ID <span className="text-red-500">*</span></Label>
                    <Input 
                      value={walletId}
                      onChange={(e) => setWalletId(e.target.value)}
                      className="bg-white border-gray-300 text-gray-900 flex-1"
                      placeholder="请输入钱包ID"
                      data-testid="input-wallet-id"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 费率配置 */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">费率配置</h3>
              
              {isLoadingChannels ? (
                <div className="text-center py-8 text-gray-500">加载通道数据中...</div>
              ) : currencyList.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无币种数据</div>
              ) : (
                <>
                  {/* 币种页签 */}
                  <div className="border-b border-gray-200">
                    <div className="flex overflow-x-auto">
                      {currencyList.map((currencyItem) => (
                        <button
                          key={currencyItem.currency}
                          onClick={() => setConfigCurrencyTab(currencyItem.currency)}
                          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                            configCurrencyTab === currencyItem.currency
                              ? "border-gray-900 text-gray-900"
                              : "border-transparent text-gray-500 hover:text-gray-900"
                          }`}
                          data-testid={`tab-config-currency-${currencyItem.currency}`}
                        >
                          {currencyItem.currency}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 通道列表 */}
                  <div className="border border-gray-200 rounded-md p-3 bg-gray-50 max-h-96 overflow-y-auto">
                    <div className="space-y-2">
                      {(() => {
                        const currencyChannels = allChannels.filter(c => c.currency === configCurrencyTab);
                        if (currencyChannels.length === 0) {
                          return <div className="text-center py-4 text-gray-500 text-sm">该币种暂无通道</div>;
                        }
                        
                        // 按支付类型分组
                        const payTypeGroups: { [paytype: string]: typeof currencyChannels } = {};
                        currencyChannels.forEach(channel => {
                          if (!payTypeGroups[channel.paytype]) {
                            payTypeGroups[channel.paytype] = [];
                          }
                          payTypeGroups[channel.paytype].push(channel);
                        });
                        
                        return Object.entries(payTypeGroups).map(([paytype, channels]) => {
                          return (
                            <div key={paytype} className="space-y-2">
                              {channels.map((channel) => {
                                const feeConfig = channelFees[channel.channelid] || { 
                                  receive_commission: "", 
                                  receive_fee: "",
                                  payment_commission: "", 
                                  payment_fee: "",
                                  punish_commission: "",
                                  overtime_penalties: []
                                };
                                const isEditing = editingChannelId === channel.channelid;
                                
                                return (
                                  <div 
                                    key={channel.channelid} 
                                    className="border border-gray-200 rounded-md p-3 bg-white cursor-pointer"
                                    onClick={() => {
                                      if (isEditing) {
                                        setEditingChannelId(null);
                                      } else {
                                        setEditingChannelId(channel.channelid);
                                      }
                                    }}
                                  >
                                    {!isEditing ? (
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                              {(() => {
                                                const channelType = channel.channel_type;
                                                if (channelType === 2 || channelType === "2") {
                                                  return <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">代收</span>;
                                                } else if (channelType === 1 || channelType === "1") {
                                                  return <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">代付</span>;
                                                }
                                                return null;
                                              })()}
                                              <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900">
                                                  {channel.channel_title || channel.channelid}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                  {channel.channelid}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        <Pencil className="h-4 w-4 text-gray-400" />
                                      </div>
                                    ) : (
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <div className="flex flex-col">
                                              <div className="flex items-center gap-2">
                                                {(() => {
                                                  const channelType = channel.channel_type;
                                                  if (channelType === 2 || channelType === "2") {
                                                    return <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">代收</span>;
                                                  } else if (channelType === 1 || channelType === "1") {
                                                    return <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">代付</span>;
                                                  }
                                                  return null;
                                                })()}
                                                <div className="flex flex-col">
                                                  <span className="text-sm font-medium text-gray-900">
                                                    {channel.channel_title || channel.channelid}
                                                  </span>
                                                  <span className="text-xs text-gray-500">
                                                    {channel.channelid}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* 手续费输入字段 */}
                                        <div className="grid grid-cols-2 gap-3">
                                          <div className="space-y-1">
                                            <Label className="text-xs text-gray-600">代收手续费 (%)</Label>
                                            <input
                                              type="number"
                                              step="0.01"
                                              value={feeConfig.receive_commission}
                                              onChange={(e) => handleChannelFeeChange(channel.channelid, "receive_commission", e.target.value)}
                                              className="w-full h-9 px-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs text-gray-600">代收单笔固定手续费</Label>
                                            <input
                                              type="number"
                                              step="0.01"
                                              value={feeConfig.receive_fee}
                                              onChange={(e) => handleChannelFeeChange(channel.channelid, "receive_fee", e.target.value)}
                                              className="w-full h-9 px-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs text-gray-600">代付手续费 (%)</Label>
                                            <input
                                              type="number"
                                              step="0.01"
                                              value={feeConfig.payment_commission}
                                              onChange={(e) => handleChannelFeeChange(channel.channelid, "payment_commission", e.target.value)}
                                              className="w-full h-9 px-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs text-gray-600">代付单笔固定手续费</Label>
                                            <input
                                              type="number"
                                              step="0.01"
                                              value={feeConfig.payment_fee}
                                              onChange={(e) => handleChannelFeeChange(channel.channelid, "payment_fee", e.target.value)}
                                              className="w-full h-9 px-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                          </div>
                                        </div>

                                        <div className="flex justify-end gap-2 pt-2">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingChannelId(null);
                                            }}
                                            className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                          >
                                            取消
                                          </Button>
                                          <Button
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleSaveChannelFee(channel.channelid);
                                            }}
                                            className="bg-gray-900 text-white hover:bg-gray-800"
                                          >
                                            保存
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 添加模式下的确认按钮 */}
            {!selectedMerchant && (
              <div className="pt-4 border-t border-gray-200">
                <Button 
                  className="w-full bg-gray-900 text-white hover:bg-gray-800"
                  onClick={handleAddMerchant}
                  disabled={isAddingMerchant}
                  data-testid="button-confirm-add-merchant"
                >
                  {isAddingMerchant ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      添加中...
                    </>
                  ) : (
                    "确认添加"
                  )}
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isAssetDialogOpen} onOpenChange={setIsAssetDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {selectedMerchant?.name} - 资产明细
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-medium text-black">币种</TableHead>
                  <TableHead className="text-right font-medium text-black">总余额</TableHead>
                  <TableHead className="text-right font-medium text-black">可用余额</TableHead>
                  <TableHead className="text-right font-medium text-black">冻结资金</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedMerchant?.assets.map((asset) => (
                  <TableRow key={asset.currency}>
                    <TableCell className="font-medium text-black">{asset.currency}</TableCell>
                    <TableCell className="text-right font-medium text-black">
                      {asset.balance.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {asset.available.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-medium text-orange-500">
                      {asset.frozen.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">折合USDT总额</span>
                <span className="text-xl font-bold text-gray-900">
                  {selectedMerchant?.balanceUSDT.toLocaleString("zh-CN", { minimumFractionDigits: 2 })} USDT
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              className="bg-gray-900 text-white hover:bg-gray-800" 
              onClick={() => setIsAssetDialogOpen(false)}
              data-testid="button-close-asset-dialog"
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBrandDialogOpen} onOpenChange={setIsBrandDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <DialogHeader>
            <DialogTitle className="text-gray-900">品牌配置</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-600">品牌名称</Label>
              <Input 
                value={editBrandName}
                onChange={(e) => setEditBrandName(e.target.value)}
                className="bg-white border-gray-300 text-gray-900"
                placeholder="请输入品牌名称"
                data-testid="input-brand-name"
              />
              <p className="text-xs text-gray-500">
                当前品牌名称将显示在商户登录页面
              </p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-gray-600">TelegramBot Token</Label>
              <Input 
                value={editTelegramBot}
                onChange={(e) => setEditTelegramBot(e.target.value)}
                className="bg-white border-gray-300 text-gray-900"
                placeholder="请输入TelegramBot Token"
                data-testid="input-telegram-bot"
              />
              <p className="text-xs text-gray-500">
                用于给下级商户发送登录验证码
              </p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-gray-600">客服Telegram链接</Label>
              <Input 
                value={editCustomerServiceLink}
                onChange={(e) => setEditCustomerServiceLink(e.target.value)}
                className="bg-white border-gray-300 text-gray-900"
                placeholder="例如: https://t.me/your_support"
                data-testid="input-customer-service-link"
              />
              <p className="text-xs text-gray-500">
                商户点击"联系客服"按钮时将跳转到此链接
              </p>
            </div>
            
            <Button 
              onClick={handleSaveBrand}
              disabled={!editBrandName.trim() || isSavingBrand}
              className="w-full bg-gray-900 text-white hover:bg-gray-800"
              data-testid="button-save-brand"
            >
              {isSavingBrand ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存配置'
              )}
            </Button>
            
            {/* 域名配置 */}
            <div className="pt-4 border-t border-gray-200 space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-gray-600" />
                <h4 className="font-medium text-gray-900">自定义域名</h4>
                {domainStatus === "connected" && customDomain && (
                  <Badge className="bg-green-100 text-green-800">已连接</Badge>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-600">商户后台域名</Label>
                <div className="flex gap-2">
                  <Input 
                    value={editCustomDomain}
                    onChange={(e) => {
                      setEditCustomDomain(e.target.value);
                      if (domainStatus !== "idle") {
                        setDomainStatus("idle");
                        setDomainError("");
                      }
                    }}
                    className="bg-white border-gray-300 text-gray-900 flex-1"
                    placeholder="例如: merchant.yourdomain.com"
                    data-testid="input-custom-domain"
                  />
                  <Button
                    onClick={handleVerifyDomain}
                    disabled={domainStatus === "checking" || !editCustomDomain.trim()}
                    className={
                      domainStatus === "connected" 
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }
                    data-testid="button-verify-domain"
                  >
                    {domainStatus === "checking" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        验证中
                      </>
                    ) : domainStatus === "connected" ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        已连接
                      </>
                    ) : (
                      "连接"
                    )}
                  </Button>
                </div>
                
                {domainError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">{domainError}</p>
                  </div>
                )}
              </div>
              
              {/* DNS配置指引 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <h5 className="text-sm font-medium text-blue-900 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  DNS配置指引
                </h5>
                <p className="text-xs text-blue-700">
                  请在您的域名DNS管理面板添加以下CNAME记录：
                </p>
                
                <div className="bg-white rounded border border-blue-200 p-3 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">记录类型</span>
                    <span className="font-mono text-gray-900">CNAME</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">主机记录</span>
                    <span className="font-mono text-gray-900">
                      {editCustomDomain ? editCustomDomain.split('.')[0] : 'merchant'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">记录值</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-gray-900">merchant.bepay.app</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={handleCopyCname}
                        data-testid="button-copy-cname"
                      >
                        {copiedCname ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-blue-600 space-y-1">
                  <p>• DNS解析生效时间通常为5分钟至48小时</p>
                  <p>• 配置完成后点击"连接"按钮验证</p>
                  <p>• 验证成功后商户可通过自定义域名访问后台</p>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-green-900 mb-2">✅ 自动配置功能</h4>
                <p className="text-xs text-green-700 mb-2">
                  保存Bot Token后，系统会自动完成以下配置：
                </p>
                <ul className="text-xs text-green-700 space-y-1 list-disc list-inside">
                  <li>设置Webhook接收用户消息</li>
                  <li>配置左下角"商户后台"菜单按钮</li>
                  <li>用户发送消息或在群组说"商户后台"自动回复登录按钮</li>
                </ul>
                <p className="text-xs text-green-600 mt-2">
                  商户点击Bot链接或在群组点击按钮，即可通过Telegram账号自动登录商户后台
                </p>
              </div>
              
              <Button 
                variant="outline"
                className="w-full bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                onClick={handlePreviewMerchantDashboard}
                data-testid="button-preview-merchant-dashboard"
              >
                <Globe className="h-4 w-4 mr-2" />
                查看商户后台
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

