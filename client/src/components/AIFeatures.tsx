import { motion } from 'framer-motion';
import { aiFeatures } from '@/lib/data';
import { Code, Languages, FileSearch, Sparkles, ShieldCheck } from 'lucide-react';

export default function AIFeatures() {
  // 图标映射
  const iconMap: Record<string, React.ReactNode> = {
    'Code': <Code className="w-6 h-6" />,
    'Languages': <Languages className="w-6 h-6" />,
    'FileSearch': <FileSearch className="w-6 h-6" />,
    'Sparkles': <Sparkles className="w-6 h-6" />,
    'ShieldCheck': <ShieldCheck className="w-6 h-6" />
  };

  return (
    <section id="features" className="py-24 relative">
      
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative z-10">
              <img 
                src="https://source.unsplash.com/random/800x600/?ai,code,technology" 
                alt="AI Code Generation" 
                className="w-full h-auto rounded-xl shadow-2xl shadow-accent/10 object-cover" 
              />
            </div>
            
            <motion.div 
              className="absolute -top-6 -left-6 transform -rotate-6 bg-darkSecondary p-4 rounded-lg shadow-lg w-48 z-20 animate-float"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-dark">
                  <Code className="w-5 h-5" />
                </div>
                <div className="ml-3">
                  <div className="text-xs text-gray-400">由顶尖AI驱动</div>
                  <div className="font-medium">DeepSeek-Coder</div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="absolute -bottom-6 -right-6 bg-darkSecondary p-4 rounded-lg shadow-lg z-20 animate-float"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              style={{ animationDelay: '0.7s' }}
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">90%</div>
                <div className="text-xs text-gray-400">开发时间节省</div>
              </div>
            </motion.div>
            
            <div className="absolute -bottom-4 left-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl -z-10"></div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6">
              <h2 className="text-3xl md:text-4xl font-bold font-poppins mb-6 relative inline-block">
                AI驱动的支付集成
                <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-accent rounded-full"></span>
              </h2>
              <p className="text-gray-400 mb-6">Pay+ 利用强大的 DeepSeek-Coder AI模型自动生成支付API集成代码，让您无需深入了解每种支付API的复杂细节。</p>
              <p className="text-gray-400 mb-6">只需上传API文档，与AI进行简单的交互，就能获得符合您需求的高质量集成代码，大幅提高开发效率，降低开发成本。</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {aiFeatures.map((feature, index) => (
                <motion.div 
                  key={feature.id}
                  className="bg-gray-900 p-5 rounded-lg"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                >
                  <div className="w-12 h-12 bg-accent/20 text-accent rounded-lg flex items-center justify-center mb-4">
                    {iconMap[feature.icon]}
                  </div>
                  <h3 className="text-xl font-bold font-poppins mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
            
            <a href="#payment-apis" className="px-8 py-3 bg-accent hover:bg-accent/90 text-black font-medium rounded-md transition-all duration-300 inline-flex items-center">
              浏览支持的API <i className="fas fa-arrow-right ml-2"></i>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}