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

### 3. 填权限（按你截图里的实际界面）

> 你现在在「**账户 API 令牌 → 创建令牌**」页面，令牌名称已填 `next-edge-deploy` ✅
> 往下就是「**权限策略**」区域。操作如下：

**① 改第一个下拉框**

它现在显示「**指定域名**」→ 点开改成「**指定账户**」。

> ⚠️ 这一步很关键：**只选 Zone 权限拿不到 Pages**（Pages 是账户级资源）。
> 界面上还会提示「Selectable permission groups are limited to actions based on your
> account membership roles」—— 意思是可选项取决于你在该账户的角色（你是 Owner，全都有）。

**② 在权限组里勾选**

展开「**Developer Platform (0/4)**」→ 里面就能看到 **Pages**。
勾选后右侧会出现第二个下拉框选级别：

| 权限项（Developer Platform 组内） | 级别 | 必需？ |
|---|---|---|
| **Pages** | **Edit** | ✅ **必需** —— 建项目、触发部署 |
| **Workers KV Storage** | **Edit** | 可选 —— 进度同步用，不给也能部署 |
| Workers Scripts | Edit | 不需要 |
| Workers R2 Storage | Edit | 不需要 |

**③ Account Settings？不需要**

> ✅ **不用找它** —— 你在「账户 API 令牌」页面建的 token 本来就绑定在这个账户上。
> 官方用法是显式给出账户 ID：
> ```bash
> export CLOUDFLARE_API_TOKEN="<token>"
> export CLOUDFLARE_ACCOUNT_ID="38e848a7a5031d103a244d52490c5645"
> ```
> 给了 ACCOUNT_ID，就不再需要「读账户列表」的权限。
> （脚本里已经设好了这个环境变量。）

**④ 资源范围（Resources）**

每一行右侧的资源选择器，都选：

| 下拉框 | 选什么 |
|---|---|
| 资源类型 | `Account` |
| 账户 | 你的账户（Default account / ID `38e848a7a5031d103a244d52490c5645`） |

> 💡 **两个 "Account" 别搞混**：
> - Permissions 第 1 列的 `Account` = 权限是账户级
> - Resources 里的 `Account` = token 能作用于哪个账户
>
> **别选 Zone** —— 我们没有域名，Pages 项目在账户级。

### 4. 点 "Continue to summary" → 核对 → 点 "Create Token"

### 5. 复制 token

你在「**账户 API 令牌**」页面创建的 token 是 **`cfat_` 开头**（账户 token）。
（用户级 token 才是 `cfut_` 开头 —— 两者 wrangler 都认，不用纠结。）

> ✅ **账户 token 支持 Pages**（官方兼容性矩阵：Pages ✅），
> 而且它不绑定个人账号，做 CI/CD 更稳 —— 正合我们这个场景。

⚠️ **只显示这一次**，离开页面就看不到了。

---

## 怎么安全地给我

**不要贴在对话里。** 推荐用临时文件（我用完立刻删）：

```powershell
Set-Content -Path "$env:TEMP\cf_token.txt" -Value "<粘贴你的token>" -NoNewline
```

然后**告诉我一声**，我读取 → 验证 → 部署 → **立刻删除该文件**。

> 🔒 我不会把这个 token 写进任何项目文件、不会打印到日志、不会提交进 git、
> 不会出现在最终回复里。

### 备选：持久化到环境变量

```powershell
[Environment]::SetEnvironmentVariable("CLOUDFLARE_API_TOKEN", "<你的token>", "User")
```
之后重启 WorkBuddy，我的子进程就能读到。

### 备选：你自己跑部署

```powershell
$env:CLOUDFLARE_API_TOKEN = "<token>"
cd "G:\WORKBUDDY\2026-11-20-09-48-20\pi-next-app"
npx wrangler kv namespace create NEXT_EDGE_PROGRESS
npx wrangler pages deploy public --project-name=next-edge-report --branch=main
```
把输出贴给我，Pi 侧的操作我接着做。

---

## token 有效性自测（你也可以先自己验）

```powershell
curl.exe "https://api.cloudflare.com/client/v4/user/tokens/verify" --header "Authorization: Bearer <你的token>"
```
返回 `"status": "active"` 就是好的。

> 注意：这个 curl 需要走代理，加 `-x http://127.0.0.1:17891`

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
