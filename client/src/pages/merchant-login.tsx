import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Coins, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Squares from "@/components/Squares/Squares";

const merchantLoginSchema = z.object({
  walletid: z.string().min(1, "钱包ID不能为空"),
  code: z.string().min(1, "验证码不能为空"),
});

type MerchantLoginFormValues = z.infer<typeof merchantLoginSchema>;

export default function MerchantLoginPage() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const { toast } = useToast();

  const form = useForm<MerchantLoginFormValues>({
    resolver: zodResolver(merchantLoginSchema),
    defaultValues: {
      walletid: "",
      code: "",
    },
  });

  const onSubmit = async (values: MerchantLoginFormValues) => {
    setIsLoading(true);
    setLoginError("");
    
    try {
      const formData = new FormData();
      formData.append('walletid', values.walletid);
      formData.append('code', values.code);
      
      const response = await apiRequest<any>('POST', '/Api/Login/doMerchartLogin', formData);
      
      if (response.code !== 0) {
        setLoginError(response.msg || "登录失败");
        setIsLoading(false);
        return;
      }
      
      // 检查role是否为5（商户角色）
      if (response.data?.role !== '5') {
        setLoginError("登录失败：不是有效的商户账号");
        setIsLoading(false);
        return;
      }
      
      // 登录成功，保存信息
      localStorage.setItem('merchantToken', response.data?.token || '');
      localStorage.setItem('merchantUser', JSON.stringify(response.data));
      
      toast({
        title: "登录成功",
        description: `欢迎回来，${response.data?.username || '商户'}！`,
      });
      
      setIsLoading(false);
      setLocation('/merchant');
    } catch (error: any) {
      console.error('登录失败:', error);
      setLoginError(error?.message || "网络错误，请稍后重试");
      setIsLoading(false);
      toast({
        title: "登录失败",
        description: error?.message || "网络错误，请稍后重试",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0b121c] flex items-center justify-center overflow-hidden">
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
      
      <div className="w-full max-w-md px-4 relative z-10">
        <Card className="bg-[#111827] border-[#1e293b] shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              <Coins className="w-6 h-6" />
              BeingFi 商户后台
            </CardTitle>
            <CardDescription className="text-gray-400 text-sm">
              输入钱包ID，验证码将发送到您的Telegram
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="walletid"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200">请输入您的钱包ID</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="输入钱包ID"
                            {...field} 
                            className="bg-[#1c293a] border-[#2a3749] text-white focus:border-[#3b82f6]" 
                            data-testid="input-merchant-wallet-id"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200">请输入BeingFi机器人发送给你的验证码</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="输入验证码" 
                            {...field} 
                            className="bg-[#1c293a] border-[#2a3749] text-white focus:border-[#3b82f6]" 
                            data-testid="input-merchant-code"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {loginError && (
                    <div className="bg-red-900/30 border border-red-700 text-red-300 px-3 py-2 rounded text-sm">
                      {loginError}
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-[#0e4a89] hover:bg-[#0f5aa3] text-white"
                    disabled={isLoading}
                    data-testid="button-merchant-login"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        登录中...
                      </>
                    ) : (
                      '登录商户后台'
                    )}
                  </Button>
                  
                  <p className="text-xs text-gray-500 text-center">
                    首次登录请先在Telegram中向Bot发送任意消息以激活账号
                  </p>
                </form>
              </Form>
            </div>
          </CardContent>
        </Card>
        
        {/* OTC跑分后台入口 - 独立按钮 */}
        <Button
          variant="outline"
          className="w-full mt-4 bg-[#1c293a] border-[#2a3749] text-gray-300 hover:bg-[#253548] hover:border-blue-500 transition-colors"
          onClick={() => setLocation('/auth')}
        >
          <FileText className="h-4 w-4 mr-2" />
          OTC跑分后台
        </Button>
      </div>
    </div>
  );
}
