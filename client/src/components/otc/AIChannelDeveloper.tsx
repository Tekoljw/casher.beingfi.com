import { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  Send, 
  Settings, 
  FileText, 
  Code, 
  Play, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Upload,
  Trash2,
  Copy,
  Download,
  Sparkles,
  MessageSquare,
  Zap,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Bug,
  Terminal,
  TestTube,
  RotateCcw,
  Square,
  PlusCircle,
  Link2,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  codeBlocks?: CodeBlock[];
}

interface CodeBlock {
  language: string;
  code: string;
  filename?: string;
}

interface AIConfig {
  provider: "deepseek" | "qwen";
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  baseUrl: string;
}

interface ChannelCode {
  id: string;
  name: string;
  filename: string;
  code: string;
  language: string;
  status: "pending" | "running" | "success" | "error";
  logs?: string[];
}

interface TestResult {
  id: string;
  type: "info" | "success" | "error" | "warning";
  message: string;
  timestamp: Date;
  details?: string;
}

interface GeneratedInterface {
  id: string;
  name: string;
  code: string;
  status: "pending" | "active" | "disabled";
  createdAt: Date;
  channels: InterfaceChannel[];
}

interface InterfaceChannel {
  id: string;
  channelCode: string;
  channelName: string;
  currency: string;
  mappedPaymentMethod: string | null;
}

const DEFAULT_CONFIGS: Record<string, AIConfig> = {
  deepseek: {
    provider: "deepseek",
    apiKey: "",
    model: "deepseek-chat",
    baseUrl: "https://api.deepseek.com/v1",
    temperature: 0.7,
    maxTokens: 4096,
  },
  qwen: {
    provider: "qwen",
    apiKey: "",
    model: "qwen-turbo",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    temperature: 0.7,
    maxTokens: 4096,
  },
};

export function AIChannelDeveloper() {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const testLogsEndRef = useRef<HTMLDivElement>(null);
  
  const [activeTab, setActiveTab] = useState("chat");
  const [configOpen, setConfigOpen] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  
  const [config, setConfig] = useState<AIConfig>(DEFAULT_CONFIGS.deepseek);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "system",
      content: `欢迎使用 AI 通道开发助手！

我可以帮助您自动开发和接入新的支付通道。请按照以下步骤操作：

1. **配置 API 密钥** - 选择 DeepSeek 或千问，并输入您的 API 密钥
2. **上传开发文档** - 将支付通道的 API 文档粘贴或上传到这里
3. **开始对话** - 告诉我您需要接入什么类型的通道
4. **生成代码** - 我会自动生成通道接入代码
5. **调试测试** - 在测试面板中验证代码功能
6. **部署运行** - 一键部署到服务器运行

现在，请先在上方配置您的 AI 模型 API 密钥。`,
      timestamp: new Date(),
    },
  ]);
  
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [documentContent, setDocumentContent] = useState("");
  const [generatedCode, setGeneratedCode] = useState<ChannelCode[]>([]);
  
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testInput, setTestInput] = useState("{}");
  const [selectedCodeForTest, setSelectedCodeForTest] = useState<string>("");
  const [isTesting, setIsTesting] = useState(false);
  
  // Test order states
  const [testOrderType, setTestOrderType] = useState<"collect" | "payout">("collect");
  const [testOrderAmount, setTestOrderAmount] = useState("100");
  const [testOrderCurrency, setTestOrderCurrency] = useState("CNY");
  const [testOrderPaymentMethod, setTestOrderPaymentMethod] = useState("bank_card");
  const [testCustomerName, setTestCustomerName] = useState("");
  const [testCustomerAccount, setTestCustomerAccount] = useState("");
  const [testBankName, setTestBankName] = useState("");
  const [isSubmittingTestOrder, setIsSubmittingTestOrder] = useState(false);
  
  // Generated interfaces state
  const [generatedInterfaces, setGeneratedInterfaces] = useState<GeneratedInterface[]>([
    {
      id: "IF1732985423001",
      name: "支付宝代收接口",
      code: "ALIPAY_COLLECT",
      status: "active",
      createdAt: new Date("2025-11-30T10:00:00"),
      channels: [
        { id: "CH001", channelCode: "ALIPAY_SCAN", channelName: "支付宝扫码", currency: "CNY", mappedPaymentMethod: "支付宝扫码" },
        { id: "CH002", channelCode: "ALIPAY_H5", channelName: "支付宝H5", currency: "CNY", mappedPaymentMethod: null },
      ]
    },
    {
      id: "IF1732985423002", 
      name: "银行卡代付接口",
      code: "BANK_PAYOUT",
      status: "active",
      createdAt: new Date("2025-11-30T11:00:00"),
      channels: [
        { id: "CH003", channelCode: "BANK_TRANSFER", channelName: "银行转账", currency: "CNY", mappedPaymentMethod: "银行转账" },
      ]
    }
  ]);
  const [showInterfaceDialog, setShowInterfaceDialog] = useState(false);
  const [newInterfaceName, setNewInterfaceName] = useState("");
  const [newInterfaceCode, setNewInterfaceCode] = useState("");
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  useEffect(() => {
    testLogsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [testResults]);
  
  const handleProviderChange = (provider: "deepseek" | "qwen") => {
    const defaultConfig = DEFAULT_CONFIGS[provider];
    setConfig({
      ...defaultConfig,
      apiKey: config.apiKey,
    });
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setDocumentContent(content);
      toast({
        title: "文档已上传",
        description: `已成功读取文件: ${file.name}`,
      });
      
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "system",
          content: `📄 已加载开发文档: ${file.name}\n\n文档内容已准备就绪，您可以开始询问关于通道接入的问题了。`,
          timestamp: new Date(),
        },
      ]);
    };
    reader.readAsText(file);
  };
  
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    if (!config.apiKey) {
      toast({
        title: "请先配置 API 密钥",
        description: "在发送消息之前，请先配置您的 AI 模型 API 密钥",
        variant: "destructive",
      });
      return;
    }
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    
    try {
      const systemPrompt = `你是一个专业的支付通道开发助手，精通各种支付API的集成开发。

你的任务是帮助用户开发和接入新的支付通道。你需要：
1. 分析用户提供的API文档
2. 生成完整的通道接入代码（TypeScript/Node.js）
3. 包含错误处理、日志记录和回调处理
4. 生成可以直接运行的代码

${documentContent ? `\n用户已上传的API文档内容:\n\`\`\`\n${documentContent}\n\`\`\`` : ""}

当生成代码时，请使用以下格式标记代码块:
\`\`\`typescript:filename.ts
// 代码内容
\`\`\`

确保生成的代码是完整的、可运行的，并且遵循最佳实践。`;

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: config.provider,
          apiKey: config.apiKey,
          model: config.model,
          baseUrl: config.baseUrl,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages
              .filter((m) => m.role !== "system")
              .map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: inputMessage },
          ],
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "AI 请求失败");
      }
      
      const data = await response.json();
      const assistantContent = data.content || data.choices?.[0]?.message?.content || "抱歉，我无法生成回复。";
      
      const codeBlocks = extractCodeBlocks(assistantContent);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: assistantContent,
        timestamp: new Date(),
        codeBlocks,
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      
      if (codeBlocks.length > 0) {
        const newCode: ChannelCode[] = codeBlocks.map((block, index) => ({
          id: `code-${Date.now()}-${index}`,
          name: block.filename || `channel-code-${index + 1}.ts`,
          filename: block.filename || `channel-code-${index + 1}.ts`,
          code: block.code,
          language: block.language,
          status: "pending",
        }));
        setGeneratedCode((prev) => [...prev, ...newCode]);
        
        toast({
          title: "代码已生成",
          description: `已生成 ${codeBlocks.length} 个代码文件`,
        });
      }
    } catch (error: any) {
      console.error("AI chat error:", error);
      toast({
        title: "请求失败",
        description: error.message || "与 AI 通信时发生错误",
        variant: "destructive",
      });
      
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `抱歉，发生了错误: ${error.message || "未知错误"}。请检查您的 API 配置是否正确。`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const extractCodeBlocks = (content: string): CodeBlock[] => {
    const blocks: CodeBlock[] = [];
    const regex = /```(\w+)?(?::([^\n]+))?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      blocks.push({
        language: match[1] || "typescript",
        filename: match[2],
        code: match[3].trim(),
      });
    }
    
    return blocks;
  };
  
  const deployCode = async (codeItem: ChannelCode) => {
    setGeneratedCode((prev) =>
      prev.map((c) => (c.id === codeItem.id ? { ...c, status: "running", logs: ["开始部署..."] } : c))
    );
    
    try {
      const response = await fetch("/api/ai/deploy-channel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: codeItem.filename,
          code: codeItem.code,
          language: codeItem.language,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "部署失败");
      }
      
      const result = await response.json();
      
      setGeneratedCode((prev) =>
        prev.map((c) =>
          c.id === codeItem.id
            ? {
                ...c,
                status: "success",
                logs: [...(c.logs || []), "部署成功!", result.message || "通道代码已成功部署到服务器"],
              }
            : c
        )
      );
      
      toast({
        title: "部署成功",
        description: `${codeItem.filename} 已成功部署到服务器`,
      });
    } catch (error: any) {
      setGeneratedCode((prev) =>
        prev.map((c) =>
          c.id === codeItem.id
            ? { ...c, status: "error", logs: [...(c.logs || []), `错误: ${error.message}`] }
            : c
        )
      );
      
      toast({
        title: "部署失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  const [isDeployingAll, setIsDeployingAll] = useState(false);
  
  const deployAllCode = async () => {
    const pendingCodes = generatedCode.filter(c => c.status === "pending" || c.status === "error");
    if (pendingCodes.length === 0) {
      toast({
        title: "没有待部署的代码",
        description: "所有代码已经部署完成",
      });
      return;
    }
    
    setIsDeployingAll(true);
    toast({
      title: "开始批量部署",
      description: `正在部署 ${pendingCodes.length} 个代码文件...`,
    });
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const codeItem of pendingCodes) {
      setGeneratedCode((prev) =>
        prev.map((c) => (c.id === codeItem.id ? { ...c, status: "running", logs: ["开始部署..."] } : c))
      );
      
      try {
        const response = await fetch("/api/ai/deploy-channel", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filename: codeItem.filename,
            code: codeItem.code,
            language: codeItem.language,
          }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "部署失败");
        }
        
        const result = await response.json();
        
        setGeneratedCode((prev) =>
          prev.map((c) =>
            c.id === codeItem.id
              ? {
                  ...c,
                  status: "success",
                  logs: [...(c.logs || []), "部署成功!", result.message || "通道代码已成功部署到服务器"],
                }
              : c
          )
        );
        successCount++;
      } catch (error: any) {
        setGeneratedCode((prev) =>
          prev.map((c) =>
            c.id === codeItem.id
              ? { ...c, status: "error", logs: [...(c.logs || []), `错误: ${error.message}`] }
              : c
          )
        );
        errorCount++;
      }
      
      // Small delay between deployments
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsDeployingAll(false);
    
    if (errorCount === 0) {
      toast({
        title: "批量部署完成",
        description: `成功部署 ${successCount} 个文件`,
      });
    } else {
      toast({
        title: "批量部署完成",
        description: `成功 ${successCount} 个，失败 ${errorCount} 个`,
        variant: errorCount > 0 ? "destructive" : "default",
      });
    }
  };
  
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "已复制",
      description: "代码已复制到剪贴板",
    });
  };
  
  const generateInterface = () => {
    if (!newInterfaceName.trim() || !newInterfaceCode.trim()) {
      toast({
        title: "请填写完整信息",
        description: "接口名称和代码不能为空",
        variant: "destructive",
      });
      return;
    }
    
    const interfaceId = `IF${Date.now()}`;
    
    const mockChannels: InterfaceChannel[] = [
      { id: `CH${Date.now()}_1`, channelCode: `${newInterfaceCode}_SCAN`, channelName: `${newInterfaceName}扫码`, currency: "CNY", mappedPaymentMethod: null },
      { id: `CH${Date.now()}_2`, channelCode: `${newInterfaceCode}_H5`, channelName: `${newInterfaceName}H5`, currency: "CNY", mappedPaymentMethod: null },
      { id: `CH${Date.now()}_3`, channelCode: `${newInterfaceCode}_APP`, channelName: `${newInterfaceName}APP`, currency: "CNY", mappedPaymentMethod: null },
    ];
    
    const newInterface: GeneratedInterface = {
      id: interfaceId,
      name: newInterfaceName,
      code: newInterfaceCode.toUpperCase(),
      status: "pending",
      createdAt: new Date(),
      channels: mockChannels,
    };
    
    setGeneratedInterfaces(prev => [...prev, newInterface]);
    setShowInterfaceDialog(false);
    setNewInterfaceName("");
    setNewInterfaceCode("");
    
    toast({
      title: "接口已生成",
      description: `接口ID: ${interfaceId}，请前往"API接口管理"配置支付通道映射`,
    });
  };
  
  const addTestLog = (type: TestResult["type"], message: string, details?: string) => {
    setTestResults((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type,
        message,
        timestamp: new Date(),
        details,
      },
    ]);
  };
  
  const runTest = async () => {
    if (!selectedCodeForTest) {
      toast({
        title: "请选择代码",
        description: "请先选择要测试的代码文件",
        variant: "destructive",
      });
      return;
    }
    
    const codeItem = generatedCode.find((c) => c.id === selectedCodeForTest);
    if (!codeItem) return;
    
    setIsTesting(true);
    addTestLog("info", `开始测试: ${codeItem.filename}`);
    
    let testData: any;
    try {
      testData = JSON.parse(testInput);
      addTestLog("info", "测试参数解析成功", JSON.stringify(testData, null, 2));
    } catch (e) {
      addTestLog("error", "测试参数格式错误，请输入有效的 JSON");
      setIsTesting(false);
      return;
    }
    
    try {
      addTestLog("info", "正在执行代码测试...");
      
      const response = await fetch("/api/ai/test-channel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: codeItem.code,
          testData,
          filename: codeItem.filename,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        addTestLog("error", `测试失败: ${result.message || "未知错误"}`, result.details);
      } else {
        if (result.success) {
          addTestLog("success", "测试通过!", JSON.stringify(result.result, null, 2));
        } else {
          addTestLog("warning", "测试完成但有警告", result.message);
        }
        
        if (result.logs && result.logs.length > 0) {
          result.logs.forEach((log: string) => {
            addTestLog("info", log);
          });
        }
      }
    } catch (error: any) {
      addTestLog("error", `测试执行失败: ${error.message}`);
    } finally {
      setIsTesting(false);
      addTestLog("info", "测试结束");
    }
  };
  
  const validateCode = async () => {
    if (!selectedCodeForTest) {
      toast({
        title: "请选择代码",
        description: "请先选择要验证的代码文件",
        variant: "destructive",
      });
      return;
    }
    
    const codeItem = generatedCode.find((c) => c.id === selectedCodeForTest);
    if (!codeItem) return;
    
    setIsTesting(true);
    addTestLog("info", `开始语法验证: ${codeItem.filename}`);
    
    try {
      const response = await fetch("/api/ai/validate-channel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: codeItem.code,
          filename: codeItem.filename,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        addTestLog("error", `验证失败: ${result.message || "未知错误"}`);
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach((err: any) => {
            addTestLog("error", `第 ${err.line} 行: ${err.message}`);
          });
        }
      } else {
        addTestLog("success", "代码语法验证通过!");
        if (result.warnings && result.warnings.length > 0) {
          result.warnings.forEach((warn: string) => {
            addTestLog("warning", warn);
          });
        }
      }
    } catch (error: any) {
      addTestLog("error", `验证执行失败: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };
  
  const submitTestOrder = async () => {
    if (!testOrderAmount || parseFloat(testOrderAmount) <= 0) {
      toast({
        title: "金额错误",
        description: "请输入有效的订单金额",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmittingTestOrder(true);
    const orderType = testOrderType === "collect" ? "代收" : "代付";
    const testOrderNo = `TEST${Date.now()}`;
    
    addTestLog("info", `发起测试${orderType}订单: ${testOrderNo}`);
    addTestLog("info", `订单类型: ${orderType} | 金额: ${testOrderAmount} ${testOrderCurrency}`);
    addTestLog("info", `支付方式: ${testOrderPaymentMethod}`);
    
    if (testOrderType === "payout") {
      if (!testCustomerName || !testCustomerAccount) {
        addTestLog("error", "代付订单需要填写收款人姓名和账号");
        setIsSubmittingTestOrder(false);
        return;
      }
      addTestLog("info", `收款人: ${testCustomerName} | 账号: ${testCustomerAccount}${testBankName ? ` | 开户行: ${testBankName}` : ""}`);
    }
    
    try {
      // Simulate API call with delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockResponse = {
        success: true,
        orderNo: testOrderNo,
        merchantOrderNo: `M${Date.now()}`,
        status: "pending",
        amount: parseFloat(testOrderAmount),
        currency: testOrderCurrency,
        paymentMethod: testOrderPaymentMethod,
        payUrl: testOrderType === "collect" ? `https://pay.example.com/cashier/${testOrderNo}` : undefined,
        estimatedTime: testOrderType === "payout" ? "5-10分钟" : undefined,
        createdAt: new Date().toISOString(),
      };
      
      addTestLog("success", `订单创建成功!`);
      addTestLog("info", `订单号: ${mockResponse.orderNo}`);
      addTestLog("info", `商户订单号: ${mockResponse.merchantOrderNo}`);
      addTestLog("info", `订单状态: ${mockResponse.status === "pending" ? "待处理" : mockResponse.status}`);
      
      if (testOrderType === "collect" && mockResponse.payUrl) {
        addTestLog("info", `收银台链接: ${mockResponse.payUrl}`);
      }
      if (testOrderType === "payout" && mockResponse.estimatedTime) {
        addTestLog("info", `预计完成时间: ${mockResponse.estimatedTime}`);
      }
      
      // Simulate order status update after a delay
      setTimeout(() => {
        const randomStatus = Math.random() > 0.3 ? "completed" : "processing";
        addTestLog("info", `[订单状态更新] 订单 ${testOrderNo} 状态变更为: ${randomStatus === "completed" ? "已完成" : "处理中"}`);
        if (randomStatus === "completed") {
          addTestLog("success", `订单 ${testOrderNo} ${orderType}成功完成!`);
        }
      }, 3000);
      
      toast({
        title: "测试订单已提交",
        description: `${orderType}订单 ${testOrderNo} 已成功创建`,
      });
      
    } catch (error: any) {
      addTestLog("error", `测试订单创建失败: ${error.message}`);
      toast({
        title: "订单创建失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingTestOrder(false);
    }
  };
  
  const formatMessage = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith("```")) {
        const match = part.match(/```(\w+)?(?::([^\n]+))?\n([\s\S]*?)```/);
        if (match) {
          const [, language, filename, code] = match;
          return (
            <div key={index} className="my-3 rounded-lg overflow-hidden border border-gray-200">
              <div className="flex items-center justify-between bg-gray-100 px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{filename || language || "code"}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2"
                  onClick={() => copyCode(code.trim())}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  复制
                </Button>
              </div>
              <pre className="p-3 bg-gray-900 text-gray-100 overflow-x-auto text-sm">
                <code>{code.trim()}</code>
              </pre>
            </div>
          );
        }
      }
      return (
        <span key={index} className="whitespace-pre-wrap">
          {part}
        </span>
      );
    });
  };
  
  return (
    <div className="space-y-6 bg-white p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-black">AI 通道开发助手</h2>
          <p className="text-sm text-gray-500">使用 AI 自动开发和接入新的支付通道</p>
        </div>
      </div>
      
      <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
        <Card className="bg-white">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-gray-500" />
                  <CardTitle className="text-lg">AI 模型配置</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {config.apiKey && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      已配置
                    </Badge>
                  )}
                  {configOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-black">AI 提供商</Label>
                  <Select
                    value={config.provider}
                    onValueChange={(value: "deepseek" | "qwen") => handleProviderChange(value)}
                  >
                    <SelectTrigger className="bg-white border-gray-300 text-black" data-testid="select-ai-provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deepseek">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          DeepSeek
                        </div>
                      </SelectItem>
                      <SelectItem value="qwen">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          通义千问 (Qwen)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {config.provider === "deepseek" 
                      ? "使用 DeepSeek Chat 模型" 
                      : "使用通义千问 Turbo 模型"}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-black">API 密钥</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        placeholder={config.provider === "deepseek" ? "sk-..." : "sk-..."}
                        value={config.apiKey}
                        onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                        className="bg-white border-gray-300 pr-10 text-black"
                        data-testid="input-ai-api-key"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {config.provider === "deepseek" 
                      ? "从 platform.deepseek.com 获取 API 密钥" 
                      : "从阿里云百炼平台获取 API 密钥"}
                  </p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-white border border-gray-200 flex-wrap h-auto">
          <TabsTrigger value="chat" className="flex items-center gap-2 py-2 bg-white text-gray-700 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">AI 对话</span>
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex items-center gap-2 py-2 bg-white text-gray-700 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">开发文档</span>
          </TabsTrigger>
          <TabsTrigger value="code" className="flex items-center gap-2 relative py-2 bg-white text-gray-700 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
            <Code className="h-4 w-4" />
            <span className="hidden sm:inline">生成代码</span>
            {generatedCode.length > 0 && (
              <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {generatedCode.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2 py-2 bg-white text-gray-700 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
            <Bug className="h-4 w-4" />
            <span className="hidden sm:inline">调试测试</span>
          </TabsTrigger>
          <TabsTrigger value="interfaces" className="flex items-center gap-2 py-2 bg-white text-gray-700 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
            <Link2 className="h-4 w-4" />
            <span className="hidden sm:inline">生成接口</span>
            {generatedInterfaces.length > 0 && (
              <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-green-500">
                {generatedInterfaces.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="mt-4">
          <Card className="bg-white">
            <CardContent className="p-0">
              <ScrollArea className="h-[400px] p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg p-3 ${
                          message.role === "user"
                            ? "bg-blue-500 text-white"
                            : message.role === "system"
                            ? "bg-gray-100 text-gray-700 border border-gray-200"
                            : "bg-gray-50 text-gray-800 border border-gray-200"
                        }`}
                      >
                        {message.role === "assistant" ? (
                          <div className="prose prose-sm max-w-none">{formatMessage(message.content)}</div>
                        ) : (
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        )}
                        <div
                          className={`text-xs mt-2 ${
                            message.role === "user" ? "text-blue-100" : "text-gray-400"
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                          <span className="text-gray-600">AI 正在思考...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="描述您需要接入的通道，或询问开发相关问题..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    disabled={isLoading}
                    className="flex-1 bg-white border-gray-300 text-black"
                    data-testid="input-ai-message"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                    data-testid="button-send-message"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <Zap className="h-3 w-3" />
                  <span>提示: 先上传 API 文档，然后描述您需要接入的通道类型</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="docs" className="mt-4">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                开发文档
              </CardTitle>
              <CardDescription>上传或粘贴支付通道的 API 开发文档</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.json,.html,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white text-black border-gray-300"
                  data-testid="button-upload-doc"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  上传文档
                </Button>
                {documentContent && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDocumentContent("");
                      toast({ title: "已清除", description: "文档内容已清除" });
                    }}
                    className="bg-white text-red-500 border-red-200 hover:bg-red-50"
                    data-testid="button-clear-doc"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    清除
                  </Button>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-black">文档内容</Label>
                <Textarea
                  placeholder="粘贴 API 开发文档内容到这里...

例如:
- 支付接口文档
- 回调通知说明
- 签名算法说明
- 错误码列表
- 示例代码"
                  value={documentContent}
                  onChange={(e) => setDocumentContent(e.target.value)}
                  className="bg-white border-gray-300 min-h-[300px] font-mono text-sm text-black"
                  data-testid="textarea-doc-content"
                />
              </div>
              
              {documentContent && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>文档已加载 ({documentContent.length} 字符)</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="code" className="mt-4">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Code className="h-5 w-5" />
                生成的代码
              </CardTitle>
              <CardDescription>AI 生成的通道接入代码，可以一键部署到服务器</CardDescription>
            </CardHeader>
            <CardContent>
              {generatedCode.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Code className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>还没有生成代码</p>
                  <p className="text-sm">与 AI 对话后，生成的代码将显示在这里</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Deploy All Button */}
                  <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                    <div className="text-sm text-gray-600">
                      共 {generatedCode.length} 个文件，
                      {generatedCode.filter(c => c.status === "success").length} 个已部署，
                      {generatedCode.filter(c => c.status === "pending" || c.status === "error").length} 个待部署
                    </div>
                    <Button
                      onClick={deployAllCode}
                      disabled={isDeployingAll || generatedCode.every(c => c.status === "success" || c.status === "running")}
                      className="bg-green-500 hover:bg-green-600 text-white"
                      data-testid="button-deploy-all"
                    >
                      {isDeployingAll ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          部署中...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          一键部署全部
                        </>
                      )}
                    </Button>
                  </div>
                  {generatedCode.map((codeItem) => (
                    <div key={codeItem.id} className="border rounded-lg overflow-hidden">
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-100 px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Code className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{codeItem.filename}</span>
                          <Badge
                            variant="outline"
                            className={
                              codeItem.status === "success"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : codeItem.status === "error"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : codeItem.status === "running"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-gray-50 text-gray-700 border-gray-200"
                            }
                          >
                            {codeItem.status === "success" && <CheckCircle className="h-3 w-3 mr-1" />}
                            {codeItem.status === "error" && <AlertCircle className="h-3 w-3 mr-1" />}
                            {codeItem.status === "running" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                            {codeItem.status === "pending"
                              ? "待部署"
                              : codeItem.status === "running"
                              ? "部署中"
                              : codeItem.status === "success"
                              ? "已部署"
                              : "部署失败"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyCode(codeItem.code)}
                            data-testid={`button-copy-code-${codeItem.id}`}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const blob = new Blob([codeItem.code], { type: "text/plain" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = codeItem.filename;
                              a.click();
                            }}
                            data-testid={`button-download-code-${codeItem.id}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCodeForTest(codeItem.id);
                              setActiveTab("test");
                            }}
                            className="text-purple-600 border-purple-200 hover:bg-purple-50"
                            data-testid={`button-test-code-${codeItem.id}`}
                          >
                            <TestTube className="h-4 w-4 mr-1" />
                            测试
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => deployCode(codeItem)}
                            disabled={codeItem.status === "running" || codeItem.status === "success"}
                            className="bg-green-500 hover:bg-green-600 text-white"
                            data-testid={`button-deploy-code-${codeItem.id}`}
                          >
                            {codeItem.status === "running" ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <Play className="h-4 w-4 mr-1" />
                            )}
                            部署
                          </Button>
                        </div>
                      </div>
                      <pre className="p-4 bg-gray-900 text-gray-100 overflow-x-auto text-sm max-h-[300px]">
                        <code>{codeItem.code}</code>
                      </pre>
                      {codeItem.logs && codeItem.logs.length > 0 && (
                        <div className="bg-gray-800 p-3 border-t border-gray-700">
                          <p className="text-xs text-gray-400 mb-2">部署日志:</p>
                          {codeItem.logs.map((log, index) => (
                            <p key={index} className="text-xs text-gray-300 font-mono">
                              {log}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="test" className="mt-4">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bug className="h-5 w-5" />
                调试测试
              </CardTitle>
              <CardDescription>模拟发起订单测试通道功能</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Test Order Section */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <TestTube className="h-4 w-4" />
                    模拟订单测试
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={testOrderType === "collect" ? "default" : "outline"}
                      onClick={() => setTestOrderType("collect")}
                      className={testOrderType === "collect" 
                        ? "bg-green-500 hover:bg-green-600 text-white" 
                        : "bg-white text-gray-700 border-gray-300"}
                      data-testid="button-test-collect"
                    >
                      测试代收
                    </Button>
                    <Button
                      size="sm"
                      variant={testOrderType === "payout" ? "default" : "outline"}
                      onClick={() => setTestOrderType("payout")}
                      className={testOrderType === "payout" 
                        ? "bg-blue-500 hover:bg-blue-600 text-white" 
                        : "bg-white text-gray-700 border-gray-300"}
                      data-testid="button-test-payout"
                    >
                      测试代付
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-600">订单金额</Label>
                    <Input
                      type="number"
                      value={testOrderAmount}
                      onChange={(e) => setTestOrderAmount(e.target.value)}
                      placeholder="100"
                      className="bg-white border-gray-300 text-black"
                      data-testid="input-test-amount"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-600">币种</Label>
                    <Select value={testOrderCurrency} onValueChange={setTestOrderCurrency}>
                      <SelectTrigger className="bg-white border-gray-300 text-black" data-testid="select-test-currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CNY">CNY - 人民币</SelectItem>
                        <SelectItem value="USD">USD - 美元</SelectItem>
                        <SelectItem value="VND">VND - 越南盾</SelectItem>
                        <SelectItem value="INR">INR - 印度卢比</SelectItem>
                        <SelectItem value="MMK">MMK - 缅甸元</SelectItem>
                        <SelectItem value="THB">THB - 泰铢</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-600">支付方式</Label>
                    <Select value={testOrderPaymentMethod} onValueChange={setTestOrderPaymentMethod}>
                      <SelectTrigger className="bg-white border-gray-300 text-black" data-testid="select-test-payment-method">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_card">银行卡</SelectItem>
                        <SelectItem value="alipay">支付宝</SelectItem>
                        <SelectItem value="wechat">微信支付</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="bank_transfer">银行转账</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {testOrderType === "payout" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-600">收款人姓名 *</Label>
                      <Input
                        value={testCustomerName}
                        onChange={(e) => setTestCustomerName(e.target.value)}
                        placeholder="张三"
                        className="bg-white border-gray-300 text-black"
                        data-testid="input-test-customer-name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-600">收款账号 *</Label>
                      <Input
                        value={testCustomerAccount}
                        onChange={(e) => setTestCustomerAccount(e.target.value)}
                        placeholder="6222021234567890123"
                        className="bg-white border-gray-300 text-black"
                        data-testid="input-test-customer-account"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-600">开户行</Label>
                      <Input
                        value={testBankName}
                        onChange={(e) => setTestBankName(e.target.value)}
                        placeholder="中国工商银行"
                        className="bg-white border-gray-300 text-black"
                        data-testid="input-test-bank-name"
                      />
                    </div>
                  </div>
                )}
                
                <Button
                  onClick={submitTestOrder}
                  disabled={isSubmittingTestOrder}
                  className={testOrderType === "collect" 
                    ? "w-full bg-green-500 hover:bg-green-600 text-white" 
                    : "w-full bg-blue-500 hover:bg-blue-600 text-white"}
                  data-testid="button-submit-test-order"
                >
                  {isSubmittingTestOrder ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      提交中...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      发起{testOrderType === "collect" ? "代收" : "代付"}测试
                    </>
                  )}
                </Button>
              </div>
              
              {/* Code Test Section - Only show if there's generated code */}
              {generatedCode.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    代码测试
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">选择代码文件</Label>
                      <Select
                        value={selectedCodeForTest}
                        onValueChange={setSelectedCodeForTest}
                      >
                        <SelectTrigger className="bg-white border-gray-300 text-black" data-testid="select-test-code">
                          <SelectValue placeholder="选择要测试的代码" />
                        </SelectTrigger>
                        <SelectContent>
                          {generatedCode.map((code) => (
                            <SelectItem key={code.id} value={code.id}>
                              <div className="flex items-center gap-2">
                                <Code className="h-4 w-4" />
                                {code.filename}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-end gap-2">
                      <Button
                        onClick={validateCode}
                        disabled={isTesting || !selectedCodeForTest}
                        variant="outline"
                        className="bg-white text-black border-gray-300"
                        data-testid="button-validate-code"
                      >
                        {isTesting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        语法验证
                      </Button>
                      <Button
                        onClick={runTest}
                        disabled={isTesting || !selectedCodeForTest}
                        className="bg-purple-500 hover:bg-purple-600 text-white"
                        data-testid="button-run-test"
                      >
                        {isTesting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        运行测试
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">测试参数 (JSON 格式)</Label>
                    <Textarea
                      placeholder='{"amount": 100, "orderId": "test001", ...}'
                      value={testInput}
                      onChange={(e) => setTestInput(e.target.value)}
                      className="bg-white border-gray-300 font-mono text-sm h-24 text-black"
                      data-testid="textarea-test-input"
                    />
                  </div>
                </div>
              )}
              
              {/* Test Logs Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-black flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    测试日志
                  </Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setTestResults([])}
                    className="text-gray-500 h-6 px-2"
                    data-testid="button-clear-test-logs"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    清空
                  </Button>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 min-h-[200px] max-h-[300px] overflow-y-auto">
                  {testResults.length === 0 ? (
                    <div className="text-gray-500 text-sm text-center py-8">
                      <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>等待测试执行...</p>
                    </div>
                  ) : (
                    <div className="space-y-1 font-mono text-sm">
                      {testResults.map((result) => (
                        <div
                          key={result.id}
                          className={`flex items-start gap-2 ${
                            result.type === "error"
                              ? "text-red-400"
                              : result.type === "success"
                              ? "text-green-400"
                              : result.type === "warning"
                              ? "text-yellow-400"
                              : "text-gray-400"
                          }`}
                        >
                          <span className="text-gray-600 flex-shrink-0">
                            [{result.timestamp.toLocaleTimeString()}]
                          </span>
                          <div className="flex-1">
                            <span>{result.message}</span>
                            {result.details && (
                              <pre className="mt-1 text-xs text-gray-500 whitespace-pre-wrap">
                                {result.details}
                              </pre>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={testLogsEndRef} />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 生成接口 Tab */}
        <TabsContent value="interfaces" className="mt-4">
          <Card className="bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-black flex items-center gap-2">
                    <Link2 className="h-5 w-5" />
                    已生成的接口
                  </CardTitle>
                  <CardDescription className="mt-1">
                    通过AI生成的支付接口，接口ID用于在"API接口管理"中配置支付通道映射
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowInterfaceDialog(true)}
                  className="bg-black text-white hover:bg-gray-800"
                  data-testid="button-generate-interface"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  生成新接口
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* 步骤提示 */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">第二步：生成支付接口</span>
                </div>
                <p className="text-sm text-blue-600 mt-1 ml-7">
                  在这里生成新的支付接口ID。生成后请前往"API接口管理"配置接口的支付通道映射关系。
                </p>
              </div>
              
              {generatedInterfaces.length === 0 ? (
                <div className="text-center py-12">
                  <Link2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">暂无生成的接口</p>
                  <p className="text-sm text-gray-400 mt-2">点击上方按钮生成新接口</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {generatedInterfaces.map((iface) => (
                    <Card key={iface.id} className="border border-gray-200" data-testid={`interface-card-${iface.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Link2 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{iface.name}</span>
                                <Badge variant="outline" className="text-xs">{iface.code}</Badge>
                                <Badge className={
                                  iface.status === "active" 
                                    ? "bg-green-100 text-green-700" 
                                    : iface.status === "pending"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-500"
                                }>
                                  {iface.status === "active" ? "已启用" : iface.status === "pending" ? "待配置" : "已禁用"}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                接口ID: <code className="bg-gray-100 px-1 rounded">{iface.id}</code>
                                <span className="mx-2">|</span>
                                创建时间: {iface.createdAt.toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(iface.id);
                                toast({ title: "已复制", description: `接口ID ${iface.id} 已复制到剪贴板` });
                              }}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              复制ID
                            </Button>
                          </div>
                        </div>
                        
                        {/* 支付通道列表 */}
                        <div className="mt-4 border-t pt-3">
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            接口提供的支付通道 ({iface.channels.length})
                          </div>
                          <div className="space-y-2">
                            {iface.channels.map((channel) => (
                              <div 
                                key={channel.id} 
                                className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <Code className="h-4 w-4 text-gray-400" />
                                  <span className="font-mono text-gray-600">{channel.channelCode}</span>
                                  <span className="text-gray-400">-</span>
                                  <span className="text-gray-800">{channel.channelName}</span>
                                  <Badge variant="outline" className="text-xs">{channel.currency}</Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  {channel.mappedPaymentMethod ? (
                                    <Badge className="bg-green-100 text-green-700 text-xs">
                                      已映射: {channel.mappedPaymentMethod}
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-orange-100 text-orange-700 text-xs">
                                      待配置
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            请前往"API接口管理"为未配置的通道设置对应的支付方式
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* 生成接口对话框 */}
      <Dialog open={showInterfaceDialog} onOpenChange={setShowInterfaceDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900">生成新接口</DialogTitle>
            <DialogDescription>
              输入接口信息，系统将自动生成接口ID和模拟支付通道
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800 font-medium">接口ID将自动生成</span>
              </div>
            </div>
            <div>
              <Label htmlFor="interfaceName" className="text-gray-700">接口名称 <span className="text-red-500">*</span></Label>
              <Input
                id="interfaceName"
                value={newInterfaceName}
                onChange={(e) => setNewInterfaceName(e.target.value)}
                placeholder="例如: 支付宝代收接口"
                className="mt-1 bg-white text-black"
                data-testid="input-new-interface-name"
              />
            </div>
            <div>
              <Label htmlFor="interfaceCode" className="text-gray-700">接口代码 <span className="text-red-500">*</span></Label>
              <Input
                id="interfaceCode"
                value={newInterfaceCode}
                onChange={(e) => setNewInterfaceCode(e.target.value.toUpperCase())}
                placeholder="例如: ALIPAY_COLLECT"
                className="mt-1 bg-white text-black"
                data-testid="input-new-interface-code"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              className="bg-white border-gray-300 text-gray-900"
              onClick={() => {
                setShowInterfaceDialog(false);
                setNewInterfaceName("");
                setNewInterfaceCode("");
              }}
            >
              取消
            </Button>
            <Button 
              className="bg-black text-white hover:bg-gray-800"
              onClick={generateInterface}
              data-testid="button-submit-interface"
            >
              生成接口
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
