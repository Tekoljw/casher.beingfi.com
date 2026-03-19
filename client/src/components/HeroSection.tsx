import { motion } from 'framer-motion';
import { CreditCard, Brain, Layers, Settings } from 'lucide-react';
import { useLocation } from 'wouter';
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import GradientText from './GradientText';
import { Code } from 'lucide-react';

export default function HeroSection() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [location, navigate] = useLocation();

  return (
    <section className="pt-36 pb-28 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center min-h-[400px]">
          <div>
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <GradientText
                colors={["#29ffbf", "#FF9FFC", "#a3eff0", "#29ffbf"]}
                animationSpeed={3}
                showBorder={false}
                className="text-4xl md:text-5xl lg:text-6xl font-bold font-poppins leading-tight"
              >
                全球支付解决方案专家
              </GradientText>
            </motion.div>
            
            <motion.p 
              className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              提供高效、稳定、经济的全球支付通道，系统包网服务和跑分进驻合作，助力您的业务全球化扩展
            </motion.p>
            
            <motion.div 
              className="flex flex-wrap justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <button 
                onClick={() => navigate("/auth")} 
                className="px-8 py-3 gradient-btn rounded-md inline-flex items-center"
              >
                立即登录
                <i className="fas fa-arrow-right ml-2"></i>
              </button>
              <a 
                href="#" 
                className="px-8 py-3 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 rounded-md transition-all duration-300 inline-flex items-center"
              >
                API文档
                <Code className="ml-2 h-4 w-4" />
              </a>
            </motion.div>
            
            <motion.div 
              className="mt-12 flex items-center justify-center gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="text-center">
                <div className="text-3xl font-bold gradient-text">50+</div>
                <div className="text-white text-sm mt-1">全球币种</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold gradient-text">100K+</div>
                <div className="text-white text-sm mt-1">每秒并发</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold gradient-text">30+</div>
                <div className="text-white text-sm mt-1">全球语言</div>
              </div>
            </motion.div>
          </div>
          
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-24"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <motion.div 
            className="group relative bg-[#0a1a18]/80 backdrop-blur-sm p-6 rounded-xl border border-emerald-900/40 hover:border-emerald-500/50 transition-all duration-500"
            whileHover={{ y: -4 }}
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-lg flex items-center justify-center mb-5 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                <CreditCard className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">手续费优势</h3>
              <p className="text-gray-400 text-sm leading-relaxed">月费用小于1000U按%收费，月费用高于1000U封顶</p>
            </div>
          </motion.div>
          
          <motion.div 
            className="group relative bg-[#0f0a1a]/80 backdrop-blur-sm p-6 rounded-xl border border-purple-900/40 hover:border-purple-500/50 transition-all duration-500"
            whileHover={{ y: -4 }}
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-lg flex items-center justify-center mb-5 border border-purple-500/30 shadow-lg shadow-purple-500/10">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">全球自动回调</h3>
              <p className="text-gray-400 text-sm leading-relaxed">基于最新AI技术的三方支付系统，实现全球支付的智能自动回调</p>
            </div>
          </motion.div>
          
          <motion.div 
            className="group relative bg-[#0a1218]/80 backdrop-blur-sm p-6 rounded-xl border border-cyan-900/40 hover:border-cyan-500/50 transition-all duration-500"
            whileHover={{ y: -4 }}
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 rounded-lg flex items-center justify-center mb-5 border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
                <Layers className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">技术架构优势</h3>
              <p className="text-gray-400 text-sm leading-relaxed">交易所级别高并发技术架构，支持千亿级订单并发</p>
            </div>
          </motion.div>
          
          <motion.div 
            className="group relative bg-[#1a120a]/80 backdrop-blur-sm p-6 rounded-xl border border-amber-900/40 hover:border-amber-500/50 transition-all duration-500"
            whileHover={{ y: -4 }}
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-lg flex items-center justify-center mb-5 border border-amber-500/30 shadow-lg shadow-amber-500/10">
                <Settings className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">智能管理后台</h3>
              <p className="text-gray-400 text-sm leading-relaxed">支持30+全球语言/50+全球币种，强大的后台管理</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
