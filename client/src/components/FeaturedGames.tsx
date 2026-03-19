import { useRef } from 'react';
import { motion } from 'framer-motion';
import { paymentApis } from '@/lib/data';
import { Link } from 'wouter';
import { Code, ExternalLink } from 'lucide-react';

export default function PaymentAPIs() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      const left = direction === 'left' 
        ? scrollContainerRef.current.scrollLeft - scrollAmount 
        : scrollContainerRef.current.scrollLeft + scrollAmount;
        
      scrollContainerRef.current.scrollTo({
        left,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section id="payment-apis" className="py-20 bg-darkSecondary relative">
      <div className="absolute top-0 right-0 w-full h-24 bg-gradient-to-b from-dark to-transparent -z-10"></div>
      <div className="absolute -top-40 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10"></div>
      
      <div className="container mx-auto px-4">
        <motion.div 
          className="flex justify-between items-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-bold font-poppins relative inline-block">
              支持的支付API
              <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-accent rounded-full"></span>
            </h2>
            <p className="text-gray-400 mt-4 max-w-2xl">通过我们的AI自动集成功能，轻松接入各种流行的支付API，节省开发时间和成本。</p>
          </div>
          
          <div className="hidden md:flex gap-2">
            <button 
              onClick={() => scroll('left')} 
              className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center hover:border-accent hover:text-accent transition-all"
              aria-label="Previous API"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
            <button 
              onClick={() => scroll('right')} 
              className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center hover:border-accent hover:text-accent transition-all"
              aria-label="Next API"
            >
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </motion.div>
        
        <div className="relative">
          <div 
            ref={scrollContainerRef}
            className="scroll-container flex gap-6 overflow-x-auto pb-6 snap-x"
          >
            {paymentApis.map((api, index) => (
              <motion.div 
                key={api.id}
                className="game-card snap-start min-w-[280px] sm:min-w-[320px] lg:min-w-[380px] bg-gray-900 rounded-xl overflow-hidden shadow-lg shadow-black/30 transition-all duration-300 hover:shadow-accent/20 hover:-translate-y-2 group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="relative">
                  <img 
                    src={api.logo} 
                    alt={`${api.name} API`} 
                    className="w-full h-48 object-cover"
                  />
                  <div className="game-overlay absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent opacity-0 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <div className="flex justify-between items-center">
                      <Link href="/new-integration">
                        <a className="px-4 py-2 bg-accent text-black rounded font-medium flex items-center gap-2">
                          <Code size={16} />
                          <span>集成此API</span>
                        </a>
                      </Link>
                      <a 
                        href={api.documentationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-gray-800/70 rounded-full flex items-center justify-center"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>
                  {!api.isIntegrated && (
                    <div className="absolute top-3 right-3 bg-accent text-black text-xs font-bold px-2 py-1 rounded">即将推出</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-bold font-poppins">{api.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">{api.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      {api.isIntegrated ? (
                        <span className="text-green-400 flex items-center gap-1">
                          <i className="fas fa-check-circle"></i> 已支持集成
                        </span>
                      ) : (
                        <span className="text-yellow-400 flex items-center gap-1">
                          <i className="fas fa-clock"></i> 即将支持
                        </span>
                      )}
                    </div>
                    <a 
                      href={api.documentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent text-xs hover:underline"
                    >
                      查看文档
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-8 flex justify-center md:hidden gap-2">
            <button 
              onClick={() => scroll('left')} 
              className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center hover:border-accent hover:text-accent transition-all"
              aria-label="Previous API (mobile)"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
            <button 
              onClick={() => scroll('right')} 
              className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center hover:border-accent hover:text-accent transition-all"
              aria-label="Next API (mobile)"
            >
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
