import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users, merchants, admins, type User, type Merchant, type Admin } from "@shared/schema";

// 创建一个扩展用户接口，用于表示认证后的用户对象
export interface AuthUser extends User {
  role: string;
  merchant?: Merchant;
  admin?: Admin;
}

// 扩展 Express.User 接口以包含我们的用户类型
declare global {
  namespace Express {
    // 避免循环引用，使用新定义的AuthUser接口
    interface User extends AuthUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "bepay-super-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // 标准用户登录策略
  passport.use(
    "user-local",
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "用户名或密码错误" });
        }
        
        // 创建AuthUser对象
        const authUser: AuthUser = {
          ...user,
          role: user.role || "user"
        };
        
        return done(null, authUser);
      } catch (error) {
        return done(error);
      }
    }),
  );

  // 商户登录策略
  passport.use(
    "merchant-local",
    new LocalStrategy(async (username, password, done) => {
      try {
        // 根据API Key查找商户
        const merchant = await storage.getMerchantByApiKey(username);

        if (!merchant) {
          return done(null, false, { message: "商户API密钥无效" });
        }

        // 验证Secret Key作为密码
        if (password !== merchant.secretKey) {
          return done(null, false, { message: "商户密钥无效" });
        }

        // 如果商户关联了用户，则获取用户信息
        let userData: User | undefined;
        if (merchant.userId) {
          userData = await storage.getUser(merchant.userId);
        }
        
        if (!userData) {
          // 如果商户没有关联用户或找不到用户，则创建一个虚拟用户对象
          userData = {
            id: -(merchant.id || 0), // 使用负的商户ID表示虚拟用户
            username: merchant.merchantCode,
            password: "",
            email: merchant.contactEmail || "",
            role: "merchant",
            balance: 0,
            createdAt: merchant.createdAt,
            updatedAt: merchant.updatedAt,
          };
        }

        // 返回扩展的用户对象，包含商户信息
        const authUser: AuthUser = {
          ...userData,
          role: "merchant",
          merchant: merchant,
        };

        return done(null, authUser);
      } catch (error) {
        return done(error);
      }
    }),
  );

  // 管理员登录策略
  passport.use(
    "admin-local",
    new LocalStrategy(async (username, password, done) => {
      try {
        // 查找管理员
        const [adminData] = await db
          .select()
          .from(admins)
          .where(eq(admins.username, username));

        if (!adminData) {
          return done(null, false, { message: "管理员不存在" });
        }

        // 如果管理员关联了用户，则获取用户信息进行密码验证
        if (adminData.userId) {
          const userData = await storage.getUser(adminData.userId);

          if (!userData || !(await comparePasswords(password, userData.password))) {
            return done(null, false, { message: "管理员用户名或密码错误" });
          }

          // 返回扩展的用户对象，包含管理员信息
          const authUser: AuthUser = {
            ...userData,
            role: "admin",
            admin: adminData,
          };

          return done(null, authUser);
        } else {
          return done(null, false, { message: "管理员账户未关联用户，无法登录" });
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, {
      id: user.id,
      role: user.role,
    });
  });

  passport.deserializeUser(async (data: { id: number; role: string }, done) => {
    try {
      const { id, role } = data;
      
      if (role === "merchant") {
        if (id < 0) {
          // 虚拟用户，使用商户信息
          const merchantId = -id; // 转换回正数的商户ID
          const merchant = await db
            .query.merchants.findFirst({
              where: eq(merchants.id, merchantId)
            });

          if (!merchant) {
            return done(new Error("商户不存在"));
          }

          // 创建虚拟用户
          const authUser: AuthUser = {
            id,
            username: merchant.merchantCode,
            password: "",
            email: merchant.contactEmail || "",
            role: "merchant",
            balance: 0,
            createdAt: merchant.createdAt,
            updatedAt: merchant.updatedAt,
            merchant: merchant,
          };

          return done(null, authUser);
        } else {
          // 真实用户关联的商户
          const user = await storage.getUser(id);

          if (!user) {
            return done(new Error("用户不存在"));
          }

          // 查找关联的商户
          const merchant = await db
            .query.merchants.findFirst({
              where: eq(merchants.userId, id)
            });

          if (!merchant) {
            return done(new Error("商户不存在"));
          }

          const authUser: AuthUser = {
            ...user,
            role: "merchant",
            merchant: merchant,
          };

          return done(null, authUser);
        }
      } else if (role === "admin") {
        // 管理员用户
        const user = await storage.getUser(id);

        if (!user) {
          return done(new Error("用户不存在"));
        }

        // 查找关联的管理员
        const admin = await db
          .query.admins.findFirst({
            where: eq(admins.userId, id)
          });

        if (!admin) {
          return done(new Error("管理员不存在"));
        }

        const authUser: AuthUser = {
          ...user,
          role: "admin",
          admin: admin,
        };

        return done(null, authUser);
      } else {
        // 普通用户
        const user = await storage.getUser(id);

        if (!user) {
          return done(new Error("用户不存在"));
        }

        const authUser: AuthUser = {
          ...user,
          role: user.role || "user"
        };

        return done(null, authUser);
      }
    } catch (error) {
      return done(error);
    }
  });

  // 登录路由
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("user-local", (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: info?.message || "登录失败" });
      
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  // 商户登录路由
  app.post("/api/merchant/login", (req, res, next) => {
    passport.authenticate("merchant-local", (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: info?.message || "商户登录失败" });
      
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  // 管理员登录路由
  app.post("/api/admin/login", (req, res, next) => {
    passport.authenticate("admin-local", (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: info?.message || "管理员登录失败" });
      
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  // 注册路由
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, email, role = "user" } = req.body;
      
      // 检查用户名是否存在
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "用户名已存在" });
      }
      
      // 检查邮箱是否存在
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: "邮箱已被使用" });
      }
      
      // 创建新用户
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        role,
      });
      
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(201).json(user);
      });
    } catch (error) {
      return next(error);
    }
  });

  // 商户注册路由
  app.post("/api/merchant/register", async (req, res, next) => {
    try {
      // 从请求中获取商户信息
      const { 
        companyName, contactName, contactEmail, contactPhone, 
        country, address, businessType, website 
      } = req.body;
      
      // 生成唯一商户代码
      const merchantCode = `M${Date.now().toString().substring(7)}`;
      
      // 生成API密钥和密钥
      const apiKey = randomBytes(16).toString("hex");
      const secretKey = randomBytes(24).toString("hex");
      
      // 创建商户
      const [newMerchant] = await db
        .insert(merchants)
        .values({
          merchantCode,
          companyName,
          contactName,
          contactEmail,
          contactPhone,
          country,
          address,
          businessType,
          website,
          apiKey,
          secretKey,
          status: "pending",
        })
        .returning();
        
      if (!newMerchant) {
        return res.status(500).json({ error: "创建商户失败" });
      }
      
      // 返回商户信息和密钥（仅在注册时返回这些敏感信息）
      return res.status(201).json({
        merchant: newMerchant,
        credentials: {
          apiKey,
          secretKey,
        },
        message: "商户创建成功，请妥善保管您的API密钥和密钥",
      });
    } catch (error) {
      return next(error);
    }
  });

  // 登出路由
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "登出失败" });
      }
      res.status(200).json({ message: "已成功登出" });
    });
  });

  // 获取当前用户信息
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "未登录" });
    }
    res.json(req.user);
  });

  // 检查是否为商户用户中间件
  const ensureMerchant = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || req.user.role !== "merchant") {
      return res.status(403).json({ error: "需要商户权限" });
    }
    next();
  };

  // 检查是否为管理员中间件
  const ensureAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ error: "需要管理员权限" });
    }
    next();
  };

  // 检查是否已登录中间件
  const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "未登录" });
    }
    next();
  };

  // 导出中间件
  return {
    ensureAuthenticated,
    ensureMerchant,
    ensureAdmin,
  };
}