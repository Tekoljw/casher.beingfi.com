# 商户后台接口文档

本文档整理商户后台所有界面（含登录页）所对接的接口，便于前后端联调与维护。

---

## 一、基础说明

### 1.1 接口基础地址

- **当前使用**：`https://test-otc-api.beingfi.com`
- **配置位置**：`client/src/lib/queryClient.ts` 中的 `BASE_URL`
- 所有接口路径均为相对上述基础地址的路径。

### 1.2 认证方式

- 商户后台使用 **merchantToken** 作为登录凭证，保存在 `localStorage` 的 `merchantToken` 中。
- 除**登录接口**外，其余接口均需携带 token：
  - **GET/HEAD**：通过 URL 查询参数 `token` 传递。
  - **POST（JSON）**：在请求体中包含 `token` 字段。
  - **POST（FormData）**：在 FormData 中追加 `token` 字段。
- 前端通过 `apiRequest`（`client/src/lib/queryClient.ts`）统一处理，若本地存在 token 会自动附加。

### 1.3 通用响应格式

```json
{
  "code": 0,      // 0 表示成功，非 0 表示失败
  "msg": "提示信息",
  "data": {}      // 业务数据，结构因接口而异
}
```

- `code === 0`：成功。
- `code === -1` 且 `msg === '未知用户'`：未登录或会话过期，前端会清空本地存储并跳转登录。
- 其他非 0：按 `msg` 提示处理。

---

## 二、登录相关

### 2.1 商户登录

| 项目 | 说明 |
|------|------|
| **界面** | 商户登录页 `merchant-login` |
| **方法** | POST |
| **路径** | `/Api/Login/doMerchartLogin` |
| **认证** | 不需要 token |
| **Content-Type** | multipart/form-data (FormData) |

**请求参数（FormData）**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| walletid | string | 是 | 钱包 ID |
| code | string | 是 | 验证码（BePay 机器人发送） |

**响应说明**

- 成功：`code === 0`，且 `data.role === '5'`（商户角色）。
- 前端会保存 `data.token` 到 `merchantToken`，`data` 整份到 `merchantUser`，并跳转 `/merchant`。
- 失败：`code !== 0` 或 `data.role !== '5'` 时提示错误，不跳转。

---

## 三、商户仪表盘（/merchant）各模块接口

### 3.1 资产（我的资产）

#### 3.1.1 获取商户资产

| 项目 | 说明 |
|------|------|
| **方法** | POST |
| **路径** | `/api/Merchart/getUserAssets` |
| **认证** | 需要 merchantToken |
| **Content-Type** | application/json |

**请求体**

```json
{
  "token": "商户 token"
}
```

**响应 data 示例（与资产展示相关）**

- `data.user_amount`：各币种资产，键为币种，值为 `{ available, freeze }` 等。
- 前端据此计算余额、可用、冻结等。

---

#### 3.1.2 冻结记录（分页）

| 项目 | 说明 |
|------|------|
| **方法** | POST |
| **路径** | `/api/Merchart/freezeList` |
| **认证** | 需要 merchantToken |
| **Content-Type** | application/json |

**请求体**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| token | string | 是 | 商户 token |
| pageNum | number | 是 | 页码，从 1 开始 |
| pageSize | number | 是 | 每页条数，当前固定 15 |

**响应 data 结构**

- `data.page`：`{ all_page, current_page, ... }` 分页信息。
- `data.list`：冻结记录列表，项含 `id, addtime, currency, amount, remark, settleid, status` 等。

---

#### 3.1.3 结算记录（分页）

| 项目 | 说明 |
|------|------|
| **方法** | POST |
| **路径** | `/api/Merchart/settleList` |
| **认证** | 需要 merchantToken |
| **Content-Type** | application/json |

**请求体**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| token | string | 是 | 商户 token |
| pageNum | number | 是 | 页码 |
| pageSize | number | 是 | 每页条数，当前 15 |

**响应 data 结构**

- `data.page`：分页信息。
- `data.list`：结算记录列表。

---

#### 3.1.4 提交结算申请

| 项目 | 说明 |
|------|------|
| **方法** | POST |
| **路径** | `/api/Merchart/doSettle` |
| **认证** | 需要 merchantToken |
| **Content-Type** | application/json |

**请求体**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| token | string | 是 | 商户 token |
| type | number | 是 | 固定传 3 |
| currency | string | 是 | 结算币种 |
| amount | number | 是 | 结算金额 |
| address | string | 是 | USDT 收款地址 |

**响应**

- 成功：`code === 0`，前端刷新资产并关闭结算弹窗。
- 失败：提示 `msg`。

---

### 3.2 订单管理（API 订单）

#### 3.2.1 币种列表（下拉/筛选用）

| 项目 | 说明 |
|------|------|
| **方法** | POST |
| **路径** | `/Api/Index/currencys` |
| **认证** | 需要 token（会由 queryClient 自动带） |
| **说明** | 与 `useCurrencyList` 共用，返回所有币种，用于订单筛选等。 |

**请求体**

- 无 body 或仅带 `token`（由前端统一附加）。

**响应 data**

- 数组，项含 `id, currency, desc, addtime` 等。

---

#### 3.2.2 按币种获取支付类型

| 项目 | 说明 |
|------|------|
| **方法** | POST |
| **路径** | `/Api/Index/paytypes` |
| **认证** | 需要 token |
| **Content-Type** | application/json |

**请求体**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| currency | string | 是 | 币种，如 CNY、USDT |

**响应**

- `code === 0` 且 `data` 为数组时，为支付类型列表（含 `id, name/title` 等），用于订单通道筛选。

---

#### 3.2.3 按支付类型获取通道列表

| 项目 | 说明 |
|------|------|
| **方法** | POST |
| **路径** | `/Api/Index/payTypeList` |
| **认证** | 需要 token |
| **Content-Type** | application/json |

**请求体**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| paytype | string/number | 是 | 支付类型 ID（来自 paytypes 接口） |

**响应**

- `code === 0` 且 `data` 为数组时，为通道列表（含 `channelid/id, channel_title/title/name` 等），用于订单通道筛选。

---

#### 3.2.4 我的 API 订单列表（分页）

| 项目 | 说明 |
|------|------|
| **方法** | POST |
| **路径** | `/api/Merchart/myApiOrderList` |
| **认证** | 需要 merchantToken |
| **Content-Type** | application/json |

**请求体**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| token | string | 是 | 商户 token |
| pageNum | number | 是 | 页码 |
| pageSize | number | 是 | 每页条数，当前 15 |
| status | string | 否 | 订单状态：0 待处理，1 处理中，2 支付成功，3 支付失败，6 订单关闭 |
| otype | string | 否 | 类型：2 代收，1 代付 |
| currency | string | 否 | 币种 |
| pay_channelid | string | 否 | 通道 ID |
| orderid | string | 否 | 平台订单号（与搜索类型 orderid 对应） |
| out_order_id | string | 否 | 商户订单号（与搜索类型 out_order_id 对应） |
| payment_order_id | string | 否 | 支付单号（与搜索类型 payment_order_id 对应） |
| starttime | string | 否 | 开始时间（秒级时间戳字符串） |
| endtime | string | 否 | 结束时间（秒级时间戳字符串） |

**响应 data 结构**

- `data.page`：分页信息（如 `all_page, current_page`）。
- `data.list`：订单列表，结构以实际后端为准，前端会做字段映射（如订单号、金额、状态、时间等）。

---

#### 3.2.5 导出 API 订单

| 项目 | 说明 |
|------|------|
| **方法** | POST |
| **路径** | `/api/Merchart/exportApiOrderList` |
| **认证** | 需要 merchantToken |
| **Content-Type** | application/json |

**请求体**

- 与「我的 API 订单列表」类似，至少包含：`token, starttime, endtime`。
- 可带与列表相同的筛选参数：`status, otype, currency` 等。

**响应**

- 成功时 `data` 为订单列表或导出相关数据，具体以后端实现为准（如文件 URL 或列表数据）。

---

### 3.3 下级商户

#### 3.3.1 下级商户列表（分页）

| 项目 | 说明 |
|------|------|
| **方法** | POST |
| **路径** | `/api/Index/mercharts` |
| **认证** | 需要 token（queryClient 自动带） |
| **Content-Type** | application/json |

**请求体**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| pageNum | number | 是 | 页码 |
| pageSize | number | 是 | 每页条数，当前 15 |
| nickname | string | 否 | 商户名称/昵称，搜索用 |

**响应 data 结构**

- `data.page`：分页信息。
- `data.list`：下级商户列表，项含 id、昵称、钱包 ID、余额、订单数、状态、创建时间、通道费率等（字段以实际为准）。

---

#### 3.3.2 编辑下级商户

| 项目 | 说明 |
|------|------|
| **方法** | POST |
| **路径** | `/api/Index/editMerchart` |
| **认证** | 需要 token |
| **Content-Type** | application/json |

**请求体（按场景三选一或组合）**

- 仅改名称：`id, nickname, wallet_id`（wallet_id 可为原值）。
- 仅改钱包 ID：`id, nickname`（原名称）, `wallet_id`（新值）。
- 改通道费率：`id, nickname, wallet_id`，以及 `channel_fees`（键为 channelid，值为费率配置对象，如 `receive_commission, receive_fee, payment_commission, payment_fee, punish_commission, overtime_penalties` 等）。

**响应**

- 成功：`code === 200` 或 `code === 0`，前端刷新下级商户列表。
- 失败：提示 `msg`。

---

#### 3.3.3 添加下级商户

| 项目 | 说明 |
|------|------|
| **方法** | POST |
| **路径** | `/api/Index/addMerchart` |
| **认证** | 需要 token |
| **Content-Type** | application/json |

**请求体**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| nickname | string | 是 | 商户名称 |
| wallet_id | string | 是 | 钱包 ID |

**响应**

- 成功：`code === 200` 或 `code === 0`，前端关闭抽屉并刷新列表。
- 失败：提示 `msg`。

---

### 3.4 佣金记录

#### 3.4.1 佣金记录列表（分页）

| 项目 | 说明 |
|------|------|
| **方法** | POST |
| **路径** | `/api/Merchart/commissionList` |
| **认证** | 需要 merchantToken |
| **Content-Type** | multipart/form-data (FormData) |

**请求参数（FormData）**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| token | string | 是 | 商户 token |
| page | number/string | 是 | 页码 |
| time | string | 否 | 时间筛选：day / week / month；不传或 "all" 表示全部 |

**响应 data 结构**

- `data.page`：分页信息。
- `data.list`：佣金记录列表，项含 `id, orderid, userid, merchart_name, amount, scale, order_amount, currency, addtime` 等。
- `data.report`：汇总信息，如 `total, settle, settle_pending`（累计佣金、已结算、待结算）。

---

### 3.5 API 管理（API 配置与日志）

#### 3.5.1 获取 API 配置

| 项目 | 说明 |
|------|------|
| **方法** | POST |
| **路径** | `/Api/Index/config` |
| **认证** | 需要 merchantToken |
| **Content-Type** | application/json |

**请求体**

```json
{
  "token": "商户 token"
}
```

**响应 data 示例**

- `data.api`：如 `key`（生产密钥）、`test-key`（测试密钥）。
- `data.ip`：如 `callback`、`payment` 等回调/支付地址说明。
- 其他配置以实际返回为准。

---

#### 3.5.2 API 调用日志（分页）

| 项目 | 说明 |
|------|------|
| **方法** | POST |
| **路径** | `/api/Index/apiLogs` |
| **认证** | 需要 merchantToken |
| **Content-Type** | application/json |

**请求体**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| token | string | 是 | 商户 token |
| pageNum | number | 是 | 页码 |
| pageSize | number | 是 | 每页条数，当前 15 |

**响应 data 结构**

- `data.page`：分页信息。
- `data.list`：日志列表，项含 `id, endpoint, method, request_header, request_body, response_status, response_data, addtime, response_time` 等。

---

## 四、商户 WebApp（/merchant-webapp）

- 当前 **merchant-webapp** 页面使用本地模拟数据（`getMockMerchantData`），未对接上述后端接口。
- 若后续改为真实接口，可复用「资产」相关接口（如 getUserAssets）及登录态（merchantToken / merchantUser）。

---

## 五、接口汇总表

| 序号 | 方法 | 路径 | 说明 | 使用页面/模块 |
|------|------|------|------|----------------|
| 1 | POST | /Api/Login/doMerchartLogin | 商户登录 | 登录页 |
| 2 | POST | /api/Merchart/getUserAssets | 获取商户资产 | 资产 |
| 3 | POST | /api/Merchart/freezeList | 冻结记录分页 | 资产 |
| 4 | POST | /api/Merchart/settleList | 结算记录分页 | 资产 |
| 5 | POST | /api/Merchart/doSettle | 提交结算申请 | 资产 |
| 6 | POST | /Api/Index/currencys | 币种列表 | 订单管理 / 下级商户（筛选） |
| 7 | POST | /Api/Index/paytypes | 按币种获取支付类型 | 订单管理 / 下级商户（通道） |
| 8 | POST | /Api/Index/payTypeList | 按支付类型获取通道列表 | 订单管理 / 下级商户（通道） |
| 9 | POST | /api/Merchart/myApiOrderList | 我的 API 订单列表 | 订单管理 |
| 10 | POST | /api/Merchart/exportApiOrderList | 导出 API 订单 | 订单管理 |
| 11 | POST | /api/Index/mercharts | 下级商户列表 | 下级商户 |
| 12 | POST | /api/Index/editMerchart | 编辑下级商户 | 下级商户 |
| 13 | POST | /api/Index/addMerchart | 添加下级商户 | 下级商户 |
| 14 | POST | /api/Merchart/commissionList | 佣金记录分页 | 佣金记录 |
| 15 | POST | /Api/Index/config | 获取 API 配置 | API 管理 |
| 16 | POST | /api/Index/apiLogs | API 调用日志分页 | API 管理 |

---

## 六、相关前端文件

| 文件 | 说明 |
|------|------|
| client/src/lib/queryClient.ts | BASE_URL、apiRequest、token 附加逻辑 |
| client/src/pages/merchant-login.tsx | 登录页，调用 doMerchartLogin |
| client/src/pages/merchant-dashboard.tsx | 商户仪表盘，资产 / 订单 / 下级商户 / 佣金 / API 管理 |
| client/src/pages/merchant-webapp.tsx | 商户 WebApp（当前为模拟数据） |
| client/src/hooks/use-currency-list.ts | 币种列表，调用 /Api/Index/currencys |

---

*文档根据当前前端调用整理，若后端路径或参数有变更，请以实际后端为准并同步更新本文档。*
