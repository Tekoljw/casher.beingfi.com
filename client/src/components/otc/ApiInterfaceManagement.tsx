import React, { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useCurrencyList } from '@/hooks/use-currency-list';
import { useAgents } from '@/hooks/use-agents';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Wallet, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Channel {
  channel_name: string;
  channel_id: string;
  channel_type: string; // 通道类型（1-代付，2-代收）
}

interface PaymentInterface {
  id: string;
  userid: string;
  currency: string; // 币种，多个以逗号分隔
  type: string;
  name: string; // 接口名称
  key: string; // 接口标识
  channel: Channel[]; // 通道数组
  payinfo: string; // 支付参数配置
  status: string; // 状态：0-关闭，1-开启
  addtime: string;
}

interface PageInfo {
  total: number;
  all_page: number;
  current_page: number;
  page_size: number;
}

interface PaymentInterfaceData {
  code: number;
  msg: string;
  data: {
    page: PageInfo;
    list: PaymentInterface[];
  };
}

// 获取支付接口列表的hook
function usePaymentInterfaces(agentId?: string, currency?: string) {
  return useQuery<PaymentInterfaceData>({
    queryKey: ['paymentInterfaces', agentId, currency],
    queryFn: async () => {
      const res = await apiRequest<PaymentInterfaceData>('POST', '/Api/Index/getApiProviderList', {
        userid: agentId,
        currency: currency
      });
      return res;
    },
    enabled: true,
    staleTime: 30000,
  });
}

interface ApiInterfaceManagementProps {
  isAdmin?: boolean; // 是否为管理员后台
}

export function ApiInterfaceManagement({ isAdmin = true }: ApiInterfaceManagementProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // 获取币种列表
  const { data: currencyList = [] } = useCurrencyList();
  
  // 获取供应商列表（仅管理员）
  const { data: agentsData } = useAgents({
    enabled: isAdmin,
  });
  const allAgents = agentsData?.pages.flatMap(page => page.data.list) || [];
  
  // 默认选择第一个供应商（仅管理员）
  const defaultAgentId = isAdmin && allAgents.length > 0 ? allAgents[0].id : "";
  const [agentFilter, setAgentFilter] = useState<string>(defaultAgentId);
  const [currencyFilter, setCurrencyFilter] = useState<string>("");
  
  // 详情面板状态
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedInterface, setSelectedInterface] = useState<PaymentInterface | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  const [configFormat, setConfigFormat] = useState<"general" | "custom">("general");
  const [configData, setConfigData] = useState({
    mchNo: "",
    signKey: "",
    hostApi: "",
    customCode: ""
  });
  
  // 根据通用格式的输入生成自定义格式的JSON
  const generateCustomCode = (data: typeof configData) => {
    const jsonData: any = {};
    if (data.mchNo) jsonData.mchNo = data.mchNo;
    if (data.signKey) jsonData.signKey = data.signKey;
    if (data.hostApi) jsonData.hostApi = data.hostApi;
    
    if (Object.keys(jsonData).length > 0) {
      return JSON.stringify(jsonData);
    }
    return "";
  };
  
  // 当供应商列表加载后，如果当前没有选择供应商，则选择第一个（仅管理员）
  useEffect(() => {
    if (isAdmin && allAgents.length > 0 && !agentFilter) {
      setAgentFilter(allAgents[0].id);
    }
  }, [isAdmin, allAgents, agentFilter]);
  
  // 当选中接口时，设置默认币种
  useEffect(() => {
    if (selectedInterface && selectedInterface.currency) {
      const currencies = selectedInterface.currency.split(',').filter(c => c.trim());
      if (currencies.length > 0 && !selectedCurrency) {
        setSelectedCurrency(currencies[0].trim());
      }
    }
  }, [selectedInterface, selectedCurrency]);
  
  // 获取支付接口数据（管理员需要供应商ID，供应商后台不需要）
  const { data: interfacesData, isLoading } = usePaymentInterfaces(
    isAdmin ? (agentFilter || undefined) : undefined,
    currencyFilter || undefined
  );
  
  // 处理数据格式
  const interfaces: PaymentInterface[] = interfacesData?.data?.list || [];
  
  // 映射数据字段，统一格式
  const mappedInterfaces = interfaces.map((item) => {
    // 计算币种数量（多个币种以逗号分隔）
    const currencies = item.currency ? item.currency.split(',').filter(c => c.trim()) : [];
    const currencyCount = currencies.length;
    
    // 计算通道数量
    const channelCount = item.channel ? item.channel.length : 0;
    
    // 生成描述信息（接口名称 • 币种）
    const currencyDisplay = currencies.length > 0 ? currencies.join(', ') : '';
    const description = currencyDisplay ? `${item.name} • ${currencyDisplay}` : item.name;
    
    return {
      id: item.id,
      name: item.name,
      code: item.key,
      description: description,
      currency: item.currency,
      isEnabled: item.status === '1',
      channelCount: channelCount,
      currencyCount: currencyCount,
      originalData: item, // 保存原始数据用于详情面板
    };
  });
  
  // 打开详情面板
  const handleOpenDetail = (item: any, type: "channel" | "currency") => {
    const originalData = item.originalData || interfaces.find(i => i.id === item.id);
    if (originalData) {
      setSelectedInterface(originalData);
      setIsDetailOpen(true);
      // 如果是点击支付币种，设置选中的币种
      if (type === "currency" && originalData.currency) {
        const currencies = originalData.currency.split(',').filter((c: string) => c.trim());
        if (currencies.length > 0) {
          setSelectedCurrency(currencies[0].trim());
        }
      }
      // 解析payinfo配置数据
      if (originalData.payinfo) {
        try {
          const payinfo = JSON.parse(originalData.payinfo);
          setConfigData({
            mchNo: payinfo.mchNo || payinfo.mch_no || payinfo.id || "",
            signKey: payinfo.signKey || payinfo.sign_key || payinfo.key || "",
            hostApi: payinfo.hostApi || payinfo.host_api || payinfo.host || "",
            customCode: originalData.payinfo // 保存原始JSON字符串用于自定义格式显示
          });
        } catch (e) {
          // 如果解析失败，可能是自定义格式，直接使用原始字符串
          setConfigData({
            mchNo: "",
            signKey: "",
            hostApi: "",
            customCode: originalData.payinfo
          });
        }
      } else {
        // 如果没有payinfo，重置为默认值
        setConfigData({
          mchNo: "",
          signKey: "",
          hostApi: "",
          customCode: ""
        });
      }
    }
  };
  
  // 保存配置
  const handleSaveConfig = async () => {
    if (!selectedInterface) return;
    
    try {
      let payinfo = "";
      
      if (configFormat === "general") {
        // 通用格式：根据输入生成JSON
        const data: any = {};
        if (configData.mchNo) data.mchNo = configData.mchNo;
        if (configData.signKey) data.signKey = configData.signKey;
        if (configData.hostApi) data.hostApi = configData.hostApi;
        payinfo = JSON.stringify(data);
      } else {
        // 自定义格式：直接使用输入的代码
        payinfo = configData.customCode;
      }
      
      const response = await apiRequest('POST', '/Api/Index/setApiProviderData', {
        id: selectedInterface.id,
        payinfo: payinfo
      });
      
      if (response.code === 0) {
        toast({
          title: '操作成功',
          description: '配置已保存'
        });
        // 刷新数据
        queryClient.invalidateQueries({ queryKey: ['paymentInterfaces'] });
      } else {
        toast({
          title: '操作失败',
          description: response.msg || '保存失败',
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: '操作失败',
        description: error.message || '保存失败',
        variant: "destructive"
      });
    }
  };
  
  // 切换启用状态
  const handleToggleEnabled = async (interfaceId: string, currentStatus: boolean) => {
    try {
      const response = await apiRequest('POST', '/Api/Index/setApiProviderStatus', {
        id: interfaceId,
        status: currentStatus ? 0 : 1 // 0-关闭，1-开启
      });
      
      if (response.code === 0) {
        toast({
          title: '操作成功',
          description: currentStatus ? '已关闭' : '已开启'
        });
        // 刷新数据
        queryClient.invalidateQueries({ queryKey: ['paymentInterfaces'] });
      } else {
        toast({
          title: '操作失败',
          description: response.msg || '操作失败',
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: '操作失败',
        description: error.message || '操作失败',
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      {/* 标题 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isAdmin ? t('otc.nav.apiInterfaces', 'API接口管理') : '我的接口'}
        </h2>
        <p className="text-gray-600">
          {t('otc.apiInterfaces.description', '管理全球法币支付渠道配置和状态')}
        </p>
      </div>
      
      {/* 供应商筛选（仅管理员） */}
      {isAdmin && allAgents.length > 0 && (
        <div className="mb-4">
          <Tabs
            value={agentFilter || ""}
            onValueChange={setAgentFilter}
            className="w-full mb-3 md:mb-4"
          >
            <div className="tab-container w-full overflow-x-auto">
              <TabsList className="bg-[#f5f7fa] rounded-lg inline-flex md:flex md:flex-wrap gap-1 py-1 px-1 min-w-max md:min-w-0 md:w-full">
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
        </div>
      )}
      
      {/* 币种筛选 */}
      <div className="mb-6">
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
                {t('otc.orders.all', '全部币种')}
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
      </div>
      
      {/* 支付渠道卡片 */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : mappedInterfaces.length === 0 ? (
        <div className="text-center py-8 text-gray-500">暂无数据</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mappedInterfaces.map((item) => (
            <Card key={item.id} className="border border-gray-200 bg-white hover:shadow-md transition-shadow rounded-lg">
              <CardContent className="p-4">
                {/* 头部区域 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-1">{item.code}</p>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      item.isEnabled 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {item.isEnabled ? '启用' : '关闭'}
                    </span>
                    <Switch
                      checked={item.isEnabled}
                      onCheckedChange={() => handleToggleEnabled(item.id, item.isEnabled)}
                    />
                  </div>
                </div>
                {/* 底部指标区域 */}
                <div className="flex items-center justify-between pt-3 pb-3 border-t border-gray-100 bg-gradient-to-r from-blue-50/50 to-purple-50/50 -mx-4 px-4 rounded-b-lg">
                  <div 
                    className="text-center flex-1 cursor-pointer py-2 rounded transition-colors hover:bg-blue-100/50"
                    onClick={() => handleOpenDetail(item, "channel")}
                  >
                    <div className="text-lg font-semibold text-blue-600">{item.channelCount}</div>
                    <div className="text-xs text-gray-600 mt-1">{t('otc.apiInterfaces.paymentChannels', '支付通道')}</div>
                  </div>
                  <div 
                    className="text-center flex-1 cursor-pointer py-2 rounded transition-colors hover:bg-purple-100/50"
                    onClick={() => handleOpenDetail(item, "currency")}
                  >
                    <div className="text-lg font-semibold text-purple-600">{item.currencyCount}</div>
                    <div className="text-xs text-gray-600 mt-1">{t('otc.apiInterfaces.paymentCurrencies', '支付币种')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* 右侧详情面板 */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto bg-white">
          {selectedInterface && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="text-2xl font-bold text-gray-900">
                  {selectedInterface.name} - 接口详情
                </SheetTitle>
              </SheetHeader>
              
              <div className="space-y-6">
                {/* 支持的币种 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Wallet className="w-4 h-4 text-blue-600" />
                    <Label className="text-sm font-medium text-gray-900">支持的币种</Label>
                  </div>
                  {selectedInterface.currency && selectedInterface.currency.trim() ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedInterface.currency.split(',').map((curr: string) => {
                        const trimmed = curr.trim();
                        if (!trimmed) return null;
                        return (
                          <div
                            key={trimmed}
                            className="px-4 py-2 rounded-full bg-purple-50 border border-purple-200 text-purple-700 font-medium text-sm"
                          >
                            {trimmed}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 py-2">暂无币种支持</div>
                  )}
                </div>
                
                {/* 支持的支付通道 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Wallet className="w-4 h-4 text-blue-600" />
                    <Label className="text-sm font-medium text-gray-700">支持的支付通道</Label>
                  </div>
                  {selectedInterface.channel && selectedInterface.channel.length > 0 ? (
                    <div className="space-y-2">
                      {selectedInterface.channel.map((ch: Channel, index: number) => {
                        const isCollect = ch.channel_type === "2" || ch.channel_type === 2;
                        // 获取通道英文名称（从channel_id或channel_name中提取）
                        const channelNameEn = ch.channel_id || ch.channel_name;
                        return (
                          <div 
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer transition-colors hover:bg-gray-100 hover:border-gray-200"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900 text-sm">{ch.channel_name}</span>
                                <span className="text-xs text-gray-500 mt-0.5">{channelNameEn}</span>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <Badge 
                                variant="outline" 
                                className={`text-xs font-normal ${
                                  isCollect 
                                    ? 'bg-blue-50 text-blue-600 border-blue-300' 
                                    : 'bg-orange-50 text-orange-600 border-orange-300'
                                }`}
                              >
                                {isCollect ? '代收' : '代付'}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 py-2">暂无支付通道支持</div>
                  )}
                </div>
                
                {/* 配置参数 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Code className="w-4 h-4 text-blue-600" />
                    <Label className="text-sm font-medium text-gray-900">配置参数</Label>
                  </div>
                  <Tabs value={configFormat} onValueChange={(v) => setConfigFormat(v as "general" | "custom")}>
                    <TabsList className="mb-4 bg-[#f5f7fa] h-auto p-1">
                      <TabsTrigger 
                        value="general"
                        className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] data-[state=active]:font-medium text-gray-600 rounded-lg text-sm py-2 px-4 h-auto"
                      >
                        通用格式
                      </TabsTrigger>
                      <TabsTrigger 
                        value="custom"
                        className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:font-medium text-gray-600 rounded-lg text-sm py-2 px-4 h-auto"
                      >
                        自定义格式
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="general" className="space-y-4 mt-0">
                      <div className="space-y-2">
                        <Label htmlFor="merchantId" className="text-sm text-gray-700">上游商户ID</Label>
                        <Input
                          id="merchantId"
                          placeholder="请输入商户ID"
                          value={configData.mchNo}
                          onChange={(e) => {
                            const newData = { ...configData, mchNo: e.target.value };
                            // 自动更新自定义格式
                            const customCode = generateCustomCode(newData);
                            setConfigData({ ...newData, customCode });
                          }}
                          className="h-10 bg-white text-gray-900 placeholder:text-gray-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apiKey" className="text-sm text-gray-700">API密钥</Label>
                        <Input
                          id="apiKey"
                          placeholder="请输入API密钥"
                          value={configData.signKey}
                          onChange={(e) => {
                            const newData = { ...configData, signKey: e.target.value };
                            // 自动更新自定义格式
                            const customCode = generateCustomCode(newData);
                            setConfigData({ ...newData, customCode });
                          }}
                          className="h-10 bg-white text-gray-900 placeholder:text-gray-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hostApi" className="text-sm text-gray-700">HostAPI</Label>
                        <Input
                          id="hostApi"
                          placeholder="https://api.example.com"
                          value={configData.hostApi}
                          onChange={(e) => {
                            const newData = { ...configData, hostApi: e.target.value };
                            // 自动更新自定义格式
                            const customCode = generateCustomCode(newData);
                            setConfigData({ ...newData, customCode });
                          }}
                          className="h-10 bg-white text-gray-900 placeholder:text-gray-400"
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="custom" className="mt-0">
                      <div className="space-y-2">
                        <Label htmlFor="customCode" className="text-sm text-gray-700">自定义代码</Label>
                        <Textarea
                          id="customCode"
                          placeholder="请输入自定义配置代码..."
                          value={configData.customCode || generateCustomCode(configData)}
                          onChange={(e) => setConfigData({ ...configData, customCode: e.target.value })}
                          className="min-h-[200px] resize-y bg-white text-gray-900 placeholder:text-gray-400"
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
                
                {/* 操作按钮 */}
                <div className="flex gap-3 pt-6 border-t border-gray-200">
                  <Button 
                    onClick={handleSaveConfig}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-11 text-base font-medium"
                  >
                    保存配置
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setIsDetailOpen(false)}
                    className="flex-1 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 h-11 text-base font-medium"
                  >
                    关闭
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

