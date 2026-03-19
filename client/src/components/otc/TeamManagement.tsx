import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { apiRequest } from "@/lib/queryClient";
import { LOGIN_CONFIG } from "@/config/login";
import { useCurrencyList } from "@/hooks/use-currency-list";
import { ChannelFeeConfig, OvertimePenaltyConfig } from "@/hooks/use-agents";
import { 
  Edit,
  Trash,
  Lock,
  Unlock,
  UserPlus,
  ChevronDown,
  Users,
  Ban,
  UserCog, 
  X,
  Eye,
  Search,
  Pencil,
  Plus,
  Trash2,
  DollarSign
} from "lucide-react";
import { TeamMemberItem, useTeamData } from '@/hooks/use-team-data';
import { cn } from "@/lib/utils";

// 团队成员数据类型 - Adjusted based on likely API response structure
interface TeamMember {
  id: number;
  username: string;
  nickname: string;
  receive_commission: string;
  payment_commission: string;
  receive_fee: string;
  payment_fee: string;
  received_amount: string;
  punish_commission: string;
  extraction_commission: string;
  last_login_time: string;
  status: number;
  tg_account: number;
  user_id: number;
  password: string;
  auto_c2c_sell_status: string;
  auto_c2c_buy_status: string;
  wallet_id?: string;
}

// 翻译文本对象
const translations: Record<'zh' | 'en', Record<string, string>> = {
  'zh': {
    'team.title': '我的团队',
    'team.addMember': '添加成员',
    'team.name': '姓名',
    'team.telegram': 'TG账号',
    'team.status': '状态',
    'team.account': '账号',
    'team.collectionFee': '代收佣金',
    'team.collection': '代收',
    'team.payment': '代付',
    'team.receiveFee': '代收单笔固定手续费',
    'team.paymentFee': '代付单笔固定手续费',
    'team.payoutFee': '代付佣金',
    'team.timeoutFee': '超时处罚佣金',
    'team.otherFee': '额外抽款',
    'team.lastActive': '最近上线时间',
    'team.actions': '操作',
    'team.status.active': '正常',
    'team.status.open': '开启',
    'team.status.pending': '未结单',
    'team.status.frozen': '已冻结',
    'team.status.close': '关闭',
    'team.loadMore': '加载更多',
    'team.emptyTeam': '暂无团队成员数据',
    'team.loadingMore': '正在加载更多团队成员数据...',
    'team.loadingFailed': '无法加载团队成员数据',
    'team.edit.title': '编辑团队成员',
    'team.add.title': '添加团队成员',
    'team.delete.title': '确认删除',
    'team.delete.message': '您确定要删除团队成员吗？此操作不可撤销。',
    'team.password': '设置密码',
    'team.confirmPassword': '确认密码',
    'team.adminPassword': '管理员密码',
    'team.cancel': '取消',
    'team.save': '更新成员',
    'team.saving': '更新中...',
    'team.add': '添加成员',
    'team.adding': '添加中...',
    'team.delete': '确认删除',
    'team.success.add': '已成功添加团队成员',
    'team.success.edit': '已成功更新团队成员信息',
    'team.success.delete': '已删除团队成员',
    'team.marginAmount': '保证金',
    'team.pendingSettlement': '待结算金额',
    'team.todayReceived': '今日收款',
    'team.todayPaid': '今日付款',
    'team.batchAddMember': '批量添加成员',
    'team.batchAdd.title': '批量添加团队成员',
    'team.batchAdd.description': '可以一次性添加多个团队成员，只需输入账号和TG账号',
    'team.batchAdd.memberList': '成员列表',
    'team.batchAdd.addMember': '添加成员行',
    'team.batchAdd.removeMember': '删除',
    'team.batchAdd.success': '批量添加成功',
    'team.batchAdd.error': '批量添加失败',
    'team.viewDetails': '查看详情',
    'team.details.title': '成员详情',
    'team.details.accounts': '账户列表',
    'team.details.noAccounts': '该成员暂无账户',
    'team.details.loading': '加载中...',
    'team.details.receiveAccount': '收款账户',
    'team.details.receiverName': '收款人姓名',
    'team.details.channel': '通道',
    'team.details.accountBalance': '账户余额',
    'team.details.successRate': '成功率',
    'team.walletId': '钱包ID',
    'team.enterWalletId': '请输入钱包ID',
    'team.walletIdRequired': '钱包ID不能为空',
    'team.salaryCurrency': '底薪币种',
    'team.selectSalaryCurrency': '请选择底薪币种',
    'team.salaryMoney': '底薪金额',
    'team.salaryMoneyPlaceholder': '请输入底薪金额',
    'team.salaryStarttime': '开始底薪时间',
    'team.channelFeeConfig': '通道手续费配置',
    'team.selectCurrencyForChannels': '选择币种',
    'team.selectCurrencyFirst': '请先选择币种',
    'team.noChannelData': '暂无通道数据',
    'team.channelFeeConfig.noData': '暂无通道数据',
    'team.channel.collect': '代收',
    'team.channel.payout': '代付',
    'team.channel.receiveCommission': '代收手续费 (%)',
    'team.channel.receiveCommissionPlaceholder': '代收手续费',
    'team.channel.receiveFee': '代收单笔固定手续费',
    'team.channel.receiveFeePlaceholder': '请输入代收固定手续费',
    'team.channel.paymentCommission': '代付手续费 (%)',
    'team.channel.paymentCommissionPlaceholder': '代付手续费',
    'team.channel.paymentFee': '代付单笔固定手续费',
    'team.channel.paymentFeePlaceholder': '请输入代付固定手续费',
    'team.channel.overtimePenalty': '超时罚款配置',
    'team.channel.overtimeMinutes': '超时(分钟)',
    'team.channel.overtimeMinutesPlaceholder': '分钟',
    'team.channel.penaltyPercentage': '手续费惩罚(%)',
    'team.channel.penaltyPercentagePlaceholder': '百分比',
    'team.channel.fixedPenalty': '固定罚款金额',
    'team.channel.fixedPenaltyPlaceholder': '金额',
    'team.channel.noOvertimePenalty': '暂无超时罚款配置，点击添加按钮添加',
    'team.close': '收起',
    'team.edit.description': '修改团队成员信息',
    'team.add.description': '填写以下信息创建团队成员',
    'team.toast.operationSuccess': '操作成功',
    'team.toast.operationFailed': '操作失败',
    'team.success.frozen': '已冻结',
    'team.success.unfrozen': '已解冻',
    'team.toast.getAccountFailed': '获取账户失败',
    'team.toast.getAccountInfoFailed': '无法获取账户信息'
  },
  'en': {
    'team.title': 'My Team',
    'team.addMember': 'Add Member',
    'team.name': 'Name',
    'team.telegram': 'Telegram ID',
    'team.status': 'Status',
    'team.account': 'Account ID',
    'team.collectionFee': 'Collection Fee',
    'team.receiveFee': 'Receive Fee',
    'team.paymentFee': 'Payment Fee',
    'team.payoutFee': 'Payout Fee',
    'team.timeoutFee': 'Timeout Fee',
    'team.otherFee': 'Other Fee',
    'team.lastActive': 'Last Active',
    'team.actions': 'Actions',
    'team.status.active': 'Active',
     'team.status.open': 'Open',
    'team.status.pending': 'Pending',
    'team.status.frozen': 'Frozen',
    'team.status.close': 'Close',
    'team.loadMore': 'Load More',
    'team.emptyTeam': 'No team members found',
    'team.loadingMore': 'Loading more team members...',
    'team.loadingFailed': 'Failed to load team data',
    'team.edit.title': 'Edit Team Member',
    'team.add.title': 'Add Team Member',
    'team.delete.title': 'Confirm Deletion',
    'team.delete.message': 'Are you sure you want to delete this team member? This action cannot be undone.',
    'team.password': 'Password',
    'team.confirmPassword': 'Confirm Password',
    'team.adminPassword': 'Admin Password',
    'team.cancel': 'Cancel',
    'team.save': 'Update Member',
    'team.saving': 'Updating...',
    'team.add': 'Add Member',
    'team.adding': 'Adding...',
    'team.delete': 'Delete',
    'team.success.add': 'Team member added successfully',
    'team.success.edit': 'Team member updated successfully',
    'team.success.delete': 'Team member deleted successfully',
    'team.marginAmount': 'Margin Amount',
    'team.pendingSettlement': 'Pending Settlement',
    'team.todayReceived': 'Today Received',
    'team.todayPaid': 'Today Paid',
    'team.batchAddMember': 'Batch Add Members',
    'team.batchAdd.title': 'Batch Add Team Members',
    'team.batchAdd.description': 'Add multiple team members at once by entering account and Telegram ID only',
    'team.batchAdd.memberList': 'Member List',
    'team.batchAdd.addMember': 'Add Member Row',
    'team.batchAdd.removeMember': 'Remove',
    'team.batchAdd.success': 'Batch add successful',
    'team.batchAdd.error': 'Batch add failed',
    'team.viewDetails': 'View Details',
    'team.details.title': 'Member Details',
    'team.details.accounts': 'Account List',
    'team.details.noAccounts': 'No accounts available for this member',
    'team.details.loading': 'Loading...',
    'team.details.receiveAccount': 'Receive Account',
    'team.details.receiverName': 'Receiver Name',
    'team.details.channel': 'Channel',
    'team.details.accountBalance': 'Account Balance',
    'team.details.successRate': 'Success Rate',
    'team.walletId': 'Wallet ID',
    'team.enterWalletId': 'Please enter wallet ID',
    'team.walletIdRequired': 'Wallet ID is required',
    'team.salaryCurrency': 'Base Salary Currency',
    'team.selectSalaryCurrency': 'Please select base salary currency',
    'team.salaryMoney': 'Base Salary Amount',
    'team.salaryMoneyPlaceholder': 'Please enter base salary amount',
    'team.salaryStarttime': 'Base Salary Start Time',
    'team.channelFeeConfig': 'Channel Fee Configuration',
    'team.selectCurrencyForChannels': 'Select Currency',
    'team.selectCurrencyFirst': 'Please select currency first',
    'team.noChannelData': 'No channel data available',
    'team.channelFeeConfig.noData': 'No channel data available',
    'team.channel.collect': 'Collect',
    'team.channel.payout': 'Payout',
    'team.channel.receiveCommission': 'Collection Fee (%)',
    'team.channel.receiveCommissionPlaceholder': 'Collection fee',
    'team.channel.receiveFee': 'Collection Fixed Fee',
    'team.channel.receiveFeePlaceholder': 'Please enter collection fixed fee',
    'team.channel.paymentCommission': 'Payment Fee (%)',
    'team.channel.paymentCommissionPlaceholder': 'Payment fee',
    'team.channel.paymentFee': 'Payment Fixed Fee',
    'team.channel.paymentFeePlaceholder': 'Please enter payment fixed fee',
    'team.channel.overtimePenalty': 'Overtime Penalty Configuration',
    'team.channel.overtimeMinutes': 'Overtime (minutes)',
    'team.channel.overtimeMinutesPlaceholder': 'Minutes',
    'team.channel.penaltyPercentage': 'Penalty Percentage (%)',
    'team.channel.penaltyPercentagePlaceholder': 'Percentage',
    'team.channel.fixedPenalty': 'Fixed Penalty Amount',
    'team.channel.fixedPenaltyPlaceholder': 'Amount',
    'team.channel.noOvertimePenalty': 'No overtime penalty configuration, click add button to add',
    'team.close': 'Close',
    'team.edit.description': 'Modify team member information',
    'team.add.description': 'Fill in the following information to create a team member',
    'team.toast.operationSuccess': 'Operation successful',
    'team.toast.operationFailed': 'Operation failed',
    'team.success.frozen': 'Frozen',
    'team.success.unfrozen': 'Unfrozen',
    'team.toast.getAccountFailed': 'Failed to get account',
    'team.toast.getAccountInfoFailed': 'Unable to get account information'
  }
};

// 团队成员状态颜色映射 (Updated to handle number status)
const getStatusColorClass = (status: number | string, isButton: boolean = false) => {
  const s = String(status);
  if (isButton) {
    // 按钮样式
    switch (s) {
      case "1": // 未结单 (Assuming 1 is pending)
        return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200";
      case "2": // 接单中 (Assuming 2 is active)
        return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";
      default: // 已冻结或其他
        return "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200";
    }
  } else {
    // 标签样式
    switch (s) {
      case "2": // 接单中
        return "bg-green-100 text-green-800 border-green-200";
      case "1": // 未结单
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "3": // 已冻结 (Assuming 3 is frozen)
      default:
        return "bg-gray-100 text-gray-500 border-gray-200";
    }
  }
};

const getAutoStatusColorClass = (status: number | string, isButton: boolean = false) => {
  const s = String(status);
  if (isButton) {
    // 按钮样式
    switch (s) {
      case "1": // 接单中 (Assuming 2 is active)
        return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";
      case "0": // 接单中 (Assuming 2 is active)
        return "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200";
      default: // 已冻结或其他
        return "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200";
    }
  } else {
    // 标签样式
    switch (s) {
      case "1": // 接单中
        return "bg-green-100 text-green-800 border-green-200";
      case "0": // 未结单
        return "bg-gray-100 text-gray-500 border-gray-200";
      default:
        return "bg-gray-100 text-gray-500 border-gray-200";
    }
  }
};

const getAutoStatusText = (status: number | string, t: (key: string) => string) => {
  const s = String(status);
  switch (s) {
    case "1":
      return t('otc.team.status.open');
    case "0":
      return t('otc.team.status.close');
    default:
      return t('otc.team.status.close');
  }
};

const getStatusText = (status: number | string, t: (key: string) => string) => {
  const s = String(status);
  switch (s) {
    case "0":
      return t('otc.team.status.pending');
    case "1":
      return t('otc.team.status.active');
    case "2":
      return t('otc.team.status.frozen');
    default:
      return String(status);
  }
};

// 团队成员状态颜色映射
const getStatusTextOld = (status: string, t: (key: string) => string) => {
  switch (status) {
    case "正常":
      return t('otc.team.status.active');
    case "未结单":
      return t('otc.team.status.pending');
    case "已冻结":
    default:
      return t('otc.team.status.frozen');
  }
};

// 操作按钮组件
const ActionButtons = ({ member, onSuccess }: { member: TeamMemberItem, onSuccess: () => void }) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [memberAccounts, setMemberAccounts] = useState<any[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isFineDialogOpen, setIsFineDialogOpen] = useState(false);
  const [fineCurrency, setFineCurrency] = useState<string>("");
  const [fineAmount, setFineAmount] = useState<string>("");
  const [fineRemark, setFineRemark] = useState<string>("");
  const [isSubmittingFine, setIsSubmittingFine] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();
  const { data: currencyList = [] } = useCurrencyList();
  const t = (key: string, defaultValue?: string) => {
    // 将 otc.team.xxx 转换为 team.xxx
    const normalizedKey = key.startsWith('otc.team.') ? key.replace('otc.team.', 'team.') : key;
    
    if (translations[language] && translations[language][normalizedKey]) {
      return translations[language][normalizedKey];
    }
    if (translations['zh'] && translations['zh'][normalizedKey]) {
      return translations['zh'][normalizedKey];
    }
    return defaultValue || key;
  };
  const formatAmount = (value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === '') return '-';
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return String(value);
    return numericValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatSuccessRate = (value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === '') return '-';
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return String(value);
    return `${numericValue.toFixed(2)}%`;
  };

  const handleDelete = async () => {
    try {
      // 调用删除供应商接口
      const response = await apiRequest('POST', '/Api/Index/agentsDel', { id: member.id} );

      if (response.code === 0) {
          setIsDeleteDialogOpen(false);
          toast({
            title: t('otc.team.toast.operationSuccess'),
            description: `${t('otc.team.success.delete')}: ${member.username}`,
          });
          onSuccess(); // 调用成功回调刷新数据
      } else {
        // 显示错误提示
        toast({
          title: t('otc.team.toast.operationFailed'),
          description: response.msg,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      // 显示错误提示
        toast({
          title: t('otc.team.toast.operationFailed'),
          description: error.message || t('otc.team.toast.operationFailed'),
          variant: "destructive"
        });
    }
  };

  const handleToggleLock = async () => {
    try {
      // 根据当前状态决定是锁定还是解锁
      const newStatus = member.status === 3 ? 1 : 3; // 3表示冻结，1表示正常
      const response = await apiRequest('POST', '/Api/Index/agentsStatus', { 
        id: member.id,
        status: newStatus
      });

      if (response.code === 0) {
        toast({
          title: t('otc.team.toast.operationSuccess'),
          description: newStatus === 3 ? `${t('otc.team.success.frozen')}: ${member.username}` : `${t('otc.team.success.unfrozen')}: ${member.username}`,
        });
        onSuccess(); // 调用成功回调刷新数据
      } else {
        // 显示错误提示
        toast({
          title: t('otc.team.toast.operationFailed'),
          description: response.msg,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      // 显示错误提示
        toast({
          title: t('otc.team.toast.operationFailed'),
          description: error.message || t('otc.team.toast.operationFailed'),
          variant: "destructive"
        });
    }
  };

  const handleViewDetails = async () => {
    setIsDetailsDialogOpen(true);
    setIsLoadingAccounts(true);
    try {
      // 调用API获取该成员的账户列表
      const response = await apiRequest('POST', '/Api/Index/accountList', { 
        userid: member.user_id,
        id: member.id,
        page: 1,
        limit: 100
      });

      if (response.code === 0) {
        const accountsData = Array.isArray(response.data)
          ? response.data
          : response.data?.list || [];
        setMemberAccounts(accountsData);
      } else {
        toast({
          title: t('otc.team.toast.getAccountFailed'),
          description: response.msg || t('otc.team.toast.getAccountInfoFailed'),
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: '获取账户失败',
        description: error.message || '无法获取账户信息',
        variant: "destructive"
      });
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  // 处理手动罚款
  const handleFineMember = () => {
    setFineCurrency("");
    setFineAmount("");
    setFineRemark("");
    setIsFineDialogOpen(true);
  };

  // 提交手动罚款
  const handleSubmitFine = async () => {
    if (!fineCurrency || !fineAmount) {
      toast({
        title: t('otc.team.toast.operationFailed'),
        description: '请选择币种并输入金额',
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(fineAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: t('otc.team.toast.operationFailed'),
        description: '请输入有效的金额',
        variant: "destructive"
      });
      return;
    }

    setIsSubmittingFine(true);
    try {
      const response = await apiRequest('POST', '/Api/Index/doAgentFine', {
        currency: fineCurrency,
        amount: fineAmount,
        userid: member.user_id || member.id,
        type: 5, // 手动罚款
        remark: fineRemark || ""
      });

      if (response.code === 0) {
        toast({
          title: t('otc.team.toast.operationSuccess'),
          description: '手动罚款已提交'
        });
        setIsFineDialogOpen(false);
        setFineCurrency("");
        setFineAmount("");
        setFineRemark("");
        // 刷新团队成员列表数据
        onSuccess();
      } else {
        toast({
          title: t('otc.team.toast.operationFailed'),
          description: response.msg || '提交失败',
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: t('otc.team.toast.operationFailed'),
        description: error.message || '提交失败',
        variant: "destructive"
      });
    } finally {
      setIsSubmittingFine(false);
    }
  };

  return (
    <div className="flex space-x-2">
      {/* 编辑按钮 */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-blue-600"
        onClick={() => setIsEditDialogOpen(true)}
      >
        <Edit className="h-4 w-4" />
      </Button>
      
      <Sheet open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <SheetContent side="right" className="w-full sm:max-w-3xl max-w-full flex flex-col overflow-hidden p-0 bg-white [&>button]:hidden">
          <SheetHeader className="flex-shrink-0 px-6 pt-4 pb-2 border-b">
            <SheetTitle className="text-black">{t('otc.team.edit.title')}</SheetTitle>
            <SheetDescription className="text-gray-600">
              {t('otc.team.edit.description', '修改团队成员信息')}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6">
            <EditTeamMemberForm 
              member={member} 
              onClose={() => setIsEditDialogOpen(false)} 
              onSuccess={onSuccess}
            />
          </div>
        </SheetContent>
      </Sheet>
      
      {/* 查看详情按钮 */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-purple-600 hover:bg-purple-50"
        onClick={handleViewDetails}
        title={t('otc.team.viewDetails')}
      >
        <Eye className="h-4 w-4" />
      </Button>
      
      {/* 冻结按钮 */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 hover:bg-gray-100 transition-colors"
        onClick={handleToggleLock}
        title={member.status === 3 ? "点击解冻用户" : "点击冻结用户"}
      >
        {member.status === 3 ? (
          <span className="bg-green-100 h-8 w-8 flex items-center justify-center rounded text-green-600 hover:bg-green-200 transition-colors">
            <Unlock className="h-4 w-4" />
          </span>
        ) : (
          <span className="bg-red-100 h-8 w-8 flex items-center justify-center rounded text-red-600 hover:bg-red-200 transition-colors">
            <Lock className="h-4 w-4" />
          </span>
        )}
      </Button>
      
      {/* 手动罚款按钮 */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-orange-600 hover:bg-orange-50"
        onClick={handleFineMember}
        title="手动罚款"
      >
        <DollarSign className="h-4 w-4" />
      </Button>
      
      {/* 删除按钮 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600">
            <Trash className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl bg-white animate-in fade-in-50 zoom-in-95 duration-300">
          <DialogHeader>
            <DialogTitle className="text-black">{t('otc.team.delete.title')}</DialogTitle>
            <DialogDescription className="text-gray-600">
              {t('otc.team.delete.message')}
            </DialogDescription>
          </DialogHeader>
          
          {/* <div className="space-y-4 mt-4">
            <div>
              <label htmlFor="adminPassword" className="block mb-1 text-sm font-medium text-black">
                {t('otc.team.adminPassword')}
              </label>
              <Input
                id="adminPassword"
                type="password"
                placeholder={t('otc.team.adminPassword')}
                className="w-full bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div> */}
          
          <div className="flex justify-end items-center space-x-2 mt-6">
            <Button
              type="button"
              variant="outline"
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              {t('otc.team.cancel')}
            </Button>
            <Button
              type="button"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
            >
              {t('otc.team.delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 查看详情对话框 */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-white animate-in fade-in-50 zoom-in-95 duration-300 flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-black">{t('otc.team.details.title')} - {member.nickname}</DialogTitle>
            <DialogDescription className="text-gray-600">
              {t('otc.team.details.accounts')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto flex-1 pr-2">
            {isLoadingAccounts ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">{t('otc.team.details.loading')}</span>
              </div>
            ) : memberAccounts.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                {t('otc.team.details.noAccounts')}
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('otc.team.details.receiveAccount')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('otc.team.details.receiverName')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('otc.team.details.channel')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('otc.team.details.accountBalance')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('otc.team.details.successRate')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 text-sm text-gray-900">
                      {memberAccounts.map((account: any, index: number) => {
                        const accountNumber = account.appid || account.mch_id || account.username || '-';
                        return (
                          <tr key={account.id || index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-mono text-gray-800 break-all">{accountNumber}</td>
                            <td className="px-4 py-3">{account.truename || '-'}</td>
                            <td className="px-4 py-3">{account.channel_title || '-'}</td>
                            <td className="px-4 py-3">{formatAmount(account.amount)}</td>
                            <td className="px-4 py-3">{formatSuccessRate(account.success_rate)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-3">
                  {memberAccounts.map((account: any, index: number) => {
                    const accountNumber = account.appid || account.mch_id || account.username || '-';
                    return (
                      <div
                        key={account.id || index}
                        className="rounded-lg border border-gray-200 bg-white shadow-sm p-4 space-y-2"
                      >
                        <div className="text-xs text-gray-500">{t('otc.team.details.receiveAccount')}</div>
                        <div className="text-sm font-mono text-gray-900 break-all">{accountNumber}</div>

                        <div className="text-xs text-gray-500">{t('otc.team.details.receiverName')}</div>
                        <div className="text-sm text-gray-900">{account.truename || '-'}</div>

                        <div className="text-xs text-gray-500">{t('otc.team.details.channel')}</div>
                        <div className="text-sm text-gray-900">{account.channel_title || '-'}</div>

                        <div className="text-xs text-gray-500">{t('otc.team.details.accountBalance')}</div>
                        <div className="text-sm text-gray-900">{formatAmount(account.amount)}</div>

                        <div className="text-xs text-gray-500">{t('otc.team.details.successRate')}</div>
                        <div className="text-sm text-gray-900">{formatSuccessRate(account.success_rate)}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          
          <DialogFooter className="flex-shrink-0 border-t border-gray-100 pt-4 mt-4">
            <Button
              variant="outline"
              className="bg-white border-black text-black"
              onClick={() => setIsDetailsDialogOpen(false)}
            >
              {t('otc.team.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 手动罚款对话框 */}
      <Dialog open={isFineDialogOpen} onOpenChange={setIsFineDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-black">手动罚款</DialogTitle>
            <DialogDescription className="text-gray-600">
              为团队成员 {member.nickname || member.username} 添加手动罚款
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fine-currency" className="text-sm font-medium text-gray-700">
                币种
              </Label>
              <Select value={fineCurrency} onValueChange={setFineCurrency}>
                <SelectTrigger id="fine-currency" className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="请选择币种" />
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
            
            <div className="space-y-2">
              <Label htmlFor="fine-amount" className="text-sm font-medium text-gray-700">
                金额
              </Label>
              <Input
                id="fine-amount"
                type="number"
                step="0.01"
                value={fineAmount}
                onChange={(e) => setFineAmount(e.target.value)}
                placeholder="请输入罚款金额"
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fine-remark" className="text-sm font-medium text-gray-700">
                罚款原因
              </Label>
              <Input
                id="fine-remark"
                type="text"
                value={fineRemark}
                onChange={(e) => setFineRemark(e.target.value)}
                placeholder="请输入罚款原因"
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsFineDialogOpen(false)}
              disabled={isSubmittingFine}
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {t('otc.team.cancel')}
            </Button>
            <Button
              onClick={handleSubmitFine}
              disabled={isSubmittingFine || !fineCurrency || !fineAmount}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isSubmittingFine ? '提交中...' : '确认提交'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// 编辑团队成员表单
const EditTeamMemberForm = ({ member, onClose, onSuccess }: { member: TeamMember, onClose: () => void, onSuccess: () => void }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { language } = useLanguage();
  const { data: currencyList = [] } = useCurrencyList();
  
  // 通道手续费配置状态
  const [channelFees, setChannelFees] = useState<{ [channelid: string]: ChannelFeeConfig }>(
    (member as any).channel_fees || {}
  );
  
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
  
  // 通道手续费配置中选中的币种列表
  const [selectedChannelCurrencies, setSelectedChannelCurrencies] = useState<string[]>([]);
  
  // 正在编辑的通道ID
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  
  // 当前选中的币种（用于标签页切换）
  const [activeChannelCurrency, setActiveChannelCurrency] = useState<string>("");
  
  const t = (key: string, defaultValue?: string) => {
    // 将 otc.team.xxx 转换为 team.xxx
    const normalizedKey = key.startsWith('otc.team.') ? key.replace('otc.team.', 'team.') : key;
    
    if (translations[language] && translations[language][normalizedKey]) {
      return translations[language][normalizedKey];
    }
    if (translations['zh'] && translations['zh'][normalizedKey]) {
      return translations['zh'][normalizedKey];
    }
    return defaultValue || key;
  };

  // 加载所有通道数据
  React.useEffect(() => {
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

  // Handle toggling currency selection for channel fees
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

  const [formData, setFormData] = useState({
    username: member.username,
    nickname: member.nickname,
    received_amount: member.received_amount,
    last_login_time: member.last_login_time,
    status: String(member.status),
    tg_account: String(member.tg_account),
    user_id: member.user_id,
    password: member.password,
    auto_c2c_sell_status: String(member.auto_c2c_sell_status),
    auto_c2c_buy_status: String(member.auto_c2c_buy_status),
    wallet_id: member.wallet_id || '',
    salary_currency: (member as any).salary_currency || '',
    salary_money: (member as any).salary_money || '',
    salary_starttime: (member as any).salary_starttime || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const params: any = {
        id: member.id,
        nickname: formData.nickname,
        status: Number(formData.status),
        auto_c2c_sell_status: Number(formData.auto_c2c_sell_status),
        auto_c2c_buy_status: Number(formData.auto_c2c_buy_status)
      };

      // 传递底薪配置
      if (formData.salary_currency) {
        params.salary_currency = formData.salary_currency;
      }
      if (formData.salary_money) {
        params.salary_money = formData.salary_money;
      }
      if (formData.salary_starttime) {
        params.salary_starttime = formData.salary_starttime;
      }

      // 传递通道手续费配置
      if (Object.keys(channelFees).length > 0) {
        params.channel_fees = channelFees;
      }

      // 根据登录模式传递不同的参数
      if (LOGIN_CONFIG.DISPLAY_MODE === 2) {
        // 模式2：传递钱包ID
        params.wallet_id = formData.wallet_id;
      } else {
        // 模式1：传递传统字段
        params.username = formData.username;
        params.tg_account = formData.tg_account;
        params.password = formData.password;
      }

      await apiRequest("POST", '/Api/Index/editUser', params);

      toast({
        title: "成功",
        description: t('otc.team.success.edit')
      });
      
      onSuccess(); // 调用成功回调刷新数据
      onClose();
    } catch (error: any) {
      toast({
        title: "错误",
        description: error?.message || "更新成员失败",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayMode = LOGIN_CONFIG.DISPLAY_MODE;
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 py-2">
      {/* 第二行：客户名称、钱包ID、当前状态（三列） */}
      {displayMode === 2 ? (
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="nickname" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">{t('otc.team.name', '客户名称')}</Label>
            <input 
              id="nickname" 
              name="nickname" 
              value={formData.nickname} 
              onChange={handleInputChange} 
              placeholder={t('otc.team.name', '请输入客户名称')}
              className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
            />
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="wallet_id" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">
              {t('otc.team.walletId', '钱包ID')}
            </Label>
            <input 
              id="wallet_id" 
              name="wallet_id" 
              value={formData.wallet_id || ''} 
              onChange={handleInputChange} 
              placeholder={t('otc.team.enterWalletId', '请输入钱包ID')}
              className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
            />
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="status" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">{t('otc.team.status', '当前状态')}</Label>
            <Select 
              value={formData.status}
              onValueChange={(value) => handleSelectChange("status", value)}
            >
              <SelectTrigger id="status" className="bg-white border-gray-300 text-gray-900 h-10">
                <SelectValue placeholder={t('otc.team.status', '请选择状态')} />
              </SelectTrigger>
              <SelectContent className="bg-white text-gray-900">
                <SelectItem value="1" className="text-gray-900">{t('otc.team.status.active', '正常')}</SelectItem>
                <SelectItem value="0" className="text-gray-900">{t('otc.team.status.frozen', '冻结')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="nickname" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">{t('otc.team.name', '客户名称')}</Label>
            <input 
              id="nickname" 
              name="nickname" 
              value={formData.nickname} 
              onChange={handleInputChange} 
              placeholder={t('otc.team.name', '请输入客户名称')}
              className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
            />
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="tg_account" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">{t('otc.team.telegram', 'TG账号')}</Label>
            <input 
              id="tg_account" 
              name="tg_account" 
              value={formData.tg_account} 
              onChange={handleInputChange} 
              placeholder={t('otc.team.telegram', '请输入TG账号')}
              className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
            />
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="status" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">{t('otc.team.status', '当前状态')}</Label>
            <Select 
              value={formData.status}
              onValueChange={(value) => handleSelectChange("status", value)}
            >
              <SelectTrigger id="status" className="bg-white border-gray-300 text-gray-900 h-10">
                <SelectValue placeholder={t('otc.team.status', '请选择状态')} />
              </SelectTrigger>
              <SelectContent className="bg-white text-gray-900">
                <SelectItem value="1" className="text-gray-900">{t('otc.team.status.active', '正常')}</SelectItem>
                <SelectItem value="0" className="text-gray-900">{t('otc.team.status.frozen', '冻结')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      
      {displayMode === 1 && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="username" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">{t('otc.team.account', '账号')}</Label>
              <input 
                id="username" 
                name="username" 
                value={formData.username} 
                onChange={handleInputChange} 
                placeholder={t('otc.team.account', '请输入账号')}
                className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
              />
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">{t('otc.team.password', '密码')}</Label>
              <input 
                id="password" 
                name="password"
                type="password"
                value={formData.password} 
                onChange={handleInputChange} 
                placeholder={t('otc.team.password', '请输入密码')}
                className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
              />
            </div>
          </div>
        </>
      )}
      
      {/* 第三行：底薪币种、底薪金额、开始底薪时间（三列） */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="salary_currency" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">
            {t('otc.team.salaryCurrency', '底薪币种')}
          </Label>
          <Select 
            value={formData.salary_currency || ""}
            onValueChange={(value) => handleSelectChange("salary_currency", value)}
          >
            <SelectTrigger id="salary_currency" className="bg-white border-gray-300 text-gray-900 h-10">
              <SelectValue placeholder={t('otc.team.selectSalaryCurrency', '请选择底薪币种')} />
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
            {t('otc.team.salaryMoney', '底薪金额')}
          </Label>
          <input 
            id="salary_money" 
            name="salary_money" 
            type="number"
            step="0.01"
            value={formData.salary_money || ''} 
            onChange={handleInputChange} 
            placeholder={t('otc.team.salaryMoneyPlaceholder', '请输入底薪金额')}
            className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
          />
        </div>
        
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="salary_starttime" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">
            {t('otc.team.salaryStarttime', '开始底薪时间')}
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
      
      {/* 第四行：代收状态、代付状态（两列） */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="auto_c2c_sell_status" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">
            {t('otc.team.collection', '代收')}
          </Label>
          <Select 
            value={formData.auto_c2c_sell_status || "1"}
            onValueChange={(value) => handleSelectChange("auto_c2c_sell_status", value)}
          >
            <SelectTrigger id="auto_c2c_sell_status" className="bg-white border-gray-300 text-gray-900 h-10">
              <SelectValue placeholder={t('otc.team.status', '请选择状态')} />
            </SelectTrigger>
            <SelectContent className="bg-white text-gray-900">
              <SelectItem value="1" className="text-gray-900">{t('otc.team.status.open', '开启')}</SelectItem>
              <SelectItem value="0" className="text-gray-900">{t('otc.team.status.close', '关闭')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="auto_c2c_buy_status" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">
            {t('otc.team.payment', '代付')}
          </Label>
          <Select 
            value={formData.auto_c2c_buy_status || "1"}
            onValueChange={(value) => handleSelectChange("auto_c2c_buy_status", value)}
          >
            <SelectTrigger id="auto_c2c_buy_status" className="bg-white border-gray-300 text-gray-900 h-10">
              <SelectValue placeholder={t('otc.team.status', '请选择状态')} />
            </SelectTrigger>
            <SelectContent className="bg-white text-gray-900">
              <SelectItem value="1" className="text-gray-900">{t('otc.team.status.open', '开启')}</SelectItem>
              <SelectItem value="0" className="text-gray-900">{t('otc.team.status.close', '关闭')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* 通道手续费配置 */}
      <div className="space-y-2">
        <Label className="text-gray-700 text-sm font-medium">
          {t('otc.team.channelFeeConfig', '通道手续费配置')}
        </Label>
        
        {/* 币种选择标签页 */}
        <div className="space-y-1.5">
          <Label className="text-gray-700 text-sm">
            {t('otc.team.selectCurrencyForChannels', '选择币种')}
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
          <p className="text-sm text-gray-500">{t('otc.team.selectCurrencyFirst', '请先选择币种')}</p>
        ) : !activeChannelCurrency ? (
          <p className="text-sm text-gray-500">{t('otc.team.selectCurrencyFirst', '请先选择币种')}</p>
        ) : allChannels.length === 0 ? (
          <p className="text-sm text-gray-500">{t('otc.team.noChannelData', '暂无通道数据')}</p>
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
                                          return <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">{t('otc.team.channel.collect', '代收')}</span>;
                                        } else if (channelType === 1 || channelType === "1") {
                                          return <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">{t('otc.team.channel.payout', '代付')}</span>;
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
                                            return <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">{t('otc.team.channel.collect', '代收')}</span>;
                                          } else if (channelType === 1 || channelType === "1") {
                                            return <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">{t('otc.team.channel.payout', '代付')}</span>;
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
                                    {t('otc.team.close', '收起')}
                                  </Button>
                                </div>
                                
                                {/* 费率输入框 */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label htmlFor={`channel-${channel.channelid}-receive-commission`} className="text-xs text-gray-600">
                                      {t('otc.team.channel.receiveCommission', '代收手续费 (%)')}
                                    </Label>
                                    <input
                                      id={`channel-${channel.channelid}-receive-commission`}
                                      type="number"
                                      step="0.01"
                                      value={feeConfig.receive_commission}
                                      onChange={(e) => handleChannelFeeChange(channel.channelid, "receive_commission", e.target.value)}
                                      placeholder={t('otc.team.channel.receiveCommissionPlaceholder', '代收手续费')}
                                      className="w-full h-9 px-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label htmlFor={`channel-${channel.channelid}-receive-fee`} className="text-xs text-gray-600">
                                      {t('otc.team.channel.receiveFee', '代收单笔固定手续费')}
                                    </Label>
                                    <input
                                      id={`channel-${channel.channelid}-receive-fee`}
                                      type="number"
                                      step="0.01"
                                      value={feeConfig.receive_fee}
                                      onChange={(e) => handleChannelFeeChange(channel.channelid, "receive_fee", e.target.value)}
                                      placeholder={t('otc.team.channel.receiveFeePlaceholder', '请输入代收固定手续费')}
                                      className="w-full h-9 px-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label htmlFor={`channel-${channel.channelid}-payment-commission`} className="text-xs text-gray-600">
                                      {t('otc.team.channel.paymentCommission', '代付手续费 (%)')}
                                    </Label>
                                    <input
                                      id={`channel-${channel.channelid}-payment-commission`}
                                      type="number"
                                      step="0.01"
                                      value={feeConfig.payment_commission}
                                      onChange={(e) => handleChannelFeeChange(channel.channelid, "payment_commission", e.target.value)}
                                      placeholder={t('otc.team.channel.paymentCommissionPlaceholder', '代付手续费')}
                                      className="w-full h-9 px-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label htmlFor={`channel-${channel.channelid}-payment-fee`} className="text-xs text-gray-600">
                                      {t('otc.team.channel.paymentFee', '代付单笔固定手续费')}
                                    </Label>
                                    <input
                                      id={`channel-${channel.channelid}-payment-fee`}
                                      type="number"
                                      step="0.01"
                                      value={feeConfig.payment_fee}
                                      onChange={(e) => handleChannelFeeChange(channel.channelid, "payment_fee", e.target.value)}
                                      placeholder={t('otc.team.channel.paymentFeePlaceholder', '请输入代付固定手续费')}
                                      className="w-full h-9 px-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                </div>
                                
                                {/* 超时罚款配置表格 */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs text-gray-600 font-medium">
                                      {t('otc.team.channel.overtimePenalty', '超时罚款配置')}
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
                                      {t('otc.team.add', '添加')}
                                    </Button>
                                  </div>
                                  <div className="border border-gray-200 rounded-md bg-gray-50 overflow-hidden">
                                    <table className="w-full">
                                      <thead>
                                        <tr className="bg-gray-200">
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b border-gray-300">
                                            {t('otc.team.channel.overtimeMinutes', '超时(分钟)')}
                                          </th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b border-gray-300">
                                            {t('otc.team.channel.penaltyPercentage', '手续费惩罚(%)')}
                                          </th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b border-gray-300">
                                            {t('otc.team.channel.fixedPenalty', '固定罚款金额')}
                                          </th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b border-gray-300 w-12">
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {overtimePenalties.length === 0 ? (
                                          <tr>
                                            <td colSpan={4} className="px-3 py-4 text-center text-xs text-gray-500">
                                              {t('otc.team.channel.noOvertimePenalty', '暂无超时罚款配置，点击添加按钮添加')}
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
                                                  placeholder={t('otc.team.channel.overtimeMinutesPlaceholder', '分钟')}
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
                                                  placeholder={t('otc.team.channel.penaltyPercentagePlaceholder', '百分比')}
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
                                                  placeholder={t('otc.team.channel.fixedPenaltyPlaceholder', '金额')}
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
      
      <SheetFooter className="flex justify-end items-center space-x-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          onClick={onClose}
          disabled={isSubmitting}
        >
          {t('otc.team.cancel')}
        </Button>
        <Button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? t('otc.team.saving') : t('otc.team.save')}
        </Button>
      </SheetFooter>
    </form>
  );
};

// 添加团队成员表单
const AddTeamMemberForm = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { language } = useLanguage();
  const { data: currencyList = [] } = useCurrencyList();
  
  // 通道手续费配置状态
  const [channelFees, setChannelFees] = useState<{ [channelid: string]: ChannelFeeConfig }>({});
  
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
  
  // 通道手续费配置中选中的币种列表
  const [selectedChannelCurrencies, setSelectedChannelCurrencies] = useState<string[]>([]);
  
  // 正在编辑的通道ID
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  
  // 当前选中的币种（用于标签页切换）
  const [activeChannelCurrency, setActiveChannelCurrency] = useState<string>("");
  
  // 加载所有通道数据
  React.useEffect(() => {
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

  // Handle toggling currency selection for channel fees
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

  const [formData, setFormData] = useState({
    username: '',
    nickname: '',
    tg_account: '',
    status: '1',
    password: '',
    confirmPassword: '',
    auto_c2c_sell_status: '1',
    auto_c2c_buy_status: '1',
    wallet_id: '',
    salary_currency: '',
    salary_money: '',
    salary_starttime: ''
  });

  const [errors, setErrors] = useState({
    username: '',
    nickname: '',
    tg_account: ''
  });

  const t = (key: string, defaultValue?: string) => {
    // 将 otc.team.xxx 转换为 team.xxx
    const normalizedKey = key.startsWith('otc.team.') ? key.replace('otc.team.', 'team.') : key;
    
    if (translations[language] && translations[language][normalizedKey]) {
      return translations[language][normalizedKey];
    }
    if (translations['zh'] && translations['zh'][normalizedKey]) {
      return translations['zh'][normalizedKey];
    }
    return defaultValue || key;
  };

  const validateForm = () => {
    const newErrors = {
      username: '',
      nickname: '',
      tg_account: '',
      wallet_id: ''
    };
    let isValid = true;

    // 姓名在所有模式下都是必填的
    if (!formData.nickname.trim()) {
      newErrors.nickname = '姓名不能为空';
      isValid = false;
    }

    // 根据登录模式进行不同的验证
    if (LOGIN_CONFIG.DISPLAY_MODE === 2) {
      // 模式2：验证钱包ID
      if (!formData.wallet_id.trim()) {
        newErrors.wallet_id = t('otc.team.walletIdRequired');
        isValid = false;
      }
    } else {
      // 模式1：验证传统字段
    if (!formData.username.trim()) {
      newErrors.username = '账号不能为空';
      isValid = false;
    }

    if (!formData.tg_account.trim()) {
      newErrors.tg_account = 'TG账号不能为空';
      isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证必填字段
    if (!validateForm()) {
      return;
    }
    
    // 验证密码（仅在模式1下）
    if (LOGIN_CONFIG.DISPLAY_MODE === 1 && formData.password !== formData.confirmPassword) {
      toast({
        title: "错误",
        description: "两次输入的密码不一致",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const params: any = {
        nickname: formData.nickname,
        status: Number(formData.status),
        auto_c2c_sell_status: Number(formData.auto_c2c_sell_status),
        auto_c2c_buy_status: Number(formData.auto_c2c_buy_status)
      };

      // 传递底薪配置
      if (formData.salary_currency) {
        params.salary_currency = formData.salary_currency;
      }
      if (formData.salary_money) {
        params.salary_money = formData.salary_money;
      }
      if (formData.salary_starttime) {
        params.salary_starttime = formData.salary_starttime;
      }

      // 传递通道手续费配置
      if (Object.keys(channelFees).length > 0) {
        params.channel_fees = channelFees;
      }

      // 根据登录模式传递不同的参数
      if (LOGIN_CONFIG.DISPLAY_MODE === 2) {
        // 模式2：传递钱包ID
        params.wallet_id = formData.wallet_id;
      } else {
        // 模式1：传递传统字段
        params.username = formData.username;
        params.tg_account = formData.tg_account;
        params.password = formData.password;
      }

      await apiRequest("POST", '/Api/Index/addUser', params);

      toast({
        title: "成功",
        description: t('otc.team.success.add')
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "错误",
        description: error?.message || "添加成员失败",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayMode = LOGIN_CONFIG.DISPLAY_MODE;
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // 清除对应字段的错误信息
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 py-2">
      {/* 第二行：客户名称、钱包ID、当前状态（三列） */}
      {displayMode === 2 ? (
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="nickname" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">{t('otc.team.name', '客户名称')}</Label>
            <input 
              id="nickname" 
              name="nickname" 
              value={formData.nickname} 
              onChange={handleInputChange} 
              placeholder={t('otc.team.name', '请输入客户名称')}
              className={`w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black ${
                errors.nickname ? 'border-red-500' : ''
              }`}
            />
            {errors.nickname && (
              <p className="text-xs text-red-500">{errors.nickname}</p>
            )}
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="wallet_id" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">
              {t('otc.team.walletId', '钱包ID')}
            </Label>
            <input 
              id="wallet_id" 
              name="wallet_id" 
              value={formData.wallet_id || ''} 
              onChange={handleInputChange} 
              placeholder={t('otc.team.enterWalletId', '请输入钱包ID')}
              className={`w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black ${
                errors.wallet_id ? 'border-red-500' : ''
              }`}
            />
            {errors.wallet_id && (
              <p className="text-xs text-red-500">{errors.wallet_id}</p>
            )}
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="status" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">{t('otc.team.status', '当前状态')}</Label>
            <Select 
              value={formData.status}
              onValueChange={(value) => handleSelectChange("status", value)}
            >
              <SelectTrigger id="status" className="bg-white border-gray-300 text-gray-900 h-10">
                <SelectValue placeholder={t('otc.team.status', '请选择状态')} />
              </SelectTrigger>
              <SelectContent className="bg-white text-gray-900">
                <SelectItem value="1" className="text-gray-900">{t('otc.team.status.active', '正常')}</SelectItem>
                <SelectItem value="0" className="text-gray-900">{t('otc.team.status.frozen', '冻结')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="nickname" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">{t('otc.team.name', '客户名称')}</Label>
            <input 
              id="nickname" 
              name="nickname" 
              value={formData.nickname} 
              onChange={handleInputChange} 
              placeholder={t('otc.team.name', '请输入客户名称')}
              className={`w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black ${
                errors.nickname ? 'border-red-500' : ''
              }`}
            />
            {errors.nickname && (
              <p className="text-xs text-red-500">{errors.nickname}</p>
            )}
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="tg_account" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">{t('otc.team.telegram', 'TG账号')}</Label>
            <input 
              id="tg_account" 
              name="tg_account" 
              value={formData.tg_account} 
              onChange={handleInputChange} 
              placeholder={t('otc.team.telegram', '请输入TG账号')}
              className={`w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black ${
                errors.tg_account ? 'border-red-500' : ''
              }`}
            />
            {errors.tg_account && (
              <p className="text-xs text-red-500">{errors.tg_account}</p>
            )}
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="status" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">{t('otc.team.status', '当前状态')}</Label>
            <Select 
              value={formData.status}
              onValueChange={(value) => handleSelectChange("status", value)}
            >
              <SelectTrigger id="status" className="bg-white border-gray-300 text-gray-900 h-10">
                <SelectValue placeholder={t('otc.team.status', '请选择状态')} />
              </SelectTrigger>
              <SelectContent className="bg-white text-gray-900">
                <SelectItem value="1" className="text-gray-900">{t('otc.team.status.active', '正常')}</SelectItem>
                <SelectItem value="0" className="text-gray-900">{t('otc.team.status.frozen', '冻结')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      
      {displayMode === 1 && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="username" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">{t('otc.team.account', '账号')}</Label>
              <input 
                id="username" 
                name="username" 
                value={formData.username} 
                onChange={handleInputChange} 
                placeholder={t('otc.team.account', '请输入账号')}
                className={`w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black ${
                  errors.username ? 'border-red-500' : ''
                }`}
              />
              {errors.username && (
                <p className="text-xs text-red-500">{errors.username}</p>
              )}
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">{t('otc.team.password', '密码')}</Label>
              <input 
                id="password" 
                name="password"
                type="password"
                value={formData.password} 
                onChange={handleInputChange} 
                placeholder={t('otc.team.password', '请输入密码')}
                className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
              />
            </div>
          </div>
        </>
      )}
      
      {/* 第三行：底薪币种、底薪金额、开始底薪时间（三列） */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="salary_currency" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">
            {t('otc.team.salaryCurrency', '底薪币种')}
          </Label>
          <Select 
            value={formData.salary_currency || ""}
            onValueChange={(value) => handleSelectChange("salary_currency", value)}
          >
            <SelectTrigger id="salary_currency" className="bg-white border-gray-300 text-gray-900 h-10">
              <SelectValue placeholder={t('otc.team.selectSalaryCurrency', '请选择底薪币种')} />
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
            {t('otc.team.salaryMoney', '底薪金额')}
          </Label>
          <input 
            id="salary_money" 
            name="salary_money" 
            type="number"
            step="0.01"
            value={formData.salary_money || ''} 
            onChange={handleInputChange} 
            placeholder={t('otc.team.salaryMoneyPlaceholder', '请输入底薪金额')}
            className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
          />
        </div>
        
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="salary_starttime" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">
            {t('otc.team.salaryStarttime', '开始底薪时间')}
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
      
      {/* 第四行：代收状态、代付状态（两列） */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="auto_c2c_sell_status" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">
            {t('otc.team.collection', '代收')}
          </Label>
          <Select 
            value={formData.auto_c2c_sell_status || "1"}
            onValueChange={(value) => handleSelectChange("auto_c2c_sell_status", value)}
          >
            <SelectTrigger id="auto_c2c_sell_status" className="bg-white border-gray-300 text-gray-900 h-10">
              <SelectValue placeholder={t('otc.team.status', '请选择状态')} />
            </SelectTrigger>
            <SelectContent className="bg-white text-gray-900">
              <SelectItem value="1" className="text-gray-900">{t('otc.team.status.open', '开启')}</SelectItem>
              <SelectItem value="0" className="text-gray-900">{t('otc.team.status.close', '关闭')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="auto_c2c_buy_status" className="text-gray-700 text-sm h-5 flex items-center whitespace-nowrap">
            {t('otc.team.payment', '代付')}
          </Label>
          <Select 
            value={formData.auto_c2c_buy_status || "1"}
            onValueChange={(value) => handleSelectChange("auto_c2c_buy_status", value)}
          >
            <SelectTrigger id="auto_c2c_buy_status" className="bg-white border-gray-300 text-gray-900 h-10">
              <SelectValue placeholder={t('otc.team.status', '请选择状态')} />
            </SelectTrigger>
            <SelectContent className="bg-white text-gray-900">
              <SelectItem value="1" className="text-gray-900">{t('otc.team.status.open', '开启')}</SelectItem>
              <SelectItem value="0" className="text-gray-900">{t('otc.team.status.close', '关闭')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* 通道手续费配置 */}
      <div className="space-y-2">
        <Label className="text-gray-700 text-sm font-medium">
          {t('otc.team.channelFeeConfig', '通道手续费配置')}
        </Label>
        
        {/* 币种选择标签页 */}
        <div className="space-y-1.5">
          <Label className="text-gray-700 text-sm">
            {t('otc.team.selectCurrencyForChannels', '选择币种')}
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
          <p className="text-sm text-gray-500">{t('otc.team.selectCurrencyFirst', '请先选择币种')}</p>
        ) : !activeChannelCurrency ? (
          <p className="text-sm text-gray-500">{t('otc.team.selectCurrencyFirst', '请先选择币种')}</p>
        ) : allChannels.length === 0 ? (
          <p className="text-sm text-gray-500">{t('otc.team.noChannelData', '暂无通道数据')}</p>
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
                                          return <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">{t('otc.team.channel.collect', '代收')}</span>;
                                        } else if (channelType === 1 || channelType === "1") {
                                          return <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">{t('otc.team.channel.payout', '代付')}</span>;
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
                                            return <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">{t('otc.team.channel.collect', '代收')}</span>;
                                          } else if (channelType === 1 || channelType === "1") {
                                            return <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">{t('otc.team.channel.payout', '代付')}</span>;
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
                                    {t('otc.team.close', '收起')}
                                  </Button>
                                </div>
                                
                                {/* 费率输入框 */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label htmlFor={`channel-${channel.channelid}-receive-commission`} className="text-xs text-gray-600">
                                      {t('otc.team.channel.receiveCommission', '代收手续费 (%)')}
                                    </Label>
                                    <input
                                      id={`channel-${channel.channelid}-receive-commission`}
                                      type="number"
                                      step="0.01"
                                      value={feeConfig.receive_commission}
                                      onChange={(e) => handleChannelFeeChange(channel.channelid, "receive_commission", e.target.value)}
                                      placeholder={t('otc.team.channel.receiveCommissionPlaceholder', '代收手续费')}
                                      className="w-full h-9 px-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label htmlFor={`channel-${channel.channelid}-receive-fee`} className="text-xs text-gray-600">
                                      {t('otc.team.channel.receiveFee', '代收单笔固定手续费')}
                                    </Label>
                                    <input
                                      id={`channel-${channel.channelid}-receive-fee`}
                                      type="number"
                                      step="0.01"
                                      value={feeConfig.receive_fee}
                                      onChange={(e) => handleChannelFeeChange(channel.channelid, "receive_fee", e.target.value)}
                                      placeholder={t('otc.team.channel.receiveFeePlaceholder', '请输入代收固定手续费')}
                                      className="w-full h-9 px-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label htmlFor={`channel-${channel.channelid}-payment-commission`} className="text-xs text-gray-600">
                                      {t('otc.team.channel.paymentCommission', '代付手续费 (%)')}
                                    </Label>
                                    <input
                                      id={`channel-${channel.channelid}-payment-commission`}
                                      type="number"
                                      step="0.01"
                                      value={feeConfig.payment_commission}
                                      onChange={(e) => handleChannelFeeChange(channel.channelid, "payment_commission", e.target.value)}
                                      placeholder={t('otc.team.channel.paymentCommissionPlaceholder', '代付手续费')}
                                      className="w-full h-9 px-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label htmlFor={`channel-${channel.channelid}-payment-fee`} className="text-xs text-gray-600">
                                      {t('otc.team.channel.paymentFee', '代付单笔固定手续费')}
                                    </Label>
                                    <input
                                      id={`channel-${channel.channelid}-payment-fee`}
                                      type="number"
                                      step="0.01"
                                      value={feeConfig.payment_fee}
                                      onChange={(e) => handleChannelFeeChange(channel.channelid, "payment_fee", e.target.value)}
                                      placeholder={t('otc.team.channel.paymentFeePlaceholder', '请输入代付固定手续费')}
                                      className="w-full h-9 px-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                </div>
                                
                                {/* 超时罚款配置表格 */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs text-gray-600 font-medium">
                                      {t('otc.team.channel.overtimePenalty', '超时罚款配置')}
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
                                      {t('otc.team.add', '添加')}
                                    </Button>
                                  </div>
                                  <div className="border border-gray-200 rounded-md bg-gray-50 overflow-hidden">
                                    <table className="w-full">
                                      <thead>
                                        <tr className="bg-gray-200">
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b border-gray-300">
                                            {t('otc.team.channel.overtimeMinutes', '超时(分钟)')}
                                          </th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b border-gray-300">
                                            {t('otc.team.channel.penaltyPercentage', '手续费惩罚(%)')}
                                          </th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b border-gray-300">
                                            {t('otc.team.channel.fixedPenalty', '固定罚款金额')}
                                          </th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b border-gray-300 w-12">
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {overtimePenalties.length === 0 ? (
                                          <tr>
                                            <td colSpan={4} className="px-3 py-4 text-center text-xs text-gray-500">
                                              {t('otc.team.channel.noOvertimePenalty', '暂无超时罚款配置，点击添加按钮添加')}
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
                                                  placeholder={t('otc.team.channel.overtimeMinutesPlaceholder', '分钟')}
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
                                                  placeholder={t('otc.team.channel.penaltyPercentagePlaceholder', '百分比')}
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
                                                  placeholder={t('otc.team.channel.fixedPenaltyPlaceholder', '金额')}
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
      
      <SheetFooter className="flex justify-end items-center space-x-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          onClick={onClose}
          disabled={isSubmitting}
        >
          {t('otc.team.cancel')}
        </Button>
        <Button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? t('otc.team.adding') : t('otc.team.add')}
        </Button>
      </SheetFooter>
    </form>
  );
};

// 批量添加团队成员表单组件
const BatchAddTeamMemberForm = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const t = (key: string, defaultValue?: string) => {
    // 将 otc.team.xxx 转换为 team.xxx
    const normalizedKey = key.startsWith('otc.team.') ? key.replace('otc.team.', 'team.') : key;
    
    if (translations[language] && translations[language][normalizedKey]) {
      return translations[language][normalizedKey];
    }
    if (translations['zh'] && translations['zh'][normalizedKey]) {
      return translations['zh'][normalizedKey];
    }
    return defaultValue || key;
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [members, setMembers] = useState<Array<{
    username: string;
    tg_account: string;
    wallet_id: string;
    nickname: string;
  }>>([{
    username: '',
    tg_account: '',
    wallet_id: '',
    nickname: ''
  }]);

  // 添加成员行
  const addMemberRow = () => {
    setMembers([...members, {
      username: '',
      tg_account: '',
      wallet_id: '',
      nickname: ''
    }]);
  };

  // 删除成员行
  const removeMemberRow = (index: number) => {
    if (members.length > 1) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  // 更新成员信息
  const updateMember = (index: number, field: string, value: string) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setMembers(newMembers);
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 验证所有成员信息
      for (let i = 0; i < members.length; i++) {
        const member = members[i];
        if (LOGIN_CONFIG.DISPLAY_MODE === 2) {
          // 模式2：验证姓名和钱包ID
          if (!member.nickname) {
            toast({
              title: t('otc.team.validationFailed'),
              description: `第 ${i + 1} 个成员的姓名不能为空`,
              variant: "destructive"
            });
            setIsSubmitting(false);
            return;
          }
          if (!member.wallet_id) {
            toast({
              title: t('otc.team.validationFailed'),
              description: t('otc.team.batchAdd.walletIdRequired').replace('{index}', String(i + 1)),
              variant: "destructive"
            });
            setIsSubmitting(false);
            return;
          }
        } else {
          // 模式1：验证传统字段
        if (!member.username || !member.tg_account) {
          toast({
            title: '验证失败',
            description: `第 ${i + 1} 个成员信息不完整`,
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
          }
        }
      }

      // 批量添加成员 - 调用批量添加接口
      const addList = members.map(member => {
        if (LOGIN_CONFIG.DISPLAY_MODE === 2) {
          // 模式2：传递姓名和钱包ID
          return {
            nickname: member.nickname,
            wallet_id: member.wallet_id
          };
        } else {
          // 模式1：传递传统字段
          return {
        username: member.username,
        tg_account: member.tg_account
          };
        }
      });

      const result = await apiRequest('POST', '/Api/Index/addBatchUser', {
        addList: addList
      });

      if (result.code === 0) {
        toast({
          title: t('otc.team.batchAdd.success'),
          description: `成功添加 ${members.length} 个成员`,
        });
        onSuccess();
        onClose();
      } else {
        toast({
          title: t('otc.team.batchAdd.error'),
          description: result.msg || '批量添加失败',
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: t('otc.team.batchAdd.error'),
        description: error.message || '批量添加失败',
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 手动输入模式 */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">{t('otc.team.batchAdd.memberList')}</h3>
          <Button
            type="button"
            variant="outline"
            onClick={addMemberRow}
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            {t('otc.team.batchAdd.addMember')}
          </Button>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {members.map((member, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-gray-700">成员 {index + 1}</h4>
                {members.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMemberRow(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-1" />
                    {t('otc.team.batchAdd.removeMember')}
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {LOGIN_CONFIG.DISPLAY_MODE === 2 ? (
                  <>
                    <div>
                      <Label htmlFor={`nickname-${index}`} className="text-sm font-medium text-gray-700">
                        姓名 *
                      </Label>
                      <Input
                        id={`nickname-${index}`}
                        value={member.nickname}
                        onChange={(e) => updateMember(index, 'nickname', e.target.value)}
                        placeholder="请输入姓名"
                        className="w-full bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`wallet_id-${index}`} className="text-sm font-medium text-gray-700">
                        钱包ID *
                      </Label>
                      <Input
                        id={`wallet_id-${index}`}
                        value={member.wallet_id}
                        onChange={(e) => updateMember(index, 'wallet_id', e.target.value)}
                        placeholder={t('otc.team.enterWalletId')}
                        className="w-full bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                        required
                      />
                    </div>
                  </>
                ) : (
                  <>
                <div>
                  <Label htmlFor={`username-${index}`} className="text-sm font-medium text-gray-700">
                    {t('otc.team.account')} *
                  </Label>
                  <Input
                    id={`username-${index}`}
                    value={member.username}
                    onChange={(e) => updateMember(index, 'username', e.target.value)}
                    placeholder={t('otc.team.account')}
                    className="w-full bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor={`tg_account-${index}`} className="text-sm font-medium text-gray-700">
                    {t('otc.team.telegram')} *
                  </Label>
                  <Input
                    id={`tg_account-${index}`}
                    value={member.tg_account}
                    onChange={(e) => updateMember(index, 'tg_account', e.target.value)}
                    placeholder={t('otc.team.telegram')}
                    className="w-full bg-white border-gray-200 transition-all duration-300 ease-in-out hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                    required
                  />
                </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end items-center space-x-2 mt-6">
        <Button
          type="button"
          variant="outline"
          className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          onClick={onClose}
          disabled={isSubmitting}
        >
          {t('otc.team.cancel')}
        </Button>
        <Button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? t('otc.team.adding') : t('otc.team.batchAddMember')}
        </Button>
      </div>
    </form>
  );
};

// 团队管理组件
export default function TeamManagement() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBatchAddDialogOpen, setIsBatchAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [walletIdSearch, setWalletIdSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, active, pending, frozen
  const [amountDetailMember, setAmountDetailMember] = useState<TeamMemberItem | null>(null);
  const [isAmountDetailOpen, setIsAmountDetailOpen] = useState(false);

  // 使用 useTeamData hook 获取团队成员数据
  const { 
    data: teamData,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetching,
    isFetchingNextPage,
    error,
    refetch
  } = useTeamData({ 
    status: filterStatus === 'all' ? undefined : String(filterStatus), 
    user_id: searchTerm || undefined,
    wallet_id: walletIdSearch || undefined
  }); // Pass filter states as parameters, convert status to string, use user_name for search

  const paginatedMembers = useMemo(() => {
    // hook 已经处理了分页，直接返回所有加载的数据
    return teamData?.pages.flatMap(page => page.data.list) || [];
  }, [teamData]);

  // 格式化时间戳函数
  const formatTimestamp = (timestamp: string | number | undefined): string => {
    if (!timestamp) return '-';
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString(); // Or format as needed
  };

  // 计算额度预警信息
  const calculateAmountWarning = (amount?: TeamMemberItem['amount']) => {
    if (!amount || Object.keys(amount).length === 0) {
      return { items: [{ text: '正常', color: 'text-gray-600', bgColor: 'bg-gray-100' }] };
    }

    const warnings: Array<{ currency: string; text: string; percentage: number; color: string; bgColor: string }> = [];

    // 计算每个币种的剩余百分比
    for (const [currency, data] of Object.entries(amount)) {
      const margin = parseFloat(String(data.margin || 0));
      const settle = parseFloat(String(data.settle || 0));
      
      if (margin === 0) continue;
      
      // 剩余金额 = 保证金 - 待结算金额
      const remaining = margin - settle;
      // 剩余百分比 = 剩余金额 / 保证金 * 100
      const percentage = (remaining / margin) * 100;

      if (percentage < 10) {
        // 低于10%：红色
        warnings.push({ 
          currency, 
          text: `${currency}: ${remaining.toFixed(2)} (${percentage.toFixed(1)}%)`, 
          percentage,
          color: 'text-red-800',
          bgColor: 'bg-red-100'
        });
      } else if (percentage < 20) {
        // 低于20%：黄色
        warnings.push({ 
          currency, 
          text: `${currency}: ${remaining.toFixed(2)} (${percentage.toFixed(1)}%)`, 
          percentage,
          color: 'text-yellow-800',
          bgColor: 'bg-yellow-100'
        });
      }
    }

    // 按百分比排序（从低到高）
    warnings.sort((a, b) => a.percentage - b.percentage);

    // 如果全部高于20%，只显示"正常"
    if (warnings.length === 0) {
      return { items: [{ text: '正常', color: 'text-gray-600', bgColor: 'bg-gray-100' }] };
    }

    // 最多显示3个具体币种的预警
    const displayWarnings = warnings.slice(0, 3);

    return { items: displayWarnings };
  };

  return (
    <div className="space-y-6">
      {/* 团队管理卡片 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* 卡片头部 */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-start md:items-center">
          <div className="flex items-center">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mr-2" />
            <h1 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900">{t('otc.team.title')}</h1>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              className="h-10 bg-white border-black text-black"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <UserPlus className="hidden md:inline h-4 w-4 mr-1" />
              {t('otc.team.addMember')}
            </Button>
            
            <Sheet open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <SheetContent side="right" className="w-full sm:max-w-3xl max-w-full flex flex-col overflow-hidden p-0 bg-white [&>button]:hidden">
                <SheetHeader className="flex-shrink-0 px-6 pt-4 pb-2 border-b">
                  <SheetTitle className="text-black">{t('otc.team.add.title')}</SheetTitle>
                  <SheetDescription className="text-gray-600">
                    {t('otc.team.add.description', '填写以下信息创建团队成员')}
                  </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-6">
                  <AddTeamMemberForm 
                    onClose={() => setIsAddDialogOpen(false)} 
                    onSuccess={() => refetch()}
                  />
                </div>
              </SheetContent>
            </Sheet>
          
          <Dialog open={isBatchAddDialogOpen} onOpenChange={setIsBatchAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                className="h-10 bg-white border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <Users className="hidden md:inline h-4 w-4 mr-1" />
                {t('otc.team.batchAddMember')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl bg-white animate-in fade-in-50 zoom-in-95 duration-300">
              <DialogHeader>
                <DialogTitle className="text-black">{t('otc.team.batchAdd.title')}</DialogTitle>
                <DialogDescription className="text-gray-600">
                  {t('otc.team.batchAdd.description')}
                </DialogDescription>
              </DialogHeader>
              <BatchAddTeamMemberForm 
                onClose={() => setIsBatchAddDialogOpen(false)} 
                onSuccess={() => refetch()}
              />
            </DialogContent>
          </Dialog>
          </div>
        </div>
        
        {/* 卡片内容 */}
        <div className="p-4">
          {/* 搜索框 */}
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('otc.team.searchWalletId')}
                  value={walletIdSearch}
                  onChange={(e) => setWalletIdSearch(e.target.value)}
                  className="pl-10 bg-white border-gray-300 text-gray-900"
                />
              </div>
            </div>
          </div>
          
          {/* 团队名单 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('otc.team.title')}</h3>
              <>
                {/* 移动端卡片视图 */}
                <div className="md:hidden space-y-4">
                  <div className="space-y-4">
                    {paginatedMembers.map(member => (
                      <Card key={member.id} className="p-4 bg-white border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center">
                            <UserCog className="h-4 w-4 mr-1.5 text-blue-500 flex-shrink-0" />
                            <span className="font-medium text-gray-900">{member.username}</span>
                          </div>
                          <div>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium border ${
                                getStatusColorClass(member.status)
                              }`}
                            >
                              {getStatusText(member.status, t)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div>
                            <div className="text-xs text-gray-500">{t('otc.team.telegram')}</div>
                            <div className="text-gray-900 text-sm">{member.tg_account}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">{t('otc.team.account')}</div>
                            <div className="text-gray-900 text-sm">{member.user_id}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">{t('otc.team.collection')}</div>
                            <div>
                               <span
                                className={`px-2 py-1 rounded text-xs font-medium border ${
                                  getAutoStatusColorClass(member.auto_c2c_sell_status)
                                }`}
                              >
                                {getAutoStatusText(member.auto_c2c_sell_status, t)}
                              </span>
                            </div>
                          </div>
                           <div>
                            <div className="text-xs text-gray-500">{t('otc.team.payment')}</div>
                              <div>
                               <span
                                className={`px-2 py-1 rounded text-xs font-medium border ${
                                  getAutoStatusColorClass(member.auto_c2c_buy_status)
                                }`}
                              >
                                {getAutoStatusText(member.auto_c2c_buy_status, t)}
                              </span>
                            </div>
                          </div>
                          {/* <div>
                            <div className="text-xs text-gray-500">{t('otc.team.otherFee')}</div>
                            <div className="text-gray-900 text-sm">{member.extraction_commission}</div>
                          </div> */}
                          {(() => {
                            const warning = calculateAmountWarning(member.amount);
                            return (
                              <>
                                <div className="text-gray-500">额度预警:</div>
                                <div 
                                  className="flex flex-col gap-1 cursor-pointer"
                                  onClick={() => {
                                    setAmountDetailMember(member);
                                    setIsAmountDetailOpen(true);
                                  }}
                                >
                                  {warning.items.map((item, index) => (
                                    <span key={index} className={cn("px-2 py-1 rounded-full text-xs whitespace-nowrap", item.bgColor, item.color)}>
                                      {item.text}
                                    </span>
                                  ))}
                                </div>
                              </>
                            );
                          })()}
                          <div>
                            <div className="text-xs text-gray-500">{t('otc.team.lastActive')}</div>
                            <div className="text-gray-900 text-sm">{formatTimestamp(member.last_login_time)}</div>
                          </div>
                        </div>
                        
                        {/* 新增财务字段区域 */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div>
                            <div className="text-xs text-gray-500">{t('otc.team.todayReceived')}</div>
                            <div className="text-gray-900 text-sm">{member.today_received || '0.00'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">{t('otc.team.todayPaid')}</div>
                            <div className="text-gray-900 text-sm">{member.today_paid || '0.00'}</div>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex justify-end">
                          <ActionButtons member={member} onSuccess={() => refetch()} />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
                
                {/* 桌面端表格视图 */}
                <div className="hidden md:block bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                           <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('otc.team.name')}
                          </th>
                          {LOGIN_CONFIG.DISPLAY_MODE === 2 ? (
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {t('otc.team.walletId')}
                          </th>
                          ) : (
                            <>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('otc.team.telegram')}
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('otc.team.account')}
                              </th>
                            </>
                          )}
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('otc.team.status')}
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('otc.team.collection')}
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('otc.team.payment')}
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('otc.team.todayReceived')}
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('otc.team.todayPaid')}
                          </th>
                          {/* <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('otc.team.otherFee')}
                          </th> */}
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            额度预警
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('otc.team.lastActive')}
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('otc.team.actions')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                          {isLoading || isFetching ? (
                          <tr>
                           <td colSpan={LOGIN_CONFIG.DISPLAY_MODE === 2 ? 9 : 10} className="text-center p-8">
                            <div className="flex flex-col items-center gap-4">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                              {/* <div className="text-gray-500">{t('common.loading')}</div> */}
                            </div>
                          </td>
                          </tr>
                        ) : paginatedMembers.length === 0 ? (
                          <tr>
                            <td colSpan={LOGIN_CONFIG.DISPLAY_MODE === 2 ? 9 : 10} className="px-4 py-12 text-center">
                              <div className="p-6 text-center">
                                {/* <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                  <UserPlus className="h-6 w-6 text-gray-400" />
                                </div> */}
                                <p className="text-gray-500">{t('otc.team.emptyTeam')}</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          paginatedMembers.map((member: TeamMemberItem) => { 
                            const memberStatus = typeof member.status === 'number' ? member.status : parseInt(member.status, 10);
                            const autoC2cSellStatus = typeof member.auto_c2c_sell_status === 'number' ? member.auto_c2c_sell_status : parseInt(member.auto_c2c_sell_status, 10);
                            const autoC2cBuyStatus = typeof member.auto_c2c_buy_status === 'number' ? member.auto_c2c_buy_status : parseInt(member.auto_c2c_buy_status, 10);
                            return (
                              <tr key={member.id}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{member.id}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{member.nickname}</td>
                                {LOGIN_CONFIG.DISPLAY_MODE === 2 ? (
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{member.wallet_id || '-'}</td>
                                ) : (
                                  <>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{member.tg_account}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{member.username}</td>
                                  </>
                                )}
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium border ${
                                      getStatusColorClass(memberStatus)
                                    }`}
                                  >
                                    {getStatusText(memberStatus, t)}
                                  </span>
                                </td>
                                  <td className="px-4 py-2 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium border ${
                                      getAutoStatusColorClass(autoC2cSellStatus)
                                    }`}
                                  >
                                    {getAutoStatusText(autoC2cSellStatus, t)}
                                  </span>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium border ${
                                      getAutoStatusColorClass(autoC2cBuyStatus)
                                    }`}
                                  >
                                    {getAutoStatusText(autoC2cBuyStatus, t)}
                                  </span>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{member.today_received || '0.00'}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{member.today_paid || '0.00'}</td>
                                {(() => {
                                  const warning = calculateAmountWarning(member.amount);
                                  return (
                                    <td className="px-4 py-2 text-sm">
                                      <div 
                                        className="flex flex-col gap-1 cursor-pointer"
                                        onClick={() => {
                                          setAmountDetailMember(member);
                                          setIsAmountDetailOpen(true);
                                        }}
                                      >
                                        {warning.items.map((item, index) => (
                                          <span key={index} className={cn("px-2 py-1 rounded-full text-xs whitespace-nowrap", item.bgColor, item.color)}>
                                            {item.text}
                                          </span>
                                        ))}
                                      </div>
                                    </td>
                                  );
                                })()}
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{formatTimestamp(member.last_login_time)}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                  <ActionButtons member={member} onSuccess={() => refetch()} />
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                     {/* 加载更多按钮 */}
                          {hasNextPage && (
                          // Show loading spinner when fetching next page
                          isFetchingNextPage ? (
                            <div className="flex justify-center items-center h-10 mt-4 pb-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                            </div>
                          ) : (
                          <div className="flex justify-center mt-4 pb-4">
                            <Button
                              onClick={() => fetchNextPage()} // Corrected onClick handler
                              disabled={isFetchingNextPage}
                              variant="outline"
                              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50" // Added classes based on original button
                            >
                              {t('otc.team.loadMore')}
                            </Button>
                          </div>
                        )
                      )}
                  </div>
                </div>
              </>
          </div>
        </div>
      </div>

      {/* 额度详情 - 桌面端右侧弹窗 / 移动端居中弹窗 */}
      {isAmountDetailOpen && amountDetailMember && (
        <>
          {/* 桌面端：右侧滑入面板 */}
          {isAmountDetailOpen && (
            <div 
              className="hidden md:block fixed inset-0 z-[100]"
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {/* 背景遮罩 - 不响应任何点击事件 */}
              <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity pointer-events-none" />
              {/* 右侧弹窗 */}
              <div className="fixed inset-y-0 right-0 z-[101] pointer-events-none">
                <div 
                  className="bg-white w-full max-w-3xl h-full shadow-xl overflow-y-auto pointer-events-auto"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {amountDetailMember.nickname}-额度详情
                      </h2>
                      <button
                        onClick={() => setIsAmountDetailOpen(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {amountDetailMember.amount && Object.keys(amountDetailMember.amount).length > 0 ? (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="py-3 px-4 text-sm font-medium text-gray-700">币种</th>
                                <th className="py-3 px-4 text-sm font-medium text-gray-700">保证金</th>
                                <th className="py-3 px-4 text-sm font-medium text-gray-700">待结算金额</th>
                                <th className="py-3 px-4 text-sm font-medium text-gray-700">总额度</th>
                                <th className="py-3 px-4 text-sm font-medium text-gray-700">已使用额度</th>
                                <th className="py-3 px-4 text-sm font-medium text-gray-700">剩余额度</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(amountDetailMember.amount).map(([currency, data]) => {
                                const margin = parseFloat(String(data.margin || 0));
                                const settle = parseFloat(String(data.settle || 0));
                                
                                // 剩余金额 = 保证金 - 待结算金额
                                const remaining = margin - settle;
                                // 剩余百分比 = 剩余金额 / 保证金 * 100
                                const percentage = margin > 0 ? (remaining / margin) * 100 : 0;
                                
                                // 确定颜色
                                let textColor = 'text-gray-900';
                                if (percentage < 10) {
                                  textColor = 'text-red-600';
                                } else if (percentage < 20) {
                                  textColor = 'text-yellow-600';
                                }

                                // 格式化数字
                                const formatNumber = (num: number) => {
                                  return num.toLocaleString('en-US', { 
                                    minimumFractionDigits: 2, 
                                    maximumFractionDigits: 2 
                                  });
                                };

                                return (
                                  <tr key={currency} className="border-b border-gray-100">
                                    <td className="py-3 px-4 text-sm text-gray-900">{currency}</td>
                                    <td className="py-3 px-4 text-sm text-gray-900">{formatNumber(margin)}</td>
                                    <td className="py-3 px-4 text-sm text-gray-900">{formatNumber(settle)}</td>
                                    <td className="py-3 px-4 text-sm text-gray-900">{formatNumber(margin)}</td>
                                    <td className="py-3 px-4 text-sm text-gray-900">{formatNumber(settle)}</td>
                                    <td className={`py-3 px-4 text-sm ${textColor}`}>
                                      {formatNumber(remaining)} ({percentage.toFixed(1)}%)
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        
                        <div className="mt-6 space-y-2 text-sm text-gray-600">
                          <p>保证金: 供应商缴纳的保证金金额</p>
                          <p>待结算金额: 尚未结算的交易金额</p>
                          <p>
                            <span className="text-red-600">红色</span>: 剩余额度&lt;10%, 
                            <span className="text-yellow-600 ml-2">黄色</span>: 剩余额度&lt;20%
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        暂无额度信息
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 移动端：居中弹窗 */}
          <Dialog 
            open={isAmountDetailOpen} 
            onOpenChange={(open) => {
              // PC端不允许通过点击外部关闭，只能通过关闭按钮
              if (window.innerWidth >= 768) {
                return;
              }
              setIsAmountDetailOpen(open);
            }}
          >
            <DialogContent className="md:hidden max-w-[95vw] max-h-[85vh] bg-white flex flex-col overflow-hidden">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  {amountDetailMember.nickname}-额度详情
                </DialogTitle>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {amountDetailMember.amount && Object.keys(amountDetailMember.amount).length > 0 ? (
                  <>
                    {Object.entries(amountDetailMember.amount).map(([currency, data]) => {
                      const margin = parseFloat(String(data.margin || 0));
                      const settle = parseFloat(String(data.settle || 0));
                      
                      // 剩余金额 = 保证金 - 待结算金额
                      const remaining = margin - settle;
                      // 剩余百分比 = 剩余金额 / 保证金 * 100
                      const percentage = margin > 0 ? (remaining / margin) * 100 : 0;
                      
                      // 确定颜色
                      let textColor = 'text-gray-900';
                      let bgColor = 'bg-gray-50';
                      if (percentage < 10) {
                        textColor = 'text-red-600';
                        bgColor = 'bg-red-50';
                      } else if (percentage < 20) {
                        textColor = 'text-yellow-600';
                        bgColor = 'bg-yellow-50';
                      }

                      // 格式化数字
                      const formatNumber = (num: number) => {
                        return num.toLocaleString('en-US', { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        });
                      };

                      return (
                        <div key={currency} className={`${bgColor} rounded-lg p-4 border border-gray-200`}>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-base font-semibold text-gray-900">{currency}</h3>
                            <span className={`text-sm font-medium ${textColor}`}>
                              剩余额度: {formatNumber(remaining)} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">保证金</p>
                              <p className="text-sm font-medium text-gray-900">{formatNumber(margin)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">待结算金额</p>
                              <p className="text-sm font-medium text-gray-900">{formatNumber(settle)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">总额度</p>
                              <p className="text-sm font-medium text-gray-900">{formatNumber(margin)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">已使用额度</p>
                              <p className="text-sm font-medium text-gray-900">{formatNumber(settle)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    <div className="mt-4 space-y-2 text-xs text-gray-600 pt-4 border-t border-gray-200">
                      <p>保证金: 供应商缴纳的保证金金额</p>
                      <p>待结算金额: 尚未结算的交易金额</p>
                      <p>
                        <span className="text-red-600">红色</span>: 剩余额度&lt;10%, 
                        <span className="text-yellow-600 ml-1">黄色</span>: 剩余额度&lt;20%
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    暂无额度信息
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}