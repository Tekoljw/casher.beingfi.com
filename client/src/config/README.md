# 登录配置说明

## 配置文件位置
`client/src/config/login.ts`

## 配置说明

### DISPLAY_MODE 配置
- **1**: 账号 + 密码登录模式（默认）
- **2**: 钱包ID + 验证码登录模式

### 如何切换登录模式

1. 打开 `client/src/config/login.ts` 文件
2. 修改 `DISPLAY_MODE` 的值：
   ```typescript
   export const LOGIN_CONFIG = {
     DISPLAY_MODE: 2, // 改为 2 启用钱包ID登录模式
   } as const;
   ```
3. 保存文件，重新启动开发服务器
4. 访问登录页面查看效果

### 两种模式的区别

#### 模式1：账号 + 密码登录
- 显示字段：用户名、密码
- 适用于传统的用户名密码登录方式
- 使用接口：`/api/login/doLogin`
- 传递参数：`username`（用户名）、`password`（密码）

#### 模式2：钱包ID + 验证码登录  
- 显示字段：钱包ID、验证码
- 适用于基于钱包的登录方式
- 使用接口：`/api/login/doWalletLogin`
- 传递参数：`walletid`（钱包ID）、`code`（验证码）

### 注意事项
- 修改配置后需要重新启动开发服务器才能生效
- 配置是静态的，不需要数据库支持
- 所有配置更改都会立即反映在登录页面上
