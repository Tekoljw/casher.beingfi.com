import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Cpu, Zap, Shield, Globe } from "lucide-react";
import Header from "@/components/Header";
import { useLanguage } from "@/hooks/use-language";
import Squares from "@/components/Squares/Squares";
import { useToast } from "@/hooks/use-toast";

const aiLoginSchema = z.object({
  username: z.string().min(2, "用户名至少需要2个字符"),
  password: z.string().min(1, "请输入密码"),
  apiKey: z.string().optional(),
});

type AiLoginFormValues = z.infer<typeof aiLoginSchema>;

export default function AuthAi() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const aiLoginForm = useForm<AiLoginFormValues>({
    resolver: zodResolver(aiLoginSchema),
    defaultValues: { username: "", password: "", apiKey: "" },
  });

  const onAiLoginSubmit = async (values: AiLoginFormValues) => {
    setIsLoading(true);
    try {
      toast({
        title: "登录成功",
        description: "欢迎使用AI接入计划",
      });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        title: "登录失败",
        description: error.message || "请检查您的凭证",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: <Cpu className="w-6 h-6" />, title: "智能路由", desc: "AI驱动的支付通道选择" },
    { icon: <Zap className="w-6 h-6" />, title: "实时分析", desc: "交易数据智能分析" },
    { icon: <Shield className="w-6 h-6" />, title: "风控系统", desc: "AI风险识别与防护" },
    { icon: <Globe className="w-6 h-6" />, title: "全球覆盖", desc: "50+国家支付通道" },
  ];

  return (
    <div className="min-h-screen bg-dark relative overflow-hidden">
      <div className="fixed inset-0 z-0">
        <Squares 
          speed={0.5}
          squareSize={40}
          direction="diagonal"
          borderColor="#012d28"
          hoverFillColor="#222"
        />
      </div>
      
      <div className="relative z-10">
        <Header />
        
        <div className="pt-32 pb-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                  <span className="text-white">AI</span>
                  <span className="gradient-text">接入计划</span>
                </h1>
                <p className="text-gray-300 text-lg mb-8">
                  作为上游合作伙伴，接入BeingFi AI驱动的全球支付网络，享受智能路由、实时分析和风控保护
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  {features.map((feature, index) => (
                    <div 
                      key={index}
                      className="bg-black/40 backdrop-blur-sm p-4 rounded-xl border border-gray-800/50"
                    >
                      <div className="w-12 h-12 bg-accent/20 text-accent rounded-lg flex items-center justify-center mb-3">
                        {feature.icon}
                      </div>
                      <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
                      <p className="text-gray-400 text-sm">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-center lg:justify-end">
                <Card className="w-full max-w-md bg-black/60 backdrop-blur-md border-gray-800/50">
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl text-white">上游接入登录</CardTitle>
                    <CardDescription className="text-gray-400">
                      登录您的AI接入计划账户
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...aiLoginForm}>
                      <form onSubmit={aiLoginForm.handleSubmit(onAiLoginSubmit)} className="space-y-4">
                        <FormField
                          control={aiLoginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">用户名</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="请输入用户名" 
                                  className="bg-gray-900/50 border-gray-700 text-white"
                                  data-testid="input-username"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={aiLoginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">密码</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="请输入密码" 
                                  className="bg-gray-900/50 border-gray-700 text-white"
                                  data-testid="input-password"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={aiLoginForm.control}
                          name="apiKey"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">API密钥 (可选)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="请输入API密钥" 
                                  className="bg-gray-900/50 border-gray-700 text-white"
                                  data-testid="input-apikey"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full gradient-btn"
                          disabled={isLoading}
                          data-testid="button-login"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              登录中...
                            </>
                          ) : (
                            "登录"
                          )}
                        </Button>
                      </form>
                    </Form>
                    
                    <div className="mt-6 text-center">
                      <p className="text-gray-500 text-sm">
                        还没有账户？ 
                        <a href="#contact" className="text-accent hover:underline ml-1">
                          联系我们申请
                        </a>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
