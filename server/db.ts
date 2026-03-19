import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { sql } from 'drizzle-orm';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// 初始化数据库 - 创建所有表
export async function initializeDatabase() {
  console.log('开始初始化数据库...');
  
  try {
    // 使用SQL创建表
    // 用户表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL DEFAULT 'user',
        balance DOUBLE PRECISION NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // OTC用户表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS otc_users (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL,
        full_name TEXT,
        phone_number TEXT,
        address TEXT,
        id_number TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        balance DOUBLE PRECISION NOT NULL DEFAULT 0,
        commission DOUBLE PRECISION NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 支付API表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS payment_apis (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        logo TEXT,
        documentation_url TEXT,
        is_integrated BOOLEAN NOT NULL DEFAULT FALSE,
        supported_countries TEXT[],
        supported_payment_methods TEXT[],
        collect_rate NUMERIC(5,2),
        payout_rate NUMERIC(5,2),
        provider_name TEXT,
        provider_deposit NUMERIC(10,2),
        currency TEXT DEFAULT 'USDT',
        min_transaction NUMERIC(10,2),
        max_transaction NUMERIC(10,2),
        settlement_time TEXT,
        api_status TEXT DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 集成项目表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS integration_projects (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        target_api_id INTEGER REFERENCES payment_apis(id),
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        api_documentation TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // AI对话表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ai_conversations (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES integration_projects(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        messages JSONB NOT NULL DEFAULT '[]',
        cost DOUBLE PRECISION NOT NULL DEFAULT 0.1,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 交易记录表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        amount DOUBLE PRECISION NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 生成代码表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS generated_code (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES integration_projects(id),
        language TEXT NOT NULL,
        code TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 创建支付后台系统表
    // 商户表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS merchants (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        merchant_code TEXT NOT NULL UNIQUE,
        company_name TEXT NOT NULL,
        contact_name TEXT NOT NULL,
        contact_email TEXT NOT NULL,
        contact_phone TEXT NOT NULL,
        country TEXT NOT NULL,
        address TEXT,
        business_type TEXT NOT NULL,
        website TEXT,
        api_key TEXT NOT NULL UNIQUE,
        secret_key TEXT NOT NULL,
        callback_url TEXT,
        ip_whitelist TEXT[],
        status TEXT NOT NULL DEFAULT 'pending',
        kyc_status TEXT NOT NULL DEFAULT 'not_submitted',
        kyc_documents JSONB,
        settlement_cycle TEXT DEFAULT 'T+1',
        deposit_balance NUMERIC(15,2) DEFAULT '0',
        main_balance NUMERIC(15,2) DEFAULT '0',
        fee_rate NUMERIC(5,2) DEFAULT '0',
        risk_level TEXT DEFAULT 'medium',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 管理员表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        username TEXT NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        role TEXT NOT NULL,
        permissions JSONB,
        last_login TIMESTAMP,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 支付通道表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS payment_channels (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_api_url TEXT,
        api_key TEXT,
        api_secret TEXT,
        supported_currencies TEXT[],
        supported_countries TEXT[],
        supported_methods TEXT[],
        min_amount NUMERIC(15,2),
        max_amount NUMERIC(15,2),
        processing_time TEXT,
        fee NUMERIC(5,2),
        fixed_fee NUMERIC(10,2),
        daily_limit NUMERIC(15,2),
        monthly_limit NUMERIC(15,2),
        balance NUMERIC(15,2) DEFAULT '0',
        config JSONB,
        is_active BOOLEAN DEFAULT TRUE,
        priority INTEGER DEFAULT 0,
        success_rate NUMERIC(5,2) DEFAULT '0',
        risk_score INTEGER DEFAULT 50,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 商户通道关联表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS merchant_channels (
        id SERIAL PRIMARY KEY,
        merchant_id INTEGER NOT NULL REFERENCES merchants(id),
        channel_id INTEGER NOT NULL REFERENCES payment_channels(id),
        enabled BOOLEAN DEFAULT TRUE,
        custom_fee NUMERIC(5,2),
        custom_fixed_fee NUMERIC(10,2),
        daily_limit NUMERIC(15,2),
        monthly_limit NUMERIC(15,2),
        priority INTEGER DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE (merchant_id, channel_id)
      );
    `);

    // 订单表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_no TEXT NOT NULL UNIQUE,
        merchant_id INTEGER NOT NULL REFERENCES merchants(id),
        merchant_order_id TEXT NOT NULL,
        channel_id INTEGER REFERENCES payment_channels(id),
        amount NUMERIC(15,2) NOT NULL,
        currency TEXT NOT NULL,
        type TEXT NOT NULL,
        method TEXT,
        customer_email TEXT,
        customer_name TEXT,
        customer_id TEXT,
        status TEXT NOT NULL,
        payment_data JSONB,
        callback_url TEXT,
        redirect_url TEXT,
        webhook_sent_at TIMESTAMP,
        webhook_response TEXT,
        fee NUMERIC(15,2),
        net_amount NUMERIC(15,2),
        expires_at TIMESTAMP,
        completed_at TIMESTAMP,
        failed_reason TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE (merchant_id, merchant_order_id)
      );
    `);

    // 结算表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS settlements (
        id SERIAL PRIMARY KEY,
        settlement_no TEXT NOT NULL UNIQUE,
        merchant_id INTEGER NOT NULL REFERENCES merchants(id),
        currency TEXT NOT NULL,
        amount NUMERIC(15,2) NOT NULL,
        fee NUMERIC(15,2) NOT NULL,
        actual_amount NUMERIC(15,2) NOT NULL,
        status TEXT NOT NULL,
        type TEXT NOT NULL,
        settlement_method TEXT NOT NULL,
        account_info JSONB NOT NULL,
        reviewer_id INTEGER REFERENCES admins(id),
        reviewed_at TIMESTAMP,
        completed_at TIMESTAMP,
        failed_reason TEXT,
        remark TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 加密钱包表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS crypto_wallets (
        id SERIAL PRIMARY KEY,
        merchant_id INTEGER REFERENCES merchants(id),
        wallet_name TEXT NOT NULL,
        wallet_type TEXT NOT NULL,
        coin TEXT NOT NULL,
        network TEXT NOT NULL,
        address TEXT,
        private_key TEXT,
        status TEXT NOT NULL,
        balance NUMERIC(15,5) DEFAULT '0',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 加密货币交易表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS crypto_transactions (
        id SERIAL PRIMARY KEY,
        wallet_id INTEGER NOT NULL REFERENCES crypto_wallets(id),
        merchant_id INTEGER REFERENCES merchants(id),
        tx_hash TEXT NOT NULL UNIQUE,
        tx_type TEXT NOT NULL,
        amount NUMERIC(15,5) NOT NULL,
        fee NUMERIC(15,5) NOT NULL,
        coin TEXT NOT NULL,
        from_address TEXT,
        to_address TEXT,
        status TEXT NOT NULL,
        block_height INTEGER,
        confirmations INTEGER DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 加密信用卡表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS crypto_cards (
        id SERIAL PRIMARY KEY,
        merchant_id INTEGER NOT NULL REFERENCES merchants(id),
        card_name TEXT NOT NULL,
        cardholder_name TEXT,
        card_number TEXT,
        expiry_month TEXT,
        expiry_year TEXT,
        cvv TEXT,
        card_type TEXT,
        currency TEXT NOT NULL,
        balance NUMERIC(15,2) DEFAULT '0',
        status TEXT NOT NULL,
        daily_limit NUMERIC(15,2),
        monthly_limit NUMERIC(15,2),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 信用卡交易表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS card_transactions (
        id SERIAL PRIMARY KEY,
        card_id INTEGER NOT NULL REFERENCES crypto_cards(id),
        merchant_id INTEGER NOT NULL REFERENCES merchants(id),
        tx_id TEXT NOT NULL UNIQUE,
        amount NUMERIC(15,2) NOT NULL,
        currency TEXT NOT NULL,
        tx_type TEXT NOT NULL,
        merchant_name TEXT,
        status TEXT NOT NULL,
        decline_reason TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 钱包SAAS服务表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS wallet_services (
        id SERIAL PRIMARY KEY,
        merchant_id INTEGER NOT NULL REFERENCES merchants(id),
        service_name TEXT NOT NULL,
        service_type TEXT NOT NULL,
        config JSONB,
        status TEXT NOT NULL,
        price_level TEXT NOT NULL,
        contract_start TIMESTAMP NOT NULL,
        contract_end TIMESTAMP NOT NULL,
        last_billing_date TIMESTAMP NOT NULL,
        next_billing_date TIMESTAMP NOT NULL,
        usage_stats JSONB,
        api_usage INTEGER DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 系统日志表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS system_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        merchant_id INTEGER,
        admin_id INTEGER,
        log_type TEXT NOT NULL,
        action TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        details JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log('数据库初始化成功');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}
