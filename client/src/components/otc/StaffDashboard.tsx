import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { 
  CreditCard,
  User, 
  FileText,
  Settings, 
  LucideIcon, 
  CircleDollarSign, 
  ChevronRight,
  ShoppingCart,
  DollarSign
} from "lucide-react";
import OtcLayout from "./OtcLayout";
// 导入各功能组件
import OrderManagement from "./OrderManagement";
import AccountManagement from "./AccountManagement";
import { MySettings } from "./MySettings";
import { MyReports } from "./MyReports";
import { PlatformSettlement } from "./PlatformSettlement";

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

// 团队（Staff）的管理后台
export default function StaffDashboard({ user }: { user: User | null }) {
  const [activeItem, setActiveItem] = useState("orders");
  const { t, language } = useLanguage();

  // 团队侧边栏菜单项
  const sidebarItems: SidebarItem[] = [
    {
      icon: ShoppingCart,
      label: t('otc.nav.orders'),
      href: "#orders",
      active: activeItem === "orders",
    },
    {
      icon: DollarSign,
      label: t('otc.nav.accounts'),
      href: "#accounts",
      active: activeItem === "accounts",
    },
    {
      icon: CircleDollarSign,
      label: t('otc.nav.settlements'),
      href: "#settlements",
      active: activeItem === "settlements",
    },
    {
      icon: Settings,
      label: t('otc.nav.config'),
      href: "#settings",
      active: activeItem === "settings",
    },
    {
      icon: FileText,
      label: t('otc.nav.reports'),
      href: "#reports",
      active: activeItem === "reports",
    }
  ];

  return (
    <OtcLayout 
      sidebarItems={sidebarItems} 
      activeItem={activeItem} 
      setActiveItem={setActiveItem}
      user={user}
      dashboardTitle={t('otc.layout.staffDashboard')}
      role="staff"
    >
      {/* 订单管理 */}
      {activeItem === "orders" && <OrderManagement />}
      
      {/* 账户管理 */}
      {activeItem === "accounts" && <AccountManagement />}
      
      {/* 结算管理 */}
      {activeItem === "settlements" && <PlatformSettlement />}
      
      {/* 我的配置 */}
      {activeItem === "settings" && <MySettings />}
      
      {/* 我的报表 */}
      {activeItem === "reports" && <MyReports />}
    </OtcLayout>
  );
}