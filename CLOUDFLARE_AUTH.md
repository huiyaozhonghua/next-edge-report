# Cloudflare 授权指引（作战台部署 · 只需一次）

> 为什么不用 `wrangler login`：
> 它的 OAuth 回调走 `http://localhost:8976/oauth/callback`，
> 而 **WorkBuddy 沙箱隔离跨进程 localhost socket**（实测 code=000），
> 所以浏览器授权后 wrangler 收不到回调，登录必然失败。
> → 改用 **API Token**：纯 header 认证，无回调，wrangler 支持
> （`CLOUDFLARE_API_TOKEN` 环境变量）。

---

## 你要做的（2 分钟）

### 1. 打开 API Token 创建页

```
https://dash.cloudflare.com/profile/api-tokens
```

> 或从你已登录的 Dashboard 点右上角头像 → **My Profile** → **API Tokens** → **Create Token**

### 2. 点 "Create Custom Token"

不要选模板，直接 **Create Custom Token**（模板的权限组合不对）。

### 3. 填权限

**Token name**：`next-edge-deploy`

**Permissions** 三行：

| 权限类型 | 权限 | 资源 |
|---|---|---|
| Account | **Pages** | Account — `38e848a7a5031d103a244d52490c5645` |
| Account | **Workers KV Storage** | Account — `38e848a7a5031d103a244d52490c5645` |
| Account | **Account Settings** | Account — `38e848a7a5031d103a244d52490c5645` |

**Client IP Address Filtering**：留空
**TTL**：留空（不自动过期）

### 4. 点 "Continue to summary" → "Create Token"

### 5. 复制 token

页面上会显示一串 `xxxxxxxx-xxxxxxxx-xxxxxxxx-xxxxxxxx`（**API Tokens 格式**，
不是 `eyJ...` 那种 JWT）。

⚠️ **只显示这一次**。

---

## 怎么安全地给我

**不要贴在对话里。** 请在 **PowerShell** 里执行这一行（token 直接进环境变量，不进 history、不落文件）：

```powershell
$env:CLOUDFLARE_API_TOKEN = "<粘贴你的token>"
```

但这样只对那个 PowerShell 窗口有效，而我需要在自己的进程里用到它。

### 推荐：写进本地环境变量（持久）

```powershell
[Environment]::SetEnvironmentVariable("CLOUDFLARE_API_TOKEN", "<你的token>", "User")
```

然后**重启 WorkBuddy**（或告诉我一声，我用一个子进程读取持久化的变量）。

### 或者：临时文件（我用完立刻删）

```powershell
Set-Content -Path "$env:TEMP\cf_token.txt" -Value "<你的token>" -NoNewline
```

告诉我一声，我读取 → 用完 → 立刻删除该文件。

> 🔒 我不会把这个 token 写进任何项目文件、不会打印到日志、不会提交进 git。

---

## 我拿到 token 后会自动做的事

```
1. wrangler kv namespace create NEXT_EDGE_PROGRESS     → 拿到 KV id
   （写入 wrangler.toml，绑定名 PROGRESS_KV）

2. wrangler pages deploy public --project-name=next-edge-report --branch=main
   → 拿到 https://next-edge-report.pages.dev
```

> 💡 **wrangler 部署直接读本地 `public/` 目录，不经过 git** ——
> 所以 `validation-key.txt` **不需要提交进仓库**（Pi 官方要求不 commit 这个 key）。
> 已确认 key 已写好在 `public/validation-key.txt`（128 字节、无尾随换行）。

```
3. 实测验证：
   curl -sI https://next-edge-report.pages.dev            → 200
   curl -s  https://next-edge-report.pages.dev/validation-key.txt → 与 key 精确相等
   curl -s  https://next-edge-report.pages.dev/privacy.html → 200
   确认 CSP header 生效、frame-ancestors 含 *.pinet.com

4. MCP: verify_app_url_ownership(app_id)   ← 现在就能成功
   → 拿到 pi_url（PiNet 子域名）

5. MCP: update_app(app_id, privacy_policy_url=https://next-edge-report.pages.dev/privacy.html)

6. 提交上架
```

### ⚠️ 已完成的前置步骤

| 项 | 状态 |
|---|---|
| `frontend_url` = `https://next-edge-report.pages.dev` | ✅ 已通过 `update_app` 设置（Pi 侧已接受，`deploy_app: true`） |
| `validation_key` 已取得并写入 `public/validation-key.txt` | ✅ 128 字节，无尾随换行 |
| `verify_app_url_ownership` 已试跑 | ✅ 因域名未上线而返回 connection_failed（预期内），已拿到 key |
| `privacy_policy_url` | 待部署后设置 |

> 也就是说：**域名一上线，立刻就能验证通过拿到 pi_url。**

---

## 如果你不想给 token

还有两条路：

### A. 你自己在 PowerShell 里跑部署（我给命令，你贴输出）

```powershell
$env:CLOUDFLARE_API_TOKEN = "<token>"
cd "G:\WORKBUDDY\2026-11-20-09-48-20\pi-next-app"
npx wrangler kv namespace create NEXT_EDGE_PROGRESS
npx wrangler pages deploy public --project-name=next-edge-report --branch=main
```
把输出贴给我，我接着做 Pi 侧的操作（update_app / verify / 上架）。

### B. 换 Vercel

同理需要 Vercel token 或 `vercel login`（OAuth 回调也是 localhost，同样受沙箱影响）
→ 走 Vercel 的 API Token 路径。

### C. 换 Cloudflare Pages 的 Dashboard 部署（完全不需要 token）

1. <https://dash.cloudflare.com/38e848a7a5031d103a244d52490c5645/workers-and-pages> → **Create application** → **Pages** → **Connect to Git**
2. 选仓库 `huiyaozhonghua/next-edge-report`
3. Framework preset = **None**，Build command = **留空**，Build output directory = **public**
4. 部署后到 **Settings → Functions → Bindings** → 加 KV namespace：
   Variable name = `PROGRESS_KV` → 选 `NEXT_EDGE_PROGRESS`（没有就新建）
5. 把生成的 `https://<项目名>.pages.dev` 告诉我

> ⚠️ 这条路**无法创建 KV namespace**（要先在 Workers KV 页面建），
> 但进度同步是锦上添花，**跳过 KV 也能部署成功** —— 前端会拿到 500 然后静默降级到 localStorage，
> App 核心功能不受影响。

**我推荐 C** —— 你已经在 Cloudflare 控制台了，全程不用碰 token，5 分钟能出 URL。
