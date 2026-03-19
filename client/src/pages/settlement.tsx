import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import OtcLayout from "@/components/otc/OtcLayout";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Wallet, FileText, Filter, Calendar, Search, ArrowLeft, ArrowRight, BarChart, Users, Settings } from "lucide-react";

// 货币符号映射
const currencySymbols: Record<string, string> = {
  CNY: "¥",  // 人民币
  INR: "₹",  // 印度卢比 
  MMK: "K",  // 缅甸元
  VND: "₫",  // 越南盾
};

// 状态标签颜色映射
const statusColors: Record<string, string> = {
  "已完成": "bg-green-100 text-green-800 border-green-200",
  "处理中": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "已失效": "bg-gray-100 text-gray-500 border-gray-200",
};

// 结算记录数据类型
interface SettlementRecord {
  id: string;
  operationAmount: number;
  operationCurrency: string;
  settlementAmount: number;
  settlementCurrency: string;
  rate: number;
  status: "已完成" | "处理中" | "已失效";
  date: string;
  accountInfo?: string;
}

// 生成模拟数据
const generateMockSettlementRecords = (count: number = 20): SettlementRecord[] => {
  const currencies = ["CNY", "INR", "MMK", "VND"];
  const statuses: ("已完成" | "处理中" | "已失效")[] = ["已完成", "处理中", "已失效"];
  
  return Array.from({ length: count }, (_, i) => {
    const operationCurrency = currencies[Math.floor(Math.random() * currencies.length)];
    const settlementCurrency = currencies[Math.floor(Math.random() * currencies.length)];
    const operationAmount = Math.floor(Math.random() * 10000) + 1000;
    const rate = parseFloat((Math.random() * 0.5 + 0.5).toFixed(4));
    const settlementAmount = Math.floor(operationAmount * rate);
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // 生成过去30天内的随机日期
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    return {
      id: `SET${10000 + i}`,
      operationAmount,
      operationCurrency,
      settlementAmount,
      settlementCurrency,
      rate,
      status,
      date: date.toISOString().split('T')[0],
      accountInfo: `Account ${1000 + Math.floor(Math.random() * 500)}`,
    };
  });
};

// 货币卡片组件
interface CurrencyCardProps {
  currency: string;
  totalAmount: number;
  pendingAmount: number;
  settledAmount: number;
  onClick: () => void;
  isActive: boolean;
}

const CurrencyCard: React.FC<CurrencyCardProps> = ({ 
  currency, 
  totalAmount, 
  pendingAmount, 
  settledAmount, 
  onClick, 
  isActive 
}) => {
  const symbol = currencySymbols[currency] || "";
  
  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-shadow ${
        isActive ? "border-primary border-2" : "border"
      } bg-white`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-lg font-semibold">{currency}</span>
          <span className="text-2xl font-bold">{symbol}{totalAmount.toLocaleString()}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-gray-500">处理中</p>
            <p className="font-medium">{symbol}{pendingAmount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">已结算</p>
            <p className="font-medium">{symbol}{settledAmount.toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// 结算记录组件
const SettlementTable: React.FC<{ 
  records: SettlementRecord[];
  currency: string | null;
}> = ({ records, currency }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  
  // 根据选定货币筛选记录
  const filteredRecords = currency 
    ? records.filter(r => r.settlementCurrency === currency) 
    : records;
  
  // 分页逻辑
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作金额</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">结算金额</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">汇率</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">账户信息</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedRecords.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{record.id}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{record.date}</td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {currencySymbols[record.operationCurrency] || ""}{record.operationAmount.toLocaleString()} {record.operationCurrency}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {currencySymbols[record.settlementCurrency] || ""}{record.settlementAmount.toLocaleString()} {record.settlementCurrency}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{record.rate.toFixed(4)}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${statusColors[record.status]}`}>
                    {record.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{record.accountInfo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* 分页控件 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                显示 <span className="font-medium">{(currentPage - 1) * recordsPerPage + 1}</span> 到 <span className="font-medium">{Math.min(currentPage * recordsPerPage, filteredRecords.length)}</span> 共 <span className="font-medium">{filteredRecords.length}</span> 条结果
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <Button
                  variant="outline"
                  size="sm"
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <span className="sr-only">上一页</span>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                      page === currentPage 
                        ? "bg-primary text-white" 
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <span className="sr-only">下一页</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 主结算页面组件
export default function SettlementPage() {
  const [activeTab, setActiveTab] = useState("结算记录");
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);
  const [settlementRecords, setSettlementRecords] = useState<SettlementRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // 初始化结算数据
  useEffect(() => {
    // 模拟数据加载延迟
    const loadSettlementData = async () => {
      try {
        setIsLoading(true);
        // 在实际应用中，这里应该是从API获取数据
        await new Promise(resolve => setTimeout(resolve, 500));
        const records = generateMockSettlementRecords(30);
        setSettlementRecords(records);
      } catch (error) {
        toast({
          title: "加载失败",
          description: "无法加载结算数据",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettlementData();
  }, [toast]);
  
  // 计算每种货币的结算金额汇总
  const currencySummary = settlementRecords.reduce((acc, record) => {
    const { settlementCurrency, settlementAmount, status } = record;
    
    if (!acc[settlementCurrency]) {
      acc[settlementCurrency] = {
        total: 0,
        pending: 0,
        settled: 0,
      };
    }
    
    acc[settlementCurrency].total += settlementAmount;
    
    if (status === "处理中") {
      acc[settlementCurrency].pending += settlementAmount;
    } else if (status === "已完成") {
      acc[settlementCurrency].settled += settlementAmount;
    }
    
    return acc;
  }, {} as Record<string, { total: number; pending: number; settled: number }>);
  
  // 货币过滤处理
  const handleCurrencySelect = (currency: string) => {
    setSelectedCurrency(currency === selectedCurrency ? null : currency);
  };
  
  // 申请结算触发函数
  const handleApplySettlement = () => {
    toast({
      title: "操作成功",
      description: "结算申请已提交",
    });
  };
  
  // 生成侧边栏信息
  const [activeItem, setActiveItem] = useState("settlements");
  
  // 定义侧边栏项目
  const sidebarItems = [
    {
      icon: BarChart,
      label: "仪表盘",
      href: "/otc-dashboard",
      active: activeItem === "dashboard"
    },
    {
      icon: FileText,
      label: "订单管理",
      href: "/otc-dashboard/orders",
      active: activeItem === "orders"
    },
    {
      icon: Users,
      label: "账户管理",
      href: "/otc-dashboard/accounts",
      active: activeItem === "accounts"
    },
    {
      icon: Wallet,
      label: "结算管理",
      href: "/settlement",
      active: activeItem === "settlements"
    },
    {
      icon: Settings,
      label: "系统设置",
      active: activeItem === "settings"
    }
  ];
  
  return (
    <OtcLayout 
      sidebarItems={sidebarItems} 
      activeItem={activeItem}
      setActiveItem={setActiveItem}
      user={user}
      dashboardTitle="BeingFi OTC"
      role={user?.username?.includes("agent") ? "agent" : 
            user?.username?.includes("staff") ? "staff" : "admin"}
    >
      <div className="bg-white min-h-screen">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">结算管理</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="bg-white border text-black hover:bg-gray-50 hover:text-black"
                onClick={() => navigate('/otc-dashboard')}
              >
                返回仪表盘
              </Button>
              <Button
                variant="outline"
                className="bg-white border text-black hover:bg-gray-50 hover:text-black mr-2"
                onClick={() => navigate('/platform-settlement')}
              >
                平台结算
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-500 to-teal-400 hover:from-blue-600 hover:to-teal-500 text-white"
                onClick={handleApplySettlement}
              >
                申请结算
              </Button>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-white border-b border-gray-200 w-full justify-start mb-6 px-0">
              <TabsTrigger 
                value="结算记录" 
                className="py-3 px-4 text-gray-700 hover:text-black data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:font-semibold"
              >
                结算记录
              </TabsTrigger>
              <TabsTrigger 
                value="账户管理" 
                className="py-3 px-4 text-gray-700 hover:text-black data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:font-semibold"
              >
                账户管理
              </TabsTrigger>
              <TabsTrigger 
                value="结算报表" 
                className="py-3 px-4 text-gray-700 hover:text-black data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:font-semibold"
              >
                结算报表
              </TabsTrigger>
            </TabsList>
          
            <TabsContent value="结算记录" className="mt-0">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  {/* 货币卡片筛选区 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {Object.entries(currencySummary).map(([currency, { total, pending, settled }]) => (
                      <CurrencyCard
                        key={currency}
                        currency={currency}
                        totalAmount={total}
                        pendingAmount={pending}
                        settledAmount={settled}
                        onClick={() => handleCurrencySelect(currency)}
                        isActive={selectedCurrency === currency}
                      />
                    ))}
                  </div>
                  
                  {/* 筛选区 */}
                  <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <div className="flex flex-col md:flex-row gap-4 md:items-end">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">结算状态</label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="全部状态" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">全部状态</SelectItem>
                            <SelectItem value="completed">已完成</SelectItem>
                            <SelectItem value="processing">处理中</SelectItem>
                            <SelectItem value="invalid">已失效</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">日期范围</label>
                        <div className="flex gap-2">
                          <Input type="date" className="flex-1" />
                          <span className="flex items-center">至</span>
                          <Input type="date" className="flex-1" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="bg-white text-gray-700 border hover:bg-gray-50"
                        >
                          <Filter className="h-4 w-4 mr-2" />
                          筛选
                        </Button>
                        <Button
                          variant="outline"
                          className="bg-white text-gray-700 border hover:bg-gray-50"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          导出
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* 结算记录表格 */}
                  <SettlementTable records={settlementRecords} currency={selectedCurrency} />
                </>
              )}
            </TabsContent>
            
            <TabsContent value="账户管理" className="mt-6">
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <h3 className="text-lg font-medium mb-4">账户管理功能正在开发中</h3>
                <p className="text-gray-600">该功能将在下一个版本中推出</p>
              </div>
            </TabsContent>
            
            <TabsContent value="结算报表" className="mt-6">
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <h3 className="text-lg font-medium mb-4">结算报表功能正在开发中</h3>
                <p className="text-gray-600">该功能将在下一个版本中推出</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </OtcLayout>
  );
}