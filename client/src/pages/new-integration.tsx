import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { paymentApis } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { 
  Loader2, 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  Send, 
  Code,
  Wallet,
  Info,
  AlertCircle,
  Link as LinkIcon,
  PlusCircle,
  CheckCircle2,
  RefreshCw
} from "lucide-react";

import { ChatBubble } from "@/components/ChatBubble";
import { ChatInput } from "@/components/ChatInput";
import { AIChatTips } from "@/components/AIChatTips";

const formSchema = z.object({
  name: z.string().min(3, "项目名称至少3个字符").max(50, "项目名称最多50个字符"),
  description: z.string().optional(),
  targetApiId: z.string().optional(),
  apiDocumentation: z.string().min(10, "API文档内容至少需要10个字符"),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewIntegration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("documentation");
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // 表单处理
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      targetApiId: "",
      apiDocumentation: "",
    },
  });

  // 创建集成项目
  const createProjectMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const projectData = {
        ...data,
        targetApiId: data.targetApiId ? parseInt(data.targetApiId) : undefined,
      };
      
      const res = await apiRequest("POST", "/api/integration-projects", projectData);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "项目创建成功",
        description: "您现在可以开始与AI对话，生成集成代码",
      });
      setActiveTab("conversation");
      // 将创建的项目信息保存在本地
      setCurrentProject(data);
    },
    onError: (error: Error) => {
      toast({
        title: "项目创建失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 保存当前项目信息
  const [currentProject, setCurrentProject] = useState<any>(null);

  // 发送消息给AI
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!currentProject) return;
      
      const newMessages = [...messages, { role: "user", content: message }];
      
      const res = await apiRequest("POST", "/api/ai-conversations", {
        projectId: currentProject.id,
        messages: newMessages,
      });
      
      return await res.json();
    },
    onSuccess: (data) => {
      // 模拟AI回复
      const aiResponse = "我已分析你提供的API文档。根据文档，我推荐使用以下方式进行集成:\n\n```javascript\n// 初始化支付API\nconst paymentApi = new PaymentAPI({\n  apiKey: process.env.API_KEY,\n  merchantId: process.env.MERCHANT_ID\n});\n\n// 创建支付\nasync function createPayment(amount, currency, orderId) {\n  try {\n    const result = await paymentApi.createPayment({\n      amount,\n      currency,\n      orderId,\n      redirectUrl: 'https://your-site.com/payment-result'\n    });\n    return result.paymentUrl;\n  } catch (error) {\n    console.error('Payment creation failed:', error);\n    throw new Error('无法创建支付');\n  }\n}\n```\n\n你需要在服务器端设置好环境变量，这样可以保护你的API密钥。";
      
      setTimeout(() => {
        setIsAiThinking(false);
        setMessages(prev => [...prev, 
          { role: "user", content: form.getValues("apiDocumentation") }, 
          { role: "assistant", content: aiResponse }
        ]);
        
        // 添加生成的示例代码
        createCodeMutation.mutate({
          projectId: currentProject.id,
          language: "javascript",
          code: "// 初始化支付API\nconst paymentApi = new PaymentAPI({\n  apiKey: process.env.API_KEY,\n  merchantId: process.env.MERCHANT_ID\n});\n\n// 创建支付\nasync function createPayment(amount, currency, orderId) {\n  try {\n    const result = await paymentApi.createPayment({\n      amount,\n      currency,\n      orderId,\n      redirectUrl: 'https://your-site.com/payment-result'\n    });\n    return result.paymentUrl;\n  } catch (error) {\n    console.error('Payment creation failed:', error);\n    throw new Error('无法创建支付');\n  }\n}"
        });
      }, 1500);
    },
    onError: (error: Error) => {
      setIsAiThinking(false);
      toast({
        title: "发送消息失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 添加生成的代码
  const createCodeMutation = useMutation({
    mutationFn: async (data: { projectId: number, language: string, code: string }) => {
      const res = await apiRequest("POST", "/api/generated-code", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "代码生成成功",
        description: "您可以在查看代码标签页查看和复制生成的代码",
      });
      setActiveTab("code");
    },
  });

  // 注释掉不存在的接口查询
  // const { data: userData } = useQuery<any>({
  //   queryKey: ["/api/user-info"],
  //   enabled: !!user, // 当用户已登录时才执行查询
  // });
  
  // 使用本地状态或从localStorage获取用户数据
  const [userData, setUserData] = useState<any>(null);

  // 提交表单
  const onSubmit = (values: FormValues) => {
    createProjectMutation.mutate(values);
  };

  // 发送新消息
  const [newMessage, setNewMessage] = useState("");
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    setIsAiThinking(true);
    sendMessageMutation.mutate(newMessage);
    setMessages(prev => [...prev, { role: "user", content: newMessage }]);
    setNewMessage("");
  };

  // 添加样式处理AI消息中的代码块
  const formatMessage = (content: string) => {
    // 简单的处理，将代码块用<pre><code>标签包裹
    const formatted = content.replace(/```(\w*)\n([\s\S]*?)\n```/g, 
      '<pre class="bg-gray-800 p-4 rounded-md overflow-x-auto"><code class="text-white">$2</code></pre>'
    );
    
    return { __html: formatted.replace(/\n/g, '<br />') };
  };

  return (
    <div className="min-h-screen bg-dark text-white flex flex-col">
      <Header />
      
      {/* 顶部彩带 */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"></div>
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <Button 
                variant="ghost" 
                className="mr-4" 
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('app.backToHome')}
              </Button>
              <h1 className="text-3xl font-bold">{t('integration.title')}</h1>
            </div>

            {userData && (
              <div className="flex items-center">
                <Card className="bg-gray-900 border-gray-700">
                  <CardContent className="p-4 flex items-center">
                    <Wallet className="mr-2 h-5 w-5 text-accent" />
                    <span className="text-gray-300 mr-2">{t('user.balance')}:</span>
                    <span className="text-accent font-bold">{userData.balance} USDT</span>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
          
          <Alert className="mb-6 bg-gray-900 border-gray-700">
            <AlertCircle className="h-4 w-4 text-accent" />
            <AlertTitle className="ml-2">{t('integration.aiRestriction.title')}</AlertTitle>
            <AlertDescription>
              {t('integration.aiRestriction.description')}
            </AlertDescription>
          </Alert>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="documentation" disabled={createProjectMutation.isPending}>
                {t('integration.tabs.documentation')}
              </TabsTrigger>
              <TabsTrigger value="conversation" disabled={!currentProject}>
                {t('integration.tabs.conversation')}
              </TabsTrigger>
              <TabsTrigger value="code" disabled={messages.length === 0}>
                {t('integration.tabs.code')}
              </TabsTrigger>
            </TabsList>
            
            {/* 第一步：输入API文档 */}
            <TabsContent value="documentation" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle>{t('integration.doc.title')}</CardTitle>
                    <CardDescription className="text-gray-400">
                      {t('integration.doc.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('integration.form.name')}</FormLabel>
                              <FormControl>
                                <Input placeholder="我的支付集成项目" {...field} className="bg-gray-800 border-gray-700" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('integration.form.description')}</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="简要描述该集成项目的用途" 
                                  {...field} 
                                  className="bg-gray-800 border-gray-700"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="targetApiId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('integration.form.targetApi')}</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="bg-gray-800 border-gray-700">
                                    <SelectValue placeholder="选择支付API" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {paymentApis.map(api => (
                                    <SelectItem 
                                      key={api.id} 
                                      value={api.id.toString()}
                                    >
                                      {api.name}
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="other">其他API</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription className="text-gray-500">
                                如果您要集成的API不在列表中，请选择"其他API"
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="apiDocumentation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('integration.form.apiDoc')}</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="粘贴API文档内容，包括端点、参数、认证方式等" 
                                  {...field} 
                                  className="bg-gray-800 border-gray-700 min-h-[200px]"
                                />
                              </FormControl>
                              <FormDescription className="text-gray-500">
                                {t('integration.form.apiDoc.hint')}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-between items-center pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            className="border-gray-700 text-gray-300"
                            onClick={() => document.getElementById('file-upload')?.click()}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            {t('integration.form.upload')}
                          </Button>
                          <input
                            id="file-upload"
                            type="file"
                            accept=".txt,.md,.json,.yaml,.html,.pdf"
                            className="hidden"
                            onChange={(e) => {
                              // 这里只是一个模拟，实际需要处理文件上传
                              if (e.target.files && e.target.files[0]) {
                                toast({
                                  title: "文件已选择",
                                  description: `${e.target.files[0].name} 已选择，准备上传`,
                                });
                                // 实际实现中需要读取文件内容
                              }
                            }}
                          />
                          
                          <Button
                            type="submit"
                            disabled={createProjectMutation.isPending}
                            className="gradient-btn"
                          >
                            {createProjectMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('integration.form.processing')}
                              </>
                            ) : (
                              <>
                                {t('integration.form.next')}
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>

                <div>
                  <Card className="bg-gray-900 border-gray-700 mb-6">
                    <CardHeader>
                      <CardTitle>如何准备API文档</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-300">提供详细的API文档对于成功集成至关重要。请确保包含以下信息：</p>
                      
                      <ul className="list-disc pl-5 space-y-2 text-gray-300">
                        <li>API的基本URL和版本信息</li>
                        <li>认证方式（API密钥、OAuth等）</li>
                        <li>支付创建端点及所需参数</li>
                        <li>支付状态查询端点</li>
                        <li>退款处理端点（如适用）</li>
                        <li>回调/webhook处理说明</li>
                        <li>错误处理和状态码解释</li>
                      </ul>
                      
                      <p className="text-gray-300">您可以直接粘贴API提供商的官方文档，或者提供API文档的URL。</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader>
                      <CardTitle>费用说明</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 mb-4">使用AI生成集成代码将消耗您的账户余额：</p>
                      
                      <div className="bg-gray-800 p-4 rounded-md mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-white">每次AI交互：</span>
                          <span className="text-accent font-bold">0.1 USDT</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-400 text-sm">
                        您可以与AI多次交互以优化和改进生成的代码。每次交互都会产生新的费用。
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            {/* 第二步：与AI对话 */}
            <TabsContent value="conversation" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader>
                      <CardTitle>{t('integration.ai.title')}</CardTitle>
                      <CardDescription className="text-gray-400">
                        {t('integration.ai.description')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-800 rounded-md p-4 min-h-[400px] max-h-[500px] overflow-y-auto mb-4">
                        {messages.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <Code className="h-12 w-12 mb-4" />
                            <p>{t('integration.ai.ready')}</p>
                            <p className="text-sm mt-2">{t('integration.ai.startPrompt')}</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {messages.map((msg, idx) => (
                              <ChatBubble 
                                key={idx}
                                content={msg.content}
                                isUser={msg.role === 'user'}
                                timestamp={new Date()}
                              />
                            ))}
                            {isAiThinking && (
                              <ChatBubble 
                                content={t('integration.ai.thinking')}
                                isUser={false}
                                isLoading={true}
                              />
                            )}
                          </div>
                        )}
                      </div>
                      
                      <ChatInput
                        message={newMessage}
                        setMessage={setNewMessage}
                        onSend={handleSendMessage}
                        isDisabled={isAiThinking}
                      />
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <AIChatTips />
                  
                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader>
                      <CardTitle>{t('integration.project.title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {currentProject && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-400">{t('integration.project.name')}：</span>
                            <span className="text-white">{currentProject.name}</span>
                          </div>
                          {currentProject.description && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">{t('integration.project.description')}：</span>
                              <span className="text-white">{currentProject.description}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-400">{t('integration.project.createdAt')}：</span>
                            <span className="text-white">
                              {new Date(currentProject.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">{t('integration.project.status')}：</span>
                            <span className="text-accent">{t('integration.project.inProgress')}</span>
                          </div>
                        </>
                      )}
                    </CardContent>
                    <CardFooter className="justify-end">
                      <Button
                        variant="outline"
                        className="border-accent text-accent hover:bg-accent/10"
                        onClick={() => setActiveTab("documentation")}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t('integration.project.backToEdit')}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            {/* 第三步：查看生成的代码 */}
            <TabsContent value="code" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>{t('integration.code.title')}</CardTitle>
                        <CardDescription className="text-gray-400">
                          {t('integration.code.description')}
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        className="border-accent text-accent hover:bg-accent/10"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            "// 初始化支付API\nconst paymentApi = new PaymentAPI({\n  apiKey: process.env.API_KEY,\n  merchantId: process.env.MERCHANT_ID\n});\n\n// 创建支付\nasync function createPayment(amount, currency, orderId) {\n  try {\n    const result = await paymentApi.createPayment({\n      amount,\n      currency,\n      orderId,\n      redirectUrl: 'https://your-site.com/payment-result'\n    });\n    return result.paymentUrl;\n  } catch (error) {\n    console.error('Payment creation failed:', error);\n    throw new Error('无法创建支付');\n  }\n}"
                          );
                          toast({
                            title: t('integration.code.copied'),
                            description: t('integration.code.copiedDesc')
                          });
                        }}
                      >
                        {t('integration.code.copy')}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-gray-800 p-6 rounded-md overflow-x-auto text-white">
                        <code>{`// 初始化支付API
const paymentApi = new PaymentAPI({
  apiKey: process.env.API_KEY,
  merchantId: process.env.MERCHANT_ID
});

// 创建支付
async function createPayment(amount, currency, orderId) {
  try {
    const result = await paymentApi.createPayment({
      amount,
      currency,
      orderId,
      redirectUrl: 'https://your-site.com/payment-result'
    });
    return result.paymentUrl;
  } catch (error) {
    console.error('Payment creation failed:', error);
    throw new Error('无法创建支付');
  }
}`}</code>
                      </pre>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full gradient-btn"
                        onClick={() => {
                          setActiveTab("conversation");
                          setNewMessage("这段代码能不能优化一下，添加支付状态查询功能？");
                        }}
                      >
                        {t('integration.code.continue')}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
                
                <div>
                  <Card className="bg-gray-900 border-gray-700 mb-6">
                    <CardHeader>
                      <CardTitle>{t('integration.guide.cardTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-300">{t('integration.guide.description')}</p>
                      
                      <ol className="list-decimal pl-5 space-y-2 text-gray-300">
                        <li>{t('integration.guide.step1')}</li>
                        <li>{t('integration.guide.step2')}</li>
                        <li>{t('integration.guide.step3')}</li>
                        <li>{t('integration.guide.step4')}</li>
                        <li>{t('integration.guide.step5')}</li>
                      </ol>
                      
                      <div className="p-3 bg-gray-800 rounded-md text-gray-300 text-sm mt-4">
                        <p className="font-medium text-accent mb-2">{t('integration.guide.importantTitle')}</p>
                        <p>{t('integration.guide.importantDesc')}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader>
                      <CardTitle>{t('integration.nextSteps.title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-300">{t('integration.nextSteps.description')}</p>
                      
                      <ul className="list-disc pl-5 space-y-2 text-gray-300">
                        <li>{t('integration.nextSteps.item1')}</li>
                        <li>{t('integration.nextSteps.item2')}</li>
                        <li>{t('integration.nextSteps.item3')}</li>
                        <li>{t('integration.nextSteps.item4')}</li>
                      </ul>
                      
                      <p className="text-gray-300 mt-4">
                        {t('integration.nextSteps.continue')}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button
                        variant="outline"
                        className="border-gray-700"
                        onClick={() => setActiveTab("conversation")}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t('integration.backToConversation')}
                      </Button>
                      <Button 
                        className="gradient-btn"
                        onClick={() => navigate("/my-projects")}
                      >
                        {t('integration.viewAllProjects')}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}