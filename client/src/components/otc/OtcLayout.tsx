import { useState, useEffect, ReactNode, Dispatch, SetStateAction, useMemo, useRef } from "react";
import { Redirect, Link } from "wouter";
import { LucideIcon, ChevronDown, LogOut, Menu, User, X, Globe, Settings, Bell, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { LOGIN_CONFIG } from "@/config/login";
import { useAgents } from "@/hooks/use-agents";
import { useTeamData } from "@/hooks/use-team-data";
import { useCurrencyList } from "@/hooks/use-currency-list";
import { AccountItem } from "@/hooks/use-account-data";
import { useSettlementData } from "@/hooks/use-settlement-data";
import { apiRequest } from "@/lib/queryClient";

interface SidebarItem {
  icon: LucideIcon;
  label: string;
  href?: string;
  submenu?: SidebarItem[];
  active?: boolean;
}

interface User {
  id: number;
  username: string;
  email: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

interface OtcLayoutProps {
  children: ReactNode;
  sidebarItems: SidebarItem[];
  activeItem: string;
  setActiveItem: Dispatch<SetStateAction<string>>;
  user: User | null;
  dashboardTitle: string;
  role: 'agent' | 'staff' | 'admin';
}

export default function OtcLayout({
  children,
  sidebarItems,
  activeItem,
  setActiveItem,
  user,
  dashboardTitle,
  role,
}: OtcLayoutProps) {
  const { logoutMutation } = useAuth();
  const { language, setLanguage, t, translations } = useLanguage();
  
  // 语言代码到名称的映射
  const languageCodeToName: Record<string, string> = {
    'zh': '中文',
    'en': 'English',
    'mm': '缅甸语',
    'fr': '法语',
    'es': '西班牙语',
    'de': '德语',
    'it': '意大利语',
    'pt': '葡萄牙语',
    'ru': '俄语',
    'ja': '日语',
    'ko': '韩语',
    'ar': '阿拉伯语',
    'hi': '印地语',
    'th': '泰语',
    'vi': '越南语',
    'id': '印尼语',
  };
  
  // 获取所有可用的语言列表
  const availableLanguages = Object.keys(translations || {}).map(langCode => ({
    code: langCode,
    name: languageCodeToName[langCode] || langCode.toUpperCase()
  }));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // 额度预警相关状态（根据角色使用不同的 localStorage key）
  const otcRoleForWarning = typeof window !== 'undefined' ? localStorage.getItem('otcRole') : null;
  const isAdminForWarning = role === 'admin' || otcRoleForWarning === '3';
  
  const warningStorageKey = useMemo(() => {
    return isAdminForWarning ? 'quotaWarningClosed' : 'teamQuotaWarningClosed';
  }, [role, otcRoleForWarning, isAdminForWarning]);
  
  const [isQuotaWarningClosed, setIsQuotaWarningClosed] = useState(() => {
    // 从 localStorage 读取关闭状态
    const currentOtcRole = typeof window !== 'undefined' ? localStorage.getItem('otcRole') : null;
    const currentIsAdmin = role === 'admin' || currentOtcRole === '3';
    const storageKey = currentIsAdmin ? 'quotaWarningClosed' : 'teamQuotaWarningClosed';
    const closed = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
    return closed === 'true';
  });
  
  // 当 role 或 otcRole 变化时，重新从 localStorage 读取关闭状态
  useEffect(() => {
    const storageKey = isAdminForWarning ? 'quotaWarningClosed' : 'teamQuotaWarningClosed';
    const closed = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
    setIsQuotaWarningClosed(closed === 'true');
  }, [role, otcRoleForWarning, isAdminForWarning]);
  
  // 使用 ref 跟踪上一次的预警状态
  const prevWarningStateRef = useRef<boolean | null>(null);
  const prevAccountWarningStateRef = useRef<{ lowSuccessRate: boolean; lowBalance: boolean } | null>(null);
  const prevSettlementWarningStateRef = useRef<boolean | null>(null);
  
  // 账户预警相关状态
  const [accountWarningClosed, setAccountWarningClosed] = useState<{ lowSuccessRate: boolean; lowBalance: boolean }>(() => {
    const closed = typeof window !== 'undefined' ? localStorage.getItem('accountWarningClosed') : null;
    if (closed) {
      try {
        return JSON.parse(closed);
      } catch {
        return { lowSuccessRate: false, lowBalance: false };
      }
    }
    return { lowSuccessRate: false, lowBalance: false };
  });
  
  // 结算预警相关状态
  const [isSettlementWarningClosed, setIsSettlementWarningClosed] = useState(() => {
    const closed = typeof window !== 'undefined' ? localStorage.getItem('settlementWarningClosed') : null;
    return closed === 'true';
  });
  
  // 账户预警数据
  const [allAccountsData, setAllAccountsData] = useState<AccountItem[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  
  // 获取币种列表（用于账户预警检查）
  const { data: currencyList = [] } = useCurrencyList();
  
  // 根据角色获取数据：管理员获取供应商数据，支付供应商获取团队成员数据
  // 支付供应商后台：role === 'agent' 或 otcRole === '1'
  const otcRole = typeof window !== 'undefined' ? localStorage.getItem('otcRole') : null;
  const isStaffRole = role === 'agent' || otcRole === '1';
  
  // 判断是否需要显示账户预警：支付供应商后台（otcRole === '1'）或业务员（otcRole === '2'）
  // 业务员也需要显示账户预警
  const shouldShowAccountWarning = isStaffRole || otcRole === '2';
  
  // 判断是否需要显示结算预警：支付供应商后台（otcRole === '1'）或团队管理后台（otcRole === '2'）
  const shouldShowSettlementWarning = isStaffRole || otcRole === '2';
  
  // 获取平台结算数据（用于结算预警检查）
  const { data: settlementData, isLoading: isSettlementLoading } = useSettlementData(
    { type: 3 }, // type: 3 表示结算记录
    { enabled: shouldShowSettlementWarning } // 只有当需要显示结算预警时才启用查询
  );
  
  const { data: agentsData, isLoading: isAgentsLoading } = useAgents(role === 'admin' || otcRole === '3' ? undefined : undefined);
  
  // 调试日志：确认 role 和 enabled 状态
  if (process.env.NODE_ENV === 'development') {
    console.log('[额度预警] 数据获取配置:', {
      role,
      otcRole,
      isStaffRole,
      shouldFetchTeamData: isStaffRole,
      enabled: isStaffRole
    });
  }
  
  const { 
    data: teamData, 
    isLoading: isTeamDataLoading,
    hasNextPage: hasTeamNextPage,
    fetchNextPage: fetchTeamNextPage,
    isFetchingNextPage: isFetchingTeamNextPage
  } = useTeamData(
    {}, // 不传筛选条件，获取所有团队成员
    100, // 每页100条
    { enabled: isStaffRole } // 当 role === 'staff' 或 otcRole === '2' 时启用查询
  );
  
  // 调试日志：确认数据获取状态
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && isStaffRole) {
      console.log('[额度预警] 团队成员数据获取状态:', {
        role,
        isTeamDataLoading,
        hasTeamData: !!teamData,
        teamDataPages: teamData?.pages?.length || 0,
        totalMembers: teamData?.pages?.flatMap((page) => page.data?.list || []).length || 0,
        hasNextPage: hasTeamNextPage,
        isFetchingNextPage: isFetchingTeamNextPage
      });
    }
  }, [isStaffRole, isTeamDataLoading, teamData, hasTeamNextPage, isFetchingTeamNextPage]);
  
  // 当团队成员数据加载完成后，自动加载所有页面以完整检查额度预警
  useEffect(() => {
    if (isStaffRole && !isTeamDataLoading && teamData && hasTeamNextPage && !isFetchingTeamNextPage) {
      // 自动加载所有后续页面，确保完整检查
      fetchTeamNextPage();
    }
  }, [isStaffRole, isTeamDataLoading, teamData, hasTeamNextPage, isFetchingTeamNextPage, fetchTeamNextPage]);
  
  // 从 localStorage 读取预加载的账户预警数据（数据在加载页中已获取）
  useEffect(() => {
    if (!shouldShowAccountWarning) {
      return;
    }
    
    // 尝试从 localStorage 读取预加载的账户预警数据
    const cachedData = localStorage.getItem('accountWarningData');
    const cachedTime = localStorage.getItem('accountWarningDataTime');
    
    if (cachedData && cachedTime) {
      // 如果缓存数据在5分钟内，直接使用
      const cacheAge = Date.now() - parseInt(cachedTime, 10);
      if (cacheAge < 5 * 60 * 1000) {
        try {
          const accountsList: AccountItem[] = JSON.parse(cachedData);
          setAllAccountsData(accountsList);
          setIsLoadingAccounts(false);
          return;
        } catch (error) {
          console.error('解析缓存的账户预警数据失败:', error);
        }
      } else {
        // 缓存过期，清除缓存
        localStorage.removeItem('accountWarningData');
        localStorage.removeItem('accountWarningDataTime');
      }
    }
    
    // 如果没有缓存数据，设置为空数组（数据应该在加载页中已获取）
    setIsLoadingAccounts(false);
  }, [shouldShowAccountWarning]);
  
  // 检查是否有额度预警（供应商或团队成员）
  const hasLowQuotaWarningRaw = useMemo(() => {
    // 管理员角色：检查供应商额度
    const isAdminRole = role === 'admin' || otcRole === '3';
    if (isAdminRole) {
      // 如果数据还在加载中，返回 null 表示未知状态
      if (isAgentsLoading || !agentsData) {
        return null;
      }
      
      // 合并所有页面的供应商数据
      const allAgents = agentsData.pages.flatMap((page) => page.data.list) || [];
      
      // 检查每个供应商的额度
      for (const agent of allAgents) {
        if (!agent.amount || Object.keys(agent.amount).length === 0) {
          continue;
        }
        
        // 检查每个币种的剩余额度
        for (const [currency, data] of Object.entries(agent.amount)) {
          const margin = parseFloat(String(data.margin || 0));
          const settle = parseFloat(String(data.settle || 0));
          
          if (margin === 0) continue;
          
          // 剩余金额 = 保证金 - 待结算金额
          const remaining = margin - settle;
          // 剩余百分比 = 剩余金额 / 保证金 * 100
          const percentage = (remaining / margin) * 100;
          
          // 如果剩余额度低于10%，返回true
          if (percentage < 10) {
            return true;
          }
        }
      }
      
      return false;
    }
    
    // 支付供应商角色：检查团队成员额度
    if (isStaffRole) {
      // 如果数据还在加载中或正在获取下一页，返回 null 表示未知状态
      if (isTeamDataLoading || isFetchingTeamNextPage || !teamData) {
        return null;
      }
      
      // 合并所有页面的团队成员数据
      const allMembers = teamData.pages.flatMap((page) => page.data?.list || []) || [];
      
      // 检查每个团队成员的额度
      for (const member of allMembers) {
        if (!member.amount || Object.keys(member.amount).length === 0) {
          continue;
        }
        
        // 检查每个币种的剩余额度
        for (const [currency, data] of Object.entries(member.amount)) {
          const margin = parseFloat(String(data.margin || 0));
          const settle = parseFloat(String(data.settle || 0));
          
          if (margin === 0) continue;
          
          // 剩余金额 = 保证金 - 待结算金额
          const remaining = margin - settle;
          // 剩余百分比 = 剩余金额 / 保证金 * 100
          const percentage = (remaining / margin) * 100;
          
          // 如果剩余额度低于10%，返回true
          if (percentage < 10) {
            console.log('[额度预警] 检测到团队成员额度不足:', {
              member: member.nickname || member.username,
              currency,
              margin,
              settle,
              remaining,
              percentage: percentage.toFixed(2) + '%'
            });
            return true;
          }
        }
      }
      
      return false;
    }
    
    return false;
  }, [role, otcRole, isStaffRole, agentsData, isAgentsLoading, teamData, isTeamDataLoading, isFetchingTeamNextPage]);
  
  // 检测从"无预警"变为"有预警"的状态变化，自动重置关闭状态
  useEffect(() => {
    // 只有当数据加载完成时才进行状态检查（管理员或支付供应商）
    const isAdminRole = role === 'admin' || otcRole === '3';
    const isDataLoading = isAdminRole ? isAgentsLoading : isTeamDataLoading;
    if ((isAdminRole || isStaffRole) && !isDataLoading && hasLowQuotaWarningRaw !== null) {
      const currentWarningState = hasLowQuotaWarningRaw === true;
      const prevWarningState = prevWarningStateRef.current;
      
      // 如果从"无预警"变为"有预警"，重置关闭状态，让提示重新显示
      if (prevWarningState === false && currentWarningState === true && isQuotaWarningClosed) {
        setIsQuotaWarningClosed(false);
        localStorage.removeItem(warningStorageKey);
        localStorage.removeItem(`${warningStorageKey}Time`);
      }
      
      // 更新上一次的状态
      if (currentWarningState !== prevWarningState) {
        prevWarningStateRef.current = currentWarningState;
      }
    }
  }, [hasLowQuotaWarningRaw, role, otcRole, isStaffRole, isQuotaWarningClosed, isAgentsLoading, isTeamDataLoading, warningStorageKey]);
  
  // 是否显示预警提示（考虑关闭状态）
  // 只有当数据加载完成且确实有预警时才显示，或者如果用户未关闭过才显示
  const hasLowQuotaWarning = hasLowQuotaWarningRaw === true && !isQuotaWarningClosed;
  
  // 检查账户预警（成功率低于10% 或 剩余收款额度低于10%）
  const accountWarningRaw = useMemo(() => {
    if (!shouldShowAccountWarning || isLoadingAccounts || allAccountsData.length === 0) {
      return { lowSuccessRate: false, lowBalance: false };
    }
    
    let hasLowSuccessRate = false;
    let hasLowBalance = false;
    
    // 只检查启用状态的账户（status === "1"）
    for (const account of allAccountsData) {
      if (account.status !== "1") continue; // 跳过未启用的账户
      
      // 检查成功率
      if (account.success_rate !== undefined && account.success_rate !== null) {
        const successRate = parseFloat(String(account.success_rate));
        if (!isNaN(successRate) && successRate < 10) {
          hasLowSuccessRate = true;
        }
      }
      
      // 检查剩余收款额度
      if (account.max_amount !== undefined && account.max_amount !== null && 
          account.amount !== undefined && account.amount !== null) {
        const maxAmount = parseFloat(String(account.max_amount));
        const amount = parseFloat(String(account.amount));
        
        if (!isNaN(maxAmount) && maxAmount > 0) {
          const remaining = maxAmount - amount;
          const percentage = (remaining / maxAmount) * 100;
          if (percentage < 10) {
            hasLowBalance = true;
          }
        }
      }
      
      // 如果两种预警都找到了，可以提前退出
      if (hasLowSuccessRate && hasLowBalance) {
        break;
      }
    }
    
    return { lowSuccessRate: hasLowSuccessRate, lowBalance: hasLowBalance };
  }, [shouldShowAccountWarning, isLoadingAccounts, allAccountsData]);

  // 是否显示账户预警提示（考虑关闭状态）
  const hasAccountWarning = {
    lowSuccessRate: accountWarningRaw.lowSuccessRate && !accountWarningClosed.lowSuccessRate,
    lowBalance: accountWarningRaw.lowBalance && !accountWarningClosed.lowBalance
  };
  
  // 检查结算预警（剩余可用保证金低于10%）
  // 计算方式：待结算金额 / 保证金 * 100
  // 如果百分比 >= 90%，说明剩余可用保证金 <= 10%，需要预警
  const settlementWarningRaw = useMemo(() => {
    if (!shouldShowSettlementWarning) {
      console.log('[结算预警] 不显示结算预警:', { shouldShowSettlementWarning });
      return false;
    }
    
    if (isSettlementLoading) {
      console.log('[结算预警] 数据加载中...');
      return false;
    }
    
    if (!settlementData) {
      console.log('[结算预警] 没有结算数据');
      return false;
    }
    
    // 获取报表数据
    const reportData = settlementData?.pages[0]?.data?.report || {};
    
    if (!reportData || Object.keys(reportData).length === 0) {
      console.log('[结算预警] 报表数据为空');
      return false;
    }
    
    console.log('[结算预警] 开始检查报表数据:', reportData);
    
    // 检查每个币种的待结算金额占比
    for (const [currency, data] of Object.entries(reportData)) {
      const marginAmount = parseFloat(String(data.margin_amount || 0));
      const amount = parseFloat(String(data.amount || 0)); // 待结算金额
      
      if (marginAmount === 0) {
        console.log(`[结算预警] 跳过币种 ${currency}，保证金为0`);
        continue; // 跳过保证金为0的币种
      }
      
      // 百分比 = 待结算金额 / 保证金 * 100
      const percentage = (amount / marginAmount) * 100;
      
      console.log(`[结算预警] 币种 ${currency}:`, {
        marginAmount,
        amount,
        percentage: percentage.toFixed(2) + '%',
        shouldWarn: percentage >= 90
      });
      
      // 如果待结算金额占比 >= 90%（即剩余可用保证金 <= 10%），返回true
      if (percentage >= 90) {
        const remaining = marginAmount - amount;
        console.log('[结算预警] 检测到保证金额可用额度不足:', {
          currency,
          marginAmount,
          amount,
          remaining,
          percentage: percentage.toFixed(2) + '%',
          remainingPercentage: ((remaining / marginAmount) * 100).toFixed(2) + '%'
        });
        return true;
      }
    }
    
    console.log('[结算预警] 未检测到需要预警的情况');
    return false;
  }, [shouldShowSettlementWarning, isSettlementLoading, settlementData]);
  
  // 是否显示结算预警提示（考虑关闭状态）
  const hasSettlementWarning = settlementWarningRaw && !isSettlementWarningClosed;
  
  // 调试日志：检查预警状态
  useEffect(() => {
    if (shouldShowSettlementWarning) {
      console.log('[结算预警] 状态检查:', {
        settlementWarningRaw,
        isSettlementWarningClosed,
        hasSettlementWarning,
        shouldShow: settlementWarningRaw && !isSettlementWarningClosed
      });
    }
  }, [settlementWarningRaw, isSettlementWarningClosed, hasSettlementWarning, shouldShowSettlementWarning]);
  
  // 检测账户预警状态变化，自动重置关闭状态
  useEffect(() => {
    if (!shouldShowAccountWarning) return;
    
    const prevState = prevAccountWarningStateRef.current;
    const currentState = accountWarningRaw;
    
    // 如果从"无预警"变为"有预警"，重置关闭状态
    if (prevState) {
      if (!prevState.lowSuccessRate && currentState.lowSuccessRate && accountWarningClosed.lowSuccessRate) {
        setAccountWarningClosed(prev => ({ ...prev, lowSuccessRate: false }));
        const closed = { ...accountWarningClosed, lowSuccessRate: false };
        localStorage.setItem('accountWarningClosed', JSON.stringify(closed));
      }
      if (!prevState.lowBalance && currentState.lowBalance && accountWarningClosed.lowBalance) {
        setAccountWarningClosed(prev => ({ ...prev, lowBalance: false }));
        const closed = { ...accountWarningClosed, lowBalance: false };
        localStorage.setItem('accountWarningClosed', JSON.stringify(closed));
      }
    }
    
    // 更新上一次的状态
    if (currentState.lowSuccessRate !== prevState?.lowSuccessRate || 
        currentState.lowBalance !== prevState?.lowBalance) {
      prevAccountWarningStateRef.current = currentState;
    }
  }, [accountWarningRaw, shouldShowAccountWarning, accountWarningClosed]);
  
  // 检测结算预警状态变化，自动重置关闭状态
  useEffect(() => {
    if (!shouldShowSettlementWarning) return;
    
    const prevState = prevSettlementWarningStateRef.current;
    const currentState = settlementWarningRaw;
    
    // 如果从"无预警"变为"有预警"，重置关闭状态
    if (prevState === false && currentState === true && isSettlementWarningClosed) {
      setIsSettlementWarningClosed(false);
      localStorage.removeItem('settlementWarningClosed');
      localStorage.removeItem('settlementWarningClosedTime');
    }
    
    // 更新上一次的状态
    if (currentState !== prevState) {
      prevSettlementWarningStateRef.current = currentState;
    }
  }, [settlementWarningRaw, shouldShowSettlementWarning, isSettlementWarningClosed]);
  
  // 处理关闭账户预警提示
  const handleCloseAccountWarning = (type: 'lowSuccessRate' | 'lowBalance') => {
    setAccountWarningClosed(prev => {
      const updated = { ...prev, [type]: true };
      localStorage.setItem('accountWarningClosed', JSON.stringify(updated));
      return updated;
    });
  };
  
  // 处理关闭额度预警提示
  const handleCloseQuotaWarning = () => {
    setIsQuotaWarningClosed(true);
    // 保存到 localStorage，使用时间戳标记关闭时间（根据角色使用不同的 key）
    localStorage.setItem(warningStorageKey, 'true');
    localStorage.setItem(`${warningStorageKey}Time`, Date.now().toString());
  };
  
  // 处理关闭结算预警提示
  const handleCloseSettlementWarning = () => {
    setIsSettlementWarningClosed(true);
    localStorage.setItem('settlementWarningClosed', 'true');
    localStorage.setItem('settlementWarningClosedTime', Date.now().toString());
  };
  
  // 当数据更新时，如果额度恢复正常，自动重置关闭状态
  // 只有当数据加载完成且确实没有预警时才重置
  useEffect(() => {
    const isAdminRole = role === 'admin' || otcRole === '3';
    const isDataLoading = isAdminRole ? isAgentsLoading : isTeamDataLoading;
    // 只有在数据加载完成且确认没有预警时，才重置关闭状态（管理员或支付供应商）
    if ((isAdminRole || isStaffRole) && !isDataLoading && hasLowQuotaWarningRaw === false && isQuotaWarningClosed) {
      // 如果额度恢复正常，自动重置关闭状态，以便下次出现预警时能显示
      setIsQuotaWarningClosed(false);
      localStorage.removeItem(warningStorageKey);
      localStorage.removeItem(`${warningStorageKey}Time`);
      // 同时更新 ref 状态
      prevWarningStateRef.current = false;
    }
  }, [hasLowQuotaWarningRaw, role, otcRole, isStaffRole, isQuotaWarningClosed, isAgentsLoading, isTeamDataLoading, warningStorageKey]);

  // 在移动设备上，点击菜单项后自动关闭导航
  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [activeItem]);

  // 当激活项发生变化时，展开当前激活的菜单
  useEffect(() => {
    const newExpandedItems: Record<string, boolean> = {};
    sidebarItems.forEach((item) => {
      if (item.href && activeItem === item.href.replace('#', '')) {
        newExpandedItems[item.label] = true;
      } else if (item.submenu) {
        const isSubmenuActive = item.submenu.some(
          (subItem) => subItem.href && activeItem === subItem.href.replace('#', '')
        );
        if (isSubmenuActive) {
          newExpandedItems[item.label] = true;
        }
      }
    });
    setExpandedItems(newExpandedItems);
  }, [activeItem, sidebarItems]);

  const toggleExpandItem = (label: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const handleItemClick = (href: string) => {
    if (href) {
      setActiveItem(href.replace('#', ''));
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const toggleLanguage = () => {
    // 在所有可用语言之间循环切换
    const currentIndex = availableLanguages.findIndex(lang => lang.code === language);
    const nextIndex = (currentIndex + 1) % availableLanguages.length;
    setLanguage(availableLanguages[nextIndex].code);
  };
  
  // 获取页面标题函数
  const getPageTitle = (activeItem: string): string => {
    switch (activeItem) {
      case "dashboard": return t('otc.nav.dashboard');
      case "orders": return t('otc.nav.orders');
      case "runningScoreOrders": return t('otc.nav.runningScoreOrders', '跑分订单');
      case "apiOrders": return t('otc.nav.apiOrders', 'API订单');
      case "accounts": return t('otc.nav.accounts');
      case "settlements": return t('otc.nav.settlements');
      case "team": return t('otc.nav.team');
      case "apiInterfaces": return role === 'agent' ? '我的接口' : t('otc.nav.apiInterfaces', 'API接口管理');
      case "teamSettlements": return t('otc.settlements.team', '团队结算');
      case "settings": return t('otc.nav.config');
      case "reports": return t('otc.nav.reports');
      case "api": return t('otc.nav.api');
      case "channels": return t('otc.nav.channels');
      case "agents": return t('otc.nav.agents');
      case "languages": return t('otc.nav.language');
      default: return dashboardTitle;
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast({ title: "请填写所有字段", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "两次新密码不一致", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('otcUserToken');
      if (!token) {
        toast({ title: "未登录", description: "请先登录", variant: "destructive" });
        return;
      }
      const res = await fetch("https://otc.beingfi.com/Api/Index/editUserPass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          oldPass: oldPassword, 
          newPass: newPassword, 
          token: token 
        })
      });
      const data = await res.json();
      if (data.code !== 0) throw new Error(data.msg || "修改失败");
      toast({ title: "修改成功", description: "密码已更新" });
      setChangePwdOpen(false);
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
      logoutMutation.mutate();
    } catch (e: any) {
      toast({ title: "修改失败", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const isMode1 = LOGIN_CONFIG.DISPLAY_MODE === 1;

  return (
    <div className="flex h-screen bg-[#0b121c] text-white overflow-hidden">
      {/* 侧边栏 - 桌面版 */}
      <div className="hidden md:flex md:w-64 lg:w-72 md:flex-shrink-0">
        <div className="flex flex-col w-full border-r border-[#1e293b] bg-[#111827]">
          {/* 品牌标志和标题 */}
          <div className="flex h-16 items-center px-4 border-b border-[#1e293b] bg-[#0e1525]">
            <div className="flex items-center">
              <div className="w-8 h-8 mr-2 rounded-md bg-gradient-to-br from-[#3b82f6] to-[#10b981] flex items-center justify-center">
                <span className="text-white font-bold text-xs">OTC</span>
              </div>
              <h1 className="text-xl font-bold text-white">{dashboardTitle}</h1>
            </div>
          </div>

          {/* 侧边栏导航 */}
          <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4 px-3">
            <nav className="mt-2 flex-1 space-y-1">
              {sidebarItems.map((item, index) => (
                <div key={index} className="mb-1">
                  {/* 主菜单项 */}
                  <div 
                    className={cn(
                      "flex w-full justify-between items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer",
                      item.active
                        ? "bg-[#1c293a] text-white"
                        : "text-gray-400 hover:bg-[#1c293a] hover:text-white"
                    )}
                    onClick={() => {
                      if (item.submenu) {
                        toggleExpandItem(item.label);
                      } else if (item.href) {
                        handleItemClick(item.href);
                      }
                    }}
                  >
                    <div className="flex items-center">
                      {item.icon && <item.icon className="mr-3 h-5 w-5" />}
                      <span>{item.label}</span>
                    </div>
                    {item.submenu && (
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          expandedItems[item.label] ? "transform rotate-180" : ""
                        )}
                      />
                    )}
                  </div>

                  {/* 子菜单 */}
                  {item.submenu && expandedItems[item.label] && (
                    <div className="mt-1 ml-7 space-y-1">
                      {item.submenu.map((subItem, subIndex) => (
                        <div
                          key={subIndex}
                          className={cn(
                            "flex items-center pl-3 pr-4 py-2 text-sm font-medium rounded-md cursor-pointer",
                            activeItem === subItem.href?.replace('#', '')
                              ? "bg-[#1c293a] text-white"
                              : "text-gray-400 hover:bg-[#1c293a] hover:text-white"
                          )}
                          onClick={() => subItem.href && handleItemClick(subItem.href)}
                        >
                          {subItem.icon && <subItem.icon className="mr-3 h-4 w-4" />}
                          <span>{subItem.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* 用户信息和登出 */}
          <div className="px-3 py-4 border-t border-[#1e293b] bg-[#111827]">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2 text-gray-400" />
              <span>{t('otc.layout.logout')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        {/* 桌面版顶部栏 */}
        <div className="hidden md:flex items-center h-16 px-6 bg-[#111827] border-b border-[#1e293b] justify-between">
          <h1 className="text-xl font-bold text-white">{getPageTitle(activeItem)}</h1>
          
          <div className="flex items-center space-x-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center px-3 py-1.5 rounded-full bg-[#1c293a] mr-1 cursor-pointer hover:bg-[#2d3748] transition-colors">
                  <User className="h-4 w-4 text-[#3b82f6] mr-2" />
                  <span className="text-sm font-medium text-white">{user?.username || `otc_${role}`}</span>
                  <span className="text-xs text-gray-400 ml-1.5">
                    {role === 'agent' && t('otc.login.agent')}
                    {role === 'staff' && t('otc.login.staff')}
                    {role === 'admin' && t('otc.login.admin')}
                  </span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#111827] border-[#1e293b] text-white">
                <DropdownMenuItem onClick={() => setChangePwdOpen(true)} className="hover:bg-[#1c293a] text-sm">
                  <span>修改密码</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#1e293b]" />
                <DropdownMenuItem onClick={handleLogout} className="hover:bg-[#1c293a] text-sm">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('otc.layout.logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* 设置按钮 */}
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Settings className="h-5 w-5 text-gray-400 hover:text-white" />
            </Button>
            
            {/* 通知按钮 */}
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Bell className="h-5 w-5 text-gray-400 hover:text-white" />
            </Button>
            
            {/* 语言切换 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Globe className="h-5 w-5 text-gray-400 hover:text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#111827] border-[#1e293b] text-white">
                {availableLanguages.map(lang => (
                  <DropdownMenuItem 
                    key={lang.code}
                    className={language === lang.code ? "bg-[#1c293a] text-white" : "text-gray-400"} 
                    onClick={() => setLanguage(lang.code)}
                  >
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* 预警提示区域 - 桌面版（独立块，有间隔） */}
        {(hasLowQuotaWarning || hasAccountWarning.lowSuccessRate || hasAccountWarning.lowBalance || hasSettlementWarning) && (
          <div className="hidden md:flex flex-col gap-2 px-6 pt-3 pb-3">
            {/* 额度预警提示 */}
            {hasLowQuotaWarning && (
              <div className="flex items-center justify-between bg-red-600 rounded px-4 py-3 text-white">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-sm">{t('otc.admin.quotaWarningTitle', '额度预警')}</div>
                    <div className="text-xs mt-0.5">
                      {isAdminForWarning 
                        ? t('otc.admin.quotaWarningMessage', '系统检测到有供应商额度不足，请及时处理')
                        : t('otc.staff.quotaWarningMessage', '系统检测到有团队成员额度不足，请及时处理')
                      }
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-white hover:bg-red-700 hover:text-white"
                  onClick={handleCloseQuotaWarning}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {/* 账户预警提示（叠在一起展示，独立块） */}
            {(hasAccountWarning.lowSuccessRate || hasAccountWarning.lowBalance) && (
              <div className="flex flex-col gap-2">
                {/* 成功率预警 */}
                {hasAccountWarning.lowSuccessRate && (
                  <div className="flex items-center justify-between bg-red-700/30 rounded px-4 py-3 text-white">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-sm">{t('otc.staff.accountLowSuccessRateTitle', '账户预警')}</div>
                        <div className="text-xs mt-0.5">
                          {t('otc.staff.accountLowSuccessRateMessage', '系统检测到有账户成功率低于10%，请及时处理')}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-white hover:bg-red-800/50 hover:text-white"
                      onClick={() => handleCloseAccountWarning('lowSuccessRate')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                {/* 剩余收款额度预警 */}
                {hasAccountWarning.lowBalance && (
                  <div className="flex items-center justify-between bg-red-700/30 rounded px-4 py-3 text-white">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-sm">{t('otc.staff.accountLowBalanceTitle', '账户预警')}</div>
                        <div className="text-xs mt-0.5">
                          {t('otc.staff.accountLowBalanceMessage', '系统检测到有账户剩余收款额度低于10%，请及时处理')}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-white hover:bg-red-800/50 hover:text-white"
                      onClick={() => handleCloseAccountWarning('lowBalance')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* 结算预警提示 */}
            {hasSettlementWarning && (
              <div className="flex items-center justify-between bg-orange-600 rounded px-4 py-3 text-white">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-sm">{t('otc.staff.settlementWarningTitle', '结算预警')}</div>
                    <div className="text-xs mt-0.5">
                      {t('otc.staff.settlementWarningMessage', '系统检测到有保证金额可用额度低于10%，请及时结算')}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-white hover:bg-orange-700 hover:text-white"
                  onClick={handleCloseSettlementWarning}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
        
        {/* 顶部移动导航 */}
        <div className="md:hidden flex items-center h-14 sm:h-16 px-3 sm:px-4 bg-[#111827] border-b border-[#1e293b]">
          {/* 菜单按钮 */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5 text-white" />
          </Button>
          <h1 className="ml-2 sm:ml-3 text-base sm:text-xl font-bold text-white truncate">{dashboardTitle}</h1>
          
          <div className="ml-auto flex items-center">
            {/* 语言切换按钮 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-9 w-9 mr-1"
                >
                  <Globe className="h-4 w-4 text-blue-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#111827] border-[#1e293b] text-white">
                {availableLanguages.map(lang => (
                  <DropdownMenuItem 
                    key={lang.code}
                    className={language === lang.code ? "bg-[#1c293a] text-white" : "text-gray-400"} 
                    onClick={() => setLanguage(lang.code)}
                  >
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* 用户菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-9 w-9"
                >
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-[#1c293a] flex items-center justify-center">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#3b82f6]" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 sm:w-56 bg-[#111827] border-[#1e293b] text-white">
                <DropdownMenuLabel className="text-sm">{t('otc.layout.title')}</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#1e293b]" />
                <DropdownMenuItem onClick={() => setChangePwdOpen(true)} className="hover:bg-[#1c293a] text-sm">
                  <span>修改密码</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="hover:bg-[#1c293a] text-sm"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('otc.layout.logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* 预警提示区域 - 移动版（独立块，有间隔） */}
        {(hasLowQuotaWarning || hasAccountWarning.lowSuccessRate || hasAccountWarning.lowBalance || hasSettlementWarning) && (
          <div className="md:hidden flex flex-col gap-2 px-3 sm:px-4 pt-2.5 pb-2.5">
            {/* 额度预警提示 */}
            {hasLowQuotaWarning && (
              <div className="flex items-center justify-between bg-red-600 rounded px-3 sm:px-4 py-2.5 text-white">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs sm:text-sm truncate">{t('otc.admin.quotaWarningTitle', '额度预警')}</div>
                    <div className="text-xs mt-0.5 line-clamp-2">
                      {isAdminForWarning 
                        ? t('otc.admin.quotaWarningMessage', '系统检测到有供应商额度不足，请及时处理')
                        : t('otc.staff.quotaWarningMessage', '系统检测到有团队成员额度不足，请及时处理')
                      }
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-white hover:bg-red-700 hover:text-white flex-shrink-0 ml-2"
                  onClick={handleCloseQuotaWarning}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {/* 账户预警提示（叠在一起展示，独立块） */}
            {(hasAccountWarning.lowSuccessRate || hasAccountWarning.lowBalance) && (
              <div className="flex flex-col gap-2">
                {/* 成功率预警 */}
                {hasAccountWarning.lowSuccessRate && (
                  <div className="flex items-center justify-between bg-red-700/30 rounded px-3 sm:px-4 py-2.5 text-white">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs sm:text-sm truncate">{t('otc.staff.accountLowSuccessRateTitle', '账户预警')}</div>
                        <div className="text-xs mt-0.5 line-clamp-2">
                          {t('otc.staff.accountLowSuccessRateMessage', '系统检测到有账户成功率低于10%，请及时处理')}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-white hover:bg-red-800/50 hover:text-white flex-shrink-0 ml-2"
                      onClick={() => handleCloseAccountWarning('lowSuccessRate')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                {/* 剩余收款额度预警 */}
                {hasAccountWarning.lowBalance && (
                  <div className="flex items-center justify-between bg-red-700/30 rounded px-3 sm:px-4 py-2.5 text-white">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs sm:text-sm truncate">{t('otc.staff.accountLowBalanceTitle', '账户预警')}</div>
                        <div className="text-xs mt-0.5 line-clamp-2">
                          {t('otc.staff.accountLowBalanceMessage', '系统检测到有账户剩余收款额度低于10%，请及时处理')}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-white hover:bg-red-800/50 hover:text-white flex-shrink-0 ml-2"
                      onClick={() => handleCloseAccountWarning('lowBalance')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* 结算预警提示 */}
            {hasSettlementWarning && (
              <div className="flex items-center justify-between bg-orange-600 rounded px-3 sm:px-4 py-2.5 text-white">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs sm:text-sm truncate">{t('otc.staff.settlementWarningTitle', '结算预警')}</div>
                    <div className="text-xs mt-0.5 line-clamp-2">
                      {t('otc.staff.settlementWarningMessage', '系统检测到有保证金额可用额度低于10%，请及时结算')}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-white hover:bg-orange-700 hover:text-white flex-shrink-0 ml-2"
                  onClick={handleCloseSettlementWarning}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 移动导航抽屉 */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 md:hidden">
            <div className="fixed inset-y-0 left-0 w-64 bg-[#111827] p-4 shadow-lg overflow-y-auto">
              <div className="flex justify-between items-center mb-4 sm:mb-5">
                <div className="flex items-center">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 mr-2 rounded-md bg-gradient-to-br from-[#3b82f6] to-[#10b981] flex items-center justify-center">
                    <span className="text-white font-bold text-xs">OTC</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold">{t('otc.layout.title')}</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>

              <nav className="mt-5 flex-1 space-y-1">
                {sidebarItems.map((item, index) => (
                  <div key={index} className="mb-1">
                    {/* 主菜单项 */}
                    <div 
                      className={cn(
                        "flex w-full justify-between items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer",
                        item.active
                          ? "bg-[#1c293a] text-white"
                          : "text-gray-400 hover:bg-[#1c293a] hover:text-white"
                      )}
                      onClick={() => {
                        if (item.submenu) {
                          toggleExpandItem(item.label);
                        } else if (item.href) {
                          handleItemClick(item.href);
                        }
                      }}
                    >
                      <div className="flex items-center">
                        {item.icon && <item.icon className="mr-3 h-5 w-5" />}
                        <span>{item.label}</span>
                      </div>
                      {item.submenu && (
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            expandedItems[item.label] ? "transform rotate-180" : ""
                          )}
                        />
                      )}
                    </div>

                    {/* 子菜单 */}
                    {item.submenu && expandedItems[item.label] && (
                      <div className="mt-1 ml-7 space-y-1">
                        {item.submenu.map((subItem, subIndex) => (
                          <div
                            key={subIndex}
                            className={cn(
                              "flex items-center pl-3 pr-4 py-2 text-sm font-medium rounded-md cursor-pointer",
                              activeItem === subItem.href?.replace('#', '')
                                ? "bg-[#1c293a] text-white"
                                : "text-gray-400 hover:bg-[#1c293a] hover:text-white"
                            )}
                            onClick={() => subItem.href && handleItemClick(subItem.href)}
                          >
                            {subItem.icon && <subItem.icon className="mr-3 h-4 w-4" />}
                            <span>{subItem.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>

              {/* 用户信息 */}
              <div className="mt-5 pt-4 border-t border-[#1e293b]">
                <div className="flex items-center px-3 py-2 rounded-lg bg-[#1c293a] mb-3">
                  <User className="h-5 w-5 text-[#3b82f6] mr-2" />
                  <div>
                    <p className="text-sm font-medium text-white">{user?.username || `otc_${role}`}</p>
                    <p className="text-xs font-medium text-gray-400">
                      {role === 'agent' && t('otc.login.agent')}
                      {role === 'staff' && t('otc.login.staff')}
                      {role === 'admin' && t('otc.login.admin')}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full flex items-center justify-center"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full flex items-center justify-center"
                    onClick={toggleLanguage}
                  >
                    <Globe className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full flex items-center justify-center"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 页面内容 */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-[#0b121c]">
          <div className="w-full rounded-lg overflow-hidden">
            {/* 主要内容 */}
            {children}
          </div>
        </main>
      </div>
      <Dialog open={changePwdOpen} onOpenChange={setChangePwdOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改密码</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input type="password" placeholder="原密码" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
            <Input type="password" placeholder="新密码" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            <Input type="password" placeholder="确认新密码" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>
          <DialogFooter>
            <Button className="w-full mt-2" 
              disabled={loading || !oldPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              onClick={handleChangePassword}
            >
              {loading ? "提交中..." : "提交"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 获取页面标题 - 移动到组件内部