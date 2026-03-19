import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, 
  Shield, 
  CreditCard, 
  FileCode, 
  Clock, 
  BarChart3, 
  Server, 
  Database,
  Zap,
  ArrowRight,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CountryFlagGroup from "@/components/CountryFlags";
import Squares from "@/components/Squares/Squares";

export default function PaymentPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  // 支付功能
  const paymentFeatures = [
    {
      id: 1,
      title: "全球支付覆盖",
      description: "支持超过50个国家和地区的支付通道，满足全球业务扩张需求",
      icon: <Globe className="h-10 w-10 text-blue-500" />,
      color: "border-blue-500/20 bg-blue-500/5"
    },
    {
      id: 2,
      title: "高效结算系统",
      description: "T+1快速结算到您的账户，多币种支持，更灵活的资金管理",
      icon: <Clock className="h-10 w-10 text-emerald-500" />,
      color: "border-emerald-500/20 bg-emerald-500/5"
    },
    {
      id: 3,
      title: "开发者友好",
      description: "提供完善的API文档和多语言SDK，简化集成流程",
      icon: <FileCode className="h-10 w-10 text-purple-500" />,
      color: "border-purple-500/20 bg-purple-500/5"
    },
    {
      id: 4,
      title: "实时数据分析",
      description: "全方位交易数据追踪和可视化分析，优化业务决策",
      icon: <BarChart3 className="h-10 w-10 text-amber-500" />,
      color: "border-amber-500/20 bg-amber-500/5"
    },
    {
      id: 5,
      title: "银行级安全",
      description: "采用先进加密技术和多层风控系统，保障交易安全",
      icon: <Shield className="h-10 w-10 text-red-500" />,
      color: "border-red-500/20 bg-red-500/5"
    },
    {
      id: 6,
      title: "高并发处理",
      description: "系统每秒可处理10万订单，保障大促期间的稳定运行",
      icon: <Zap className="h-10 w-10 text-yellow-500" />,
      color: "border-yellow-500/20 bg-yellow-500/5"
    },
    {
      id: 7,
      title: "多场景适配",
      description: "电商、教育、SaaS等多场景支付解决方案，覆盖不同业务需求",
      icon: <CreditCard className="h-10 w-10 text-teal-500" />,
      color: "border-teal-500/20 bg-teal-500/5"
    },
    {
      id: 8,
      title: "分布式架构",
      description: "基于JAVA+React技术栈的企业级分布式架构，高可用性保障",
      icon: <Server className="h-10 w-10 text-indigo-500" />,
      color: "border-indigo-500/20 bg-indigo-500/5"
    }
  ];
  

  
  // 核心技术指标
  const techSpecs = [
    { label: "系统架构", value: "JAVA + React" },
    { label: "支付通道", value: "50+" },
    { label: "并发能力", value: "10万订单/秒" },
    { label: "系统可用性", value: "99.99%" },
    { label: "结算周期", value: "T+1" },
    { label: "覆盖国家", value: "全球50+" },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      
      {/* 顶部彩带 */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"></div>
      
      {/* 顶部Banner */}
      <div className="relative overflow-hidden bg-slate-800 mt-20">
        {/* Squares方块动画背景 */}
        <div className="absolute inset-0 w-full h-full">
          <Squares 
            speed={0.5}
            squareSize={40}
            direction="diagonal"
            borderColor="#012d28"
            hoverFillColor="#222"
          />
        </div>
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Badge className="mb-4 bg-blue-500/20 text-blue-200 hover:bg-blue-500/30 transition-colors duration-200">
                  企业级支付系统
                </Badge>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400">
                    稳定且高效的全球支付系统
                  </span>
                </h1>
                <p className="text-gray-300 text-lg mb-6 max-w-xl">
                  基于JAVA+React架构，支持每秒10万订单并发，已集成50+国家通道
                </p>
                
                <div className="flex flex-wrap gap-4 mb-6">
                  <Button 
                    className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 border-0 text-white py-6 px-8 text-base relative group overflow-hidden"
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-600/0 via-white/10 to-emerald-600/0 transform -translate-x-full group-hover:translate-x-full transition-all duration-700"></span>
                    <span className="relative z-10 flex items-center">
                      申请商户账号 <ArrowRight className="ml-2 h-5 w-5" />
                    </span>
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-gray-500 text-gray-300 hover:bg-gray-800 py-6 px-8 text-base"
                  >
                    API文档
                  </Button>
                </div>
                
                <div>
                  <CountryFlagGroup />
                </div>
              </motion.div>
            </div>
            
            <div className="hidden lg:block">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 rounded-2xl blur opacity-30"></div>
                <div className="relative z-10 bg-slate-900/70 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-slate-800">
                  <h3 className="text-xl font-semibold text-white mb-6">核心技术参数</h3>
                  <div className="grid grid-cols-2 gap-6">
                    {techSpecs.map((spec, index) => (
                      <div key={index} className="flex flex-col">
                        <span className="text-gray-400 text-sm mb-1">{spec.label}</span>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-400">
                          {spec.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-slate-700">
                    <div className="flex items-center text-gray-300">
                      <Shield className="h-5 w-5 text-green-500 mr-2" />
                      金融级安全架构，全链路加密
                    </div>
                    <div className="flex items-center text-gray-300 mt-2">
                      <Database className="h-5 w-5 text-blue-500 mr-2" />
                      多地多中心部署，灾备无缝切换
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 功能特性区域 */}
      <div className="container mx-auto px-4 py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4 text-white">强大的支付功能</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              BeingFi提供企业级支付系统，覆盖全球市场，助力业务增长
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {paymentFeatures.map((feature) => (
              <motion.div
                key={feature.id}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Card className={`border ${feature.color} backdrop-blur-sm bg-slate-800/90 hover:shadow-lg transition-all h-full`}>
                  <CardHeader className="pb-2">
                    <div className="bg-slate-900/60 p-3 inline-block rounded-lg mb-4">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl text-white">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* API集成部分 */}
        <div className="mt-20">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-3xl font-bold text-white mb-4">简单易用的<br />开发者工具</h2>
                <p className="text-gray-300 mb-6">
                  提供完善的API文档和开发工具包，支持多种语言，简化集成流程，加速业务上线
                </p>
                
                <div className="space-y-4">
                  {[
                    "丰富的SDK支持（Java、PHP、Node.js等）",
                    "详尽的API文档和示例代码",
                    "沙箱环境测试支持",
                    "插件化模块设计，灵活配置"
                  ].map((item, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mr-3 text-emerald-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8">
                  <Button className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700">
                    查看开发文档
                  </Button>
                </div>
              </motion.div>
            </div>
            
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="bg-slate-800 rounded-xl p-1 border border-slate-700">
                  <div className="flex items-center px-4 py-2 border-b border-slate-700">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="mx-auto text-gray-400 text-sm">API接口示例</div>
                  </div>
                  <div className="bg-slate-900 rounded-b-lg p-4 font-mono text-sm">
                    <pre className="text-gray-300 whitespace-pre-wrap"><code>{`// 创建支付订单
const createOrder = async () => {
  const response = await bepay.createOrder({
    amount: 299.99,           // 交易金额
    currency: "USD",          // 货币类型
    merchantOrderId: "ORD123", // 商户订单号
    description: "Premium Plan Subscription",
    returnUrl: "https://example.com/success",
    notifyUrl: "https://example.com/webhook",
    paymentMethod: "card",    // 支付方式
  });

  if (response.success) {
    // 重定向到支付页面
    window.location.href = response.paymentUrl;
  }
};

// 使用SDK验证支付回调
const verifyCallback = (req) => {
  const isValid = bepay.verifyCallback({
    requestBody: req.body,
    signature: req.headers['bepay-signature']
  });
  
  if (isValid) {
    // 更新订单状态
    updateOrderStatus(req.body.merchantOrderId, req.body.status);
  }
};`}</code></pre>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* 集成步骤部分 */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">三步完成支付集成</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              快速接入BeingFi支付系统，为您的业务提供全球支付能力
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: 1,
                title: "创建商户账号",
                description: "注册并完成商户认证，获取商户ID和密钥",
                icon: <CreditCard className="h-12 w-12 text-blue-500" />,
                color: "border-blue-500/20 bg-blue-500/5"
              },
              {
                step: 2,
                title: "接入支付API",
                description: "集成我们的SDK或直接调用REST API接口",
                icon: <FileCode className="h-12 w-12 text-purple-500" />,
                color: "border-purple-500/20 bg-purple-500/5"
              },
              {
                step: 3,
                title: "开始收款",
                description: "完成测试后，切换到生产环境开始全球收款",
                icon: <Globe className="h-12 w-12 text-emerald-500" />,
                color: "border-emerald-500/20 bg-emerald-500/5"
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className={`border ${step.color} backdrop-blur-sm bg-slate-800/90 relative overflow-hidden h-full`}>
                  <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-slate-700/80 flex items-center justify-center text-xl font-bold text-white">
                    {step.step}
                  </div>
                  <CardHeader>
                    <div className="bg-slate-900/60 p-4 inline-block rounded-lg mb-6">
                      {step.icon}
                    </div>
                    <CardTitle className="text-xl text-white">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">{step.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* CTA部分 */}
      <div className="container mx-auto px-4 mt-4">
        <div className="relative overflow-hidden rounded-2xl bg-slate-800 border border-slate-700">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-emerald-600/10 opacity-70"></div>
          
          <div className="relative z-10 py-8 px-6 md:px-16 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">准备好开始使用BeingFi支付系统了吗?</h3>
              <p className="text-gray-300">立即申请商户账号，畅享全球支付能力</p>
            </div>
            <div className="flex flex-wrap gap-4 shrink-0">
              <Button 
                className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white"
              >
                申请商户账号
              </Button>
              <Button 
                variant="outline"
                className="border-gray-500 text-gray-300 hover:bg-slate-700"
              >
                查看API文档
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 页脚 */}
      <Footer />
    </div>
  );
}