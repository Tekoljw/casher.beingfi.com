import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks/use-language";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Gift, Globe, ShieldCheck, CircleDollarSign, ChevronRight, BadgePercent, Clock, ArrowUpRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function UCardPage() {
  const { t } = useLanguage();
  
  // 模拟U卡数据
  const ucards = [
    {
      id: 1,
      name: "Basic U卡",
      balanceLimit: "10,000",
      annualFee: "0",
      cashbackRate: "0.5%",
      benefits: ["基础跨境支付", "无年费", "基本汇率"],
      color: "from-blue-500 to-cyan-500",
      isPopular: false,
    },
    {
      id: 2,
      name: "Premium U卡",
      balanceLimit: "50,000",
      annualFee: "99",
      cashbackRate: "1.5%",
      benefits: ["全球ATM取款", "优惠汇率", "7x24客服支持", "交易返现1.5%"],
      color: "from-accent to-purple-500",
      isPopular: true,
    },
    {
      id: 3,
      name: "Business U卡",
      balanceLimit: "100,000",
      annualFee: "299",
      cashbackRate: "2%",
      benefits: ["企业账户管理", "多币种结算", "优先通道", "交易返现2%", "专属客户经理"],
      color: "from-amber-500 to-orange-600",
      isPopular: false,
    }
  ];
  
  // 模拟U卡功能
  const features = [
    {
      id: 1,
      title: "全球支付",
      description: "在全球范围内自由消费，无需担心货币兑换",
      icon: <Globe className="h-10 w-10 text-blue-500" />,
    },
    {
      id: 2,
      title: "优惠汇率",
      description: "享受优于市场的汇率，节省货币兑换成本",
      icon: <CircleDollarSign className="h-10 w-10 text-green-500" />,
    },
    {
      id: 3,
      title: "交易返现",
      description: "每笔交易享受高达2%的返现奖励",
      icon: <BadgePercent className="h-10 w-10 text-purple-500" />,
    },
    {
      id: 4,
      title: "安全保障",
      description: "多重安全保护机制，资金安全有保障",
      icon: <ShieldCheck className="h-10 w-10 text-amber-500" />,
    }
  ];
  
  // 模拟最近交易
  const recentTransactions = [
    {
      id: 1,
      merchant: "Amazon",
      amount: "128.50",
      currency: "USD",
      date: "2023-05-07",
      cashback: "1.93",
      type: "购物"
    },
    {
      id: 2,
      merchant: "Uber",
      amount: "42.75",
      currency: "USD",
      date: "2023-05-05",
      cashback: "0.64",
      type: "交通"
    },
    {
      id: 3,
      merchant: "Starbucks",
      amount: "9.25",
      currency: "USD",
      date: "2023-05-03",
      cashback: "0.14",
      type: "餐饮"
    },
    {
      id: 4,
      merchant: "Netflix",
      amount: "15.99",
      currency: "USD",
      date: "2023-05-01",
      cashback: "0.24",
      type: "订阅"
    }
  ];

  return (
    <div className="min-h-screen bg-dark">
      <Header />
      
      {/* 顶部彩带 */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"></div>
      
      <div className="container mx-auto px-4 pt-24 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">BeingFi U卡</h1>
            <p className="text-gray-400">全球无界支付，享受更多权益</p>
          </div>
          
          {/* U卡选项 */}
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-6">选择适合您的U卡</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ucards.map((card) => (
                <div key={card.id} className="relative">
                  {card.isPopular && (
                    <div className="absolute -top-3 -right-3 z-10">
                      <div className="bg-gradient-to-r from-accent to-purple-500 text-white text-xs rounded-full px-3 py-1 font-semibold">
                        热门选择
                      </div>
                    </div>
                  )}
                  <Card className={`bg-darkSecondary border-gray-800 h-full ${card.isPopular ? 'shadow-lg shadow-accent/10 border-accent/30' : ''}`}>
                    <CardHeader className={`bg-gradient-to-r ${card.color} rounded-t-lg pt-6 pb-6`}>
                      <div className="flex items-center justify-center mb-2">
                        <CreditCard className="h-10 w-10 text-white" />
                      </div>
                      <CardTitle className="text-center">{card.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="text-center mb-6">
                        <div className="text-3xl font-bold">{card.annualFee} USDT</div>
                        <p className="text-gray-400 text-sm">年费</p>
                      </div>
                      
                      <div className="space-y-4 mb-6">
                        <div className="flex justify-between">
                          <span className="text-gray-400">额度上限</span>
                          <span className="font-medium">{card.balanceLimit} USDT</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">返现比例</span>
                          <span className="font-medium text-green-500">{card.cashbackRate}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {card.benefits.map((benefit, index) => (
                          <div key={index} className="flex items-center">
                            <div className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center mr-3">
                              <div className="w-2 h-2 rounded-full bg-accent"></div>
                            </div>
                            <span className="text-sm">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className={`w-full ${card.isPopular ? 'gradient-btn' : 'bg-darkSecondary border border-gray-700 hover:border-accent/60 hover:bg-accent/10'}`}>
                        申请U卡
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              ))}
            </div>
          </div>
          
          {/* U卡虚拟展示 */}
          <div className="mb-12 overflow-hidden rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-bold mb-4">虚拟U卡，即刻可用</h2>
                <p className="text-gray-300 mb-6">
                  申请通过后立即获得虚拟U卡，无需等待实体卡片邮寄。充值后即可在全球范围内消费，享受优惠汇率和交易返现。
                </p>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-accent mr-3" />
                    <span>最快5分钟完成审核</span>
                  </div>
                  <div className="flex items-center">
                    <Gift className="h-5 w-5 text-accent mr-3" />
                    <span>首次充值满500USDT赠送50USDT</span>
                  </div>
                  <div className="flex items-center">
                    <ShieldCheck className="h-5 w-5 text-accent mr-3" />
                    <span>全额保障，资金安全</span>
                  </div>
                </div>
                <Button className="gradient-btn mt-6">
                  立即申请
                </Button>
              </div>
              <div className="flex justify-center">
                <div className="relative w-80 h-48 bg-gradient-to-r from-accent to-purple-600 rounded-xl shadow-2xl shadow-accent/20 p-4 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <div className="absolute top-4 left-4">
                    <div className="text-white/80 text-xs">BeingFi</div>
                    <div className="text-white font-bold mt-1">Premium U卡</div>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <div className="text-white/80 text-xs">卡号</div>
                    <div className="text-white font-medium">**** **** **** 5678</div>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <CreditCard className="h-6 w-6 text-white/90" />
                  </div>
                  <div className="absolute top-4 right-4">
                    <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* U卡功能 */}
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-6">U卡功能</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <Card key={feature.id} className="bg-darkSecondary border-gray-800 hover:border-gray-700 transition-all">
                  <CardContent className="pt-6">
                    <div className="text-center mb-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-dark mb-4">
                        {feature.icon}
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                      <p className="text-gray-400 text-sm">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          {/* 返现交易记录 */}
          <div>
            <h2 className="text-xl font-semibold mb-6">U卡交易示例</h2>
            <Card className="bg-darkSecondary border-gray-800">
              <CardHeader>
                <CardTitle>近期交易与返现</CardTitle>
                <CardDescription>体验U卡的交易返现功能</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-dark rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center mr-4">
                          <ArrowUpRight className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <div className="font-medium">{transaction.merchant}</div>
                          <div className="text-sm text-gray-400">{transaction.date} · {transaction.type}</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="text-right mr-4">
                          <div className="font-semibold text-red-500">
                            -{transaction.amount} {transaction.currency}
                          </div>
                          <div className="text-sm text-green-500">
                            返现 +{transaction.cashback} USDT
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="text-center text-gray-400 text-sm">
                * 实际交易返现以U卡等级和当前活动为准
              </CardFooter>
            </Card>
          </div>
          
          {/* 申请流程 */}
          <div className="mt-12 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-8 border border-blue-500/20">
            <div className="text-center max-w-xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">简单三步，开通U卡</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-accent/30 flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold">1</span>
                  </div>
                  <h3 className="font-medium mb-2">填写申请</h3>
                  <p className="text-sm text-gray-300">提交个人信息和必要文件</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-accent/30 flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold">2</span>
                  </div>
                  <h3 className="font-medium mb-2">等待审核</h3>
                  <p className="text-sm text-gray-300">最快5分钟完成审核</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-accent/30 flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold">3</span>
                  </div>
                  <h3 className="font-medium mb-2">激活使用</h3>
                  <p className="text-sm text-gray-300">充值后即可全球使用</p>
                </div>
              </div>
              <Button className="gradient-btn px-8 py-6 text-lg">
                立即申请U卡
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* 页脚 */}
      <Footer />
    </div>
  );
}