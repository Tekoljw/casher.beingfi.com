import React, { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import "../styles/wallet.css";

export default function WalletPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  
  // 用于打字效果的支持链
  const supportedChains = [
    "ETH", "BSC", "TRON", "SOLANA", "POLYGON", "ARBITRUM", "OPTIMISM", "AVALANCHE"
  ];

  // 动态文字打字效果
  useEffect(() => {
    const words = supportedChains;
    let wordIndex = 0;
    let letterIndex = 0;
    let isDeleting = false;
    let typeSpeed = 100;
    const element = document.getElementById('kkk');
    
    if (!element) return;

    function typeWriter() {
      const currentWord = words[wordIndex];
      
      if (isDeleting && element) {
        element.textContent = currentWord.substring(0, letterIndex - 1);
        letterIndex--;
        typeSpeed = 50;
      } else if (element) {
        element.textContent = currentWord.substring(0, letterIndex + 1);
        letterIndex++;
        typeSpeed = 150;
      }
      
      if (!isDeleting && letterIndex === currentWord.length) {
        isDeleting = true;
        typeSpeed = 1000; // 等待时间
      } else if (isDeleting && letterIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        typeSpeed = 300; // 切换词之间的延迟
      }
      
      setTimeout(typeWriter, typeSpeed);
    }
    
    setTimeout(typeWriter, 1000);
  }, []);
  
  return (
    <div className="wrapper d-flex flex-column justify-between">
      <main className="flex-grow-1">
        {/* Hero Section - 100% 复制bepay.one/index2.html设计 */}
        <section className="hero-section style-2 position-relative bg-dark py-10 py-lg-15">
          <div className="striped-shape">
            <img src="https://bepay.one/assets/images/shapes/stripe-dark.svg" alt="" />
          </div>
          <div className="container">
            <div className="row align-center contMgTop">
              <div className="col-lg-5 leftInfo">
                <div className="text-center text-lg-start position-relative z-1">
                  <h3 className="text-white" data-aos="fade-up-sm" data-aos-delay="100"
                      style={{ wordWrap: "break-word", wordBreak: "break-all" }}>
                    Safe, convenient, versatile, social.
                  </h3>
                  <div className="text-center">
                    <div className="flex position-relative z-1 phonePaiXu">
                      <div className="daZiJiZiLeft">Support</div>
                      <div className='console-container'>
                        <span id='kkk'></span>
                        <div className='console-underscore' id='console'>&#95;</div>
                      </div>
                    </div>
                  </div>
                  <h6 className="text-white mb-8 mt-4" data-aos="fade-up-sm" data-aos-delay="100">
                    An all-in-one app.
                  </h6>

                  <div className="d-flex gap-8 align-center justify-center justify-lg-start mt-12 review-badges" 
                      data-aos="fade-up-sm" data-aos-delay="200" style={{ flexWrap: "wrap" }}>
                    <div className="flex btn btn-outline-primary-dark"
                        style={{ padding: "10px 10px", minWidth: "150px" }}>
                      <div>
                        <img width="20" src="https://bepay.one/assets/images/icons/1.png" alt="" />
                      </div>
                      <div>
                        <a className="btnXhx" style={{ color: "#ffffff", marginLeft: "5px" }}>GooglePlay</a>
                      </div>
                    </div>

                    <div className="flex btn btn-outline-primary-dark"
                        style={{ padding: "10px 10px", minWidth: "150px" }}>
                      <div>
                        <img width="20" src="https://bepay.one/assets/images/icons/2.png" alt="" />
                      </div>
                      <div>
                        <a className="btnXhx" style={{ color: "#ffffff", marginLeft: "5px" }}>Android Apk</a>
                      </div>
                    </div>

                    <div className="flex btn btn-outline-primary-dark"
                        style={{ padding: "10px 10px", minWidth: "150px" }}>
                      <div>
                        <img width="20" src="https://bepay.one/assets/images/icons/3.png" alt="" />
                      </div>
                      <div>
                        <a className="btnXhx" style={{ color: "#ffffff", marginLeft: "5px" }}>Web Wallet</a>
                      </div>
                    </div>

                    <div className="flex btn btn-outline-primary-dark"
                        style={{ padding: "10px 10px", minWidth: "150px" }}>
                      <div>
                        <img width="20" src="https://bepay.one/assets/images/icons/5.png" alt="" />
                      </div>
                      <div>
                        <a className="btnXhx" style={{ color: "#ffffff", marginLeft: "5px" }}>Telegram App</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-7" data-aos="fade-up-sm" data-aos-delay="200">
                <div className="image-with-shape">
                  <img src="https://bepay.one/assets/images/shapes/blurry-shape-2.png" alt="" className="shape animate-scale" />
                  <div className="mt-12 rounded-4 overflow-hidden">
                    <img className="img-fluid d-inline-block"
                        src="https://scource-static.funibet.com/beingfi/images/bg/screen-2.png"
                        alt="" />
                  </div>
                </div>
              </div>
            </div>

            <div className="row justify-center mt-18">
              <div className="col-lg-10">
                <div className="text-center">
                  <h4 className="mb-10" data-aos="fade-up-sm" data-aos-delay="50">
                    <span className="text-gradient-2">Join</span>
                    <span> our co-governance</span>
                  </h4>

                  <div className="d-flex gap-8 mt-8 justify-evenly">
                    <div className="item-feature text-center position-relative">
                      <div className="d-flex flex-column align-center justify-center" style={{ minHeight: "360px" }}>
                        <div>
                          <div className="rounded-4 overflow-hidden">
                            <div className="icon">
                              <img src="https://bepay.one/assets/images/icons/icon7.png" 
                                  alt="Crypto payment" className="mx-auto" />
                            </div>
                            <h5 className="mb-3">Crypto payment</h5>
                            <div className="divider mx-auto mb-4"></div>
                            <p>
                              Complete a payment in a few seconds.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="item-feature text-center position-relative">
                      <div className="d-flex flex-column align-center justify-center" style={{ minHeight: "360px" }}>
                        <div>
                          <div className="rounded-4 overflow-hidden">
                            <div className="icon">
                              <img src="https://bepay.one/assets/images/icons/icon6.png" 
                                  alt="Social Login" className="mx-auto" />
                            </div>
                            <h5 className="mb-3">Social Login</h5>
                            <div className="divider mx-auto mb-4"></div>
                            <p>
                              Support social media login.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="item-feature text-center position-relative">
                      <div className="d-flex flex-column align-center justify-center" style={{ minHeight: "360px" }}>
                        <div>
                          <div className="rounded-4 overflow-hidden">
                            <div className="icon">
                              <img src="https://bepay.one/assets/images/icons/icon5.png" 
                                  alt="Crypto Wallet" className="mx-auto" />
                            </div>
                            <h5 className="mb-3">Crypto Wallet</h5>
                            <div className="divider mx-auto mb-4"></div>
                            <p>
                              Support multi-chain.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 功能特性部分 */}
        <section className="py-20 bg-gradient-to-b from-[#111] to-[#151E2C]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Accessible Financial Services for Everyone</h2>
              <p className="text-gray-400 max-w-3xl mx-auto">
                BeingFi provides a seamless crypto payment experience with low fees, fast transactions, and social features.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature Card 1 */}
              <div className="bg-[#1E293B] p-6 rounded-lg border border-[#14C2A3]/20 hover:border-[#14C2A3]/50 transition-all">
                <div className="w-14 h-14 bg-gradient-to-br from-[#14C2A3] to-[#3B82F6] rounded-full flex items-center justify-center mb-5">
                  <img src="https://bepay.one/assets/images/icons/icon1.png" alt="Feature" className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Multi-chain Support</h3>
                <p className="text-gray-400">
                  Support multiple blockchain networks including Ethereum, BSC, TRON and more.
                </p>
              </div>

              {/* Feature Card 2 */}
              <div className="bg-[#1E293B] p-6 rounded-lg border border-[#14C2A3]/20 hover:border-[#14C2A3]/50 transition-all">
                <div className="w-14 h-14 bg-gradient-to-br from-[#14C2A3] to-[#3B82F6] rounded-full flex items-center justify-center mb-5">
                  <img src="https://bepay.one/assets/images/icons/icon2.png" alt="Feature" className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Social Features</h3>
                <p className="text-gray-400">
                  Connect with friends, send payments, and share expenses easily through social interactions.
                </p>
              </div>

              {/* Feature Card 3 */}
              <div className="bg-[#1E293B] p-6 rounded-lg border border-[#14C2A3]/20 hover:border-[#14C2A3]/50 transition-all">
                <div className="w-14 h-14 bg-gradient-to-br from-[#14C2A3] to-[#3B82F6] rounded-full flex items-center justify-center mb-5">
                  <img src="https://bepay.one/assets/images/icons/icon3.png" alt="Feature" className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Low Fees</h3>
                <p className="text-gray-400">
                  Enjoy minimal transaction fees compared to traditional payment methods.
                </p>
              </div>
            </div>

            <div className="text-center mt-16">
              <button className="px-8 py-3 bg-gradient-to-r from-[#14C2A3] to-[#3B82F6] rounded-full text-white font-medium hover:shadow-lg transition-all">
                Create Wallet
              </button>
            </div>
          </div>
        </section>

        {/* 使用流程部分 */}
        <section className="py-20 bg-dark">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">How It Works</h2>
              <p className="text-gray-400 max-w-3xl mx-auto">
                Getting started with BeingFi is simple and straightforward
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="relative">
                <div className="bg-[#1E293B] p-6 rounded-lg border border-[#14C2A3]/20">
                  <div className="absolute -top-5 -left-5 w-12 h-12 bg-gradient-to-br from-[#14C2A3] to-[#3B82F6] rounded-full flex items-center justify-center text-xl font-bold">1</div>
                  <h3 className="text-xl font-semibold mb-3 mt-4">Create Account</h3>
                  <p className="text-gray-400">
                    Sign up using your email or social media accounts in just seconds.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="bg-[#1E293B] p-6 rounded-lg border border-[#14C2A3]/20">
                  <div className="absolute -top-5 -left-5 w-12 h-12 bg-gradient-to-br from-[#14C2A3] to-[#3B82F6] rounded-full flex items-center justify-center text-xl font-bold">2</div>
                  <h3 className="text-xl font-semibold mb-3 mt-4">Fund Your Wallet</h3>
                  <p className="text-gray-400">
                    Deposit crypto or connect your existing wallet to start making payments.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="bg-[#1E293B] p-6 rounded-lg border border-[#14C2A3]/20">
                  <div className="absolute -top-5 -left-5 w-12 h-12 bg-gradient-to-br from-[#14C2A3] to-[#3B82F6] rounded-full flex items-center justify-center text-xl font-bold">3</div>
                  <h3 className="text-xl font-semibold mb-3 mt-4">Make Payments</h3>
                  <p className="text-gray-400">
                    Send, receive, and spend crypto quickly and easily with lowest fees.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 统计数据部分 */}
        <section className="py-20 bg-gradient-to-t from-[#111] to-[#151E2C]">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">500K+</div>
                <p className="text-gray-400">Users Worldwide</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">10M+</div>
                <p className="text-gray-400">Transactions</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">8</div>
                <p className="text-gray-400">Supported Chains</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">24/7</div>
                <p className="text-gray-400">Customer Support</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features 部分 - 从bepay.one复制 */}
        <section className="py-10 py-lg-15" id="Features1" style={{paddingTop: "5rem"}}>
          <div className="container">
            <div className="bg-dark-blue-4 rounded-4 p-6 p-md-12 px-xl-20 py-xl-12 hover-border mb-18">
              <div className="row g-6 g-lg-14 g-xl-20 align-center">
                <div className="col-lg-6" data-aos="fade-up-sm" data-aos-delay="50">
                  <div className="content">
                    <p className="" style={{color: "#14C2A3"}}>Features 1</p>
                    <h2 className="text-white mb-8">
                      Easy access to encrypted assets
                    </h2>
                    <ul className="list-unstyled list-check mb-8">
                      <li>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18" className="icon">
                          <g>
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m3.75 9 3.75 3.75 7.5-7.5" />
                          </g>
                        </svg>
                        <span>Easy access to encrypted assets</span>
                      </li>
                      <li>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18" className="icon">
                          <g>
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m3.75 9 3.75 3.75 7.5-7.5" />
                          </g>
                        </svg>
                        <span>Support for multiple tokens</span>
                      </li>
                      <li>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18" className="icon">
                          <g>
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m3.75 9 3.75 3.75 7.5-7.5" />
                          </g>
                        </svg>
                        <span>Multi-chain, cross-chain, flash transfers</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="col-lg-6" data-aos="fade-up-sm" data-aos-delay="100">
                  <div className="feature-img">
                    <img width="527" height="567" src="https://scource-static.funibet.com/beingfi/images/bg/qb.png" alt="" className="img-fluid" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-dark-blue-4 rounded-4 p-6 p-md-12 px-xl-20 py-xl-12 hover-border">
              <div className="row g-6 g-lg-14 g-xl-20 align-center">
                <div className="col-lg-6" data-aos="fade-up-sm" data-aos-delay="50">
                  <div className="content">
                    <p className="" style={{color: "#14C2A3"}}>Features 3</p>
                    <h2 className="text-white mb-8">
                      Supports over 100 fiat coins
                    </h2>
                    <p className="mb-6">
                      Achieving the most convenient and free exchange of global fiat currency and cryptocurrency.
                    </p>
                    <ul className="list-unstyled list-check mb-8">
                      <li>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18" className="icon">
                          <g>
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m3.75 9 3.75 3.75 7.5-7.5" />
                          </g>
                        </svg>
                        <span>Direct charging of legal currency</span>
                      </li>
                      <li>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18" className="icon">
                          <g>
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m3.75 9 3.75 3.75 7.5-7.5" />
                          </g>
                        </svg>
                        <span>Buying/Selling Legal Currency</span>
                      </li>
                      <li>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18" className="icon">
                          <g>
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m3.75 9 3.75 3.75 7.5-7.5" />
                          </g>
                        </svg>
                        <span>OTC over-the-counter fiat currency market</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="col-lg-6" data-aos="fade-up-sm" data-aos-delay="100">
                  <div className="feature-img">
                    <img src="https://scource-static.funibet.com/beingfi/images/bg/fb.png" alt="" className="img-fluid" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-dark-blue-4 rounded-4 p-6 p-md-12 px-xl-20 py-xl-12 hover-border mb-18 mt-20">
              <div className="row g-6 g-lg-14 g-xl-20 align-center flex-row-reverse">
                <div className="col-lg-6" data-aos="fade-up-sm" data-aos-delay="50">
                  <div className="content">
                    <p className="" style={{color: "#14C2A3"}}>Features 4</p>
                    <h2 className="text-white mb-8">
                      Built in flash exchange provides the best transaction price
                    </h2>
                    <p className="mb-6">
                      Unlimited liquidity pool can ensure real-time transactions without volume restrictions. Click to obtain the best exchange rate to defeat all CEX, DEX, and cross chain bridges!
                    </p>
                  </div>
                </div>
                <div className="col-lg-6" data-aos="fade-up-sm" data-aos-delay="100">
                  <div className="feature-img">
                    <img width="527" height="551" src="https://scource-static.funibet.com/beingfi/images/bg/zd.png" alt="" className="img-fluid" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Asset部分 */}
        <section className="" id="Pricing">
          <div className="container">
            <div className="row justify-center mb-14">
              <div className="col-lg-10">
                <div className="text-center">
                  <p data-aos="fade-up-sm" data-aos-delay="50" style={{color: "#14C2A3"}}>
                    Asset
                  </p>
                  <h2 className="text-white mb-5" data-aos="fade-up-sm" data-aos-delay="100">
                    50+ blockchain networks, 800+ cryptocurrencies, 50+ NFTs, 100+ fiat currencies
                  </h2>
                  <p className="mb-0" data-aos="fade-up-sm" data-aos-delay="150">
                    Continuously increasing...
                  </p>
                </div>

                <div className="text-center mt-24" data-aos="fade-up-sm" data-aos-delay="200">
                  <div className="switch-wrapper border d-inline-flex rounded p-2 bg-dark-blue-4">
                    <label className="txtBrightness" style={{color: "#14C2A3", cursor: "pointer"}}>Crypto</label>
                    <label className="txtBrightness" style={{color: "#A7AABC", cursor: "pointer"}}>NFT</label>
                    <label className="txtBrightness" style={{color: "#A7AABC", cursor: "pointer"}}>Fiat</label>
                    <span className="highliteer"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* 加密货币网络展示 */}
        <section className="bg-dark-blue-4 py-lg-10">
          <div className="webTop">
            <div style={{width: "100%"}} className="webHead">
              <img className="web3" src="https://bepay.one/assets/images/web3/1.png" alt="" />
              <img className="web3" src="https://bepay.one/assets/images/web3/2.png" alt="" />
              <img className="web3" src="https://bepay.one/assets/images/web3/3.png" alt="" />
              <img className="web3" src="https://bepay.one/assets/images/web3/4.png" alt="" />
              <img className="web3" src="https://bepay.one/assets/images/web3/5.png" alt="" />
              <img className="web3" src="https://bepay.one/assets/images/web3/6.png" alt="" />
              <img className="web3" src="https://bepay.one/assets/images/web3/7.png" alt="" />
              <img className="web3" src="https://bepay.one/assets/images/web3/8.png" alt="" />
              <img className="web3" src="https://bepay.one/assets/images/web3/9.png" alt="" />
              <img className="web3" src="https://bepay.one/assets/images/web3/10.png" alt="" />
              <img className="web3" src="https://bepay.one/assets/images/web3/11.png" alt="" />
              <img className="web3" src="https://bepay.one/assets/images/web3/12.png" alt="" />
              <img className="web3" src="https://bepay.one/assets/images/web3/13.png" alt="" />
              <img className="web3" src="https://bepay.one/assets/images/web3/14.png" alt="" />
            </div>
          </div>
        </section>
        
        {/* 功能特点部分 */}
        <section className="pt-10 pt-lg-15 pb-20 pb-lg-30" id="Function">
          <div className="container">
            <div className="row justify-center mb-18">
              <div className="col-lg-9">
                <div className="text-center">
                  <h1 className="text-white mb-0" data-aos="fade-up-sm" data-aos-delay="100">
                    Main functions
                  </h1>
                </div>
              </div>
            </div>
            
            <div className="row g-6 g-xl-14">
              <div className="col-sm-6 col-lg-3" data-aos="fade-up-sm" data-aos-delay="50">
                <div className="item-feature text-center h-100">
                  <div className="icon text-gradient-primary mx-auto">
                    <img src="https://bepay.one/assets/images/icons/f1.png" alt="icon" />
                  </div>
                  <h5 className="mb-4">Asset storage</h5>
                  <p>Store cryptocurrencies, fiat currencies, and NFTs safely in one place.</p>
                </div>
              </div>

              <div className="col-sm-6 col-lg-3" data-aos="fade-up-sm" data-aos-delay="100">
                <div className="item-feature text-center h-100">
                  <div className="icon text-gradient-primary mx-auto">
                    <img src="https://bepay.one/assets/images/icons/f2.png" alt="icon" />
                  </div>
                  <h5 className="mb-4">Flash Exchange</h5>
                  <p>One-click exchange, obtaining the best exchange rate through aggregation.</p>
                </div>
              </div>

              <div className="col-sm-6 col-lg-3" data-aos="fade-up-sm" data-aos-delay="150">
                <div className="item-feature text-center h-100">
                  <div className="icon text-gradient-primary mx-auto">
                    <img src="https://bepay.one/assets/images/icons/f3.png" alt="icon" />
                  </div>
                  <h5 className="mb-4">Buying and Selling</h5>
                  <p>Buy and sell cryptocurrencies and fiat currencies through peer-to-peer transactions.</p>
                </div>
              </div>

              <div className="col-sm-6 col-lg-3" data-aos="fade-up-sm" data-aos-delay="200">
                <div className="item-feature text-center h-100">
                  <div className="icon text-gradient-primary mx-auto">
                    <img src="https://bepay.one/assets/images/icons/f4.png" alt="icon" />
                  </div>
                  <h5 className="mb-4">Cross Chain Bridge</h5>
                  <p>Enabling any cross chain transactions between the major chains.</p>
                </div>
              </div>

              <div className="col-sm-6 col-lg-3" data-aos="fade-up-sm" data-aos-delay="50">
                <div className="item-feature text-center h-100">
                  <div className="icon text-gradient-primary mx-auto">
                    <img src="https://bepay.one/assets/images/icons/f5.png" alt="icon" />
                  </div>
                  <h5 className="mb-4">Merchant Payment</h5>
                  <p>Provide one-stop payment solutions for various scenarios such as merchants.</p>
                </div>
              </div>

              <div className="col-sm-6 col-lg-3" data-aos="fade-up-sm" data-aos-delay="100">
                <div className="item-feature text-center h-100">
                  <div className="icon text-gradient-primary mx-auto">
                    <img src="https://bepay.one/assets/images/icons/f6.png" alt="icon" />
                  </div>
                  <h5 className="mb-4">Digital collection</h5>
                  <p>Easily store and trade your favorite NFT digital collections.</p>
                </div>
              </div>

              <div className="col-sm-6 col-lg-3" data-aos="fade-up-sm" data-aos-delay="150">
                <div className="item-feature text-center h-100">
                  <div className="icon text-gradient-primary mx-auto">
                    <img src="https://bepay.one/assets/images/icons/f7.png" alt="icon" />
                  </div>
                  <h5 className="mb-4">Web3 social</h5>
                  <p>Web3 social data with blockchain attributes and users owning data permissions.</p>
                </div>
              </div>

              <div className="col-sm-6 col-lg-3" data-aos="fade-up-sm" data-aos-delay="200">
                <div className="item-feature text-center h-100">
                  <div className="icon text-gradient-primary mx-auto">
                    <img src="https://bepay.one/assets/images/icons/f8.png" alt="icon" />
                  </div>
                  <h5 className="mb-4">Secure multi-signature</h5>
                  <p>Create multi-signature wallets to enhance on-chain asset security.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* 合作伙伴部分 */}
        <section className="py-10 py-lg-15" id="Client">
          <div className="container">
            <div className="row justify-center mb-18">
              <div className="col-lg-9">
                <div className="text-center">
                  <h6 className="text-gradient-2 mb-6" data-aos="fade-up-sm" data-aos-delay="50">
                    Partners
                  </h6>
                  <h2 className="text-white mb-0" data-aos="fade-up-sm" data-aos-delay="100">
                    Trusted by mainstream financial institutions and platforms
                  </h2>
                </div>
              </div>
            </div>
            
            <div className="row g-6 g-xl-14 align-center">
              <div className="col-6 col-sm-4 col-lg-3 col-xl-2" data-aos="fade-up-sm" data-aos-delay="50">
                <img src="https://bepay.one/assets/images/client/1.png" alt="Client" className="d-block mx-auto img-fluid" />
              </div>
              <div className="col-6 col-sm-4 col-lg-3 col-xl-2" data-aos="fade-up-sm" data-aos-delay="100">
                <img src="https://bepay.one/assets/images/client/2.png" alt="Client" className="d-block mx-auto img-fluid" />
              </div>
              <div className="col-6 col-sm-4 col-lg-3 col-xl-2" data-aos="fade-up-sm" data-aos-delay="150">
                <img src="https://bepay.one/assets/images/client/3.png" alt="Client" className="d-block mx-auto img-fluid" />
              </div>
              <div className="col-6 col-sm-4 col-lg-3 col-xl-2" data-aos="fade-up-sm" data-aos-delay="200">
                <img src="https://bepay.one/assets/images/client/4.png" alt="Client" className="d-block mx-auto img-fluid" />
              </div>
              <div className="col-6 col-sm-4 col-lg-3 col-xl-2" data-aos="fade-up-sm" data-aos-delay="250">
                <img src="https://bepay.one/assets/images/client/5.png" alt="Client" className="d-block mx-auto img-fluid" />
              </div>
              <div className="col-6 col-sm-4 col-lg-3 col-xl-2" data-aos="fade-up-sm" data-aos-delay="300">
                <img src="https://bepay.one/assets/images/client/6.png" alt="Client" className="d-block mx-auto img-fluid" />
              </div>
              <div className="col-6 col-sm-4 col-lg-3 col-xl-2" data-aos="fade-up-sm" data-aos-delay="350">
                <img src="https://bepay.one/assets/images/client/7.png" alt="Client" className="d-block mx-auto img-fluid" />
              </div>
              <div className="col-6 col-sm-4 col-lg-3 col-xl-2" data-aos="fade-up-sm" data-aos-delay="400">
                <img src="https://bepay.one/assets/images/client/8.png" alt="Client" className="d-block mx-auto img-fluid" />
              </div>
              <div className="col-6 col-sm-4 col-lg-3 col-xl-2" data-aos="fade-up-sm" data-aos-delay="450">
                <img src="https://bepay.one/assets/images/client/9.png" alt="Client" className="d-block mx-auto img-fluid" />
              </div>
              <div className="col-6 col-sm-4 col-lg-3 col-xl-2" data-aos="fade-up-sm" data-aos-delay="500">
                <img src="https://bepay.one/assets/images/client/10.png" alt="Client" className="d-block mx-auto img-fluid" />
              </div>
              <div className="col-6 col-sm-4 col-lg-3 col-xl-2" data-aos="fade-up-sm" data-aos-delay="550">
                <img src="https://bepay.one/assets/images/client/11.png" alt="Client" className="d-block mx-auto img-fluid" />
              </div>
              <div className="col-6 col-sm-4 col-lg-3 col-xl-2" data-aos="fade-up-sm" data-aos-delay="600">
                <img src="https://bepay.one/assets/images/client/12.png" alt="Client" className="d-block mx-auto img-fluid" />
              </div>
            </div>
          </div>
        </section>
        
        {/* 页脚部分 */}
        <footer className="bg-darken">
          <div className="py-16">
            <div className="container">
              <div className="row justify-center">
                <div className="col-xl-10">
                  <div className="text-center">
                    <div className="d-inline-block mb-16">
                      <img src="/assets/logo.png" alt="" width="250" height="55" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center py-6 mt-8">
                <p className="fs-sm mb-0">
                  Copyright <span style={{color: "#14C2A3"}}>BeingFi</span>.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}