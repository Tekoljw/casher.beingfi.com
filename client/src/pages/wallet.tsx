import React, { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import logo from "@assets/logo.png";
import walletImage from "@assets/bepay_image.jpg";

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
    let element = document.getElementById('kkk');
    
    if (!element) return;

    function typeWriter() {
      const currentWord = words[wordIndex];
      
      if (isDeleting) {
        element.textContent = currentWord.substring(0, letterIndex - 1);
        letterIndex--;
        typeSpeed = 50;
      } else {
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
    <div className="min-h-screen bg-dark pt-24 pb-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* 顶部背景装饰 */}
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-r from-accent/20 to-purple-600/20 opacity-50 -z-10"></div>
          <div className="absolute top-40 right-20 w-72 h-72 rounded-full bg-blue-600/20 filter blur-3xl -z-10"></div>
          <div className="absolute top-60 left-10 w-36 h-36 rounded-full bg-accent/30 filter blur-3xl -z-10"></div>

          <div className="mb-8 relative">
            <h1 className="text-3xl font-bold mb-2">我的钱包</h1>
            <p className="text-gray-400">管理您的BeingFi账户资金和交易记录</p>
            
            {/* 装饰线条 */}
            <div className="absolute -bottom-4 left-0 h-1 w-20 bg-gradient-to-r from-accent to-purple-600"></div>
          </div>

          {/* 余额卡片 - 更高级的设计 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="col-span-2">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-accent/20 via-purple-600/20 to-blue-600/20 border border-accent/20 p-6">
                {/* 装饰元素 */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/20 rounded-full filter blur-xl"></div>
                <div className="absolute bottom-0 left-10 w-20 h-20 bg-blue-600/30 rounded-full filter blur-xl"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 rounded-full bg-accent/30 flex items-center justify-center mr-4">
                      <i className="text-xl">💰</i>
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-300 font-normal">钱包总资产（USDT）</h3>
                      <p className="text-xs text-gray-400">更新于 {new Date().toLocaleString('zh-CN')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-end mb-6">
                    <div className="text-5xl font-bold text-white">{user?.balance || '0.00'}</div>
                    <div className="ml-3 pb-2 text-green-400">≈ ${user?.balance ? (parseFloat(String(user.balance)) * 1).toFixed(2) : '0.00'} USD</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Button className="gradient-btn py-6 rounded-lg">
                      <PlusCircle className="mr-2 h-5 w-5" />
                      充值
                    </Button>
                    <Button variant="outline" className="border-white/20 hover:border-white/40 py-6 rounded-lg bg-dark/40 backdrop-blur-sm">
                      <MinusCircle className="mr-2 h-5 w-5" />
                      提现
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-darkSecondary border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-5 flex items-center">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center mr-3">
                  <i className="text-accent text-sm">📊</i>
                </div>
                交易统计
              </h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 text-sm">本月交易金额</span>
                    <span className="font-semibold text-white">2,799.25 USDT</span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-accent to-purple-600 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-gray-800">
                  <span className="text-gray-400">本月交易笔数</span>
                  <span className="font-semibold">12 笔</span>
                </div>
                
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-400">账户注册时间</span>
                  <span className="font-semibold">2023-03-15</span>
                </div>
              </div>
            </div>
          </div>

          {/* 功能选项卡 */}
          <Tabs
            defaultValue="overview"
            value={currentTab}
            onValueChange={setCurrentTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 mb-8 p-1 bg-darkSecondary rounded-lg">
              <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-md">
                交易记录
              </TabsTrigger>
              <TabsTrigger value="deposit" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-md">
                充值
              </TabsTrigger>
              <TabsTrigger value="withdraw" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-md">
                提现
              </TabsTrigger>
            </TabsList>

            {/* 交易记录内容 - 更现代化设计 */}
            <TabsContent value="overview" className="mt-0">
              <div className="bg-darkSecondary border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold mb-1">近期交易</h3>
                    <p className="text-gray-400 text-sm">查看您的最近交易记录和状态</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center px-3 py-1.5 rounded-full bg-dark/50 border border-gray-800 text-xs">
                      <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                      <span>充值</span>
                    </div>
                    <div className="flex items-center px-3 py-1.5 rounded-full bg-dark/50 border border-gray-800 text-xs">
                      <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                      <span>提现/支付</span>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 pb-4">
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div 
                        key={transaction.id} 
                        className="flex items-center justify-between p-4 bg-dark rounded-lg border border-gray-800 hover:border-accent/20 hover:shadow-sm hover:shadow-accent/5 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 mr-4 group-hover:from-accent/10 group-hover:to-purple-700/10 transition-all">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-dark">
                              {getTypeIcon(transaction.type)}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium flex items-center">
                              {transaction.type}
                              <div className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-800 text-gray-400 flex items-center">
                                {getStatusIcon(transaction.status)}
                                <span className="ml-1">
                                  {transaction.status === 'completed' ? '已完成' : 
                                  transaction.status === 'pending' ? '处理中' : '失败'}
                                </span>
                              </div>
                            </div>
                            <div className="text-sm text-gray-400">{transaction.date}</div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="text-right mr-4">
                            <div className={`font-semibold text-lg ${transaction.amount.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                              {transaction.amount} {transaction.currency}
                            </div>
                          </div>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-accent/10 text-accent group-hover:bg-accent/20 transition-all">
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border-t border-gray-800 py-4 px-6">
                  <Button variant="outline" className="w-full border-gray-700 hover:border-accent/40 hover:bg-accent/5 rounded-lg py-6">
                    查看全部交易记录
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* 充值内容 - 更现代化设计 */}
            <TabsContent value="deposit" className="mt-0">
              <div className="bg-darkSecondary border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-gray-800 bg-gradient-to-r from-accent/5 to-purple-600/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold mb-1">充值到钱包</h3>
                      <p className="text-gray-400 text-sm">选择以下任一支付渠道向您的钱包充值</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent/20 to-purple-600/20 flex items-center justify-center">
                      <i className="text-2xl">💰</i>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid gap-3">
                    {depositChannels.map((channel) => (
                      <div key={channel.id} className="bg-dark rounded-xl overflow-hidden border border-gray-800 hover:border-accent/20 transition-all group cursor-pointer">
                        <div className="p-5 flex items-center justify-between relative">
                          {/* 装饰背景元素 */}
                          <div className="absolute right-0 bottom-0 w-24 h-24 rounded-full bg-gradient-to-r from-accent/5 to-purple-600/5 filter blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          
                          <div className="flex items-center z-10">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center mr-4 group-hover:from-accent/10 group-hover:to-purple-700/10 transition-all">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-dark text-xl">
                                {channel.icon}
                              </div>
                            </div>
                            <div>
                              <div className="font-medium text-lg mb-1">{channel.name}</div>
                              <div className="flex items-center space-x-4 text-sm">
                                <div className="text-gray-400 flex items-center">
                                  <PlusCircle className="h-3 w-3 mr-1" />
                                  充值范围: <span className="text-white ml-1">{channel.minAmount} - {channel.maxAmount} USDT</span>
                                </div>
                                <div className="text-gray-400 flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  <span className="text-white ml-1">实时到账</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-accent/10 text-accent group-hover:bg-accent/20 transition-all z-10">
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center mt-5 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-300">
                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    <p className="text-sm">
                      充值到账时间视网络情况而定，通常在30分钟内完成。充值问题请联系客服。
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 提现内容 - 更现代化设计 */}
            <TabsContent value="withdraw" className="mt-0">
              <div className="bg-darkSecondary border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-gray-800 bg-gradient-to-r from-purple-600/5 to-accent/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold mb-1">提现</h3>
                      <p className="text-gray-400 text-sm">从您的钱包中提取资金到外部钱包或银行账户</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600/20 to-accent/20 flex items-center justify-center">
                      <i className="text-2xl">💸</i>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid gap-3">
                    {withdrawChannels.map((channel) => (
                      <div key={channel.id} className="bg-dark rounded-xl overflow-hidden border border-gray-800 hover:border-accent/20 transition-all group cursor-pointer">
                        <div className="p-5 flex items-center justify-between relative">
                          {/* 装饰背景元素 */}
                          <div className="absolute right-0 bottom-0 w-24 h-24 rounded-full bg-gradient-to-r from-purple-600/5 to-accent/5 filter blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          
                          <div className="flex items-center z-10">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center mr-4 group-hover:from-purple-700/10 group-hover:to-accent/10 transition-all">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-dark text-xl">
                                {channel.icon}
                              </div>
                            </div>
                            <div>
                              <div className="font-medium text-lg mb-1">{channel.name}</div>
                              <div className="flex flex-col space-y-1 text-sm">
                                <div className="text-gray-400 flex items-center">
                                  <MinusCircle className="h-3 w-3 mr-1" />
                                  最低提现: <span className="text-white ml-1">{channel.minAmount} USDT</span>
                                </div>
                                <div className="text-gray-400 flex items-center">
                                  <ReceiptText className="h-3 w-3 mr-1" />
                                  手续费率: <span className="text-white ml-1">{channel.fee}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-accent/10 text-accent group-hover:bg-accent/20 transition-all z-10">
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-5 p-5 bg-dark rounded-xl border border-gray-800">
                    <h4 className="text-lg font-medium mb-3">快速提现</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <label className="text-sm text-gray-400">提现地址</label>
                        <div className="flex">
                          <input 
                            type="text" 
                            placeholder="输入您的USDT-TRC20地址" 
                            className="flex-1 py-2 px-3 bg-darkSecondary border border-gray-800 rounded-l-lg focus:border-accent/50 focus:outline-none"
                          />
                          <button className="bg-darkSecondary border border-l-0 border-gray-800 px-3 rounded-r-lg text-gray-400 hover:text-white">
                            粘贴
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-gray-400">提现金额</label>
                        <div className="flex">
                          <input 
                            type="text" 
                            placeholder="最低100 USDT" 
                            className="flex-1 py-2 px-3 bg-darkSecondary border border-gray-800 rounded-l-lg focus:border-accent/50 focus:outline-none"
                          />
                          <button className="bg-darkSecondary border border-l-0 border-gray-800 px-3 rounded-r-lg text-gray-400 hover:text-white">
                            全部
                          </button>
                        </div>
                      </div>
                    </div>
                    <Button className="gradient-btn w-full py-6 rounded-lg">立即提现</Button>
                  </div>
                  
                  <div className="flex items-center mt-5 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-300">
                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    <p className="text-sm">
                      提现处理时间通常需要1-24小时，请确保填写正确的提现地址。如有问题请联系客服。
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          {/* 安全提示 */}
          <div className="mt-8 p-4 bg-darkSecondary rounded-lg border border-gray-800">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h3 className="font-medium mb-2">安全提示</h3>
                <p className="text-sm text-gray-400">
                  请勿向任何人透露您的账户信息和交易密码。BeingFi官方不会要求您提供密码或验证码。如有任何疑问，请联系官方客服。
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}