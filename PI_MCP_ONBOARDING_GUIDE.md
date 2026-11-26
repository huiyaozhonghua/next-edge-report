# Pi MCP 接入与 Pi App 上架 · Agent 实操报告

> **读者**：任何 AI Agent（Claude Code / Codex / WorkBuddy / 自建 agent）
> **目标**：独立完成「连上 Pi MCP → 注册 Pi App → 部署 → 上架 → 加支付」
> **实测环境**：Windows 11 · Node 22.22.2 · 2026-11-25 ~ 11-26
> **作者实测的 app**：`Next Edge Report`（`6b0672d68f5d0b3dd1cbb3d9`）

---

## 0. TL;DR —— 最短成功路径

```bash
# 1. 配 MCP（写 ~/.workbuddy/mcp.json，或对应客户端的配置文件）
"pi-developers": { "type": "streamableHttp", "url": "https://developers.minepi.com/mcp" }

# 2. OAuth 授权 —— 必须人工用「手机 Pi Browser 扫码批准」
#    agent 无法自己登录，这是设计使然

# 3. 验证
mcp.call("whoami")        # → { username, terms_accepted }

# 4. 走官方 funnel（见第 6 节），别自己发明流程
```

**三个最容易踩的坑**（详见第 8 节）：

| # | 症状 | 解法 |
|---|---|---|
| 1 | MCP 报 **502** | 删掉 `%TEMP%/mcp_sid.json` 重建 session |
| 2 | OAuth 报 **`invalid_client`** | client_id 必须是自己注册的；**`redirect_uri` 可省略**（服务端用默认回调）|
| 3 | Cloudflare Functions 支付路由 **405** | Pages Functions **按文件路径路由**，子路径要独立文件 |

---

## 1. 前置条件

| 项 | 要求 |
|---|---|
| Pi 账号 | 已完成 **KYC**（否则 `pi_kyc_not_applied`）|
| 网络 | **必须走代理**才能访问 `developers.minepi.com` / `api.minepi.com` |
| Node | ≥ 18（本文用 22.22.2）|
| 工具 | `curl`、FFmpeg（可选，用于验证素材）|

> ⚠️ **中国大陆网络环境**：`developers.minepi.com`、`api.minepi.com`、
> `blockexplorer.minepi.com`、`socialchain.app` 都需要代理。
> 开发时给 agent 配好 `HTTP_PROXY` / `HTTPS_PROXY` 环境变量。

---

## 2. 配置 MCP 服务端点

Pi 的 MCP 是**远程 streamable HTTP**，不需要本地进程。

**WorkBuddy**（`~/.workbuddy/mcp.json`）：
```json
{
  "mcpServers": {
    "pi-developers": {
      "type": "streamableHttp",
      "url": "https://developers.minepi.com/mcp"
    }
  }
}
```

**通用（Claude Code 等）**：
```bash
claude mcp add --transport http pi-developers https://developers.minepi.com/mcp
```

> 不需要 `command` / `args` / `headers` —— **OAuth 由客户端自己管理**，
> agent 不该手写 Authorization header。

---

## 3. OAuth 授权（**唯一必须人工介入的一步**）

### 3.1 协议形态

Pi 用 **OAuth 2.0 + PKCE(S256)**，且**授权必须在手机 Pi Browser 里扫码批准**。

```
GET https://developers.minepi.com/oauth/authorize
    ?response_type=code
    &client_id=<你的客户端 ID>
    &state=<随机串>
    &code_challenge=<S256(verifier) 的 base64url>
    &code_challenge_method=S256
    &redirect_uri=<回调地址>
    &scope=profile:read profile:write apps:read apps:write
    &resource=https://developers.minepi.com/mcp
```

### 3.2 ⚠️ client_id 与 redirect_uri 的准确规则

**这是最容易踩的坑。** 实测三种组合的错误信息各不相同：

| 组合 | 服务端返回 |
|---|---|
| **未注册的 client_id** | `{"error":"invalid_client","error_description":"Unknown client"}` |
| 已注册 client_id + **未注册的 redirect_uri** | `{"error":"invalid_request","error_description":"redirect_uri is not registered for this client"}` |
| 已注册 client_id + **省略 redirect_uri** | ✅ **302 跳转，正常受理** |

**关键结论**：
1. `client_id` 必须是你**自己**注册的（官方原文：*"Do not request, copy, or store the person's
   Pi credentials or Pi access token."*）—— 复用别人的会报 `invalid_client`
2. **`redirect_uri` 是可选的** —— 省略时服务端用该 client 注册的默认回调。
   **对 agent 来说这是最省事的做法**：不需要本地起 callback server。
3. 已知可用的 client_id（仅供理解机制，**请注册自己的**）：

| 客户端 | client_id | 备注 |
|---|---|---|
| WorkBuddy | `P7SIraXvRJb4KXu0Sj1iCrVI_8fAf3bF` | 省略 redirect_uri 可用 |
| Codex | `01tHuigMHNpyWBX4V8hKYogRasGstW0q2` | 实测 `invalid_client`，可能已失效 |

### 3.3 授权的真实链路（实测）

```
GET https://developers.minepi.com/oauth/authorize?...
        │
        │  302 Location: /devconsole/consent?token=<opaque token>
        ▼
   /devconsole/consent  （SPA，需登录）
        │
        │  用户用「手机 Pi Browser」扫码批准
        ▼
   回调带 ?code=...  →  换 token
```

**注意**：`authorize` **不直接返回 code**，中间有一个 consent token 的确认页。
所以 agent 不能只靠 HTTP 请求走完 —— **必须用户在手机 Pi Browser 上操作**。

### 3.4 生成 PKCE 对并输出授权链接

用现成脚本（见 `tools/gen_pkce.mjs`，零依赖，已冒烟测试）：

```bash
node tools/gen_pkce.mjs <client_id> [redirect_uri] [outDir]
```

产出两个文件：
- `pi-authorize.html` —— 给用户点的授权页（含确认要点 + 安全提醒）
- `pkce.json` —— `{ client_id, redirect_uri, verifier, state }`，**换 token 时要用 verifier**

脚本已处理：PKCE S256 生成、base64url 编码、输出目录自建、授权页模板。

<details>
<summary>等价的内联版（不依赖脚本）</summary>

```js
// gen_pkce.mjs —— 零依赖
import crypto from "node:crypto";

const clientId   = process.argv[2];              // 你自己注册的 client_id
const redirect   = process.argv[3] || "";        // 可省略
const resource   = "https://developers.minepi.com/mcp";
const scope      = "profile:read profile:write apps:read apps:write";

const verifier  = crypto.randomBytes(32).toString("base64url");
const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
const state     = crypto.randomBytes(16).toString("base64url");

let url = "https://developers.minepi.com/oauth/authorize"
  + "?response_type=code"
  + `&client_id=${encodeURIComponent(clientId)}`
  + `&state=${state}`
  + `&code_challenge=${challenge}`
  + "&code_challenge_method=S256"
  + `&scope=${encodeURIComponent(scope)}`
  + `&resource=${encodeURIComponent(resource)}`;
if (redirect) url += `&redirect_uri=${encodeURIComponent(redirect)}`;

console.log(url);
console.log(verifier);
```
</details>

### 3.5 换取 token

```
POST https://developers.minepi.com/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=<回调拿到的 code>
&client_id=<client_id>
&redirect_uri=<redirect_uri>
&code_verifier=<3.3 存的 verifier>
```

拿到 `access_token` 后：
- **存到客户端自己的凭据存储**（WorkBuddy 会自动加密进
  `~/.workbuddy/connectors/<userId>/.credentials.v3.json`）
- **绝不要**贴进对话、打印到日志、写进仓库

### 3.6 授权页给用户看的样子

`tools/gen_pkce.mjs` 会自动生成一个本地 HTML 页（`pi-authorize.html`），包含：
- 一个大按钮，链接指向 authorize URL
- **确认要点**：网址必须以 `developers.minepi.com/oauth/authorize` 开头；
  client_id 前缀对不对；页面里不应出现 `accounts.pinet.com`
- 安全提醒：只在 `minepi.com` / `pinet.com` 域名下扫码；**任何页面都不要输入助记词或私钥**

---

## 4. MCP 协议细节（手写客户端时用）

Pi MCP 是 **streamable HTTP**，不是 SSE、不是 stdio。

### 4.1 必需请求头

```http
POST https://developers.minepi.com/mcp
Content-Type: application/json
Accept: application/json, text/event-stream
MCP-Protocol-Version: 2025-06-18
Authorization: Bearer <access_token>
Mcp-Session-Id: <session id>        # initialize 之后才有
```

### 4.2 响应解析

服务端可能返回两种格式，都要处理：

- `Content-Type: application/json` → 直接是 JSON
- `Content-Type: text/event-stream` → **SSE**，每条 `data: {json}`，要过滤掉 `[DONE]`

```js
function parseSse(out) {
  if (out.includes("data:")) {
    return out.split("\n")
      .filter(l => l.startsWith("data:"))
      .map(l => l.slice(5).trim())
      .filter(x => x && x !== "[DONE]")
      .join("\n");
  }
  return out;
}
```

### 4.3 调用序列

```
1. POST initialize   { protocolVersion:"2025-06-18", capabilities:{}, clientInfo:{name,version} }
   → 从响应头 Mcp-Session-Id 拿 session id，存起来
2. POST notifications/initialized
3. POST tools/list
4. POST tools/call   { name, arguments }
```

**结果解包**：`result.content[0].text` 里装的是 **JSON 字符串**，要再 parse 一次：

```js
const o = JSON.parse(raw);
if (o.result?.content?.[0]?.text) return JSON.parse(o.result.content[0].text);
```

---

## 5. 验证连接

```bash
mcp.call("whoami")
# → { "id": "...", "username": "ZJH18981927828", "terms_accepted": true,
#     "terms_url": "https://socialchain.app/developer_terms" }
```

`terms_accepted: false` 才需要：`show terms_url` → 用户确认 → `terms_accept`。

> 官方措辞：*"Allowing this MCP on the Pi sign-in page accepts the Pi Developer Terms.
> Only if `whoami` shows `terms_accepted: false`…"*

---

## 6. 官方 onboarding funnel（**照着走，不要自己发明**）

官方指令在 **`https://developers.minepi.com/agents.md`** —— agent 接手 Pi 项目时**必须先读这份文档**。
它定义了 13 个工具和 6 步 funnel。

### 6.1 工具清单（实测完整 13 个）

| 工具 | 作用 |
|---|---|
| `whoami` | 身份 + 条款状态（**第一个调用**）|
| `terms_accept` | 记录用户已接受 Pi Developer Terms |
| `create_app` | 创建 app（**创建前必须问 Staging / Production**）|
| `list_apps` | 列出已有 app（**优先复用，别造重复**）|
| `get_app` | 查 app 详情 + checklist |
| `update_app` | 改字段 |
| `verify_app_url_ownership` | 域名所有权验证 → 分配 `pi_url` |
| `prepare_app_logo_upload` | 准备 logo 上传（返回 `logo_prompt`）|
| `set_app_logo` | 提交 logo（用 `file_key`）|
| `prompt_payments` | **返回支付实现的官方编码提示** |
| `logout` | 撤销 token |
| `list_features` / `get_feature_docs` | Pi 能力发现（广告/订阅/通知/聊天等）|

### 6.2 Funnel 六步

```
1. 注册/选择 app      → 必须问 Staging(Testnet) 还是 Production(Mainnet)
                        网络不可更改（切换 = 新建 app）
                        只有 Production 能上架
2. Staging 才需要修 iframe/CSP 给 Pi Sandbox 用
   Production 直接部署到公网 HTTPS，在 Pi Browser 里测
3. 建议 Pi Payments   → prompt_payments（见第 7 节）
4. 要公网 HTTPS URL   → update_app(frontend_url) → verify_app_url_ownership
                        → 展示 pi_url 让用户在 Pi Browser 打开
5. Staging 到这就结束（不可上架）
   Production → 给 listing_url，让用户在电脑上完成上架并提交审核
6. Production 加 logo → prepare_app_logo_upload → 生成 1024×1024 → upload_command → set_app_logo
```

### 6.3 关键字段

| 字段 | 说明 |
|---|---|
| `developers_url` | app 总览页 |
| `settings_url` | 设置（API key、URL）|
| `sandbox_url` | Pi Sandbox（仅 Staging）|
| `wallet_setup_url` | 申请 app wallet（**必须原样打开**，完成后的引导会回到对话）|
| `publish_url` | 部署已验证 URL（app 状态变 **Deployed**）|
| `listing_url` | 上架页（仅 Production；填副标题/截图/分类/语言并提交）|
| `pi_url` / `pinet_subdomain` | `https://<subdomain>.pinet.com` |

> **状态名**：Draft → **Deployed** → **Listed**（Staging 停在 Deployed）。
> **别把"已验证的公网 URL"叫"Published"** —— 官方用 Deployed。

### 6.4 上架：分类和语言在 listing 页，不在 Settings

官方明确：*"including **category** and **language** (required to save and submit the listing;
**do not send people to Settings for these**)"*

**上架必须先有 ≥3 张预览图**，否则报 `missing_remote_previews` / *"Add 3 screenshots first."*

---

## 7. Pi Payments（**官方强制主动提议，不能跳过**）

官方原文：

> *"After Pi sign-in works, **proactively offer to add Pi Payments**. Do not wait for the person
> to ask, and **do not skip this by saying payments are optional for the app type**."*

### 7.1 流程

```
1. 检查项目 → 设计具体支付方案（用户付什么/收多少/何时开始付/user_to_app 还是 app_to_user）
2. 【必须】向用户确认方案，再动手写代码
3. prompt_payments({ app_id, directions }) → 返回官方编码提示 → 应用到项目
4. 测试前：get_app 查 checklist.create_wallet —— false 就让用户去 wallet_setup_url 自己弄
5. settings_url 生成 PI_NETWORK_API_KEY → 用户自己填进服务端 secret
6. 链上确认：Blockexplorer Mainnet 上看到那笔交易，才算跑通
```

### 7.2 服务端安全规则（官方原文，逐条对齐）

- ❌ **不要装 npm 的 pi-sdk 包**（`pi-sdk-react` 的发布版不带可用的 pi-sdk-js）
  → 前端直接用 `window.Pi`（`<script src="https://sdk.minepi.com/pi-sdk.js">`）
- ✅ **金额、收款方、权益、支付状态全部放服务端**；浏览器输入一律不可信
- ✅ `PI_NETWORK_API_KEY` 只从服务端环境变量读，**绝不下发到浏览器**
- ✅ 回调与重试**幂等**，**先持久化 payment id 再做不可逆操作**
- ✅ `user_to_app` **不需要** wallet seed；`app_to_user` 需要 `PI_WALLET_SEED`（用户自己存）
- ✅ 权益**只在服务端确认完成后发放，且只发一次**
- ⚠️ **不要向用户索要 API key / seed / passphrase**（任何渠道都不行）

### 7.3 端点（Pi Platform API）

```
GET  /v2/me                              用用户 accessToken 验证身份
GET  /v2/payments/:id                    读支付状态
POST /v2/payments/:id/approve            服务端用 API key 批准
POST /v2/payments/:id/complete           服务端用 API key 完成
```

### 7.4 App wallet 的审核状态机（从门户前端代码提取）

| `status` | 门户显示 | 含义 |
|---|---|---|
| `pending` | **Pending review** | 等 Pi 团队人工审核 |
| `pre_approved` | **creating** | 审核通过，正在建链上钱包 |
| `approved` | **approved** | 已激活 |
| — | `connected` | 已挂到 App（`outgoing_wallet_id` 已设）|

**`user_to_app` 需要的是 Receiving（收款）钱包**，不是 Outgoing。
门户端点：`GET /portal/third_party_apps/{id}/wallets/receiving`

---

## 8. 踩坑清单（全部实测）

### 8.1 MCP 报 502 → 删 session 文件重建 ✅

**症状**：`502 Server Error` / `curl` status 35 / `node fetch` `UND_ERR_CONNECT_TIMEOUT`

**根因**：MCP session 过期或上游瞬断。

**解法**：
```bash
rm -f "$TMP/mcp_sid.json"      # session id 缓存
# 然后重新 initialize，会拿到新 session
```

> 客户端若把 session id 存在临时文件（如 `%TEMP%\mcp_sid.json`），
> 报 502 时第一反应应该是删它重建，而不是怀疑配置错。

### 8.2 代理突然全挂 → 可能是加速器刚启动 ⚠️

**症状**：所有外网请求 000 / SSL 错误

**根因**：端口上的代理进程**刚启动 ~20 秒，隧道还没就绪**。
本例中 17891 端口的进程是 `0dcloudCore`（0dcloud 加速器，不是 Clash）。

**解法**：**等 20–30 秒重试**。别急着改配置。
排查：查监听端口对应进程的 `StartTime`，若为刚才 → 等。

### 8.3 OAuth 报错 → 分清是 client_id 还是 redirect_uri 的问题 ✅

见 3.2。实测三种错误：

| 报错 | 根因 | 解法 |
|---|---|---|
| `invalid_client` / "Unknown client" | client_id 没注册 | 用自己注册的 |
| `invalid_request` / "redirect_uri is not registered" | redirect 没注册 | **直接省略 redirect_uri** |
| 302 → `/devconsole/consent` | ✅ 正常 | 交给用户扫码 |

### 8.4 Cloudflare Pages Functions 路由 → 子路径要独立文件 ✅

**症状**：本地测试全过，线上 `/api/payments/approve` 返回 **405 Method Not Allowed**。

**根因**：Cloudflare Pages Functions **按文件路径路由**。
`functions/api/payments.js` **不会**服务 `/api/payments/approve`。

**修法**：
```
functions/api/_paycore.js            ← 下划线前缀 = 共享模块，不当路由
functions/api/payments.js            → GET  /api/payments
functions/api/payments/approve.js    → POST /api/payments/approve
functions/api/payments/complete.js   → POST /api/payments/complete
```
import 路径：`api/payments.js` → `./_paycore.js`；`api/payments/*.js` → `../_paycore.js`

> ⚠️ **本地自建服务器测不出来**（自己路由）。**必须实测线上端点。**

### 8.5 YouTube 章节 4 条硬规则（顺带，因为做 demo 视频时会踩）

1. 第一个时间戳必须是 `0:00`
2. 至少 3 个章节
3. 严格递增
4. **每个章节至少 10 秒**

违反任何一条，YouTube **静默丢弃整张列表**（不报错不警告）。

### 8.6 Pi 地址格式

**56 字符**，G 开头 = 主网，M 开头 = 测试网（不是 58）。
门户内部的 wallet 记录 id 是 **64 字符小写**，两者不要混。

---

## 9. Pi 相关 API / 站点速查

| 用途 | 地址 |
|---|---|
| MCP 端点 | `https://developers.minepi.com/mcp` |
| 官方 agent 指令 | `https://developers.minepi.com/agents.md` |
| 黑客松规则 | `https://developers.minepi.com/hackathon` |
| Pi Platform API | `https://api.minepi.com/v2` |
| 门户 REST（需网页 token） | `https://socialchain.app/portal/third_party_apps/{app_id}/...` |
| 区块浏览器 | `https://blockexplorer.minepi.com/mainnet/accounts/{address}` |
| 上架页 | `https://developers.minepi.com/devconsole/my-apps/{app_id}/listing` |
| 钱包申请 | `https://developers.minepi.com/devconsole/my-apps/{app_id}/settings#app-wallets` |
| OAuth 授权 | `GET https://developers.minepi.com/oauth/authorize?...` → 302 `/devconsole/consent?token=…` |
| 换 token | `POST https://developers.minepi.com/oauth/token`（form-encoded）|
| Pi SDK | `https://sdk.minepi.com/pi-sdk.js` |

**门户 REST 的坑**：它的认证是**网页端 session token**（Redux store 里的 `accessToken`，
存于 `localStorage.developers_access_token`）。**MCP 的 `asp_` token 打不开它**（401）。

---

## 10. 参考实现

### 10.1 `tools/gen_pkce.mjs` —— 生成 OAuth 授权链接（零依赖，已冒烟测试）

```bash
node tools/gen_pkce.mjs <client_id> [redirect_uri] [outDir]
# 产出：pi-authorize.html（给用户点）+ pkce.json（含 verifier）
```

### 10.2 `mcpcli.mjs` —— 手写 Pi MCP 客户端

`mcpcli.mjs`（Node 22，零依赖，~70 行）：

```js
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import crypto from 'node:crypto'; import { execFileSync } from 'node:child_process';

const PROXY  = 'http://127.0.0.1:17891';
const TARGET = 'https://developers.minepi.com/mcp';
const userId = '<userId>';
const dir    = path.join(os.homedir(), '.workbuddy', 'connectors', userId);

// ── 解密存取 token（示例用 WorkBuddy 的加密格式；其它客户端换自己的）──
const mk   = fs.readFileSync(path.join(dir, '.master.key'));
const cred = JSON.parse(fs.readFileSync(path.join(dir, '.credentials.v3.json'), 'utf8'));
const salt = Buffer.from(cred.encryption.salt, 'base64');
const info = Buffer.from('workbuddy-oauth-credentials-v1', 'utf8');
const aesKey = Buffer.from(
  crypto.hkdfSync('sha256', Buffer.concat([mk, Buffer.from(userId, 'utf8')]), salt, info, 32));
const slot = 'pi-developers|<slotId>';
const sd   = cred.mcpOAuth[slot];
const d    = crypto.createDecipheriv('aes-256-gcm', aesKey, Buffer.from(sd.accessToken.iv, 'base64'));
d.setAAD(Buffer.from(userId + '|' + slot + '|accessToken', 'utf8'));
d.setAuthTag(Buffer.from(sd.accessToken.tag, 'base64'));
const token = Buffer.concat([
  d.update(Buffer.from(sd.accessToken.ct, 'base64')), d.final()]).toString('utf8');

// ── session 缓存（502 时删掉这个文件重建）──
const SIDF = path.join(os.tmpdir(), 'mcp_sid.json');
let sessionId = fs.existsSync(SIDF) ? JSON.parse(fs.readFileSync(SIDF, 'utf8')).sid : null;

async function rpc(method, params) {
  const headers = [
    '-H', 'Content-Type: application/json',
    '-H', 'Accept: application/json, text/event-stream',
    '-H', 'MCP-Protocol-Version: 2025-06-18',
    '-H', 'Authorization: Bearer ' + token,
  ];
  if (sessionId) headers.push('-H', 'Mcp-Session-Id: ' + sessionId);
  const body = JSON.stringify({ jsonrpc:'2.0', id: Date.now()%100000, method, params });
  const out = execFileSync('curl', ['-s','-m','90','-x',PROXY,'-X','POST',TARGET,
    ...headers,'-d',body,'-D', path.join(os.tmpdir(),'mcp_hdr.txt')],
    { encoding:'utf8', maxBuffer: 50*1024*1024 });

  const h = fs.readFileSync(path.join(os.tmpdir(),'mcp_hdr.txt'), 'utf8');
  const m = h.match(/mcp-session-id:\s*(\S+)/i);
  if (m) { sessionId = m[1]; fs.writeFileSync(SIDF, JSON.stringify({ sid: sessionId })); }

  if (out.includes('data:')) {
    return out.split('\n').filter(l=>l.startsWith('data:'))
      .map(l=>l.slice(5).trim()).filter(x=>x && x!=='[DONE]').join('\n');
  }
  return out;
}

async function tool(name, args = {}) {
  const raw = await rpc('tools/call', { name, arguments: args });
  const o = JSON.parse(raw);
  if (o.result?.content?.[0]?.text) return JSON.parse(o.result.content[0].text);
  return o;
}

// 用法：node mcpcli.mjs list
//      node mcpcli.mjs call whoami '{}'
//      node mcpcli.mjs call get_app '{"app_id":"..."}'
```

---

## 11. 完成自查表

- [ ] `whoami` 返回 `terms_accepted: true`
- [ ] 网络选择（Staging/Production）**经用户确认**并已记录
- [ ] `frontend_url` 是公网 HTTPS，**且只传 `frontend_url`**（绝不覆盖 `development_url`）
- [ ] `verify_app_url_ownership` 成功 → `pi_url` 已给用户
- [ ] 用户已在 **Pi Browser** 打开 `pi_url` 测过
- [ ] Production：**logo 已上传**（1024×1024 PNG/JPG）
- [ ] **Pi Payments 方向已向用户提议并确认**（或用户明确拒绝 —— 记录下来）
- [ ] `.pi-onboard.json` 存在且指向正确的 app id
- [ ] `developers_url` 已给用户
- [ ] 上架页：**≥3 张预览图** + 分类 + 语言 + 副标题，**已提交审核**
- [ ] 已告知用户：**审核不必通过即可参赛**
- [ ] 支付若已实现：**Blockexplorer 上确认到那笔交易**（不能只看 API 回调）
- [ ] **没向用户索要过** API key / seed / passphrase

---

## 12. 官方行为准则（摘录，做 Pi 项目请当合同读）

- *"Never request, copy, or store the person's Pi credentials or Pi access token."*
- *"Do not ask them to paste the key into chat, and do not invent one."*
- *"Never ask for secrets in chat."*
- *"If blocked by authorization, deployment access, missing requirements, or a required human
  action, **state the specific blocker instead of guessing**."*
- *"Report wallet/credential readiness **separately** from successful end-to-end payment
  verification."*
- *"Do not claim success from API callbacks alone if the explorer shows no matching transaction."*

---

**一句话总结**：Pi MCP 本身不难，难的是**三处必须人工介入** ——
① OAuth 扫码批准 ② app wallet 申请与审核 ③ 上架页预览图上传。
把这三件事明确交给用户，agent 把其余全部自动化，效率最高。
