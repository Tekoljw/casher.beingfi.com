import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Eye, 
  RotateCcw, 
  Ban, 
  Check,
  X,
  Plus,
  ChevronDown,
  Edit,
  Trash,
  Play,
  Pause,
  QrCode,
  User,
  Shield
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useCurrencyList } from "@/hooks/use-currency-list";
import { useChannelData } from "@/hooks/use-channel-data";
import { useAllChannelDataList } from "@/hooks/use-all-channel-data-list";
import { useAccountData, AccountItem } from "@/hooks/use-account-data";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AccountManagement() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("");
  const [payTypeFilter, setPayTypeFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [freezeStatusFilter, setFreezeStatusFilter] = useState<string>(""); // 冻结状态筛选：空字符串=全部，"0"=冻结，"1"=启用
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AccountItem | null>(null);
  const [accountDetailsOpen, setAccountDetailsOpen] = useState(false);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [addAccount, setAddAccount] = useState<AccountItem | null>(null);
  const [editAccount, setEditAccount] = useState<AccountItem | null>(null);
  const [editAccountOpen, setEditAccountOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [suspendConfirmOpen, setSuspendConfirmOpen] = useState(false);
  const [qrCodeViewOpen, setQrCodeViewOpen] = useState(false);
  const [ownerInfoViewOpen, setOwnerInfoViewOpen] = useState(false);
  const [accountListOpen, setAccountListOpen] = useState(false);
  const [allAccounts, setAllAccounts] = useState<AccountItem[]>([]);
  const [channelTitleMap, setChannelTitleMap] = useState<{ [channelid: string]: string }>({});
  const [isLoadingAllAccounts, setIsLoadingAllAccounts] = useState(false);
  const [expandedAccounts, setExpandedAccounts] = useState<{[key: string]: boolean}>({});
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]); // 添加账户时选中的通道
  const [editSelectedChannels, setEditSelectedChannels] = useState<string[]>([]); // 编辑账户时选中的通道
  
  // 统一风控相关状态
  const [riskControlOpen, setRiskControlOpen] = useState(false);
  const [riskControlCurrency, setRiskControlCurrency] = useState<string>("");
  const [riskControlPayType, setRiskControlPayType] = useState<string>(""); // 选中的支付方式ID
  const [riskControlChannel, setRiskControlChannel] = useState<string>(""); // 选中的通道ID（单选）
  const [allowStaffModify, setAllowStaffModify] = useState(false);
  const [riskControlData, setRiskControlData] = useState({
    all_money: "", // 当天的总金额（每日限额）
    paying_num: "", // 当前的支付次数（每日调用次数）
    min_money: "", // 风控的最小金额
    max_money: "", // 风控的最大金额
    max_amount: "", // 最大账户余额
    min_success_rate: "", // 风控的最小成功率 (%)
  });
  const [isLoadingRiskControl, setIsLoadingRiskControl] = useState(false);
  
  // 获取统一风控的支付方式列表（基于币种）
  const { data: riskControlPayTypeData } = useChannelData(riskControlCurrency);
  // 获取统一风控的通道列表（基于支付方式）
  const { data: riskControlChannelData } = useAllChannelDataList(riskControlPayType);
  
  // 获取风控数据
  const fetchRiskControlData = async (channelId: string) => {
    if (!channelId) {
      // 如果没有通道ID，重置数据并允许输入
      setRiskControlData({
        all_money: "",
        paying_num: "",
        min_money: "",
        max_money: "",
        max_amount: "",
        min_success_rate: "",
      });
      setAllowStaffModify(false);
      setIsLoadingRiskControl(false);
      return;
    }
    setIsLoadingRiskControl(true);
    try {
      const result = await apiRequest('POST', '/Api/Index/getUserPaytypeControl', {
        payparams_id: channelId
      });
      if (result.code === 0 && result.data) {
        setRiskControlData({
          all_money: result.data.all_money || "",
          paying_num: result.data.paying_num || "",
          min_money: result.data.min_money || "",
          max_money: result.data.max_money || "",
          max_amount: result.data.max_amount || "",
          min_success_rate: result.data.min_success_rate || "",
        });
        setAllowStaffModify(result.data.sale_stauts === "1" || result.data.sale_stauts === 1);
      } else {
        // 如果没有数据，重置为空，允许用户输入新数据
        setRiskControlData({
          all_money: "",
          paying_num: "",
          min_money: "",
          max_money: "",
          max_amount: "",
          min_success_rate: "",
        });
        setAllowStaffModify(false);
      }
    } catch (error: any) {
      // 获取失败时，也允许用户输入新数据
      setRiskControlData({
        all_money: "",
        paying_num: "",
        min_money: "",
        max_money: "",
        max_amount: "",
        min_success_rate: "",
      });
      setAllowStaffModify(false);
      toast({
        title: '获取风控数据失败',
        description: error.message || '获取风控配置时出错，您可以手动输入配置',
        variant: "destructive",
      });
    } finally {
      setIsLoadingRiskControl(false);
    }
  };
  
  // 当选择通道时，自动获取风控数据
  useEffect(() => {
    if (riskControlChannel) {
      fetchRiskControlData(riskControlChannel);
    }
  }, [riskControlChannel]);
  
  const { data: currencyList = [], isLoading: isCurrencyLoading, refetch: refetchCurrency } = useCurrencyList();
  const { data: payTypeData, isLoading: isPayTypeDataLoading } = useChannelData(currencyFilter);
  const { data: channelAllData, isLoading: isChannelDataLoading } = useAllChannelDataList(payTypeFilter);
  
  const otcUserData = JSON.parse(localStorage.getItem('otcUserData') as string);
  
  useEffect(() => {
    if (currencyList.length > 0 && !currencyFilter) {
      setCurrencyFilter(currencyList[0].currency);
    }
  }, [currencyList, currencyFilter]);
  
  useEffect(() => {
    const payTypeList = payTypeData?.data || [];
    if (payTypeList.length > 0) {
      if (!payTypeFilter) {
        setPayTypeFilter(payTypeList[0].id);
      }
    } else {
      // If payTypeData?.data is empty, clear the channelFilter
      setChannelFilter('');
    }
  }, [payTypeData, payTypeFilter, setChannelFilter]);

    useEffect(() => {
      const channeList = channelAllData?.data || [];
      if (channeList.length > 0) {
        if (!channelFilter) {
          setChannelFilter(channeList[0].channelid);
        }
      } else {
        // If channelAllData?.data is empty, clear the channel filter
        setChannelFilter('');
      }
    }, [channelAllData, channelFilter, setChannelFilter]);

    // 获取订单数据
    const {
      data: accountData,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
      isLoading: isAccountDataLoading,
      refetch
    } = useAccountData({
      channelid: channelFilter,
      check_status: freezeStatusFilter || undefined // 如果为空字符串则传递 undefined
    }); 
  
  // 展开或折叠账户卡片
  const toggleAccountExpand = (accountId: string, isFrozen?: boolean) => {
    // 如果是冻结状态且用户不是供应商（otcRole !== '1'），则不允许展开
    const isSupplier = localStorage.getItem('otcRole') === '1';
    if (isFrozen && !isSupplier) {
      toast({
        title: t('otc.accounts.operationFailed'),
        description: '冻结状态的账户只有供应商可以查看详情',
        variant: "destructive",
      });
      return;
    }
    
    setExpandedAccounts(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };
  
  // 处理编辑账户
  const handleOpenEditAccount = (account: AccountItem) => {
    // 解析通道ID字符串为数组（如果存在）
    const channelIds = account.channelid ? account.channelid.split(',').map(id => id.trim()).filter(id => id) : [];
    setEditSelectedChannels(channelIds);
    setEditAccount({
      ...account,
      userid: otcUserData.role === '2'?  otcUserData.id: account.userid,
      currency: account.currency?.trim() || '', // 清理空格确保匹配
      receive_status: account.receive_status || '1', // 默认开启
      payment_status: account.payment_status || '1', // 默认开启
      check_status: account.check_status || '1', // 默认启用（1=启用，0=冻结）
      is_login: account.is_login || '1', // 默认可登录（1=可登录，0=不可登录）
      owner_name: account.owner_name || '',
      owner_idcard: account.owner_idcard || '',
      owner_mobile: account.owner_mobile || '',
      owner_photo: account.owner_photo || '',
      owner_idcard_img1: account.owner_idcard_img1 || '',
      owner_idcard_img2: account.owner_idcard_img2 || ''
    });
    setEditAccountOpen(true);
  };
  
  // 处理暂停/启用账户
  const handleToggleSuspendAccount = (account: AccountItem) => {
    setSelectedAccount(account);
    setSuspendConfirmOpen(true);
  };
  
  // 确认暂停/启用账户
  const confirmToggleSuspend = async () => {
    try {
      if (!selectedAccount) return;

      // 根据当前状态确定新的状态值（0:冻结, 1:激活）
      const newStatus = selectedAccount.status === "0" ? 1 : 0;

      const response = await apiRequest('POST', '/Api/Index/payParamsEdit', {
        id: selectedAccount.id,
        status: newStatus,
        // paytype 和 channelid 也可能是必须的参数，从 selectedAccount 中获取
        paytype: selectedAccount.paytype,
        channelid: selectedAccount.channelid,
        check_status: selectedAccount.check_status || '1', // 保持原有的冻结状态（1=启用，0=冻结）
      });

      if (response.code === 0) {
        toast({
          title: t('otc.accounts.operationSuccess'),
          variant: "default",
        });
        setSuspendConfirmOpen(false);
        refetch(); // 刷新列表数据
      } else {
        toast({
          title: response.msg || t('otc.accounts.operationFailed'),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('切换账户状态失败:', error);
      toast({
          title: error.message || t('otc.accounts.operationFailed'),
        variant: "destructive",
      });
    }
  };
  
  // 处理切换冻结状态
  const handleToggleFreezeStatus = async (account: AccountItem) => {
    // 只有供应商（otcRole === '1'）才能操作冻结状态
    const isSupplier = localStorage.getItem('otcRole') === '1';
    if (!isSupplier) {
      toast({
        title: t('otc.accounts.operationFailed'),
        description: '只有供应商可以冻结或启用账户',
        variant: "destructive",
      });
      return;
    }

    try {
      // 根据当前冻结状态确定新的状态值（0:冻结, 1:启用）
      const newFreezeStatus = account.check_status === "1" ? "0" : "1";

      const response = await apiRequest('POST', '/Api/Index/payParamsEdit', {
        id: account.id,
        check_status: newFreezeStatus,
        // 保持其他必需参数不变
        paytype: account.paytype,
        channelid: account.channelid,
        status: account.status || '1',
      });

      if (response.code === 0) {
        toast({
          title: t('otc.accounts.operationSuccess'),
          variant: "default",
        });
        refetch(); // 刷新列表数据
      } else {
        toast({
          title: response.msg || t('otc.accounts.operationFailed'),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('切换冻结状态失败:', error);
      toast({
          title: error.message || t('otc.accounts.operationFailed'),
        variant: "destructive",
      });
    }
  };
  
  // 处理删除账户
  const handleDeleteAccount = (account: AccountItem) => {
    setSelectedAccount(account);
    setDeleteConfirmOpen(true);
  };
  
  // 确认删除账户
  const confirmDeleteAccount = async () => {
    try {
      if (!selectedAccount) return;

      const response = await apiRequest('POST', '/Api/Index/payParamsDel', {
        id: selectedAccount.id
      });

      if (response.code === 0) {
        toast({
          title: t('otc.accounts.deleteSuccess'),
          variant: "default",
        });
        setDeleteConfirmOpen(false);
        refetch(); // 刷新列表数据
      } else {
        toast({
          title: response.msg || t('otc.accounts.deleteFailed'),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('删除账户失败:', error);
      toast({
          title: error.message || t('otc.accounts.deleteFailed'),
        variant: "destructive",
      });
    }
  };

  // 处理账户详情查看
  const handleViewAccount = (account: AccountItem) => {
    setSelectedAccount(account);
    setAccountDetailsOpen(true);
  };
  
  // 处理查看二维码
  const handleViewQrCode = (account: AccountItem) => {
    setSelectedAccount(account);
    setQrCodeViewOpen(true);
  };

  // 处理查看户主信息
  const handleViewOwnerInfo = () => {
    setOwnerInfoViewOpen(true);
  };

  // 处理查看所有账户详情
  const handleViewAllAccounts = async () => {
    setAccountListOpen(true);
    setIsLoadingAllAccounts(true);
    try {
      // 获取所有渠道的账户数据
      const accountsList: AccountItem[] = [];
      const channelMap: { [channelid: string]: string } = {};
      
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
                  // 获取每个通道的账户列表
                  for (const channel of channelResponse.data) {
                    const channelId = channel.channelid || channel.id;
                    const channelTitle = channel.channel_title || channel.title || channel.name || '';
                    
                    // 建立通道ID到通道名称的映射
                    if (channelId) {
                      channelMap[channelId] = channelTitle;
                    }
                    
                    try {
                      const accountResponse = await apiRequest('POST', `/Api/Index/payParams?pageNum=1&pageSize=1000`, {
                        channelid: channelId
                      });
                      
                      if (accountResponse.code === 0 && accountResponse.data?.list) {
                        accountsList.push(...accountResponse.data.list);
                      }
                    } catch (error) {
                      console.error(`获取通道 ${channelId} 的账户列表失败:`, error);
                    }
                  }
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
      
      setAllAccounts(accountsList);
      setChannelTitleMap(channelMap);
    } catch (error) {
      console.error('获取账户列表失败:', error);
        toast({
          title: t('otc.accounts.getAccountListFailed'),
          description: error instanceof Error ? error.message : t('otc.accounts.unknownError'),
          variant: "destructive"
        });
    } finally {
      setIsLoadingAllAccounts(false);
    }
  };

  // 处理添加账户表单值更新
  const handleAddAccountChange = (field: string, value: string) => {
    setAddAccount(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [field]: value
      };
    });
  };

  // 处理编辑账户表单值更新
  const handleEditAccountChange = (field: string, value: string) => {
    setEditAccount(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [field]: value
      };
    });
  };

  // 处理添加账户
  const handleAddAccount = async () => {
    try {
      if (!addAccount) return;
      
      // 表单验证
      if (!addAccount.sales_name) {
        toast({
          title: t('otc.accounts.enterAgentRequired'),
          variant: "destructive",
        });
        return;
      }
      if (!addAccount.userid) {
        toast({
          title: t('otc.accounts.enterUseridRequired'),
          variant: "destructive",
        });
        return;
      }
      if (!addAccount.currency) {
        toast({
          title: t('otc.accounts.selectCurrencyRequired'),
          variant: "destructive",
        });
        return;
      }
      if (!addAccount.paytype) {
        toast({
          title: t('otc.accounts.selectAccountTypeRequired'),
          variant: "destructive",
        });
        return;
      }
      if (selectedChannels.length === 0) {
        toast({
          title: t('otc.accounts.selectChannelRequired'),
          variant: "destructive",
        });
        return;
      }
      if (!addAccount.appid) {
        toast({
          title: t('otc.accounts.enterAccountNumberRequired'),
          variant: "destructive",
        });
        return;
      }
      if (!addAccount.truename) {
        toast({
          title: t('otc.accounts.enterAccountHolderNameRequired'),
          variant: "destructive",
        });
        return;
      }
      if (!addAccount.all_money) {
        toast({
          title: t('otc.accounts.enterDailyLimitRequired'),
          variant: "destructive",
        });
        return;
      }
      if (!addAccount.min_money) {
        toast({
          title: t('otc.accounts.enterMinAmountRequired'),
          variant: "destructive",
        });
        return;
      }
      if (!addAccount.max_money) {
        toast({
          title: t('otc.accounts.enterMaxAmountRequired'),
          variant: "destructive",
        });
        return;
      }
      if (!addAccount.subject) {
        toast({
          title: t('otc.accounts.enterSubjectRequired'),
          variant: "destructive",
        });
        return;
      }

      const response = await apiRequest('POST', '/Api/Index/payParamsEdit', {
        ...addAccount,
        channelid: selectedChannels.join(','), // 将选中的通道ID用逗号连接
        status: "1", // 默认启用状态
        receive_status: addAccount.receive_status || '1', // 默认开启
        payment_status: addAccount.payment_status || '1', // 默认开启
        check_status: addAccount.check_status || '1', // 默认启用（1=启用，0=冻结）
        is_login: addAccount.is_login || '1' // 默认可登录（1=可登录，0=不可登录）
      });

      if (response.code === 0) {
        toast({
          title: t('otc.accounts.operationSuccess'),
          variant: "default",
        });
        setAddAccountOpen(false);
        setAddAccount(null); // 清空表单
        setSelectedChannels([]); // 重置选中的通道
        refetch(); // 刷新列表数据
      } else {
        toast({
          title: response.msg || t('otc.accounts.operationFailed'),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('添加账户失败:', error);
      toast({
          title: error.message || t('otc.accounts.operationFailed'),
        variant: "destructive",
      });
    }
  };

  // 处理编辑账户提交
  const handleEditAccountSubmit = async () => {
    try {
      if (!editAccount) return;

      // 表单验证
      if (!editAccount.sales_name) {
        toast({
          title: t('otc.accounts.enterAgentRequired'),
          variant: "destructive",
        });
        return;
      }
      if (!editAccount.userid) {
        toast({
          title: t('otc.accounts.enterUseridRequired'),
          variant: "destructive",
        });
        return;
      }
      if (!editAccount.currency) {
        toast({
          title: t('otc.accounts.selectCurrencyRequired'),
          variant: "destructive",
        });
        return;
      }
      if (!editAccount.paytype) {
        toast({
          title: t('otc.accounts.selectAccountTypeRequired'),
          variant: "destructive",
        });
        return;
      }
      if (editSelectedChannels.length === 0) {
        toast({
          title: t('otc.accounts.selectChannelRequired'),
          variant: "destructive",
        });
        return;
      }
      if (!editAccount.appid) {
        toast({
          title: t('otc.accounts.enterAccountNumberRequired'),
          variant: "destructive",
        });
        return;
      }
      if (!editAccount.truename) {
        toast({
          title: t('otc.accounts.enterAccountHolderNameRequired'),
          variant: "destructive",
        });
        return;
      }
      if (!editAccount.all_money) {
        toast({
          title: t('otc.accounts.enterDailyLimitRequired'),
          variant: "destructive",
        });
        return;
      }
      if (!editAccount.min_money) {
        toast({
          title: t('otc.accounts.enterMinAmountRequired'),
          variant: "destructive",
        });
        return;
      }
      if (!editAccount.max_money) {
        toast({
          title: t('otc.accounts.enterMaxAmountRequired'),
          variant: "destructive",
        });
        return;
      }
      if (!editAccount.subject) {
        toast({
          title: t('otc.accounts.enterSubjectRequired'),
          variant: "destructive",
        });
        return;
      }
      
      const response = await apiRequest('POST', '/Api/Index/payParamsEdit', {
        ...editAccount,
        channelid: editSelectedChannels.join(','), // 将选中的通道ID用逗号连接
        check_status: editAccount.check_status || '1' // 保持或设置冻结状态（1=启用，0=冻结）
      });

      if (response.code === 0) {
        toast({
          title: t('otc.accounts.operationSuccess'),
          variant: "default",
        });
        setEditAccountOpen(false);
        setEditAccount(null); // 清空表单
        setEditSelectedChannels([]); // 重置选中的通道
        refetch(); // 刷新列表数据
      } else {
        toast({
          title: response.msg || t('otc.accounts.operationFailed'),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('编辑账户失败:', error);
      toast({
          title: error.message || t('otc.accounts.operationFailed'),
        variant: "destructive",
      });
    }
  };

  // 处理图片上传（通用函数）
  const handleImageUpload = async (file: File, fieldName: string, isEdit: boolean = false) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiRequest('POST', '/Api/Index/uploadImage', formData);

      if (response.code === 0) {
        const path = response.data.path;
        if (isEdit) {
          setEditAccount(prev => {
            if (!prev) return null;
            return {
              ...prev,
              [fieldName]: path
            };
          });
        } else {
          setAddAccount(prev => {
            if (!prev) return null;
            return {
              ...prev,
              [fieldName]: path
            };
          });
        }
        toast({
          title: t('otc.accounts.uploadSuccess'),
          variant: "default",
        });
      } else {
        toast({
          title: response.msg || t('otc.accounts.uploadFailed'),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('上传图片失败:', error);
      toast({
          title: error.message || t('otc.accounts.uploadFailed'),
        variant: "destructive",
      });
    }
  };

  // 处理二维码上传（保持向后兼容）
  const handleQrCodeUpload = async (file: File, isEdit: boolean = false) => {
    await handleImageUpload(file, 'qrcode', isEdit);
  };

  // 处理文件选择（通用函数）
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, fieldName: string, isEdit: boolean = false) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
        toast({
          title: t('otc.accounts.selectImageFile'),
          variant: "destructive",
        });
      return;
    }

    // 验证文件大小（限制为2MB）
    if (file.size > 2 * 1024 * 1024) {
        toast({
          title: t('otc.accounts.imageSizeExceeded'),
          variant: "destructive",
        });
      return;
    }

    handleImageUpload(file, fieldName, isEdit);
    // 清空 input 值，允许重复选择同一文件
    event.target.value = '';
  };

  return (
    <div className="p-6 bg-white min-h-[calc(100vh-64px)] rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('otc.accounts.paymentAccounts')}</h2>
        
        <div className="flex items-center gap-4">
          {/* <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black" />
            <Input 
              placeholder="请输入银行或账号名称" 
              className="pl-10 h-10 w-64 bg-gray-50 border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div> */}
          
          {/* 只有供应商才显示统一风控按钮 */}
          {localStorage.getItem('otcRole') === '1' && (
            <Button 
              variant="outline"
              className="h-10 bg-white border-black text-black"
              onClick={() => {
                const currentCurrency = currencyFilter || currencyList[0]?.currency || "";
                setRiskControlCurrency(currentCurrency);
                setRiskControlPayType("");
                setRiskControlChannel("");
                setRiskControlData({
                  all_money: "",
                  paying_num: "",
                  min_money: "",
                  max_money: "",
                  max_amount: "",
                  min_success_rate: "",
                });
                setAllowStaffModify(false);
                setIsLoadingRiskControl(false);
                setRiskControlOpen(true);
              }}
            >
              <Shield className="hidden md:inline h-4 w-4 mr-1" />
              统一风控
            </Button>
          )}
          
          <Button 
            variant="outline"
            className="h-10 bg-white border-black text-black"
            onClick={() => {
              setAddAccount({
                channelid: '',
                sales_name: '',
                currency: '',
                paytype: '',
                appid: '',
                truename: '',
                all_money: '',
                min_money: '',
                max_money: '',
                qrcode: '',
                userid: otcUserData.role === '2'?  otcUserData.id: '',
                subject: '',
                max_amount: '',
                receive_status: '1', // 默认开启
                payment_status: '1', // 默认开启
                check_status: '1', // 默认启用（1=启用，0=冻结）
                is_login: '1', // 默认可登录（1=可登录，0=不可登录）
                owner_name: '',
                owner_idcard: '',
                owner_mobile: '',
                owner_photo: '',
                owner_idcard_img1: '',
                owner_idcard_img2: ''
              });
              setSelectedChannels([]); // 重置选中的通道
              setAddAccountOpen(true)
            }}
          >
            <Plus className="hidden md:inline h-4 w-4 mr-1" />
            {t('otc.accounts.addAccount')}
          </Button>
        </div>
      </div>
      
      {/* 移除团队一级页签 */}

      {/* 币种筛选选项卡 */}
      <div className="bg-gray-50 rounded-lg p-2 mb-4">
        <div className="flex gap-0.5 rounded-lg">
          { currencyList.map((item, index)=> {
            return (
            <button
              key={index}
              className={`px-3 py-1 rounded-md text-sm ${currencyFilter === item.currency ? 'bg-white shadow-sm text-black' : 'text-black'}`}
              onClick={() => setCurrencyFilter(item.currency)}
            >
              {item.currency}
            </button>
            )  
          })}
        </div>
      </div>

      {/* 冻结状态筛选选项卡 */}
      <div className="bg-gray-50 rounded-lg p-2 mb-4">
        <div className="flex gap-0.5 rounded-lg">
          <button
            className={`px-3 py-1 rounded-md text-sm ${freezeStatusFilter === "" ? 'bg-white shadow-sm text-black' : 'text-black'}`}
            onClick={() => setFreezeStatusFilter("")}
          >
            全部
          </button>
          <button
            className={`px-3 py-1 rounded-md text-sm ${freezeStatusFilter === "1" ? 'bg-white shadow-sm text-black' : 'text-black'}`}
            onClick={() => setFreezeStatusFilter("1")}
          >
            启用
          </button>
          <button
            className={`px-3 py-1 rounded-md text-sm ${freezeStatusFilter === "0" ? 'bg-white shadow-sm text-black' : 'text-black'}`}
            onClick={() => setFreezeStatusFilter("0")}
          >
            冻结
          </button>
        </div>
      </div>

      {/* Account type tabs */}
      <div className="bg-gray-50 rounded-lg p-2 mb-6">
        <div className="gap-0.5 rounded-lg">
            { payTypeData?.data?.map((item: any, index: number)=> {
              return (
                <button
                  key={item.id || index}
                  className={`px-3 mb-2 py-1 rounded-md text-sm ${payTypeFilter === item.id ? 'bg-white shadow-sm text-black' : 'text-black'}`}
                  onClick={() => setPayTypeFilter(item.id)}
                >
                 {item.name}
                </button>
              )  
          })}
        </div>
      </div>

       <div className="bg-gray-50 rounded-lg p-2 mb-6">
        <div className="gap-0.5 rounded-lg">
            { channelAllData?.data?.map((item: any, index: number)=> {
              return (
                <button
                  key={item.channelid || index}
                  className={`px-3 mb-2 py-1 rounded-md text-sm ${channelFilter === item.channelid ? 'bg-white shadow-sm text-black' : 'text-black'}`}
                  onClick={() => setChannelFilter(item.channelid)}
                >
                 {item.channel_title}
                </button>
              )  
          })}
        </div>
      </div>

      {/* Account status explanation */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg text-sm text-black">
        <p>{t('otc.accounts.cardColorMeaning')}:</p>
        <ul className="flex flex-wrap gap-4 mt-2">
          <li className="flex items-center">
            <div className="w-4 h-4 rounded bg-green-100 mr-2"></div>
            <span>{t('otc.accounts.greenActiveCollection')}</span>
          </li>
          <li className="flex items-center">
            <div className="w-4 h-4 rounded bg-red-100 mr-2"></div>
            <span>{t('otc.accounts.redRiskControl')}</span>
          </li>
          <li className="flex items-center">
            <div className="w-4 h-4 rounded bg-gray-100 mr-2"></div>
            <span>{t('otc.accounts.graySuspended')}</span>
          </li>
          <li className="flex items-center">
            <div className="w-4 h-4 rounded bg-yellow-100 mr-2"></div>
            <span>{t('otc.accounts.yellowLowSuccessRate')}</span>
          </li>
        </ul>
      </div>

      {/* Account cards grid */}
      {isCurrencyLoading || isPayTypeDataLoading || isChannelDataLoading || isAccountDataLoading ? (
        <div className="col-span-full flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (!channelFilter && !isAccountDataLoading) || (accountData?.pages.flatMap(page => page.data.list).length === 0) ? (
        <div className="col-span-full flex justify-center items-center h-40 text-gray-500">
          {t('otc.accounts.noAccounts')}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {accountData?.pages.flatMap(page => page.data.list).map(account => {
            // 获取当前通道类型
            const currentChannel = channelAllData?.data?.find((ch: any) => ch.channelid === channelFilter);
            const channelType = currentChannel?.channel_type;
            
            // 根据通道类型和相应状态字段计算有效状态
            // 如果status不是"1"（总开关未打开），则显示为未启用状态
            // 如果status是"1"，则根据通道类型判断：
            // - 代付通道（channel_type === '1' 或 1）：根据payment_status判断，如果都为"1"则启用，否则未启用
            // - 代收通道（channel_type === '2' 或 2）：根据receive_status判断，如果都为"1"则启用，否则未启用
            const getEffectiveStatus = () => {
              const statusValue = String(account.status || '0');
              
              // 如果总开关未打开，返回未启用状态
              if (statusValue !== '1') {
                return '0'; // 总开关未打开，显示未启用状态
              }
              
              // 总开关打开，根据通道类型判断
              if (channelType === '1' || channelType === 1) {
                // 代付通道：根据payment_status判断
                const paymentStatus = String(account.payment_status || '0');
                return paymentStatus === '1' ? '1' : '0'; // 都为打开则启用，否则未启用
              } else if (channelType === '2' || channelType === 2) {
                // 代收通道：根据receive_status判断
                const receiveStatus = String(account.receive_status || '0');
                return receiveStatus === '1' ? '1' : '0'; // 都为打开则启用，否则未启用
              }
              
              // 如果没有通道类型信息，默认使用总开关状态
              return statusValue === '1' ? '1' : '0';
            };
            
            const effectiveStatus = getEffectiveStatus();
            
            // 检查是否为冻结状态（check_status === "0" 表示冻结）
            const isFrozen = account.check_status === "0";
            
            // 计算账户余额剩余百分比
            const calculateBalancePercentage = () => {
              const amount = parseFloat(String(account.amount || 0));
              const maxAmount = parseFloat(String(account.max_amount || 0));
              
              if (maxAmount === 0) return null; // 如果没有最大余额，返回null
              
              // 剩余额度 = 最大账户余额 - 余额
              const remaining = maxAmount - amount;
              // 剩余百分比 = (剩余额度 / 最大账户余额) * 100
              const percentage = (remaining / maxAmount) * 100;
              return percentage;
            };
            
            const balancePercentage = calculateBalancePercentage();
            
            // 获取成功率
            const successRate = account.success_rate !== undefined && account.success_rate !== null 
              ? parseFloat(String(account.success_rate)) 
              : null;
            
            // 判断是否应该显示红色（成功率 < 10% 或 剩余收款额度 < 10%）
            const shouldShowRed = (successRate !== null && successRate < 10) || 
                                  (balancePercentage !== null && balancePercentage < 10);
            
            // 判断是否应该显示黄色（成功率 < 20% 或 剩余收款额度 < 20%）
            const shouldShowYellow = (successRate !== null && successRate < 20) || 
                                     (balancePercentage !== null && balancePercentage < 20);
            
            // 判断是否已暂停（账户状态为关闭或未启用）
            const isPaused = effectiveStatus === "0";
            
            // 获取账户状态对应的样式（优先级：冻结/暂停 > 成功率/剩余额度 < 10% > 成功率/剩余额度 < 20% > 活跃收款）
            const getBgColor = () => {
              // 灰色：已暂停 / 已冻结
              if (isFrozen || isPaused) {
                return "bg-gray-50";
              }
              
              // 红色：成功率 / 剩余收款额度 低于10%
              if (shouldShowRed) {
                return "bg-red-50";
              }
              
              // 黄色：成功率 / 剩余收款额度 低于20%
              if (shouldShowYellow) {
                return "bg-yellow-50";
              }
              
              // 绿色：活跃收款（默认）
              return "bg-green-50";
            };
            
            const getTextColor = () => {
              // 灰色：已暂停 / 已冻结
              if (isFrozen || isPaused) {
                return "text-gray-500";
              }
              
              // 红色：成功率 / 剩余收款额度 低于10%
              if (shouldShowRed) {
                return "text-red-500";
              }
              
              // 黄色：成功率 / 剩余收款额度 低于20%
              if (shouldShowYellow) {
                return "text-yellow-500";
              }
              
              // 绿色：活跃收款（默认）
              return "text-green-500";
            };
            
            const getBorderColor = () => {
              // 灰色：已暂停 / 已冻结
              if (isFrozen || isPaused) {
                return "border-gray-200";
              }
              
              // 红色：成功率 / 剩余收款额度 低于10%
              if (shouldShowRed) {
                return "border-red-200";
              }
              
              // 黄色：成功率 / 剩余收款额度 低于20%
              if (shouldShowYellow) {
                return "border-yellow-200";
              }
              
              // 绿色：活跃收款（默认）
              return "border-green-200";
            };
            
            const getBorderColorForIcon = () => {
              // 灰色：已暂停 / 已冻结
              if (isFrozen || isPaused) {
                return "border-gray-400";
              }
              
              // 红色：成功率 / 剩余收款额度 低于10%
              if (shouldShowRed) {
                return "border-red-500";
              }
              
              // 黄色：成功率 / 剩余收款额度 低于20%
              if (shouldShowYellow) {
                return "border-yellow-500";
              }
              
              // 绿色：活跃收款（默认）
              return "border-green-500";
            };
            
            const bgColor = getBgColor();
            const textColor = getTextColor();
            const borderColor = getBorderColor();
            const iconBorderColor = getBorderColorForIcon();
            const isExpanded = expandedAccounts[account.id] || false;
            
            return (
              <div key={account.id} className={`${bgColor} rounded-lg p-4 relative shadow-sm`}>
                {/* 状态图标 */}
                <div className="absolute left-3 top-4">
                  <div className={`h-6 w-6 flex items-center justify-center rounded-sm border ${iconBorderColor}`}>
                    {(isFrozen || isPaused) && <Ban className="h-4 w-4 text-gray-500" />}
                    {!(isFrozen || isPaused) && shouldShowRed && <X className="h-4 w-4 text-red-500" />}
                    {!(isFrozen || isPaused) && !shouldShowRed && shouldShowYellow && <RotateCcw className="h-4 w-4 text-yellow-500" />}
                    {!(isFrozen || isPaused) && !shouldShowRed && !shouldShowYellow && <Check className="h-4 w-4 text-green-500" />}
                  </div>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className={`${textColor} font-medium mb-1`}>{account.truename} {account.sales_name && `(${account.sales_name})`}</div>
                  <div className="text-black text-sm font-mono">
                    {account.appid}
                  </div>
                  {account.amount !== undefined && account.amount !== null && account.amount !== '' && (
                    <div className="text-black text-xs mt-1">
                      {t('otc.accounts.balance')}: {typeof account.amount === 'number' ? account.amount.toLocaleString('en-US', { maximumFractionDigits: 2 }) : parseFloat(String(account.amount)).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </div>
                  )}
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute right-3 top-4 h-6 w-6 p-0 rounded-sm"
                  onClick={() => toggleAccountExpand(account.id, isFrozen)}
                  disabled={isFrozen && localStorage.getItem('otcRole') !== '1'}
                >
                  <ChevronDown className={`h-5 w-5 ${textColor} transition-transform ${isExpanded ? 'rotate-180' : ''} ${isFrozen && localStorage.getItem('otcRole') !== '1' ? 'opacity-50 cursor-not-allowed' : ''}`} />
                </Button>
                
                {/* 展开内容 */}
                {isExpanded && (!isFrozen || localStorage.getItem('otcRole') === '1') && (
                  <div className="mt-3">
                    <div className="text-center mb-1">
                      <div className={`text-xs ${textColor}`}>{t('otc.accounts.dailyLimits')}</div>
                      <div className={`text-sm ${textColor} font-medium`}>
                        {account?.all_money?.toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="text-center mb-1">
                      <div className="text-xs text-black">单笔最大/最小</div>
                      <div className="text-sm text-black font-medium">
                        {account?.max_money?.toLocaleString() || '1,000'}/{account?.min_money?.toLocaleString() || '10,000'}
                      </div>
                    </div>
                    
                    <div className="text-center mb-4">
                      <div className="text-xs text-blue-500">{t('otc.accounts.last30Success')}</div>
                      <div className={`text-sm font-medium ${account.success_rate && account.success_rate as number < 15 ? 'text-red-500' : textColor}`}>
                        {account.success_rate || '-'}%
                      </div>
                    </div>
                    
                    <div className="text-center mb-2">
                      <div className="text-xs text-black">是否可以登录</div>
                      <div className={`text-sm font-medium ${account.is_login === '0' || account.is_login === 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {account.is_login === '0' || account.is_login === 0 ? '不可登录' : '可登录'}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 md:gap-2 px-1 mt-4 mb-2 justify-center">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-11 w-11 p-0 bg-white border border-gray-200 hover:border-black rounded-md flex items-center justify-center shadow-sm flex-shrink-0"
                        onClick={() => handleOpenEditAccount(account)}
                      >
                        <Edit className="h-5 w-5 text-yellow-500" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-11 w-11 p-0 bg-white border border-gray-200 hover:border-black rounded-md flex items-center justify-center shadow-sm flex-shrink-0"
                        onClick={() => handleDeleteAccount(account)}
                      >
                        <Trash className="h-5 w-5 text-blue-500" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-11 w-11 p-0 bg-white border border-gray-200 hover:border-black rounded-md flex items-center justify-center shadow-sm flex-shrink-0"
                        onClick={() => handleViewQrCode(account)}
                      >
                        <QrCode className="h-5 w-5 text-green-500" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-11 w-11 p-0 bg-white border border-gray-200 hover:border-black rounded-md flex items-center justify-center shadow-sm flex-shrink-0"
                        onClick={() => {
                          setSelectedAccount(account);
                          handleViewOwnerInfo();
                        }}
                        title="查看户主信息"
                      >
                        <User className="h-5 w-5 text-indigo-500" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-11 w-11 p-0 bg-white border border-gray-200 hover:border-black rounded-md flex items-center justify-center shadow-sm flex-shrink-0"
                        onClick={() => handleToggleSuspendAccount(account)}
                      >
                        {account.status === "0" ? (
                          <Play className="h-5 w-5 text-red-500" />
                        ) : (
                          <Pause className="h-5 w-5 text-red-500" />
                        )}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className={`h-11 w-11 p-0 bg-white border border-gray-200 rounded-md flex items-center justify-center shadow-sm flex-shrink-0 ${
                          localStorage.getItem('otcRole') !== '1' 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:border-black'
                        }`}
                        onClick={() => handleToggleFreezeStatus(account)}
                        disabled={localStorage.getItem('otcRole') !== '1'}
                        title={
                          localStorage.getItem('otcRole') !== '1' 
                            ? '只有供应商可以冻结或启用账户' 
                            : (account.check_status === "0" ? "已冻结" : "已启用")
                        }
                      >
                        {account.check_status === "0" ? (
                          <Ban className={`h-5 w-5 ${localStorage.getItem('otcRole') !== '1' ? 'text-gray-400' : 'text-purple-500'}`} />
                        ) : (
                          <Check className={`h-5 w-5 ${localStorage.getItem('otcRole') !== '1' ? 'text-gray-400' : 'text-green-500'}`} />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
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
      
      {/* Account details dialog */}
      <Dialog open={accountDetailsOpen} onOpenChange={setAccountDetailsOpen}>
        <DialogContent className="max-w-md bg-white animate-in fade-in-50 zoom-in-95 duration-300">
          <DialogHeader>
            <DialogTitle className="text-black">{t('otc.accounts.accountDetails')}</DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <div className="text-black text-sm">{t('otc.accounts.accountHolderName')}</div>
                  <div className="font-medium text-black">{selectedAccount.truename}</div>
                </div>
                <div>
                  <div className="text-black text-sm">{t('otc.accounts.accountNumber')}</div>
                  <div className="font-mono text-black">{selectedAccount.mch_id}</div>
                </div>
              </div>
              <div className="flex justify-between">
                <div>
                  <div className="text-black text-sm">{t('otc.accounts.accountType')}</div>
                  <div className="font-medium text-black">
                    {selectedAccount.paytype === "bank" ? t('otc.accounts.bankTransfer') : t('otc.accounts.scanPayment')}
                  </div>
                </div>
                <div>
                  <div className="text-black text-sm">{t('otc.accounts.currency')}</div>
                  <div className="font-medium text-black">
                    {selectedAccount.channelid}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-black text-sm">{t('otc.accounts.responsibleAgent')}</div>
                <div className="font-medium text-black">
                  {selectedAccount.sales_name} (ID: {selectedAccount.userid})
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm bg-white animate-in fade-in-50 zoom-in-95 duration-300">
          <DialogHeader>
            <DialogTitle className="text-black">{t('common.confirmDelete')}</DialogTitle>
          </DialogHeader>
          <div className="py-3 text-black">
            {t('otc.accounts.confirmDeleteAccount')} <span className="font-medium">{selectedAccount?.truename} ({selectedAccount?.mch_id || selectedAccount?.appid})</span>? {t('common.actionCannotBeUndone')}
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" className="bg-white border-black text-black" onClick={() => setDeleteConfirmOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="outline" className="bg-white border-black text-black" onClick={confirmDeleteAccount}>
              {t('common.confirmDelete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Suspend/Activate account confirmation dialog */}
      <Dialog open={suspendConfirmOpen} onOpenChange={setSuspendConfirmOpen}>
        <DialogContent className="max-w-sm bg-white animate-in fade-in-50 zoom-in-95 duration-300">
          <DialogHeader>
            <DialogTitle className="text-black">
              {selectedAccount?.status === "0" ? t('otc.accounts.activateAccount') : t('otc.accounts.suspendAccount')}
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 text-black">
            {selectedAccount?.status === "0" ? (
              <>{t('otc.accounts.confirmActivateAccount')} <span className="font-medium">{selectedAccount?.truename}</span>?</>
            ) : (
              <>{t('otc.accounts.confirmSuspendAccount')} <span className="font-medium">{selectedAccount?.truename}</span>?</>
            )}
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" className="bg-white border-black text-black" onClick={() => setSuspendConfirmOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              variant="outline"
              className="bg-white border-black text-black"
              onClick={confirmToggleSuspend}
            >
              {selectedAccount?.status === "0" ? t('otc.accounts.confirmActivate') : t('otc.accounts.confirmSuspend')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add account dialog */}
      <Dialog open={addAccountOpen} onOpenChange={setAddAccountOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] bg-white animate-in fade-in-50 zoom-in-95 duration-300 flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-black">{t('otc.accounts.addAccount')}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto flex-1 pr-2">
            <div>
              <label htmlFor="agent" className="block mb-1 text-sm font-medium text-black">
                {t('otc.accounts.agent')} <span className="text-red-500">*</span>
              </label>
              <Input
                id="agent"
                value={addAccount?.sales_name || ''}
                onChange={(e) => handleAddAccountChange('sales_name', e.target.value)}
                placeholder={t('otc.accounts.enterAgent')}
                className="w-full bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
              />
            </div>

             <div>
              <label htmlFor="userid" className="block mb-1 text-sm font-medium text-black">
                {t('otc.accounts.userid')} <span className="text-red-500">*</span>
              </label>
              <Input
                id="userid"
                value={addAccount?.userid || ''}
                disabled={ otcUserData?.role == '2'}
                onChange={(e) => handleAddAccountChange('userid', e.target.value)}
                placeholder={t('otc.accounts.enterUserid')}
                className="w-full bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
              />
            </div>
            
            <div>
              <label htmlFor="currency" className="block mb-1 text-sm font-medium text-black">
                {t('otc.accounts.currency')} <span className="text-red-500">*</span>
              </label>
              <Select 
                value={addAccount?.currency?.trim() || ''} 
                onValueChange={(value) => handleAddAccountChange('currency', value)}
              >
                <SelectTrigger
                  id="currency"
                  className="w-full h-10 bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                >
                  <SelectValue placeholder={t('otc.accounts.selectCurrency')} />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 shadow-lg">
                  {currencyList.map((currency) => (
                    <SelectItem 
                      key={currency.currency} 
                      value={currency.currency?.trim() || ''}
                      className="py-2.5 text-sm font-medium hover:bg-blue-500 hover:text-white focus:bg-blue-500 focus:text-white cursor-pointer text-gray-900"
                    >
                      {currency.currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="accountType" className="block mb-1 text-sm font-medium text-black">
                {t('otc.accounts.accountType')} <span className="text-red-500">*</span>
              </label>
              <Select 
                value={addAccount?.paytype}
                onValueChange={(value) => handleAddAccountChange('paytype', value)}
              >
                <SelectTrigger 
                  id="accountType"
                  className="w-full h-10 bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                >
                  <SelectValue placeholder={t('otc.accounts.selectAccountType')} />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 shadow-lg">
                  {payTypeData?.data?.map((payType: any) => (
                    <SelectItem 
                      key={payType.id} 
                      value={payType.id}
                      className="py-2.5 text-sm font-medium hover:bg-blue-500 hover:text-white focus:bg-blue-500 focus:text-white cursor-pointer text-gray-900"
                    >
                      {payType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 text-sm font-medium text-black">
                {t('otc.accounts.channel')} <span className="text-red-500">*</span>
              </label>
              <div className="border border-gray-200 rounded-md p-3 bg-white max-h-48 overflow-y-auto">
                {channelAllData?.data && channelAllData.data.length > 0 ? (
                  <div className="space-y-2">
                    {channelAllData.data.map((channel: any) => (
                      <div key={channel.channelid} className="flex items-center space-x-2">
                        <Checkbox
                          id={`channel-${channel.channelid}`}
                          checked={selectedChannels.includes(channel.channelid)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedChannels([...selectedChannels, channel.channelid]);
                            } else {
                              setSelectedChannels(selectedChannels.filter(id => id !== channel.channelid));
                            }
                          }}
                        />
                        <label
                          htmlFor={`channel-${channel.channelid}`}
                          className="text-sm font-medium text-gray-900 cursor-pointer flex-1"
                        >
                          {channel.channel_title}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">暂无通道可选</div>
                )}
              </div>
              {selectedChannels.length > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  已选择: {selectedChannels.map(id => {
                    const channel = channelAllData?.data?.find((c: any) => c.channelid === id);
                    return channel?.channel_title || id;
                  }).join(', ')}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="accountNumber" className="block mb-1 text-sm font-medium text-black">
                {t('otc.accounts.accountNumber')} <span className="text-red-500">*</span>
              </label>
              <Input
                id="accountNumber"
                value={addAccount?.appid || ''}
                onChange={(e) => handleAddAccountChange('appid', e.target.value)}
                placeholder={t('otc.accounts.enterAccountNumber')}
                className="w-full bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="accountName" className="block mb-1 text-sm font-medium text-black">
                {t('otc.accounts.accountHolderName')} <span className="text-red-500">*</span>
              </label>
              <Input
                id="accountName"
                value={addAccount?.truename || ''}
                onChange={(e) => handleAddAccountChange('truename', e.target.value)}
                placeholder={t('otc.accounts.enterAccountHolderName')}
                className="w-full bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="dailyLimit" className="block mb-1 text-sm font-medium text-black">
                {t('otc.accounts.dailyLimit')} <span className="text-red-500">*</span>
              </label>
              <Input
                id="dailyLimit"
                value={addAccount?.all_money || ''}
                onChange={(e) => handleAddAccountChange('all_money', e.target.value)}
                placeholder={t('otc.accounts.enterDailyLimit')}
                className="w-full bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                type="number"
              />
            </div>

            <div>
              <label htmlFor="dailyCalls" className="block mb-1 text-sm font-medium text-black">
                {t('otc.accounts.dailyCalls')} <span className="text-red-500">*</span>
              </label>
              <Input
                id="dailyCalls"
                value={addAccount?.all_pay_num || ''}
                onChange={(e) => handleAddAccountChange('all_pay_num', e.target.value)}
                placeholder={t('otc.accounts.enterDailyCalls')}
                className="w-full bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                type="number"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block mb-1 text-sm font-medium text-black">
                {t('otc.accounts.subject')} <span className="text-red-500">*</span>
              </label>
              <Input
                id="subject"
                value={addAccount?.subject || ''}
                onChange={(e) => handleAddAccountChange('subject', e.target.value)}
                placeholder={t('otc.accounts.enterSubject')}
                className="w-full bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="minAmount" className="block mb-1 text-sm font-medium text-black">
                  {t('otc.accounts.minAmount')} <span className="text-red-500">*</span>
                </label>
                <Input
                  id="minAmount"
                  value={addAccount?.min_money || ''}
                  onChange={(e) => handleAddAccountChange('min_money', e.target.value)}
                  placeholder={t('otc.accounts.enterMinAmount')}
                  className="w-full bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                  type="number"
                />
              </div>
              <div>
                <label htmlFor="maxAmount" className="block mb-1 text-sm font-medium text-black">
                  {t('otc.accounts.maxAmount')} <span className="text-red-500">*</span>
                </label>
                <Input
                  id="maxAmount"
                  value={addAccount?.max_money || ''}
                  onChange={(e) => handleAddAccountChange('max_money', e.target.value)}
                  placeholder={t('otc.accounts.enterMaxAmount')}
                  className="w-full bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                  type="number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className="block mb-1 text-sm font-medium text-black">
                  {t('otc.accounts.balance')}
                </label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={addAccount?.amount || ''}
                  onChange={(e) => handleAddAccountChange('amount', e.target.value)}
                  placeholder={t('otc.accounts.enterBalance')}
                  className="w-full bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="successRate" className="block mb-1 text-sm font-medium text-black">
                  {t('otc.accounts.successRate')}
                </label>
                <Input
                  id="successRate"
                  type="number"
                  step="0.01"
                  value={addAccount?.success_rate || ''}
                  onChange={(e) => handleAddAccountChange('success_rate', e.target.value)}
                  placeholder={t('otc.accounts.enterSuccessRate')}
                  className="w-full bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="maxAmount" className="block mb-1 text-sm font-medium text-black">
                {t('otc.accounts.maxAccountBalance')}
              </label>
              <Input
                id="maxAmount"
                type="number"
                step="0.01"
                value={addAccount?.max_amount || ''}
                onChange={(e) => handleAddAccountChange('max_amount', e.target.value)}
                placeholder={t('otc.accounts.enterMaxAccountBalance')}
                className="w-full bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-black">
                  {t('otc.accounts.receiveStatus')}
                </label>
                <Select
                  value={addAccount?.receive_status?.toString() || '1'}
                  onValueChange={(value) => handleAddAccountChange('receive_status', value)}
                >
                  <SelectTrigger className="w-full h-10 bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900">
                    <SelectValue placeholder={t('otc.accounts.selectReceiveStatus')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="1" className="py-2.5 text-sm font-medium hover:bg-blue-500 hover:text-white focus:bg-blue-500 focus:text-white cursor-pointer text-gray-900">
                      {t('otc.accounts.statusOn')}
                    </SelectItem>
                    <SelectItem value="0" className="py-2.5 text-sm font-medium hover:bg-blue-500 hover:text-white focus:bg-blue-500 focus:text-white cursor-pointer text-gray-900">
                      {t('otc.accounts.statusOff')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-black">
                  {t('otc.accounts.paymentStatus')}
                </label>
                <Select
                  value={addAccount?.payment_status?.toString() || '1'}
                  onValueChange={(value) => handleAddAccountChange('payment_status', value)}
                >
                  <SelectTrigger className="w-full h-10 bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900">
                    <SelectValue placeholder={t('otc.accounts.selectPaymentStatus')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="1" className="py-2.5 text-sm font-medium hover:bg-blue-500 hover:text-white focus:bg-blue-500 focus:text-white cursor-pointer text-gray-900">
                      {t('otc.accounts.statusOn')}
                    </SelectItem>
                    <SelectItem value="0" className="py-2.5 text-sm font-medium hover:bg-blue-500 hover:text-white focus:bg-blue-500 focus:text-white cursor-pointer text-gray-900">
                      {t('otc.accounts.statusOff')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-black">
                是否可以登录
              </label>
              <Select
                value={addAccount?.is_login?.toString() || '1'}
                onValueChange={(value) => handleAddAccountChange('is_login', value)}
              >
                <SelectTrigger className="w-full h-10 bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900">
                  <SelectValue placeholder="请选择是否可以登录" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 shadow-lg">
                  <SelectItem value="1" className="py-2.5 text-sm font-medium hover:bg-blue-500 hover:text-white focus:bg-blue-500 focus:text-white cursor-pointer text-gray-900">
                    可登录
                  </SelectItem>
                  <SelectItem value="0" className="py-2.5 text-sm font-medium hover:bg-blue-500 hover:text-white focus:bg-blue-500 focus:text-white cursor-pointer text-gray-900">
                    不可登录
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 户主信息 */}
            <div className="col-span-1 md:col-span-2 border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-black mb-4">户主信息</h3>
            </div>

            <div>
              <label htmlFor="owner_name" className="block mb-1 text-sm font-medium text-black">
                户主姓名
              </label>
              <Input
                id="owner_name"
                value={addAccount?.owner_name || ''}
                onChange={(e) => handleAddAccountChange('owner_name', e.target.value)}
                placeholder="请输入户主姓名"
                className="w-full bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="owner_idcard" className="block mb-1 text-sm font-medium text-black">
                户主身份证
              </label>
              <Input
                id="owner_idcard"
                value={addAccount?.owner_idcard || ''}
                onChange={(e) => handleAddAccountChange('owner_idcard', e.target.value)}
                placeholder="请输入户主身份证"
                className="w-full bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="owner_mobile" className="block mb-1 text-sm font-medium text-black">
                户主联系方式
              </label>
              <Input
                id="owner_mobile"
                value={addAccount?.owner_mobile || ''}
                onChange={(e) => handleAddAccountChange('owner_mobile', e.target.value)}
                placeholder="请输入户主联系方式"
                className="w-full bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label htmlFor="owner_photo" className="block mb-1 text-sm font-medium text-black">
                户主照片
              </label>
              <div className="flex items-center gap-4 w-full">
                <Button 
                  variant="outline" 
                  className="w-full bg-white border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-all duration-300 ease-in-out flex items-center justify-center gap-2 h-10"
                  onClick={() => document.getElementById('owner_photoUpload')?.click()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black mr-1">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <span className="text-black">上传户主照片</span>
                </Button>
                <input
                  id="owner_photoUpload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, 'owner_photo', false)}
                />
                {addAccount?.owner_photo && (
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <img 
                      src={addAccount.owner_photo} 
                      alt="户主照片" 
                      className="w-full h-full object-cover rounded"
                    />
                    <button
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      onClick={() => {
                        setAddAccount(prev => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            owner_photo: ''
                          };
                        });
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label htmlFor="owner_idcard_img1" className="block mb-1 text-sm font-medium text-black">
                户主身份证正面
              </label>
              <div className="flex items-center gap-4 w-full">
                <Button 
                  variant="outline" 
                  className="w-full bg-white border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-all duration-300 ease-in-out flex items-center justify-center gap-2 h-10"
                  onClick={() => document.getElementById('owner_idcard_img1Upload')?.click()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black mr-1">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <span className="text-black">上传身份证正面</span>
                </Button>
                <input
                  id="owner_idcard_img1Upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, 'owner_idcard_img1', false)}
                />
                {addAccount?.owner_idcard_img1 && (
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <img 
                      src={addAccount.owner_idcard_img1} 
                      alt="身份证正面" 
                      className="w-full h-full object-cover rounded"
                    />
                    <button
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      onClick={() => {
                        setAddAccount(prev => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            owner_idcard_img1: ''
                          };
                        });
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label htmlFor="owner_idcard_img2" className="block mb-1 text-sm font-medium text-black">
                户主身份证反面
              </label>
              <div className="flex items-center gap-4 w-full">
                <Button 
                  variant="outline" 
                  className="w-full bg-white border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-all duration-300 ease-in-out flex items-center justify-center gap-2 h-10"
                  onClick={() => document.getElementById('owner_idcard_img2Upload')?.click()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black mr-1">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <span className="text-black">上传身份证反面</span>
                </Button>
                <input
                  id="owner_idcard_img2Upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, 'owner_idcard_img2', false)}
                />
                {addAccount?.owner_idcard_img2 && (
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <img 
                      src={addAccount.owner_idcard_img2} 
                      alt="身份证反面" 
                      className="w-full h-full object-cover rounded"
                    />
                    <button
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      onClick={() => {
                        setAddAccount(prev => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            owner_idcard_img2: ''
                          };
                        });
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-1">
              <label htmlFor="qrCode" className="block mb-1 text-sm font-medium text-black">
                {t('otc.accounts.qrCodeImage')}
              </label>
              <div className="flex items-center gap-4 w-full">
                <Button 
                  variant="outline" 
                  className="w-full bg-white border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-all duration-300 ease-in-out flex items-center justify-center gap-2 h-10"
                  onClick={() => document.getElementById('qrCodeUpload')?.click()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black mr-1">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <span className="text-black">{t('otc.accounts.uploadQrCode')}</span>
                </Button>
                <input
                  id="qrCodeUpload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, 'qrcode', false)}
                />
                {addAccount?.qrcode && (
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <img 
                      src={addAccount.qrcode} 
                      alt="QR Code" 
                      className="w-full h-full object-cover rounded"
                    />
                    <button
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      onClick={() => {
                        setAddAccount(prev => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            qrcode: ''
                          };
                        });
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-2 mt-4 pt-4 border-t flex-shrink-0">
            <Button variant="outline" className="bg-white border-black text-black" onClick={() => setAddAccountOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              variant="outline" 
              className="bg-white border-black text-black"
              onClick={handleAddAccount}
            >
              {t('otc.accounts.confirmAdd')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit account dialog */}
      <Dialog open={editAccountOpen} onOpenChange={setEditAccountOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] bg-white animate-in fade-in-50 zoom-in-95 duration-300 flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-black">{t('otc.accounts.editAccount')}</DialogTitle>
          </DialogHeader>
          {editAccount && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto flex-1 pr-2">
              <div>
                <label htmlFor="edit-agent" className="block mb-1 text-sm font-medium text-black">
                  {t('otc.accounts.agent')} <span className="text-red-500">*</span>
                </label>
                <Input 
                  id="edit-agent"
                  value={editAccount.sales_name}
                  onChange={(e) => handleEditAccountChange('sales_name', e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-md transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                  placeholder={t('otc.accounts.enterAgent')}
                />
              </div>

               <div>
                <label htmlFor="edit-userid" className="block mb-1 text-sm font-medium text-black">
                  {t('otc.accounts.userid')} <span className="text-red-500">*</span>
                </label>
                <Input 
                  id="edit-userid"
                  value={editAccount.userid}
                  disabled={ otcUserData?.role == '2'}
                  onChange={(e) => handleEditAccountChange('userid', e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-md transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                  placeholder={t('otc.accounts.enterUserid')}
                />
              </div>
              
              <div>
                <label htmlFor="edit-currency" className="block mb-1 text-sm font-medium text-black">
                  {t('otc.accounts.currency')} <span className="text-red-500">*</span>
                </label>
                <Select 
                  value={editAccount.currency?.trim() || ''}
                  onValueChange={(value) => handleEditAccountChange('currency', value)}
                >
                  <SelectTrigger 
                    id="edit-currency"
                    className="w-full h-10 bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <SelectValue placeholder={t('otc.accounts.selectCurrency')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    {currencyList.map((currency) => (
                      <SelectItem 
                        key={currency.currency} 
                        value={currency.currency?.trim() || ''}
                        className="py-2.5 text-sm font-medium hover:bg-blue-500 hover:text-white focus:bg-blue-500 focus:text-white cursor-pointer"
                      >
                        {currency.currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label htmlFor="edit-account-type" className="block mb-1 text-sm font-medium text-black">
                  {t('otc.accounts.accountType')} <span className="text-red-500">*</span>
                </label>
                <Select 
                  value={editAccount.paytype}
                  onValueChange={(value) => handleEditAccountChange('paytype', value)}
                >
                  <SelectTrigger 
                    id="edit-account-type"
                    className="w-full h-10 bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <SelectValue placeholder={t('otc.accounts.selectAccountType')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    {payTypeData?.data?.map((payType: any) => (
                      <SelectItem 
                        key={payType.id} 
                        value={payType.id}
                        className="py-2.5 text-sm font-medium hover:bg-blue-500 hover:text-white focus:bg-blue-500 focus:text-white cursor-pointer"
                      >
                        {payType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2 text-sm font-medium text-black">
                  {t('otc.accounts.channel')} <span className="text-red-500">*</span>
                </label>
                <div className="border border-gray-200 rounded-md p-3 bg-white max-h-48 overflow-y-auto">
                  {channelAllData?.data && channelAllData.data.length > 0 ? (
                    <div className="space-y-2">
                      {channelAllData.data.map((channel: any) => (
                        <div key={channel.channelid} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-channel-${channel.channelid}`}
                            checked={editSelectedChannels.includes(channel.channelid)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setEditSelectedChannels([...editSelectedChannels, channel.channelid]);
                              } else {
                                setEditSelectedChannels(editSelectedChannels.filter(id => id !== channel.channelid));
                              }
                            }}
                          />
                          <label
                            htmlFor={`edit-channel-${channel.channelid}`}
                            className="text-sm font-medium text-gray-900 cursor-pointer flex-1"
                          >
                            {channel.channel_title}
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">暂无通道可选</div>
                  )}
                </div>
                {editSelectedChannels.length > 0 && (
                  <div className="mt-2 text-xs text-gray-600">
                    已选择: {editSelectedChannels.map(id => {
                      const channel = channelAllData?.data?.find((c: any) => c.channelid === id);
                      return channel?.channel_title || id;
                    }).join(', ')}
                  </div>
                )}
              </div>
              
              <div>
                <label htmlFor="edit-account-number" className="block mb-1 text-sm font-medium text-black">
                  {t('otc.accounts.accountNumber')} <span className="text-red-500">*</span>
                </label>
                <Input 
                  id="edit-account-number"
                  value={editAccount.appid}
                  onChange={(e) => handleEditAccountChange('appid', e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-md transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                  placeholder={t('otc.accounts.enterAccountNumber')}
                />
              </div>

              <div>
                <label htmlFor="edit-account-name" className="block mb-1 text-sm font-medium text-black">
                  {t('otc.accounts.accountHolderName')} <span className="text-red-500">*</span>
                </label>
                <Input
                  id="edit-account-name"
                  value={editAccount?.truename || ''}
                  onChange={(e) => handleEditAccountChange('truename', e.target.value)}
                  placeholder={t('otc.accounts.enterAccountHolderName')}
                  className="w-full bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                />
              </div>
              
              <div>
                <label htmlFor="edit-daily-limit" className="block mb-1 text-sm font-medium text-black">
                  {t('otc.accounts.dailyLimit')} <span className="text-red-500">*</span>
                </label>
                <Input 
                  id="edit-daily-limit"
                  type="number"
                  value={editAccount.all_money}
                  onChange={(e) => handleEditAccountChange('all_money', e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-md transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                  placeholder={t('otc.accounts.enterDailyLimit')}
                />
              </div>

              <div>
                <label htmlFor="edit-daily-calls" className="block mb-1 text-sm font-medium text-black">
                  {t('otc.accounts.dailyCalls')} <span className="text-red-500">*</span>
                </label>
                <Input 
                  id="edit-daily-calls"
                  type="number"
                  value={editAccount.all_pay_num || ''}
                  onChange={(e) => handleEditAccountChange('all_pay_num', e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-md transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                  placeholder={t('otc.accounts.enterDailyCalls')}
                />
              </div>
              
              <div>
                <label htmlFor="edit-subject" className="block mb-1 text-sm font-medium text-black">
                  {t('otc.accounts.subject')} <span className="text-red-500">*</span>
                </label>
                <Input
                  id="edit-subject"
                  value={editAccount?.subject || ''}
                  onChange={(e) => handleEditAccountChange('subject', e.target.value)}
                  placeholder={t('otc.accounts.enterSubject')}
                  className="w-full bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 col-span-1">
                <div>
                  <label htmlFor="edit-min-amount" className="block mb-1 text-sm font-medium text-black">
                    {t('otc.accounts.minAmount')} <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    id="edit-min-amount"
                    type="number"
                    value={editAccount.min_money}
                    onChange={(e) => handleEditAccountChange('min_money', e.target.value)}
                    className="w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-md transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                    placeholder={t('otc.accounts.enterMinAmount')}
                  />
                </div>
                <div>
                  <label htmlFor="edit-max-amount" className="block mb-1 text-sm font-medium text-black">
                    {t('otc.accounts.maxAmount')} <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    id="edit-max-amount"
                    type="number"
                    value={editAccount.max_money}
                    onChange={(e) => handleEditAccountChange('max_money', e.target.value)}
                    className="w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-md transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                    placeholder={t('otc.accounts.enterMaxAmount')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 col-span-1">
                <div>
                  <label htmlFor="edit-amount" className="block mb-1 text-sm font-medium text-black">
                    {t('otc.accounts.balance')}
                  </label>
                  <Input 
                    id="edit-amount"
                    type="number"
                    step="0.01"
                    value={editAccount?.amount || ''}
                    onChange={(e) => handleEditAccountChange('amount', e.target.value)}
                    className="w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-md transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                    placeholder={t('otc.accounts.enterBalance')}
                  />
                </div>
                <div>
                  <label htmlFor="edit-success-rate" className="block mb-1 text-sm font-medium text-black">
                    {t('otc.accounts.successRate')}
                  </label>
                  <Input 
                    id="edit-success-rate"
                    type="number"
                    step="0.01"
                    value={editAccount?.success_rate || ''}
                    onChange={(e) => handleEditAccountChange('success_rate', e.target.value)}
                    className="w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-md transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                    placeholder={t('otc.accounts.enterSuccessRate')}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="edit-max-amount" className="block mb-1 text-sm font-medium text-black">
                  {t('otc.accounts.maxAccountBalance')}
                </label>
                <Input 
                  id="edit-max-amount"
                  type="number"
                  step="0.01"
                  value={editAccount?.max_amount || ''}
                  onChange={(e) => handleEditAccountChange('max_amount', e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-md transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                  placeholder={t('otc.accounts.enterMaxAccountBalance')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 col-span-1">
                <div>
                  <label className="block mb-1 text-sm font-medium text-black">
                    {t('otc.accounts.receiveStatus')}
                  </label>
                  <Select
                    value={editAccount?.receive_status?.toString() || '1'}
                    onValueChange={(value) => handleEditAccountChange('receive_status', value)}
                  >
                    <SelectTrigger className="w-full h-10 bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900">
                      <SelectValue placeholder={t('otc.accounts.selectReceiveStatus')} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 shadow-lg">
                      <SelectItem value="1" className="py-2.5 text-sm font-medium hover:bg-blue-500 hover:text-white focus:bg-blue-500 focus:text-white cursor-pointer text-gray-900">
                        {t('otc.accounts.statusOn')}
                      </SelectItem>
                      <SelectItem value="0" className="py-2.5 text-sm font-medium hover:bg-blue-500 hover:text-white focus:bg-blue-500 focus:text-white cursor-pointer text-gray-900">
                        {t('otc.accounts.statusOff')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-black">
                    {t('otc.accounts.paymentStatus')}
                  </label>
                  <Select
                    value={editAccount?.payment_status?.toString() || '1'}
                    onValueChange={(value) => handleEditAccountChange('payment_status', value)}
                  >
                    <SelectTrigger className="w-full h-10 bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900">
                      <SelectValue placeholder={t('otc.accounts.selectPaymentStatus')} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 shadow-lg">
                      <SelectItem value="1" className="py-2.5 text-sm font-medium hover:bg-blue-500 hover:text-white focus:bg-blue-500 focus:text-white cursor-pointer text-gray-900">
                        {t('otc.accounts.statusOn')}
                      </SelectItem>
                      <SelectItem value="0" className="py-2.5 text-sm font-medium hover:bg-blue-500 hover:text-white focus:bg-blue-500 focus:text-white cursor-pointer text-gray-900">
                        {t('otc.accounts.statusOff')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-black">
                  是否可以登录
                </label>
                <Select
                  value={editAccount?.is_login?.toString() || '1'}
                  onValueChange={(value) => handleEditAccountChange('is_login', value)}
                >
                  <SelectTrigger className="w-full h-10 bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900">
                    <SelectValue placeholder="请选择是否可以登录" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="1" className="py-2.5 text-sm font-medium hover:bg-blue-500 hover:text-white focus:bg-blue-500 focus:text-white cursor-pointer text-gray-900">
                      可登录
                    </SelectItem>
                    <SelectItem value="0" className="py-2.5 text-sm font-medium hover:bg-blue-500 hover:text-white focus:bg-blue-500 focus:text-white cursor-pointer text-gray-900">
                      不可登录
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 户主信息 */}
              <div className="col-span-1 md:col-span-2 border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold text-black mb-4">户主信息</h3>
              </div>

              <div>
                <label htmlFor="edit-owner_name" className="block mb-1 text-sm font-medium text-black">
                  户主姓名
                </label>
                <Input
                  id="edit-owner_name"
                  value={editAccount?.owner_name || ''}
                  onChange={(e) => handleEditAccountChange('owner_name', e.target.value)}
                  placeholder="请输入户主姓名"
                  className="w-full bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                />
              </div>

              <div>
                <label htmlFor="edit-owner_idcard" className="block mb-1 text-sm font-medium text-black">
                  户主身份证
                </label>
                <Input
                  id="edit-owner_idcard"
                  value={editAccount?.owner_idcard || ''}
                  onChange={(e) => handleEditAccountChange('owner_idcard', e.target.value)}
                  placeholder="请输入户主身份证"
                  className="w-full bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                />
              </div>

              <div>
                <label htmlFor="edit-owner_mobile" className="block mb-1 text-sm font-medium text-black">
                  户主联系方式
                </label>
                <Input
                  id="edit-owner_mobile"
                  value={editAccount?.owner_mobile || ''}
                  onChange={(e) => handleEditAccountChange('owner_mobile', e.target.value)}
                  placeholder="请输入户主联系方式"
                  className="w-full bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label htmlFor="edit-owner_photo" className="block mb-1 text-sm font-medium text-black">
                  户主照片
                </label>
                <div className="flex items-center gap-4 w-full">
                  <Button 
                    variant="outline" 
                    className="w-full bg-white border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-all duration-300 ease-in-out flex items-center justify-center gap-2 h-10"
                    onClick={() => document.getElementById('editOwnerPhotoUpload')?.click()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black mr-1">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <span className="text-black">上传户主照片</span>
                  </Button>
                  <input
                    id="editOwnerPhotoUpload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, 'owner_photo', true)}
                  />
                  {editAccount?.owner_photo && (
                    <div className="relative w-10 h-10 flex-shrink-0">
                      <img 
                        src={editAccount.owner_photo} 
                        alt="户主照片" 
                        className="w-full h-full object-cover rounded"
                      />
                      <button
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        onClick={() => {
                          setEditAccount(prev => {
                            if (!prev) return null;
                            return {
                              ...prev,
                              owner_photo: ''
                            };
                          });
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label htmlFor="edit-owner_idcard_img1" className="block mb-1 text-sm font-medium text-black">
                  户主身份证正面
                </label>
                <div className="flex items-center gap-4 w-full">
                  <Button 
                    variant="outline" 
                    className="w-full bg-white border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-all duration-300 ease-in-out flex items-center justify-center gap-2 h-10"
                    onClick={() => document.getElementById('editOwnerIdcardImg1Upload')?.click()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black mr-1">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <span className="text-black">上传身份证正面</span>
                  </Button>
                  <input
                    id="editOwnerIdcardImg1Upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, 'owner_idcard_img1', true)}
                  />
                  {editAccount?.owner_idcard_img1 && (
                    <div className="relative w-10 h-10 flex-shrink-0">
                      <img 
                        src={editAccount.owner_idcard_img1} 
                        alt="身份证正面" 
                        className="w-full h-full object-cover rounded"
                      />
                      <button
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        onClick={() => {
                          setEditAccount(prev => {
                            if (!prev) return null;
                            return {
                              ...prev,
                              owner_idcard_img1: ''
                            };
                          });
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label htmlFor="edit-owner_idcard_img2" className="block mb-1 text-sm font-medium text-black">
                  户主身份证反面
                </label>
                <div className="flex items-center gap-4 w-full">
                  <Button 
                    variant="outline" 
                    className="w-full bg-white border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-all duration-300 ease-in-out flex items-center justify-center gap-2 h-10"
                    onClick={() => document.getElementById('editOwnerIdcardImg2Upload')?.click()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black mr-1">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <span className="text-black">上传身份证反面</span>
                  </Button>
                  <input
                    id="editOwnerIdcardImg2Upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, 'owner_idcard_img2', true)}
                  />
                  {editAccount?.owner_idcard_img2 && (
                    <div className="relative w-10 h-10 flex-shrink-0">
                      <img 
                        src={editAccount.owner_idcard_img2} 
                        alt="身份证反面" 
                        className="w-full h-full object-cover rounded"
                      />
                      <button
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        onClick={() => {
                          setEditAccount(prev => {
                            if (!prev) return null;
                            return {
                              ...prev,
                              owner_idcard_img2: ''
                            };
                          });
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="col-span-1">
                <label htmlFor="edit-qrcode" className="block mb-1 text-sm font-medium text-black">
                  {t('otc.accounts.qrCodeImage')}
                </label>
                <div className="flex items-center gap-4 w-full">
                  <Button 
                    variant="outline" 
                    className="w-full bg-white border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-all duration-300 ease-in-out flex items-center justify-center gap-2 h-10"
                    onClick={() => document.getElementById('editQrCodeUpload')?.click()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black mr-1">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <span className="text-black">{t('otc.accounts.uploadQrCode')}</span>
                  </Button>
                  <input
                    id="editQrCodeUpload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, 'qrcode', true)}
                  />
                  {editAccount.qrcode && (
                    <div className="relative w-10 h-10 flex-shrink-0">
                      <img 
                        src={editAccount.qrcode} 
                        alt="QR Code" 
                        className="w-full h-full object-cover rounded"
                      />
                      <button
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        onClick={() => {
                          setEditAccount(prev => {
                            if (!prev) return null;
                            return {
                              ...prev,
                              qrcode: ''
                            };
                          });
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-end gap-2 mt-4 pt-4 border-t flex-shrink-0">
            <Button variant="outline" className="bg-white border-black text-black" onClick={() => setEditAccountOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              variant="outline" 
              className="bg-white border-black text-black"
              onClick={handleEditAccountSubmit}
            >
              {t('common.saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 查看二维码对话框 */}
      <Dialog open={qrCodeViewOpen} onOpenChange={setQrCodeViewOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader className="p-0 m-0">
            <div className="border-b border-gray-200 pb-2">
              <DialogTitle className="text-lg font-medium text-gray-900">{t('otc.accounts.qrCodeView')}</DialogTitle>
            </div>
          </DialogHeader>
          
          {selectedAccount && (
            <div className="my-4 flex flex-col items-center">
              <div className="text-black font-medium mb-2">{selectedAccount.truename} ({selectedAccount.channelid})</div>
              <div className="text-sm text-gray-500 mb-4">{selectedAccount.mch_id}</div>
              
              <div className="bg-white p-3 border border-gray-200 rounded-lg">
                {selectedAccount.qrcode ? (
                  <img 
                    src={selectedAccount.qrcode} 
                    alt={t('otc.accounts.paymentQrCode')} 
                    className="w-64 h-64 object-contain"
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center bg-gray-100 text-gray-500">
                    {t('otc.accounts.noQrCodeAvailable')}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-4">
            <Button className="bg-black text-white hover:bg-gray-800" onClick={() => setQrCodeViewOpen(false)}>
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 查看户主信息对话框 */}
      <Dialog open={ownerInfoViewOpen} onOpenChange={setOwnerInfoViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] bg-white animate-in fade-in-50 zoom-in-95 duration-300 flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-black text-lg font-semibold">户主信息</DialogTitle>
          </DialogHeader>
          
          {selectedAccount && (
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">户主姓名</label>
                  <p className="text-sm text-gray-900">{selectedAccount.owner_name || '-'}</p>
                </div>
                
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">户主身份证</label>
                  <p className="text-sm text-gray-900">{selectedAccount.owner_idcard || '-'}</p>
                </div>
                
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">户主联系方式</label>
                  <p className="text-sm text-gray-900">{selectedAccount.owner_mobile || '-'}</p>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block mb-2 text-sm font-medium text-gray-500">户主照片</label>
                  {selectedAccount.owner_photo ? (
                    <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                      <img 
                        src={selectedAccount.owner_photo} 
                        alt="户主照片" 
                        className="w-full max-w-md mx-auto h-auto object-contain rounded"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center bg-gray-100 text-gray-500 rounded-lg border border-gray-200">
                      暂无户主照片
                    </div>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block mb-2 text-sm font-medium text-gray-500">户主身份证正面</label>
                  {selectedAccount.owner_idcard_img1 ? (
                    <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                      <img 
                        src={selectedAccount.owner_idcard_img1} 
                        alt="身份证正面" 
                        className="w-full max-w-md mx-auto h-auto object-contain rounded"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center bg-gray-100 text-gray-500 rounded-lg border border-gray-200">
                      暂无身份证正面照片
                    </div>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block mb-2 text-sm font-medium text-gray-500">户主身份证反面</label>
                  {selectedAccount.owner_idcard_img2 ? (
                    <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                      <img 
                        src={selectedAccount.owner_idcard_img2} 
                        alt="身份证反面" 
                        className="w-full max-w-md mx-auto h-auto object-contain rounded"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center bg-gray-100 text-gray-500 rounded-lg border border-gray-200">
                      暂无身份证反面照片
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-end gap-2 mt-4 pt-4 border-t flex-shrink-0">
            <Button 
              variant="outline" 
              className="bg-white border-black text-black" 
              onClick={() => setOwnerInfoViewOpen(false)}
            >
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 查看所有账户详情对话框 */}
      <Dialog open={accountListOpen} onOpenChange={setAccountListOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] bg-white animate-in fade-in-50 zoom-in-95 duration-300 flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-black text-xl font-semibold">账户列表</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-1">
            {isLoadingAllAccounts ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">正在加载账户列表...</span>
              </div>
            ) : allAccounts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                暂无账户数据
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b border-gray-200">
                        {t('otc.accounts.table.holderName')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b border-gray-200">
                        {t('otc.accounts.table.accountNumber')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b border-gray-200">
                        {t('otc.accounts.channel')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b border-gray-200">
                        {t('otc.accounts.balance')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b border-gray-200">
                        {t('otc.accounts.successRate')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allAccounts.map((account, index) => (
                      <tr key={account.id || index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {account.truename || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-mono">
                          {account.appid || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {account.channelid ? (channelTitleMap[account.channelid] || account.channelid) : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {account.amount !== undefined && account.amount !== null && account.amount !== '' 
                            ? typeof account.amount === 'number' 
                              ? account.amount.toFixed(2) 
                              : parseFloat(account.amount).toFixed(2)
                            : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {account.success_rate !== undefined && account.success_rate !== null && account.success_rate !== '' 
                            ? typeof account.success_rate === 'number' 
                              ? `${account.success_rate.toFixed(2)}%` 
                              : `${parseFloat(account.success_rate.toString()).toFixed(2)}%`
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex justify-end gap-2 mt-4 pt-4 border-t flex-shrink-0">
            <Button 
              variant="outline" 
              className="bg-white border-black text-black hover:bg-gray-50" 
              onClick={() => setAccountListOpen(false)}
            >
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 统一风控 Sheet */}
      <Sheet open={riskControlOpen} onOpenChange={setRiskControlOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto bg-white">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl font-bold text-gray-900">统一风控</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-6">
            {/* 是否允许业务员修改风控（仅供应商可见） */}
            {localStorage.getItem('otcRole') === '1' && (
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">是否允许业务员修改风控</Label>
                <Switch
                  checked={allowStaffModify}
                  onCheckedChange={setAllowStaffModify}
                />
              </div>
            )}
            
            {/* 币种选择 */}
            <div>
              <div className="bg-gray-50 rounded-lg p-2 mb-4">
                <div className="flex gap-0.5 rounded-lg">
                  {currencyList.map((item) => (
                    <button
                      key={item.currency}
                      className={`px-3 py-1 rounded-md text-sm ${
                        riskControlCurrency === item.currency
                          ? 'bg-white shadow-sm text-black'
                          : 'text-black'
                      }`}
                      onClick={() => {
                        setRiskControlCurrency(item.currency);
                        setRiskControlPayType(""); // 切换币种时清空支付方式
                        setRiskControlChannel(""); // 切换币种时清空选中的通道
                      }}
                    >
                      {item.currency}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* 支付方式选择（仅在选择了币种后显示） */}
            {riskControlCurrency && riskControlPayTypeData?.data && riskControlPayTypeData.data.length > 0 && (
              <div>
                <div className="bg-gray-50 rounded-lg p-2 mb-4">
                  <div className="flex gap-0.5 rounded-lg flex-wrap">
                    {riskControlPayTypeData.data.map((payType: any) => (
                      <button
                        key={payType.id}
                        className={`px-3 py-1 rounded-md text-sm ${
                          riskControlPayType === payType.id
                            ? 'bg-white shadow-sm text-black'
                            : 'text-black'
                        }`}
                        onClick={() => {
                          setRiskControlPayType(payType.id);
                          setRiskControlChannel(""); // 切换支付方式时清空选中的通道
                        }}
                      >
                        {payType.title || payType.name || payType.id}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* 通道选择（仅在选择了支付方式后显示） */}
            {riskControlPayType && riskControlChannelData?.data && riskControlChannelData.data.length > 0 && (
              <div>
                <div className="bg-gray-50 rounded-lg p-2 mb-4">
                  <div className="flex gap-0.5 rounded-lg flex-wrap">
                    {riskControlChannelData.data.map((channel: any) => {
                      const channelId = channel.channelid || channel.id;
                      return (
                        <button
                          key={channelId}
                          className={`px-3 py-1 rounded-md text-sm ${
                            riskControlChannel === channelId
                              ? 'bg-white shadow-sm text-black'
                              : 'text-black'
                          }`}
                          onClick={() => setRiskControlChannel(channelId)}
                        >
                          {channel.channel_title || channel.title || channelId}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            {/* 表单字段 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">每日限额</Label>
                <Input
                  type="number"
                  value={riskControlData.all_money}
                  onChange={(e) => setRiskControlData({ ...riskControlData, all_money: e.target.value })}
                  className="bg-white text-black"
                  placeholder="请输入每日限额"
                  disabled={isLoadingRiskControl || localStorage.getItem('otcRole') !== '1'}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">每日调用次数</Label>
                <Input
                  type="number"
                  value={riskControlData.paying_num}
                  onChange={(e) => setRiskControlData({ ...riskControlData, paying_num: e.target.value })}
                  className="bg-white text-black"
                  placeholder="请输入每日调用次数"
                  disabled={isLoadingRiskControl || localStorage.getItem('otcRole') !== '1'}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">最小金额</Label>
                <Input
                  type="number"
                  value={riskControlData.min_money}
                  onChange={(e) => setRiskControlData({ ...riskControlData, min_money: e.target.value })}
                  className="bg-white text-black"
                  placeholder="请输入最小金额"
                  disabled={isLoadingRiskControl || localStorage.getItem('otcRole') !== '1'}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">最大金额</Label>
                <Input
                  type="number"
                  value={riskControlData.max_money}
                  onChange={(e) => setRiskControlData({ ...riskControlData, max_money: e.target.value })}
                  className="bg-white text-black"
                  placeholder="请输入最大金额"
                  disabled={isLoadingRiskControl || localStorage.getItem('otcRole') !== '1'}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">最大账户余额</Label>
                <Input
                  type="number"
                  value={riskControlData.max_amount}
                  onChange={(e) => setRiskControlData({ ...riskControlData, max_amount: e.target.value })}
                  className="bg-white text-black"
                  placeholder="请输入最大账户余额"
                  disabled={isLoadingRiskControl || localStorage.getItem('otcRole') !== '1'}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">最小成功率 (%)</Label>
                <Input
                  type="number"
                  value={riskControlData.min_success_rate}
                  onChange={(e) => setRiskControlData({ ...riskControlData, min_success_rate: e.target.value })}
                  className="bg-white text-black"
                  placeholder="例如: 80"
                  disabled={isLoadingRiskControl || localStorage.getItem('otcRole') !== '1'}
                />
              </div>
            </div>
            
            {/* 提示文字 */}
            {riskControlCurrency && riskControlPayType && riskControlChannel && (
              <div className="text-sm text-gray-500 mt-4">
                提示: 当前配置适用于{riskControlCurrency} 币种的{riskControlPayTypeData?.data?.find((p: any) => p.id === riskControlPayType)?.title || '所选支付方式'}下的{riskControlChannelData?.data?.find((c: any) => (c.channelid || c.id) === riskControlChannel)?.channel_title || riskControlChannelData?.data?.find((c: any) => (c.channelid || c.id) === riskControlChannel)?.title || riskControlChannel}通道
              </div>
            )}
          </div>
          
          <SheetFooter className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setRiskControlOpen(false)}
            >
              取消
            </Button>
            {/* 只有供应商才能保存配置 */}
            {localStorage.getItem('otcRole') === '1' && (
              <Button
                onClick={async () => {
                  try {
                    if (!riskControlCurrency) {
                      toast({
                        title: '请选择币种',
                        variant: "destructive",
                      });
                      return;
                    }
                    if (!riskControlPayType) {
                      toast({
                        title: '请选择支付方式',
                        variant: "destructive",
                      });
                      return;
                    }
                    if (!riskControlChannel) {
                      toast({
                        title: '请选择通道',
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    const result = await apiRequest('POST', '/Api/Index/setUserPaytypeControl', {
                      payparams_id: riskControlChannel,
                      max_amount: riskControlData.max_amount || "",
                      all_money: riskControlData.all_money || "",
                      paying_num: riskControlData.paying_num || "",
                      min_money: riskControlData.min_money || "",
                      max_money: riskControlData.max_money || "",
                      min_success_rate: riskControlData.min_success_rate || "",
                      sale_stauts: allowStaffModify ? "1" : "0",
                    });
                    
                    if (result.code === 0) {
                      toast({
                        title: '保存成功',
                        description: '风控配置已保存',
                      });
                      setRiskControlOpen(false);
                    } else {
                      toast({
                        title: '保存失败',
                        description: result.msg || '保存配置时出错',
                        variant: "destructive",
                      });
                    }
                  } catch (error: any) {
                    toast({
                      title: '保存失败',
                      description: error.message || '保存配置时出错',
                      variant: "destructive",
                    });
                  }
                }}
                className="bg-black text-white hover:bg-gray-800"
                disabled={!riskControlCurrency || !riskControlPayType || !riskControlChannel}
              >
                保存配置
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}