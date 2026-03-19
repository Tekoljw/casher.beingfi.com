import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface GearMechanismProps {
  className?: string;
}

export default function GearMechanism({ className = '' }: GearMechanismProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full ${className}`}
    >
      {/* 大齿轮 - 中央 */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48"
        animate={{ rotate: 360 }}
        transition={{ 
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-lg">
          <path 
            d="M60,10 L65,20 L75,17 L77,28 L87,30 L85,40 L95,45 L90,55 L98,63 L90,70 L95,80 L85,85 L87,95 L77,97 L75,107 L65,105 L60,115 L55,105 L45,107 L43,97 L33,95 L35,85 L25,80 L30,70 L22,63 L30,55 L25,45 L35,40 L33,30 L43,28 L45,17 L55,20 Z" 
            fill="url(#gradientBlue)" 
            stroke="rgba(100, 149, 237, 0.6)" 
            strokeWidth="1.5"
          />
          <circle cx="60" cy="60" r="12" fill="#1a1e2a" stroke="rgba(100, 149, 237, 0.8)" strokeWidth="2" />
          <circle cx="60" cy="60" r="2" fill="rgba(100, 149, 237, 0.8)" />
          <defs>
            <linearGradient id="gradientBlue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(56, 189, 248, 0.3)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0.3)" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
      
      {/* 中型齿轮 - 左上 */}
      <motion.div
        className="absolute top-5 left-12 w-32 h-32"
        animate={{ rotate: -360 }}
        transition={{ 
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-lg">
          <path 
            d="M60,20 L65,25 L70,22 L73,28 L80,28 L80,35 L86,38 L83,45 L88,50 L83,55 L86,62 L80,65 L80,72 L73,72 L70,78 L65,75 L60,80 L55,75 L50,78 L47,72 L40,72 L40,65 L34,62 L37,55 L32,50 L37,45 L34,38 L40,35 L40,28 L47,28 L50,22 L55,25 Z" 
            fill="url(#gradientEmerald)" 
            stroke="rgba(16, 185, 129, 0.6)" 
            strokeWidth="1.5"
          />
          <circle cx="60" cy="50" r="8" fill="#1a1e2a" stroke="rgba(16, 185, 129, 0.8)" strokeWidth="2" />
          <circle cx="60" cy="50" r="1.5" fill="rgba(16, 185, 129, 0.8)" />
          <defs>
            <linearGradient id="gradientEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(16, 185, 129, 0.3)" />
              <stop offset="100%" stopColor="rgba(5, 150, 105, 0.3)" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
      
      {/* 中型齿轮 - 右上 */}
      <motion.div
        className="absolute top-10 right-12 w-28 h-28"
        animate={{ rotate: 360 }}
        transition={{ 
          duration: 17,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-lg">
          <path 
            d="M60,15 L66,22 L72,18 L76,26 L84,24 L84,32 L92,34 L89,42 L96,47 L89,52 L92,60 L84,62 L84,70 L76,68 L72,76 L66,72 L60,79 L54,72 L48,76 L44,68 L36,70 L36,62 L28,60 L31,52 L24,47 L31,42 L28,34 L36,32 L36,24 L44,26 L48,18 L54,22 Z" 
            fill="url(#gradientCyan)" 
            stroke="rgba(8, 145, 178, 0.6)" 
            strokeWidth="1.5"
          />
          <circle cx="60" cy="47" r="7" fill="#1a1e2a" stroke="rgba(8, 145, 178, 0.8)" strokeWidth="2" />
          <circle cx="60" cy="47" r="1.5" fill="rgba(8, 145, 178, 0.8)" />
          <defs>
            <linearGradient id="gradientCyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(8, 145, 178, 0.3)" />
              <stop offset="100%" stopColor="rgba(14, 116, 144, 0.3)" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
      
      {/* 小齿轮 - 左下 */}
      <motion.div
        className="absolute bottom-12 left-10 w-24 h-24"
        animate={{ rotate: 360 }}
        transition={{ 
          duration: 10,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-lg">
          <path 
            d="M60,25 L64,32 L72,31 L73,39 L80,41 L78,49 L84,53 L78,61 L82,67 L73,72 L74,80 L65,82 L63,90 L54,88 L50,95 L43,90 L35,93 L33,85 L25,83 L28,75 L22,70 L28,63 L24,56 L32,53 L33,45 L42,46 L45,38 L53,42 Z" 
            fill="url(#gradientPurple)" 
            stroke="rgba(147, 51, 234, 0.6)" 
            strokeWidth="1.5"
          />
          <circle cx="60" cy="60" r="6" fill="#1a1e2a" stroke="rgba(147, 51, 234, 0.8)" strokeWidth="2" />
          <circle cx="60" cy="60" r="1" fill="rgba(147, 51, 234, 0.8)" />
          <defs>
            <linearGradient id="gradientPurple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(147, 51, 234, 0.3)" />
              <stop offset="100%" stopColor="rgba(124, 58, 237, 0.3)" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
      
      {/* 小齿轮 - 右下 */}
      <motion.div
        className="absolute bottom-14 right-14 w-20 h-20"
        animate={{ rotate: -360 }}
        transition={{ 
          duration: 12,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-lg">
          <path 
            d="M60,30 L64,37 L72,36 L73,44 L80,46 L78,54 L84,58 L78,66 L82,72 L73,77 L74,85 L65,87 L63,95 L54,93 L50,100 L43,95 L35,98 L33,90 L25,88 L28,80 L22,75 L28,68 L24,61 L32,58 L33,50 L42,51 L45,43 L53,47 Z" 
            fill="url(#gradientAmber)" 
            stroke="rgba(217, 119, 6, 0.6)" 
            strokeWidth="1.5"
          />
          <circle cx="60" cy="65" r="5" fill="#1a1e2a" stroke="rgba(217, 119, 6, 0.8)" strokeWidth="2" />
          <circle cx="60" cy="65" r="1" fill="rgba(217, 119, 6, 0.8)" />
          <defs>
            <linearGradient id="gradientAmber" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(245, 158, 11, 0.3)" />
              <stop offset="100%" stopColor="rgba(217, 119, 6, 0.3)" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
      
      {/* 微型齿轮 - 顶部中央 */}
      <motion.div
        className="absolute top-3 left-1/2 -translate-x-1/2 w-14 h-14"
        animate={{ rotate: -360 }}
        transition={{ 
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-lg">
          <path 
            d="M60,30 L64,37 L72,36 L73,44 L80,46 L78,54 L84,58 L78,66 L82,72 L73,77 L74,85 L65,87 L63,95 L54,93 L50,100 L43,95 L35,98 L33,90 L25,88 L28,80 L22,75 L28,68 L24,61 L32,58 L33,50 L42,51 L45,43 L53,47 Z" 
            fill="url(#gradientRed)" 
            stroke="rgba(220, 38, 38, 0.6)" 
            strokeWidth="1.5"
          />
          <circle cx="60" cy="65" r="4" fill="#1a1e2a" stroke="rgba(220, 38, 38, 0.8)" strokeWidth="1.5" />
          <circle cx="60" cy="65" r="1" fill="rgba(220, 38, 38, 0.8)" />
          <defs>
            <linearGradient id="gradientRed" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(239, 68, 68, 0.3)" />
              <stop offset="100%" stopColor="rgba(220, 38, 38, 0.3)" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
      
      {/* 连接线条效果 */}
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-accent/5 to-blue-500/5"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      </div>
      
      {/* 光晕效果 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-accent/20 rounded-full blur-xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-12 h-12 bg-purple-500/20 rounded-full blur-xl pointer-events-none"></div>
      <div className="absolute top-10 left-10 w-10 h-10 bg-emerald-500/20 rounded-full blur-lg pointer-events-none"></div>
      
      {/* 粒子效果 */}
      <div className="absolute top-1/4 left-1/3 w-1 h-1 bg-accent rounded-full animate-pulse-slow"></div>
      <div className="absolute top-2/3 left-2/3 w-1 h-1 bg-purple-500 rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-emerald-400 rounded-full animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
    </div>
  );
}