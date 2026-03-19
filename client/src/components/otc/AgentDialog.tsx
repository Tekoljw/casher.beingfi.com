import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { Agent, CurrencyFeeConfig, ChannelFeeConfig, OvertimePenaltyConfig } from "@/hooks/use-agents";
import { useCurrencyList } from "@/hooks/use-currency-list";
import { apiRequest } from "@/lib/queryClient";
import { LOGIN_CONFIG } from "@/config/login";

export interface AgentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (agent: Agent) => void;
  initialData?: Agent;  // 若提供，则为编辑模式；否则为添加模式
  mode: "add" | "edit";
}

const EMPTY_AGENT: Agent = {
  id: "",
  nickname: "",
  username: "",
  status: "1",
  tg_account: "",
  receive_commission: "",
  payment_commission: "",
  punish_commission: "",
  receive_fee: "",
  payment_fee: "",
  password: "",
  last_login_time: "",
  wallet_id: "",
  is_system: "0",
  salary_currency: "",
  salary_money: "",
  salary_starttime: "",
  system_fee_currency: "",
  system_fee_money: "",
  system_fee_starttime: "",
};

export default function AgentDialog({ isOpen, onOpenChange, onSave, initialData, mode }: AgentDialogProps) {
  // 确保 is_system 有默认值
  const initialFormData: Agent = initialData 
    ? { ...initialData, is_system: initialData.is_system || "0", currency_fees: initialData.currency_fees || {} }
    : EMPTY_AGENT;
  const [formData, setFormData] = useState<Agent>(initialFormData);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { data: currencyList = [] } = useCurrencyList();
  const displayMode = LOGIN_CONFIG.DISPLAY_MODE as number;
  
  // 选中的币种列表
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(
    initialData?.currency_fees ? Object.keys(initialData.currency_fees) : []
  );
  
  // 币种服务费配置
  const [currencyFees, setCurrencyFees] = useState<{ [currency: string]: CurrencyFeeConfig }>(
    initialData?.currency_fees || {}
  );
  
  // 通道手续费配置
  const [channelFees, setChannelFees] = useState<{ [channelid: string]: ChannelFeeConfig }>(
    initialData?.channel_fees || {}
  );
  
  // 通道手续费配置中选中的币种列表
  const [selectedChannelCurrencies, setSelectedChannelCurrencies] = useState<string[]>([]);
  
  // 正在编辑的通道ID
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  
  // 当前选中的币种（用于标签页切换）
  const [activeChannelCurrency, setActiveChannelCurrency] = useState<string>("");
  
  // 所有通道列表（用于显示和选择）
  const [allChannels, setAllChannels] = useState<Array<{
    channelid: string;
    channel_title: string;
    currency: string;
    paytype: string;
    paytype_name?: string;
    channel_type?: string | number;
  }>>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  
  // 处理通道手续费配置中的币种选择
  const handleChannelCurrencyToggle = (currency: string, checked: boolean) => {
    if (checked) {
      setSelectedChannelCurrencies(prev => {
        const newList = [...prev, currency];
        // 如果当前没有选中的币种，设置第一个为默认选中
        if (!activeChannelCurrency && newList.length > 0) {
          setActiveChannelCurrency(newList[0]);
        }
        return newList;
      });
    } else {
      setSelectedChannelCurrencies(prev => {
        const newList = prev.filter(c => c !== currency);
        // 如果当前选中的币种被取消，切换到第一个可用的币种
        if (activeChannelCurrency === currency && newList.length > 0) {
          setActiveChannelCurrency(newList[0]);
        } else if (newList.length === 0) {
          setActiveChannelCurrency("");
        }
        return newList;
      });
    }
  };
  
  // 加载所有通道数据
  React.useEffect(() => {
    const loadAllChannels = async () => {
      if (!isOpen || currencyList.length === 0) return;
      
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
    
    if (isOpen) {
      loadAllChannels();
    }
  }, [isOpen, currencyList]);
  
  // 当对话框打开或 initialData 变化时更新表单数据（编辑模式）
  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // 编辑模式：使用 initialData 的所有字段，确保 nickname 等字段正确显示
        const fees = initialData.currency_fees || {};
        const channelFeeData = initialData.channel_fees || {};
        setFormData({ 
          ...initialData, 
          is_system: initialData.is_system || "0", 
          currency_fees: fees,
          channel_fees: channelFeeData
        });
        setSelectedCurrencies(Object.keys(fees));
        setCurrencyFees(fees);
        setChannelFees(channelFeeData);
      } else {
        // 添加模式：重置为默认值
        setFormData(EMPTY_AGENT);
        setSelectedCurrencies([]);
        setCurrencyFees({});
        setChannelFees({});
        setSelectedChannelCurrencies([]);
      }
    }
  }, [isOpen, initialData]);
  
  // 当通道列表加载完成且是编辑模式时，自动选中已有通道手续费配置的币种
  React.useEffect(() => {
    if (isOpen && initialData?.channel_fees && allChannels.length > 0) {
      const currencies = new Set<string>();
      Object.keys(initialData.channel_fees).forEach(channelid => {
        const channel = allChannels.find(c => c.channelid === channelid);
        if (channel) {
          currencies.add(channel.currency);
        }
      });
      if (currencies.size > 0 && selectedChannelCurrencies.length === 0) {
        const currenciesArray = Array.from(currencies);
        setSelectedChannelCurrencies(currenciesArray);
        // 设置默认选中的币种
        if (!activeChannelCurrency && currenciesArray.length > 0) {
          setActiveChannelCurrency(currenciesArray[0]);
        }
      }
    }
  }, [isOpen, initialData, allChannels, selectedChannelCurrencies.length, activeChannelCurrency]);
  
  // 当 is_system 变为 "0" 时，清空币种选择和服务费配置
  React.useEffect(() => {
    if (formData.is_system === "0") {
      setSelectedCurrencies([]);
      setCurrencyFees({});
    }
  }, [formData.is_system]);
  
  // 获取标题
  const title = mode === "add" ? t('agents.add', '添加供应商') : t('agents.edit', '编辑供应商');
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // 处理系统服务模式开关变化
  const handleSystemModeChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, is_system: checked ? "1" : "0" }));
  };
  
  // 将日期时间字符串转换为11位时间戳（秒级）
  const dateTimeToTimestamp = (dateTimeString: string): string => {
    if (!dateTimeString) return "";
    const date = new Date(dateTimeString);
    return Math.floor(date.getTime() / 1000).toString();
  };
  
  // 将11位时间戳转换为日期时间字符串（用于显示）
  const timestampToDateTime = (timestamp: string): string => {
    if (!timestamp) return "";
    const date = new Date(parseInt(timestamp) * 1000);
    // 转换为 YYYY-MM-DDTHH:mm 格式
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
  // 处理日期时间输入变化
  const handleDateTimeChange = (name: string, value: string) => {
    const timestamp = dateTimeToTimestamp(value);
    setFormData(prev => ({ ...prev, [name]: timestamp }));
  };
  
  // 处理币种选择
  const handleCurrencyToggle = (currency: string, checked: boolean) => {
    if (checked) {
      // 添加币种
      setSelectedCurrencies(prev => [...prev, currency]);
      // 初始化该币种的服务费配置
      setCurrencyFees(prev => ({
        ...prev,
        [currency]: { min_fee: "", max_fee: "" }
      }));
    } else {
      // 移除币种
      setSelectedCurrencies(prev => prev.filter(c => c !== currency));
      // 移除该币种的服务费配置
      const newFees = { ...currencyFees };
      delete newFees[currency];
      setCurrencyFees(newFees);
    }
  };
  
  // 处理币种服务费输入
  const handleCurrencyFeeChange = (currency: string, field: "min_fee" | "max_fee", value: string) => {
    setCurrencyFees(prev => ({
      ...prev,
      [currency]: {
        ...prev[currency],
        [field]: value
      }
    }));
  };
  
  // 处理通道手续费输入
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

  // 创建空的超时罚款配置
  const createEmptyOvertimePenalty = (): OvertimePenaltyConfig => ({
    overtime_minutes: "",
    penalty_percentage: "",
    fixed_penalty: "",
  });

  // 处理超时罚款配置变化
  const handleOvertimePenaltyChange = (channelid: string, index: number, field: keyof OvertimePenaltyConfig, value: string) => {
    setChannelFees(prev => {
      const currentConfig = prev[channelid] || {
        receive_commission: "",
        receive_fee: "",
        payment_commission: "",
        payment_fee: "",
        overtime_penalties: []
      };
      const penalties = currentConfig.overtime_penalties || [];
      const updatedPenalties = [...penalties];
      if (!updatedPenalties[index]) {
        updatedPenalties[index] = createEmptyOvertimePenalty();
      }
      updatedPenalties[index] = {
        ...updatedPenalties[index],
        [field]: value
      };
      return {
        ...prev,
        [channelid]: {
          ...currentConfig,
          overtime_penalties: updatedPenalties
        }
      };
    });
  };

  // 添加超时罚款行
  const handleAddOvertimePenalty = (channelid: string) => {
    setChannelFees(prev => {
      const currentConfig = prev[channelid] || {
        receive_commission: "",
        receive_fee: "",
        payment_commission: "",
        payment_fee: "",
        overtime_penalties: []
      };
      const penalties = currentConfig.overtime_penalties || [];
      return {
        ...prev,
        [channelid]: {
          ...currentConfig,
          overtime_penalties: [...penalties, createEmptyOvertimePenalty()]
        }
      };
    });
  };

  // 删除超时罚款行
  const handleRemoveOvertimePenalty = (channelid: string, index: number) => {
    setChannelFees(prev => {
      const currentConfig = prev[channelid] || {
        receive_commission: "",
        receive_fee: "",
        payment_commission: "",
        payment_fee: "",
        overtime_penalties: []
      };
      const penalties = currentConfig.overtime_penalties || [];
      const updatedPenalties = penalties.filter((_, i) => i !== index);
      return {
        ...prev,
        [channelid]: {
          ...currentConfig,
          overtime_penalties: updatedPenalties
        }
      };
    });
  };
  
  const handleSubmit = () => {
    
    // 根据登录模式进行不同的表单验证
    if (displayMode === 2) {
      // 模式2：需要客户名称和钱包ID
      if (!formData.nickname.trim()) {
        toast({
          title: t('validation.error', '验证错误'),
          description: t('validation.nameRequired', '请输入客户名称'),
          variant: "destructive"
        });
        return;
      }
      
      if (!formData.wallet_id?.trim()) {
        toast({
          title: t('validation.error', '验证错误'),
          description: t('validation.walletIdRequired', '请输入钱包ID'),
          variant: "destructive"
        });
        return;
      }
    } else {
      // 模式1：需要传统字段
      if (!formData.nickname.trim()) {
        toast({
          title: t('validation.error', '验证错误'),
          description: t('validation.nameRequired', '请输入客户名称'),
          variant: "destructive"
        });
        return;
      }
      
      if (!formData.username.trim()) {
        toast({
          title: t('validation.error', '验证错误'),
          description: t('validation.accountRequired', '请输入账号'),
          variant: "destructive"
        });
        return;
      }
    }

    if (!formData.status.trim()) {
      toast({
        title: t('validation.error', '验证错误'),
        description: t('validation.statusRequired', '请选择当前状态'),
        variant: "destructive"
      });
      return;
    }
    
    // 如果选择了系统服务模式，需要验证币种和服务费配置
    if (formData.is_system === "1") {
      if (selectedCurrencies.length === 0) {
        toast({
          title: t('validation.error', '验证错误'),
          description: t('validation.currencyRequired', '请至少选择一个币种'),
          variant: "destructive"
        });
        return;
      }
      
      // 验证每个选中币种的服务费配置
      for (const currency of selectedCurrencies) {
        const feeConfig = currencyFees[currency];
        if (!feeConfig || !feeConfig.min_fee.trim()) {
          toast({
            title: t('validation.error', '验证错误'),
            description: t('validation.minFeeRequired', '请配置{currency}的每月最低服务费').replace('{currency}', currency),
            variant: "destructive"
          });
          return;
        }
        if (!feeConfig || !feeConfig.max_fee.trim()) {
          toast({
            title: t('validation.error', '验证错误'),
            description: t('validation.maxFeeRequired', '请配置{currency}的每月最高服务费').replace('{currency}', currency),
            variant: "destructive"
          });
          return;
        }
      }
    }
    
    // 将币种服务费配置和通道手续费配置添加到 formData
    const finalFormData = {
      ...formData,
      currency_fees: formData.is_system === "1" ? currencyFees : undefined,
      channel_fees: Object.keys(channelFees).length > 0 ? channelFees : undefined
    };
    
    // 生成新ID（如果是新建的话）
    // if (!formData.id) {
    //   formData.id = Date.now().toString();
    // }
    
    onSave(finalFormData);
    onOpenChange(false);
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl max-w-full flex flex-col overflow-hidden p-0 bg-white [&>button]:hidden">
        <SheetHeader className="flex-shrink-0 px-6 pt-4 pb-2 border-b">
          <SheetTitle className="text-black">{title}</SheetTitle>
          <SheetDescription className="text-gray-600">
            {t('agents.dialogDescription', '填写以下信息')}{mode === "edit" ? t('agents.modify', '修改') : t('agents.create', '创建')}{t('agents.accountSuffix', '供应商账户')}
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-3 py-2 overflow-y-auto px-6">
          {/* 第一行：是否为系统服务模式 */}
          {mode === "add" && (
            <div className="flex items-center justify-between">
              <Label htmlFor="is_system" className="text-gray-700 text-sm whitespace-nowrap">
                {t('agents.isSystemMode', '是否为系统服务模式')}
              </Label>
              <Switch
                id="is_system"
                checked={formData.is_system === "1"}
                onCheckedChange={handleSystemModeChange}
              />
            </div>
          )}
          
          {/* 第二行：客户名称、钱包ID、当前状态（三列） */}
          {displayMode === 2 ? (
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="nickname" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">{t('agents.nickname', '客户名称')}</Label>
                <input 
                  id="nickname" 
                  name="nickname" 
                  value={formData.nickname} 
                  onChange={handleInputChange} 
                  placeholder={t('agents.namePlaceholder', '请输入客户名称')}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
                />
              </div>
              
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="wallet_id" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">
                  {t('agents.walletId', '钱包ID')}
                </Label>
                <input 
                  id="wallet_id" 
                  name="wallet_id" 
                  value={formData.wallet_id || ''} 
                  onChange={handleInputChange} 
                  placeholder={t('agents.walletIdPlaceholder', '请输入钱包ID')}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
                />
              </div>
              
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="status" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">{t('agents.status', '当前状态')}</Label>
                <Select 
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger id="status" className="bg-white border-gray-300 text-gray-900 h-10">
                    <SelectValue placeholder={t('agents.selectStatus', '请选择状态')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-900">
                    <SelectItem value="1" className="text-gray-900">{t('agents.normal', '正常')}</SelectItem>
                    <SelectItem value="2" className="text-gray-900">{t('agents.frozen', '冻结')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="nickname" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">{t('agents.nickname', '客户名称')}</Label>
                <input 
                  id="nickname" 
                  name="nickname" 
                  value={formData.nickname} 
                  onChange={handleInputChange} 
                  placeholder={t('agents.namePlaceholder', '请输入客户名称')}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
                />
              </div>
              
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="tg_account" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">{t('agents.tgAccount', 'TG账号')}</Label>
                <input 
                  id="tg_account" 
                  name="tg_account" 
                  value={formData.tg_account} 
                  onChange={handleInputChange} 
                  placeholder={t('agents.tgPlaceholder', '请输入TG账号')}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
                />
              </div>
              
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="status" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">{t('agents.status', '当前状态')}</Label>
                <Select 
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger id="status" className="bg-white border-gray-300 text-gray-900 h-10">
                    <SelectValue placeholder={t('agents.selectStatus', '请选择状态')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-900">
                    <SelectItem value="1" className="text-gray-900">{t('agents.normal', '正常')}</SelectItem>
                    <SelectItem value="2" className="text-gray-900">{t('agents.frozen', '冻结')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          {displayMode === 1 && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="username" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">{t('agents.account', '账号')}</Label>
                  <input 
                    id="username" 
                    name="username" 
                    value={formData.username} 
                    onChange={handleInputChange} 
                    placeholder={t('agents.accountPlaceholder', '请输入账号')}
                    className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
                  />
                </div>
                
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="password" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">{t('agents.password', '密码')}</Label>
                  <input 
                    id="password" 
                    name="password"
                    type="password"
                    value={formData.password} 
                    onChange={handleInputChange} 
                    placeholder={t('agents.passwordPlaceholder', '请输入密码')}
                    className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
                  />
                </div>
              </div>
            </>
          )}
          
          {/* 第三行：底薪币种、底薪金额、开始底薪时间（三列）- 非系统模式 */}
          {formData.is_system === "0" && (
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="salary_currency" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">
                  {t('agents.salaryCurrency', '底薪币种')}
                </Label>
                <Select 
                  value={formData.salary_currency || ""}
                  onValueChange={(value) => handleSelectChange("salary_currency", value)}
                >
                  <SelectTrigger id="salary_currency" className="bg-white border-gray-300 text-gray-900 h-10">
                    <SelectValue placeholder={t('agents.selectSalaryCurrency', '请选择底薪币种')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-900">
                    {currencyList.map((currency) => (
                      <SelectItem key={currency.id} value={currency.currency} className="text-gray-900">
                        {currency.currency} {currency.desc && `(${currency.desc})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="salary_money" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">
                  {t('agents.salaryMoney', '底薪金额')}
                </Label>
                <input 
                  id="salary_money" 
                  name="salary_money" 
                  type="number"
                  step="0.01"
                  value={formData.salary_money || ''} 
                  onChange={handleInputChange} 
                  placeholder={t('agents.salaryMoneyPlaceholder', '请输入底薪金额')}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
                />
              </div>
              
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="salary_starttime" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">
                  {t('agents.salaryStarttime', '开始底薪时间')}
                </Label>
                <input 
                  id="salary_starttime" 
                  name="salary_starttime" 
                  type="datetime-local"
                  value={formData.salary_starttime ? timestampToDateTime(formData.salary_starttime) : ''} 
                  onChange={(e) => handleDateTimeChange("salary_starttime", e.target.value)} 
                  className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
                />
              </div>
            </div>
          )}
          
          {/* 第三行：系统最低服务费币种、金额、开始时间（三列）- 系统模式 */}
          {formData.is_system === "1" && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="system_fee_currency" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">
                    {t('agents.systemFeeCurrency', '系统最低服务费币种')}
                  </Label>
                  <Select 
                    value={formData.system_fee_currency || ""}
                    onValueChange={(value) => handleSelectChange("system_fee_currency", value)}
                  >
                    <SelectTrigger id="system_fee_currency" className="bg-white border-gray-300 text-gray-900 h-10">
                      <SelectValue placeholder={t('agents.selectSystemFeeCurrency', '请选择系统最低服务费币种')} />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-gray-900">
                      {currencyList.map((currency) => (
                        <SelectItem key={currency.id} value={currency.currency} className="text-gray-900">
                          {currency.currency} {currency.desc && `(${currency.desc})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="system_fee_money" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">
                    {t('agents.systemFeeMoney', '系统最低服务费金额')}
                  </Label>
                  <input 
                    id="system_fee_money" 
                    name="system_fee_money" 
                    type="number"
                    step="0.01"
                    value={formData.system_fee_money || ''} 
                    onChange={handleInputChange} 
                    placeholder={t('agents.systemFeeMoneyPlaceholder', '请输入系统最低服务费金额')}
                    className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
                  />
                </div>
                
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="system_fee_starttime" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">
                    {t('agents.systemFeeStarttime', '系统最低服务费开始时间')}
                  </Label>
                  <input 
                    id="system_fee_starttime" 
                    name="system_fee_starttime" 
                    type="datetime-local"
                    value={formData.system_fee_starttime ? timestampToDateTime(formData.system_fee_starttime) : ''} 
                    onChange={(e) => handleDateTimeChange("system_fee_starttime", e.target.value)} 
                    className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
                  />
                </div>
              </div>
              
            </>
          )}
          
          {/* 通道手续费配置 */}
          <div className="space-y-2">
            <Label className="text-gray-700 text-sm font-medium">
              {t('agents.channelFeeConfig', '通道手续费配置')}
            </Label>
            
            {/* 币种选择标签页 */}
            <div className="space-y-1.5">
              <Label className="text-gray-700 text-sm">
                {t('agents.selectCurrencyForChannels', '选择币种')}
              </Label>
              <div className="flex gap-2 flex-wrap">
                {currencyList.map((currency) => {
                  const hasChannels = allChannels.some(c => c.currency === currency.currency);
                  const isSelected = selectedChannelCurrencies.includes(currency.currency);
                  const isActive = activeChannelCurrency === currency.currency;
                  
                  return (
                    <button
                      key={currency.id}
                      type="button"
                      onClick={() => {
                        if (hasChannels) {
                          if (!isSelected) {
                            handleChannelCurrencyToggle(currency.currency, true);
                          }
                          setActiveChannelCurrency(currency.currency);
                        }
                      }}
                      className={`px-4 py-2 rounded-md text-sm border transition-colors cursor-pointer ${
                        isActive && isSelected
                          ? 'bg-black text-white border-black'
                          : isSelected
                          ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          : hasChannels
                          ? 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'
                          : 'bg-gray-100 text-gray-400 border-gray-200'
                      }`}
                    >
                      {currency.currency}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {isLoadingChannels ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : selectedChannelCurrencies.length === 0 ? (
              <p className="text-sm text-gray-500">{t('agents.selectCurrencyFirst', '请先选择币种')}</p>
            ) : !activeChannelCurrency ? (
              <p className="text-sm text-gray-500">{t('agents.selectCurrencyFirst', '请先选择币种')}</p>
            ) : allChannels.length === 0 ? (
              <p className="text-sm text-gray-500">{t('agents.noChannelData', '暂无通道数据')}</p>
            ) : (
              <div className="border border-gray-200 rounded-md p-3 bg-gray-50 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {/* 只显示当前选中币种的通道 */}
                  {(() => {
                    const currencyChannels = allChannels.filter(c => c.currency === activeChannelCurrency);
                    if (currencyChannels.length === 0) return null;
                    
                    // 按支付类型分组
                    const payTypeGroups: { [paytype: string]: typeof currencyChannels } = {};
                    currencyChannels.forEach(channel => {
                      if (!payTypeGroups[channel.paytype]) {
                        payTypeGroups[channel.paytype] = [];
                      }
                      payTypeGroups[channel.paytype].push(channel);
                    });
                    
                    return Object.entries(payTypeGroups).map(([paytype, channels]) => {
                      const paytypeLabel =
                        channels[0]?.paytype_name ||
                        t('agents.paytypeLabel', '支付类型 {paytype}').replace('{paytype}', paytype);
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
                                  const overtimePenalties = feeConfig.overtime_penalties || [];
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
                                  // 默认显示：通道信息
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                          {(() => {
                                            // 根据 channel_type 判断：1=代付，2=代收
                                            const channelType = channel.channel_type;
                                            if (channelType === 2 || channelType === "2") {
                                              return <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">{t('agents.channel.collect', '代收')}</span>;
                                            } else if (channelType === 1 || channelType === "1") {
                                              return <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">{t('agents.channel.payout', '代付')}</span>;
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
                                  // 编辑模式：显示所有手续费字段
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="flex flex-col">
                                          <div className="flex items-center gap-2">
                                            {(() => {
                                              // 根据 channel_type 判断：1=代付，2=代收
                                              const channelType = channel.channel_type;
                                              if (channelType === 2 || channelType === "2") {
                                                return <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">{t('agents.channel.collect', '代收')}</span>;
                                              } else if (channelType === 1 || channelType === "1") {
                                                return <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">{t('agents.channel.payout', '代付')}</span>;
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
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-xs"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingChannelId(null);
                                        }}
                                      >
                                        {t('common.close', '收起')}
                                      </Button>
                                    </div>
                                    
                                    {/* 费率输入框 - 右侧显示 */}
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-1">
                                        <Label htmlFor={`channel-${channel.channelid}-receive-commission`} className="text-xs text-gray-600">
                                          {t('agents.channel.receiveCommission', '代收手续费 (%)')}
                                        </Label>
                                        <input
                                          id={`channel-${channel.channelid}-receive-commission`}
                                          type="number"
                                          step="0.01"
                                          value={feeConfig.receive_commission}
                                          onChange={(e) => handleChannelFeeChange(channel.channelid, "receive_commission", e.target.value)}
                                          placeholder={t('agents.channel.receiveCommissionPlaceholder', '代收手续费')}
                                          className="w-full h-9 px-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label htmlFor={`channel-${channel.channelid}-receive-fee`} className="text-xs text-gray-600">
                                          {t('agents.channel.receiveFee', '代收单笔固定手续费')}
                                        </Label>
                                        <input
                                          id={`channel-${channel.channelid}-receive-fee`}
                                          type="number"
                                          step="0.01"
                                          value={feeConfig.receive_fee}
                                          onChange={(e) => handleChannelFeeChange(channel.channelid, "receive_fee", e.target.value)}
                                          placeholder={t('agents.channel.receiveFeePlaceholder', '请输入代收固定手续费')}
                                          className="w-full h-9 px-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label htmlFor={`channel-${channel.channelid}-payment-commission`} className="text-xs text-gray-600">
                                          {t('agents.channel.paymentCommission', '代付手续费 (%)')}
                                        </Label>
                                        <input
                                          id={`channel-${channel.channelid}-payment-commission`}
                                          type="number"
                                          step="0.01"
                                          value={feeConfig.payment_commission}
                                          onChange={(e) => handleChannelFeeChange(channel.channelid, "payment_commission", e.target.value)}
                                          placeholder={t('agents.channel.paymentCommissionPlaceholder', '代付手续费')}
                                          className="w-full h-9 px-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label htmlFor={`channel-${channel.channelid}-payment-fee`} className="text-xs text-gray-600">
                                          {t('agents.channel.paymentFee', '代付单笔固定手续费')}
                                        </Label>
                                        <input
                                          id={`channel-${channel.channelid}-payment-fee`}
                                          type="number"
                                          step="0.01"
                                          value={feeConfig.payment_fee}
                                          onChange={(e) => handleChannelFeeChange(channel.channelid, "payment_fee", e.target.value)}
                                          placeholder={t('agents.channel.paymentFeePlaceholder', '请输入代付固定手续费')}
                                          className="w-full h-9 px-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                    </div>
                                    
                                    {/* 超时罚款配置表格 */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <Label className="text-xs text-gray-600 font-medium">
                                            {t('agents.channel.overtimePenalty', '超时罚款配置')}
                                          </Label>
                                          <Button
                                            type="button"
                                            variant="default"
                                            size="sm"
                                            className="h-7 px-3 text-xs bg-green-500 hover:bg-green-600 text-white"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleAddOvertimePenalty(channel.channelid);
                                            }}
                                          >
                                            <Plus className="h-3 w-3 mr-1" />
                                            {t('common.add', '添加')}
                                          </Button>
                                        </div>
                                        <div className="border border-gray-200 rounded-md bg-gray-50 overflow-hidden">
                                          <table className="w-full">
                                            <thead>
                                              <tr className="bg-gray-200">
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b border-gray-300">
                                                  {t('agents.channel.overtimeMinutes', '超时(分钟)')}
                                                </th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b border-gray-300">
                                                  {t('agents.channel.penaltyPercentage', '手续费惩罚(%)')}
                                                </th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b border-gray-300">
                                                  {t('agents.channel.fixedPenalty', '固定罚款金额')}
                                                </th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b border-gray-300 w-12">
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {overtimePenalties.length === 0 ? (
                                                <tr>
                                                  <td colSpan={4} className="px-3 py-4 text-center text-xs text-gray-500">
                                                    {t('agents.channel.noOvertimePenalty', '暂无超时罚款配置，点击添加按钮添加')}
                                                  </td>
                                                </tr>
                                              ) : (
                                                overtimePenalties.map((penalty, index) => (
                                                  <tr key={index} className="border-b border-gray-200 last:border-b-0">
                                                    <td className="px-3 py-2">
                                                      <input
                                                        type="number"
                                                        step="1"
                                                        value={penalty.overtime_minutes}
                                                        onChange={(e) => handleOvertimePenaltyChange(channel.channelid, index, "overtime_minutes", e.target.value)}
                                                        placeholder={t('agents.channel.overtimeMinutesPlaceholder', '分钟')}
                                                        className="w-full h-8 px-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
                                                        onClick={(e) => e.stopPropagation()}
                                                      />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                      <input
                                                        type="number"
                                                        step="0.01"
                                                        value={penalty.penalty_percentage}
                                                        onChange={(e) => handleOvertimePenaltyChange(channel.channelid, index, "penalty_percentage", e.target.value)}
                                                        placeholder={t('agents.channel.penaltyPercentagePlaceholder', '百分比')}
                                                        className="w-full h-8 px-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
                                                        onClick={(e) => e.stopPropagation()}
                                                      />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                      <input
                                                        type="number"
                                                        step="0.01"
                                                        value={penalty.fixed_penalty}
                                                        onChange={(e) => handleOvertimePenaltyChange(channel.channelid, index, "fixed_penalty", e.target.value)}
                                                        placeholder={t('agents.channel.fixedPenaltyPlaceholder', '金额')}
                                                        className="w-full h-8 px-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
                                                        onClick={(e) => e.stopPropagation()}
                                                      />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                      <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleRemoveOvertimePenalty(channel.channelid, index);
                                                        }}
                                                      >
                                                        <Trash2 className="h-3 w-3 text-red-500" />
                                                      </Button>
                                                    </td>
                                                  </tr>
                                                ))
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
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
            )}
          </div>
        </div>
        
        <SheetFooter className="flex-shrink-0 pt-3 px-6 pb-4 border-t bg-white">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel', '取消')}
          </Button>
          <Button onClick={handleSubmit}>
            {t('common.save', '保存')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}