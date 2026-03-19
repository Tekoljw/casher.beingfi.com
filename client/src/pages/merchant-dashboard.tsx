import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { apiRequest, BASE_URL } from "@/lib/queryClient";
import { 
  BarChart3, 
  Wallet, 
  ShoppingCart, 
  Users, 
  Receipt,
  Settings,
  LogOut,
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  Download,
  Eye,
  Copy,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  Plus,
  MoreHorizontal,
  Building2,
  CreditCard,
  Coins,
  DollarSign,
  Calendar,
  User,
  Mail,
  Phone,
  Key,
  Shield,
  Link,
  RotateCcw,
  EyeOff,
  Banknote,
  ArrowRightLeft,
  Send,
  Edit,
  Menu,
  X,
  Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useCurrencyList } from "@/hooks/use-currency-list";
import { useLanguage } from "@/hooks/use-language";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface Asset {
  currency: string;
  balance: number;
  frozen: number;
  available: number;
  icon: string;
}

interface Order {
  id: string;
  orderNo: string;
  externalOrderNo: string;
  paymentOrderId?: string; // 商户订单号
  type: "deposit" | "withdraw";
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "processing" | "closed";
  createdAt: string;
  completedAt?: string;
  channel: string;
  channelId?: string | number; // 通道ID
}

// 订单API响应接口
interface OrderApiItem {
  id: string;
  otype: string; // "1" 代付, "2" 代收
  userid: string;
  orderid: string;
  out_order_id: string;
  payment_order_id?: string;
  mch_no: string;
  appid: string;
  amount: string;
  amount_actual: string;
  mch_fee_amount: string;
  bank_name: string;
  account_name: string;
  account_no: string;
  currency: string;
  status: string; // "0" 待处理, "1" 处理中, "2" 支付成功, "3" 支付失败, "6" 订单关闭
  remarks: string;
  clientip: string;
  created_at: string;
  success_time: string;
  req_time: string;
  addtime: string;
  updatetime: string;
  username: string;
  pay_bank: string | null;
  pay_proof: string;
  pay_channelid: number;
  pay_channel_name: string;
}

interface OrdersApiResponse {
  code: number;
  msg: string;
  data: {
    page: {
      total: number;
      all_page: number;
      current_page: number;
      page_size: number;
    };
    list: OrderApiItem[];
  };
}

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

interface Commission {
  id: string;
  orderId: string;
  subMerchantId: string;
  subMerchantName: string;
  amount: number;
  rate: number;
  orderAmount: number;
  currency: string;
  status: "pending" | "settled";
  createdAt: string;
  settledAt?: string;
}

// 佣金记录API响应接口
interface CommissionRecordItem {
  id: string;
  userid: string;
  orderid: string;
  currency: string;
  amount: string; // 佣金金额
  order_amount: string; // 订单金额
  scale: string; // 佣金比例
  addtime: string; // 时间戳
  merchart_name: string; // 下级商户名称
}

interface CommissionListApiResponse {
  code: number;
  msg?: string;
  data?: {
    page: {
      total: number;
      all_page: number;
      current_page: number;
      page_size: number;
    };
    report: {
      total: string | number; // 累计佣金
      settle: string | number; // 已结算佣金
      settle_pending: string | number; // 待结算佣金
    };
    list: CommissionRecordItem[];
  };
}

const menuItems: MenuItem[] = [
  { id: "assets", label: "商户资产", icon: Wallet },
  { id: "orders", label: "订单管理", icon: ShoppingCart },
  { id: "sub-merchants", label: "下级商户", icon: Users },
  { id: "commissions", label: "佣金记录", icon: Receipt },
  { id: "api", label: "API管理", icon: Key },
];

// API响应接口
interface UserAssetsApiResponse {
  code: number;
  msg?: string;
  data?: {
    available_balance: number;
    freeze_balance: number;
    user_amount: {
      [currency: string]: {
        available: string | number;
        freeze: string | number;
      };
    };
  };
}

// 冻结记录接口响应
interface FrozenRecordItem {
  id: string;
  userid: string;
  settleid: string;
  currency: string;
  amount: string;
  status: string; // "1" 冻结中；"2" 已解冻
  remark: string;
  addtime: string; // 时间戳
}

interface FrozenRecordsApiResponse {
  code: number;
  msg?: string;
  data?: {
    page: {
      total: number;
      all_page: number;
      current_page: number;
      page_size: number;
    };
    list: FrozenRecordItem[];
  };
}

// 结算记录接口响应
interface SettlementRecordItem {
  id: string;
  is_team: string;
  user_id: string;
  type: string;
  orderid: string;
  currency: string;
  received_currency: string;
  amount: string;
  received_amount: string;
  status: string; // "1" 待处理；"3" 已拒绝；"4" 已完成
  rate: string;
  actual_rate: string;
  loss_amount: string;
  remark: string | null;
  address: string | null;
  addtime: string; // 时间戳
  executetime: string;
  title: string;
  merchart_name: string;
}

interface SettlementRecordsApiResponse {
  code: number;
  msg?: string;
  data?: {
    page: {
      total: number;
      all_page: number;
      current_page: number;
      page_size: number;
    };
    list: SettlementRecordItem[];
  };
}

// 币种图标映射
const getCurrencyIcon = (currency: string): string => {
  const iconMap: Record<string, string> = {
    CNY: "¥",
    USDT: "₮",
    USD: "$",
    EUR: "€",
    GBP: "£",
    MYR: "RM",
    VND: "₫",
    THB: "฿",
    MMK: "K",
  };
  return iconMap[currency] || currency;
};

const mockAssets: Asset[] = [
  { currency: "CNY", balance: 1250000.00, frozen: 50000.00, available: 1200000.00, icon: "¥" },
  { currency: "USDT", balance: 85000.00, frozen: 5000.00, available: 80000.00, icon: "₮" },
  { currency: "USD", balance: 42000.00, frozen: 2000.00, available: 40000.00, icon: "$" },
];

interface ApplySettlementDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { currency: string; amount: number; usdtAddress: string }) => void | Promise<void>;
  initialCurrency?: string;
  initialAvailable?: number;
  isSubmitting?: boolean;
}

function ApplySettlementDialog({ 
  isOpen, 
  onOpenChange, 
  onSubmit, 
  initialCurrency = "CNY",
  initialAvailable,
  isSubmitting = false
}: ApplySettlementDialogProps) {
  const [selectedCurrency, setSelectedCurrency] = useState(initialCurrency);
  const [settleAmount, setSettleAmount] = useState("");
  const [usdtAddress, setUsdtAddress] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedCurrency(initialCurrency);
      setSettleAmount("");
      setUsdtAddress("");
    }
  }, [isOpen, initialCurrency]);

  const getAvailableBalance = () => {
    if (initialAvailable !== undefined) return initialAvailable;
    const asset = mockAssets.find(a => a.currency === selectedCurrency);
    return asset?.available || 0;
  };

  const handleSubmit = async () => {
    if (!settleAmount || parseFloat(settleAmount) <= 0 || !usdtAddress.trim()) return;
    await onSubmit({
      currency: selectedCurrency,
      amount: parseFloat(settleAmount),
      usdtAddress: usdtAddress.trim()
    });
    setSettleAmount("");
    setUsdtAddress("");
  };

  const availableBalance = getAvailableBalance();
  const showCurrencySelect = initialCurrency === undefined || initialAvailable === undefined;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-black">申请结算</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {showCurrencySelect ? (
            <div className="space-y-2">
              <Label className="text-black">结算币种</Label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger className="bg-white border-gray-300" data-testid="select-settlement-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CNY">CNY (人民币)</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="USD">USD (美元)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-lg font-bold text-black border">
                  {selectedCurrency === "CNY" ? "¥" : selectedCurrency === "USDT" ? "₮" : "$"}
                </div>
                <div>
                  <p className="font-semibold text-black">{selectedCurrency}</p>
                  <p className="text-sm text-gray-500">可用余额: {availableBalance.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label className="text-black">结算金额</Label>
            <Input 
              type="number" 
              placeholder="请输入结算金额" 
              className="bg-white border-gray-300 text-black"
              value={settleAmount}
              onChange={(e) => setSettleAmount(e.target.value)}
              data-testid="input-settlement-amount"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                可用余额: {selectedCurrency === "CNY" ? "¥" : selectedCurrency === "USDT" ? "₮" : "$"}{availableBalance.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
              </p>
              <Button 
                variant="link" 
                size="sm" 
                className="text-blue-600 p-0 h-auto text-xs"
                onClick={() => setSettleAmount(availableBalance.toString())}
              >
                全部结算
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-black">USDT收款地址</Label>
            <Input 
              type="text" 
              placeholder="请输入USDT钱包地址 (TRC20/ERC20)" 
              className="bg-white border-gray-300 text-black font-mono text-sm"
              value={usdtAddress}
              onChange={(e) => setUsdtAddress(e.target.value)}
              data-testid="input-usdt-address"
            />
            <p className="text-xs text-gray-500">最终汇率由供应商确认</p>
          </div>
        </div>
        <DialogFooter className="flex-row justify-center gap-3 sm:justify-end">
          <Button variant="outline" className="bg-white text-black border-gray-300 flex-1 sm:flex-none" onClick={() => onOpenChange(false)}>取消</Button>
          <Button 
            className="bg-black text-white hover:bg-gray-800 flex-1 sm:flex-none" 
            onClick={handleSubmit} 
            disabled={!settleAmount || parseFloat(settleAmount) <= 0 || !usdtAddress.trim() || isSubmitting}
            data-testid="button-submit-settlement"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                提交中...
              </>
            ) : (
              '提交申请'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 将API订单数据转换为前端Order格式
const convertApiOrderToOrder = (apiItem: OrderApiItem): Order => {
  // 状态映射: "0" 待处理, "1" 处理中, "2" 支付成功, "3" 支付失败, "6" 订单关闭
  const statusMap: Record<string, Order["status"]> = {
    "0": "pending",
    "1": "processing",
    "2": "completed",
    "3": "failed",
    "6": "closed",
  };
  
  // 类型映射: "1" 代付, "2" 代收
  const typeMap: Record<string, Order["type"]> = {
    "1": "withdraw", // 代付
    "2": "deposit", // 代收
  };
  
  // 转换时间戳为ISO字符串
  const createdAt = apiItem.created_at && apiItem.created_at !== "0"
    ? new Date(parseInt(apiItem.created_at) * 1000).toISOString()
    : new Date().toISOString();
  
  const completedAt = apiItem.success_time && apiItem.success_time !== "0"
    ? new Date(parseInt(apiItem.success_time) * 1000).toISOString()
    : undefined;
  
  return {
    id: apiItem.id,
    orderNo: apiItem.orderid,
    externalOrderNo: apiItem.out_order_id,
    paymentOrderId: apiItem.payment_order_id,
    type: typeMap[apiItem.otype] || "deposit",
    amount: parseFloat(apiItem.amount) || 0,
    currency: apiItem.currency,
    status: statusMap[apiItem.status] || "pending",
    createdAt,
    completedAt,
    channel: apiItem.pay_channel_name || "",
    channelId: apiItem.pay_channelid,
  };
};

const generateMockSubMerchants = (): SubMerchant[] => {
  const names = ["华盛商贸", "金鑫科技", "东方支付", "恒达商务", "银河电商", "天际网络", "星辰数码", "瑞祥贸易"];
  const statuses: SubMerchant["status"][] = ["active", "inactive", "pending"];
  const exchangeRate = 7.2;
  
  return Array.from({ length: 8 }, (_, i) => {
    const cnyBalance = Math.floor(Math.random() * 500000) + 10000;
    const cnyFrozen = Math.floor(cnyBalance * 0.1);
    const usdtBalance = Math.floor(Math.random() * 50000) + 1000;
    const usdtFrozen = Math.floor(usdtBalance * 0.08);
    const usdBalance = Math.floor(Math.random() * 30000) + 500;
    const usdFrozen = Math.floor(usdBalance * 0.05);
    
    const assets: SubMerchantAsset[] = [
      { currency: "CNY", balance: cnyBalance, frozen: cnyFrozen, available: cnyBalance - cnyFrozen },
      { currency: "USDT", balance: usdtBalance, frozen: usdtFrozen, available: usdtBalance - usdtFrozen },
      { currency: "USD", balance: usdBalance, frozen: usdFrozen, available: usdBalance - usdFrozen },
    ];
    
    const balanceUSDT = cnyBalance / exchangeRate + usdtBalance + usdBalance;
    
    const tgAccounts = ["@huasheng_pay", "@jinxin_tech", "@dongfang_pay", "@hengda_biz", "@yinhe_shop", "@tianji_net", "@xingchen_digital", "@ruixiang_trade"];
    return {
      id: `sub_${i + 1}`,
      merchantId: `M${String(10001 + i).padStart(6, "0")}`,
      name: names[i],
      telegramAccount: tgAccounts[i] || `@merchant_${i + 1}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      balance: cnyBalance,
      balanceUSDT,
      assets,
      totalOrders: Math.floor(Math.random() * 1000) + 50,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    };
  });
};

const generateMockCommissions = (): Commission[] => {
  const subMerchants = ["华盛商贸", "金鑫科技", "东方支付", "恒达商务"];
  const currencies = ["CNY", "USDT"];
  const statuses: Commission["status"][] = ["pending", "settled"];
  
  return Array.from({ length: 15 }, (_, i) => {
    const orderAmount = Math.floor(Math.random() * 50000) + 1000;
    const rate = [0.001, 0.002, 0.003, 0.005][Math.floor(Math.random() * 4)];
    return {
      id: `comm_${i + 1}`,
      orderId: `ORD${Date.now()}${String(i + 1).padStart(4, "0")}`,
      subMerchantId: `sub_${(i % 4) + 1}`,
      subMerchantName: subMerchants[i % 4],
      amount: orderAmount * rate,
      rate: rate,
      orderAmount: orderAmount,
      currency: currencies[Math.floor(Math.random() * currencies.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      settledAt: Math.random() > 0.5 ? new Date().toISOString() : undefined,
    };
  });
};

function MerchantAssets() {
  const { toast } = useToast();
  
  // 获取商户资产数据
  const { data: assetsData, isLoading: isLoadingAssets, error: assetsError, refetch: refetchAssets } = useQuery<UserAssetsApiResponse>({
    queryKey: ["merchantAssets"],
    queryFn: async () => {
      // 商户后台使用 merchantToken
      const token = localStorage.getItem('merchantToken');
      console.log('[MerchantAssets] 获取资产数据，token:', token ? '已存在' : '未找到');
      
      if (!token) {
        throw new Error('未找到登录凭证');
      }
      
      const url = `${BASE_URL}/api/Merchart/getUserAssets`;
      console.log('[MerchantAssets] 调用接口:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      
      const result = await response.json();
      console.log('[MerchantAssets] 接口响应:', result);
      
      if (result.code !== 0) {
        throw new Error(result.msg || '获取资产数据失败');
      }
      
      return result;
    },
    enabled: true, // 确保查询启用
    staleTime: 30000, // 30秒
    refetchInterval: 60000, // 60秒自动刷新
  });

  // 将API数据转换为Asset数组
  const assets = useMemo<Asset[]>(() => {
    if (!assetsData?.data?.user_amount) {
      return [];
    }
    
    const userAmount = assetsData.data.user_amount;
    return Object.keys(userAmount).map((currency) => {
      const amount = userAmount[currency];
      const available = typeof amount.available === 'string' ? parseFloat(amount.available) : amount.available;
      const freeze = typeof amount.freeze === 'string' ? parseFloat(amount.freeze) : amount.freeze;
      const balance = available + freeze;
      
      return {
        currency,
        balance,
        frozen: freeze,
        available,
        icon: getCurrencyIcon(currency),
      };
    });
  }, [assetsData]);

  // 如果加载中，使用空数组或显示加载状态
  const displayAssets = isLoadingAssets ? [] : assets;
  const [activeTab, setActiveTab] = useState("assets");
  const [isSettleDialogOpen, setIsSettleDialogOpen] = useState(false);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [depositCurrency, setDepositCurrency] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawCurrency, setWithdrawCurrency] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  // 当打开充值对话框时，设置默认币种
  useEffect(() => {
    if (isDepositDialogOpen && displayAssets.length > 0) {
      // 如果当前币种不在资产列表中，或者币种未设置，则设置为第一个币种
      setDepositCurrency(prevCurrency => {
        const currencyExists = displayAssets.some(asset => asset.currency === prevCurrency);
        if (!prevCurrency || !currencyExists) {
          return displayAssets[0].currency;
        }
        return prevCurrency;
      });
    }
  }, [isDepositDialogOpen, displayAssets]);

  // 当打开提现对话框时，设置默认币种
  useEffect(() => {
    if (isWithdrawDialogOpen && displayAssets.length > 0) {
      // 如果当前币种不在资产列表中，或者币种未设置，则设置为第一个币种
      setWithdrawCurrency(prevCurrency => {
        const currencyExists = displayAssets.some(asset => asset.currency === prevCurrency);
        if (!prevCurrency || !currencyExists) {
          return displayAssets[0].currency;
        }
        return prevCurrency;
      });
    }
  }, [isWithdrawDialogOpen, displayAssets]);

  // 获取冻结记录数据
  const { 
    data: frozenRecordsData, 
    isLoading: isLoadingFrozenRecords,
    fetchNextPage: fetchNextFrozenPage,
    hasNextPage: hasNextFrozenPage,
    isFetchingNextPage: isFetchingNextFrozenPage
  } = useInfiniteQuery<FrozenRecordsApiResponse>({
    queryKey: ["merchantFrozenRecords"],
    queryFn: async ({ pageParam = 1 }) => {
      const token = localStorage.getItem('merchantToken');
      if (!token) {
        throw new Error('未找到登录凭证');
      }

      console.log('[MerchantAssets] 获取冻结记录，页码:', pageParam);

      const response = await fetch(`${BASE_URL}/api/Merchart/freezeList`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token,
          pageNum: pageParam,
          pageSize: 15,
        }),
      });

      const result = await response.json();
      console.log('[MerchantAssets] 冻结记录接口响应:', result);

      if (result.code !== 0) {
        throw new Error(result.msg || '获取冻结记录失败');
      }

      return result;
    },
    getNextPageParam: (lastPage) => {
      const { all_page, current_page } = lastPage.data?.page || {};
      if (current_page && all_page && current_page < all_page) {
        return current_page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: true,
    staleTime: 30000,
  });

  // 将API数据转换为冻结记录数组
  const frozenRecords = useMemo(() => {
    if (!frozenRecordsData?.pages) return [];
    const allRecords: Array<{
      id: string;
      time: string;
      currency: string;
      amount: number;
      reason: string;
      orderId: string;
      status: "frozen" | "unfrozen";
    }> = [];
    
    frozenRecordsData.pages.forEach((page) => {
      if (page.data?.list) {
        page.data.list.forEach((item) => {
          // 转换时间戳为日期字符串
          const date = new Date(parseInt(item.addtime) * 1000);
          const timeStr = date.toLocaleString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

          allRecords.push({
            id: item.id,
            time: timeStr,
            currency: item.currency,
            amount: parseFloat(item.amount),
            reason: item.remark || "结算申请",
            orderId: item.settleid,
            status: item.status === "1" ? "frozen" : "unfrozen",
          });
        });
      }
    });
    
    return allRecords;
  }, [frozenRecordsData]);

  // 获取结算记录数据
  const { 
    data: settlementRecordsData, 
    isLoading: isLoadingSettlementRecords,
    fetchNextPage: fetchNextSettlementPage,
    hasNextPage: hasNextSettlementPage,
    isFetchingNextPage: isFetchingNextSettlementPage
  } = useInfiniteQuery<SettlementRecordsApiResponse>({
    queryKey: ["merchantSettlementRecords"],
    queryFn: async ({ pageParam = 1 }) => {
      const token = localStorage.getItem('merchantToken');
      if (!token) {
        throw new Error('未找到登录凭证');
      }

      console.log('[MerchantAssets] 获取结算记录，页码:', pageParam);

      const response = await fetch(`${BASE_URL}/api/Merchart/settleList`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token,
          pageNum: pageParam,
          pageSize: 15,
        }),
      });

      const result = await response.json();
      console.log('[MerchantAssets] 结算记录接口响应:', result);

      if (result.code !== 0) {
        throw new Error(result.msg || '获取结算记录失败');
      }

      return result;
    },
    getNextPageParam: (lastPage) => {
      const { all_page, current_page } = lastPage.data?.page || {};
      if (current_page && all_page && current_page < all_page) {
        return current_page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: true,
    staleTime: 30000,
  });

  // 将API数据转换为结算记录数组
  const settlementRecords = useMemo(() => {
    if (!settlementRecordsData?.pages) return [];
    const allRecords: Array<{
      id: string;
      orderId: string;
      time: string;
      currency: string;
      amount: number;
      usdtAmount: number | null;
      status: "pending" | "rejected" | "completed";
      remark: string | null;
    }> = [];
    
    settlementRecordsData.pages.forEach((page) => {
      if (page.data?.list) {
        page.data.list.forEach((item) => {
          // 转换时间戳为日期字符串
          const date = new Date(parseInt(item.addtime) * 1000);
          const timeStr = date.toLocaleString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

          // 状态映射: "1" 待处理；"3" 已拒绝；"4" 已完成
          let status: "pending" | "rejected" | "completed" = "pending";
          if (item.status === "3") {
            status = "rejected";
          } else if (item.status === "4") {
            status = "completed";
          }

          // 到账USDT金额，如果为0或null则显示null
          const receivedAmount = parseFloat(item.received_amount);
          const usdtAmount = receivedAmount > 0 ? receivedAmount : null;

          allRecords.push({
            id: item.id,
            orderId: item.orderid,
            time: timeStr,
            currency: item.currency,
            amount: parseFloat(item.amount),
            usdtAmount,
            status,
            remark: item.remark,
          });
        });
      }
    });
    
    return allRecords;
  }, [settlementRecordsData]);

  const exchangeRate = 7.2;

  // 使用API返回的总余额数据，如果没有则计算
  const totalBalanceUSDT = assetsData?.data?.available_balance 
    ? (assetsData.data.available_balance + (assetsData.data.freeze_balance || 0))
    : displayAssets.reduce((sum, asset) => {
    if (asset.currency === "USDT") return sum + asset.balance;
    if (asset.currency === "CNY") return sum + asset.balance / exchangeRate;
    return sum + asset.balance;
  }, 0);

  const totalFrozenUSDT = assetsData?.data?.freeze_balance 
    ? assetsData.data.freeze_balance
    : displayAssets.reduce((sum, asset) => {
    if (asset.currency === "USDT") return sum + asset.frozen;
    if (asset.currency === "CNY") return sum + asset.frozen / exchangeRate;
    return sum + asset.frozen;
  }, 0);

  const totalAvailableUSDT = assetsData?.data?.available_balance 
    ? assetsData.data.available_balance
    : displayAssets.reduce((sum, asset) => {
    if (asset.currency === "USDT") return sum + asset.available;
    if (asset.currency === "CNY") return sum + asset.available / exchangeRate;
    return sum + asset.available;
  }, 0);

  const handleOpenSettleDialog = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsSettleDialogOpen(true);
  };

  const [isSubmittingSettle, setIsSubmittingSettle] = useState(false);

  const handleSubmitSettle = async (data: { currency: string; amount: number; usdtAddress: string }) => {
    setIsSubmittingSettle(true);
    try {
      const token = localStorage.getItem('merchantToken');
      if (!token) {
        toast({
          title: "提交失败",
          description: "未找到登录凭证，请重新登录",
          variant: "destructive",
        });
        setIsSubmittingSettle(false);
        return;
      }

      console.log('[MerchantAssets] 提交结算申请:', data);

      const response = await fetch(`${BASE_URL}/api/Merchart/doSettle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          type: 3, // 固定为3
          currency: data.currency,
          amount: data.amount,
          address: data.usdtAddress,
        }),
      });

      const result = await response.json();
      console.log('[MerchantAssets] 结算接口响应:', result);

      if (result.code !== 0) {
        throw new Error(result.msg || '提交结算申请失败');
      }

    toast({ 
      title: "申请已提交", 
        description: `${data.currency} 结算申请 ${data.amount} 已提交，USDT将发送至 ${data.usdtAddress.slice(0, 10)}...`,
    });

      // 刷新资产数据
      refetchAssets();

    setIsSettleDialogOpen(false);
    setSelectedAsset(null);
    } catch (error: any) {
      console.error('[MerchantAssets] 提交结算申请失败:', error);
      toast({
        title: "提交失败",
        description: error?.message || "网络错误，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingSettle(false);
    }
  };

  const handleDeposit = () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    toast({ 
      title: "充值申请已提交", 
      description: `${depositCurrency} ${parseFloat(depositAmount).toLocaleString()} 充值申请已提交，请按照指引完成转账` 
    });
    setIsDepositDialogOpen(false);
    setDepositAmount("");
  };

  const handleWithdraw = () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return;
    toast({ 
      title: "提现申请已提交", 
      description: `${withdrawCurrency} ${parseFloat(withdrawAmount).toLocaleString()} 提现申请已提交` 
    });
    setIsWithdrawDialogOpen(false);
    setWithdrawAmount("");
  };

  const getAvailableBalance = (currency: string) => {
    const asset = displayAssets.find(a => a.currency === currency);
    return asset?.available || 0;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl md:text-2xl font-bold text-black">商户资产</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1 sm:flex-none bg-white text-black border-gray-300" 
            onClick={() => setIsDepositDialogOpen(true)}
            data-testid="button-deposit"
          >
            <ArrowDownRight className="h-4 w-4 mr-1 md:mr-2" />
            <span>充值</span>
          </Button>
          <Button 
            className="flex-1 sm:flex-none bg-black text-white hover:bg-gray-800" 
            onClick={() => setIsWithdrawDialogOpen(true)}
            data-testid="button-withdraw"
          >
            <ArrowUpRight className="h-4 w-4 mr-1 md:mr-2" />
            <span>提现</span>
          </Button>
        </div>
      </div>

      <Card className="bg-white">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-gray-500 text-sm mb-1">总资产折合 (USDT)</p>
              <p className="text-2xl md:text-3xl font-bold text-black" data-testid="text-total-balance-usdt">
                {totalBalanceUSDT.toLocaleString("zh-CN", { minimumFractionDigits: 2 })} USDT
              </p>
              <div className="flex items-center gap-2 text-green-600 mt-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">+2.5% 较昨日</span>
              </div>
            </div>
            <div className="flex gap-6 md:flex-col md:gap-3">
              <div className="md:text-right">
                <p className="text-gray-400 text-xs mb-1">可用余额</p>
                <p className="text-lg md:text-xl font-semibold text-green-600" data-testid="text-total-available">
                  {totalAvailableUSDT.toLocaleString("zh-CN", { minimumFractionDigits: 2 })} USDT
                </p>
              </div>
              <div className="md:text-right">
                <p className="text-gray-400 text-xs mb-1">冻结资金</p>
                <p className="text-lg md:text-xl font-semibold text-orange-500" data-testid="text-total-frozen">
                  {totalFrozenUSDT.toLocaleString("zh-CN", { minimumFractionDigits: 2 })} USDT
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="p-3 md:p-4 overflow-x-auto">
              <TabsList className="bg-gray-100 p-1 rounded-lg w-full md:w-auto">
                <TabsTrigger 
                  value="assets" 
                  className="flex-1 md:flex-none px-3 md:px-6 py-2 text-xs md:text-sm rounded-md data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-gray-600"
                  data-testid="tab-asset-list"
                >
                  资产列表
                </TabsTrigger>
                <TabsTrigger 
                  value="frozen" 
                  className="flex-1 md:flex-none px-3 md:px-6 py-2 text-xs md:text-sm rounded-md data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-gray-600"
                  data-testid="tab-frozen-records"
                >
                  冻结记录
                </TabsTrigger>
                <TabsTrigger 
                  value="settlements" 
                  className="flex-1 md:flex-none px-3 md:px-6 py-2 text-xs md:text-sm rounded-md data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-gray-600"
                  data-testid="tab-settlement-records"
                >
                  结算记录
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="assets" className="mt-0">
              {/* 桌面端表格 */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-medium text-gray-600">币种</TableHead>
                      <TableHead className="text-right font-medium text-gray-600">总余额</TableHead>
                      <TableHead className="text-right font-medium text-gray-600">可用余额</TableHead>
                      <TableHead className="text-right font-medium text-gray-600">冻结金额</TableHead>
                      <TableHead className="text-right font-medium text-gray-600">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingAssets ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          加载中...
                        </TableCell>
                      </TableRow>
                    ) : displayAssets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          {assetsError ? '加载失败，请刷新重试' : '暂无资产数据'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayAssets.map((asset) => (
                      <TableRow key={asset.currency} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-black">
                              {asset.icon}
                            </div>
                            <span className="font-medium text-black">{asset.currency}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-black">
                          {asset.balance.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {asset.available.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-medium text-orange-500">
                          {asset.frozen.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm"
                            className="bg-black text-white hover:bg-gray-800"
                            onClick={() => handleOpenSettleDialog(asset)}
                            data-testid={`button-settle-${asset.currency.toLowerCase()}`}
                          >
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                            结算下发
                          </Button>
                        </TableCell>
                      </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {/* 移动端卡片 */}
              <div className="md:hidden p-3 space-y-3">
                {isLoadingAssets ? (
                  <div className="text-center py-8 text-gray-500">加载中...</div>
                ) : displayAssets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {assetsError ? '加载失败，请刷新重试' : '暂无资产数据'}
                  </div>
                ) : (
                  displayAssets.map((asset) => (
                  <div key={asset.currency} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-black">
                          {asset.icon}
                        </div>
                        <span className="font-medium text-black">{asset.currency}</span>
                      </div>
                      <Button 
                        size="sm"
                        className="bg-black text-white hover:bg-gray-800 text-xs"
                        onClick={() => handleOpenSettleDialog(asset)}
                        data-testid={`button-settle-mobile-${asset.currency.toLowerCase()}`}
                      >
                        结算下发
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs">总余额</p>
                        <p className="font-medium text-black">{asset.balance.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">可用</p>
                        <p className="font-medium text-green-600">{asset.available.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">冻结</p>
                        <p className="font-medium text-orange-500">{asset.frozen.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="frozen" className="mt-0">
              {/* 桌面端表格 */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-medium text-gray-600">冻结时间</TableHead>
                      <TableHead className="font-medium text-gray-600">币种</TableHead>
                      <TableHead className="text-right font-medium text-gray-600">冻结金额</TableHead>
                      <TableHead className="font-medium text-gray-600">冻结原因</TableHead>
                      <TableHead className="font-medium text-gray-600">关联订单</TableHead>
                      <TableHead className="font-medium text-gray-600">状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingFrozenRecords ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          加载中...
                        </TableCell>
                      </TableRow>
                    ) : frozenRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          暂无冻结记录
                        </TableCell>
                      </TableRow>
                    ) : (
                      frozenRecords.map((record) => (
                        <TableRow key={record.id} className="hover:bg-gray-50">
                        <TableCell className="text-gray-500">{record.time}</TableCell>
                        <TableCell className="text-black">{record.currency}</TableCell>
                        <TableCell className="text-right font-medium text-orange-500">
                          {record.amount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-black">{record.reason}</TableCell>
                        <TableCell className="font-mono text-sm text-blue-600">{record.orderId}</TableCell>
                        <TableCell>
                          <Badge 
                            className={record.status === "frozen" ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}
                          >
                            {record.status === "frozen" ? "冻结中" : "已解冻"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {/* 移动端卡片 */}
              <div className="md:hidden p-3 space-y-3">
                {isLoadingFrozenRecords ? (
                  <div className="text-center py-8 text-gray-500">加载中...</div>
                ) : frozenRecords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">暂无冻结记录</div>
                ) : (
                  frozenRecords.map((record) => (
                    <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-black">{record.currency}</span>
                      <Badge 
                        className={record.status === "frozen" ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}
                      >
                        {record.status === "frozen" ? "冻结中" : "已解冻"}
                      </Badge>
                    </div>
                    <div className="text-lg font-bold text-orange-500 mb-2">
                      {record.amount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex justify-between">
                        <span>原因</span>
                        <span className="text-black">{record.reason}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>订单</span>
                        <span className="text-blue-600 font-mono">{record.orderId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>时间</span>
                        <span>{record.time}</span>
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>
              {hasNextFrozenPage && (
              <div className="flex justify-center py-4 border-t border-gray-100">
                <Button 
                  variant="outline" 
                  className="bg-white text-black border-gray-300 hover:bg-gray-50"
                    onClick={() => fetchNextFrozenPage()}
                    disabled={isFetchingNextFrozenPage}
                  data-testid="button-load-more-frozen"
                >
                    {isFetchingNextFrozenPage ? "加载中..." : "加载更多"}
                </Button>
              </div>
              )}
            </TabsContent>

            <TabsContent value="settlements" className="mt-0">
              {/* 桌面端表格 */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-medium text-gray-600">结算单号</TableHead>
                      <TableHead className="font-medium text-gray-600">申请时间</TableHead>
                      <TableHead className="font-medium text-gray-600">结算币种</TableHead>
                      <TableHead className="text-right font-medium text-gray-600">结算金额</TableHead>
                      <TableHead className="text-right font-medium text-gray-600">到账USDT</TableHead>
                      <TableHead className="font-medium text-gray-600">状态</TableHead>
                      <TableHead className="font-medium text-gray-600">备注</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingSettlementRecords ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          加载中...
                        </TableCell>
                      </TableRow>
                    ) : settlementRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          暂无结算记录
                        </TableCell>
                      </TableRow>
                    ) : (
                      settlementRecords.map((record) => (
                      <TableRow key={record.id} className="hover:bg-gray-50">
                          <TableCell className="font-mono text-sm text-black">{record.orderId}</TableCell>
                        <TableCell className="text-gray-500">{record.time}</TableCell>
                        <TableCell className="text-black">{record.currency}</TableCell>
                        <TableCell className="text-right font-medium text-black">
                          {record.amount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-medium text-black">
                          {record.usdtAmount ? `₮${record.usdtAmount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}` : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              record.status === "completed" ? "bg-green-100 text-green-800" : 
                              record.status === "rejected" ? "bg-red-100 text-red-800" :
                              "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {record.status === "completed" ? "已完成" : 
                             record.status === "rejected" ? "已拒绝" :
                             "待处理"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600 max-w-[200px]">
                            {record.status === "rejected" && record.remark ? (
                              <span className="text-red-600 text-sm">{record.remark}</span>
                          ) : "-"}
                        </TableCell>
                      </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {/* 移动端卡片 */}
              <div className="md:hidden p-3 space-y-3">
                {isLoadingSettlementRecords ? (
                  <div className="text-center py-8 text-gray-500">加载中...</div>
                ) : settlementRecords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">暂无结算记录</div>
                ) : (
                  settlementRecords.map((record) => (
                  <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs text-gray-600">{record.orderId}</span>
                      <Badge 
                        className={
                          record.status === "completed" ? "bg-green-100 text-green-800" : 
                          record.status === "rejected" ? "bg-red-100 text-red-800" :
                          "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {record.status === "completed" ? "已完成" : 
                         record.status === "rejected" ? "已拒绝" :
                         "待处理"}
                      </Badge>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-lg font-bold text-black">
                        {record.amount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-sm text-gray-500">{record.currency}</span>
                    </div>
                    {record.usdtAmount && (
                      <div className="text-sm text-green-600 mb-2">
                        到账: ₮{record.usdtAmount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                      </div>
                    )}
                      {record.status === "rejected" && record.remark && (
                      <div className="text-sm text-red-600 bg-red-50 rounded p-2 mb-2">
                          {record.remark}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">{record.time}</div>
                  </div>
                  ))
                )}
              </div>
              {hasNextSettlementPage && (
              <div className="flex justify-center py-4 border-t border-gray-100">
                <Button 
                  variant="outline" 
                  className="bg-white text-black border-gray-300 hover:bg-gray-50"
                    onClick={() => fetchNextSettlementPage()}
                    disabled={isFetchingNextSettlementPage}
                  data-testid="button-load-more-settlements"
                >
                    {isFetchingNextSettlementPage ? "加载中..." : "加载更多"}
                </Button>
              </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ApplySettlementDialog
        isOpen={isSettleDialogOpen}
        onOpenChange={setIsSettleDialogOpen}
        onSubmit={handleSubmitSettle}
        initialCurrency={selectedAsset?.currency}
        initialAvailable={selectedAsset?.available}
      />

      <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-black">充值</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-black">选择币种</Label>
              {displayAssets.length === 0 ? (
                <div className="text-sm text-gray-500 py-2">
                  {isLoadingAssets ? "加载中..." : "暂无币种数据"}
                </div>
              ) : (
              <Select value={depositCurrency} onValueChange={setDepositCurrency}>
                <SelectTrigger className="bg-white border-gray-300 text-black" data-testid="select-deposit-currency">
                  <SelectValue placeholder="选择币种" />
                </SelectTrigger>
                <SelectContent>
                    {displayAssets.map((asset) => (
                      <SelectItem key={asset.currency} value={asset.currency}>
                        {asset.currency}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-black">充值金额</Label>
              <Input
                type="number"
                placeholder="请输入充值金额"
                className="bg-white border-gray-300 text-black"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                data-testid="input-deposit-amount"
              />
            </div>

          </div>
          <DialogFooter className="flex-row justify-center gap-3 sm:justify-end">
            <Button variant="outline" className="bg-white text-black border-gray-300 flex-1 sm:flex-none" onClick={() => setIsDepositDialogOpen(false)}>
              取消
            </Button>
            <Button 
              className="bg-black text-white hover:bg-gray-800 flex-1 sm:flex-none" 
              onClick={handleDeposit}
              disabled={!depositAmount || parseFloat(depositAmount) <= 0 || displayAssets.length === 0 || !depositCurrency}
              data-testid="button-confirm-deposit"
            >
              确认充值
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-black">提现</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-black">选择币种</Label>
              {displayAssets.length === 0 ? (
                <div className="text-sm text-gray-500 py-2">
                  {isLoadingAssets ? "加载中..." : "暂无币种数据"}
                </div>
              ) : (
                <>
              <Select value={withdrawCurrency} onValueChange={setWithdrawCurrency}>
                <SelectTrigger className="bg-white border-gray-300 text-black" data-testid="select-withdraw-currency">
                  <SelectValue placeholder="选择币种" />
                </SelectTrigger>
                <SelectContent>
                      {displayAssets.map((asset) => (
                        <SelectItem key={asset.currency} value={asset.currency}>
                          {asset.currency}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                可用余额: {getAvailableBalance(withdrawCurrency).toLocaleString("zh-CN", { minimumFractionDigits: 2 })} {withdrawCurrency}
              </p>
                </>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-black">提现金额</Label>
                <button 
                  className="text-xs text-blue-600 hover:underline"
                  onClick={() => setWithdrawAmount(getAvailableBalance(withdrawCurrency).toString())}
                >
                  全部提现
                </button>
              </div>
              <Input
                type="number"
                placeholder="请输入提现金额"
                className="bg-white border-gray-300 text-black"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                data-testid="input-withdraw-amount"
              />
            </div>

            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-xs text-yellow-800">
                提现手续费: {withdrawCurrency === "USDT" ? "1 USDT" : withdrawCurrency === "CNY" ? "¥5" : "$2"} / 笔，
                预计 {withdrawCurrency === "USDT" ? "10分钟" : "1-2工作日"} 到账
              </p>
            </div>
          </div>
          <DialogFooter className="flex-row justify-center gap-3 sm:justify-end">
            <Button variant="outline" className="bg-white text-black border-gray-300 flex-1 sm:flex-none" onClick={() => setIsWithdrawDialogOpen(false)}>
              取消
            </Button>
            <Button 
              className="bg-black text-white hover:bg-gray-800 flex-1 sm:flex-none" 
              onClick={handleWithdraw}
              disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || displayAssets.length === 0 || !withdrawCurrency}
              data-testid="button-confirm-withdraw"
            >
              确认提现
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrderManagement() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currencyFilter, setCurrencyFilter] = useState<string>("all");
  const [channelIdFilter, setChannelIdFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"orderid" | "out_order_id" | "payment_order_id">("orderid");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const { data: currencyList = [] } = useCurrencyList();
  const { toast } = useToast();

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

  // 根据币种筛选通道
  const filteredChannels = useMemo(() => {
    if (currencyFilter === "all") {
      return allChannels;
    }
    return allChannels.filter(channel => channel.currency === currencyFilter);
  }, [allChannels, currencyFilter]);

  // 按支付类型分组通道
  const channelsByPayType = useMemo(() => {
    const groups: { [paytype: string]: typeof filteredChannels } = {};
    filteredChannels.forEach(channel => {
      if (!groups[channel.paytype]) {
        groups[channel.paytype] = [];
      }
      groups[channel.paytype].push(channel);
    });
    return groups;
  }, [filteredChannels]);

  // 当币种改变时，清除通道选择
  useEffect(() => {
    if (currencyFilter !== "all") {
      const selectedChannel = allChannels.find(c => c.channelid === channelIdFilter);
      if (!selectedChannel || selectedChannel.currency !== currencyFilter) {
        setChannelIdFilter("");
      }
    }
  }, [currencyFilter, allChannels, channelIdFilter]);

  // 使用useInfiniteQuery获取订单列表
  const {
    data: ordersData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery<OrdersApiResponse>({
    queryKey: ["merchantOrders", statusFilter, typeFilter, currencyFilter, channelIdFilter, searchTerm, searchType, startDate, endDate],
    queryFn: async ({ pageParam = 1 }) => {
      const token = localStorage.getItem('merchantToken');
      if (!token) {
        throw new Error('未找到登录凭证');
      }

      const params: any = {
        token,
        pageNum: pageParam,
        pageSize: 15,
      };

      // 添加搜索参数
      if (statusFilter !== "all") {
        // 状态映射: pending -> "0", processing -> "1", completed -> "2", failed -> "3", closed -> "6"
        const statusMap: Record<string, string> = {
          "pending": "0",
          "processing": "1",
          "completed": "2",
          "failed": "3",
          "closed": "6",
        };
        params.status = statusMap[statusFilter] || "";
      }

      if (typeFilter !== "all") {
        // 类型映射: deposit -> "2" 代收, withdraw -> "1" 代付
        const typeMap: Record<string, string> = {
          "deposit": "2",
          "withdraw": "1",
        };
        params.otype = typeMap[typeFilter] || "";
      }

      if (currencyFilter !== "all") {
        params.currency = currencyFilter;
      }

      if (channelIdFilter.trim()) {
        params.pay_channelid = channelIdFilter.trim();
      }

      if (searchTerm.trim()) {
        // 根据搜索类型传递相应的参数
        if (searchType === "orderid") {
          params.orderid = searchTerm.trim();
        } else if (searchType === "out_order_id") {
          params.out_order_id = searchTerm.trim();
        } else if (searchType === "payment_order_id") {
          params.payment_order_id = searchTerm.trim();
        }
      }

      // 添加时间范围参数
      if (startDate) {
        params.starttime = dateToTimestamp(startDate);
      }
      if (endDate) {
        params.endtime = dateToTimestamp(endDate);
      }

      const response = await apiRequest<OrdersApiResponse>(
        'POST',
        '/api/Merchart/myApiOrderList',
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

  // 将API数据转换为Order数组
  const orders = useMemo(() => {
    if (!ordersData?.pages) return [];
    const allOrders: Order[] = [];
    ordersData.pages.forEach((page) => {
      if (page.data?.list) {
        page.data.list.forEach((item) => {
          allOrders.push(convertApiOrderToOrder(item));
  });
      }
    });
    return allOrders;
  }, [ordersData]);

  // 订单数据直接使用，因为筛选已通过API参数完成
  const filteredOrders = orders;

  const getStatusBadge = (status: Order["status"]) => {
    const config = {
      pending: { label: "待处理", className: "bg-yellow-100 text-yellow-800", icon: Clock },
      processing: { label: "处理中", className: "bg-blue-100 text-blue-800", icon: RefreshCw },
      completed: { label: "支付成功", className: "bg-green-100 text-green-800", icon: CheckCircle },
      failed: { label: "支付失败", className: "bg-red-100 text-red-800", icon: XCircle },
      closed: { label: "订单关闭", className: "bg-gray-100 text-gray-800", icon: XCircle },
    };
    const { label, className, icon: Icon } = config[status] || config.pending;
    return (
      <Badge className={`${className} gap-1`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  // 将日期字符串转换为秒级时间戳
  const dateToTimestamp = (dateStr: string): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return Math.floor(date.getTime() / 1000).toString();
  };

  // 导出订单
  const handleExportOrders = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "请选择时间范围",
        description: "导出订单需要选择开始时间和结束时间",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const token = localStorage.getItem('merchantToken');
      if (!token) {
        throw new Error('未找到登录凭证');
      }

      const params: any = {
        token,
        starttime: dateToTimestamp(startDate),
        endtime: dateToTimestamp(endDate),
      };

      // 添加搜索参数
      if (statusFilter !== "all") {
        const statusMap: Record<string, string> = {
          "pending": "0",
          "processing": "1",
          "completed": "2",
          "failed": "3",
          "closed": "6",
        };
        params.status = statusMap[statusFilter] || "";
      }

      if (typeFilter !== "all") {
        const typeMap: Record<string, string> = {
          "deposit": "2",
          "withdraw": "1",
        };
        params.otype = typeMap[typeFilter] || "";
      }

      if (currencyFilter !== "all") {
        params.currency = currencyFilter;
      }

      if (channelIdFilter.trim()) {
        params.pay_channelid = channelIdFilter.trim();
      }

      const response = await apiRequest<{ code: number; msg?: string; data?: OrderApiItem[] }>(
        'POST',
        '/api/Merchart/exportApiOrderList',
        params
      );

      if (response.code === 0 && response.data) {
        // 将数据转换为CSV格式
        const csvHeaders = [
          "ID",
          "订单号",
          "外部订单号",
          "商户订单号",
          "类型",
          "金额",
          "币种",
          "通道名称",
          "状态",
          "创建时间",
          "用户名",
          "备注"
        ];

        const csvRows = response.data.map(item => {
          const typeLabel = item.otype === "1" ? "代付" : "代收";
          const statusMap: Record<string, string> = {
            "0": "待处理",
            "1": "处理中",
            "2": "支付成功",
            "3": "支付失败",
            "6": "订单关闭",
          };
          const statusLabel = statusMap[item.status] || item.status;
          const createdAt = item.created_at && item.created_at !== "0"
            ? new Date(parseInt(item.created_at) * 1000).toLocaleString("zh-CN")
            : "";

          return [
            item.id,
            item.orderid,
            item.out_order_id,
            item.payment_order_id || "",
            typeLabel,
            item.amount,
            item.currency,
            item.pay_channel_name || "",
            statusLabel,
            createdAt,
            item.username || "",
            item.remarks || ""
          ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(",");
        });

        const csvContent = [
          csvHeaders.map(h => `"${h}"`).join(","),
          ...csvRows
        ].join("\n");

        // 添加BOM以支持中文
        const BOM = "\uFEFF";
        const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `订单记录_${startDate}_${endDate}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "导出成功",
          description: "订单记录已成功导出",
        });
      } else {
        throw new Error(response.msg || "导出失败");
      }
    } catch (error: any) {
      console.error('导出订单失败:', error);
      toast({
        title: "导出失败",
        description: error.message || "网络错误，请重试",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* 标题和导出按钮 */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl md:text-2xl font-bold text-black">订单管理</h2>
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-white text-black border-gray-300 shrink-0" 
          onClick={handleExportOrders}
          disabled={isExporting}
          data-testid="button-export-orders"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
              <span className="hidden sm:inline">导出中...</span>
            </>
          ) : (
            <>
          <Download className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">导出订单</span>
            </>
          )}
        </Button>
      </div>

      {/* 筛选条件卡片 */}
      <Card className="bg-white">
        <CardContent className="p-0">
          {/* 第一级：币种 - 自动换行 */}
          <div className="border-b border-gray-100 px-3 md:px-4 py-2">
            <div className="flex flex-wrap gap-1">
                <button
                onClick={() => setCurrencyFilter("all")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currencyFilter === "all"
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                data-testid="tab-currency-all"
              >
                全部币种
              </button>
              {currencyList.map((currencyItem) => (
                <button
                  key={currencyItem.currency}
                  onClick={() => setCurrencyFilter(currencyItem.currency)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currencyFilter === currencyItem.currency
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  data-testid={`tab-currency-${currencyItem.currency}`}
                >
                  {currencyItem.currency}
                </button>
              ))}
            </div>
          </div>

          {/* 通道选择 */}
          <div className="px-3 md:px-4 py-2 border-b border-gray-100 bg-gray-50">
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">支付通道:</Label>
              {isLoadingChannels ? (
                <div className="text-sm text-gray-500 py-2">加载通道数据中...</div>
              ) : currencyFilter === "all" ? (
                <div className="text-sm text-gray-500 py-2">请先选择币种</div>
              ) : filteredChannels.length === 0 ? (
                <div className="text-sm text-gray-500 py-2">该币种暂无通道</div>
              ) : (
                <div className="space-y-2">
                  {/* 全部通道按钮 - 单独一行 */}
                  <div>
                <button
                      onClick={() => setChannelIdFilter("")}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                        channelIdFilter === ""
                          ? "bg-black text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                      data-testid="button-channel-all"
                    >
                      全部通道
                    </button>
                  </div>
                  {/* 按支付类型分组的通道 - 每个支付方式单独一行 */}
                  <div className="space-y-2">
                    {Object.entries(channelsByPayType).map(([paytype, channels]) => (
                      <div key={paytype} className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs text-gray-500">{channels[0]?.paytype_name || paytype}:</span>
                        {channels.map((channel) => (
                          <button
                            key={channel.channelid}
                            onClick={() => setChannelIdFilter(channel.channelid)}
                            className={`px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap ${
                              channelIdFilter === channel.channelid
                                ? "bg-black text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                            data-testid={`button-channel-${channel.channelid}`}
                            title={`${channel.channel_title} (ID: ${channel.channelid})`}
                          >
                            {channel.channel_title}
                </button>
              ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 第三级：状态 + 类型 + 搜索 */}
          <div className="px-3 md:px-4 py-3 space-y-3">
            {/* 状态筛选 - 自动换行 */}
            <div className="space-y-2">
              <span className="text-sm text-gray-500">状态:</span>
              <div className="flex flex-wrap gap-1">
                {[
                  { value: "all", label: "全部" },
                  { value: "pending", label: "待处理" },
                  { value: "processing", label: "处理中" },
                  { value: "completed", label: "支付成功" },
                  { value: "failed", label: "支付失败" },
                  { value: "closed", label: "订单关闭" },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setStatusFilter(item.value)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      statusFilter === item.value
                        ? "bg-white text-black shadow-sm border border-gray-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    data-testid={`tab-status-${item.value}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 类型筛选 - 自动换行 */}
            <div className="space-y-2">
              <span className="text-sm text-gray-500">类型:</span>
              <div className="flex flex-wrap gap-1">
                {[
                  { value: "all", label: "全部" },
                  { value: "deposit", label: "代收" },
                  { value: "withdraw", label: "代付" },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setTypeFilter(item.value)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      typeFilter === item.value
                        ? "bg-white text-black shadow-sm border border-gray-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    data-testid={`tab-type-${item.value}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 时间范围选择 */}
            <div className="space-y-2">
              <span className="text-sm text-gray-500">时间范围:</span>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="input-start-date"
                />
                <span className="text-gray-400">至</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="input-end-date"
                />
              </div>
            </div>

            {/* 搜索类型选择 */}
            <div className="space-y-2">
              <span className="text-sm text-gray-500">搜索类型:</span>
              <div className="flex flex-wrap gap-1">
                {[
                  { value: "orderid" as const, label: "平台订单号" },
                  { value: "out_order_id" as const, label: "外部订单号" },
                  { value: "payment_order_id" as const, label: "商户订单号" },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setSearchType(item.value)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      searchType === item.value
                        ? "bg-white text-black shadow-sm border border-gray-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    data-testid={`tab-search-type-${item.value}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 搜索框 */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={searchType === "orderid" ? "搜索平台订单号" : searchType === "out_order_id" ? "搜索外部订单号" : "搜索商户订单号"}
                  className="pl-10 bg-white border-gray-300 w-full text-black"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && refetch()}
                  data-testid="input-search-order"
                />
              </div>
              <Button 
                size="icon" 
                className="bg-black text-white hover:bg-gray-800 shrink-0" 
                onClick={() => refetch()}
                data-testid="button-search-order"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 订单列表 - 桌面端表格，移动端卡片 */}
      <Card className="bg-white">
        <CardContent className="p-0">
          {/* 桌面端表格 */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-black">订单号</TableHead>
                  <TableHead className="text-black">类型</TableHead>
                  <TableHead className="text-black">金额</TableHead>
                  <TableHead className="text-black">渠道</TableHead>
                  <TableHead className="text-black">状态</TableHead>
                  <TableHead className="text-black">创建时间</TableHead>
                  <TableHead className="text-right text-black">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-sm text-black">{order.orderNo}</span>
                        <span className="font-mono text-xs text-gray-500">{order.externalOrderNo}</span>
                          {order.paymentOrderId && (
                            <span className="font-mono text-xs text-gray-400">商户订单: {order.paymentOrderId}</span>
                          )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={order.type === "deposit" ? "bg-yellow-500 text-white hover:bg-yellow-600" : "bg-blue-500 text-white hover:bg-blue-600"}>
                        {order.type === "deposit" ? "代收" : "代付"}
                      </Badge>
                    </TableCell>
                      <TableCell className="font-medium text-black">
                        {order.currency} {order.amount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                    </TableCell>
                      <TableCell className="text-black">{order.channel || "-"}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {new Date(order.createdAt).toLocaleString("zh-CN")}
                    </TableCell>
                    <TableCell className="text-right">
                      {order.status === "completed" ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="bg-white text-black border-gray-300 hover:bg-gray-50"
                          data-testid={`button-resend-notify-${order.id}`}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          补发通知
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          data-testid={`button-manual-confirm-${order.id}`}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          手动确认成功
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 移动端卡片列表 */}
          <div className="md:hidden divide-y divide-gray-100">
            {isLoading && filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">加载中...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无数据</div>
            ) : (
              filteredOrders.map((order) => (
              <div key={order.id} className="p-4 space-y-3" data-testid={`order-card-${order.id}`}>
                {/* 订单头部：类型和状态 */}
                <div className="flex items-center justify-between">
                  <Badge className={order.type === "deposit" ? "bg-yellow-500 text-white hover:bg-yellow-600" : "bg-blue-500 text-white hover:bg-blue-600"}>
                    {order.type === "deposit" ? "代收" : "代付"}
                  </Badge>
                  {getStatusBadge(order.status)}
                </div>

                {/* 订单号 */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">订单号</p>
                  <p className="font-mono text-sm text-black break-all">{order.orderNo}</p>
                  <p className="font-mono text-xs text-gray-500 break-all">{order.externalOrderNo}</p>
                    {order.paymentOrderId && (
                      <p className="font-mono text-xs text-gray-400 break-all">商户订单: {order.paymentOrderId}</p>
                    )}
                </div>

                {/* 金额和渠道 */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">金额</p>
                      <p className="font-bold text-lg text-black">{order.currency} {order.amount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">渠道</p>
                      <p className="text-sm text-black">{order.channel || "-"}</p>
                  </div>
                </div>

                {/* 创建时间 */}
                <div className="flex items-center gap-1 text-gray-500 text-xs">
                  <Clock className="h-3 w-3" />
                  {new Date(order.createdAt).toLocaleString("zh-CN")}
                </div>

                {/* 操作按钮 */}
                <div className="pt-2">
                  {order.status === "completed" ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-white text-black border-gray-300 hover:bg-gray-50 w-full"
                      data-testid={`button-resend-notify-${order.id}`}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      补发通知
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 w-full"
                      data-testid={`button-manual-confirm-${order.id}`}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      手动确认成功
                    </Button>
                  )}
                </div>
              </div>
              ))
            )}
          </div>

          {hasNextPage && (
          <div className="flex justify-center py-4 border-t border-gray-100">
            <Button 
              variant="outline" 
              className="bg-white text-black border-gray-300 hover:bg-gray-50"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              data-testid="button-load-more-orders"
            >
                {isFetchingNextPage ? "加载中..." : "加载更多"}
            </Button>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface PaymentMethodFee {
  method: string;
  depositRate: number;
  depositMinFee: number;
  withdrawRate: number;
  withdrawMinFee: number;
  costDepositRate: number;
  costDepositMinFee: number;
  costWithdrawRate: number;
  costWithdrawMinFee: number;
}

interface MerchantFeeConfig {
  currency: string;
  methods: PaymentMethodFee[];
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
    merchantId: apiItem.id,
    name: apiItem.nickname || "",
    telegramAccount: apiItem.tg_account || "",
    walletId: apiItem.wallet_id || "",
    status,
    balance: apiItem.balance || 0,
    balanceUSDT: apiItem.balance || 0,
    assets,
    totalOrders: apiItem.order_num || 0,
    createdAt,
    channel_fees: apiItem.channel_fees || {},
  };
};

function SubMerchants() {
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
  const [selectedMerchant, setSelectedMerchant] = useState<SubMerchant | null>(null);
  const [editName, setEditName] = useState("");
  const [walletId, setWalletId] = useState("");
  const [configCurrencyTab, setConfigCurrencyTab] = useState("CNY");
  const [isAddingMerchant, setIsAddingMerchant] = useState(false);
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

  const [feeConfigs, setFeeConfigs] = useState<MerchantFeeConfig[]>([
    {
      currency: "CNY",
      methods: [
        { method: "支付宝", depositRate: 0.8, depositMinFee: 1, withdrawRate: 0.8, withdrawMinFee: 1, costDepositRate: 0.5, costDepositMinFee: 0.5, costWithdrawRate: 0.5, costWithdrawMinFee: 0.5 },
        { method: "微信支付", depositRate: 0.8, depositMinFee: 1, withdrawRate: 0.8, withdrawMinFee: 1, costDepositRate: 0.5, costDepositMinFee: 0.5, costWithdrawRate: 0.5, costWithdrawMinFee: 0.5 },
        { method: "银行卡", depositRate: 0.6, depositMinFee: 2, withdrawRate: 0.6, withdrawMinFee: 2, costDepositRate: 0.4, costDepositMinFee: 1, costWithdrawRate: 0.4, costWithdrawMinFee: 1 },
        { method: "云闪付", depositRate: 0.7, depositMinFee: 1, withdrawRate: 0.7, withdrawMinFee: 1, costDepositRate: 0.45, costDepositMinFee: 0.5, costWithdrawRate: 0.45, costWithdrawMinFee: 0.5 },
      ]
    },
    {
      currency: "USDT",
      methods: [
        { method: "TRC20", depositRate: 0.5, depositMinFee: 1, withdrawRate: 0.5, withdrawMinFee: 1, costDepositRate: 0.3, costDepositMinFee: 0.5, costWithdrawRate: 0.3, costWithdrawMinFee: 0.5 },
        { method: "ERC20", depositRate: 0.8, depositMinFee: 2, withdrawRate: 0.8, withdrawMinFee: 2, costDepositRate: 0.5, costDepositMinFee: 1, costWithdrawRate: 0.5, costWithdrawMinFee: 1 },
      ]
    },
    {
      currency: "USD",
      methods: [
        { method: "SWIFT", depositRate: 1.0, depositMinFee: 10, withdrawRate: 1.0, withdrawMinFee: 10, costDepositRate: 0.6, costDepositMinFee: 5, costWithdrawRate: 0.6, costWithdrawMinFee: 5 },
        { method: "ACH", depositRate: 0.5, depositMinFee: 5, withdrawRate: 0.5, withdrawMinFee: 5, costDepositRate: 0.3, costDepositMinFee: 2, costWithdrawRate: 0.3, costWithdrawMinFee: 2 },
      ]
    }
  ]);

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

  return (
    <div className="space-y-4 md:space-y-6">
      {/* 标题和添加按钮 */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl md:text-2xl font-bold text-black">下级商户</h2>
        <Button 
          className="bg-black text-white hover:bg-gray-800 shrink-0"
          size="sm"
          onClick={handleOpenAddDrawer}
          data-testid="button-add-sub-merchant"
        >
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">添加商户</span>
        </Button>
      </div>

      {/* 搜索栏 */}
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
              className="bg-black text-white hover:bg-gray-800 shrink-0" 
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

      {/* 商户列表 */}
      <Card className="bg-white">
        <CardContent className="p-0">
          {/* 桌面端表格 */}
          <div className="hidden md:block">
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
          </div>

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
        </CardContent>
      </Card>

      <Sheet open={isConfigDrawerOpen} onOpenChange={setIsConfigDrawerOpen}>
        <SheetContent className="w-full sm:w-[480px] sm:max-w-[480px] overflow-y-auto bg-white">
          <SheetHeader>
            <SheetTitle className="text-black">
              {selectedMerchant ? "商户配置" : "添加商户"}
            </SheetTitle>
          </SheetHeader>
          <div className="py-6 space-y-6">
            {/* 基本信息 */}
            <div className="space-y-4">
              <h3 className="font-medium text-black">基本信息</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-gray-600">商户名称</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-white border-gray-300 text-black flex-1"
                      placeholder="请输入商户名称"
                      data-testid="input-config-name"
                    />
                    {selectedMerchant && (
                      <Button 
                        size="sm"
                        onClick={handleSaveName}
                        disabled={!editName.trim() || editName === selectedMerchant?.name}
                        className="bg-black text-white hover:bg-gray-800"
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
            <DialogTitle className="text-black">
              {selectedMerchant?.name} - 资产明细
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-medium text-gray-600">币种</TableHead>
                  <TableHead className="text-right font-medium text-gray-600">总余额</TableHead>
                  <TableHead className="text-right font-medium text-gray-600">可用余额</TableHead>
                  <TableHead className="text-right font-medium text-gray-600">冻结资金</TableHead>
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
                <span className="text-xl font-bold text-black">
                  {selectedMerchant?.balanceUSDT.toLocaleString("zh-CN", { minimumFractionDigits: 2 })} USDT
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              className="bg-black text-white hover:bg-gray-800" 
              onClick={() => setIsAssetDialogOpen(false)}
              data-testid="button-close-asset-dialog"
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CommissionRecords() {
  const { toast } = useToast();
  const [timeFilter, setTimeFilter] = useState<string>("all"); // all/day/week/month

  // 使用useInfiniteQuery获取佣金记录数据
  const {
    data: commissionData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingCommissions,
    refetch: refetchCommissions,
  } = useInfiniteQuery<CommissionListApiResponse>({
    queryKey: ["merchantCommissions", timeFilter],
    queryFn: async ({ pageParam = 1 }) => {
      const token = localStorage.getItem('merchantToken');
      if (!token) {
        throw new Error('未找到登录凭证');
      }

      const formData = new FormData();
      formData.append('token', token);
      // 只有非"全部"时才传递time参数
      if (timeFilter !== "all") {
        formData.append('time', timeFilter);
      }
      formData.append('page', pageParam.toString());

      const response = await apiRequest<CommissionListApiResponse>(
        'POST',
        '/api/Merchart/commissionList',
        formData
      );

      if (response.code !== 0) {
        throw new Error(response.msg || '获取佣金记录失败');
      }

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
    staleTime: 30000,
  });

  // 转换API数据为组件使用的格式（累积所有页面的数据）
  const commissions = useMemo(() => {
    if (!commissionData?.pages) return [];
    
    const allItems: CommissionRecordItem[] = [];
    commissionData.pages.forEach(page => {
      if (page.data?.list) {
        allItems.push(...page.data.list);
      }
    });
    
    return allItems.map(item => ({
      id: item.id,
      orderId: item.orderid,
      subMerchantId: item.userid,
      subMerchantName: item.merchart_name,
      amount: parseFloat(item.amount), // 佣金金额
      rate: parseFloat(item.scale), // 佣金比例
      orderAmount: parseFloat(item.order_amount), // 订单金额
      currency: item.currency,
      status: "pending" as const, // API未返回状态，默认pending
      createdAt: new Date(parseInt(item.addtime) * 1000).toISOString(),
    }));
  }, [commissionData]);

  // 统计数据（使用第一页的数据，因为统计信息应该是一致的）
  const report = commissionData?.pages?.[0]?.data?.report || {
    total: 0,
    settle: 0,
    settle_pending: 0,
  };

  const totalCommissions = typeof report.total === 'string' ? parseFloat(report.total) : report.total;
  const settledCommissions = typeof report.settle === 'string' ? parseFloat(report.settle) : report.settle;
  const pendingCommissions = typeof report.settle_pending === 'string' ? parseFloat(report.settle_pending) : report.settle_pending;

  const handleTimeFilterChange = (time: string) => {
    setTimeFilter(time);
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* 标题和导出按钮 */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl md:text-2xl font-bold text-black">佣金记录</h2>
        <Button variant="outline" size="sm" className="bg-white text-black border-gray-300 shrink-0" data-testid="button-export-commissions">
          <Download className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">导出记录</span>
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <Card className="bg-white">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                <Coins className="h-5 w-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold text-green-600 truncate">
                  {isLoadingCommissions ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    totalCommissions.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  )}
                </p>
                <p className="text-sm text-gray-500">累计佣金</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold text-blue-600 truncate">
                  {isLoadingCommissions ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    settledCommissions.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  )}
                </p>
                <p className="text-sm text-gray-500">已结算佣金</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold text-yellow-600 truncate">
                  {isLoadingCommissions ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    pendingCommissions.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  )}
                </p>
                <p className="text-sm text-gray-500">待结算佣金</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选条件 */}
      <Card className="bg-white">
        <CardContent className="p-3 md:p-4 space-y-3">
          {/* 时间筛选 */}
          <div className="space-y-2">
            <span className="text-sm text-gray-500">时间:</span>
            <div className="flex flex-wrap gap-1">
              {[
                { value: "all", label: "全部" },
                { value: "day", label: "今天" },
                { value: "week", label: "本周" },
                { value: "month", label: "本月" },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => handleTimeFilterChange(item.value)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    timeFilter === item.value
                      ? "bg-white text-black shadow-sm border border-gray-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  data-testid={`tab-commission-time-${item.value}`}
                  disabled={isLoadingCommissions}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 佣金列表 */}
      <Card className="bg-white">
        <CardContent className="p-0">
          {isLoadingCommissions && commissions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : commissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Receipt className="h-12 w-12 mb-3 text-gray-300" />
              <p className="text-sm">暂无佣金记录</p>
            </div>
          ) : (
            <>
              {/* 桌面端表格 */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-black">订单号</TableHead>
                      <TableHead className="text-black">下级商户名称</TableHead>
                      <TableHead className="text-black">订单金额</TableHead>
                      <TableHead className="text-black">币种</TableHead>
                      <TableHead className="text-black">佣金比例</TableHead>
                      <TableHead className="text-black">佣金金额</TableHead>
                      <TableHead className="text-black">产生时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map((comm) => (
                      <TableRow key={comm.id}>
                        <TableCell className="font-mono text-sm text-black">{comm.orderId}</TableCell>
                        <TableCell className="font-medium text-black">{comm.subMerchantName}</TableCell>
                        <TableCell className="text-black">{formatCurrency(comm.orderAmount, comm.currency)}</TableCell>
                        <TableCell className="text-black">{comm.currency}</TableCell>
                        <TableCell className="text-black">{(comm.rate * 100).toFixed(2)}%</TableCell>
                        <TableCell className="font-medium text-green-600">
                          +{formatCurrency(comm.amount, comm.currency)}
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {new Date(comm.createdAt).toLocaleString("zh-CN")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 移动端卡片列表 */}
              <div className="md:hidden divide-y divide-gray-100">
                {commissions.map((comm) => (
                  <div key={comm.id} className="p-4 space-y-3" data-testid={`commission-card-${comm.id}`}>
                    {/* 头部：商户名称 */}
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-black">{comm.subMerchantName}</span>
                    </div>

                    {/* 订单号 */}
                    <p className="font-mono text-xs text-gray-500">{comm.orderId}</p>

                    {/* 金额信息 */}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">订单金额</p>
                        <p className="text-sm text-black">{formatCurrency(comm.orderAmount, comm.currency)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">佣金 ({(comm.rate * 100).toFixed(2)}%)</p>
                        <p className="font-bold text-lg text-green-600">+{formatCurrency(comm.amount, comm.currency)}</p>
                      </div>
                    </div>

                    {/* 币种 */}
                    <p className="text-xs text-gray-500">币种: {comm.currency}</p>

                    {/* 时间 */}
                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                      <Clock className="h-3 w-3" />
                      {new Date(comm.createdAt).toLocaleString("zh-CN")}
                    </div>
                  </div>
                ))}
              </div>

              {/* 加载更多按钮 */}
              {hasNextPage && (
                <div className="flex justify-center py-4 border-t border-gray-100">
                  <Button 
                    variant="outline" 
                    className="bg-white text-black border-gray-300 hover:bg-gray-50"
                    onClick={handleLoadMore}
                    disabled={isFetchingNextPage}
                    data-testid="button-load-more-commissions"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        加载中...
                      </>
                    ) : (
                      '加载更多'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// API配置响应接口
interface ApiConfigResponse {
  code: number;
  msg?: string;
  data?: {
    api?: {
      key?: string;
      "test-key"?: string;
    };
    ip?: {
      callback?: string;
      payment?: string;
    };
    fee?: {
      [currency: string]: {
        page?: {
          total: number;
          all_page: number;
          current_page: number;
          page_size: number;
        };
        list?: any[];
      };
    };
  };
}

// API日志响应接口
interface ApiLogItem {
  id: number;
  endpoint: string;
  method: string;
  request_header: string;
  request_body: string;
  response_status: string;
  response_data: string;
  addtime: string;
  response_time: string;
}

interface ApiLogsResponse {
  code: number;
  msg?: string;
  data?: {
    page: {
      total: number;
      all_page: number;
      current_page: number;
      page_size: number;
    };
    list: ApiLogItem[];
  };
}

function APIManagement() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("keys");
  const [isDocumentationExpanded, setIsDocumentationExpanded] = useState(false);
  const [copyText, setCopyText] = useState<{ [key: string]: string }>({
    production: "复制",
    test: "复制"
  });
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({
    production: false,
    test: false
  });
  const [selectedLog, setSelectedLog] = useState<ApiLogItem | null>(null);
  const [isLogDetailOpen, setIsLogDetailOpen] = useState(false);

  // 获取API配置
  const { data: apiConfigData, isLoading: isLoadingApiConfig } = useQuery<ApiConfigResponse>({
    queryKey: ["merchantApiConfig"],
    queryFn: async () => {
      const token = localStorage.getItem('merchantToken');
      if (!token) {
        throw new Error('未找到登录凭证');
      }

      const response = await apiRequest<ApiConfigResponse>(
        'POST',
        '/Api/Index/config',
        { token }
      );
      return response;
    },
    enabled: true,
    staleTime: 30000, // 30秒
  });

  const apiKeys = {
    production: apiConfigData?.data?.api?.key || "",
    test: apiConfigData?.data?.api?.["test-key"] || ""
  };

  // 隐藏密钥显示（只显示前8个字符和后4个字符，中间用星号代替）
  const maskKey = (key: string): string => {
    if (!key || key.length <= 12) {
      return "•".repeat(20); // 如果密钥太短，全部用点号代替
    }
    const start = key.substring(0, 8);
    const end = key.substring(key.length - 4);
    const middle = "•".repeat(Math.max(12, key.length - 12));
    return `${start}${middle}${end}`;
  };

  // 获取显示的密钥（根据显示状态）
  const getDisplayKey = (key: string, keyType: "production" | "test"): string => {
    if (!key) return "";
    return showKeys[keyType] ? key : maskKey(key);
  };

  // 获取API日志
  const {
    data: apiLogsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingLogs,
  } = useInfiniteQuery<ApiLogsResponse>({
    queryKey: ["merchantApiLogs"],
    queryFn: async ({ pageParam = 1 }) => {
      const token = localStorage.getItem('merchantToken');
      if (!token) {
        throw new Error('未找到登录凭证');
      }

      const response = await apiRequest<ApiLogsResponse>(
        'POST',
        '/api/Index/apiLogs',
        {
          token,
          pageNum: pageParam,
          pageSize: 15,
        }
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
    enabled: activeTab === "logs", // 只在logs标签页激活时获取数据
    staleTime: 0,
    refetchInterval: false,
  });

  // 将API日志数据转换为显示格式
  const apiLogs = useMemo(() => {
    if (!apiLogsData?.pages) return [];
    const allLogs: Array<{
      id: number;
      time: string;
      endpoint: string;
      method: string;
      status: number;
      responseTime: string;
      rawData: ApiLogItem;
    }> = [];
    
    apiLogsData.pages.forEach((page) => {
      if (page.data?.list) {
        page.data.list.forEach((item) => {
          // 转换时间戳为日期字符串
          const time = item.addtime && item.addtime !== "0"
            ? new Date(parseInt(item.addtime) * 1000).toLocaleString("zh-CN")
            : "";
          
          // 解析状态码
          const status = parseInt(item.response_status) || 0;
          
          allLogs.push({
            id: item.id,
            time,
            endpoint: item.endpoint,
            method: item.method,
            status,
            responseTime: `${item.response_time}ms`,
            rawData: item,
          });
        });
      }
    });
    
    return allLogs;
  }, [apiLogsData]);

  const copyToClipboard = (text: string, keyType: "production" | "test") => {
    if (!text) {
      toast({ 
        title: "复制失败", 
        description: "API密钥为空",
        variant: "destructive"
      });
      return;
    }

    navigator.clipboard.writeText(text)
      .then(() => {
        setCopyText({ ...copyText, [keyType]: "已复制!" });
        toast({ title: "复制成功", description: "API密钥已复制到剪贴板" });
        setTimeout(() => {
          setCopyText({ ...copyText, [keyType]: "复制" });
        }, 2000);
      })
      .catch(() => {
        setCopyText({ ...copyText, [keyType]: "失败" });
        setTimeout(() => {
          setCopyText({ ...copyText, [keyType]: "复制" });
        }, 2000);
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key className="h-6 w-6 text-black" />
          <h2 className="text-2xl font-bold text-black">API管理</h2>
        </div>
      </div>

      <Card className="bg-white">
        <CardContent className="p-0">
          <div className="border-b border-gray-100">
            <div className="bg-gray-100 p-1 rounded-lg inline-flex gap-1 m-4">
              {[
                { value: "keys", label: "API密钥" },
                { value: "documentation", label: "API文档" },
                { value: "logs", label: "请求日志" },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setActiveTab(item.value)}
                  className={`px-4 py-2 text-sm rounded-md transition-colors ${
                    activeTab === item.value
                      ? "bg-white text-black shadow-sm"
                      : "text-gray-600 hover:text-black"
                  }`}
                  data-testid={`tab-api-${item.value}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "keys" && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-black mb-4">API密钥管理</h3>
              {isLoadingApiConfig ? (
                <div className="text-center py-8 text-gray-500">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  加载中...
                </div>
              ) : (
              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-medium text-black mb-2 block">正式环境密钥</Label>
                  <div className="flex space-x-2">
                    <Input 
                      readOnly 
                        value={getDisplayKey(apiKeys.production, "production")}
                        className="font-mono bg-gray-50 border-gray-300 text-black"
                        placeholder={apiKeys.production ? undefined : "暂无数据"}
                      data-testid="input-production-key"
                    />
                      <Button
                        variant="outline"
                        className="bg-white text-black border-gray-300"
                        onClick={() => setShowKeys({ ...showKeys, production: !showKeys.production })}
                        disabled={!apiKeys.production}
                        data-testid="button-toggle-production-key"
                      >
                        {showKeys.production ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" />
                            隐藏
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            显示
                          </>
                        )}
                      </Button>
                    <Button
                      variant="outline"
                      className="bg-white text-black border-gray-300"
                      onClick={() => copyToClipboard(apiKeys.production, "production")}
                        disabled={!apiKeys.production}
                      data-testid="button-copy-production-key"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      {copyText.production}
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-black mb-2 block">测试环境密钥</Label>
                  <div className="flex space-x-2">
                    <Input 
                      readOnly 
                        value={getDisplayKey(apiKeys.test, "test")}
                        className="font-mono bg-gray-50 border-gray-300 text-black"
                        placeholder={apiKeys.test ? undefined : "暂无数据"}
                      data-testid="input-test-key"
                    />
                      <Button
                        variant="outline"
                        className="bg-white text-black border-gray-300"
                        onClick={() => setShowKeys({ ...showKeys, test: !showKeys.test })}
                        disabled={!apiKeys.test}
                        data-testid="button-toggle-test-key"
                      >
                        {showKeys.test ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" />
                            隐藏
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            显示
                          </>
                        )}
                      </Button>
                    <Button
                      variant="outline"
                      className="bg-white text-black border-gray-300"
                      onClick={() => copyToClipboard(apiKeys.test, "test")}
                        disabled={!apiKeys.test}
                      data-testid="button-copy-test-key"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      {copyText.test}
                    </Button>
                  </div>
                </div>
              </div>
              )}
            </div>
          )}

          {activeTab === "documentation" && (
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('otc.api.documentation')}</h2>
              
              {/* 目录导航 */}
              <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">{t('otc.api.documentation.tableOfContents')}</h3>
                  {!isDocumentationExpanded && (
                    <Button 
                      onClick={() => setIsDocumentationExpanded(true)}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      {t('otc.api.documentation.viewMore')}
                    </Button>
                  )}
                </div>
                <ul className="space-y-2">
                  <li>
                    <a 
                      href="#api-basic-info" 
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsDocumentationExpanded(true);
                        setTimeout(() => {
                          document.getElementById('api-basic-info')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      }}
                    >
                      {t('otc.api.documentation.basicInfo')}
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#api-signature" 
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsDocumentationExpanded(true);
                        setTimeout(() => {
                          document.getElementById('api-signature')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      }}
                    >
                      {t('otc.api.documentation.signature')}
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#api-payment" 
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsDocumentationExpanded(true);
                        setTimeout(() => {
                          document.getElementById('api-payment')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      }}
                    >
                      {t('otc.api.documentation.payment')}
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#api-payout" 
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsDocumentationExpanded(true);
                        setTimeout(() => {
                          document.getElementById('api-payout')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      }}
                    >
                      {t('otc.api.documentation.payout')}
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#api-set-return-order-id" 
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsDocumentationExpanded(true);
                        setTimeout(() => {
                          document.getElementById('api-set-return-order-id')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      }}
                    >
                      {t('otc.api.documentation.setReturnOrderId')}
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#api-payment-callback" 
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsDocumentationExpanded(true);
                        setTimeout(() => {
                          document.getElementById('api-payment-callback')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      }}
                    >
                      {t('otc.api.documentation.callback')}
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#api-order-status" 
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsDocumentationExpanded(true);
                        setTimeout(() => {
                          document.getElementById('api-order-status')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      }}
                    >
                      {t('otc.api.documentation.orderStatus')}
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#api-external-order-sync" 
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsDocumentationExpanded(true);
                        setTimeout(() => {
                          document.getElementById('api-external-order-sync')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      }}
                    >
                      {t('otc.api.documentation.externalOrderSync')}
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#api-currency-channel" 
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsDocumentationExpanded(true);
                        setTimeout(() => {
                          document.getElementById('api-currency-channel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      }}
                    >
                      {t('otc.api.documentation.currencyChannel')}
                    </a>
                  </li>
                </ul>
              </div>

              {isDocumentationExpanded && (
              <>
              <div className="prose max-w-none space-y-8">
                {/* 基本信息 */}
                <div id="api-basic-info" className="scroll-mt-4">
                  <div className="border-b border-gray-300 pb-3 mb-4">
                    <h3 className="text-base font-semibold text-gray-900">{t('otc.api.documentation.basicInfo')}</h3>
                  </div>
                  <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <div className="space-y-3">
                      <p className="mb-2"><strong className="text-gray-700">{t('otc.api.documentation.requestGateway')}</strong><span className="text-gray-900 font-mono text-sm">https://otc.beingfi.com/</span></p>
                      <p className="mb-2"><strong className="text-gray-700">{t('otc.api.documentation.requestMethod')}</strong><span className="text-gray-900">POST</span></p>
                      <p className="mb-2"><strong className="text-gray-700">{t('otc.api.documentation.dataFormat')}</strong><span className="text-gray-900">Form-Data</span></p>
                    </div>
                  </div>
                </div>

                {/* 签名算法 */}
                <div id="api-signature" className="scroll-mt-4">
                  <div className="border-b border-gray-300 pb-3 mb-4">
                    <h3 className="text-base font-semibold text-gray-900">{t('otc.api.documentation.signature')}</h3>
                  </div>
                  <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <p className="mb-4 text-gray-700">
                      {t('otc.api.documentation.signatureSteps')}
                    </p>
                    <div className="mb-6 space-y-3">
                      <div className="pl-4 border-l-4 border-blue-500">
                        <p className="mb-2"><strong>{t('otc.api.documentation.step1')}</strong>设所有发送或者接收到的数据为集合M，将集合M内非空参数值的参数按照参数名ASCII码从小到大排序（a-z字典序），使用URL键值对的格式（即key1=value1&key2=value2…）拼接成字符串stringA。</p>
                      </div>
                      <div className="pl-4 border-l-4 border-blue-500">
                        <p className="mb-2"><strong>{t('otc.api.documentation.step2')}</strong>在stringA最后拼接上应用(ApiKey)得到stringSignTemp字符串，并对stringSignTemp进行MD5运算，再将得到的字符串所有字符转换为大写，得到sign值signValue。</p>
                      </div>
                    </div>
                    <div className="mt-6">
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.paymentExample')}</p>
                      <div className="mb-4">
                        <p className="mb-2 text-sm font-medium text-gray-900">{t('otc.api.documentation.concatString')}</p>
                        <pre className="p-4 rounded-md text-sm overflow-x-auto bg-gray-50 border border-gray-200 font-mono text-gray-900">
                          stringSignTemp="agentid=agentid&amount=amount&channelid=channelid&cointype=cointype&noticestr=noticestr&notifyurl=notifyurl&orderid=orderid&payment_orderid=payment_orderid&userid=userid&key=Apikey"
                        </pre>
                      </div>
                      <div>
                        <p className="mb-2 text-sm font-medium text-gray-900">{t('otc.api.documentation.generateMd5')}</p>
                        <pre className="p-4 rounded-md text-sm overflow-x-auto bg-gray-50 border border-gray-200 font-mono text-gray-900">
                          sign=MD5(stringSignTemp).toUpperCase()
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 代收接口 */}
                <div id="api-payment" className="scroll-mt-4">
                  <div className="border-b border-gray-300 pb-3 mb-4">
                    <h3 className="text-base font-semibold text-gray-900">{t('otc.api.documentation.payment')}</h3>
                  </div>
                  <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <div className="mb-6">
                      <p className="mb-2 text-sm text-gray-600"><strong className="text-gray-900">{t('otc.api.documentation.endpoint')}</strong></p>
                      <p className="font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200">网关/pay/PayParams</p>
                    </div>

                    <div className="mb-6">
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.requestParams')}</p>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.paramName')}</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.type')}</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.description')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">userid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">供应商ID</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">agentid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">供应商ID</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">channelid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">渠道ID</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">orderid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">供应商订单号</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">payment_orderid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.optional')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">商户订单号</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">cointype</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">币种</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">amount</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">金额，保留2位小数</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">notifyurl</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">异步通知地址</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">noticestr</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">随机字符串</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">sign</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">签名</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.response')}</p>
                      <p className="mb-2 text-sm font-medium text-gray-900">{t('otc.api.documentation.example')}</p>
                      <pre className="p-4 rounded-md text-sm overflow-x-auto bg-gray-50 border border-gray-200 font-mono text-gray-900">
{`{
    "status": "success",
    "msg": "成功",
    "data": {
        "mch_id": "09267767001",
        "signkey": "09267767001",
        "appid": "09267767001",
        "appsecret": "",
        "domain_record": "",
        "subject": "Wave+Money",
        "truename": "Ye Tun Oo",
        "qrcode": "https://otc.beingfi.com/Upload/public/68f367265d86e.jpg",
        "out_order_id": "2025110723020610154524",
        "real_amount": "0.00",
        "noticestr": "uywK41Y3a6paBsnHzVkgU1ssDTjF4p6y",
        "sign": "CB066BB77E20D07634986A024BA5D819"
    }
}`}
                      </pre>
                    </div>

                    <div>
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.paramDescription')}</p>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.paramName')}</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.description')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">mch_id</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">收款账号</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">signkey</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">收款账号</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">appid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">收款账号</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">appsecret</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">密钥</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">domain_record</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">域名</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">subject</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">收款方式</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">truename</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">收款人姓名</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">qrcode</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">二维码</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">out_order_id</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">平台订单号</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">real_amount</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">真实支付金额</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">noticestr</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">随机字符串</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">sign</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">签名</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 代付接口 */}
                <div id="api-payout" className="scroll-mt-4">
                  <div className="border-b border-gray-300 pb-3 mb-4">
                    <h3 className="text-base font-semibold text-gray-900">{t('otc.api.documentation.payout')}</h3>
                  </div>
                  <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <div className="mb-6">
                      <p className="mb-2 text-sm text-gray-600"><strong className="text-gray-900">{t('otc.api.documentation.endpoint')}</strong></p>
                      <p className="font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200">网关/Pay/PayParams/autoSellC2COrder.html</p>
                    </div>

                    <div className="mb-6">
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.requestParams')}</p>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.paramName')}</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.type')}</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.description')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">userid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">供应商ID</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">agentid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">供应商ID</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">channelid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">渠道ID</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">orderid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">供应商订单号</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">payment_orderid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.optional')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">商户订单号</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">cointype</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">币种</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">truename</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">收款人姓名</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">bank</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">收款银行</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">bankcard</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">收款账户</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">amount</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">金额，保留2位小数</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">fee</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">手续费，保留2位小数</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">notifyurl</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">异步通知地址</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">noticestr</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">随机字符串</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">sign</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">签名</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.response')}</p>
                      <p className="mb-2 text-sm font-medium text-gray-900">{t('otc.api.documentation.example')}</p>
                      <pre className="p-4 rounded-md text-sm overflow-x-auto bg-gray-50 border border-gray-200 font-mono text-gray-900">
{`{
    "status": "success",
    "msg": "成功",
    "data": {
        "out_order_id": "2025110723134254495398",
        "noticestr": "FI3SrFz1E1lH83deqjZPJ9eh0iS14AlI",
        "sign": "6E4365C47B16F808702C38D18C43AD1B"
    }
}`}
                      </pre>
                    </div>

                    <div>
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.paramDescription')}</p>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.paramName')}</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.description')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">out_order_id</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">平台订单号</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">noticestr</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">随机字符串</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">sign</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">签名</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 设置代收唯一标识接口 */}
                <div id="api-set-return-order-id" className="scroll-mt-4">
                  <div className="border-b border-gray-300 pb-3 mb-4">
                    <h3 className="text-base font-semibold text-gray-900">{t('otc.api.documentation.setReturnOrderId')}</h3>
                  </div>
                  <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <div className="mb-6">
                      <p className="mb-2 text-sm text-gray-600"><strong className="text-gray-900">{t('otc.api.documentation.endpoint')}</strong></p>
                      <p className="font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200">网关/Pay/PayParams/setOTCOrderReturnOrderId.html</p>
                    </div>

                    <div className="mb-6">
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.requestParams')}</p>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.paramName')}</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.type')}</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.description')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">userid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">供应商ID</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">agentid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">供应商ID</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">orderid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">平台订单号</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">pay_proof</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">根据通道选择传递</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">支付截图</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">return_bank_name</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">根据通道选择传递</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">付款银行</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">return_account_name</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">根据通道选择传递</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">付款人姓名</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">return_order_id</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">根据通道选择传递</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">唯一标识</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">noticestr</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">随机字符串</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">sign</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">签名</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.response')}</p>
                      <p className="mb-2 text-sm font-medium text-gray-900">{t('otc.api.documentation.example')}</p>
                      <pre className="p-4 rounded-md text-sm overflow-x-auto bg-gray-50 border border-gray-200 font-mono text-gray-900">
{`{
    "status": "success",
    "msg": "成功",
    "data": []
}`}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* 代收 / 代付 回调通知 */}
                <div id="api-payment-callback" className="scroll-mt-4">
                  <div className="border-b border-gray-300 pb-3 mb-4">
                    <h3 className="text-base font-semibold text-gray-900">{t('otc.api.documentation.callback')}</h3>
                  </div>
                  <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <div className="mb-6">
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.notificationMethod')}</p>
                      <p className="mb-2 text-gray-700">POST</p>
                    </div>

                    <div className="mb-6">
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.notificationFormat')}</p>
                      <p className="mb-2 text-gray-700">Content-Type: application/x-www-form-urlencoded</p>
                    </div>

                    <div className="mb-6">
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.notificationParams')}</p>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.paramName')}</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.description')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">amount</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">金额，保留2位小数</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">orderid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">平台订单号</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">userid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">用户ID</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">status</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">状态，2 代表成功；3 代表失败</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">noticestr</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">随机字符串</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">sign</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">签名</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                        <p className="mb-2 text-sm font-medium text-gray-900">{t('otc.api.documentation.important')}</p>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                          <li>接收到服务器点对点通讯时，在页面输出"ok"</li>
                          <li>请务必进行结果的sign验证，确保正确性</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 查询订单状态接口 */}
                <div id="api-order-status" className="scroll-mt-4">
                  <div className="border-b border-gray-300 pb-3 mb-4">
                    <h3 className="text-base font-semibold text-gray-900">{t('otc.api.documentation.orderStatus')}</h3>
                  </div>
                  <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <div className="mb-6">
                      <p className="mb-2 text-sm text-gray-600"><strong className="text-gray-900">{t('otc.api.documentation.endpoint')}</strong></p>
                      <p className="font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200">网关/Pay/PayParams/getOTCC2COrderStatus.html</p>
                    </div>

                    <div className="mb-6">
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.requestParams')}</p>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.paramName')}</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.type')}</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.description')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">userid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">供应商ID</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">orderid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">供应商订单号</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">noticestr</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">随机字符串</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">sign</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">签名</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.response')}</p>
                      <p className="mb-2 text-sm font-medium text-gray-900">{t('otc.api.documentation.example')}</p>
                      <pre className="p-4 rounded-md text-sm overflow-x-auto bg-gray-50 border border-gray-200 font-mono text-gray-900">
{`{
    "status": "success",
    "msg": "成功",
    "data": {
        "order_status": -1,
        "noticestr": "d3Tl125jNiFJXiEFOJTLmvSF70P2Rgld",
        "sign": "B7C2612C1DD4B69B62A760154B663A30"
    }
}`}
                      </pre>
                    </div>

                    <div>
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.paramDescription')}</p>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.paramName')}</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.description')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">order_status</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">订单状态，-1订单不存在，0 未处理，1处理中，2待确认，3成功，4失败</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">noticestr</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">随机字符串</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">sign</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">签名</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 外部订单同步接口 */}
                <div id="api-external-order-sync" className="scroll-mt-4">
                  <div className="border-b border-gray-300 pb-3 mb-4">
                    <h3 className="text-base font-semibold text-gray-900">{t('otc.api.documentation.externalOrderSync')}</h3>
                  </div>
                  <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <div className="mb-6">
                      <p className="mb-2 text-sm text-gray-600"><strong className="text-gray-900">{t('otc.api.documentation.endpoint')}</strong></p>
                      <p className="font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200">网关/pay/PayOutOrder</p>
                    </div>

                    <div className="mb-6">
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.requestParams')}</p>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.paramName')}</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.type')}</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.description')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">userid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">供应商ID</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">otype</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">订单类型，1 代付；2 代收</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">payOrderId</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">支付系统订单号</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">mchNo</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">支付系统商户号</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">appId</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">支付系统应用ID</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">mchOrderNo</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">支付系统商户传入的订单号</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">mchUserId</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">支付系统商户平台用户ID</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">ifCode</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">支付接口编码</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">wayCode</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">支付方式</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">amount</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">订单金额（保留2位小数）</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">amountActual</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">实际支付金额（保留2位小数）</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">mchFeeAmount</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">商户手续费金额（保留2位小数）</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">currency</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">货币代码</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">state</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">支付订单状态：0-订单生成；1-支付中；2-支付成功；3-支付失败；4-已撤销；5-已退款；6-订单关闭</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">userBorneRates</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">用户是否承担费率：0-不承担；1-承担</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">clientIp</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">客户端IP</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">subject</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">商品标题</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">body</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">商品描述</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">createdAt</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">创建时间，13位时间戳</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">successTime</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">成功时间，13位时间戳</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">reqTime</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">通知请求时间，13位时间戳</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">bankName</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">代付订单必传</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">收款银行名称，代付订单必传</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">accountName</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">代付订单必传</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">收款人姓名，代付订单必传</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">accountNo</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">代付订单必传</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">收款账号，代付订单必传</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">noticestr</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">随机字符串</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">sign</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">签名</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.response')}</p>
                      <p className="mb-2 text-sm font-medium text-gray-900">{t('otc.api.documentation.example')}</p>
                      <pre className="p-4 rounded-md text-sm overflow-x-auto bg-gray-50 border border-gray-200 font-mono text-gray-900">
{`{
    "status": "success",
    "msg": "成功",
    "data": {
        "mchNo": null,
        "orderid": "2025110723434099544810",
        "payOrderId": "P12021022311124442600",
        "amount": "100.00",
        "status": "0",
        "currency": "MMK",
        "noticestr": "ElzbP9kyK5gGtb5B5loRo63zjFq5Rxwv",
        "sign": "4EC9657700B3A27ACB2605ADDC2F32D6"
    }
}`}
                      </pre>
                    </div>

                    <div>
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.paramDescription')}</p>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.paramName')}</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.description')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">mchNo</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">支付系统商户号</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">orderid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">平台订单号</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">payOrderId</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">支付系统订单号</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">amount</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">订单金额</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">status</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">订单状态</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">currency</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">币种</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">noticestr</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">随机字符串</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">sign</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">签名</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 币种及通道 */}
                <div id="api-currency-channel" className="scroll-mt-4">
                  <div className="border-b border-gray-300 pb-3 mb-4">
                    <h3 className="text-base font-semibold text-gray-900">{t('otc.api.documentation.currencyChannel')}</h3>
                  </div>
                  <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <p className="text-gray-700">{t('otc.api.documentation.contactBusiness')}</p>
                  </div>
                </div>

              </div>
              
              {/* 收起文档按钮 */}
              <div className="mt-6 text-center">
                <Button 
                  onClick={() => {
                    setIsDocumentationExpanded(false);
                    // 滚动到顶部
                    setTimeout(() => {
                      document.querySelector('.border.border-gray-200.rounded-lg')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                  }}
                  variant="outline"
                  className="bg-white text-black border-gray-300 hover:bg-gray-50"
                >
                  收起文档
                </Button>
              </div>
              </>
              )}
            </div>
          )}

          {activeTab === "logs" && (
            <div className="p-4 md:p-6">
              <h3 className="text-lg font-semibold text-black mb-4">请求日志</h3>
              
              {/* 桌面端表格 */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-medium text-black">时间</TableHead>
                      <TableHead className="font-medium text-black">接口</TableHead>
                      <TableHead className="font-medium text-black">方法</TableHead>
                      <TableHead className="font-medium text-black">状态码</TableHead>
                      <TableHead className="font-medium text-black">响应时间</TableHead>
                      <TableHead className="font-medium text-black">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingLogs && apiLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          加载中...
                        </TableCell>
                      </TableRow>
                    ) : apiLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          暂无数据
                        </TableCell>
                      </TableRow>
                    ) : (
                      apiLogs.map((log) => (
                        <TableRow key={log.id} className="hover:bg-gray-50">
                          <TableCell className="text-sm text-black">{log.time}</TableCell>
                          <TableCell className="text-sm font-mono text-black">{log.endpoint}</TableCell>
                        <TableCell className={`text-sm font-medium ${
                          log.method === "GET" ? "text-blue-600" : 
                          log.method === "POST" ? "text-green-600" : 
                          log.method === "PUT" ? "text-amber-600" : 
                          "text-red-600"
                        }`}>
                          {log.method}
                        </TableCell>
                        <TableCell className={`text-sm font-medium ${
                          log.status >= 200 && log.status < 300 ? "text-green-600" : 
                          log.status >= 400 && log.status < 500 ? "text-amber-600" : 
                          "text-red-600"
                        }`}>
                          {log.status}
                        </TableCell>
                          <TableCell className="text-sm text-black">{log.responseTime}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-white text-black border-gray-300 hover:bg-gray-50"
                              onClick={() => {
                                setSelectedLog(log.rawData);
                                setIsLogDetailOpen(true);
                              }}
                              data-testid={`button-view-log-${log.id}`}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              查看
                            </Button>
                          </TableCell>
                      </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* 移动端卡片列表 */}
              <div className="md:hidden space-y-3">
                {isLoadingLogs && apiLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">加载中...</div>
                ) : apiLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">暂无数据</div>
                ) : (
                  apiLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-gray-50 rounded-lg space-y-2" data-testid={`log-card-${log.id}`}>
                    {/* 方法和状态码 */}
                    <div className="flex items-center justify-between">
                      <Badge className={`${
                        log.method === "GET" ? "bg-blue-100 text-blue-700" : 
                        log.method === "POST" ? "bg-green-100 text-green-700" : 
                        log.method === "PUT" ? "bg-amber-100 text-amber-700" : 
                        "bg-red-100 text-red-700"
                      }`}>
                        {log.method}
                      </Badge>
                      <Badge className={`${
                        log.status >= 200 && log.status < 300 ? "bg-green-100 text-green-700" : 
                        log.status >= 400 && log.status < 500 ? "bg-amber-100 text-amber-700" : 
                        "bg-red-100 text-red-700"
                      }`}>
                        {log.status}
                      </Badge>
                    </div>

                    {/* 接口路径 */}
                    <p className="font-mono text-sm text-black break-all">{log.endpoint}</p>

                    {/* 时间和响应时间 */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{log.time}</span>
                      <span>{log.responseTime}</span>
                    </div>

                      {/* 查看详情按钮 */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-white text-black border-gray-300 hover:bg-gray-50"
                        onClick={() => {
                          setSelectedLog(log.rawData);
                          setIsLogDetailOpen(true);
                        }}
                        data-testid={`button-view-log-mobile-${log.id}`}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        查看详情
                      </Button>
                  </div>
                  ))
                )}
              </div>

              {hasNextPage && (
              <div className="mt-6 flex justify-center">
                <Button 
                  variant="outline" 
                  className="bg-white text-black border-gray-300 hover:bg-gray-50"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  data-testid="button-load-more-logs"
                >
                    {isFetchingNextPage ? "加载中..." : "加载更多"}
                </Button>
              </div>
              )}

              {/* 日志详情对话框 */}
              <Dialog open={isLogDetailOpen} onOpenChange={setIsLogDetailOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-black">请求日志详情</DialogTitle>
                  </DialogHeader>
                  {selectedLog && (
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-black">时间</Label>
                        <p className="text-sm text-gray-600">
                          {selectedLog.addtime && selectedLog.addtime !== "0"
                            ? new Date(parseInt(selectedLog.addtime) * 1000).toLocaleString("zh-CN")
                            : "-"}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-black">接口</Label>
                        <p className="text-sm font-mono text-gray-600 break-all">{selectedLog.endpoint}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-black">方法</Label>
                        <Badge className={`${
                          selectedLog.method === "GET" ? "bg-blue-100 text-blue-700" : 
                          selectedLog.method === "POST" ? "bg-green-100 text-green-700" : 
                          selectedLog.method === "PUT" ? "bg-amber-100 text-amber-700" : 
                          "bg-red-100 text-red-700"
                        }`}>
                          {selectedLog.method}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-black">请求头</Label>
                        <pre className="bg-gray-50 p-3 rounded-md text-xs font-mono text-black overflow-x-auto">
                          {selectedLog.request_header || "-"}
                        </pre>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-black">请求体</Label>
                        <pre className="bg-gray-50 p-3 rounded-md text-xs font-mono text-black overflow-x-auto">
                          {selectedLog.request_body || "-"}
                        </pre>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-black">响应状态码</Label>
                        <Badge className={`${
                          parseInt(selectedLog.response_status) >= 200 && parseInt(selectedLog.response_status) < 300 
                            ? "bg-green-100 text-green-700" : 
                          parseInt(selectedLog.response_status) >= 400 && parseInt(selectedLog.response_status) < 500 
                            ? "bg-amber-100 text-amber-700" : 
                          "bg-red-100 text-red-700"
                        }`}>
                          {selectedLog.response_status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-black">响应数据</Label>
                        <pre className="bg-gray-50 p-3 rounded-md text-xs font-mono text-black overflow-x-auto max-h-60">
                          {selectedLog.response_data || "-"}
                        </pre>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-black">响应时间</Label>
                        <p className="text-sm text-gray-600">{selectedLog.response_time}ms</p>
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button 
                      className="bg-black text-white hover:bg-gray-800" 
                      onClick={() => setIsLogDetailOpen(false)}
                    >
                      关闭
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function MerchantDashboard() {
  const [activeMenu, setActiveMenu] = useState("assets");
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 检查登录状态
  useEffect(() => {
    const merchantToken = localStorage.getItem("merchantToken");
    const merchantUser = localStorage.getItem("merchantUser");
    
    if (!merchantToken || !merchantUser) {
      setLocation("/merchant-login");
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("merchantToken");
    localStorage.removeItem("merchantUser");
    setLocation("/merchant-login");
  };

  const renderContent = () => {
    switch (activeMenu) {
      case "assets":
        return <MerchantAssets />;
      case "orders":
        return <OrderManagement />;
      case "sub-merchants":
        return <SubMerchants />;
      case "commissions":
        return <CommissionRecords />;
      case "api":
        return <APIManagement />;
      default:
        return <MerchantAssets />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 侧边栏 - 桌面端 */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-black">商户后台</h1>
              <p className="text-xs text-gray-500">Merchant Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveMenu(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeMenu === item.id
                      ? "bg-gray-100 text-black font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                  data-testid={`menu-${item.id}`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            data-testid="button-logout"
          >
            <LogOut className="h-5 w-5" />
            退出登录
          </button>
        </div>
      </aside>

      {/* 移动端顶部导航 */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-black">商户后台</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 border-gray-300"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {isMobileMenuOpen && (
          <div className="bg-white border-t border-gray-100 p-2 shadow-lg">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveMenu(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
                  activeMenu === item.id
                    ? "bg-gray-100 text-black font-medium"
                    : "text-gray-600"
                }`}
                data-testid={`mobile-menu-${item.id}`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 mt-2"
              data-testid="button-mobile-logout"
            >
              <LogOut className="h-5 w-5" />
              退出登录
            </button>
          </div>
        )}
      </div>

      {/* 主内容区域 */}
      <main className="flex-1 lg:p-8 p-4 pt-20 lg:pt-8 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}
