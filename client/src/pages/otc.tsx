import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  Zap, 
  BarChart3, 
  Shield, 
  User, 
  Code, 
  CreditCard, 
  RefreshCw, 
  Lock,
  ArrowRight,
  Globe, 
  Clock,
  Settings
} from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import CountryFlagGroup from "@/components/CountryFlags";
import BrandLogos from "@/components/BrandLogos";
import OtcIsometric from "@/components/OtcIsometric";

export default function OtcPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  
  // 跳转到OTC后台
  const goToDashboard = () => {
    if (user) {
      navigate("/otc-dashboard");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-dark text-white">
      <Header />
      
      {/* 顶部彩带 - 与首页保持一致的风格 */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"></div>
      
      {/* 英雄区域 - 采用与首页相似的布局 */}
      <section className="pt-36 pb-28 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-accent/10 to-transparent -z-10 opacity-40"></div>
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-accent/20 rounded-full blur-3xl -z-10"></div>
        
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              className="order-2 lg:order-1" 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold font-poppins leading-tight mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="gradient-text">BeingFi</span> OTC跑分系统
              </motion.h1>
              
              <motion.p 
                className="text-gray-400 text-lg mb-8 max-w-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                快速、稳定、安全的三方跑分系统，为您的业务提供专业的跨境支付解决方案，全天候技术支持，7×24小时在线服务。
              </motion.p>
              
              <motion.div 
                className="flex flex-wrap gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <button 
                  onClick={goToDashboard} 
                  className="px-8 py-3 gradient-btn rounded-md inline-flex items-center"
                >
                  立即开通 <ArrowRight className="ml-2 h-4 w-4" />
                </button>
                <a href="#features" className="px-8 py-3 border border-gray-700 hover:border-accent/60 hover:bg-accent/10 rounded-md transition-all duration-300 inline-flex items-center">
                  查看功能
                </a>
              </motion.div>
              
              <motion.div 
                className="mt-12 flex items-center gap-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <div className="text-center">
                  <div className="text-3xl font-bold gradient-text">100+</div>
                  <div className="text-gray-500 text-sm mt-1">合作商户</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold gradient-text">99.9%</div>
                  <div className="text-gray-500 text-sm mt-1">系统稳定性</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold gradient-text">24/7</div>
                  <div className="text-gray-500 text-sm mt-1">全天候客服</div>
                </div>
              </motion.div>
            </motion.div>
            
            {/* 右侧展示内容 */}
            <motion.div 
              className="order-1 lg:order-2 relative"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative flex items-center justify-center w-full">
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-accentRed/20 rounded-full blur-3xl -z-10"></div>
                
                {/* OTC系统管理界面等轴测图 */}
                <div className="relative w-full max-w-[100%] lg:max-w-[100%] mx-auto">
                  <div className="w-full md:h-[450px] lg:h-[500px] xl:h-[550px] relative border border-gray-800/40 bg-darkSecondary/50 rounded-xl p-4 overflow-hidden">
                    <OtcIsometric className="mx-auto" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 核心功能卡片 */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            id="features"
          >
            <div className="bg-darkSecondary p-7 rounded-xl border border-gray-800 shadow-lg">
              <div className="w-14 h-14 bg-accent/20 text-accent rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">多币种支持</h3>
              <p className="text-gray-400">
                支持USDT、BTC、ETH等主流数字货币，满足您多样化的支付需求
              </p>
            </div>
            
            <div className="bg-darkSecondary p-7 rounded-xl border border-gray-800 shadow-lg">
              <div className="w-14 h-14 bg-accent/20 text-accent rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">数据分析</h3>
              <p className="text-gray-400">
                全面的交易数据统计与分析，帮助您实时掌握业务动态与市场趋势
              </p>
            </div>
            
            <div className="bg-darkSecondary p-7 rounded-xl border border-gray-800 shadow-lg">
              <div className="w-14 h-14 bg-accent/20 text-accent rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">安全防护</h3>
              <p className="text-gray-400">
                多重安全认证体系，全方位数据加密，保障交易安全和资金安全
              </p>
            </div>
            
            <div className="bg-darkSecondary p-7 rounded-xl border border-gray-800 shadow-lg">
              <div className="w-14 h-14 bg-accent/20 text-accent rounded-lg flex items-center justify-center mb-4">
                <User className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">多角色管理</h3>
              <p className="text-gray-400">
                支持多级供应商管理，账户分级与权限控制，满足复杂业务场景需求
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 优势特性 - 与首页风格保持一致 */}
      <section className="py-20 bg-darkSecondary">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">为什么选择我们的 <span className="gradient-text">OTC系统</span></h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              安全可靠的交易环境，专业的技术支持团队，丰富的业务功能，助您轻松开展跨境支付业务
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              className="bg-dark rounded-xl p-8 border border-gray-800/50"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                <Code className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">灵活的API接口</h3>
              <p className="text-gray-400">
                标准化的API接口文档，简单易用的集成方式，快速对接您的业务系统，实现无缝衔接
              </p>
            </motion.div>
            
            <motion.div
              className="bg-dark rounded-xl p-8 border border-gray-800/50"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                <CreditCard className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">多种支付渠道</h3>
              <p className="text-gray-400">
                支持多种主流支付方式，覆盖全球100+国家和地区，满足不同客户的支付偏好
              </p>
            </motion.div>
            
            <motion.div
              className="bg-dark rounded-xl p-8 border border-gray-800/50"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                <Lock className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">风险控制系统</h3>
              <p className="text-gray-400">
                先进的风控算法，实时交易监控，多重审核机制，有效防范交易风险和欺诈行为
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 统计数据 */}
      <section className="py-16 bg-dark">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6">
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="text-4xl font-bold gradient-text">99.9%</div>
              <div className="text-gray-400 mt-2">系统稳定性</div>
            </motion.div>
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="text-4xl font-bold gradient-text">100+</div>
              <div className="text-gray-400 mt-2">支持国家/地区</div>
            </motion.div>
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <div className="text-4xl font-bold gradient-text">24/7</div>
              <div className="text-gray-400 mt-2">全天候客服</div>
            </motion.div>
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <div className="text-4xl font-bold gradient-text">10+</div>
              <div className="text-gray-400 mt-2">加密货币支持</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 底部号召行动 */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-blue-500/5"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              准备好开启OTC跑分之旅了吗？
            </h2>
            <p className="text-gray-400 mb-10 text-lg">
              立即注册BeingFi OTC跑分系统，体验高效、安全、便捷的全球支付解决方案，助力您的业务快速增长
            </p>
            <button 
              onClick={goToDashboard}
              className="px-8 py-4 gradient-btn rounded-md inline-flex items-center text-lg"
            >
              立即开通 <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}