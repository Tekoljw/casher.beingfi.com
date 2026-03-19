import React from 'react';
import { motion } from 'framer-motion';
import { 
  VisaIcon, 
  MastercardIcon, 
  ApplePayIcon, 
  PayPalIcon, 
  AmazonIcon 
} from './icons/PaymentIcons';

interface FloatingBrandProps {
  className?: string;
}

export default function FloatingBrands({ className = '' }: FloatingBrandProps) {
  // 定义不同的动画路径和时间 - 分散在地球四周
  const brands = [
    {
      icon: <VisaIcon className="w-14 h-8" />,
      initial: { x: '120%', y: '20%', rotate: -5 },
      animate: {
        x: ['120%', '122%', '118%', '120%'],
        y: ['20%', '22%', '18%', '20%'],
        rotate: [-5, -3, -7, -5],
      },
      transition: {
        duration: 8,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "loop" as const,
      },
      delay: 0,
    },
    {
      icon: <MastercardIcon className="w-14 h-8" />,
      initial: { x: '-120%', y: '80%', rotate: 5 },
      animate: {
        x: ['-120%', '-122%', '-118%', '-120%'],
        y: ['80%', '82%', '78%', '80%'],
        rotate: [5, 7, 3, 5],
      },
      transition: {
        duration: 9,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "loop" as const,
      },
      delay: 1,
    },
    {
      icon: <ApplePayIcon className="w-14 h-8" />,
      initial: { x: '60%', y: '-120%', rotate: -3 },
      animate: {
        x: ['60%', '62%', '58%', '60%'],
        y: ['-120%', '-122%', '-118%', '-120%'],
        rotate: [-3, -1, -5, -3],
      },
      transition: {
        duration: 7,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "loop" as const,
      },
      delay: 2,
    },
    {
      icon: <PayPalIcon className="w-14 h-8" />,
      initial: { x: '-100%', y: '-70%', rotate: 4 },
      animate: {
        x: ['-100%', '-102%', '-98%', '-100%'],
        y: ['-70%', '-72%', '-68%', '-70%'],
        rotate: [4, 6, 2, 4],
      },
      transition: {
        duration: 10,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "loop" as const,
      },
      delay: 1.5,
    },
    {
      icon: <AmazonIcon className="w-14 h-8" />,
      initial: { x: '90%', y: '110%', rotate: -2 },
      animate: {
        x: ['90%', '92%', '88%', '90%'],
        y: ['110%', '112%', '108%', '110%'],
        rotate: [-2, 0, -4, -2],
      },
      transition: {
        duration: 8.5,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "loop" as const,
      },
      delay: 0.5,
    },
  ];

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {brands.map((brand, index) => {
        const positions = [
          { top: '10%', left: '80%' },  // Visa - 右上
          { top: '80%', left: '20%' },  // Mastercard - 左下
          { top: '15%', left: '35%' },  // Apple Pay - 左上
          { top: '25%', left: '15%' },  // PayPal - 左中
          { top: '75%', left: '75%' },  // Amazon - 右下
        ];
        
        return (
          <motion.div
            key={index}
            className="absolute filter drop-shadow-lg"
            style={{
              ...positions[index],
              transform: 'translate(-50%, -50%)',
            }}
            animate={{
              x: [0, 5, -5, 0],
              y: [0, -5, 5, 0],
              rotate: brand.animate.rotate,
            }}
            transition={{
              ...brand.transition,
              delay: brand.delay,
            }}
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-md shadow-lg p-1 border border-white/20">
              {brand.icon}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}