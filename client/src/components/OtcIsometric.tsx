import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface OtcIsometricProps {
  className?: string;
}

export default function OtcIsometric({ className = '' }: OtcIsometricProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full ${className}`}
    >
      {/* 主图像 */}
      <motion.div
        className="relative w-full h-full flex items-center justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <img 
          src="/otc-isometric.png" 
          alt="OTC系统管理界面" 
          className="w-auto h-full max-h-[500px] object-contain drop-shadow-xl z-10 scale-125"
        />
        
        {/* 浮动粒子和装饰效果 */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-accent rounded-full animate-pulse-slow"></div>
        <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-blue-400 rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
        
        {/* 背景光晕 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
      </motion.div>
    </div>
  );
}