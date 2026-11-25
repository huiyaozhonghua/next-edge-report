# 在宿主机完成 Pi 注册（绕开 WorkBuddy 沙箱网络限制）

## 为什么需要这一步

WorkBuddy 会话被锁在沙箱网络里，无法解析 `developers.minepi.com`（DNS 被污染到 Facebook/Twitter 的 IP），Pi 的 MCP 工具因此始终连不上。Cursor / Claude Code 跑在你的真实系统上，能被 0dcloud 的代理正常接管，所以由它们完成注册。

**工程代码不用动**——就用现成的 `G:\WORKBUDDY\2026-11-20-09-48-20\pi-next-app`。

---

## 第 1 步：配置 MCP 服务器

在 `pi-next-app` 项目根目录下创建配置文件。

**Cursor**：创建 `.cursor/mcp.json`
**Claude Code**：在项目目录运行
```
claude mcp add --transport http pi-developers https://developers.minepi.com/mcp
```

Cursor 的 `.cursor/mcp.json` 内容：
```json
{
  "mcpServers": {
    "pi-developers": {
      "url": "https://developers.minepi.com/mcp"
    }
  }
}
```

注意：如果已有其他 MCP 服务器，把 `pi-developers` 加进现有的 `mcpServers` 对象，**不要覆盖**。

---

## 第 2 步：粘贴这条指令

在**同一个项目目录**里，把下面这段发给 Cursor / Claude Code：

```
Read https://developers.minepi.com/agents.md and follow its instructions to onboard this app to Pi Network.

The app is already built. Do NOT rewrite it — inspect it first and preserve the existing code:
- public/index.html — report UI with Pi SDK script tag and login bar
- public/app.js — Pi.init({sandbox:false}), Pi.authenticate, server token exchange
- server.js — zero-dependency Node backend, /api/auth/verify calls Pi /v2/me
- public/privacy.html — privacy policy

Required choices (already decided by the user):
- Network: Production / Mainnet (host_network: mainnet). Do not ask again.
- This is for the Pi Next hackathon.

Call whoami first. If authorization is needed, open the browser and ask me to approve with Pi Browser.
Show me developers_url after create_app or list_apps.
```

---

## 第 3 步：授权

首次调用工具时会自动打开浏览器 Pi 登录页 → 用手机 **Pi Browser 扫码批准**。批准后在 Pi 后台的 Connected agents 页面会看到一条新记录，说明成功。

---

## 第 4 步：需要你明确回答的两个问题（代理会问）

1. **Staging 还是 Production** → 回答 **Production (Mainnet, Real Pi)**。
   - 这是不可逆的：换网络必须重建 App；只有主网能上架和参加 Pi Next。
2. **公网上架地址** → 需要你提供一个 `https://` 的公开地址（不能是 localhost）。
   - 现在还没有的话，可以让代理先完成 `create_app` 和 Logo，部署这步等地址准备好再做。

---

## 第 5 步：跑完后把这些发给我

注册完成后，把下面几项贴回 WorkBuddy 对话，我接手后续（Logo 校验、支付流程、域名验证文案、上架提交材料）：

- **App ID**（主 App 的 id）
- **developers_url**（Pi Developers 控制台链接）
- **.pi-onboard.json** 的内容（代理会写在项目根目录）
- 代理返回的 **sandbox_url** / **pi_url** / **listing_url**（如果有）
- **checklist** 里还缺哪些项（代理应该会列出来）

---

## 注意事项（安全红线）

- 代理如果索要 `PI_NETWORK_API_KEY`、助记词、恢复短语 → **不要贴在对话里**。这些要你自己在 Pi Developers（settings_url → API key → Generate new key）生成，并直接填入服务器密钥管理。
- `validation_key`（域名验证用）不要提交到 git、不要发聊天。
- 主网一旦创建不可改网络，确认清楚再让它 `create_app`。
- 中国大陆合规风险仍适用：是否真正提交上架请自行判断。
