# 在 Codex 里完成 Pi 注册（官方点名支持）

Pi 官方接入指南原话："Compatible with any client that supports remote MCP servers, **including Codex**"。
Codex 跑在宿主机，不受 WorkBuddy 沙箱网络限制——你的 0dcloud 全局模式能直接接管，这是它能通而 WorkBuddy 不能通的根本原因。

工程代码不用动，就用现成的 `G:\WORKBUDDY\2026-11-20-09-48-20\pi-next-app`。

---

## 前置确认

1. 电脑已装 Codex CLI（`codex --version` 能跑）。没有就先装：`npm install -g @openai/codex`。
2. 0dcloud 保持「已连接」+ 全局模式（你已开好）。
3. 先验证宿主机网络能解析 Pi 域名——在**你自己的终端**（不是 WorkBuddy）跑：
   ```
   nslookup developers.minepi.com
   ```
   如果返回的还是 `2a03:2880:...`（Meta）这种 IP，先在 0dcloud 里开 TUN 模式，或换个节点，直到解析出正常 A/AAAA 再往下走。

---

## 第 1 步：配置 MCP 服务器

**方法 A（推荐，一行命令）**——在宿主机终端执行：
```
codex mcp add pi-developers --url https://developers.minepi.com/mcp
```

**方法 B（手动写配置）**——编辑 `C:\Users\HUAWEI\.codex\config.toml`，加入：
```toml
[mcp_servers.pi-developers]
url = "https://developers.minepi.com/mcp"
```
> 注意：`Pi` 走浏览器 OAuth，**不需要** `bearer_token_env_var`，千万别填 token。
> 如果文件已存在其他 `[mcp_servers.xxx]`，保留它们，只追加这一段。

---

## 第 2 步：验证工具已加载

重启 Codex，在交互界面里输入 `/mcp`，应该能看到 `pi-developers` 且状态正常。
或在终端跑 `codex mcp list` 查看。
如果 OAuth 没自动弹登录，执行：`codex mcp login pi-developers`。

---

## 第 3 步：粘贴这条指令

在 `pi-next-app` 目录里启动 Codex（`cd` 到该目录再 `codex`），把下面这段发它：

```
Read https://developers.minepi.com/agents.md and follow its instructions to onboard this app to Pi Network.

The app is already built. Inspect it first and preserve the existing code — do NOT rewrite from scratch:
- public/index.html — report UI with Pi SDK script tag and login bar
- public/app.js — Pi.init({sandbox:false}), Pi.authenticate, server token exchange
- server.js — zero-dependency Node backend, /api/auth/verify calls Pi /v2/me
- public/privacy.html — privacy policy

Decisions already made by the user (do not ask again):
- Network: Production / Mainnet (host_network: mainnet)
- Purpose: Pi Next hackathon submission

Call whoami first. If authorization is required, open the browser and ask me to approve with Pi Browser.
Show me developers_url after create_app or list_apps.
```

---

## 第 4 步：授权

首次调用工具会弹浏览器 Pi 登录页 → 手机 **Pi Browser 扫码批准**。
成功后 Pi 后台 Connected agents 页面会出现一条记录。

---

## 第 5 步：需要你回答的问题（Codex 会问）

1. **Staging 还是 Production** → 答 **Production (Mainnet, Real Pi)**。
   （不可逆：换网络要重建 App；只有主网能上架和参赛。）
2. **公网上架地址** → 需要一个 `https://` 公开地址（不能 localhost）。
   现在没有就让它先做 `create_app` 和 Logo，部署步骤等地址备好再做。

---

## 第 6 步：跑完把这些发回 WorkBuddy

- **App ID**（主 App 的 id）
- **developers_url**（Pi Developers 控制台链接）
- **`.pi-onboard.json`** 内容（Codex 会写在项目根目录）
- 返回的 **sandbox_url / pi_url / listing_url**（如果有）
- **checklist** 里还缺的项

我接手后续：Logo 校验、支付流程（`prompt_payments`）、域名验证文案、上架材料。

---

## 安全红线

- 任何页面索要**助记词 / 私钥 / 恢复短语** → 一律不输。Pi 官方域名是 `minepi.com` / `pinet.com`，别在第三方教程给的链接里输入。
- `PI_NETWORK_API_KEY` 由你自己在 Pi Developers（settings_url → API key → Generate new key）生成，填到服务端密钥管理，**不要贴进对话**。
- `validation_key`（域名验证）不要提交 git。
- 主网创建不可改，确认清楚再让它 `create_app`。
- 中国大陆虚拟货币合规风险仍适用，是否真正上架请自行判断。
