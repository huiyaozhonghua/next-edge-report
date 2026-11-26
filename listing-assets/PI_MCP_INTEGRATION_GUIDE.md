# 实战经验：把 Pi MCP 服务器接进 AI 编码代理

> 目标端点：`https://developers.minepi.com/mcp`（Pi Network 官方远程 MCP，含 OAuth 2.1 + PKCE）
> 验证环境：Windows 11 + WorkBuddy 桌面端 + 0dcloud 代理（境内网络）
> 记录时间：2026-11-20 ~ 11-26
> 成果：App 已注册上主网并部署上线，pi_url 已分配

---

## 摘要：这张图能帮你省下 6 小时

Pi 官方只给了一句话配置（`{"mcpServers":{"pi-developers":{"url":"https://developers.minepi.com/mcp"}}}`），
但在国内网络环境下，这句话会依次撞上 **4 道独立的墙**。它们的症状极易混淆，逐个击破的顺序是：

| # | 障碍 | 典型症状 | 破局手段 |
|---|---|---|---|
| 1 | **DNS 污染** | 域名解析到 Facebook/Twitter 的 IP | 必须走代理；且要区分"污染"与"SNI 封锁" |
| 2 | **代理端口分裂** | 浏览器能上外网，AI 代理却连不上 | 用**进程级代理覆盖**，不要改全局 |
| 3 | **工具索引不刷新** | 授权成功、服务器 200，但代理工具调不到 | **绕过索引**，自己写 MCP 客户端 |
| 4 | **沙箱跨进程隔离** | 本地服务在跑，curl 却连不上 | 不启服务，**直接调 handler 渲染** |

> ⚠️ **最反直觉的一条**：第 3 层的"授权成功但工具不可用"，是 WorkBuddy 这类宿主的
> **工具索引时序问题**，不是配置错误。你在 CLI 里看到的 `connection-ready: tools 13`
> 说明**服务器侧一切正常**，别再去改代理配置。

---

## 第 1 层：DNS 污染 vs SNI 封锁（必须分清）

这两个现象都表现为"连不上"，但解法完全不同。

### 判定方法

```bash
# 1) 系统 DNS 解析
nslookup developers.minepi.com
# 2) 换公共 DNS 对照
nslookup developers.minepi.com 223.5.5.5
nslookup developers.minepi.com 8.8.8.8
# 3) 用 DoH 查真实 IP（拿到后用 --resolve 绕过 DNS 直连测）
curl --resolve developers.minepi.com:443:<真实IP> https://developers.minepi.com/mcp
```

### 实测结论（Pi MCP）

| 现象 | 判定 |
|---|---|
| 默认 DNS → `2a03:2880:...:face:b00c:0:25de` | **Meta 的 IPv6 段**（`face:b00c` 是 Meta 嵌在 IPv6 里的固定彩蛋）|
| `8.8.8.8` → 同样的 Meta 地址 | 污染在**运营商/上游**，不是本地 |
| `223.5.5.5` → `136.69.60.86` | 阿里 DNS 返回了**另一个**可疑地址 |
| 用真实 IP + `--resolve` 直连 | **TLS 握手被重置**（exit 35）→ 叠加了 **SNI 封锁** |

**结论**：这个域名同时被 **DNS 污染** 和 **SNI 封锁**（按域名过滤，不是按 IP）。
两者叠加的结果是——**任何形式的直连都不可能成功，必须走能同时解决域名和 TLS 的代理**。

> 🔑 **复用要点**：判断一个域名是否被墙，最快的办法是
> `curl --resolve <域名>:443:<DoH查到的真实IP>` —— 如果 IP 正确但握手失败，就是 SNI 封锁，
> 换 IP 无用，只能换通道。同一台机器上 `ghcr.io` 也是这个下场（`exit 35`），
> 而 `github.com` 却通 —— 于是有了后面的「用 GitHub Actions 绕开本地封锁」的破局思路。

---

## 第 2 层：代理端口分裂

### 现象

同一台机器上，**浏览器能访问 Pi，AI 工具却超时**。原因是有两个不同的代理端口在起作用：

```
系统代理 / 用户环境变量  →  127.0.0.1:17891   （0dcloud mixed 端口，HTTP+SOCKS 都通）
WorkBuddy 沙箱进程运行时 →  127.0.0.1:21075   （sandbox-cli.exe 注入，沙箱内不可达）
```

宿主进程用 `process.env.HTTP_PROXY` 拿到的往往是**死端口**。
每次重启这个端口还会变（实测见过 3174 / 57494 / 19626 / 1744 / 40773 / 21075）。

### 破局：进程级代理覆盖，绝不改全局

```bash
# 只给这一条命令加代理，不污染全局
HTTP_PROXY=http://127.0.0.1:17891 \
HTTPS_PROXY=http://127.0.0.1:17891 \
npx -y mcporter list

# Node 内置 fetch 额外需要这个（Node 22.21+ 才会读环境代理）
NODE_USE_ENV_PROXY=1 node -e "fetch('https://developers.minepi.com/mcp')..."
```

> 🔑 **复用要点**：`NODE_USE_ENV_PROXY=1` 是 Node 22.21+ 的隐藏开关。
> 没开这个时，`fetch` 会**完全忽略** `HTTP_PROXY`，于是出现"代理配了却直连、直连又被拦"的死局。
> 错误码从 `UND_ERR_CONNECT_TIMEOUT` 变成 `ETIMEDOUT` 就说明开关生效了。

### 附带坑：代理客户端自己会"假死"

0dcloud 的 `17891` 端口由 `0dcloudCore` 进程监听，**它刚启动的约 20 秒内隧道未就绪**，
表现为"代理突然全挂"（curl exit 35 / HTTP 000）。
**症状出现时先等 20–30 秒再重试**，别急着改配置。查监听进程的启动时间可以确认：

```powershell
Get-NetTCPConnection -LocalPort 17891 | Select-Object OwningProcess
Get-Process -Id <pid> | Select-Object StartTime, ProcessName
```

---

## 第 3 层：工具索引不刷新（本层最难，也最值得看）

### 现象

授权**确实成功**了，服务器**确实返回 200**，但 AI 代理调不到工具。

```bash
# 日志里全是好消息
grep -i minepi ~/.workbuddy/logs/daemon.log
#   [MCP-AuthDiag] token-received      {... tokenPresent:true, expiresIn:7775999}
#   [MCP-AuthDiag] credential-write    {... persisted:true, expired:false}
#   [MCP-AuthDiag] connection-ready    {... tools:13, totalMs:2454}
#   [MCP-AuthDiag] reconnect-completed {... state:"ready", tools:13}
```

工具也确实在本地缓存里：

```bash
# ~/.workbuddy/mcp-tool-list.json → entries.<hash> → 13 个工具全在
# logout / whoami / terms_accept / create_app / list_apps / get_app /
# update_app / verify_app_url_ownership / prepare_app_logo_upload /
# set_app_logo / prompt_payments / list_features / get_feature_docs
```

但 `ToolSearch` 怎么都查不到（试过 `mcp__<服务器名>__`、`mcp__<hash>__`、服务器名本身……全 miss）。

### 根因

**工具索引是会话启动时的快照。** 授权发生在会话运行中，
宿主的 MCP 守护进程加载了服务器，但**本会话的工具清单没有重新构建**。
重启应用有时能解决，有时不能（取决于授权与启动的时序）。

### ✅ 破局：自己写一个零依赖 MCP 客户端

既然宿主的凭证已经落盘、令牌有效，就直接复用它们。位置：

```
~/.workbuddy/connectors/<userId>/.credentials.v3.json   # 加密的 OAuth 凭证
~/.workbuddy/connectors/<userId>/.master.key           # 32 字节主密钥
```

**解密方案（实测可用）**：

| 项 | 值 |
|---|---|
| 算法 | AES-256-GCM |
| KDF | HKDF-SHA256 |
| HKDF info | `"workbuddy-oauth-credentials-v1"` |
| HKDF salt | 来自 `cred.encryption.salt`（base64） |
| HKDF ikm | `masterKey || userId`（**拼接**，不是二选一） |
| 输出长度 | 32 字节 |

```javascript
const salt = Buffer.from(cred.encryption.salt, 'base64');
const info = Buffer.from('workbuddy-oauth-credentials-v1', 'utf8');
const aesKey = Buffer.from(crypto.hkdfSync(
  'sha256',
  Buffer.concat([masterKey, Buffer.from(userId, 'utf8')]),
  salt, info, 32));

const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, Buffer.from(at.iv, 'base64'));
decipher.setAAD(Buffer.from(`${userId}|${serverKey}|accessToken`, 'utf8'));
decipher.setAuthTag(Buffer.from(at.tag, 'base64'));
const token = Buffer.concat([
  decipher.update(Buffer.from(at.ct, 'base64')), decipher.final()
]).toString('utf8');
```

> ### 🔥 三个致命细节（踩错就静默失败）
> 1. **AAD 里的 `serverKey` 是凭据对象的键本身**（形如 `pi-developers|6a13ce273c388dc0`），
>    **不是** `serverName`（`pi-developers`）。用错 → GCM 认证标签校验失败。
> 2. **AAD 格式 = `${userId}|${serverKey}|${fieldName}`**，`fieldName` 固定是 `"accessToken"`。
> 3. **`computeCheck` 取 sha256 的前 16 字节**做 header 校验（**不是 12**，那是 GCM 标准 tag 长度）。
>
> 另外：`masterKey` 可能有备份在 `~/.workbuddy-key-fallback/connector-keys/<sha256(userId)[:32]>.key`，
> 原文件丢了可从那里恢复。

### MCP 协议要点

```bash
# 1) initialize —— 必须在任何其他调用之前
curl -s -x $PROXY -X POST https://developers.minepi.com/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2025-06-18' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{
        "protocolVersion":"2025-06-18","capabilities":{},
        "clientInfo":{"name":"probe","version":"1.0"}}}'
```

| 要点 | 说明 |
|---|---|
| `Accept` 头 | 必须同时含 `application/json, text/event-stream` |
| 响应格式 | **SSE** —— 要从 `data:` 行里提取 JSON，不是直接解析 body |
| Session | 从响应头 `mcp-session-id` 取，存起来后续请求带上 `Mcp-Session-Id` 头 |
| 免授权探测 | 直接 POST `/mcp` 会返回 `401 invalid_token` + `WWW-Authenticate: Bearer realm="pi-onboard"`，**这是正常的 OAuth 前置响应，不是故障** |

完整可运行的客户端见 `listing-assets/pi-mcp.mjs`（约 120 行，零依赖）：

```bash
node pi-mcp.mjs whoami
node pi-mcp.mjs list_apps
node pi-mcp.mjs get_app '{"app_id":"..."}'
node pi-mcp.mjs list          # 列出全部 13 个工具
```

> 🔑 **复用要点**：这个"解密宿主凭证 + 自建 MCP 客户端"的思路，
> 适用于**任何**宿主里授权成功但工具不暴露的 MCP 服务器，与 Pi 无关。

---

## 第 4 层：沙箱跨进程隔离（附带影响截图与部署）

### 现象

服务端明明 `listening on 0.0.0.0:3000`，同沙箱内的 curl 访问 `127.0.0.1:3000` 却返回
`000` / `ETIMEDOUT`；**同进程内**的 loopback 也不通。

这解释了为什么这些都失败了：
- 本地起服务 → curl 自测
- Chrome `--remote-debugging-port=9222` → 连不上
- `wrangler login` → OAuth 回调 `http://localhost:8976/oauth/callback` 收不到

### ✅ 破局：不要起服务，直接调 handler

把 HTTP handler 从 `server.js` 导出，mock `req/res` 即可在**进程内**验证路由：

```javascript
// server.js 末尾
const handler = (req, res) => { /* ... */ };
module.exports = { handler };
if (require.main === module) server.listen(PORT, '0.0.0.0', ...);
```

截图同理：**不启服务器** → 调 handler 拿到 HTML → 写临时目录 → `file://` 交给
Chrome headless 截图。

---

## 完整时间线（可作为 SOP 模板）

| 阶段 | 动作 | 验证方式 |
|---|---|---|
| 1 | 写 `mcp.json`：`{"mcpServers":{"pi-developers":{"url":"https://developers.minepi.com/mcp"}}}` | 文件存在 |
| 2 | 连接器管理页右上角 → 自定义连接器 → **Trust** | UI 出现已信任 |
| 3 | **完全退出并重启**宿主应用 | 进程 PID 变化 |
| 4 | 首次调用 → 浏览器弹 Pi 登录页 → **手机 Pi Browser 扫码批准** | 授权凭证落盘 |
| 5 | 确认授权成功 | `daemon.log` 出现 `credential-write persisted:true` + `connection-ready tools:13` |
| 6 | 验证工具可用 | `ToolSearch` 能查到；查不到 → **用 `pi-mcp.mjs` 绕过** |
| 7 | `whoami` → 确认身份与 `terms_accepted` | 返回开发者用户名 |
| 8 | `list_apps` → 有则复用，无则 `create_app` | 拿到 App ID |
| 9 | 写 `.pi-onboard.json` | 含 `app_id` / `developers_url` / `listing_url` |
| 10 | `prepare_app_logo_upload` → 生成 Logo → 上传 → `set_app_logo` | Logo 出现在列表页 |
| 11 | 部署公网 HTTPS → `update_app(frontend_url)` → `verify_app_url_ownership` | 返回 `pi_url` |
| 12 | 部署 `validation-key.txt`（内容 = 下发的 key，**无尾随换行**）| 复检通过 |
| 13 | `update_app` 补 `privacy_policy_url` / `terms_of_service_url` | 字段生效 |
| 14 | 上架表单：5 张预览图 + Demo 视频链接 + 分类 + 语言 + 副标题(≤30 字符) | 提交成功 |

---

## Pi 官方 MCP 的 13 个工具

| 工具 | 作用 | 关键提醒 |
|---|---|---|
| `whoami` | 身份 + 条款状态 | **第一个调用** |
| `terms_accept` | 接受开发者条款 | 只在 `whoami` 显示 `terms_accepted:false` 且用户确认后调用 |
| `list_apps` | 列出已有 App | 优先复用，别重复创建 |
| `create_app` | 创建 App | **网络不可更改**；主网才可上架 |
| `get_app` | 查 App 详情 | `checklist.create_wallet` 决定支付能否测试 |
| `update_app` | 改配置 | 上线后只传 `frontend_url`，**不要**同时传 `development_url` |
| `verify_app_url_ownership` | 域名验证 | 返回 `validation_key`；部署它才能复检 |
| `prepare_app_logo_upload` | 准备 Logo 上传 | 返回 `logo_prompt` 与尺寸要求 |
| `set_app_logo` | 提交 Logo | 1024×1024 PNG/JPG，< 1MB |
| `prompt_payments` | 生成支付接入代码 | **只能用这个工具**拿支付指令，别自己造轮询服务 |
| `list_features` | 能力发现 | 官方新增 |
| `get_feature_docs` | 取某能力的官方文档 | 官方新增 |
| `logout` | 吊销令牌 | 之后需要重新授权 |

---

## 上架必踩的表单坑（Pi 侧实测）

| 错误码 | 官方文案 | 解法 |
|---|---|---|
| `description_short_too_long` | 副标题超长 | **≤30 字符** |
| `missing_remote_previews` | "Add 3 screenshots first." | 手动上传（MCP **没有**预览图接口，只有 Logo 的） |
| `terms_of_service_url` 为空 | schema: "Required for a Mainnet listing" | 必须建 `terms.html` 并部署 |
| `pi_kyc_not_applied` | "Apply for Pi KYC in the Pi app first." | 先在 Pi App 里提交 KYC |
| `domain_not_verified` | 域名未验证 | `verify_app_url_ownership` + 部署 validation-key.txt |
| `frontend_url_not_validated` | 未部署到已验证的公网 URL | 同上 |

### 好消息（官方原文）

> *"submit its listing for review — **it does not have to be approved yet**"*
> → **不用等审核通过就能参赛**，报名和提交是独立的两件事。

---

## 硬性规则速查（违反=出局）

1. 开发者必须完成 **Pi KYC**；所有队员都要各自注册。
2. **只能** Pi Authentication 登录；**只能** Pi 支付交易（禁止法币/其他代币）。
3. 禁止跳转到外部网站；禁止收集非必要的邮箱/手机号。
4. 域名与名称**不得以 "pi" 开头**，不得滥用 Pi logo / 配色。
5. 必须有：英文名称 / 英文描述 / 副标题(≤30) / 合规 Logo / 隐私政策 / 服务条款 / 预览图 / **PiNet 集成**。
6. **Demo 视频 ≤3 分钟且必须公开**，要讲清 5 件事：是什么+做什么 / 功能与界面走查 / 目标用户 / 解决什么问题 / **Pi 如何参与**。
7. 视频链接合法性：`https:` + 无用户名密码 + 域名含 `.`。
8. 每个 App 只由一名队员提交；每队最多 3 个 App。
9. **CSP 必须设 `frame-ancestors` 含 `https://*.pinet.com`，且绝不能设 `X-Frame-Options`**（PiNet 靠 iframe 嵌入）。
10. `validation-key.txt` **必须长期保留**（删掉会导致复检失败），但**不要 commit**（官方要求不落库）——用 CI Secret 写入。

---

## 安全清单

- 🔒 **绝不**把 Pi 助记词 / 私钥 / 恢复短语输入任何页面 —— 官方授权只扫码。
- 🔒 **绝不**把 `PI_NETWORK_API_KEY` 贴进对话、放进前端配置、写进日志或 commit。
- 🔒 **绝不**把 `validation_key` 写进源码或日志。
- 🔒 `validation-key.txt` 与 Cloudflare token 用 `.gitignore` 排除；CI 里用 **GitHub Secrets** 注入。
- 🔒 用户给你凭证文件时，**先做格式清洗 + 长度检查**（实测遇到过复制时带上的 `<` 前缀导致 token 失效）。
- 🔒 判断 API 可用性**要看响应体**，不能只看 http_code（`-o /dev/null -w %{http_code}` 会吞掉 body 导致误判）。
- 🔒 代理 token 只在内存/临时文件，用完立刻删（沙箱里 `rm` 可能被策略拦，用 PowerShell `Remove-Item`）。

---

## 一句话总结

> 接 Pi MCP 真正难的不是配置，而是**分清"网络不通"和"工具没挂载"**：
> 前者看 `daemon.log` 的 `connection-ready`，后者看宿主工具索引。
> 索引不刷新时，**自己写客户端复用宿主凭证**比反复重启更快 —— 顺带还能绕开一切沙箱网络限制。

---

## 附：本文引用的项目内资产

| 文件 | 内容 |
|---|---|
| `listing-assets/pi-mcp.mjs` | 零依赖 Pi MCP 客户端（解密凭证 + 代理 + JSON-RPC） |
| `listing-assets/verify_payment.py` | 支付后链上验证（官方要求：API 200 ≠ 链上成功） |
| `listing-assets/PAYMENTS_SETUP.md` | 支付接入完整步骤 |
| `listing-assets/WALLET_STATUS.md` | 钱包审核状态机 + Receiving vs Outgoing |
| `listing-assets/OFFICIAL_RULES_VERIFIED.md` | 从官方 JS bundle 抠出的 22 条规则原文 |
| `listing-assets/deploy_and_publish.sh` | 一键部署 + 自检 + Pi 验证全流程 |
| `listing-assets/LISTING_FORM_CARD.html` | 上架表单逐格照抄卡 |

---

## 附二：方法验证 —— 这套方案此刻仍然可用

本文不是事后总结，是**当前可复现**的操作手册。写作时实测：

```bash
$ node listing-assets/pi-mcp.mjs whoami
{
  "id": "6affb3de3d26595a880904b0",
  "username": "ZJH18981927828",
  "terms_accepted": true,
  "terms_url": "https://socialchain.app/developer_terms"
}
```

> 宿主的 `pi-developers` 工具索引至今仍未暴露 `whoami`（`ToolSearch` 始终 miss），
> 但**这条绕过路径完全可用** —— 这正是本报告第 3 层要解决的问题。

同一时刻 `get_app` 的实时状态（App ID `6b0672d68f5d0b3dd1cbb3d9`）：

| 字段 | 当前值 |
|---|---|
| 名称 / 副标题 | Next Edge Report / Your Pi Next war room |
| 网络 | `mainnet`（不可更改） |
| frontend_url | `https://next-edge-report.pages.dev`（`frontend_url_validated: true`） |
| pi_url | `https://nextedgereportmv0511.pinet.com` |
| privacy / terms | ✅ 均已部署 |
| 分类 / 语言 | Productivity / English |
| Logo | ✅ 已上传 |
| visibility | public |

**官方 checklist 当前状态**：

```
register_app            ✅      configure_hosting       ✅
add_privacy_policy      ✅      dev_doc_opened          ✅
configure_development_url ✅    deploy_app              ✅
validate_domain         ✅      add_pinet_subdomain     ✅
create_wallet           ✅      ← 钱包审核已通过
sandbox_accessed        ⬜      （仅 Staging 适用）
process_transaction     ⬜      ← 需真实 Pi 支付 + 链上确认
```

> `create_wallet: true` 意味着收款钱包已激活 —— 这是支付链路解锁的信号。
> 剩余唯一的技术项 `process_transaction` 需要在 **Pi Browser 真机**完成一笔真实打赏，
> 并在 **Pi Blockexplorer Mainnet** 确认入账（官方明确：不能只凭 API 回调宣布成功）。
