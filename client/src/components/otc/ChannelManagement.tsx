import React, { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useCurrencyList } from '@/hooks/use-currency-list';
import { useChannelData } from '@/hooks/use-channel-data';
import { useChannelPayTypeData, Channel } from '@/hooks/use-channelPayType-data';
import { apiRequest } from "@/lib/queryClient";
import { cn } from '@/lib/utils';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ChannelManagement() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("");
  const [activeAccountType, setActiveAccountType] = useState("");
  const [isAddCurrencyDialogOpen, setIsAddCurrencyDialogOpen] = useState(false);
  const [isAddAccountTypeDialogOpen, setIsAddAccountTypeDialogOpen] = useState(false);
  const [isEditChannelDialogOpen, setIsEditChannelDialogOpen] = useState(false);
  const [channelsList, setChannelsList] = useState<{ name: string, id: string }[]>([]);
  const [activeChannelType, setActiveChannelType] = useState("");
  const [channelTypeFilter, setChannelTypeFilter] = useState<string>(""); // 通道类型筛选：""-全部，"1"-代付，"2"-代收
  const [addCurrencyName, setAddCurrencyName] = useState("");
  const [addCurrencyDesc, setAddCurrencyDesc] = useState("");


  // 获取币种对象数组（用于币种tab）
  const { data: currencyList = [], isLoading: isCurrencyLoading, refetch: refetchCurrency } = useCurrencyList();

  // 获取仪表盘数据，activeCurrency变化时自动请求
  const { data: channelData, isLoading: isChannelLoading } = useChannelData(activeTab);

  // 获取仪表盘数据，activeCurrency变化时自动请求
  const {
      data: channelPayTypeData,
      isLoading: isPayTypeLoading,
      refetch: refetchChanelPayType,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage
    } = useChannelPayTypeData({ 
      paytype: activeChannelType, 
      currency: activeTab,
      channel_type: channelTypeFilter || undefined // 全部时不传参数
    });

  // 页面加载后设置默认币种
  useEffect(() => {
    if (currencyList.length > 0 && !activeTab) {
      setActiveTab(currencyList[0].currency);
    }
  }, [currencyList, activeTab]);


  useEffect(() => {
    if (!isChannelLoading && activeTab) {
      if (channelData?.data?.length > 0) {
        const tempList: Array<{ name: string, id: string }> = [];
        channelData?.data?.map((item: any) => {
          tempList.push({ name: item.name, id: item.id });
        });
        setChannelsList(tempList);
      }else {
        setChannelsList([]);
        setActiveChannelType('');
      }
    }
  }, [isChannelLoading, activeTab]);



  // 页面加载后通道类型后设置默认通道
  useEffect(() => {
    if (channelsList.length > 0 && !activeAccountType) {
      setActiveAccountType(channelsList[0].name);
    }
  }, [channelsList, activeAccountType]);


  useEffect(() => {
    if (activeAccountType) {
      const channelId = channelsList.find(item => item.name === activeAccountType)?.id;
      if (channelId) {
        setActiveChannelType(channelId);
      }
    }
  }, [activeAccountType]);




  const [newAccountTypeData, setNewAccountTypeData] = useState<Channel>({
    channel_title: "",
    note: "",
    currency: "CNY",
    sale_sell_rate: "",
    status: "1",
    all_money: "",
    max_money: "",
    min_money: "",
    auto_buy_rate: "",
    paytype: "",
    channelid: "",
    min_success_rate: "",
    channel_type: "",
    is_random_money: "0", // 默认关闭
    is_add_random_money: "1", // 默认递增
    min_unit: "",
    min_random_money: "",
    max_random_money: "",
    exclude_random_money: "0.10", // 默认选中0.10
    random_time_range: "1", // 默认时间范围为1分钟
    unique_key: "",
    payment_format: "",
    is_web: "2", // 默认APP操作
    website_url: "",
    proxy_country: "",
    receive_params: "",
    payment_params: "",
  });
  const [editChannelData, setEditChannelData] = useState<Channel>({
    channelid: "",
    id: "",
    channel_title: "",
    note: "",
    currency: "CNY",
    sale_sell_rate: "",
    auto_buy_rate: "",
    status: "1",
    all_money: "",
    max_money: "",
    min_money: "",
    paytype: "",
    min_success_rate: "",
    channel_type: "",
    is_random_money: "0", // 默认关闭
    is_add_random_money: "1", // 默认递增
    min_unit: "",
    min_random_money: "",
    max_random_money: "",
    exclude_random_money: "0.10", // 默认选中0.10
    random_time_range: "1", // 默认时间范围为1分钟
    unique_key: "",
    payment_format: "",
    is_web: "2", // 默认APP操作
    website_url: "",
    proxy_country: "",
    receive_params: "",
    payment_params: "",
  });
  const [selectedChannelId, setSelectedChannelId] = useState("");

  // payment_format选项
  const paymentFormatOptions = [
    { value: "name", label: "收款人" },
    { value: "account", label: "收款账户" },
    { value: "qrcode", label: "二维码" },
    { value: "bankname", label: "银行名称" },
    { value: "branchname", label: "支行名称" },
    { value: "mobile", label: "手机号" },
  ];

  // 将payment_format字符串转换为选中数组
  const parsePaymentFormat = (formatStr?: string): string[] => {
    if (!formatStr) return [];
    return formatStr.split(",").map(item => item.trim()).filter(item => item);
  };

  // 将选中数组转换为payment_format字符串
  const formatPaymentFormat = (selected: string[]): string => {
    return selected.join(",");
  };

  // 将payment_format字符串转换为中文标签数组
  const formatPaymentFormatLabels = (formatStr?: string): string[] => {
    if (!formatStr) return [];
    const formatMap: Record<string, string> = {
      name: "收款人",
      account: "收款账户",
      qrcode: "二维码",
      bankname: "银行名称",
      branchname: "支行名称",
      mobile: "手机号",
    };
    return formatStr
      .split(",")
      .map(item => item.trim())
      .filter(item => item)
      .map(item => formatMap[item] || item);
  };

  // 处理添加币种
  const handleAddCurrency = () => {
    setIsAddCurrencyDialogOpen(true);
  };

  // 处理添加账户类型
  const handleAddAccountType = () => {
    setNewAccountTypeData({
      channel_title: "",
      channelid: "",
      note: "",
      currency: activeTab,
      sale_sell_rate: "",
      status: "1",
      all_money: "",
      max_money: "",
      min_money: "",
      auto_buy_rate: "",
      min_success_rate: "",
      paytype: activeChannelType,
      channel_type: "",
      is_random_money: "0",
      is_add_random_money: "1",
      min_unit: "",
      min_random_money: "",
      max_random_money: "",
      exclude_random_money: "0.10",
      random_time_range: "1", // 默认时间范围为1分钟
      unique_key: "",
      payment_format: "",
    });
    setIsAddAccountTypeDialogOpen(true);
  };

  // 处理编辑通道 - 修改为编辑功能
  const handleEditChannel = (channel: any) => {
    // const channel = channels.find(c => c.id === channelId);
    if (channel) {
      setSelectedChannelId(channel.channelid);
      setEditChannelData({
        id: channel.id,
        channelid: channel.channelid,
        channel_title: channel.channel_title,
        note: channel.note,
        currency: channel.currency,
        sale_sell_rate: channel.sale_sell_rate,
        status: channel.status,
        all_money: channel.all_money,
        max_money: channel.max_money,
        min_money: channel.min_money,
        auto_buy_rate: channel.auto_buy_rate,
        paytype: channel.paytype,
        min_success_rate: channel.min_success_rate || "",
        channel_type: channel.channel_type || "",
        is_random_money: channel.is_random_money?.toString() || "0",
        is_add_random_money: channel.is_add_random_money?.toString() || "1",
        min_unit: channel.min_unit || "",
        min_random_money: channel.min_random_money || "",
        max_random_money: channel.max_random_money || "",
        exclude_random_money: channel.exclude_random_money || "0.10",
        random_time_range: channel.random_time_range || "1", // 读取时间范围，默认为1分钟
        unique_key: channel.unique_key || "",
        payment_format: channel.payment_format || "",
        is_web: `${channel.is_web ?? "2"}`,
        website_url: channel.website_url || "",
        proxy_country: channel.proxy_country || "",
        receive_params: channel.receive_params || "",
        payment_params: channel.payment_params || "",
      });
      setIsEditChannelDialogOpen(true);
    }
  };

  // 处理新账户类型表单变更
  const handleAccountTypeDataChange = (field: keyof Channel, value: string) => {
    setNewAccountTypeData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'is_web' && value !== "1") {
        next.website_url = "";
        next.proxy_country = "";
        next.receive_params = "";
        next.payment_params = "";
      }
      if (field === 'channel_type') {
        // 付款通道：仅保留付款流程解析；收款通道：仅保留收款解析
        if (value === "1") next.receive_params = "";
        if (value === "2") next.payment_params = "";
      }
      return next;
    });
    if(field === 'currency'){
      setActiveTab(value);
    }
  };

  // 处理编辑通道表单变更
  const handleEditChannelDataChange = (field: keyof Channel, value: string) => {
    setEditChannelData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'is_web' && value !== "1") {
        next.website_url = "";
        next.proxy_country = "";
        next.receive_params = "";
        next.payment_params = "";
      }
      if (field === 'channel_type') {
        // 付款通道：仅保留付款流程解析；收款通道：仅保留收款解析
        if (value === "1") next.receive_params = "";
        if (value === "2") next.payment_params = "";
      }
      return next;
    });
     if(field === 'currency'){
      setActiveTab(value);
    }
  };

  // 提交添加币种
  const submitAddCurrency = async () => {


    if (/\d/.test(addCurrencyName)) {
      toast({
        title: t('error.title'),
        description: t('error.currencyNameNoNumbers'),
        variant: "destructive"
      });
      return;
    }

    if (!addCurrencyName.trim()) {
      toast({
        title: t('error.title'),
        description: t('error.currencyRequired'),
        variant: "destructive"
      });
      return;
    }

    if (currencyList.length > 0) {
      if (currencyList.some(item => item.currency === addCurrencyName)) {
        toast({
          title: t('error.title'),
          description: t('error.currencyExists'),
          variant: "destructive"
        });
        return;
      }
    }

    if (!/^[A-Z]+$/.test(addCurrencyName)) {
      toast({
        title: t('error.title'),
        description: t('error.currencyMustUppercase'),
        variant: "destructive"
      });
      return;
    }

    // 调用 API
    const response = await apiRequest("POST", "/Api/Index/addCurrency", { currency: addCurrencyName, desc: addCurrencyDesc });

    if (response.code === 0) {
      setIsAddCurrencyDialogOpen(false);
      await refetchCurrency();
      setAddCurrencyName("");
      setAddCurrencyDesc("");
      toast({
        title: t('success.title'),
        description: t('success.addCurrency')
      });
    }
  };

  // 提交添加账户类型
  const submitAddAccountType = async() => {
    try {
      if (!newAccountTypeData?.channel_type) {
        toast({
          title: t('error.title'),
          description: t('error.channelTypeRequired'),
          variant: "destructive"
        });
        return;
      }
      if (!newAccountTypeData?.channelid?.trim()) {
      toast({
        title: t('error.title'),
        description: t('error.channelIdRequired'),
        variant: "destructive"
      });
      return;
    }
    if (!newAccountTypeData?.channel_title?.trim()) {
      toast({
        title: t('error.title'),
        description: t('error.channelNameRequired'),
        variant: "destructive"
      });
      return;
    }

    if (!newAccountTypeData?.paytype) {
      toast({
        title: t('error.title'),
        description: t('error.accountTypeRequired'),
        variant: "destructive"
      });
      return;
    }

     if (!newAccountTypeData?.currency) {
      toast({
        title: t('error.title'),
        description: t('error.currencyRequired'),
        variant: "destructive"
      });
      return;
    }

    if (!newAccountTypeData?.sale_sell_rate) {
      toast({
        title: t('error.title'),
        description: t('error.saleSellRateRequired'),
        variant: "destructive"
      });
      return;
    }

    if (!newAccountTypeData?.all_money) {
      toast({
        title: t('error.title'),
        description: t('error.todayTotalAmountRequired'),
        variant: "destructive"
      });
      return;
    }

    if (!newAccountTypeData?.max_money) {
      toast({
        title: t('error.title'),
        description: t('error.riskControlMaxAmountRequired'),
        variant: "destructive"
      });
      return;
    }

    if (!newAccountTypeData?.min_money) {
      toast({
        title: t('error.title'),
        description: t('error.riskControlMinAmountRequired'),
        variant: "destructive"
      });
      return;
    }

    if (!newAccountTypeData?.auto_buy_rate) {
      toast({
        title: t('error.title'),
        description: t('error.autoBuyRateRequired'),
        variant: "destructive"
      });
      return;
    }

    // 处理随机金额字段：如果为空则设置为"0"
    const submitData = {
      ...newAccountTypeData,
      min_unit: newAccountTypeData.min_unit?.trim() || "0",
      min_random_money: newAccountTypeData.min_random_money?.trim() || "0",
      max_random_money: newAccountTypeData.max_random_money?.trim() || "0",
      // 如果开启随机金额，确保时间范围有默认值
      random_time_range: newAccountTypeData.is_random_money === "1" 
        ? (newAccountTypeData.random_time_range?.trim() || "1")
        : (newAccountTypeData.random_time_range || ""),
    };

    // 调用 API
    const response = await apiRequest("POST", "/Api/Index/editPayType", submitData);

    if (response.code === 0) {
      // 重置表单并关闭对话框
      await refetchChanelPayType();
      setNewAccountTypeData({
        channel_title: "",
        channelid: "",
        note: "",
        currency: activeTab,
        paytype: activeAccountType,
        sale_sell_rate: "",
        status: "1",
        all_money: "",
        max_money: "",
        min_money: "",
        auto_buy_rate: "",
        channel_type: "",
        is_random_money: "0",
        is_add_random_money: "1",
        min_unit: "",
        min_random_money: "",
        max_random_money: "",
        exclude_random_money: "0.10",
        random_time_range: "1",
        is_web: "2",
        website_url: "",
        proxy_country: "",
        receive_params: "",
        payment_params: "",
      });
      setIsAddAccountTypeDialogOpen(false);
      toast({
        title: t('success.title'),
        description: t('success.addChannel').replace('{name}', newAccountTypeData.channel_title || '')
      });
    } else {
        // 显示错误提示
        toast({
          title: t('error.addFailed'),
          description: response.msg,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      // 显示错误提示
      toast({
        title: t('error.addFailed'),
        description: error?.message,
        variant: "destructive"
      });
    }


  };

  // 提交编辑通道
  const submitEditChannel = async() => {

    try {
      if (!editChannelData?.channel_type) {
        toast({
          title: t('error.title'),
          description: t('error.channelTypeRequired'),
          variant: "destructive"
        });
        return;
      }
     if (!editChannelData?.channel_title?.trim()) {
      toast({
        title: t('error.title'),
        description: t('error.channelNameRequired'),
        variant: "destructive"
      });
      return;
    }

    if (!editChannelData?.channelid?.trim()) {
      toast({
        title: t('error.title'),
        description: t('error.channelIdRequired'),
        variant: "destructive"
      });
      return;
    }

    if (!editChannelData?.paytype) {
      toast({
        title: t('error.title'),
        description: t('error.accountTypeRequired'),
        variant: "destructive"
      });
      return;
    }

     if (!editChannelData?.currency) {
      toast({
        title: t('error.title'),
        description: t('error.currencyRequired'),
        variant: "destructive"
      });
      return;
    }

    if (!editChannelData?.sale_sell_rate) {
      toast({
        title: t('error.title'),
        description: t('error.saleSellRateRequired'),
        variant: "destructive"
      });
      return;
    }

    if (!editChannelData?.all_money) {
      toast({
        title: t('error.title'),
        description: t('error.todayTotalAmountRequired'),
        variant: "destructive"
      });
      return;
    }

    if (!editChannelData?.max_money) {
      toast({
        title: t('error.title'),
        description: t('error.riskControlMaxAmountRequired'),
        variant: "destructive"
      });
      return;
    }

    if (!editChannelData?.min_money) {
      toast({
        title: t('error.title'),
        description: t('error.riskControlMinAmountRequired'),
        variant: "destructive"
      });
      return;
    }

    if (!editChannelData?.auto_buy_rate) {
      toast({
        title: t('error.title'),
        description: t('error.autoBuyRateRequired'),
        variant: "destructive"
      });
      return;
    }

    // 处理随机金额字段：如果为空则设置为"0"
    const submitData = {
      ...editChannelData,
      min_unit: editChannelData.min_unit?.trim() || "0",
      min_random_money: editChannelData.min_random_money?.trim() || "0",
      max_random_money: editChannelData.max_random_money?.trim() || "0",
      // 如果开启随机金额，确保时间范围有默认值
      random_time_range: editChannelData.is_random_money === "1"
        ? (editChannelData.random_time_range?.trim() || "1")
        : (editChannelData.random_time_range || ""),
    };

    // 调用 API
    const response = await apiRequest("POST", "/Api/Index/editPayType", submitData);

    if (response.code === 0) {
      // 重置表单并关闭对话框
      await refetchChanelPayType();
      setNewAccountTypeData({
        channel_title: "",
        channelid: "",
        note: "",
        currency: activeTab,
        paytype: activeAccountType,
        sale_sell_rate: "",
        status: "1",
        all_money: "",
        max_money: "",
        min_money: "",
        auto_buy_rate: "",
        channel_type: "",
        unique_key: "",
        payment_format: "",
        is_web: "2",
        website_url: "",
        proxy_country: "",
        receive_params: "",
        payment_params: "",
      });
      setIsEditChannelDialogOpen(false);
      toast({
        title: t('success.updateTitle'),
        description: t('success.updateChannel').replace('{name}', editChannelData.channel_title || '')
      });
      } else {
        // 显示错误提示
        toast({
          title: t('error.updateFailed'),
          description: response.msg,
          variant: "destructive"
        });
      }
    } catch( error: any ){
      // 显示错误提示
        toast({
          title: t('error.updateFailed'),
          description: error.message,
          variant: "destructive"
        });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-0">{t('otc.nav.channels', '通道管理')}</h2>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <Button
              variant="outline"
              className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50 flex items-center justify-center"
              onClick={handleAddCurrency}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              {t('channels.addCurrency', '添加币种')}
            </Button>
            <Button
              variant="outline"
              className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50 flex items-center justify-center"
              onClick={handleAddAccountType}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              {t('channels.addAccountType', '添加通道')}
            </Button>
          </div>
        </div>

        {/* 币种选项卡 - 深蓝色背景、白色文字样式 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
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


        {/* 账户类型筛选 - 深蓝色背景、白色文字样式 */}
        <div className="mb-6">
          <div className="bg-blue-900 rounded-md p-1 overflow-x-auto">
            <div className="inline-flex min-w-max">
              {channelsList.map(Item => (
                <Button
                  key={Item.name}
                  variant="ghost"
                  className={
                    activeAccountType === Item.name
                      ? "bg-blue-700 text-white rounded-sm text-sm hover:bg-blue-700 flex-shrink-0"
                      : "text-white rounded-sm text-sm hover:bg-blue-800 flex-shrink-0"
                  }
                  onClick={() =>
                    setActiveAccountType(Item.name)
                  }
                >
                  {Item.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* 通道类型筛选 */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">{t('channels.channelTypeColon')}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className={
                  channelTypeFilter === ""
                    ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }
                onClick={() => setChannelTypeFilter("")}
              >
                {t('channels.all')}
              </Button>
              <Button
                variant="outline"
                className={
                  channelTypeFilter === "1"
                    ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }
                onClick={() => setChannelTypeFilter("1")}
              >
                {t('channels.payout')}
              </Button>
              <Button
                variant="outline"
                className={
                  channelTypeFilter === "2"
                    ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }
                onClick={() => setChannelTypeFilter("2")}
              >
                {t('channels.collection')}
              </Button>
            </div>
          </div>
        </div>

        { isPayTypeLoading && isFetchingNextPage? (
             <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
          ) : (
            <>
              {/* 手机端：卡片布局 */}
              <div className="md:hidden space-y-4">
                {isPayTypeLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : channelPayTypeData?.pages.flatMap(page => page.data.list).length === 0 ? (
                  <div className="text-center p-8 text-gray-500">{t('channels.noData')}</div>
                ) : (
                  channelPayTypeData?.pages.flatMap(page => page.data.list).map((channel: any) => (
                    <Card key={channel.channelid} className="p-4 bg-white border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-xs text-gray-500">{t('channels.channelId')}</div>
                          <div className="font-medium text-gray-900">{channel.channelid}</div>
                        </div>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs",
                          channel.status === "1" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        )}>
                          {channel.status === "1" ? t('channels.normal') : t('channels.closed')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="text-xs text-gray-500">{t('channels.channelName')}</div>
                          <div className="text-gray-900 font-medium">{channel.channel_title || '-'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">{t('channels.accountType')}</div>
                          <div className="text-gray-900">{channel.paytype_name || '-'}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-xs text-gray-500">{t('channels.description')}</div>
                          <div className="text-gray-900">{channel.note || '-'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">{t('channels.todayTotalAmount')}</div>
                          <div className="text-gray-900">{channel.all_money || '0.00'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">{t('channels.riskControlMinAmount')}</div>
                          <div className="text-gray-900">{channel.min_money || '0.00'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">{t('channels.riskControlMaxAmount')}</div>
                          <div className="text-gray-900">{channel.max_money || '0.00'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">{t('channels.sale_sell_rate')}(%)</div>
                          <div className="text-gray-900">{channel.sale_sell_rate || '0.000'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">{t('channels.auto_buy_rate')}(%)</div>
                          <div className="text-gray-900">{channel.auto_buy_rate || '0.000'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">唯一标识</div>
                          <div className="text-gray-900">{channel.unique_key || '-'}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-xs text-gray-500 mb-1.5">代收账户格式</div>
                          {formatPaymentFormatLabels(channel.payment_format).length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {formatPaymentFormatLabels(channel.payment_format).map((label, index) => (
                                <Badge key={index} variant="outline" className="bg-gray-100 text-gray-700 border-gray-300 text-xs whitespace-nowrap">
                                  {label}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <div className="text-gray-900">-</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center"
                          onClick={() => handleEditChannel(channel)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          {t('channels.edit')}
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
                
                {/* 加载更多按钮 - 手机端 */}
                {hasNextPage && (
                  isFetchingNextPage ? (
                    <div className="flex justify-center items-center h-10">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <Button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        variant="outline"
                        className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 w-full"
                      >
                        {t('loadMore')}
                      </Button>
                    </div>
                  )
                )}
              </div>
              
              {/* 桌面端：表格布局 */}
              <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 cursor-default select-none">
                      <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('channels.channelId')}
                      </TableHead>
                      <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('channels.channelName')}
                      </TableHead>
                      <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('channels.accountType')}
                      </TableHead>
                      <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('channels.description')}
                      </TableHead>
                      <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('channels.status')}
                      </TableHead>
                      <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('channels.todayTotalAmount')}
                      </TableHead>
                      <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('channels.riskControlMinAmount')}
                      </TableHead>
                      <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('channels.riskControlMaxAmount')}
                      </TableHead>
                      <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('channels.sale_sell_rate')}(%)
                      </TableHead>
                      <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('channels.auto_buy_rate')}(%)
                      </TableHead>
                      <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        唯一标识
                      </TableHead>
                      <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        代收账户格式
                      </TableHead>
                      <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('channels.actions')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isPayTypeLoading ? (
                      <tr>
                        <td colSpan={13} className="py-4 text-center">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                          </div>
                        </td>
                      </tr>
                    ) : 
                      channelPayTypeData?.pages.flatMap(page => page.data.list).length === 0 ? (
                        <tr>
                          <td colSpan={13} className="py-4 text-center text-gray-500">
                            {t('channels.noData')}
                          </td>
                        </tr>
                      ) : (
                        channelPayTypeData?.pages.flatMap(page => page.data.list).map((channel: any)=> (
                          <TableRow key={channel.channelid} className="bg-white">
                            <TableCell className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                              {channel.channelid}
                            </TableCell>
                            <TableCell className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                              {channel.channel_title}
                            </TableCell>
                            <TableCell className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                              {channel.paytype_name}
                            </TableCell>
                            <TableCell className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                              {channel.note}
                            </TableCell>
                            <TableCell className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                              <span className={cn(
                                "px-2 py-1 rounded-full text-xs",
                                channel.status === "1" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              )}>
                                {channel.status === "1" ? t('channels.normal') : t('channels.closed')}
                              </span>
                            </TableCell>
                            <TableCell className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                              {channel.all_money}
                            </TableCell>
                            <TableCell className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                              {channel.min_money}
                            </TableCell>
                            <TableCell className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                              {channel.max_money}
                            </TableCell>
                            <TableCell className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                              {channel.sale_sell_rate}
                            </TableCell>
                            <TableCell className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                              {channel.auto_buy_rate}
                            </TableCell>
                            <TableCell className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                              {channel.unique_key || '-'}
                            </TableCell>
                            <TableCell className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                              {formatPaymentFormatLabels(channel.payment_format).length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {formatPaymentFormatLabels(channel.payment_format).map((label, index) => (
                                    <Badge key={index} variant="outline" className="bg-gray-100 text-gray-700 border-gray-300 whitespace-nowrap">
                                      {label}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell className="py-3 px-4 whitespace-nowrap text-sm">
                              <Button
                                variant="outline"
                                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center"
                                onClick={() => handleEditChannel(channel)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                {t('channels.edit')}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )
                    }
                  </TableBody>
                </Table>
                {/* 加载更多按钮 - 桌面端 */}
                {hasNextPage && (
                  isFetchingNextPage ? (
                    <div className="flex justify-center items-center h-10 mt-4 pb-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className="flex justify-center mt-4 pb-4">
                      <Button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        variant="outline"
                        className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        {t('loadMore')}
                      </Button>
                    </div>
                  )
                )}
              </div>
            </>
        )}
      </div>

      {/* 添加币种对话框 */}
      <Dialog open={isAddCurrencyDialogOpen} onOpenChange={setIsAddCurrencyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900">{t('channels.addCurrencyTitle')}</DialogTitle>
            <DialogDescription className="text-gray-600">
              {t('channels.addCurrencyDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currency" className="text-right text-gray-700">
                {t('channels.currencyCode')}
              </Label>
              <Input
                id="currency"
                value={addCurrencyName}
                onChange={(e) => setAddCurrencyName(e.target.value)}
                placeholder={t('channels.eurExample')}
                className="col-span-3 bg-white text-gray-900"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="desc" className="text-right text-gray-700">
              {t('channels.currencyDescription')}
            </Label>
            <Input
              id="desc"
              value={addCurrencyDesc}
              onChange={(e) => setAddCurrencyDesc(e.target.value)}
              placeholder={t('channels.eurExample')}
              className="col-span-3 bg-white text-gray-900"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="bg-white border-gray-300 text-gray-900"
              onClick={() => setIsAddCurrencyDialogOpen(false)}
            >
              {t('channels.cancel')}
            </Button>
            <Button
              variant="outline"
              className="bg-white border-gray-300 text-gray-900"
              onClick={submitAddCurrency}
            >
              {t('channels.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加账户类型对话框 - 添加更多参数 */}
      <Dialog open={isAddAccountTypeDialogOpen} onOpenChange={setIsAddAccountTypeDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-gray-900">{t('channels.addChannelTitle')}</DialogTitle>
            <DialogDescription className="text-gray-600">
              {t('channels.addChannelDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-2 -mr-2">
            <div className="grid gap-4 py-4">
            {/* 表单字段 - 使用响应式布局 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="channel_type" className="text-gray-700">
                  {t('channels.channelTypeLabel')} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={newAccountTypeData.channel_type?.toString() || ""}
                  onValueChange={(value) => handleAccountTypeDataChange('channel_type', value)}
                >
                  <SelectTrigger id="channel_type" className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder={t('channels.selectChannelType')} className="text-gray-900" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="1" className="text-gray-900">{t('channels.payout')}</SelectItem>
                    <SelectItem value="2" className="text-gray-900">{t('channels.collection')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="channelid" className="text-gray-700">
                  {t('channels.channelIdLabel')}
                </Label>
                <Input
                  id="channelid"
                  value={newAccountTypeData.channelid}
                  onChange={(e) => handleAccountTypeDataChange('channelid', e.target.value)}
                  placeholder={t('channels.channelIdPlaceholder')}
                  className="bg-white text-gray-900"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="channel_title" className="text-gray-700">
                  {t('channels.channelNameLabel')}
                </Label>
                <Input
                  id="channel_title"
                  value={newAccountTypeData.channel_title}
                  onChange={(e) => handleAccountTypeDataChange('channel_title', e.target.value)}
                  placeholder={t('channels.wechatPayExample')}
                  className="bg-white text-gray-900"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="note" className="text-gray-700">
                  {t('channels.channelDescLabel')}
                </Label>
                <Input
                  id="note"
                  value={newAccountTypeData.note}
                  onChange={(e) => handleAccountTypeDataChange('note', e.target.value)}
                  placeholder={t('channels.channelDescPlaceholder')}
                  className="bg-white text-gray-900"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency" className="text-gray-700">
                  {t('channels.currencyLabel')}
                </Label>
                <Select
                  value={newAccountTypeData.currency}
                  onValueChange={(value) => handleAccountTypeDataChange('currency', value)}
                >
                  <SelectTrigger id="currency" className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder={t('channels.selectCurrency')} className="text-gray-900" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    {currencyList.map(item => (
                      <SelectItem key={item.currency} value={item.currency} className="text-gray-900">
                        {item.currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accountTypeCurrency" className="text-gray-700">
                  {t('channels.accountTypeLabel')}
                </Label>
                <Select
                  value={newAccountTypeData.paytype}
                  onValueChange={(value) => handleAccountTypeDataChange('paytype', value)}
                >
                  <SelectTrigger id="accountTypeCurrency" className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder={t('channels.selectAccountType')} className="text-gray-900" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    {channelsList.map(item => (
                      <SelectItem key={item.id} value={item.id} className="text-gray-900">
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status" className="text-gray-700">
                  {t('channels.statusLabel')}
                </Label>
                <Select 
                  value={newAccountTypeData.status}
                  onValueChange={(value) => handleAccountTypeDataChange("status", value)}
                >
                  <SelectTrigger id="status" className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder={t('channels.selectStatus')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-900">
                    <SelectItem value="1" className="text-gray-900">{t('channels.normal')}</SelectItem>
                    <SelectItem value="0" className="text-gray-900">{t('channels.closed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="all_money" className="text-gray-700">
                  {t('channels.todayTotalAmountLabel')}
                </Label>
                <Input
                  id="all_money"
                  value={newAccountTypeData.all_money}
                  onChange={(e) => handleAccountTypeDataChange('all_money', e.target.value)}
                  placeholder=""
                  className="bg-white text-gray-900"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="min_money" className="text-gray-700">
                  {t('channels.riskControlMinAmountLabel')}
                </Label>
                <Input
                  id="min_money"
                  value={newAccountTypeData.min_money}
                  onChange={(e) => handleAccountTypeDataChange('min_money', e.target.value)}
                  placeholder=""
                  className="bg-white text-gray-900"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max_money" className="text-gray-700">
                  {t('channels.riskControlMaxAmountLabel')}
                </Label>
                <Input
                  id="max_money"
                  value={newAccountTypeData.max_money}
                  onChange={(e) => handleAccountTypeDataChange('max_money', e.target.value)}
                  placeholder=""
                  className="bg-white text-gray-900"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sale_sell_rate" className="text-gray-700">
                  {t('channels.saleSellRateLabel')}
                </Label>
                <Input
                  id="sale_sell_rate"
                  value={newAccountTypeData.sale_sell_rate}
                  onChange={(e) => handleAccountTypeDataChange('sale_sell_rate', e.target.value)}
                  placeholder={t('channels.rateExample')}
                  className="bg-white text-gray-900"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="auto_buy_rate" className="text-gray-700">
                  {t('channels.autoBuyRateLabel')}
                </Label>
                <Input
                  id="auto_buy_rate"
                  value={newAccountTypeData.auto_buy_rate}
                  onChange={(e) => handleAccountTypeDataChange('auto_buy_rate', e.target.value)}
                  placeholder={t('channels.rateExample')}
                  className="bg-white text-gray-900"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="min_success_rate" className="text-gray-700">
                  {t('channels.minSuccessRateLabel')}
                </Label>
                <Input
                  id="min_success_rate"
                  type="number"
                  value={newAccountTypeData.min_success_rate}
                  onChange={(e) => handleAccountTypeDataChange('min_success_rate', e.target.value)}
                  placeholder={t('channels.successRateExample')}
                  className="bg-white text-gray-900"
                />
              </div>
              
              {/* 随机金额配置 */}
              <div className="space-y-2">
                <Label htmlFor="is_random_money" className="text-gray-700">
                  {t('channels.isRandomMoneyLabel')}
                </Label>
                <Select
                  value={newAccountTypeData.is_random_money?.toString() || "0"}
                  onValueChange={(value) => handleAccountTypeDataChange('is_random_money', value)}
                >
                  <SelectTrigger id="is_random_money" className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder={t('channels.select')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="0" className="text-gray-900">{t('channels.disable')}</SelectItem>
                    <SelectItem value="1" className="text-gray-900">{t('channels.enable')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 唯一标识 */}
              <div className="space-y-2">
                <Label htmlFor="unique_key" className="text-gray-700">
                  唯一标识
                </Label>
                <Input
                  id="unique_key"
                  value={newAccountTypeData.unique_key || ""}
                  onChange={(e) => handleAccountTypeDataChange('unique_key', e.target.value)}
                  placeholder="请输入唯一标识"
                  className="bg-white text-gray-900"
                />
              </div>

              {/* 代收账户格式 */}
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-gray-700">
                  代收账户格式
                </Label>
                <div className="border border-gray-200 rounded-md p-3 bg-white">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {paymentFormatOptions.map((option) => {
                      const selectedFormats = parsePaymentFormat(newAccountTypeData.payment_format);
                      return (
                        <div key={option.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`add-payment-format-${option.value}`}
                            checked={selectedFormats.includes(option.value)}
                            onCheckedChange={(checked) => {
                              const currentSelected = parsePaymentFormat(newAccountTypeData.payment_format);
                              const newSelected = checked
                                ? [...currentSelected, option.value]
                                : currentSelected.filter(item => item !== option.value);
                              handleAccountTypeDataChange('payment_format', formatPaymentFormat(newSelected));
                            }}
                          />
                          <label
                            htmlFor={`add-payment-format-${option.value}`}
                            className="text-sm font-medium text-gray-900 cursor-pointer"
                          >
                            {option.label}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                  {newAccountTypeData.payment_format && (
                    <div className="mt-2 text-xs text-gray-500">
                      示例格式: {newAccountTypeData.payment_format}
                    </div>
                  )}
                </div>
              </div>

              {/* 网站操作参数（独立块） */}
              <div className="sm:col-span-2 border border-gray-200 rounded-md p-3 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="is_web" className="text-gray-700">
                      是否为网站操作
                    </Label>
                    <Select
                      value={newAccountTypeData.is_web?.toString() || "2"}
                      onValueChange={(value) => handleAccountTypeDataChange('is_web', value)}
                    >
                      <SelectTrigger id="is_web" className="bg-white border-gray-300 text-gray-900">
                        <SelectValue placeholder="请选择" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-300">
                        <SelectItem value="1" className="text-gray-900">网站操作</SelectItem>
                        <SelectItem value="2" className="text-gray-900">APP操作</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newAccountTypeData.is_web?.toString() === "1" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="website_url" className="text-gray-700">
                          网站URL
                        </Label>
                        <Input
                          id="website_url"
                          value={newAccountTypeData.website_url || ""}
                          onChange={(e) => handleAccountTypeDataChange('website_url', e.target.value)}
                          placeholder="请输入网站URL"
                          className="bg-white text-gray-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="proxy_country" className="text-gray-700">
                          代理国家
                        </Label>
                        <Input
                          id="proxy_country"
                          value={newAccountTypeData.proxy_country || ""}
                          onChange={(e) => handleAccountTypeDataChange('proxy_country', e.target.value)}
                          placeholder="请输入代理国家"
                          className="bg-white text-gray-900"
                        />
                      </div>
                      {newAccountTypeData.channel_type?.toString() !== "1" && newAccountTypeData.channel_type?.toString() !== "2" && (
                        <>
                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="receive_params" className="text-gray-700">
                              收款解析
                            </Label>
                            <Textarea
                              id="receive_params"
                              value={newAccountTypeData.receive_params || ""}
                              onChange={(e) => handleAccountTypeDataChange('receive_params', e.target.value)}
                              placeholder="请输入收款解析"
                              className="bg-white text-gray-900"
                              rows={4}
                            />
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="payment_params" className="text-gray-700">
                              付款流程解析
                            </Label>
                            <Textarea
                              id="payment_params"
                              value={newAccountTypeData.payment_params || ""}
                              onChange={(e) => handleAccountTypeDataChange('payment_params', e.target.value)}
                              placeholder="请输入付款流程解析"
                              className="bg-white text-gray-900"
                              rows={4}
                            />
                          </div>
                        </>
                      )}
                      {newAccountTypeData.channel_type?.toString() === "2" && (
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="receive_params" className="text-gray-700">
                            收款解析
                          </Label>
                          <Textarea
                            id="receive_params"
                            value={newAccountTypeData.receive_params || ""}
                            onChange={(e) => handleAccountTypeDataChange('receive_params', e.target.value)}
                            placeholder="请输入收款解析"
                            className="bg-white text-gray-900"
                            rows={4}
                          />
                        </div>
                      )}
                      {newAccountTypeData.channel_type?.toString() === "1" && (
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="payment_params" className="text-gray-700">
                            付款流程解析
                          </Label>
                          <Textarea
                            id="payment_params"
                            value={newAccountTypeData.payment_params || ""}
                            onChange={(e) => handleAccountTypeDataChange('payment_params', e.target.value)}
                            placeholder="请输入付款流程解析"
                            className="bg-white text-gray-900"
                            rows={4}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* 当开启随机金额时显示以下字段 */}
            {newAccountTypeData.is_random_money === "1" && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('channels.randomMoneyConfig')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="is_add_random_money" className="text-gray-700">
                      {t('channels.incrementDecrement')}
                    </Label>
                    <Select
                      value={newAccountTypeData.is_add_random_money?.toString() || "1"}
                      onValueChange={(value) => handleAccountTypeDataChange('is_add_random_money', value)}
                    >
                      <SelectTrigger id="is_add_random_money" className="bg-white border-gray-300 text-gray-900">
                        <SelectValue placeholder={t('channels.select')} />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-300">
                        <SelectItem value="1" className="text-gray-900">{t('channels.increment')}</SelectItem>
                        <SelectItem value="2" className="text-gray-900">{t('channels.decrement')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="min_unit" className="text-gray-700">
                      {t('channels.minRandomUnit')}
                    </Label>
                    <Input
                      id="min_unit"
                      type="number"
                      value={newAccountTypeData.min_unit}
                      onChange={(e) => handleAccountTypeDataChange('min_unit', e.target.value)}
                      placeholder={t('channels.minRandomUnitPlaceholder')}
                      className="bg-white text-gray-900"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="min_random_money" className="text-gray-700">
                      {t('channels.minRandomAmount')}
                    </Label>
                    <Input
                      id="min_random_money"
                      type="number"
                      step="0.01"
                      value={newAccountTypeData.min_random_money}
                      onChange={(e) => handleAccountTypeDataChange('min_random_money', e.target.value)}
                      placeholder={t('channels.minRandomAmountPlaceholder')}
                      className="bg-white text-gray-900"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="max_random_money" className="text-gray-700">
                      {t('channels.maxRandomAmount')}
                    </Label>
                    <Input
                      id="max_random_money"
                      type="number"
                      step="0.01"
                      value={newAccountTypeData.max_random_money}
                      onChange={(e) => handleAccountTypeDataChange('max_random_money', e.target.value)}
                      placeholder={t('channels.minRandomAmountPlaceholder')}
                      className="bg-white text-gray-900"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="exclude_random_money" className="text-gray-700">
                      {t('channels.excludeInteger')}
                    </Label>
                    <Select
                      value={newAccountTypeData.exclude_random_money || ""}
                      onValueChange={(value) => handleAccountTypeDataChange('exclude_random_money', value)}
                    >
                      <SelectTrigger id="exclude_random_money" className="bg-white border-gray-300 text-gray-900">
                        <SelectValue placeholder={t('channels.select')} />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-300">
                        <SelectItem value="0.10" className="text-gray-900">0.10</SelectItem>
                        <SelectItem value="1.00" className="text-gray-900">1.00</SelectItem>
                        <SelectItem value="10.00" className="text-gray-900">10.00</SelectItem>
                        <SelectItem value="100.00" className="text-gray-900">100.00</SelectItem>
                        <SelectItem value="1000.00" className="text-gray-900">1000.00</SelectItem>
                        <SelectItem value="10000.00" className="text-gray-900">10000.00</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="random_time_range" className="text-gray-700">
                      {t('channels.timeRange')}
                    </Label>
                    <Input
                      id="random_time_range"
                      type="number"
                      value={newAccountTypeData.random_time_range || "1"}
                      onChange={(e) => handleAccountTypeDataChange('random_time_range', e.target.value)}
                      placeholder={t('channels.timeRangePlaceholder')}
                      className="bg-white text-gray-900"
                    />
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 border-t border-gray-200 pt-4 mt-4">
            <Button
              variant="outline"
              className="bg-white border-gray-300 text-gray-900"
              onClick={() => setIsAddAccountTypeDialogOpen(false)}
            >
              {t('channels.cancel')}
            </Button>
            <Button
              variant="outline"
              className="bg-white border-gray-300 text-gray-900"
              onClick={submitAddAccountType}
            >
              {t('channels.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑通道对话框 */}
      <Dialog open={isEditChannelDialogOpen} onOpenChange={setIsEditChannelDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-gray-900">{t('channels.editChannelTitle')}</DialogTitle>
            <DialogDescription className="text-gray-600">
              {t('channels.editChannelDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-2 -mr-2">
            <div className="grid gap-4 py-4">
            {/* 表单字段 - 使用响应式布局 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_channel_type" className="text-gray-700">
                  {t('channels.channelTypeLabel')} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={editChannelData.channel_type?.toString() || ""}
                  onValueChange={(value) => handleEditChannelDataChange('channel_type', value)}
                >
                  <SelectTrigger id="edit_channel_type" className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder={t('channels.selectChannelType')} className="text-gray-900" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="1" className="text-gray-900">{t('channels.payout')}</SelectItem>
                    <SelectItem value="2" className="text-gray-900">{t('channels.collection')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="channelid" className="text-gray-700">
                  {t('channels.channelIdLabel')}
                </Label>
                <Input
                  id="channelid"
                  value={editChannelData.channelid}
                  onChange={(e) => handleEditChannelDataChange('channelid', e.target.value)}
                  placeholder={t('channels.channelIdPlaceholder')}
                  className="bg-white text-gray-900"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="channel_title" className="text-gray-700">
                  {t('channels.channelNameLabel')}
                </Label>
                <Input
                  id="channel_title"
                  value={editChannelData.channel_title}
                  onChange={(e) => handleEditChannelDataChange('channel_title', e.target.value)}
                  placeholder={t('channels.wechatPayExample')}
                  className="bg-white text-gray-900"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="note" className="text-gray-700">
                  {t('channels.channelDescLabel')}
                </Label>
                <Input
                  id="note"
                  value={editChannelData.note}
                  onChange={(e) => handleEditChannelDataChange('note', e.target.value)}
                  placeholder={t('channels.channelDescPlaceholder')}
                  className="bg-white text-gray-900"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency" className="text-gray-700">
                  {t('channels.currencyLabel')}
                </Label>
                <Select
                  value={editChannelData.currency}
                  onValueChange={(value) => handleEditChannelDataChange('currency', value)}
                >
                  <SelectTrigger id="currency" className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder={t('channels.selectCurrencyPlaceholder')} className="text-gray-900" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    {currencyList.map(item => (
                      <SelectItem key={item.currency} value={item.currency} className="text-gray-900">
                        {item.currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountTypeCurrency" className="text-gray-700">
                  {t('channels.accountTypeLabel')}
                </Label>
                <Select
                  value={editChannelData.paytype}
                  onValueChange={(value) => handleEditChannelDataChange('paytype', value)}
                >
                  <SelectTrigger id="accountTypeCurrency" className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder={t('channels.selectAccountTypePlaceholder')} className="text-gray-900" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    {channelsList.map(item => (
                      <SelectItem key={item.id} value={item.id} className="text-gray-900">
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status" className="text-gray-700">
                  {t('channels.statusLabel')}
                </Label>
                <Select 
                  value={editChannelData.status}
                  onValueChange={(value) => handleEditChannelDataChange("status", value)}
                >
                  <SelectTrigger id="status" className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder={t('channels.selectStatus')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-900">
                    <SelectItem value="1" className="text-gray-900">{t('channels.normal')}</SelectItem>
                    <SelectItem value="0" className="text-gray-900">{t('channels.closed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="all_money" className="text-gray-700">
                  {t('channels.todayTotalAmountLabel')}
                </Label>
                <Input
                  id="all_money"
                  value={editChannelData.all_money}
                  onChange={(e) => handleEditChannelDataChange('all_money', e.target.value)}
                  placeholder=""
                  className="bg-white text-gray-900"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="min_money" className="text-gray-700">
                  {t('channels.riskControlMinAmountLabel')}
                </Label>
                <Input
                  id="min_money"
                  value={editChannelData.min_money}
                  onChange={(e) => handleEditChannelDataChange('min_money', e.target.value)}
                  placeholder=""
                  className="bg-white text-gray-900"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max_money" className="text-gray-700">
                  {t('channels.riskControlMaxAmountLabel')}
                </Label>
                <Input
                  id="max_money"
                  value={editChannelData.max_money}
                  onChange={(e) => handleEditChannelDataChange('max_money', e.target.value)}
                  placeholder=""
                  className="bg-white text-gray-900"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sale_sell_rate" className="text-gray-700">
                  {t('channels.saleSellRateLabel')}
                </Label>
                <Input
                  id="sale_sell_rate"
                  value={editChannelData.sale_sell_rate}
                  onChange={(e) => handleEditChannelDataChange('sale_sell_rate', e.target.value)}
                  placeholder={t('channels.rateExample')}
                  className="bg-white text-gray-900"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="auto_buy_rate" className="text-gray-700">
                  {t('channels.autoBuyRateLabel')}
                </Label>
                <Input
                  id="auto_buy_rate"
                  value={editChannelData.auto_buy_rate}
                  onChange={(e) => handleEditChannelDataChange('auto_buy_rate', e.target.value)}
                  placeholder={t('channels.rateExample')}
                  className="bg-white text-gray-900"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_min_success_rate" className="text-gray-700">
                  {t('channels.minSuccessRateLabel')}
                </Label>
                <Input
                  id="edit_min_success_rate"
                  type="number"
                  value={editChannelData.min_success_rate}
                  onChange={(e) => handleEditChannelDataChange('min_success_rate', e.target.value)}
                  placeholder={t('channels.successRateExample')}
                  className="bg-white text-gray-900"
                />
              </div>
              
              {/* 随机金额配置 */}
              <div className="space-y-2">
                <Label htmlFor="edit_is_random_money" className="text-gray-700">
                  {t('channels.isRandomMoneyLabel')}
                </Label>
                <Select
                  value={editChannelData.is_random_money?.toString() || "0"}
                  onValueChange={(value) => handleEditChannelDataChange('is_random_money', value)}
                >
                  <SelectTrigger id="edit_is_random_money" className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder={t('channels.select')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="0" className="text-gray-900">{t('channels.disable')}</SelectItem>
                    <SelectItem value="1" className="text-gray-900">{t('channels.enable')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 唯一标识 */}
              <div className="space-y-2">
                <Label htmlFor="edit_unique_key" className="text-gray-700">
                  唯一标识
                </Label>
                <Input
                  id="edit_unique_key"
                  value={editChannelData.unique_key || ""}
                  onChange={(e) => handleEditChannelDataChange('unique_key', e.target.value)}
                  placeholder="请输入唯一标识"
                  className="bg-white text-gray-900"
                />
              </div>

              {/* 代收账户格式 */}
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-gray-700">
                  代收账户格式
                </Label>
                <div className="border border-gray-200 rounded-md p-3 bg-white">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {paymentFormatOptions.map((option) => {
                      const selectedFormats = parsePaymentFormat(editChannelData.payment_format);
                      return (
                        <div key={option.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-payment-format-${option.value}`}
                            checked={selectedFormats.includes(option.value)}
                            onCheckedChange={(checked) => {
                              const currentSelected = parsePaymentFormat(editChannelData.payment_format);
                              const newSelected = checked
                                ? [...currentSelected, option.value]
                                : currentSelected.filter(item => item !== option.value);
                              handleEditChannelDataChange('payment_format', formatPaymentFormat(newSelected));
                            }}
                          />
                          <label
                            htmlFor={`edit-payment-format-${option.value}`}
                            className="text-sm font-medium text-gray-900 cursor-pointer"
                          >
                            {option.label}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                  {editChannelData.payment_format && (
                    <div className="mt-2 text-xs text-gray-500">
                      示例格式: {editChannelData.payment_format}
                    </div>
                  )}
                </div>
              </div>

              {/* 网站操作参数（独立块） */}
              <div className="sm:col-span-2 border border-gray-200 rounded-md p-3 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_is_web" className="text-gray-700">
                      是否为网站操作
                    </Label>
                    <Select
                      value={editChannelData.is_web?.toString() || "2"}
                      onValueChange={(value) => handleEditChannelDataChange('is_web', value)}
                    >
                      <SelectTrigger id="edit_is_web" className="bg-white border-gray-300 text-gray-900">
                        <SelectValue placeholder="请选择" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-300">
                        <SelectItem value="1" className="text-gray-900">网站操作</SelectItem>
                        <SelectItem value="2" className="text-gray-900">APP操作</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {editChannelData.is_web?.toString() === "1" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="edit_website_url" className="text-gray-700">
                          网站URL
                        </Label>
                        <Input
                          id="edit_website_url"
                          value={editChannelData.website_url || ""}
                          onChange={(e) => handleEditChannelDataChange('website_url', e.target.value)}
                          placeholder="请输入网站URL"
                          className="bg-white text-gray-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit_proxy_country" className="text-gray-700">
                          代理国家
                        </Label>
                        <Input
                          id="edit_proxy_country"
                          value={editChannelData.proxy_country || ""}
                          onChange={(e) => handleEditChannelDataChange('proxy_country', e.target.value)}
                          placeholder="请输入代理国家"
                          className="bg-white text-gray-900"
                        />
                      </div>
                      {editChannelData.channel_type?.toString() !== "1" && editChannelData.channel_type?.toString() !== "2" && (
                        <>
                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="edit_receive_params" className="text-gray-700">
                              收款解析
                            </Label>
                            <Textarea
                              id="edit_receive_params"
                              value={editChannelData.receive_params || ""}
                              onChange={(e) => handleEditChannelDataChange('receive_params', e.target.value)}
                              placeholder="请输入收款解析"
                              className="bg-white text-gray-900"
                              rows={4}
                            />
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="edit_payment_params" className="text-gray-700">
                              付款流程解析
                            </Label>
                            <Textarea
                              id="edit_payment_params"
                              value={editChannelData.payment_params || ""}
                              onChange={(e) => handleEditChannelDataChange('payment_params', e.target.value)}
                              placeholder="请输入付款流程解析"
                              className="bg-white text-gray-900"
                              rows={4}
                            />
                          </div>
                        </>
                      )}
                      {editChannelData.channel_type?.toString() === "2" && (
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="edit_receive_params" className="text-gray-700">
                            收款解析
                          </Label>
                          <Textarea
                            id="edit_receive_params"
                            value={editChannelData.receive_params || ""}
                            onChange={(e) => handleEditChannelDataChange('receive_params', e.target.value)}
                            placeholder="请输入收款解析"
                            className="bg-white text-gray-900"
                            rows={4}
                          />
                        </div>
                      )}
                      {editChannelData.channel_type?.toString() === "1" && (
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="edit_payment_params" className="text-gray-700">
                            付款流程解析
                          </Label>
                          <Textarea
                            id="edit_payment_params"
                            value={editChannelData.payment_params || ""}
                            onChange={(e) => handleEditChannelDataChange('payment_params', e.target.value)}
                            placeholder="请输入付款流程解析"
                            className="bg-white text-gray-900"
                            rows={4}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* 当开启随机金额时显示以下字段 */}
            {editChannelData.is_random_money === "1" && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('channels.randomMoneyConfig')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_is_add_random_money" className="text-gray-700">
                      {t('channels.incrementDecrement')}
                    </Label>
                    <Select
                      value={editChannelData.is_add_random_money?.toString() || "1"}
                      onValueChange={(value) => handleEditChannelDataChange('is_add_random_money', value)}
                    >
                      <SelectTrigger id="edit_is_add_random_money" className="bg-white border-gray-300 text-gray-900">
                        <SelectValue placeholder={t('channels.select')} />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-300">
                        <SelectItem value="1" className="text-gray-900">{t('channels.increment')}</SelectItem>
                        <SelectItem value="2" className="text-gray-900">{t('channels.decrement')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit_min_unit" className="text-gray-700">
                      {t('channels.minRandomUnit')}
                    </Label>
                    <Input
                      id="edit_min_unit"
                      type="number"
                      value={editChannelData.min_unit}
                      onChange={(e) => handleEditChannelDataChange('min_unit', e.target.value)}
                      placeholder={t('channels.minRandomUnitPlaceholder')}
                      className="bg-white text-gray-900"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit_min_random_money" className="text-gray-700">
                      {t('channels.minRandomAmount')}
                    </Label>
                    <Input
                      id="edit_min_random_money"
                      type="number"
                      step="0.01"
                      value={editChannelData.min_random_money}
                      onChange={(e) => handleEditChannelDataChange('min_random_money', e.target.value)}
                      placeholder={t('channels.minRandomAmountPlaceholder')}
                      className="bg-white text-gray-900"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit_max_random_money" className="text-gray-700">
                      {t('channels.maxRandomAmount')}
                    </Label>
                    <Input
                      id="edit_max_random_money"
                      type="number"
                      step="0.01"
                      value={editChannelData.max_random_money}
                      onChange={(e) => handleEditChannelDataChange('max_random_money', e.target.value)}
                      placeholder={t('channels.minRandomAmountPlaceholder')}
                      className="bg-white text-gray-900"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit_exclude_random_money" className="text-gray-700">
                      {t('channels.excludeInteger')}
                    </Label>
                    <Select
                      value={editChannelData.exclude_random_money || ""}
                      onValueChange={(value) => handleEditChannelDataChange('exclude_random_money', value)}
                    >
                      <SelectTrigger id="edit_exclude_random_money" className="bg-white border-gray-300 text-gray-900">
                        <SelectValue placeholder={t('channels.select')} />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-300">
                        <SelectItem value="0.10" className="text-gray-900">0.10</SelectItem>
                        <SelectItem value="1.00" className="text-gray-900">1.00</SelectItem>
                        <SelectItem value="10.00" className="text-gray-900">10.00</SelectItem>
                        <SelectItem value="100.00" className="text-gray-900">100.00</SelectItem>
                        <SelectItem value="1000.00" className="text-gray-900">1000.00</SelectItem>
                        <SelectItem value="10000.00" className="text-gray-900">10000.00</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit_random_time_range" className="text-gray-700">
                      {t('channels.timeRange')}
                    </Label>
                    <Input
                      id="edit_random_time_range"
                      type="number"
                      value={editChannelData.random_time_range || "1"}
                      onChange={(e) => handleEditChannelDataChange('random_time_range', e.target.value)}
                      placeholder={t('channels.timeRangePlaceholder')}
                      className="bg-white text-gray-900"
                    />
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 border-t border-gray-200 pt-4 mt-4">
            <Button
              variant="outline"
              className="bg-white border-gray-300 text-gray-900"
              onClick={() => setIsEditChannelDialogOpen(false)}
            >
              {t('channels.cancel')}
            </Button>
            <Button
              variant="outline"
              className="bg-white border-gray-300 text-gray-900"
              onClick={submitEditChannel}
            >
              {t('channels.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}