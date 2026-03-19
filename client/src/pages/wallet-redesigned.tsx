import React, { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import "../styles/wallet.css";
import { MastercardLogo, VisaLogo, ApplePayLogo, PayPalLogo } from "@/components/BrandLogos";
import Header from "@/components/Header";

export default function WalletRedesigned() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  
  // 用于打字效果的支持链
  const supportedChains = [
    "ETH", "BSC", "TRON", "SOLANA", "POLYGON", "ARBITRUM", "OPTIMISM", "AVALANCHE", "NEAR", "CARDANO", "DOT"
  ];

  // 动态闪耀文字打字效果
  useEffect(() => {
    const words = supportedChains;
    let wordIndex = 0;
    let letterIndex = 0;
    let isDeleting = false;
    let typeSpeed = 100;
    const element = document.getElementById('typing-chain');
    
    if (!element) return;

    function typeWriter() {
      const currentWord = words[wordIndex];
      
      if (isDeleting && element) {
        element.textContent = currentWord.substring(0, letterIndex - 1);
        letterIndex--;
        // 更快的擦除速度
        typeSpeed = Math.max(25, Math.floor(Math.random() * 50));
      } else if (element) {
        element.textContent = currentWord.substring(0, letterIndex + 1);
        letterIndex++;
        // 随机速度使打字更自然
        typeSpeed = Math.max(80, Math.floor(Math.random() * 150));
      }
      
      // 当完整显示单词时，稍微停顿后开始擦除
      if (!isDeleting && letterIndex === currentWord.length) {
        isDeleting = true;
        typeSpeed = 800; // 等待时间
      } else if (isDeleting && letterIndex === 0) {
        isDeleting = false;
        // 随机选择下一个词，避免顺序显示
        let nextIndex;
        do {
          nextIndex = Math.floor(Math.random() * words.length);
        } while (nextIndex === wordIndex && words.length > 1);
        
        wordIndex = nextIndex;
        typeSpeed = 200; // 切换词之间的延迟
      }
      
      setTimeout(typeWriter, typeSpeed);
    }
    
    // 立即开始动画
    typeWriter();
    
    // 清理函数
    return () => {
      if (element) element.textContent = "";
    };
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <Header />
      
      {/* 顶部彩带 */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"></div>
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/15 via-purple-900/10 to-emerald-900/15"></div>
          
          {/* Animated background elements with color change */}
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full mix-blend-multiply filter blur-3xl gradient-shift"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl animate-float color-shift bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-emerald-500/20"></div>
          <div className="absolute top-40 right-1/4 w-64 h-64 rounded-full mix-blend-multiply filter blur-3xl color-pulse bg-gradient-to-r from-pink-500/10 via-yellow-500/10 to-purple-500/10"></div>
          
          {/* Additional colorful background elements */}
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full mix-blend-multiply filter blur-2xl animate-pulse-slow-delay bg-gradient-to-r from-fuchsia-500/15 via-blue-500/15 to-emerald-500/15"></div>
          <div className="absolute bottom-1/2 right-1/3 w-56 h-56 rounded-full mix-blend-multiply filter blur-2xl animate-float bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-blue-500/10"></div>
          
          {/* Sparkles with color changing effects */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full shadow-lg shadow-emerald-400/50 animate-ping-slow color-pulse bg-emerald-400"></div>
          <div className="absolute top-1/3 right-1/3 w-3 h-3 rounded-full shadow-lg shadow-blue-400/50 animate-ping-slow-delay color-pulse bg-blue-400"></div>
          <div className="absolute bottom-1/3 right-1/4 w-2 h-2 rounded-full shadow-lg shadow-purple-400/50 animate-ping-slow color-pulse bg-purple-400"></div>
          <div className="absolute bottom-1/4 left-1/3 w-2 h-2 rounded-full shadow-lg shadow-emerald-400/50 animate-ping-slow-delay color-pulse bg-emerald-400"></div>
          
          {/* More sparkles */}
          <div className="absolute top-1/3 left-1/2 w-2 h-2 rounded-full shadow-lg shadow-pink-400/50 animate-ping-slow-delay color-pulse bg-pink-400"></div>
          <div className="absolute top-1/2 right-1/4 w-3 h-3 rounded-full shadow-lg shadow-yellow-400/50 animate-ping-slow color-pulse bg-yellow-400"></div>
          <div className="absolute bottom-1/2 right-1/2 w-2 h-2 rounded-full shadow-lg shadow-blue-400/50 animate-ping-slow-delay color-pulse bg-blue-400"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 relative">
                  <span className="relative inline-block">
                    <span className="rainbow-text">BeingFi</span>
                    <span className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-purple-500/20 to-blue-600/20 blur-xl rounded-full gradient-shift opacity-70"></span>
                  </span>
                  {" "}
                  <span className="relative inline-block">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-500 animate-gradient-x">全球数字钱包</span>
                    <span className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-emerald-500/20 blur-xl rounded-full animate-pulse-slow-delay opacity-70"></span>
                  </span>
                </h1>
                <p className="text-xl text-gray-300 mb-8 relative">
                  <span className="relative inline-block">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-blue-300 to-gray-100">安全、便捷、多样化、社交化的一体式应用</span>
                    <span className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 blur-xl rounded-full color-shift opacity-30"></span>
                  </span>
                </p>
                
                <div className="flex items-center justify-center lg:justify-start mb-10">
                  <span className="text-gray-300 mr-2 text-lg">支持</span>
                  <span id="typing-chain" className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 font-semibold text-lg"></span>
                  <span className="text-emerald-400 animate-pulse text-lg">|</span>
                </div>
                
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start mb-12">
                  <button className="flex items-center px-7 py-4 color-shift bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 text-white rounded-full hover:shadow-lg hover:shadow-emerald-500/40 transition duration-300 relative group">
                    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-600/50 via-blue-600/50 to-purple-600/50 blur-md opacity-0 group-hover:opacity-70 transition duration-300"></span>
                    <img src="https://bepay.one/assets/images/icons/1.png" alt="Google Play" className="w-5 h-5 mr-2 relative z-10 color-pulse" />
                    <span className="relative z-10">Google Play</span>
                  </button>
                  <button className="flex items-center px-7 py-4 bg-slate-800/80 backdrop-blur-sm border border-emerald-500/70 text-white rounded-full hover:bg-gradient-to-r hover:from-emerald-600/30 hover:to-blue-600/30 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-500">
                    <img src="https://bepay.one/assets/images/icons/2.png" alt="Android" className="w-5 h-5 mr-2" />
                    <span>Android Apk</span>
                  </button>
                  <button className="flex items-center px-7 py-4 bg-slate-800/80 backdrop-blur-sm border border-blue-500/70 text-white rounded-full hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-purple-600/30 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-500">
                    <img src="https://bepay.one/assets/images/icons/3.png" alt="Web" className="w-5 h-5 mr-2" />
                    <span>Web钱包</span>
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-10 justify-center lg:justify-start">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">50+</div>
                    <div className="text-gray-300 text-base">区块链网络</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">800+</div>
                    <div className="text-gray-300 text-base">加密货币</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-500">100+</div>
                    <div className="text-gray-300 text-base">法定货币</div>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute -top-20 -right-20 w-64 h-64 gradient-shift rounded-full opacity-30 blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-400 rounded-full opacity-20 blur-3xl animate-float color-shift"></div>
                <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-full opacity-20 blur-2xl color-pulse"></div>
                <div className="absolute bottom-1/3 left-1/3 w-24 h-24 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-full opacity-20 blur-xl animate-pulse-slow color-shift"></div>
                
                {/* Floating elements */}
                <div className="absolute top-10 right-10 w-6 h-6 bg-emerald-400 rounded-full opacity-40 animate-float z-20"></div>
                <div className="absolute bottom-20 left-10 w-4 h-4 bg-blue-400 rounded-full opacity-40 animate-float-delay z-20"></div>
                <div className="absolute top-1/2 right-0 w-5 h-5 bg-purple-400 rounded-full opacity-40 animate-float-slow z-20"></div>
                
                {/* Image container with enhanced shine effect */}
                <div className="relative z-10 w-full max-w-xl mx-auto rounded-2xl shadow-2xl overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1500 ease-in-out shimmer"></div>
                  
                  {/* Colorful border glow */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 color-shift"></div>
                  
                  <img 
                    src="https://scource-static.funibet.com/beingfi/images/bg/screen-2.png" 
                    alt="BeingFi钱包应用" 
                    className="relative z-10 w-full rounded-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* 统计数据 */}
        <section className="py-16 bg-slate-800/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">500K+</div>
                <p className="text-gray-400">全球用户</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">10M+</div>
                <p className="text-gray-400">交易量</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">8</div>
                <p className="text-gray-400">支持公链</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">24/7</div>
                <p className="text-gray-400">客户支持</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* 核心功能 */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold rainbow-text mb-4">核心功能</h2>
              <div className="w-20 h-1 bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500 mx-auto color-shift"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="relative group overflow-hidden">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-50 transition duration-300 blur-sm color-shift"></div>
                <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 relative z-10 hover:bg-slate-800/95 transition duration-300 hover:shadow-emerald-500/10 hover:shadow-lg">
                  <div className="w-12 h-12 gradient-shift rounded-lg flex items-center justify-center mb-4">
                    <img src="https://bepay.one/assets/images/icons/f1.png" alt="Asset Storage" className="w-6 h-6 color-pulse" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">资产存储</h3>
                  <p className="text-gray-400 text-sm">安全地将加密货币、法定货币和NFT存储在一个地方。多链支持，跨链闪兑。</p>
                </div>
              </div>
              
              <div className="relative group overflow-hidden">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl opacity-0 group-hover:opacity-50 transition duration-300 blur-sm color-shift"></div>
                <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 relative z-10 hover:bg-slate-800/95 transition duration-300 hover:shadow-emerald-500/10 hover:shadow-lg">
                  <div className="w-12 h-12 gradient-shift rounded-lg flex items-center justify-center mb-4">
                    <img src="https://bepay.one/assets/images/icons/f2.png" alt="Flash Exchange" className="w-6 h-6 color-pulse" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">闪兑交易</h3>
                  <p className="text-gray-400 text-sm">一键交换任意代币，通过聚合获得最佳汇率。无限流动性池确保实时交易无交易量限制。</p>
                </div>
              </div>
              
              <div className="relative group overflow-hidden">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-xl opacity-0 group-hover:opacity-50 transition duration-300 blur-sm color-shift"></div>
                <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 relative z-10 hover:bg-slate-800/95 transition duration-300 hover:shadow-emerald-500/10 hover:shadow-lg">
                  <div className="w-12 h-12 gradient-shift rounded-lg flex items-center justify-center mb-4">
                    <img src="https://bepay.one/assets/images/icons/f3.png" alt="Buy Sell" className="w-6 h-6 color-pulse" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">买卖交易</h3>
                  <p className="text-gray-400 text-sm">通过点对点交易买卖加密货币和法定货币。OTC场外法币市场支持。</p>
                </div>
              </div>
              
              <div className="relative group overflow-hidden">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 via-yellow-500 to-emerald-500 rounded-xl opacity-0 group-hover:opacity-50 transition duration-300 blur-sm color-shift"></div>
                <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 relative z-10 hover:bg-slate-800/95 transition duration-300 hover:shadow-emerald-500/10 hover:shadow-lg">
                  <div className="w-12 h-12 gradient-shift rounded-lg flex items-center justify-center mb-4">
                    <img src="https://bepay.one/assets/images/icons/f4.png" alt="Cross Chain" className="w-6 h-6 color-pulse" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">跨链桥接</h3>
                  <p className="text-gray-400 text-sm">支持主要公链之间的任意跨链交易，打破链间壁垒。</p>
                </div>
              </div>
              
              <div className="relative group overflow-hidden">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 rounded-xl opacity-0 group-hover:opacity-50 transition duration-300 blur-sm color-shift"></div>
                <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 relative z-10 hover:bg-slate-800/95 transition duration-300 hover:shadow-emerald-500/10 hover:shadow-lg">
                  <div className="w-12 h-12 gradient-shift rounded-lg flex items-center justify-center mb-4">
                    <img src="https://bepay.one/assets/images/icons/f5.png" alt="Merchant Payment" className="w-6 h-6 color-pulse" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">商户支付</h3>
                  <p className="text-gray-400 text-sm">为商户等各种场景提供一站式支付解决方案。支持多种支付方式。</p>
                </div>
              </div>
              
              <div className="relative group overflow-hidden">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-50 transition duration-300 blur-sm color-shift"></div>
                <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 relative z-10 hover:bg-slate-800/95 transition duration-300 hover:shadow-emerald-500/10 hover:shadow-lg">
                  <div className="w-12 h-12 gradient-shift rounded-lg flex items-center justify-center mb-4">
                    <img src="https://bepay.one/assets/images/icons/f6.png" alt="NFT" className="w-6 h-6 color-pulse" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">数字藏品</h3>
                  <p className="text-gray-400 text-sm">轻松存储和交易您喜爱的NFT数字藏品。支持多链NFT资产管理。</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* 安全特性 */}
        <section className="py-20 bg-slate-800/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl font-bold text-white mb-6">MPC加密技术</h2>
                <p className="text-gray-300 mb-6">
                  MPC（多方计算）是一种用于安全处理和存储敏感数据的加密技术。它允许多个参与者执行计算而不会泄露各自的输入，确保数据的隐私和安全。在加密货币领域，MPC技术可用于密钥管理和交易签名，提供更高的安全性和保护。
                </p>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mt-1">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-white font-medium">无需托管密钥</h3>
                      <p className="text-gray-400">密钥从不完整存储在单一位置，确保最高安全性</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mt-1">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-white font-medium">防钓鱼保护</h3>
                      <p className="text-gray-400">多方验证确保交易安全，防止恶意攻击</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-blue-500/10 rounded-xl"></div>
                <img 
                  src="https://scource-static.funibet.com/beingfi/images/bg/qb.png" 
                  alt="MPC技术" 
                  className="relative rounded-xl w-full shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>
        
        {/* 法币支持 */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-blue-500/10 rounded-xl"></div>
                <img 
                  src="https://scource-static.funibet.com/beingfi/images/bg/fb.png" 
                  alt="法币支持" 
                  className="relative rounded-xl w-full shadow-2xl"
                />
              </div>
              <div className="order-1 lg:order-2">
                <h2 className="text-3xl font-bold text-white mb-6">支持100+法定货币</h2>
                <p className="text-gray-300 mb-8">
                  实现全球法定货币和加密货币最便捷、自由的交换。直接充值法币，轻松买卖，无缝连接传统金融与加密世界。
                </p>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mt-1">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-white font-medium">法币直充</h3>
                      <p className="text-gray-400">直接使用信用卡、银行转账等方式充值法币</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mt-1">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-white font-medium">法币买卖</h3>
                      <p className="text-gray-400">便捷的法币与加密货币交易，支持多种支付方式</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mt-1">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-white font-medium">OTC场外交易</h3>
                      <p className="text-gray-400">专业的场外交易市场，支持大额法币交易</p>
                    </div>
                  </div>
                </div>
                <div className="mt-8 flex space-x-4">
                  <VisaLogo className="h-8 w-auto" />
                  <MastercardLogo className="h-8 w-auto" />
                  <ApplePayLogo className="h-8 w-auto" />
                  <PayPalLogo className="h-8 w-auto" />
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* 闪兑功能 */}
        <section className="py-20 bg-slate-800/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl font-bold text-white mb-6">内置闪兑，提供最佳交易价格</h2>
                <p className="text-gray-300 mb-8">
                  无限流动性池确保实时交易，无交易量限制。一键获取最佳汇率，击败所有CEX、DEX和跨链桥！
                </p>
                <div className="p-6 bg-slate-900 rounded-xl border border-slate-700">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className="text-gray-400 text-sm">从</span>
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
                          <img src="https://bepay.one/assets/images/web3/1.png" alt="ETH" />
                        </div>
                        <span className="text-white font-medium">ETH</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                      <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">到</span>
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
                          <img src="https://bepay.one/assets/images/web3/2.png" alt="BTC" />
                        </div>
                        <span className="text-white font-medium">BTC</span>
                      </div>
                    </div>
                  </div>
                  <button className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-lg font-medium">
                    获取最佳汇率
                  </button>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-blue-500/10 rounded-xl"></div>
                <img 
                  src="https://scource-static.funibet.com/beingfi/images/bg/zd.png" 
                  alt="闪兑功能" 
                  className="relative rounded-xl w-full shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>
        
        {/* 加密货币支持 */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">支持资产</h2>
              <p className="text-gray-300 mb-8">
                50+区块链网络, 800+加密货币, 50+NFT, 100+法定货币<br />持续增加中...
              </p>
              
              <div className="inline-flex bg-slate-800 p-1 rounded-full mb-12">
                <button className="px-6 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 text-white font-medium">
                  加密货币
                </button>
                <button className="px-6 py-2 rounded-full text-gray-300 font-medium">
                  NFT
                </button>
                <button className="px-6 py-2 rounded-full text-gray-300 font-medium">
                  法币
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                <div key={num} className="w-12 h-12 bg-slate-800/70 border border-slate-700/50 backdrop-blur-sm rounded-full p-1.5 hover:scale-110 transition duration-300 flex items-center justify-center shadow-md group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <img 
                    src={`https://bepay.one/assets/images/web3/${num}.png`} 
                    alt={`Cryptocurrency ${num}`} 
                    className="w-full h-full object-contain relative z-10"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* 合作伙伴 */}
        <section className="py-20 bg-slate-800/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h6 className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500 text-lg font-semibold mb-4">
                合作伙伴
              </h6>
              <h2 className="text-3xl font-bold text-white mb-8">
                被主流金融机构和平台信任
              </h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                <div key={num} className="bg-slate-900/60 border border-slate-800/50 backdrop-blur-sm p-3 rounded-lg hover:bg-slate-900/80 transition duration-300 flex items-center justify-center shadow-sm group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <img 
                    src={`https://bepay.one/assets/images/client/${num}.png`} 
                    alt={`Partner ${num}`} 
                    className="max-h-10 filter grayscale hover:grayscale-0 transition duration-300 relative z-10"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* 页脚 */}
        <footer className="py-16 bg-slate-900">
          <div className="container mx-auto px-4">
            <div className="flex justify-center mb-12">
              <img
                src="/assets/logo.png"
                alt="BeingFi Logo"
                className="h-12"
              />
            </div>
            <div className="text-center">
              <p className="text-gray-500">
                Copyright © <span className="text-emerald-500">BeingFi</span>
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}