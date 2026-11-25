# 作战台部署方案选型

> 2026-11-25 · App ID `6b0672d68f5d0b3dd1cbb3d9` · 开发者 `ZJH18981927828`

---

## 一句话结论

**推荐方案 B（Cloudflare Pages + Functions，从 GitHub 自动部署）**——
你已有 GitHub 账号和 PAT，零新增注册，官方允许平台子域名，PiNet 由 Pi 自动分配。

---

## Pi 官方到底要什么（已逐条核对官方文档）

| 要求 | 原文出处 | 结论 |
|---|---|---|
| `frontend_url` 必须是 **https 域名** | Production App Access §1 | ❗必须 |
| 根目录放 `validation-key.txt`，内容 = app 的 validation key | Production App Access §2 | ❗必须 |
| **该文件必须长期保留**，删掉会导致复检失败 | Production App Access §2 | ❗必须 |
| Pi 会自动分配 **PiNet subdomain** 和 `pi_url` | verify_app_url_ownership 工具说明 | ✅ Pi 提供 |
| **允许非 Pi 域名与外部服务器** | PiBrowserConstraints §Developer Hosting | ✅ 关键 |
| 官方举例 `https://vercel.app` 作为 hosted URL | Using Pi URLs §Hosted URL | ✅ **平台子域名合法** |
| 域名不得以 "pi" 开头 | Mainnet Listing Requirements | ✅ `next-edge-report` 合规 |
| 域名不能误导为 Pi 官方 | Mainnet Listing Requirements | ✅ 符合 |

**Pi 不提供托管** —— 必须自己部署。但 `configure_hosting: true` 说明这一步已通过，不强制特定服务商。

---

## 你的应用现状（决定方案的关键事实）

| 事实 | 影响 |
|---|---|
| `server.js` **零第三方依赖**（`dependencies: {}`，纯 `http` 模块） | 极易迁移到 serverless |
| `PI_NETWORK_API_KEY` **代码里根本没读**（只在注释里） | 无需管理服务端密钥 |
| 后端唯一持久化：`/api/progress` 按 uid 写文件 | serverless 上要换成 KV/内存 |
| 前端只依赖 `/api/progress` **一个**后端接口 | 迁移面极小 |
| 其余全在 localStorage | **核心功能不依赖后端** |
| Pi 登录用**用户自己的 accessToken** 调 `/v2/me` 验证 | 不需要服务端密钥 |

> 💡 **关键洞察**：`/api/progress` 只是"跨设备同步进度"的锦上添花。
> 核心功能（选题匹配、46天计划、打卡）**全在前端 localStorage**。
> 这大幅降低了部署难度 —— 即使后端同步降级，App 依然完整可用。

---

## 三个方案对比

### 方案 A — Vercel（官方点名）

| 项 | 评估 |
|---|---|
| 需要 | 注册 Vercel 账号 + `vercel` CLI 登录 |
| HTTPS | ✅ 自动，`*.vercel.app` |
| 适配工作 | 中：serverless 函数 + `vercel.json` rewrite + 进度改 KV |
| 费用 | 免费额度（Hobby） |
| 风险 | 官方文档举例过，评审熟悉；但需新增一个账号体系 |

### ⭐ 方案 B — Cloudflare Pages + Functions（推荐）

| 项 | 评估 |
|---|---|
| 需要 | Cloudflare 账号（一次注册）+ 用已有 GitHub PAT 连仓库 |
| HTTPS | ✅ 自动，`*.pages.dev` |
| 适配工作 | 中低：`_worker.js` 风格函数 + `functions/` 目录 |
| 费用 | Pages 静态**无限**，Functions 10万请求/天 |
| 优势 | **只用 GitHub 一套账号体系**；仓库已建好可复用；改动即自动部署 |
| 风险 | Cloudflare Pages 项目需手动连一次仓库 |

### 方案 C — 真·Node 容器（Railway / Render / Fly.io）

| 项 | 评估 |
|---|---|
| 需要 | 注册 + **绑信用卡**（即使有免费额度） |
| 适配工作 | **零** —— `Dockerfile` 照抄 `server.js` 原样跑 |
| 优势 | 改动最少，行为与本地完全一致 |
| 风险 | 信用卡门槛；免费额度可能休眠；42 天内被休眠就白搭 |

### 方案 D — 自己的 VPS

不推荐：42 天内新买服务器，IP 信誉与 Pi 生态的信任机制都是未知数。

---

## 推荐执行路径（方案 B）

```
1. 注册 Cloudflare 账号
2. Pages 项目 ← 连接 GitHub 仓库 huiyaozhonghua/next-edge-report
3. 改造为 Pages Functions：
   public/         → 静态直接托管
   functions/api/  → /api/progress 用 KV 存进度
   validation-key.txt → 由 verify_app_url_ownership 返回后写入
4. update_app(app_id, frontend_url=https://<项目>.pages.dev)
5. verify_app_url_ownership(app_id) → 拿 validation key → 部署该文件 → 重试
6. 自动获得 pi_url（PiNet 子域名）→ 在 Pi Browser 打开测试
7. update_app(app_id, privacy_policy_url=<frontend>/privacy.html)
8. 提交上架
```

---

## 已发现的 bug（已修）

**前端 POST `/api/progress` 不带 Authorization 头** —— 后端要求 `Bearer`，所以云同步实际一直是坏的（只有 GET 带 token）。

```js
// 修前
fetch("/api/progress", { method: "POST", headers: { "Content-Type": "application/json" }, ... })
// 修后
fetch("/api/progress", {
  method: "POST",
  headers: { "Content-Type": "application/json", "Authorization": "Bearer " + accessToken },
  ...
})
```
并新增模块级 `accessToken` 变量，在登录时赋值、登出时清空。

---

## 顺带发现的架构风险

**Pi Browser 在 iOS 上用 iframe 加载 App，第三方 cookie 默认被禁用**
（PiBrowserConstraints 明确说明）。

影响：
- 不能依赖 cookie 做会话 —— ✅ 我们本来就用 Bearer token，无影响
- localStorage 在 iframe 里可能受分区限制 —— 需在真机 Pi Browser 实测
- 如果 localStorage 在 iframe 不可用，核心功能（进度保存）会退化
  → **缓解：UI 已有的 localStorage 失败会 fallback 到默认状态，不会崩**，
  但要在真机验证一次

---

## 平台可达性实测（2026-11-25）

| 端点 | 结果 |
|---|---|
| vercel.com / api.vercel.com | ✅ 200 / 308 |
| pages.cloudflare.com / workers.cloudflare.com | ✅ 301 / 301 |
| netlify.com | ✅ 301 |
| fly.io / railway.app / render.com | ✅ 200 / 301 |
| surge.sh / github.io | ✅ 200 / 301 |
| api.minepi.com（Pi 侧） | ✅ 可达 |

---

## 时间预算

| 步骤 | 预估 |
|---|---|
| Cloudflare 注册 + Pages 连接仓库 | 0.5 小时 |
| Functions 改造（+KV 绑定） | 2–3 小时 |
| 首次部署 + 拿到 https 域名 | 0.5 小时 |
| validation-key.txt 部署 + verify | 0.5 小时 |
| Pi Browser 真机测试 | 1 小时 |
| 提交上架 + 填表 | 1 小时 |
| **合计** | **≈ 1.5 天**（余 42 天，充裕） |

---

## 需要你做的

1. **注册 Cloudflare** —— <https://dash.cloudflare.com/sign-up>
2. 或者如果你更倾向 Vercel，告诉我，改方案 A
3. 定下来后我立刻改造代码并部署

> 若你**不想再注册新账号**，还有一个零注册方案：
> 把 `server.js` 直接部署到**已有的 GitHub 仓库 + 一台免费容器服务**，
> 但仍需某家的账号 —— 所以注册一次 Cloudflare 是最短路径。
