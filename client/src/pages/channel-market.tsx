import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Globe, 
  CreditCard, 
  Info, 
  Building2, 
  ArrowUpDown,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { getQueryFn } from "@/lib/queryClient";
import type { PaymentApi } from "@shared/schema";

// 支付方式图标映射
const paymentMethodIcons: Record<string, JSX.Element> = {
  "credit_card": <CreditCard size={16} />,
  "bank_transfer": <Building2 size={16} />,
  "信用卡": <CreditCard size={16} />,
  "借记卡": <CreditCard size={16} />,
  "paypal钱包": <Globe size={16} />,
  "支付宝钱包": <Globe size={16} />,
  "微信钱包": <Globe size={16} />,
  "银联卡": <CreditCard size={16} />,
  "apple pay": <Globe size={16} />,
  "google pay": <Globe size={16} />,
  "银行转账": <Building2 size={16} />,
};

// 支付API状态徽章
function ApiStatusBadge({ status }: { status: string }) {
  switch(status) {
    case "active":
      return <Badge className="bg-green-500"><CheckCircle2 size={12} className="mr-1" /> 可用</Badge>;
    case "inactive":
      return <Badge variant="destructive"><XCircle size={12} className="mr-1" /> 不可用</Badge>;
    case "maintenance":
      return <Badge variant="outline"><AlertCircle size={12} className="mr-1" /> 维护中</Badge>;
    default:
      return <Badge variant="secondary"><Info size={12} className="mr-1" /> {status}</Badge>;
  }
}

// 简化的支付API卡片组件 - 带展开/折叠功能
function SimpleApiCard({ api, isExpanded, onToggle }: { 
  api: PaymentApi, 
  isExpanded: boolean, 
  onToggle: () => void 
}) {
  // 选择一个国家显示（如果有）
  const firstCountry = api.supportedCountries?.[0] || '未知';
  
  // 选择一个支付方式显示（如果有）
  const firstMethod = api.supportedPaymentMethods?.[0] || '未指定';
  const methodIcon = firstMethod ? paymentMethodIcons[firstMethod.toLowerCase()] : null;
  
  return (
    <Card className="w-full bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 shadow-lg hover:shadow-xl transition-all">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            {api.logo ? (
              <img src={api.logo} alt={api.name} className="w-10 h-10 object-contain" />
            ) : (
              <div className="w-10 h-10 bg-gray-700 rounded-md flex items-center justify-center text-gray-300">
                <Building2 size={20} />
              </div>
            )}
            <div>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                {api.name}
                <ApiStatusBadge status={api.apiStatus || 'active'} />
              </CardTitle>
              <CardDescription className="text-gray-300">
                {api.providerName || '未知'}
              </CardDescription>
            </div>
          </div>
          <Button className="bg-transparent hover:bg-green-600/10 px-4 py-2 text-base font-semibold text-white border-2 border-green-500 hover:border-green-400 shadow-md hover:shadow-green-500/20 transition-all">
            <span className="mr-1">立即开通</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
          <div className="flex items-center gap-1">
            <Globe size={14} className="text-gray-400" />
            <span className="text-sm text-gray-200">{firstCountry}</span>
          </div>
          
          <div className="flex items-center gap-1">
            {methodIcon}
            <span className="text-sm text-gray-200">{firstMethod}</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">保证金</span>
            <span className="text-sm font-semibold text-purple-400">
              {api.providerDeposit || '0'} <span className="text-xs">{api.currency}</span>
            </span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">代收费率</span>
            <span className="text-sm font-semibold text-green-400">
              {api.collectRate || '0'}%
            </span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">代付费率</span>
            <span className="text-sm font-semibold text-blue-400">
              {api.payoutRate || '0'}%
            </span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">交易限额</span>
            <span className="text-sm font-semibold text-gray-200">
              {api.minTransaction} - {api.maxTransaction || '无上限'}
            </span>
          </div>
          
          <div className="flex justify-end">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onToggle}
              className="text-gray-400 hover:text-white"
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
              <span className="ml-1 text-xs">{isExpanded ? '收起' : '展开'}</span>
            </Button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">支持的国家/地区</h4>
              <div className="flex flex-wrap gap-1">
                {api.supportedCountries?.map((country, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs bg-gray-700 text-gray-200 border-gray-600">{country}</Badge>
                )) || <span className="text-gray-400">未指定</span>}
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">支持的支付方式</h4>
              <div className="flex flex-wrap gap-1">
                {api.supportedPaymentMethods?.map((method, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs flex items-center bg-gray-700 text-gray-200 border-gray-600">
                    {paymentMethodIcons[method.toLowerCase()] || null}
                    <span className="ml-1">{method}</span>
                  </Badge>
                )) || <span className="text-gray-400">未指定</span>}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">备注与规则</h4>
              <p className="text-sm text-gray-300">{api.description}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 完整的支付API详情卡片 (保留这个以备将来使用)
function ApiDetailCard({ api }: { api: PaymentApi }) {
  const { t } = useLanguage();
  
  return (
    <Card className="w-full mb-6 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 shadow-xl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            {api.logo ? (
              <img src={api.logo} alt={api.name} className="w-12 h-12 object-contain" />
            ) : (
              <div className="w-12 h-12 bg-gray-700 rounded-md flex items-center justify-center text-gray-300">
                <Building2 size={24} />
              </div>
            )}
            <div>
              <CardTitle className="text-xl flex items-center gap-2 text-white">
                {api.name}
                <ApiStatusBadge status={api.apiStatus || 'active'} />
              </CardTitle>
              <CardDescription className="text-gray-300">
                提供商: {api.providerName || '未知'}
              </CardDescription>
            </div>
          </div>
          <Button className="bg-transparent hover:bg-green-600/10 px-6 py-5 text-lg font-semibold text-white border-2 border-green-500 hover:border-green-400 shadow-md hover:shadow-green-500/20 hover:shadow-lg transition-all">
            <span className="mr-2">立即开通</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="flex flex-col">
            <span className="text-sm text-gray-300 mb-1 flex items-center">
              <Globe size={14} className="mr-1" /> 支持国家/地区
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {api.supportedCountries?.map((country, idx) => (
                <Badge key={idx} variant="outline" className="text-xs bg-gray-700 text-gray-200 border-gray-600">{country}</Badge>
              )) || <span className="text-gray-400">未指定</span>}
            </div>
          </div>
          
          <div className="flex flex-col">
            <span className="text-sm text-gray-300 mb-1 flex items-center">
              <CreditCard size={14} className="mr-1" /> 支持支付方式
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {api.supportedPaymentMethods?.map((method, idx) => (
                <Badge key={idx} variant="outline" className="text-xs flex items-center bg-gray-700 text-gray-200 border-gray-600">
                  {paymentMethodIcons[method.toLowerCase()] || null}
                  <span className="ml-1">{method}</span>
                </Badge>
              )) || <span className="text-gray-400">未指定</span>}
            </div>
          </div>
          
          <div className="flex flex-col">
            <span className="text-sm text-gray-300 mb-1 flex items-center">
              <Clock size={14} className="mr-1" /> 结算周期
            </span>
            <span className="font-semibold text-white">{api.settlementTime || '未指定'}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-gray-700/50 border border-gray-600">
            <div className="text-sm text-gray-300 mb-1">代收费率</div>
            <div className="text-xl font-bold text-green-400">{api.collectRate || '未指定'}%</div>
          </div>
          
          <div className="p-4 rounded-lg bg-gray-700/50 border border-gray-600">
            <div className="text-sm text-gray-300 mb-1">代付费率</div>
            <div className="text-xl font-bold text-blue-400">{api.payoutRate || '未指定'}%</div>
          </div>
          
          <div className="p-4 rounded-lg bg-gray-700/50 border border-gray-600">
            <div className="text-sm text-gray-300 mb-1">交易限额</div>
            <div className="text-sm font-semibold text-gray-200">
              {api.minTransaction ? `${api.minTransaction} - ${api.maxTransaction || '无上限'}` : '未指定'} 
              <span className="text-xs text-gray-400 ml-1">{api.currency}</span>
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-gray-700/50 border border-gray-600">
            <div className="text-sm text-gray-300 mb-1">保证金</div>
            <div className="text-xl font-bold text-purple-400">
              {api.providerDeposit || '未指定'} 
              <span className="text-sm ml-1">{api.currency}</span>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t border-gray-700 pt-4">
        <p className="text-sm text-gray-300">{api.description}</p>
      </CardFooter>
    </Card>
  );
}

export default function ChannelMarket() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [countryTab, setCountryTab] = useState<string>("all");
  const [paymentMethodTab, setPaymentMethodTab] = useState<string>("all");
  const [providerTab, setProviderTab] = useState<string>("all");
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
  
  // 模拟支付API数据
  const mockPaymentApis: PaymentApi[] = [
    {
      id: 1,
      name: "支付宝国际",
      description: "支付宝国际支付接口，支持跨境电商和全球支付",
      logo: null,
      documentationUrl: null,
      isIntegrated: false,
      supportedCountries: ["中国", "新加坡", "马来西亚", "泰国", "日本"],
      supportedPaymentMethods: ["支付宝钱包", "信用卡", "借记卡"],
      collectRate: "1.50",
      payoutRate: "1.80",
      providerName: "支付宝",
      providerDeposit: "5000.00",
      currency: "CNY",
      minTransaction: "1.00",
      maxTransaction: "50000.00",
      settlementTime: "T+1",
      apiStatus: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      name: "WeChat Pay Global",
      description: "微信国际支付接口，覆盖亚太地区主要国家和地区",
      logo: null,
      documentationUrl: null,
      isIntegrated: false,
      supportedCountries: ["中国", "香港", "日本", "韩国", "泰国"],
      supportedPaymentMethods: ["微信钱包", "QR扫码"],
      collectRate: "1.60",
      payoutRate: "1.90",
      providerName: "微信支付",
      providerDeposit: "5000.00",
      currency: "CNY",
      minTransaction: "1.00",
      maxTransaction: "40000.00",
      settlementTime: "T+1",
      apiStatus: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 3,
      name: "Stripe Connect",
      description: "Stripe全球支付解决方案，支持190+国家和地区",
      logo: null,
      documentationUrl: null,
      isIntegrated: false,
      supportedCountries: ["美国", "英国", "加拿大", "澳大利亚", "欧盟"],
      supportedPaymentMethods: ["信用卡", "借记卡", "Apple Pay", "Google Pay"],
      collectRate: "2.90",
      payoutRate: "1.50",
      providerName: "Stripe",
      providerDeposit: "0.00",
      currency: "USD",
      minTransaction: "0.50",
      maxTransaction: "100000.00",
      settlementTime: "T+2",
      apiStatus: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 4,
      name: "PayPal Business",
      description: "PayPal全球商业支付解决方案",
      logo: null,
      documentationUrl: null,
      isIntegrated: false,
      supportedCountries: ["美国", "英国", "加拿大", "澳大利亚", "欧盟", "巴西"],
      supportedPaymentMethods: ["PayPal钱包", "信用卡", "借记卡"],
      collectRate: "3.50",
      payoutRate: "2.00",
      providerName: "PayPal",
      providerDeposit: "0.00",
      currency: "USD",
      minTransaction: "1.00",
      maxTransaction: "50000.00",
      settlementTime: "T+1",
      apiStatus: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 5,
      name: "亚洲支付通道",
      description: "覆盖亚洲主要国家和地区的综合支付解决方案",
      logo: null,
      documentationUrl: null,
      isIntegrated: false,
      supportedCountries: ["中国", "日本", "韩国", "新加坡", "马来西亚", "印度尼西亚", "菲律宾", "泰国", "越南"],
      supportedPaymentMethods: ["信用卡", "借记卡", "银行转账", "电子钱包"],
      collectRate: "2.00",
      payoutRate: "1.70",
      providerName: "AsiaPay",
      providerDeposit: "2000.00",
      currency: "USD",
      minTransaction: "1.00",
      maxTransaction: "30000.00",
      settlementTime: "T+1",
      apiStatus: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 6,
      name: "UnionPay International",
      description: "银联国际支付接口，全球超过180个国家和地区",
      logo: null,
      documentationUrl: null,
      isIntegrated: false,
      supportedCountries: ["中国", "俄罗斯", "日本", "韩国", "新加坡", "马来西亚", "泰国", "澳大利亚", "欧盟"],
      supportedPaymentMethods: ["银联卡", "QR扫码"],
      collectRate: "1.80",
      payoutRate: "1.50",
      providerName: "银联国际",
      providerDeposit: "10000.00",
      currency: "CNY",
      minTransaction: "1.00",
      maxTransaction: "100000.00",
      settlementTime: "T+1",
      apiStatus: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 7,
      name: "Adyen全球支付",
      description: "支持全球多种支付方式的企业级支付解决方案",
      logo: null,
      documentationUrl: null,
      isIntegrated: false,
      supportedCountries: ["美国", "欧盟", "英国", "巴西", "墨西哥", "印度", "中国", "日本", "澳大利亚"],
      supportedPaymentMethods: ["信用卡", "借记卡", "Apple Pay", "Google Pay", "支付宝钱包", "微信钱包"],
      collectRate: "3.00",
      payoutRate: "2.20",
      providerName: "Adyen",
      providerDeposit: "5000.00",
      currency: "EUR",
      minTransaction: "1.00",
      maxTransaction: "100000.00",
      settlementTime: "T+2",
      apiStatus: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 8,
      name: "Latin America Pay",
      description: "拉丁美洲地区专业支付解决方案",
      logo: null,
      documentationUrl: null,
      isIntegrated: false,
      supportedCountries: ["巴西", "墨西哥", "阿根廷", "智利", "哥伦比亚", "秘鲁"],
      supportedPaymentMethods: ["信用卡", "借记卡", "银行转账", "现金支付"],
      collectRate: "3.50",
      payoutRate: "2.80",
      providerName: "LatamPay",
      providerDeposit: "1000.00",
      currency: "USD",
      minTransaction: "1.00",
      maxTransaction: "20000.00",
      settlementTime: "T+2",
      apiStatus: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // 使用模拟数据，替代API查询
  const { isLoading, error } = useQuery<PaymentApi[]>({
    queryKey: ['/api/payment-apis'],
    queryFn: async () => {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockPaymentApis;
    },
  });
  
  const paymentApis = mockPaymentApis;
  
  // 切换卡片展开/折叠状态
  const toggleCardExpand = (id: number) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // 过滤支付API
  const filteredApis = paymentApis?.filter(api => {
    // 名称或描述搜索
    const searchMatch = searchTerm === "" || 
      api.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      api.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (api.providerName && api.providerName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // 国家/地区过滤
    const countryMatch = countryTab === "all" || 
      (api.supportedCountries && api.supportedCountries.includes(countryTab));
    
    // 支付方式过滤
    const paymentMethodMatch = paymentMethodTab === "all" || 
      (api.supportedPaymentMethods && api.supportedPaymentMethods.includes(paymentMethodTab));
    
    // 供应商过滤
    const providerMatch = providerTab === "all" || 
      (api.providerName && api.providerName === providerTab);
    
    return searchMatch && countryMatch && paymentMethodMatch && providerMatch;
  }) || [];
  
  // 获取所有可能的国家/地区
  const allCountries = Array.from(new Set(
    paymentApis?.flatMap(api => api.supportedCountries || []) || []
  )).sort();
  
  // 获取所有可能的支付方式
  const allPaymentMethods = Array.from(new Set(
    paymentApis?.flatMap(api => api.supportedPaymentMethods || []) || []
  )).sort();
  
  // 获取所有可能的供应商
  const allProviders = Array.from(new Set(
    paymentApis?.map(api => api.providerName)
      .filter((name): name is string => typeof name === 'string' && name !== '') || []
  )).sort();
  
  return (
    <div className="min-h-screen bg-dark text-white">
      <Header />
      
      {/* 顶部彩带 */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"></div>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto pt-36 pb-8 px-4"
      >
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-700"
          >
            <div className="relative mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="search" className="text-white">搜索</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="search"
                      placeholder="搜索通道名称、描述或供应商..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* 第一级标签：国家选择 */}
            <div className="mb-6">
              <div className="mb-2 text-sm text-gray-400">国家/地区:</div>
              <div className="pb-2">
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setCountryTab("all")}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      countryTab === "all" 
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" 
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    全部
                  </button>
                  {allCountries.map((country) => (
                    <button
                      key={country}
                      onClick={() => setCountryTab(country)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        countryTab === country
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" 
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      {country}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* 第二级标签：支付方式选择 */}
            <div className="mb-6">
              <div className="mb-2 text-sm text-gray-400">支付方式:</div>
              <div className="pb-2">
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setPaymentMethodTab("all")}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      paymentMethodTab === "all" 
                        ? "bg-gradient-to-r from-green-600 to-teal-600 text-white" 
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    全部
                  </button>
                  {allPaymentMethods.map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethodTab(method)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all inline-flex items-center ${
                        paymentMethodTab === method
                          ? "bg-gradient-to-r from-green-600 to-teal-600 text-white" 
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      {paymentMethodIcons[method.toLowerCase()] && (
                        <span className="mr-1">{paymentMethodIcons[method.toLowerCase()]}</span>
                      )}
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* 第三级标签：供应商选择 */}
            <div className="mb-6">
              <div className="mb-2 text-sm text-gray-400">供应商:</div>
              <div className="pb-2">
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setProviderTab("all")}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      providerTab === "all" 
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" 
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    全部
                  </button>
                  {allProviders.map((provider) => (
                    <button
                      key={provider}
                      onClick={() => setProviderTab(provider)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        providerTab === provider
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" 
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      {provider}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* 内容区域 */}
            <div className="mt-8">
              {isLoading && <p className="text-center py-12 text-white">正在加载支付通道...</p>}
              
              {error && (
                <div className="text-center py-12">
                  <p className="text-red-500 mb-2">加载支付通道出错</p>
                  <p className="text-white opacity-80">{(error as Error).message}</p>
                </div>
              )}
              
              {!isLoading && !error && filteredApis.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-white opacity-80">没有找到匹配的支付通道</p>
                </div>
              )}
              
              {!isLoading && !error && filteredApis.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="space-y-6"
                >
                  {filteredApis.map((api) => (
                    <motion.div
                      key={api.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <SimpleApiCard 
                        api={api} 
                        isExpanded={!!expandedCards[api.id]} 
                        onToggle={() => toggleCardExpand(api.id)} 
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
      
      <Footer />
    </div>
  );
}