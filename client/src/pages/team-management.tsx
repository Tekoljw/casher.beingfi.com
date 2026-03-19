import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import OtcLayout from "@/components/otc/OtcLayout";
import { 
  ChevronDown,
  Edit,
  Trash,
  RotateCcw,
  UserPlus,
  Users,
  FileText,
  Wallet,
  Settings,
  BarChart,
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

// 团队成员数据类型
type TeamMemberStatus = "online" | "unauthorized" | "disabled";

interface TeamMember {
  id: number;
  name: string;
  telegramId: string;
  status: TeamMemberStatus;
  accountId: string;
  collectionFee: string;
  payoutFee: string;
  otherFee: string;
  lastActiveTime: string;
}

// 团队成员状态颜色映射
const statusClasses: Record<TeamMemberStatus, string> = {
  online: "bg-green-100 text-green-800 border-green-200",
  unauthorized: "bg-yellow-100 text-yellow-800 border-yellow-200",
  disabled: "bg-gray-100 text-gray-500 border-gray-200",
};

// 模拟团队成员数据
const mockTeamMembers: TeamMember[] = [
  {
    id: 1,
    name: "孙业务1",
    telegramId: "tg_孙业务1609",
    status: "unauthorized",
    accountId: "acc_8205",
    collectionFee: "1%",
    payoutFee: "3%",
    otherFee: "1%",
    lastActiveTime: "2025/5/13",
  },
  {
    id: 2,
    name: "李顾问1",
    telegramId: "tg_李顾问1166",
    status: "online",
    accountId: "acc_9480",
    collectionFee: "4%",
    payoutFee: "3%",
    otherFee: "1%",
    lastActiveTime: "2025/5/5",
  },
  {
    id: 3,
    name: "吴助理1",
    telegramId: "tg_吴助理183",
    status: "disabled",
    accountId: "acc_8938",
    collectionFee: "1%",
    payoutFee: "1%",
    otherFee: "1%",
    lastActiveTime: "2025/5/1",
  },
  {
    id: 4,
    name: "杨助理1",
    telegramId: "tg_杨助理1622",
    status: "disabled",
    accountId: "acc_888",
    collectionFee: "1%",
    payoutFee: "3%",
    otherFee: "1%",
    lastActiveTime: "2025/4/20",
  },
  {
    id: 5,
    name: "何助理1",
    telegramId: "tg_何助理1277",
    status: "unauthorized",
    accountId: "acc_6240",
    collectionFee: "3%",
    payoutFee: "2%",
    otherFee: "2%",
    lastActiveTime: "2025/4/17",
  },
];

// 操作按钮组件
const ActionButtons = ({ member }: { member: TeamMember }) => {
  const { t } = useLanguage();
  return (
    <div className="flex space-x-2">
      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600">
        <Trash className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600">
        <RotateCcw className="h-4 w-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>{t('otc.team.viewDetails', '查看详情')}</DropdownMenuItem>
          <DropdownMenuItem>{t('otc.team.dropdown.resetPassword', '重置密码')}</DropdownMenuItem>
          <DropdownMenuItem className="text-red-600">
            {t('otc.team.dropdown.freezeAccount', '冻结账户')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// 添加团队成员表单
const AddTeamMemberForm = ({ onClose }: { onClose: () => void }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLanguage();

  const statusOptions: { value: TeamMemberStatus; label: string }[] = [
    { value: "online", label: t('otc.team.status.online', '在线中') },
    { value: "unauthorized", label: t('otc.team.status.unauthorized', '未授权') },
    { value: "disabled", label: t('otc.team.status.disabled', '已禁用') },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 模拟异步提交
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
      toast({
        title: t('common.success', '成功'),
        description: t('otc.team.toast.addSuccess', '已成功添加团队成员'),
      });
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            {t('otc.team.name', '姓名')}
          </Label>
          <Input
            id="name"
            className="col-span-3"
            placeholder={t('otc.team.namePlaceholder', '请输入姓名')}
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="telegram" className="text-right">
            {t('otc.team.telegram', 'TG账号')}
          </Label>
          <Input
            id="telegram"
            className="col-span-3"
            placeholder={t('otc.team.telegramPlaceholder', '请输入TG账号')}
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="account" className="text-right">
            {t('otc.team.accountId', '账号ID')}
          </Label>
          <Input
            id="account"
            className="col-span-3"
            placeholder={t('otc.team.accountIdPlaceholder', '请输入账号ID')}
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="status" className="text-right">
            {t('otc.team.status', '状态')}
          </Label>
          <Select>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder={t('otc.team.form.statusPlaceholder', '选择状态')} />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="collectionFee" className="text-right">
            {t('otc.team.collectionFee', '代收佣金')}
          </Label>
          <Input
            id="collectionFee"
            className="col-span-3"
            placeholder={t('otc.team.form.collectionFeePlaceholder', '例如: 1%')}
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="payoutFee" className="text-right">
            {t('otc.team.payoutFee', '代付佣金')}
          </Label>
          <Input
            id="payoutFee"
            className="col-span-3"
            placeholder={t('otc.team.form.payoutFeePlaceholder', '例如: 3%')}
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="otherFee" className="text-right">
            {t('otc.team.otherFee', '额外抽款')}
          </Label>
          <Input
            id="otherFee"
            className="col-span-3"
            placeholder={t('otc.team.form.otherFeePlaceholder', '例如: 1%')}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          {t('common.cancel', '取消')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('otc.team.adding', '添加中...') : t('otc.team.addMember', '添加成员')}
        </Button>
      </DialogFooter>
    </form>
  );
};

// 团队管理主页面
export default function TeamManagementPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  // 生成侧边栏信息
  const [activeItem, setActiveItem] = useState("team");

  const statusLabels: Record<TeamMemberStatus, string> = {
    online: t('otc.team.status.online', '在线中'),
    unauthorized: t('otc.team.status.unauthorized', '未授权'),
    disabled: t('otc.team.status.disabled', '已禁用'),
  };
  
  // 定义侧边栏项目
  const sidebarItems = [
    {
      icon: BarChart,
      label: t('otc.nav.dashboard', '仪表盘'),
      href: "/otc-dashboard",
      active: activeItem === "dashboard"
    },
    {
      icon: FileText,
      label: t('otc.nav.orders', '订单管理'),
      href: "/otc-dashboard/orders",
      active: activeItem === "orders"
    },
    {
      icon: Users,
      label: t('otc.nav.accounts', '账户管理'),
      href: "/otc-dashboard/accounts",
      active: activeItem === "accounts"
    },
    {
      icon: Wallet,
      label: t('otc.nav.settlements', '结算'),
      href: "/settlement",
      active: activeItem === "settlements"
    },
    {
      icon: Users,
      label: t('otc.team.title', '我的团队'),
      href: "/team-management",
      active: activeItem === "team"
    },
    {
      icon: Settings,
      label: t('otc.nav.settings', '系统设置'),
      active: activeItem === "settings"
    }
  ];

  // 初始化团队成员数据
  useEffect(() => {
    // 模拟加载数据
    const loadTeamData = async () => {
      try {
        setIsLoading(true);
        // 模拟API延迟
        await new Promise((resolve) => setTimeout(resolve, 800));
        setTeamMembers(mockTeamMembers);
      } catch (error) {
        toast({
          title: t('otc.team.toast.loadFailedTitle', '加载失败'),
          description: t('otc.team.toast.loadFailedDesc', '无法加载团队成员数据'),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTeamData();
  }, [toast]);

  return (
    <OtcLayout
      sidebarItems={sidebarItems}
      activeItem={activeItem}
      setActiveItem={setActiveItem}
      user={user}
      dashboardTitle={t('otc.team.title', '我的团队')}
      role={user?.username?.includes("agent") ? "agent" : 
            user?.username?.includes("staff") ? "staff" : "admin"}
    >
      <div className="bg-white min-h-screen">
        <div className="p-4 sm:p-6">
          {/* 页面标题区 */}
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h1 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900">
              {t('otc.team.title', '我的团队')}
            </h1>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t('otc.team.addMember', '添加成员')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{t('otc.team.add.title', '添加团队成员')}</DialogTitle>
                  <DialogDescription>
                    {t(
                      'otc.team.add.description',
                      '填写以下信息添加新的团队成员，添加后可在列表中查看'
                    )}
                  </DialogDescription>
                </DialogHeader>
                <AddTeamMemberForm onClose={() => setIsDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          {/* 主要内容卡片 */}
          <Card>
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="text-lg font-medium text-gray-900">
                {t('otc.team.listTitle', '团队名单')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-gray-600">{t('otc.team.name', '姓名')}</TableHead>
                        <TableHead className="text-gray-600">{t('otc.team.telegram', 'TG账号')}</TableHead>
                        <TableHead className="text-gray-600">{t('otc.team.status', '状态')}</TableHead>
                        <TableHead className="text-gray-600">{t('otc.team.account', '账号')}</TableHead>
                        <TableHead className="text-gray-600">{t('otc.team.collectionFee', '代收佣金')}</TableHead>
                        <TableHead className="text-gray-600">{t('otc.team.payoutFee', '代付佣金')}</TableHead>
                        <TableHead className="text-gray-600">{t('otc.team.otherFee', '额外抽款')}</TableHead>
                        <TableHead className="text-gray-600">{t('otc.team.lastActive', '最近上线时间')}</TableHead>
                        <TableHead className="text-gray-600">{t('common.actions', '操作')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamMembers.map((member) => (
                        <TableRow key={member.id} className="hover:bg-gray-50 border-t border-gray-200">
                          <TableCell className="font-medium">{member.name}</TableCell>
                          <TableCell>{member.telegramId}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium border ${
                                statusClasses[member.status]
                              }`}
                            >
                              {statusLabels[member.status]}
                            </span>
                          </TableCell>
                          <TableCell>{member.accountId}</TableCell>
                          <TableCell>{member.collectionFee}</TableCell>
                          <TableCell>{member.payoutFee}</TableCell>
                          <TableCell>{member.otherFee}</TableCell>
                          <TableCell>{member.lastActiveTime}</TableCell>
                          <TableCell>
                            <ActionButtons member={member} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </OtcLayout>
  );
}