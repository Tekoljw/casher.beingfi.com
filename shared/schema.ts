import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, json, numeric, uuid, date, jsonb, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// 用户表
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("user"), // 角色: user, admin, merchant
  balance: doublePrecision("balance").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// OTC用户表
export const otcUsers = pgTable("otc_users", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(), // 角色: agent, staff, admin
  fullName: text("full_name"),
  phoneNumber: text("phone_number"),
  address: text("address"),
  idNumber: text("id_number"),
  status: text("status").notNull().default("active"), // active, suspended, inactive
  balance: doublePrecision("balance").notNull().default(0),
  commission: doublePrecision("commission").notNull().default(0), // 佣金比例
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 支付API表
export const paymentApis = pgTable("payment_apis", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  logo: text("logo"),
  documentationUrl: text("documentation_url"),
  isIntegrated: boolean("is_integrated").notNull().default(false),
  // 新增字段
  supportedCountries: text("supported_countries").array(), // 支持的国家
  supportedPaymentMethods: text("supported_payment_methods").array(), // 支持的支付方式
  collectRate: numeric("collect_rate", { precision: 5, scale: 2 }), // 代收费率
  payoutRate: numeric("payout_rate", { precision: 5, scale: 2 }), // 代付费率
  providerName: text("provider_name"), // 供应商名称
  providerDeposit: numeric("provider_deposit", { precision: 10, scale: 2 }), // 供应商保证金
  currency: text("currency").default("USDT"), // 货币类型
  minTransaction: numeric("min_transaction", { precision: 10, scale: 2 }), // 最小交易金额
  maxTransaction: numeric("max_transaction", { precision: 10, scale: 2 }), // 最大交易金额
  settlementTime: text("settlement_time"), // 结算时间，如 "T+1"
  apiStatus: text("api_status").default("active"), // 状态：active, inactive, maintenance
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 集成项目表
export const integrationProjects = pgTable("integration_projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  targetApiId: integer("target_api_id").references(() => paymentApis.id),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"), // draft, in_progress, completed, failed
  apiDocumentation: text("api_documentation"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 与AI的对话历史
export const aiConversations = pgTable("ai_conversations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => integrationProjects.id),
  userId: integer("user_id").notNull().references(() => users.id),
  messages: json("messages").notNull().default([]), // 存储对话历史
  cost: doublePrecision("cost").notNull().default(0.1), // 每次互动的成本
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 交易记录
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: doublePrecision("amount").notNull(),
  type: text("type").notNull(), // recharge, consumption
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 生成的集成代码
export const generatedCode = pgTable("generated_code", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => integrationProjects.id),
  language: text("language").notNull(),
  code: text("code").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// =============== 支付后台系统表 ===============

// 商户表
export const merchants = pgTable("merchants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  merchantCode: text("merchant_code").notNull().unique(), // 商户唯一代码
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
  country: text("country").notNull(),
  address: text("address"),
  businessType: text("business_type").notNull(), // 业务类型：游戏、电商、服务等
  website: text("website"),
  apiKey: text("api_key").notNull().unique(), // API密钥
  secretKey: text("secret_key").notNull(), // 密钥
  callbackUrl: text("callback_url"), // 回调地址
  ipWhitelist: text("ip_whitelist").array(), // IP白名单
  status: text("status").notNull().default("pending"), // pending, active, suspended
  kycStatus: text("kyc_status").notNull().default("not_submitted"), // not_submitted, pending, approved, rejected
  kycDocuments: jsonb("kyc_documents"), // 存储KYC文档信息
  settlementCycle: text("settlement_cycle").default("T+1"), // 结算周期
  depositBalance: numeric("deposit_balance", { precision: 15, scale: 2 }).default("0"), // 保证金余额
  mainBalance: numeric("main_balance", { precision: 15, scale: 2 }).default("0"), // 主账户余额
  feeRate: numeric("fee_rate", { precision: 5, scale: 2 }).default("0"), // 手续费率
  riskLevel: text("risk_level").default("medium"), // low, medium, high
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 管理员表
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  username: text("username").notNull().unique(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  role: text("role").notNull(), // super_admin, finance_admin, risk_admin, customer_service
  permissions: jsonb("permissions"), // 权限配置
  lastLogin: timestamp("last_login"),
  status: text("status").notNull().default("active"), // active, suspended, inactive
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 支付通道表
export const paymentChannels = pgTable("payment_channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // 通道代码
  type: text("type").notNull(), // fiat_collect, fiat_payout, crypto_collect, crypto_payout
  provider: text("provider").notNull(), // 提供商名称
  providerApiUrl: text("provider_api_url"), // 提供商API地址
  apiKey: text("api_key"), // API密钥
  apiSecret: text("api_secret"), // API密钥
  supportedCurrencies: text("supported_currencies").array(), // 支持的货币
  supportedCountries: text("supported_countries").array(), // 支持的国家
  supportedMethods: text("supported_methods").array(), // 支持的支付方式
  minAmount: numeric("min_amount", { precision: 15, scale: 2 }), // 最低交易金额
  maxAmount: numeric("max_amount", { precision: 15, scale: 2 }), // 最高交易金额
  processingTime: text("processing_time"), // 处理时间
  fee: numeric("fee", { precision: 5, scale: 2 }), // 通道手续费率
  fixedFee: numeric("fixed_fee", { precision: 10, scale: 2 }), // 固定手续费
  dailyLimit: numeric("daily_limit", { precision: 15, scale: 2 }), // 日交易限额
  monthlyLimit: numeric("monthly_limit", { precision: 15, scale: 2 }), // 月交易限额
  balance: numeric("balance", { precision: 15, scale: 2 }).default("0"), // 通道余额
  config: jsonb("config"), // 通道特定配置
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0), // 通道优先级
  successRate: numeric("success_rate", { precision: 5, scale: 2 }).default("0"), // 成功率
  riskScore: integer("risk_score").default(50), // 风险评分(0-100)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 商户支付通道关联表
export const merchantChannels = pgTable("merchant_channels", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id),
  channelId: integer("channel_id").notNull().references(() => paymentChannels.id),
  status: text("status").notNull().default("active"), // active, inactive
  customFeeRate: numeric("custom_fee_rate", { precision: 5, scale: 2 }), // 该商户在此通道的定制费率
  customFixedFee: numeric("custom_fixed_fee", { precision: 10, scale: 2 }), // 该商户在此通道的定制固定费用
  dailyLimit: numeric("daily_limit", { precision: 15, scale: 2 }), // 商户在此通道的日限额
  monthlyLimit: numeric("monthly_limit", { precision: 15, scale: 2 }), // 商户在此通道的月限额
  customConfig: jsonb("custom_config"), // 商户在此通道的自定义配置
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 订单表
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNo: text("order_no").notNull().unique(), // 订单号
  merchantId: integer("merchant_id").notNull().references(() => merchants.id),
  channelId: integer("channel_id").references(() => paymentChannels.id),
  merchantOrderId: text("merchant_order_id").notNull(), // 商户订单号
  type: text("type").notNull(), // collect(收款), payout(付款)
  currency: text("currency").notNull(), // 币种
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(), // 订单金额
  actualAmount: numeric("actual_amount", { precision: 15, scale: 2 }), // 实际金额(可能包含手续费)
  fee: numeric("fee", { precision: 10, scale: 2 }), // 手续费
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed, cancelled
  paymentMethod: text("payment_method"), // 支付方式
  customerInfo: jsonb("customer_info"), // 客户信息
  paymentInfo: jsonb("payment_info"), // 支付信息
  errorMessage: text("error_message"), // 错误信息
  callbackStatus: text("callback_status").default("pending"), // pending, success, failed
  callbackResponse: text("callback_response"), // 回调响应
  ipAddress: text("ip_address"), // 请求IP
  deviceInfo: jsonb("device_info"), // 设备信息
  extraData: jsonb("extra_data"), // 额外数据
  completedAt: timestamp("completed_at"), // 完成时间
  expiresAt: timestamp("expires_at"), // 过期时间
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 结算记录表
export const settlements = pgTable("settlements", {
  id: serial("id").primaryKey(),
  settlementNo: text("settlement_no").notNull().unique(), // 结算单号
  merchantId: integer("merchant_id").notNull().references(() => merchants.id),
  currency: text("currency").notNull(), // 币种
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(), // 结算金额
  fee: numeric("fee", { precision: 10, scale: 2 }), // 手续费
  actualAmount: numeric("actual_amount", { precision: 15, scale: 2 }).notNull(), // 实际结算金额
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  type: text("type").notNull(), // manual, automatic
  settlementMethod: text("settlement_method").notNull(), // bank_transfer, crypto_transfer
  accountInfo: jsonb("account_info").notNull(), // 账户信息
  transactionId: text("transaction_id"), // 交易ID
  remark: text("remark"), // 备注
  reviewerId: integer("reviewer_id").references(() => admins.id), // 审核人ID
  reviewedAt: timestamp("reviewed_at"), // 审核时间
  completedAt: timestamp("completed_at"), // 完成时间
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 加密货币钱包表
export const cryptoWallets = pgTable("crypto_wallets", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").references(() => merchants.id), // 可以为null，表示系统钱包
  walletName: text("wallet_name").notNull(),
  walletType: text("wallet_type").notNull(), // hot, cold, custody
  coin: text("coin").notNull(), // BTC, ETH, USDT, etc.
  network: text("network").notNull(), // BTC, ETH, TRX, etc.
  address: text("address").notNull(),
  balance: numeric("balance", { precision: 30, scale: 8 }).default("0"),
  status: text("status").notNull().default("active"), // active, inactive, frozen
  isMultisig: boolean("is_multisig").default(false),
  multisigConfig: jsonb("multisig_config"), // 多签配置
  privateKeyEncrypted: text("private_key_encrypted"), // 加密的私钥（如果适用）
  publicKey: text("public_key"), // 公钥
  tags: text("tags").array(), // 钱包标签
  securityLevel: text("security_level").default("medium"), // low, medium, high
  withdrawalLimit: numeric("withdrawal_limit", { precision: 30, scale: 8 }), // 提款限额
  dailyLimit: numeric("daily_limit", { precision: 30, scale: 8 }), // 日限额
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 加密货币交易记录表
export const cryptoTransactions = pgTable("crypto_transactions", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").references(() => cryptoWallets.id),
  orderId: integer("order_id").references(() => orders.id), // 关联的订单ID（如果有）
  txHash: text("tx_hash").unique(), // 交易哈希
  type: text("type").notNull(), // deposit, withdrawal, transfer
  coin: text("coin").notNull(),
  network: text("network").notNull(),
  fromAddress: text("from_address"),
  toAddress: text("to_address").notNull(),
  amount: numeric("amount", { precision: 30, scale: 8 }).notNull(),
  fee: numeric("fee", { precision: 30, scale: 8 }),
  status: text("status").notNull(), // pending, confirming, completed, failed
  confirmations: integer("confirmations").default(0),
  requiredConfirmations: integer("required_confirmations").default(1),
  blockHeight: integer("block_height"),
  memo: text("memo"), // 交易备注/标签
  riskScore: integer("risk_score"), // 风险评分
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 加密信用卡表
export const cryptoCards = pgTable("crypto_cards", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id),
  userId: integer("user_id").references(() => users.id), // 用户ID (如果适用)
  cardType: text("card_type").notNull(), // virtual, physical
  cardNetwork: text("card_network").notNull(), // visa, mastercard
  cardNumber: text("card_number"), // 卡号（加密存储）
  cardholderName: text("cardholder_name"),
  expiryMonth: integer("expiry_month"),
  expiryYear: integer("expiry_year"),
  cvv: text("cvv"), // CVV（加密存储）
  status: text("status").notNull().default("inactive"), // inactive, active, suspended, expired
  currency: text("currency").notNull(), // 卡币种
  balance: numeric("balance", { precision: 15, scale: 2 }).default("0"),
  spendLimit: jsonb("spend_limit"), // 消费限制
  billingAddress: jsonb("billing_address"), // 账单地址
  linkedWalletId: integer("linked_wallet_id").references(() => cryptoWallets.id), // 关联钱包
  issuedAt: timestamp("issued_at"), // 发卡时间
  activatedAt: timestamp("activated_at"), // 激活时间
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 加密卡交易记录表
export const cardTransactions = pgTable("card_transactions", {
  id: serial("id").primaryKey(),
  cardId: integer("card_id").notNull().references(() => cryptoCards.id),
  transactionId: text("transaction_id").notNull().unique(), // 交易ID
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(), // 交易金额
  currency: text("currency").notNull(), // 交易币种
  originalAmount: numeric("original_amount", { precision: 15, scale: 2 }), // 原始金额（如不同币种）
  originalCurrency: text("original_currency"), // 原始币种
  exchangeRate: numeric("exchange_rate", { precision: 10, scale: 6 }), // 兑换率
  merchantName: text("merchant_name"), // 商户名称
  merchantCategory: text("merchant_category"), // 商户类别
  type: text("type").notNull(), // purchase, refund, decline
  status: text("status").notNull(), // approved, declined, pending, settled
  declineReason: text("decline_reason"), // 拒绝原因
  location: jsonb("location"), // 交易位置
  isInternational: boolean("is_international").default(false), // 是否国际交易
  feeAmount: numeric("fee_amount", { precision: 10, scale: 2 }), // 手续费
  createdAt: timestamp("created_at").notNull().defaultNow(),
  settledAt: timestamp("settled_at"), // 结算时间
});

// 钱包SAAS服务表
export const walletServices = pgTable("wallet_services", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id),
  serviceName: text("service_name").notNull(), // 服务名称
  serviceType: text("service_type").notNull(), // custody, swap, staking, payment
  config: jsonb("config").notNull(), // 服务配置
  status: text("status").notNull().default("inactive"), // inactive, active, suspended
  priceLevel: text("price_level").notNull(), // basic, premium, enterprise
  monthlyFee: numeric("monthly_fee", { precision: 10, scale: 2 }),
  transactionFeeRate: numeric("transaction_fee_rate", { precision: 5, scale: 2 }),
  supportedCoins: text("supported_coins").array(), // 支持的币种
  contractStart: date("contract_start"), // 合约开始日期
  contractEnd: date("contract_end"), // 合约结束日期
  lastBillingDate: date("last_billing_date"), // 上次计费日期
  nextBillingDate: date("next_billing_date"), // 下次计费日期
  apiQuota: integer("api_quota"), // API调用配额
  apiUsage: integer("api_usage").default(0), // API调用使用量
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 系统日志表
export const systemLogs = pgTable("system_logs", {
  id: serial("id").primaryKey(),
  logType: text("log_type").notNull(), // info, warning, error, security, audit
  source: text("source").notNull(), // 日志来源模块
  message: text("message").notNull(), // 日志消息
  details: jsonb("details"), // 详细信息
  userId: integer("user_id").references(() => users.id), // 关联用户（如果适用）
  merchantId: integer("merchant_id").references(() => merchants.id), // 关联商户（如果适用）
  adminId: integer("admin_id").references(() => admins.id), // 关联管理员（如果适用）
  ipAddress: text("ip_address"), // IP地址
  userAgent: text("user_agent"), // User-Agent
  severity: text("severity").default("info"), // info, warning, error, critical
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 关系定义
export const usersRelations = relations(users, ({ many, one }) => ({
  integrationProjects: many(integrationProjects),
  transactions: many(transactions),
  aiConversations: many(aiConversations),
  otcUser: one(otcUsers, {
    fields: [users.id],
    references: [otcUsers.userId],
  }),
  merchant: one(merchants, {
    fields: [users.id],
    references: [merchants.userId],
  }),
  admin: one(admins, {
    fields: [users.id],
    references: [admins.userId],
  }),
  cryptoCards: many(cryptoCards),
}));

export const otcUsersRelations = relations(otcUsers, ({ one }) => ({
  user: one(users, {
    fields: [otcUsers.userId],
    references: [users.id],
  }),
}));

export const integrationProjectsRelations = relations(integrationProjects, ({ one, many }) => ({
  user: one(users, {
    fields: [integrationProjects.userId],
    references: [users.id],
  }),
  targetApi: one(paymentApis, {
    fields: [integrationProjects.targetApiId],
    references: [paymentApis.id],
  }),
  aiConversations: many(aiConversations),
  generatedCode: many(generatedCode),
}));

// 支付后台系统关系定义
export const merchantsRelations = relations(merchants, ({ one, many }) => ({
  user: one(users, {
    fields: [merchants.userId],
    references: [users.id],
  }),
  orders: many(orders),
  settlements: many(settlements),
  merchantChannels: many(merchantChannels),
  cryptoWallets: many(cryptoWallets),
  cryptoCards: many(cryptoCards),
  walletServices: many(walletServices),
}));

export const adminsRelations = relations(admins, ({ one, many }) => ({
  user: one(users, {
    fields: [admins.userId],
    references: [users.id],
  }),
  settlementsReviewed: many(settlements, { relationName: "reviewer" }),
}));

export const paymentChannelsRelations = relations(paymentChannels, ({ many }) => ({
  merchantChannels: many(merchantChannels),
  orders: many(orders),
}));

export const merchantChannelsRelations = relations(merchantChannels, ({ one }) => ({
  merchant: one(merchants, {
    fields: [merchantChannels.merchantId],
    references: [merchants.id],
  }),
  channel: one(paymentChannels, {
    fields: [merchantChannels.channelId],
    references: [paymentChannels.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [orders.merchantId],
    references: [merchants.id],
  }),
  channel: one(paymentChannels, {
    fields: [orders.channelId],
    references: [paymentChannels.id],
  }),
  cryptoTransactions: many(cryptoTransactions),
}));

export const settlementsRelations = relations(settlements, ({ one }) => ({
  merchant: one(merchants, {
    fields: [settlements.merchantId],
    references: [merchants.id],
  }),
  reviewer: one(admins, {
    fields: [settlements.reviewerId],
    references: [admins.id],
  }),
}));

export const cryptoWalletsRelations = relations(cryptoWallets, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [cryptoWallets.merchantId],
    references: [merchants.id],
  }),
  cryptoTransactions: many(cryptoTransactions),
  cryptoCards: many(cryptoCards),
}));

export const cryptoTransactionsRelations = relations(cryptoTransactions, ({ one }) => ({
  wallet: one(cryptoWallets, {
    fields: [cryptoTransactions.walletId],
    references: [cryptoWallets.id],
  }),
  order: one(orders, {
    fields: [cryptoTransactions.orderId],
    references: [orders.id],
  }),
}));

export const cryptoCardsRelations = relations(cryptoCards, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [cryptoCards.merchantId],
    references: [merchants.id],
  }),
  user: one(users, {
    fields: [cryptoCards.userId],
    references: [users.id],
  }),
  linkedWallet: one(cryptoWallets, {
    fields: [cryptoCards.linkedWalletId],
    references: [cryptoWallets.id],
  }),
  cardTransactions: many(cardTransactions),
}));

export const cardTransactionsRelations = relations(cardTransactions, ({ one }) => ({
  card: one(cryptoCards, {
    fields: [cardTransactions.cardId],
    references: [cryptoCards.id],
  }),
}));

export const walletServicesRelations = relations(walletServices, ({ one }) => ({
  merchant: one(merchants, {
    fields: [walletServices.merchantId],
    references: [merchants.id],
  }),
}));

// 数据插入模式定义
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
});

export const insertOtcUserSchema = createInsertSchema(otcUsers).pick({
  userId: true,
  username: true,
  password: true,
  email: true,
  role: true,
  fullName: true,
  phoneNumber: true,
  address: true,
  idNumber: true,
  commission: true,
});

export const insertPaymentApiSchema = createInsertSchema(paymentApis).pick({
  name: true,
  description: true,
  logo: true,
  documentationUrl: true,
  isIntegrated: true,
  supportedCountries: true,
  supportedPaymentMethods: true,
  collectRate: true,
  payoutRate: true,
  providerName: true,
  providerDeposit: true,
  currency: true,
  minTransaction: true,
  maxTransaction: true,
  settlementTime: true,
  apiStatus: true,
});

export const insertIntegrationProjectSchema = createInsertSchema(integrationProjects).pick({
  userId: true,
  targetApiId: true,
  name: true,
  description: true,
  apiDocumentation: true,
});

export const insertAiConversationSchema = createInsertSchema(aiConversations).pick({
  projectId: true,
  userId: true,
  messages: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  userId: true,
  amount: true,
  type: true,
  description: true,
});

export const insertGeneratedCodeSchema = createInsertSchema(generatedCode).pick({
  projectId: true,
  language: true,
  code: true,
});

// 支付后台系统的插入模式
export const insertMerchantSchema = createInsertSchema(merchants).pick({
  userId: true,
  merchantCode: true,
  companyName: true,
  contactName: true,
  contactEmail: true,
  contactPhone: true,
  country: true,
  address: true,
  businessType: true,
  website: true,
  apiKey: true,
  secretKey: true,
  callbackUrl: true,
  ipWhitelist: true,
  settlementCycle: true,
  feeRate: true,
});

export const insertAdminSchema = createInsertSchema(admins).pick({
  userId: true,
  username: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  permissions: true,
});

export const insertPaymentChannelSchema = createInsertSchema(paymentChannels).pick({
  name: true,
  code: true,
  type: true,
  provider: true,
  providerApiUrl: true,
  apiKey: true,
  apiSecret: true,
  supportedCurrencies: true,
  supportedCountries: true,
  supportedMethods: true,
  minAmount: true,
  maxAmount: true,
  processingTime: true,
  fee: true,
  fixedFee: true,
  dailyLimit: true,
  monthlyLimit: true,
  config: true,
  isActive: true,
  priority: true,
});

export const insertMerchantChannelSchema = createInsertSchema(merchantChannels).pick({
  merchantId: true,
  channelId: true,
  status: true,
  customFeeRate: true,
  customFixedFee: true,
  dailyLimit: true,
  monthlyLimit: true,
  customConfig: true,
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  orderNo: true,
  merchantId: true,
  channelId: true,
  merchantOrderId: true,
  type: true,
  currency: true,
  amount: true,
  actualAmount: true,
  fee: true,
  status: true,
  paymentMethod: true,
  customerInfo: true,
  paymentInfo: true,
  errorMessage: true,
  ipAddress: true,
  deviceInfo: true,
  extraData: true,
  expiresAt: true,
});

export const insertSettlementSchema = createInsertSchema(settlements).pick({
  settlementNo: true,
  merchantId: true,
  currency: true,
  amount: true,
  fee: true,
  actualAmount: true,
  status: true,
  type: true,
  settlementMethod: true,
  accountInfo: true,
  transactionId: true,
  remark: true,
  reviewerId: true,
});

export const insertCryptoWalletSchema = createInsertSchema(cryptoWallets).pick({
  merchantId: true,
  walletName: true,
  walletType: true,
  coin: true,
  network: true,
  address: true,
  balance: true,
  status: true,
  isMultisig: true,
  multisigConfig: true,
  privateKeyEncrypted: true,
  publicKey: true,
  tags: true,
  securityLevel: true,
  withdrawalLimit: true,
  dailyLimit: true,
});

export const insertCryptoTransactionSchema = createInsertSchema(cryptoTransactions).pick({
  walletId: true,
  orderId: true,
  txHash: true,
  type: true,
  coin: true,
  network: true,
  fromAddress: true,
  toAddress: true,
  amount: true,
  fee: true,
  status: true,
  confirmations: true,
  requiredConfirmations: true,
  blockHeight: true,
  memo: true,
  riskScore: true,
});

export const insertCryptoCardSchema = createInsertSchema(cryptoCards).pick({
  merchantId: true,
  userId: true,
  cardType: true,
  cardNetwork: true,
  cardNumber: true,
  cardholderName: true,
  expiryMonth: true,
  expiryYear: true,
  cvv: true,
  status: true,
  currency: true,
  balance: true,
  spendLimit: true,
  billingAddress: true,
  linkedWalletId: true,
});

export const insertCardTransactionSchema = createInsertSchema(cardTransactions).pick({
  cardId: true,
  transactionId: true,
  amount: true,
  currency: true,
  originalAmount: true,
  originalCurrency: true,
  exchangeRate: true,
  merchantName: true,
  merchantCategory: true,
  type: true,
  status: true,
  declineReason: true,
  location: true,
  isInternational: true,
  feeAmount: true,
});

export const insertWalletServiceSchema = createInsertSchema(walletServices).pick({
  merchantId: true,
  serviceName: true,
  serviceType: true,
  config: true,
  status: true,
  priceLevel: true,
  monthlyFee: true,
  transactionFeeRate: true,
  supportedCoins: true,
  contractStart: true,
  contractEnd: true,
});

export const insertSystemLogSchema = createInsertSchema(systemLogs).pick({
  logType: true,
  source: true,
  message: true,
  details: true,
  userId: true,
  merchantId: true,
  adminId: true,
  ipAddress: true,
  userAgent: true,
  severity: true,
});

// 类型导出
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertOtcUser = z.infer<typeof insertOtcUserSchema>;
export type OtcUser = typeof otcUsers.$inferSelect;

export type InsertPaymentApi = z.infer<typeof insertPaymentApiSchema>;
export type PaymentApi = typeof paymentApis.$inferSelect;

export type InsertIntegrationProject = z.infer<typeof insertIntegrationProjectSchema>;
export type IntegrationProject = typeof integrationProjects.$inferSelect;

export type InsertAiConversation = z.infer<typeof insertAiConversationSchema>;
export type AiConversation = typeof aiConversations.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertGeneratedCode = z.infer<typeof insertGeneratedCodeSchema>;
export type GeneratedCode = typeof generatedCode.$inferSelect;

// 支付后台系统类型导出
export type InsertMerchant = z.infer<typeof insertMerchantSchema>;
export type Merchant = typeof merchants.$inferSelect;

export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof admins.$inferSelect;

export type InsertPaymentChannel = z.infer<typeof insertPaymentChannelSchema>;
export type PaymentChannel = typeof paymentChannels.$inferSelect;

export type InsertMerchantChannel = z.infer<typeof insertMerchantChannelSchema>;
export type MerchantChannel = typeof merchantChannels.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertSettlement = z.infer<typeof insertSettlementSchema>;
export type Settlement = typeof settlements.$inferSelect;

export type InsertCryptoWallet = z.infer<typeof insertCryptoWalletSchema>;
export type CryptoWallet = typeof cryptoWallets.$inferSelect;

export type InsertCryptoTransaction = z.infer<typeof insertCryptoTransactionSchema>;
export type CryptoTransaction = typeof cryptoTransactions.$inferSelect;

export type InsertCryptoCard = z.infer<typeof insertCryptoCardSchema>;
export type CryptoCard = typeof cryptoCards.$inferSelect;

export type InsertCardTransaction = z.infer<typeof insertCardTransactionSchema>;
export type CardTransaction = typeof cardTransactions.$inferSelect;

export type InsertWalletService = z.infer<typeof insertWalletServiceSchema>;
export type WalletService = typeof walletServices.$inferSelect;

export type InsertSystemLog = z.infer<typeof insertSystemLogSchema>;
export type SystemLog = typeof systemLogs.$inferSelect;