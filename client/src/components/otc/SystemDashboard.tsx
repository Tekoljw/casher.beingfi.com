import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { 
  LucideIcon,
  Router,
  Code,
  Languages,
  Bot,
  FileText,
} from "lucide-react";
import OtcLayout from "./OtcLayout";
import { ChannelManagement } from "./ChannelManagement";
import { ApiInterfaceManagement } from "./ApiInterfaceManagement";
import { LanguageSettings } from "./LanguageSettings";
import { AIChannelDeveloper } from "./AIChannelDeveloper";
import { PromptManagement } from "./PromptManagement";

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

// 系统管理后台
export default function SystemDashboard({ user }: { user: User | null }) {
  const [activeItem, setActiveItem] = useState("channels");
  const { t } = useLanguage();

  // 侧边栏菜单项
  const sidebarItems: SidebarItem[] = [
    {
      icon: Router,
      label: t('otc.nav.channels', '通道管理'),
      href: "channels",
    },
    {
      icon: Bot,
      label: t('otc.nav.aiChannel', 'AI智能接入'),
      href: "aiChannel",
    },
    {
      icon: FileText,
      label: "AI任务提示词配置",
      href: "promptConfig",
    },
    {
      icon: Code,
      label: t('otc.nav.apiInterfaces', 'API接口管理'),
      href: "apiInterfaces",
    },
    {
      icon: Languages,
      label: t('otc.nav.language', '语言设置'),
      href: "languages",
    },
  ];

  return (
    <OtcLayout 
      sidebarItems={sidebarItems} 
      activeItem={activeItem} 
      setActiveItem={setActiveItem}
      user={user}
      dashboardTitle={t('otc.system.title', '系统管理后台')}
      role="system"
    >
      {/* 通道管理 */}
      {activeItem === "channels" && <ChannelManagement />}

      {/* AI智能接入 */}
      {activeItem === "aiChannel" && <AIChannelDeveloper />}

      {/* AI任务提示词配置 */}
      {activeItem === "promptConfig" && <PromptManagement />}

      {/* API接口管理 */}
      {activeItem === "apiInterfaces" && <ApiInterfaceManagement />}

      {/* 语言设置 */}
      {activeItem === "languages" && <LanguageSettings />}
    </OtcLayout>
  );
}

