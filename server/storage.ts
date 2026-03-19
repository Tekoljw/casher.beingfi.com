import { 
  users, paymentApis, integrationProjects, aiConversations, transactions, generatedCode, otcUsers,
  merchants, admins, paymentChannels, merchantChannels, orders, settlements, cryptoWallets, 
  cryptoTransactions, cryptoCards, cardTransactions, walletServices, systemLogs,
  type User, type InsertUser, 
  type OtcUser, type InsertOtcUser,
  type PaymentApi, type InsertPaymentApi,
  type IntegrationProject, type InsertIntegrationProject,
  type AiConversation, type InsertAiConversation,
  type Transaction, type InsertTransaction,
  type GeneratedCode, type InsertGeneratedCode,
  type Merchant, type InsertMerchant,
  type Admin, type InsertAdmin
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, desc, and, isNull } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import createMemoryStore from "memorystore";

// PostgreSQL Session Store
const PostgresSessionStore = connectPg(session);

// 临时使用内存存储作为备用
const MemoryStore = createMemoryStore(session);

// 存储接口
export interface IStorage {
  sessionStore: session.Store;

  // 用户管理
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, newBalance: number): Promise<User>;
  
  // OTC用户管理
  getOtcUser(id: number): Promise<OtcUser | undefined>;
  getOtcUserByUsername(username: string): Promise<OtcUser | undefined>;
  getOtcUserByRole(role: string): Promise<OtcUser[]>;
  createOtcUser(user: InsertOtcUser): Promise<OtcUser>;
  updateOtcUser(id: number, data: Partial<OtcUser>): Promise<OtcUser>;
  
  // 支付API管理
  getAllPaymentApis(): Promise<PaymentApi[]>;
  getPaymentApi(id: number): Promise<PaymentApi | undefined>;
  createPaymentApi(api: InsertPaymentApi): Promise<PaymentApi>;
  updatePaymentApi(id: number, data: Partial<PaymentApi>): Promise<PaymentApi>;
  
  // 集成项目管理
  getIntegrationProjects(userId: number): Promise<IntegrationProject[]>;
  getIntegrationProject(id: number): Promise<IntegrationProject | undefined>;
  createIntegrationProject(project: InsertIntegrationProject): Promise<IntegrationProject>;
  updateIntegrationProject(id: number, data: Partial<IntegrationProject>): Promise<IntegrationProject>;
  
  // AI对话管理
  getAiConversations(projectId: number): Promise<AiConversation[]>;
  getAiConversation(id: number): Promise<AiConversation | undefined>;
  createAiConversation(conversation: InsertAiConversation): Promise<AiConversation>;
  updateAiConversation(id: number, data: Partial<AiConversation>): Promise<AiConversation>;
  
  // 交易记录管理
  getUserTransactions(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  
  // 生成代码管理
  getGeneratedCodes(projectId: number): Promise<GeneratedCode[]>;
  createGeneratedCode(code: InsertGeneratedCode): Promise<GeneratedCode>;
}

// PostgreSQL存储实现
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      tableName: 'session',
      createTableIfMissing: true 
    });
  }

  // 用户管理
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        role: insertUser.role || "user",
        balance: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return user;
  }

  async updateUserBalance(userId: number, newBalance: number): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        balance: newBalance, 
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!updatedUser) {
      throw new Error('User not found');
    }
    
    return updatedUser;
  }
  
  // OTC用户管理
  async getOtcUser(id: number): Promise<OtcUser | undefined> {
    const [otcUser] = await db.select().from(otcUsers).where(eq(otcUsers.id, id));
    return otcUser || undefined;
  }
  
  async getOtcUserByUsername(username: string): Promise<OtcUser | undefined> {
    const [otcUser] = await db.select().from(otcUsers).where(eq(otcUsers.username, username));
    return otcUser || undefined;
  }
  
  async getOtcUserByRole(role: string): Promise<OtcUser[]> {
    return await db
      .select()
      .from(otcUsers)
      .where(eq(otcUsers.role, role))
      .orderBy(desc(otcUsers.createdAt));
  }
  
  async createOtcUser(user: InsertOtcUser): Promise<OtcUser> {
    const [otcUser] = await db
      .insert(otcUsers)
      .values({
        ...user,
        status: "active",
        balance: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return otcUser;
  }
  
  async updateOtcUser(id: number, data: Partial<OtcUser>): Promise<OtcUser> {
    const [updatedUser] = await db
      .update(otcUsers)
      .set({ 
        ...data, 
        updatedAt: new Date() 
      })
      .where(eq(otcUsers.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error('OTC User not found');
    }
    
    return updatedUser;
  }

  // 支付API管理
  async getAllPaymentApis(): Promise<PaymentApi[]> {
    return await db.select().from(paymentApis);
  }

  async getPaymentApi(id: number): Promise<PaymentApi | undefined> {
    const [api] = await db.select().from(paymentApis).where(eq(paymentApis.id, id));
    return api || undefined;
  }

  async createPaymentApi(api: InsertPaymentApi): Promise<PaymentApi> {
    const [newApi] = await db
      .insert(paymentApis)
      .values(api)
      .returning();
    return newApi;
  }

  async updatePaymentApi(id: number, data: Partial<PaymentApi>): Promise<PaymentApi> {
    const [updatedApi] = await db
      .update(paymentApis)
      .set({ 
        ...data, 
        updatedAt: new Date() 
      })
      .where(eq(paymentApis.id, id))
      .returning();
    
    if (!updatedApi) {
      throw new Error('API not found');
    }
    
    return updatedApi;
  }

  // 集成项目管理
  async getIntegrationProjects(userId: number): Promise<IntegrationProject[]> {
    return await db
      .select()
      .from(integrationProjects)
      .where(eq(integrationProjects.userId, userId))
      .orderBy(desc(integrationProjects.createdAt));
  }

  async getIntegrationProject(id: number): Promise<IntegrationProject | undefined> {
    const [project] = await db
      .select()
      .from(integrationProjects)
      .where(eq(integrationProjects.id, id));
    return project || undefined;
  }

  async createIntegrationProject(project: InsertIntegrationProject): Promise<IntegrationProject> {
    const [newProject] = await db
      .insert(integrationProjects)
      .values({
        ...project,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newProject;
  }

  async updateIntegrationProject(id: number, data: Partial<IntegrationProject>): Promise<IntegrationProject> {
    const [updatedProject] = await db
      .update(integrationProjects)
      .set({ 
        ...data, 
        updatedAt: new Date() 
      })
      .where(eq(integrationProjects.id, id))
      .returning();
    
    if (!updatedProject) {
      throw new Error('Project not found');
    }
    
    return updatedProject;
  }

  // AI对话管理
  async getAiConversations(projectId: number): Promise<AiConversation[]> {
    return await db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.projectId, projectId))
      .orderBy(desc(aiConversations.createdAt));
  }

  async getAiConversation(id: number): Promise<AiConversation | undefined> {
    const [conversation] = await db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.id, id));
    return conversation || undefined;
  }

  async createAiConversation(conversation: InsertAiConversation): Promise<AiConversation> {
    const [newConversation] = await db
      .insert(aiConversations)
      .values({
        ...conversation,
        createdAt: new Date()
      })
      .returning();
    return newConversation;
  }

  async updateAiConversation(id: number, data: Partial<AiConversation>): Promise<AiConversation> {
    const [updatedConversation] = await db
      .update(aiConversations)
      .set(data)
      .where(eq(aiConversations.id, id))
      .returning();
    
    if (!updatedConversation) {
      throw new Error('Conversation not found');
    }
    
    return updatedConversation;
  }

  // 交易记录管理
  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values({
        ...transaction,
        createdAt: new Date()
      })
      .returning();
    return newTransaction;
  }

  // 生成代码管理
  async getGeneratedCodes(projectId: number): Promise<GeneratedCode[]> {
    return await db
      .select()
      .from(generatedCode)
      .where(eq(generatedCode.projectId, projectId))
      .orderBy(desc(generatedCode.createdAt));
  }

  async createGeneratedCode(code: InsertGeneratedCode): Promise<GeneratedCode> {
    const [newCode] = await db
      .insert(generatedCode)
      .values({
        ...code,
        createdAt: new Date()
      })
      .returning();
    return newCode;
  }
  
  // 附加方法：用于auth.ts中的Merchant相关操作
  async getMerchantByApiKey(apiKey: string): Promise<Merchant | undefined> {
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.apiKey, apiKey));
    return merchant || undefined;
  }
  
  async updateStripeCustomerId(userId: number, customerId: string): Promise<User> {
    // 此方法为支付集成预留，暂未实现
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }
}

// 内存存储版本
class MemStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 清理过期session的时间间隔，这里设为1天
    });
  }
  
  // 用户管理
  async getUser(id: number): Promise<User | undefined> {
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    throw new Error("Not implemented");
  }

  async updateUserBalance(userId: number, newBalance: number): Promise<User> {
    throw new Error("Not implemented");
  }
  
  // OTC用户管理
  async getOtcUser(id: number): Promise<OtcUser | undefined> {
    return undefined;
  }
  
  async getOtcUserByUsername(username: string): Promise<OtcUser | undefined> {
    return undefined;
  }
  
  async getOtcUserByRole(role: string): Promise<OtcUser[]> {
    return [];
  }
  
  async createOtcUser(user: InsertOtcUser): Promise<OtcUser> {
    throw new Error("Not implemented");
  }
  
  async updateOtcUser(id: number, data: Partial<OtcUser>): Promise<OtcUser> {
    throw new Error("Not implemented");
  }

  // 支付API管理
  async getAllPaymentApis(): Promise<PaymentApi[]> {
    return [];
  }

  async getPaymentApi(id: number): Promise<PaymentApi | undefined> {
    return undefined;
  }

  async createPaymentApi(api: InsertPaymentApi): Promise<PaymentApi> {
    throw new Error("Not implemented");
  }

  async updatePaymentApi(id: number, data: Partial<PaymentApi>): Promise<PaymentApi> {
    throw new Error("Not implemented");
  }

  // 集成项目管理
  async getIntegrationProjects(userId: number): Promise<IntegrationProject[]> {
    return [];
  }

  async getIntegrationProject(id: number): Promise<IntegrationProject | undefined> {
    return undefined;
  }

  async createIntegrationProject(project: InsertIntegrationProject): Promise<IntegrationProject> {
    throw new Error("Not implemented");
  }

  async updateIntegrationProject(id: number, data: Partial<IntegrationProject>): Promise<IntegrationProject> {
    throw new Error("Not implemented");
  }

  // AI对话管理
  async getAiConversations(projectId: number): Promise<AiConversation[]> {
    return [];
  }

  async getAiConversation(id: number): Promise<AiConversation | undefined> {
    return undefined;
  }

  async createAiConversation(conversation: InsertAiConversation): Promise<AiConversation> {
    throw new Error("Not implemented");
  }

  async updateAiConversation(id: number, data: Partial<AiConversation>): Promise<AiConversation> {
    throw new Error("Not implemented");
  }

  // 交易记录管理
  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return [];
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    throw new Error("Not implemented");
  }

  // 生成代码管理
  async getGeneratedCodes(projectId: number): Promise<GeneratedCode[]> {
    return [];
  }

  async createGeneratedCode(code: InsertGeneratedCode): Promise<GeneratedCode> {
    throw new Error("Not implemented");
  }
  
  // 附加方法
  async getMerchantByApiKey(apiKey: string): Promise<Merchant | undefined> {
    return undefined;
  }
  
  async updateStripeCustomerId(userId: number, customerId: string): Promise<User> {
    throw new Error("Not implemented");
  }
}

// 默认使用数据库存储
export const storage = new DatabaseStorage();
