import { Link } from "wouter";
import { motion } from "framer-motion";
import { Globe, Shield, CreditCard, Clock } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import logoImage from "../assets/logo.png";
import CountryFlagGroup from "./CountryFlags";
import { useState, useEffect, useRef } from "react";

export default function Footer() {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (footerRef.current) {
      observer.observe(footerRef.current);
    }

    return () => observer.disconnect();
  }, []);
  
  const footerColumns = [
    {
      title: "产品与服务",
      links: [
        { name: "商户中心", href: "/dashboard" },
        { name: "API文档", href: "#" },
        { name: "集成方案", href: "/my-projects" },
        { name: "安全合规", href: "#" }
      ]
    },

    {
      title: "关于我们",
      links: [
        { name: "公司介绍", href: "#about" },
        { name: "合作伙伴", href: "#partners" },
        { name: "技术团队", href: "#" },
        { name: "联系我们", href: "#contact" },
        { name: "加入BeingFi", href: "#" }
      ]
    },
    {
      title: "支持",
      links: [
        { name: "帮助中心", href: "#" },
        { name: "开发文档", href: "#" },
        { name: "常见问题", href: "#" },
        { name: "服务条款", href: "#" },
        { name: "隐私政策", href: "#" }
      ]
    }
  ];

  // 支付能力图标
  const paymentCapabilities = [
    { icon: <Globe className="h-5 w-5" />, text: "50+国家支付通道" },
    { icon: <Shield className="h-5 w-5" />, text: "银行级安全加密" },
    { icon: <CreditCard className="h-5 w-5" />, text: "多币种结算" },
    { icon: <Clock className="h-5 w-5" />, text: "7×24小时服务" }
  ];

  const currentYear = new Date().getFullYear();

  return (
    <footer 
      ref={footerRef}
      className={`pt-16 pb-8 transition-all duration-500 ${
        isVisible 
          ? 'bg-black/60 backdrop-blur-md border-t border-white/10' 
          : 'border-t border-slate-800/50'
      }`}
    >
      <div className="container mx-auto px-4">
        {/* 主要内容 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2"
          >
            <div className="flex items-center mb-6">
              <img src={logoImage} alt="BeingFi" className="h-8" />
            </div>
            <p className="text-gray-400 mb-6">
              BeingFi是领先的全球支付技术提供商，基于稳定高效的JAVA+React架构，
              提供覆盖50+国家的支付通道，帮助企业快速拓展全球市场，实现无缝支付体验。
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {paymentCapabilities.map((item, index) => (
                <div key={index} className="flex items-center text-gray-400">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center mr-2">
                    {item.icon}
                  </div>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
          
          {footerColumns.map((column, colIndex) => (
            <motion.div
              key={column.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * (colIndex + 1) }}
            >
              <h3 className="text-lg font-bold text-white mb-6">{column.title}</h3>
              <ul className="space-y-3">
                {column.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link 
                      href={link.href} 
                      className="text-gray-400 hover:text-accent transition-colors duration-300"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
        
        {/* 国旗部分 */}
        <div className="mb-8">
          <CountryFlagGroup />
        </div>

        {/* 底部版权 */}
        <div className="pt-8 border-t border-slate-800 flex flex-wrap justify-between items-center text-gray-500 text-sm">
          <p>&copy; {currentYear} BeingFi Technology. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link href="#" className="hover:text-gray-300 transition-colors">服务条款</Link>
            <Link href="#" className="hover:text-gray-300 transition-colors">隐私政策</Link>
            <Link href="#" className="hover:text-gray-300 transition-colors">安全声明</Link>
            <Link href="#" className="hover:text-gray-300 transition-colors">网站地图</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
