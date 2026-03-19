import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { db } from "./db";
import { eq } from "drizzle-orm";
import {
  insertUserSchema,
  insertOtcUserSchema,
  insertPaymentApiSchema,
  insertIntegrationProjectSchema,
  insertAiConversationSchema,
  insertTransactionSchema,
  insertGeneratedCodeSchema,
  insertMerchantSchema,
  insertOrderSchema,
  insertPaymentChannelSchema,
  
  merchants,
  admins,
  paymentChannels,
  merchantChannels,
  orders,
  settlements,
  cryptoWallets,
  cryptoTransactions,
  cryptoCards,
  cardTransactions,
  walletServices,
  systemLogs,
  
  type User,
  type OtcUser,
  type Merchant,
  type Admin
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // 设置认证和会话
  const { ensureAuthenticated, ensureMerchant, ensureAdmin } = setupAuth(app);

  // 基础健康检查
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy" });
  });
  
  // 加密钱包相关API
  app.get("/api/crypto-wallets", ensureAuthenticated, async (req, res, next) => {
    try {
      // 确保req.user存在（ensureAuthenticated中间件已确保这一点）
      const user = req.user as Express.User;
      
      // 如果是商户，只显示自己的钱包
      if (user.role === "merchant" && user.merchant) {
        const merchantId = user.merchant.id;
        const wallets = await db
          .select()
          .from(cryptoWallets)
          .where(eq(cryptoWallets.merchantId, merchantId));
          
        return res.json(wallets);
      } 
      // 如果是管理员，显示所有钱包
      else if (user.role === "admin") {
        const wallets = await db
          .select()
          .from(cryptoWallets);
          
        return res.json(wallets);
      }
      
      // 普通用户无权访问
      return res.status(403).json({ error: "无权访问钱包信息" });
    } catch (error) {
      next(error);
    }
  });
  
  // 创建钱包
  app.post("/api/crypto-wallets", ensureAuthenticated, async (req, res, next) => {
    try {
      const { walletName, walletType, coin, network, address } = req.body;
      
      // 确定钱包所属商户
      let merchantId: number | null = null;
      
      if (req.user.role === "merchant" && req.user.merchant) {
        merchantId = req.user.merchant.id;
      } else if (req.user.role === "admin" && req.body.merchantId) {
        merchantId = req.body.merchantId;
      } else if (req.user.role !== "admin") {
        return res.status(403).json({ error: "无权创建钱包" });
      }
      
      // 创建钱包
      const [wallet] = await db
        .insert(cryptoWallets)
        .values({
          merchantId,
          walletName,
          walletType,
          coin,
          network,
          address,
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
        
      res.status(201).json(wallet);
    } catch (error) {
      next(error);
    }
  });
  
  // 加密信用卡API
  app.get("/api/crypto-cards", ensureMerchant, async (req, res, next) => {
    try {
      const merchantId = req.user.merchant!.id;
      
      // 获取商户的所有信用卡
      const cards = await db
        .select()
        .from(cryptoCards)
        .where(eq(cryptoCards.merchantId, merchantId));
        
      // 处理卡数据，隐藏敏感信息
      const safeCards = cards.map(card => ({
        ...card,
        cardNumber: card.cardNumber ? `****${card.cardNumber.slice(-4)}` : null,
        cvv: "***"
      }));
      
      res.json(safeCards);
    } catch (error) {
      next(error);
    }
  });
  
  // 创建加密信用卡
  app.post("/api/crypto-cards", ensureMerchant, async (req, res, next) => {
    try {
      const merchantId = req.user.merchant!.id;
      
      // 创建新卡
      const [card] = await db
        .insert(cryptoCards)
        .values({
          ...req.body,
          merchantId,
          status: "inactive", // 新卡初始状态为未激活
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
        
      // 隐藏敏感信息
      const safeCard = {
        ...card,
        cardNumber: card.cardNumber ? `****${card.cardNumber.slice(-4)}` : null,
        cvv: "***"
      };
      
      res.status(201).json(safeCard);
    } catch (error) {
      next(error);
    }
  });
  
  // 钱包SAAS服务API
  app.get("/api/wallet-services", ensureMerchant, async (req, res, next) => {
    try {
      const merchantId = req.user.merchant!.id;
      
      // 获取商户的所有SAAS服务
      const services = await db
        .select()
        .from(walletServices)
        .where(eq(walletServices.merchantId, merchantId));
        
      res.json(services);
    } catch (error) {
      next(error);
    }
  });
  
  // 订阅钱包SAAS服务
  app.post("/api/wallet-services/subscribe", ensureMerchant, async (req, res, next) => {
    try {
      const merchantId = req.user.merchant!.id;
      const { serviceType, priceLevel } = req.body;
      
      // 检查是否已订阅该类型服务
      const [existingService] = await db
        .select()
        .from(walletServices)
        .where(eq(walletServices.merchantId, merchantId))
        .where(eq(walletServices.serviceType, serviceType));
        
      if (existingService) {
        return res.status(400).json({ error: "已订阅该类型服务" });
      }
      
      // 创建服务订阅
      const now = new Date();
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      const [service] = await db
        .insert(walletServices)
        .values({
          merchantId,
          serviceName: `${serviceType} (${priceLevel})`,
          serviceType,
          config: {},
          status: "active",
          priceLevel,
          contractStart: now,
          contractEnd: nextMonth, // 默认一个月期限
          lastBillingDate: now,
          nextBillingDate: nextMonth,
          createdAt: now,
          updatedAt: now
        })
        .returning();
        
      res.status(201).json(service);
    } catch (error) {
      next(error);
    }
  });
  
  // 结算API - 创建结算请求（商户）
  app.post("/api/settlements", ensureMerchant, async (req, res, next) => {
    try {
      const merchantId = req.user.merchant!.id;
      const { currency, amount, settlementMethod, accountInfo } = req.body;
      
      // 检查余额是否足够
      const merchant = req.user.merchant!;
      if (merchant.mainBalance < amount) {
        return res.status(400).json({ error: "余额不足" });
      }
      
      // 计算手续费
      const fee = amount * 0.01; // 假设结算手续费为1%
      const actualAmount = amount - fee;
      
      // 生成结算单号
      const settlementNo = `STL${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      // 创建结算记录
      const [settlement] = await db
        .insert(settlements)
        .values({
          settlementNo,
          merchantId,
          currency,
          amount,
          fee,
          actualAmount,
          status: "pending", // 初始状态为待审核
          type: "manual",
          settlementMethod,
          accountInfo,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
        
      // 更新商户余额（预扣金额）
      await db
        .update(merchants)
        .set({
          mainBalance: merchant.mainBalance - amount,
          updatedAt: new Date()
        })
        .where(eq(merchants.id, merchantId));
        
      res.status(201).json(settlement);
    } catch (error) {
      next(error);
    }
  });
  
  // 结算API - 管理员审核结算请求
  app.patch("/api/settlements/:id/review", ensureAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const adminId = req.user.admin!.id;
      const { status, remark } = req.body;
      
      // 获取结算记录
      const [settlement] = await db
        .select()
        .from(settlements)
        .where(eq(settlements.id, id));
        
      if (!settlement) {
        return res.status(404).json({ error: "结算记录不存在" });
      }
      
      // 检查状态是否为待审核
      if (settlement.status !== "pending") {
        return res.status(400).json({ error: "只能审核待处理的结算请求" });
      }
      
      // 更新结算状态
      const now = new Date();
      const [updatedSettlement] = await db
        .update(settlements)
        .set({
          status,
          reviewerId: adminId,
          reviewedAt: now,
          completedAt: status === "completed" ? now : null,
          remark,
          updatedAt: now
        })
        .where(eq(settlements.id, id))
        .returning();
        
      // 如果拒绝，退回商户余额
      if (status === "failed") {
        await db
          .update(merchants)
          .set({
            mainBalance: db.raw(`main_balance + ${settlement.amount}`),
            updatedAt: now
          })
          .where(eq(merchants.id, settlement.merchantId));
      }
        
      res.json(updatedSettlement);
    } catch (error) {
      next(error);
    }
  });

  // 支付后台相关API
  
  // 支付通道API - 只有管理员可以添加和管理支付通道
  app.get("/api/payment-channels", ensureAuthenticated, async (req, res, next) => {
    try {
      // 从数据库查询所有支付通道
      const channels = await db.query.paymentChannels.findMany();
      res.json(channels);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/payment-channels", ensureAdmin, async (req, res, next) => {
    try {
      // 验证通道数据
      const channelSchema = insertPaymentChannelSchema.extend({
        name: z.string().min(2, "通道名称不能少于2个字符"),
        code: z.string().min(2, "通道代码不能少于2个字符"),
        type: z.enum(["fiat_collect", "fiat_payout", "crypto_collect", "crypto_payout"]),
        provider: z.string().min(2, "提供商名称不能少于2个字符"),
      });
      
      const channelData = channelSchema.parse(req.body);
      
      // 创建新支付通道
      const [newChannel] = await db
        .insert(paymentChannels)
        .values(channelData)
        .returning();
        
      res.status(201).json(newChannel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      next(error);
    }
  });
  
  // 商户API - 商户管理
  app.get("/api/merchants", ensureAdmin, async (req, res, next) => {
    try {
      // 从数据库查询所有商户
      const merchantsList = await db.query.merchants.findMany();
      res.json(merchantsList);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/merchants/:id", ensureAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      // 查询单个商户
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.id, id));
        
      if (!merchant) {
        return res.status(404).json({ error: "商户不存在" });
      }
      
      res.json(merchant);
    } catch (error) {
      next(error);
    }
  });
  
  // 商户API - 审核商户
  app.patch("/api/merchants/:id/approve", ensureAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      // 更新商户状态为已批准
      const [updatedMerchant] = await db
        .update(merchants)
        .set({ 
          status: "active", 
          updatedAt: new Date() 
        })
        .where(eq(merchants.id, id))
        .returning();
        
      if (!updatedMerchant) {
        return res.status(404).json({ error: "商户不存在" });
      }
      
      res.json(updatedMerchant);
    } catch (error) {
      next(error);
    }
  });
  
  // 商户API - 商户获取自己的信息
  app.get("/api/merchant/profile", ensureMerchant, (req, res) => {
    // 当用户是商户时，merchant信息已经在认证中间件中附加到req.user上
    res.json(req.user.merchant);
  });
  
  // 订单API - 创建订单（商户）
  app.post("/api/orders", ensureMerchant, async (req, res, next) => {
    try {
      const merchantId = req.user.merchant!.id;
      const merchantOrderId = req.body.merchantOrderId;
      
      // 检查商户订单ID是否已存在
      const [existingOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.merchantOrderId, merchantOrderId))
        .where(eq(orders.merchantId, merchantId));
        
      if (existingOrder) {
        return res.status(400).json({ error: "订单ID已存在" });
      }
      
      // 生成订单号
      const orderNo = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      // 创建新订单
      const orderData = {
        ...req.body,
        orderNo,
        merchantId,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
        // 默认过期时间为15分钟后
        expiresAt: new Date(Date.now() + 15 * 60 * 1000)
      };
      
      const [newOrder] = await db
        .insert(orders)
        .values(orderData)
        .returning();
        
      res.status(201).json(newOrder);
    } catch (error) {
      next(error);
    }
  });
  
  // 订单API - 获取订单列表（商户）
  app.get("/api/merchant/orders", ensureMerchant, async (req, res, next) => {
    try {
      const merchantId = req.user.merchant!.id;
      
      // 获取商户的所有订单
      const merchantOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.merchantId, merchantId))
        .orderBy(orders.createdAt);
        
      res.json(merchantOrders);
    } catch (error) {
      next(error);
    }
  });
  
  // 订单API - 管理员查看所有订单
  app.get("/api/admin/orders", ensureAdmin, async (req, res, next) => {
    try {
      const status = req.query.status as string | undefined;
      const type = req.query.type as string | undefined;
      
      // 构建查询条件
      let query = db.select().from(orders);
      
      if (status) {
        query = query.where(eq(orders.status, status));
      }
      
      if (type) {
        query = query.where(eq(orders.type, type));
      }
      
      // 执行查询
      const ordersList = await query.orderBy(orders.createdAt).limit(100);
      
      res.json(ordersList);
    } catch (error) {
      next(error);
    }
  });

  // 支付API相关API
  app.get("/api/payment-apis", async (req, res, next) => {
    try {
      const apis = await storage.getAllPaymentApis();
      res.json(apis);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/payment-apis/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const api = await storage.getPaymentApi(id);
      if (!api) {
        return res.status(404).json({ error: "API不存在" });
      }
      res.json(api);
    } catch (error) {
      next(error);
    }
  });

  // 集成项目相关API
  app.get("/api/integration-projects", ensureAuthenticated, async (req, res, next) => {
    try {
      const userId = (req.user as User).id;
      const projects = await storage.getIntegrationProjects(userId);
      res.json(projects);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/integration-projects/:id", ensureAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getIntegrationProject(id);
      
      if (!project) {
        return res.status(404).json({ error: "项目不存在" });
      }
      
      // 验证用户是否拥有该项目
      if (project.userId !== (req.user as User).id) {
        return res.status(403).json({ error: "无权访问该项目" });
      }
      
      res.json(project);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/integration-projects", ensureAuthenticated, async (req, res, next) => {
    try {
      const userId = (req.user as User).id;
      const projectData = insertIntegrationProjectSchema.parse({
        ...req.body,
        userId
      });
      
      const project = await storage.createIntegrationProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      next(error);
    }
  });

  app.patch("/api/integration-projects/:id", ensureAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getIntegrationProject(id);
      
      if (!project) {
        return res.status(404).json({ error: "项目不存在" });
      }
      
      // 验证用户是否拥有该项目
      if (project.userId !== (req.user as User).id) {
        return res.status(403).json({ error: "无权修改该项目" });
      }
      
      const updatedProject = await storage.updateIntegrationProject(id, req.body);
      res.json(updatedProject);
    } catch (error) {
      next(error);
    }
  });

  // AI对话相关API
  app.get("/api/ai-conversations/:projectId", ensureAuthenticated, async (req, res, next) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getIntegrationProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: "项目不存在" });
      }
      
      // 验证用户是否拥有该项目
      if (project.userId !== (req.user as User).id) {
        return res.status(403).json({ error: "无权访问该项目的对话" });
      }
      
      const conversations = await storage.getAiConversations(projectId);
      res.json(conversations);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/ai-conversations", ensureAuthenticated, async (req, res, next) => {
    try {
      const userId = (req.user as User).id;
      const { projectId, messages } = req.body;
      
      // 验证项目所有权
      const project = await storage.getIntegrationProject(projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ error: "无权访问该项目" });
      }
      
      // 检查用户余额
      const user = await storage.getUser(userId) as User;
      if (user.balance < 0.1) {
        return res.status(400).json({ error: "余额不足，请先充值" });
      }
      
      // 创建对话记录
      const conversation = await storage.createAiConversation({
        projectId,
        userId,
        messages
      });
      
      // 扣除用户余额
      const newBalance = user.balance - 0.1;
      await storage.updateUserBalance(userId, newBalance);
      
      // 创建消费交易记录
      await storage.createTransaction({
        userId,
        amount: -0.1,
        type: "consumption",
        description: `AI对话消费 (项目: ${project.name})`
      });
      
      // TODO: 这里将来会调用DeepSeek-Coder API
      // 目前仅返回已创建的对话
      res.status(201).json(conversation);
    } catch (error) {
      next(error);
    }
  });

  // 交易记录相关API
  app.get("/api/transactions", ensureAuthenticated, async (req, res, next) => {
    try {
      const userId = (req.user as User).id;
      const transactions = await storage.getUserTransactions(userId);
      res.json(transactions);
    } catch (error) {
      next(error);
    }
  });

  // 模拟充值API
  app.post("/api/recharge", ensureAuthenticated, async (req, res, next) => {
    try {
      const userId = (req.user as User).id;
      const { amount } = req.body;
      
      // 验证金额
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "充值金额必须大于0" });
      }
      
      // 获取当前用户
      const user = await storage.getUser(userId) as User;
      
      // 更新余额
      const newBalance = user.balance + amount;
      await storage.updateUserBalance(userId, newBalance);
      
      // 创建充值交易记录
      const transaction = await storage.createTransaction({
        userId,
        amount,
        type: "recharge",
        description: "USDT充值"
      });
      
      res.status(201).json({
        transaction,
        newBalance
      });
    } catch (error) {
      next(error);
    }
  });

  // 生成代码相关API
  app.get("/api/generated-code/:projectId", ensureAuthenticated, async (req, res, next) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getIntegrationProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: "项目不存在" });
      }
      
      // 验证用户是否拥有该项目
      if (project.userId !== (req.user as User).id) {
        return res.status(403).json({ error: "无权访问该项目的代码" });
      }
      
      const codes = await storage.getGeneratedCodes(projectId);
      res.json(codes);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/generated-code", ensureAuthenticated, async (req, res, next) => {
    try {
      const { projectId, language, code } = req.body;
      
      // 验证项目所有权
      const project = await storage.getIntegrationProject(projectId);
      if (!project || project.userId !== (req.user as User).id) {
        return res.status(403).json({ error: "无权访问该项目" });
      }
      
      const generatedCode = await storage.createGeneratedCode({
        projectId,
        language,
        code
      });
      
      res.status(201).json(generatedCode);
    } catch (error) {
      next(error);
    }
  });
  
  // 支付API相关路由
  app.get("/api/payment-apis", async (req, res, next) => {
    try {
      const apis = await storage.getAllPaymentApis();
      res.json(apis);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/payment-apis/:id", async (req, res, next) => {
    try {
      const apiId = parseInt(req.params.id);
      const api = await storage.getPaymentApi(apiId);
      
      if (!api) {
        return res.status(404).json({ error: "支付API不存在" });
      }
      
      res.json(api);
    } catch (error) {
      next(error);
    }
  });

  // 错误处理中间件
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "服务器内部错误" });
  });

  const httpServer = createServer(app);
  return httpServer;
}
