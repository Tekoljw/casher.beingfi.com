// 支付API数据
export const paymentApis = [
  {
    id: 1,
    name: "Stripe",
    description: "全球流行的支付处理平台，支持信用卡和借记卡支付",
    logo: "https://source.unsplash.com/random/800x600/?payment,stripe",
    documentationUrl: "https://stripe.com/docs/api",
    isIntegrated: true
  },
  {
    id: 2,
    name: "PayPal",
    description: "全球领先的在线支付系统，支持多币种支付",
    logo: "https://source.unsplash.com/random/800x600/?payment,paypal",
    documentationUrl: "https://developer.paypal.com/docs/api/overview/",
    isIntegrated: true
  },
  {
    id: 3,
    name: "支付宝",
    description: "中国最大的移动支付平台，支持扫码支付和跨境支付",
    logo: "https://source.unsplash.com/random/800x600/?payment,alipay",
    documentationUrl: "https://opendocs.alipay.com/apis",
    isIntegrated: true
  },
  {
    id: 4,
    name: "微信支付",
    description: "中国流行的移动支付平台，支持扫码支付和小程序支付",
    logo: "https://source.unsplash.com/random/800x600/?payment,wechat",
    documentationUrl: "https://pay.weixin.qq.com/wiki/doc/api/index.html",
    isIntegrated: true
  },
  {
    id: 5,
    name: "Coinbase",
    description: "加密货币支付解决方案，支持比特币和其他数字货币",
    logo: "https://source.unsplash.com/random/800x600/?payment,crypto",
    documentationUrl: "https://developers.coinbase.com/api/v2",
    isIntegrated: false
  }
];

// AI模型特点
export const aiFeatures = [
  {
    id: 1,
    title: "自动代码生成",
    description: "DeepSeek-Coder 能够根据支付API文档自动生成集成代码，减少开发时间",
    icon: "Code"
  },
  {
    id: 2,
    title: "多语言支持",
    description: "支持JavaScript, Python, Java, PHP等多种编程语言的代码生成",
    icon: "Languages"
  },
  {
    id: 3,
    title: "文档分析",
    description: "智能分析API文档，提取关键参数和接口定义",
    icon: "FileSearch"
  },
  {
    id: 4,
    title: "代码优化",
    description: "生成的代码经过优化，确保性能和安全性",
    icon: "Sparkles"
  },
  {
    id: 5,
    title: "错误处理",
    description: "自动包含完善的错误处理和异常捕获逻辑",
    icon: "ShieldCheck"
  }
];

// 伙伴数据
export const partners = [
  { id: 1, name: "VisaMaster", logo: "https://source.unsplash.com/random/120x80/?visa" },
  { id: 2, name: "BankTech", logo: "https://source.unsplash.com/random/120x80/?bank" },
  { id: 3, name: "PayWave", logo: "https://source.unsplash.com/random/120x80/?payment" },
  { id: 4, name: "DigiPay", logo: "https://source.unsplash.com/random/120x80/?digital" },
  { id: 5, name: "GlobalPay", logo: "https://source.unsplash.com/random/120x80/?global" },
  { id: 6, name: "CryptoEx", logo: "https://source.unsplash.com/random/120x80/?crypto" }
];

// 定价方案
export const pricingPlans = [
  {
    id: 1,
    name: "基础版",
    price: "0.1 USDT",
    unit: "次",
    features: [
      "每次AI交互消费0.1 USDT",
      "不限制集成项目数量",
      "基础技术支持",
      "代码生成功能"
    ],
    cta: "立即开始"
  },
  {
    id: 2,
    name: "专业版",
    price: "50 USDT",
    unit: "月",
    features: [
      "每月500次AI交互",
      "不限制集成项目数量",
      "优先技术支持",
      "代码优化建议",
      "代码示例库访问权限"
    ],
    cta: "联系销售",
    highlighted: true
  },
  {
    id: 3,
    name: "企业版",
    price: "定制",
    unit: "",
    features: [
      "无限AI交互",
      "不限制集成项目数量",
      "24/7专属技术支持",
      "专属集成顾问",
      "API定制开发服务",
      "SLA保障"
    ],
    cta: "联系我们"
  }
];
