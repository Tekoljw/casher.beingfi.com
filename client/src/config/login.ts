// 登录页面配置
export const LOGIN_CONFIG = {
  // 登录页面展示模式
  // 1: 账号 + 密码登录
  // 2: 钱包ID + 验证码登录
  DISPLAY_MODE: 2,
  
  // 配置说明
  MODES: {
    1: {
      name: '账号密码登录',
      description: '用户需要输入用户名和密码进行登录'
    },
    2: {
      name: '钱包ID验证码登录', 
      description: '用户需要输入钱包ID和验证码进行登录'
    }
  }
} as const;

// 导出类型
export type LoginDisplayMode = typeof LOGIN_CONFIG.DISPLAY_MODE;
