import { motion } from "framer-motion";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PartnersSection from "@/components/PartnersSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import Squares from "@/components/Squares/Squares";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Globe, 
  Shield, 
  CreditCard, 
  Server, 
  Zap,
  ArrowRight,
  Brain,
  Layers,
  Settings,
  FileCode,
} from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  
  const paymentFeatures = [
    {
      id: 1,
      title: "免费四方系统",
      subtitle: "零手续费四方系统，月费仅500U",
      description: "完全免费的四方支付系统，仅收取基础服务器费用，上游通道接入超时即免接入费。",
      icon: <CreditCard className="h-10 w-10 text-emerald-500" />,
      color: "border-emerald-500/20 bg-emerald-500/5"
    },
    {
      id: 2,
      title: "AI三方系统",
      subtitle: "AI驱动的智能三方系统，全球自动回调",
      description: "基于最新AI技术的三方支付系统，实现全球范围内的智能自动回调定制。",
      icon: <Brain className="h-10 w-10 text-purple-500" />,
      color: "border-purple-500/20 bg-purple-500/5"
    },
    {
      id: 3,
      title: "技术架构优势",
      subtitle: "交易所级别技术架构，三种接入方式",
      description: "采用金融级高并发系统设计，提供全方位的技术接入方案。",
      icon: <Layers className="h-10 w-10 text-blue-500" />,
      color: "border-blue-500/20 bg-blue-500/5"
    },
    {
      id: 4,
      title: "智能管理后台",
      subtitle: "全平台智能后台，全球运营无忧",
      description: "功能强大的多平台管理后台，支持全球化业务运营。",
      icon: <Settings className="h-10 w-10 text-amber-500" />,
      color: "border-amber-500/20 bg-amber-500/5"
    }
  ];
  
  return (
    <div className="min-h-screen text-white overflow-x-hidden relative">
      {/* Squares方块动画背景 */}
      <div className="fixed inset-0 w-full h-full z-0">
        <Squares 
          speed={0.5}
          squareSize={40}
          direction="diagonal"
          borderColor="#012d28"
          hoverFillColor="#064e3b"
        />
      </div>
      
      {/* 页面内容 */}
      <div className="relative z-10">
        <Header />
        
        {/* 顶部彩带 */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"></div>
        
        <HeroSection />
        
        {/* 功能特性区域 */}
        <section className="container mx-auto px-4 py-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4 text-white">强大的支付功能</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                BeingFi提供企业级支付系统，覆盖全球市场，助力业务增长
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paymentFeatures.map((feature) => (
                <motion.div
                  key={feature.id}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className={`border ${feature.color} backdrop-blur-sm bg-black/40 hover:shadow-lg transition-all h-full`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start gap-4">
                        <div className="bg-black/40 p-3 rounded-lg shrink-0">
                          {feature.icon}
                        </div>
                        <div>
                          <p className="text-sm text-emerald-400 mb-1">{feature.title}</p>
                          <CardTitle className="text-xl text-white">{feature.subtitle}</CardTitle>
                        </div>
                      </div>
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
                  <div className="bg-black/40 backdrop-blur-sm rounded-xl p-1 border border-slate-700">
                    <div className="flex items-center px-4 py-2 border-b border-slate-700">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      </div>
                      <div className="mx-auto text-gray-400 text-sm">API接口示例</div>
                    </div>
                    <div className="bg-black/60 rounded-b-lg p-4 font-mono text-sm">
                      <pre className="text-gray-300 whitespace-pre-wrap"><code>{`// 创建支付订单
const response = await beingfi.createOrder({
  amount: 299.99,
  currency: "USD",
  merchantOrderId: "ORD123",
  description: "Premium Plan",
  returnUrl: "https://example.com/success",
  paymentMethod: "card",
});

if (response.success) {
  // 重定向到支付页面
  window.location.href = response.paymentUrl;
}

// 验证支付回调
const isValid = beingfi.verifyCallback({
  signature: req.headers['beingfi-signature']
});`}</code></pre>
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
                  <Card className={`border ${step.color} backdrop-blur-sm bg-black/40 relative overflow-hidden h-full`}>
                    <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-black/40 flex items-center justify-center text-xl font-bold text-white">
                      {step.step}
                    </div>
                    <CardHeader>
                      <div className="bg-black/40 p-4 inline-block rounded-lg mb-6">
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
        </section>
        
        {/* CTA部分 */}
        <section className="container mx-auto px-4 mt-4 mb-16">
          <div className="relative overflow-hidden rounded-2xl bg-black/40 backdrop-blur-sm border border-slate-700">
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
                  申请商户账号 <ArrowRight className="ml-2 h-4 w-4" />
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
        </section>
        
        <PartnersSection />
        <ContactSection />
        <Footer />
      </div>
    </div>
  );
}
