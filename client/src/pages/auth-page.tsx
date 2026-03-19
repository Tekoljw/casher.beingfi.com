import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Redirect, useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCcw, FileText } from "lucide-react";
import Header from "@/components/Header";

// 登录表单验证模式
const loginSchema = z.object({
  username: z.string().min(1, "用户名不能为空"),
  password: z.string().min(1, "密码不能为空"),
  verificationType: z.string().optional(),
  verificationCode: z.string().optional(),
});

// 带验证码的登录表单验证模式 (OTC登录简化，仅需用户名)
const otcLoginSchema = z.object({
  username: z.string().min(1, "用户名不能为空"),
  password: z.string().optional(), // 简化，密码不校验
  verificationCode: z.string().optional(), // 简化，验证码不校验
});

// 注册表单验证模式
const registerSchema = z.object({
  username: z.string().min(3, "用户名至少需要3个字符").max(20, "用户名最多20个字符"),
  email: z.string().email("请输入有效的电子邮件地址"),
  password: z.string().min(6, "密码至少需要6个字符"),
  confirmPassword: z.string().min(1, "请确认密码"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不匹配",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type OtcLoginFormValues = z.infer<typeof otcLoginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

interface AuthPageProps {
  type?: 'payment' | 'otc' | 'ai';
  title?: string;
}

export default function AuthPage({ type = 'payment', title = '登录支付后台' }: AuthPageProps) {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  
  // 设置默认激活标签 - 根据页面类型设置默认选项卡
  const getDefaultTab = () => {
    if (type === 'otc') return "agent";
    if (type === 'payment') return "merchant";
    return "login";
  };
  
  // 确保初始选项卡值有效
  const defaultTab = getDefaultTab();
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  
  // 页面加载时确保默认标签页内容可见
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);
  const [verificationCode, setVerificationCode] = useState<string>("");

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const otcLoginForm = useForm<OtcLoginFormValues>({
    resolver: zodResolver(otcLoginSchema),
    defaultValues: {
      username: "",
      password: "",
      verificationCode: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = async (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  const onOtcLoginSubmit = async (values: OtcLoginFormValues) => {
    // 使用模拟登录函数 - 直接根据用户名和所选角色登录
    const roleMap: Record<string, string> = {
      "agent": "agent",
      "staff": "staff", 
      "admin": "admin"
    };
    
    // 从activeTab获取当前所选角色
    const role = roleMap[activeTab] || "agent";
    // mockOtcLogin(values.username, role);
  };

  const onRegisterSubmit = async (values: RegisterFormValues) => {
    const { confirmPassword, ...registerData } = values;
    registerMutation.mutate(registerData);
  };

  const refreshVerificationCode = () => {
    // 生成随机验证码
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode(newCode);
  };

  // 如果用户已登录，根据登录类型重定向到不同页面
  if (user) {
    // 根据登录类型决定重定向目标
    if (type === 'otc') {
      return <Redirect to="/otc-dashboard" />;
    } else if (type === 'payment') {
      return <Redirect to="/dashboard" />;
    } else if (type === 'ai') {
      return <Redirect to="/my-projects" />;
    } else {
      return <Redirect to="/" />;
    }
  }

  // 根据不同类型的登录页面显示不同的标题
  const getPageTitle = () => {
    if (type === 'payment') return title || '登录支付后台';
    if (type === 'otc') return '登录OTC跑分后台';
    return '登录AI接入计划';
  };

  return (
    <div className="min-h-screen bg-[#0b121c] flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        {/* 表单内容 */}
        <div className="w-full max-w-md p-4 md:p-8 pt-24">
          <Card className="bg-[#111827] border-[#1e293b] shadow-lg">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold text-white">
                {getPageTitle()}
              </CardTitle>
              <CardDescription className="text-gray-400 text-sm">
                {type === 'payment' && '登录支付后台管理系统，配置与管理支付通道'}
                {type === 'otc' && '登录OTC跑分后台，管理跑分业务与结算'}
                {type === 'ai' && '登录AI接入计划，使用AI快速集成支付API'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {type === 'payment' ? (
                // 支付后台登录表单
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="flex justify-center mb-6">
                    <TabsList className="mx-auto bg-[#1c293a] rounded-md">
                      <TabsTrigger value="merchant" className="text-sm data-[state=active]:bg-[#0e4a89] data-[state=active]:text-white">商户</TabsTrigger>
                      <TabsTrigger value="paymentAdmin" className="text-sm data-[state=active]:bg-[#0e4a89] data-[state=active]:text-white">管理员</TabsTrigger>
                    </TabsList>
                  </div>

                  {/* 商户登录表单 */}
                  <TabsContent value="merchant">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-200">商户账号</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="输入商户账号" 
                                  {...field} 
                                  className="bg-[#1c293a] border-[#2a3749] text-white focus:border-[#3b82f6]" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-200">密码</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="输入密码" 
                                  {...field} 
                                  className="bg-[#1c293a] border-[#2a3749] text-white focus:border-[#3b82f6]" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={loginForm.control}
                          name="verificationCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-200">BeingFi验证码</FormLabel>
                              <div className="flex gap-2">
                                <FormControl>
                                  <Input 
                                    placeholder="输入验证码" 
                                    {...field} 
                                    className="bg-[#1c293a] border-[#2a3749] text-white focus:border-[#3b82f6] flex-1" 
                                  />
                                </FormControl>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  onClick={refreshVerificationCode}
                                  className="border-[#2a3749] text-gray-300 hover:bg-[#1c293a]"
                                >
                                  <RefreshCcw className="h-4 w-4 mr-1" />
                                  获取
                                </Button>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full gradient-btn" 
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              登录中...
                            </>
                          ) : "登录"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                  
                  {/* 管理员登录表单 */}
                  <TabsContent value="paymentAdmin">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-200">管理员账号</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="输入管理员账号" 
                                  {...field} 
                                  className="bg-[#1c293a] border-[#2a3749] text-white focus:border-[#3b82f6]" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-200">密码</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="输入密码" 
                                  {...field} 
                                  className="bg-[#1c293a] border-[#2a3749] text-white focus:border-[#3b82f6]" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={loginForm.control}
                          name="verificationCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-200">BeingFi验证码</FormLabel>
                              <div className="flex gap-2">
                                <FormControl>
                                  <Input 
                                    placeholder="输入验证码" 
                                    {...field} 
                                    className="bg-[#1c293a] border-[#2a3749] text-white focus:border-[#3b82f6] flex-1" 
                                  />
                                </FormControl>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  onClick={refreshVerificationCode}
                                  className="border-[#2a3749] text-gray-300 hover:bg-[#1c293a]"
                                >
                                  <RefreshCcw className="h-4 w-4 mr-1" />
                                  获取
                                </Button>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full gradient-btn" 
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              登录中...
                            </>
                          ) : "登录"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
              ) : type === 'otc' ? (
                // OTC跑分后台登录表单
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="flex justify-center mb-6">
                    <TabsList className="mx-auto bg-[#1c293a] rounded-md">
                      <TabsTrigger value="agent" className="text-sm data-[state=active]:bg-[#0e4a89] data-[state=active]:text-white">供应商</TabsTrigger>
                      <TabsTrigger value="staff" className="text-sm data-[state=active]:bg-[#0e4a89] data-[state=active]:text-white">团队</TabsTrigger>
                      <TabsTrigger value="admin" className="text-sm data-[state=active]:bg-[#0e4a89] data-[state=active]:text-white">管理员</TabsTrigger>
                    </TabsList>
                  </div>

                  {/* 供应商登录表单 */}
                  <TabsContent value="agent">
                    <Form {...otcLoginForm}>
                      <form onSubmit={otcLoginForm.handleSubmit(onOtcLoginSubmit)} className="space-y-4">
                        <FormField
                          control={otcLoginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-200">供应商账号</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="输入供应商账号" 
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
                              <FormLabel className="text-gray-200">密码</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="输入密码" 
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
                              <FormLabel className="text-gray-200">BeingFi验证码</FormLabel>
                              <div className="flex gap-2">
                                <FormControl>
                                  <Input 
                                    placeholder="输入验证码" 
                                    {...field} 
                                    className="bg-[#1c293a] border-[#2a3749] text-white focus:border-[#3b82f6] flex-1" 
                                  />
                                </FormControl>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  onClick={refreshVerificationCode}
                                  className="border-[#2a3749] text-gray-300 hover:bg-[#1c293a]"
                                >
                                  <RefreshCcw className="h-4 w-4 mr-1" />
                                  获取
                                </Button>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full gradient-btn" 
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              登录中...
                            </>
                          ) : "登录"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                  
                  {/* 团队登录表单 */}
                  <TabsContent value="staff">
                    <Form {...otcLoginForm}>
                      <form onSubmit={otcLoginForm.handleSubmit(onOtcLoginSubmit)} className="space-y-4">
                        <FormField
                          control={otcLoginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-200">团队账号</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="输入团队账号" 
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
                              <FormLabel className="text-gray-200">密码</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="输入密码" 
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
                              <FormLabel className="text-gray-200">BeingFi验证码</FormLabel>
                              <div className="flex gap-2">
                                <FormControl>
                                  <Input 
                                    placeholder="输入验证码" 
                                    {...field} 
                                    className="bg-[#1c293a] border-[#2a3749] text-white focus:border-[#3b82f6] flex-1" 
                                  />
                                </FormControl>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  onClick={refreshVerificationCode}
                                  className="border-[#2a3749] text-gray-300 hover:bg-[#1c293a]"
                                >
                                  <RefreshCcw className="h-4 w-4 mr-1" />
                                  获取
                                </Button>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full gradient-btn" 
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              登录中...
                            </>
                          ) : "登录"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                  
                  {/* 管理员登录表单 */}
                  <TabsContent value="admin">
                    <Form {...otcLoginForm}>
                      <form onSubmit={otcLoginForm.handleSubmit(onOtcLoginSubmit)} className="space-y-4">
                        <FormField
                          control={otcLoginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-200">管理员账号</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="输入管理员账号" 
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
                              <FormLabel className="text-gray-200">密码</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="输入密码" 
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
                              <FormLabel className="text-gray-200">BeingFi验证码</FormLabel>
                              <div className="flex gap-2">
                                <FormControl>
                                  <Input 
                                    placeholder="输入验证码" 
                                    {...field} 
                                    className="bg-[#1c293a] border-[#2a3749] text-white focus:border-[#3b82f6] flex-1" 
                                  />
                                </FormControl>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  onClick={refreshVerificationCode}
                                  className="border-[#2a3749] text-gray-300 hover:bg-[#1c293a]"
                                >
                                  <RefreshCcw className="h-4 w-4 mr-1" />
                                  获取
                                </Button>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full gradient-btn" 
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              登录中...
                            </>
                          ) : "登录"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
              ) : (
                // AI接入计划登录和注册表单
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="flex justify-center mb-6">
                    <TabsList className="mx-auto bg-[#1c293a] rounded-md">
                      <TabsTrigger value="login" className="text-sm data-[state=active]:bg-[#0e4a89] data-[state=active]:text-white">登录</TabsTrigger>
                      <TabsTrigger value="register" className="text-sm data-[state=active]:bg-[#0e4a89] data-[state=active]:text-white">注册</TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="login">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-200">用户名</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="输入用户名" 
                                  {...field} 
                                  className="bg-[#1c293a] border-[#2a3749] text-white focus:border-[#3b82f6]" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-200">密码</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="输入密码" 
                                  {...field} 
                                  className="bg-[#1c293a] border-[#2a3749] text-white focus:border-[#3b82f6]" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full gradient-btn" 
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              登录中...
                            </>
                          ) : "登录"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>

                  <TabsContent value="register">
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-3">
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-200">用户名</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="选择用户名" 
                                  {...field} 
                                  className="bg-[#1c293a] border-[#2a3749] text-white focus:border-[#3b82f6]" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-200">电子邮件</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email" 
                                  placeholder="your@email.com" 
                                  {...field} 
                                  className="bg-[#1c293a] border-[#2a3749] text-white focus:border-[#3b82f6]" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-200">密码</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="创建密码" 
                                  {...field} 
                                  className="bg-[#1c293a] border-[#2a3749] text-white focus:border-[#3b82f6]" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-200">确认密码</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="再次输入密码" 
                                  {...field} 
                                  className="bg-[#1c293a] border-[#2a3749] text-white focus:border-[#3b82f6]" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full gradient-btn" 
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              注册中...
                            </>
                          ) : "注册"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
            <CardFooter className="flex justify-center text-xs text-gray-500 pt-0">
              {type === 'payment' && (
                <div>BeingFi 支付管理后台 - 专业的全球支付系统</div>
              )}
              {type === 'otc' && (
                <div className="flex flex-col items-center space-y-3 w-full">
                  <div>BeingFi OTC跑分管理系统 - 高效安全的跑分解决方案</div>
                  <div className="pt-3 border-t border-gray-700 w-full text-center">
                    <p className="text-gray-400 mb-2">商务合作联系方式</p>
                    <div className="flex justify-center space-x-4">
                      <div className="text-accent">Telegram: @bepay_otc</div>
                      <div className="text-accent">WeChat: BeingFi888</div>
                    </div>
                  </div>
                </div>
              )}
              {type === 'ai' && (
                <div>BeingFi AI接入计划 - 由DeepSeek-Coder提供技术支持</div>
              )}
            </CardFooter>
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