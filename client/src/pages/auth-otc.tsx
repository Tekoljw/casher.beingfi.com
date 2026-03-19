import { useState } from "react";
import { Redirect, useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, RefreshCcw, FileText } from "lucide-react";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { LOGIN_CONFIG } from "@/config/login";
import Squares from "@/components/Squares/Squares";

// OTC登录表单验证模式 - 根据配置动态验证
const createOtcLoginSchema = (displayMode: number) => {
  if (displayMode === 2) {
    // 钱包ID + 验证码 + PIN码登录模式
    return z.object({
      walletId: z.string().min(1, "钱包ID不能为空"),
      verificationCode: z.string().min(6, "验证码至少需要6位"),
      pin: z.string().min(1, "PIN码不能为空"),
    });
  } else {
    // 默认账号 + 密码登录模式
    return z.object({
      username: z.string().min(2, "用户名至少需要2个字符"),
      password: z.string().min(1, "请输入密码")
    });
  }
};

type OtcLoginFormValues = {
  username?: string;
  password?: string;
  ga_verify?: string;
  walletId?: string;
  verificationCode?: string;
  pin?: string;
};

// OTC专用登录页面
export default function AuthOtc() {
  const { user, otcLoginMutation, otcWalletLoginMutation } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("agent");

  // 获取显示模式
  const displayMode = LOGIN_CONFIG.DISPLAY_MODE;

  // 根据配置创建动态schema
  const otcLoginSchema = createOtcLoginSchema(displayMode);

  // OTC登录表单
  const otcLoginForm = useForm<OtcLoginFormValues>({
    resolver: zodResolver(otcLoginSchema),
    defaultValues: displayMode === 2 
      ? { walletId: "", verificationCode: "", pin: "" }
      : { username: "", password: "" },
  });

  // 如果用户已登录OTC，重定向到OTC仪表盘
  const isOtcUser = localStorage.getItem('isOtcUser') === 'true';
  if (user && isOtcUser) {
    return <Redirect to="/otc-dashboard" />;
  }

  // OTC登录处理函数
  const onOtcLoginSubmit = async (values: OtcLoginFormValues) => {
    console.log('登录提交:', { displayMode, values, activeTab });
    
    if (displayMode === 2) {
      // 钱包ID + 验证码 + PIN码登录模式
      const loginData = {
        walletId: values.walletId || "",
        verificationCode: values.verificationCode || "",
        pin: values.pin || "",
        role: activeTab,
        username: "", // 添加必需字段
        password: ""  // 添加必需字段
      };
      console.log('钱包登录数据:', loginData);
      otcWalletLoginMutation.mutate(loginData);
    } else {
      // 账号 + 密码登录模式
      const loginData = {
        username: values.username || "",
        password: values.password || ""
      };
      console.log('账号登录数据:', loginData);
      otcLoginMutation.mutate(loginData);
    }
  };
  
  return (
    <div className="min-h-screen bg-[#0b121c] flex flex-col relative overflow-hidden">
      {/* Squares方块动画背景 */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Squares 
          speed={0.5}
          squareSize={40}
          direction="diagonal"
          borderColor="#012d28"
          hoverFillColor="#222"
        />
      </div>
      
      <Header />
      
      <div className="flex-1 flex items-center justify-center relative z-10">
        {/* 表单内容 */}
        <div className="w-full max-w-md p-4 md:p-8 pt-24">
          <Card className="bg-[#111827] border-[#1e293b] shadow-lg">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold text-white">
                {t('otc.login.title')}
              </CardTitle>
              <CardDescription className="text-gray-400 text-sm">
                {t('otc.login.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-center w-full mb-6">
                  <TabsList className="grid grid-cols-4 bg-[#1c293a] rounded-md">
                    <TabsTrigger value="agent" className="text-sm data-[state=active]:bg-[#0e4a89] data-[state=active]:text-white">{t('otc.login.agent')}</TabsTrigger>
                    <TabsTrigger value="staff" className="text-sm data-[state=active]:bg-[#0e4a89] data-[state=active]:text-white">{t('otc.login.staff')}</TabsTrigger>
                    <TabsTrigger value="admin" className="text-sm data-[state=active]:bg-[#0e4a89] data-[state=active]:text-white">{t('otc.login.admin')}</TabsTrigger>
                    <TabsTrigger value="system" className="text-sm data-[state=active]:bg-[#0e4a89] data-[state=active]:text-white">{t('otc.login.system')}</TabsTrigger>
                  </TabsList>
                </div>

                {/* 登录表单 (根据配置显示不同表单) */}
                <TabsContent value={activeTab}>
                  <Form {...otcLoginForm}>
                    <form onSubmit={otcLoginForm.handleSubmit(onOtcLoginSubmit)} className="space-y-4">
                      {displayMode === 2 ? (
                        // 钱包ID + 验证码登录模式
                        <>
                          <FormField
                            control={otcLoginForm.control}
                            name="walletId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-200">钱包ID</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="请输入钱包ID" 
                                    {...field} 
                                    className="bg-[#1c293a] border-[#2a3749] text-white focus:border-[#3b82f6]" 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={otcLoginForm.control}
                            name="pin"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-200">PIN码</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="password"
                                    placeholder="请输入PIN码" 
                                    {...field} 
                                    className="bg-[#1c293a] border-[#2a3749] text-white focus:border-[#3b82f6]" 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={otcLoginForm.control}
                            name="verificationCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-200">验证码</FormLabel>
                                <div className="flex gap-2">
                                  <FormControl>
                                    <Input 
                                      placeholder="请输入验证码" 
                                      {...field} 
                                      className="bg-[#1c293a] border-[#2a3749] text-white focus:border-[#3b82f6] flex-1" 
                                    />
                                  </FormControl>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      ) : (
                        // 账号 + 密码登录模式
                        <>
                          <FormField
                            control={otcLoginForm.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-200">{t('otc.login.username')}</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder={t('otc.login.username')} 
                                    {...field} 
                                    className="bg-[#1c293a] border-[#2a3749] text-white focus:border-[#3b82f6]" 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={otcLoginForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-200">{t('otc.login.password')}</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="password" 
                                    placeholder={t('otc.login.password')} 
                                    {...field} 
                                    className="bg-[#1c293a] border-[#2a3749] text-white focus:border-[#3b82f6]" 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                      
                      <Button 
                        type="submit" 
                        className="w-full gradient-btn" 
                        disabled={displayMode === 2 ? otcWalletLoginMutation.isPending : otcLoginMutation.isPending}
                      >
                        {(displayMode === 2 ? otcWalletLoginMutation.isPending : otcLoginMutation.isPending) ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('otc.login.loggingIn')}
                          </>
                        ) : (
                          t('otc.login.button')
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* 商户后台入口 - 独立按钮 */}
          <Button
            variant="outline"
            className="w-full mt-4 bg-[#1c293a] border-[#2a3749] text-gray-300 hover:bg-[#253548] hover:border-blue-500 transition-colors"
            onClick={() => setLocation('/merchant-login')}
          >
            <FileText className="h-4 w-4 mr-2" />
            访问商户后台
          </Button>
        </div>
      </div>
    </div>
  );
}
