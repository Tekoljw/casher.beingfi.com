import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { Wallet, User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "./LanguageSwitcher";
import logoImage from "../assets/logo.png";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { LOGIN_CONFIG } from "@/config/login";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // 添加错误处理以防useAuth在AuthProvider外部被调用
  let user = null;
  let logoutMutation = { mutate: () => console.log('Logout not available') };
  
  try {
    const auth = useAuth();
    user = auth.user;
    logoutMutation = auth.logoutMutation;
  } catch (e) {
    console.log('AuthProvider not available, using fallback mode');
  }
  const { t } = useLanguage();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLogout = () => {
    logoutMutation.mutate();
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
      console.log(token);
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
      // 修改密码成功后退出登录
      logoutMutation.mutate();
    } catch (e: any) {
      toast({ title: "修改失败", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // 检查是否为模式1且当前路径是登录页面（不包括后台页面）
  const isOtcLoginPage = location === '/auth';
  const isMode1 = LOGIN_CONFIG.DISPLAY_MODE === 1;
  const shouldHideNav = isMode1 && isOtcLoginPage;

  return (
    <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'backdrop-blur-md bg-dark/80 border-b border-gray-700/30' : ''}`}>
      <div className="container mx-auto px-4 sm:px-6 py-5 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold font-poppins flex items-center">
          <img src={logoImage} alt="BeingFi" className="h-8" />
        </Link>
        
        {/* Desktop Navigation - 模式1时在OTC路径隐藏 */}
        {!shouldHideNav && (
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors duration-300">{t('app.home')}</Link>
          
          {user ? (
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <span className="text-accent">{user.username}</span>
                    <span className="flex items-center text-white">
                      <Wallet className="w-4 h-4 mr-1" />
                      {user.balance} USDT
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>{t('app.dashboard')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/my-projects")}>
                    <span>{t('app.myProjects')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setChangePwdOpen(true)}>
                    <span>修改密码</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('app.logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <LanguageSwitcher />
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                className="border-accent text-accent hover:bg-accent/10"
                onClick={() => navigate("/auth")}
              >
                {t('app.login')}
              </Button>
              <LanguageSwitcher />
            </div>
          )}
        </nav>
        )}
        
        {/* 模式1时在OTC路径只显示语言切换 */}
        {shouldHideNav && (
          <div className="hidden md:flex items-center">
            <LanguageSwitcher />
          </div>
        )}
        
        {/* Mobile Menu Button - 模式1时在OTC路径隐藏 */}
        {!shouldHideNav && (
        <div className="md:hidden flex items-center gap-2">
          {user && (
            <Link href="/dashboard" className="inline-block">
              <Button variant="ghost" size="sm" className="flex items-center gap-1 mr-2">
                <Wallet className="w-4 h-4" />
                <span>{user.balance}</span>
              </Button>
            </Link>
          )}
          
          <button 
            className="text-white focus:outline-none" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
          </button>
        </div>
        )}
        
        {/* 模式1时在OTC路径只显示语言切换（移动端） */}
        {shouldHideNav && (
          <div className="md:hidden flex items-center ml-2">
            <LanguageSwitcher />
          </div>
        )}
      </div>
      
      {/* Mobile Navigation - 模式1时在OTC路径隐藏 */}
      {!shouldHideNav && (
      <>
        {/* 遮罩层 */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        {/* 侧边栏导航 */}
        <div className={`fixed top-0 left-0 h-full w-64 bg-dark border-r border-gray-700/30 z-50 md:hidden transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="px-4 py-5 flex flex-col space-y-4 h-full overflow-y-auto">
          <Link 
            href="/" 
            className="text-gray-400 hover:text-white transition-colors duration-300"
            onClick={() => setMobileMenuOpen(false)}
          >
            {t('app.home')}
          </Link>
          
          {user ? (
            <>
              <Link 
                href="/dashboard"
                className="text-accent hover:text-accent/80 transition-colors duration-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('app.dashboard')}
              </Link>
              <Link 
                href="/my-projects"
                className="text-gray-400 hover:text-white transition-colors duration-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('app.myProjects')}
              </Link>
              <button 
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="text-gray-400 hover:text-white transition-colors duration-300 text-left"
              >
                {t('app.logout')}
              </button>
            </>
          ) : (
            <Link 
              href="/auth"
              className="text-accent hover:text-accent/80 transition-colors duration-300"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('app.login')}
            </Link>
          )}
            <div className="mt-2">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </>
      )}
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
    </header>
  );
}
