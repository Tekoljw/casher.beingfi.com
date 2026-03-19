# 项目多语言架构分析

## 📋 目录
1. [架构概览](#架构概览)
2. [核心文件结构](#核心文件结构)
3. [数据流](#数据流)
4. [API 接口](#api-接口)
5. [使用方式](#使用方式)
6. [翻译键命名规范](#翻译键命名规范)
7. [管理界面](#管理界面)

---

## 🏗️ 架构概览

项目采用 **React Context API + Custom Hook** 的方式实现多语言支持，具有以下特点：

- ✅ **集中式管理**：所有翻译数据集中在 `use-language.tsx` 中
- ✅ **动态加载**：支持从后端 API 动态加载翻译配置
- ✅ **默认后备**：内置默认翻译字典作为后备方案
- ✅ **实时编辑**：提供可视化界面编辑翻译内容
- ✅ **类型安全**：使用 TypeScript 确保类型安全

### 架构层次图

```
App.tsx
  └── LanguageProvider (use-language.tsx)
      ├── 状态管理
      │   ├── language: 'zh' | 'en'
      │   ├── translations: { zh: {...}, en: {...} }
      │   └── isLoading: boolean
      ├── 数据加载
      │   └── useEffect → /Api/Index/getLangConfig
      └── 提供 Context
          └── useLanguage() Hook
              └── 组件使用 t(key) 获取翻译
```

---

## 📁 核心文件结构

### 1. **`client/src/hooks/use-language.tsx`** (核心实现)

**职责**：
- 定义多语言 Context 和 Provider
- 管理语言状态（当前语言、翻译字典）
- 从后端加载翻译数据
- 提供 `useLanguage()` Hook

**关键代码结构**：

```typescript
// 类型定义
type Language = 'zh' | 'en';
type TranslationDict = Record<string, string>;
type Translations = {
  [key in Language]: TranslationDict;
};

// Context 接口
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  updateTranslations: (newTranslations: Translations) => void;
  translations: Translations;
}

// Provider 组件
export function LanguageProvider({ children }: { children: ReactNode }) {
  // 状态管理
  const [language, setLanguageState] = useState<Language>('zh');
  const [translations, setTranslations] = useState<Translations>(defaultTranslations);
  
  // 从后端加载翻译
  useEffect(() => {
    // 加载逻辑...
  }, []);
  
  // 翻译函数
  const t = (key: string, fallback?: string): string => {
    return translations[language][key] || fallback || key;
  };
  
  return (
    <LanguageContext.Provider value={{...}}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage必须在LanguageProvider内部使用');
  }
  return context;
}
```

### 2. **`client/src/App.tsx`** (应用入口)

**职责**：
- 在应用顶层包裹 `LanguageProvider`
- 确保所有组件都能访问多语言功能

```typescript
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>  {/* 多语言 Provider */}
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

### 3. **`client/src/components/otc/LanguageSettings.tsx`** (管理界面)

**职责**：
- 提供可视化界面编辑翻译内容
- 支持搜索、过滤翻译项
- 保存翻译到后端

**功能特性**：
- ✅ 左侧显示翻译键（key）
- ✅ 右侧显示当前选中语言的值（可编辑）
- ✅ 支持中英文切换编辑
- ✅ 搜索过滤功能
- ✅ 保存并上传到后端

### 4. **`client/src/contexts/LanguageContext.tsx`** (旧实现)

**状态**：⚠️ **已废弃，不再使用**

**说明**：这是旧版本的多语言实现，目前项目统一使用 `use-language.tsx`。

---

## 🔄 数据流

### 1. 初始化流程

```
页面加载
  ↓
LanguageProvider 初始化
  ↓
检查路径和 Token
  ├── 如果是登录页 → 使用默认翻译
  ├── 如果没有 Token → 使用默认翻译
  └── 否则 → 调用 API
      ↓
调用 /Api/Index/getLangConfig
  ↓
解析返回的 config（字符串或对象）
  ↓
合并数据：{ ...defaultTranslations, ...backendData }
  ↓
更新 translations 状态
  ↓
组件通过 t(key) 获取翻译
```

### 2. 数据合并策略

```typescript
// 后端数据优先，覆盖默认翻译
const mergedTranslations = {
  zh: { 
    ...defaultTranslations.zh,  // 先使用默认翻译作为基础
    ...(configData.zh || {})    // 后端数据覆盖（优先级更高）
  },
  en: { 
    ...defaultTranslations.en,
    ...(configData.en || {})
  }
};
```

**优先级**：后端数据 > 默认翻译

### 3. 翻译查找流程

```
组件调用 t('otc.dashboard.title')
  ↓
useLanguage() 获取当前 language 和 translations
  ↓
查找 translations[language]['otc.dashboard.title']
  ├── 找到 → 返回翻译值
  ├── 未找到但有 fallback → 返回 fallback
  └── 都未找到 → 返回 key 本身
```

---

## 🌐 API 接口

### 1. 获取翻译配置

**接口**：`POST /Api/Index/getLangConfig`

**请求**：无需参数（使用 Token 认证）

**响应格式**：
```typescript
interface LanguageConfigResponse {
  code: number;
  msg: string;
  data: {
    config: string | { 
      en?: TranslationDict; 
      zh?: TranslationDict 
    };
  };
}
```

**说明**：
- `config` 可能是 JSON 字符串或对象
- 代码会自动判断类型并解析

**示例响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "config": "{\"en\": {\"app.name\": \"BePay\"}, \"zh\": {\"app.name\": \"BePay\"}}"
  }
}
```

或

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "config": {
      "en": {"app.name": "BePay"},
      "zh": {"app.name": "BePay"}
    }
  }
}
```

### 2. 保存翻译配置

**接口**：`POST /Api/Index/saveLangConfig`

**请求参数**：
```typescript
{
  config: string; // JSON 字符串化的翻译字典
}
```

**请求体示例**：
```json
{
  "config": "{\"en\": {\"app.name\": \"BePay\"}, \"zh\": {\"app.name\": \"BePay\"}}"
}
```

**响应格式**：
```typescript
{
  code: number;
  msg: string;
}
```

---

## 💻 使用方式

### 1. 在组件中使用

```typescript
import { useLanguage } from "@/hooks/use-language";

function MyComponent() {
  const { t, language, setLanguage } = useLanguage();
  
  return (
    <div>
      <h1>{t('otc.dashboard.title')}</h1>
      <button onClick={() => setLanguage('en')}>English</button>
    </div>
  );
}
```

### 2. 翻译函数 `t()`

**签名**：
```typescript
t(key: string, fallback?: string): string
```

**参数**：
- `key`: 翻译键（如 `'otc.dashboard.title'`）
- `fallback`: 可选的后备文本（当翻译不存在时使用）

**返回值**：翻译后的文本

**示例**：
```typescript
// 基本使用
t('otc.dashboard.title')  // 返回当前语言的翻译

// 带后备值
t('otc.dashboard.title', '仪表盘')  // 如果翻译不存在，返回 '仪表盘'

// 如果翻译和后备都不存在，返回 key 本身
t('unknown.key')  // 返回 'unknown.key'
```

### 3. 切换语言

```typescript
const { setLanguage } = useLanguage();

// 切换到英文
setLanguage('en');

// 切换到中文
setLanguage('zh');
```

**说明**：
- 语言设置会自动保存到 `localStorage`（key: `'language'`）
- 页面刷新后会自动恢复上次选择的语言

---

## 📝 翻译键命名规范

### 命名结构

```
{模块}.{子模块}.{功能}.{元素}
```

### 命名示例

```
app.name                    // 应用名称
app.description             // 应用描述

otc.dashboard.title         // OTC 仪表盘标题
otc.nav.orders              // OTC 导航 - 订单
otc.orders.table.channel    // OTC 订单表格 - 通道列
otc.orders.export.button    // OTC 订单 - 导出按钮

language.key                // 语言设置 - 键
language.value              // 语言设置 - 值
language.success.updated    // 语言设置 - 成功消息
```

### 主要模块前缀

- `app.*` - 应用通用
- `home.*` - 首页
- `otc.*` - OTC 系统
  - `otc.dashboard.*` - 仪表盘
  - `otc.nav.*` - 导航
  - `otc.orders.*` - 订单管理
  - `otc.accounts.*` - 账户管理
  - `otc.settlements.*` - 结算管理
  - `otc.team.*` - 团队管理
  - `otc.settings.*` - 设置
  - `otc.reports.*` - 报表
  - `otc.api.*` - API 管理
- `language.*` - 语言设置
- `common.*` - 通用组件

---

## 🎨 管理界面

### LanguageSettings 组件

**位置**：`client/src/components/otc/LanguageSettings.tsx`

**功能**：
1. **语言切换**：在中文和英文之间切换编辑
2. **搜索过滤**：根据键或值搜索翻译项
3. **表格编辑**：
   - 左列：翻译键（只读）
   - 右列：当前语言的值（可编辑）
4. **保存上传**：
   - 点击"保存"按钮
   - 将编辑后的翻译数据上传到后端
   - 同时更新本地 Context

**界面布局**：
```
┌─────────────────────────────────────┐
│  语言设置                            │
├─────────────────────────────────────┤
│  [CN] [EN]  (语言切换按钮)           │
│  [🔍 搜索框]                          │
│  [💾 保存]                            │
├─────────────────────────────────────┤
│  键              │  值 (可编辑)      │
├─────────────────┼───────────────────┤
│  app.name       │  BePay            │
│  app.description│  AI驱动的支付...   │
│  ...            │  ...              │
└─────────────────────────────────────┘
```

**数据转换**：

```typescript
// Context 格式 → 编辑格式
{
  zh: { 'app.name': 'BePay' },
  en: { 'app.name': 'BePay' }
}
  ↓
[
  { key: 'app.name', chinese: 'BePay', english: 'BePay', enabled: true }
]

// 编辑格式 → Context 格式
[
  { key: 'app.name', chinese: 'BePay', english: 'BePay' }
]
  ↓
{
  zh: { 'app.name': 'BePay' },
  en: { 'app.name': 'BePay' }
}
```

---

## 🔍 关键特性

### 1. 智能加载策略

- ✅ **登录页检测**：在登录页不调用 API，使用默认翻译
- ✅ **Token 检测**：没有 Token 时不调用 API
- ✅ **错误处理**：API 失败时使用默认翻译，不阻塞页面

### 2. 数据兼容性

- ✅ **字符串格式**：支持 JSON 字符串格式的 config
- ✅ **对象格式**：支持直接对象格式的 config
- ✅ **自动判断**：代码自动判断类型并处理

### 3. 类型安全

- ✅ **TypeScript 类型定义**：完整的类型定义
- ✅ **编译时检查**：翻译键的类型检查
- ✅ **运行时安全**：fallback 机制确保不会显示 undefined

### 4. 性能优化

- ✅ **单次加载**：翻译数据只在组件挂载时加载一次
- ✅ **本地缓存**：语言选择保存到 localStorage
- ✅ **合并策略**：后端数据与默认翻译智能合并

---

## 📊 使用统计

根据代码搜索，项目中有 **46+ 个文件**使用了多语言功能，包括：

- OTC 系统所有页面组件
- 主站页面组件
- 通用组件（Header, Footer 等）
- 对话框和表单组件

---

## 🚀 最佳实践

### 1. 添加新翻译

1. 在 `use-language.tsx` 的 `defaultTranslations` 中添加翻译键
2. 在组件中使用 `t('your.key')` 获取翻译
3. 在 `LanguageSettings` 页面可以编辑和保存

### 2. 翻译键命名

- ✅ 使用点分隔的层级结构
- ✅ 使用小写字母和点号
- ✅ 保持命名一致性
- ❌ 避免过深的嵌套（建议不超过 4 层）

### 3. 组件开发

```typescript
// ✅ 推荐：使用 t() 函数
<h1>{t('otc.dashboard.title')}</h1>

// ❌ 不推荐：硬编码文本
<h1>仪表盘</h1>
```

### 4. 错误处理

```typescript
// ✅ 推荐：提供后备值
t('otc.dashboard.title', '仪表盘')

// ✅ 也可以：不提供后备值（会返回 key）
t('otc.dashboard.title')
```

---

## 📚 相关文件

- **核心实现**：`client/src/hooks/use-language.tsx`
- **管理界面**：`client/src/components/otc/LanguageSettings.tsx`
- **应用入口**：`client/src/App.tsx`
- **语言切换器**：`client/src/components/otc/LanguageSwitcher.tsx`
- **旧实现（废弃）**：`client/src/contexts/LanguageContext.tsx`

---

## 🔧 故障排查

### 问题：翻译不显示

1. 检查组件是否在 `LanguageProvider` 内部
2. 检查翻译键是否正确
3. 检查后端 API 是否返回数据
4. 查看浏览器控制台的日志

### 问题：无限刷新

- ✅ 已修复：添加了路径和 Token 检测，避免在登录页调用 API

### 问题：翻译数据未更新

1. 检查 `LanguageSettings` 页面是否点击了"保存"
2. 检查后端 API 是否成功保存
3. 刷新页面查看是否生效

---

**最后更新**：2024年

