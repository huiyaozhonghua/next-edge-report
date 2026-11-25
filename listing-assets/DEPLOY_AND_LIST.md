# 上架操作手册 — Next Edge Report（Pi 主网）

App 已创建，Logo 已就位。剩下的全是「需要一个公网 HTTPS 地址」之后的事。
本手册按顺序执行，每一步都有验证方法。

- **App ID**：`6b0672d68f5d0b3dd1cbb3d9`
- **slug**：`next-edge-report-7m5v`
- **网络**：mainnet（Production / Real Pi）— 不可改
- **开发者账号**：`ZJH18981927828`
- **listing_eligible**：`true`（可上架）
- **Logo**：已上传并设置（1024×1024 RGB，24KB，无透明，满幅渐变，48px 可读）

---

## 第 1 步：部署到公网 HTTPS

### 方案 A：WorkBuddy 一键发布（最快）

跟道枢说「把 pi-next-app 发布上线」，会生成一个 HTTPS 链接。

> ⚠️ **已知限制**：云端沙箱是无状态的，`/api/progress` 写的 `.data/progress-<uid>.json` **重启后会丢**。
> 上线前应把进度存储改成持久化方案（云数据库或对象存储），否则「进度云端同步」只是摆设。
> 匿名 localStorage 那条路径不受影响，App 依然可用。

### 方案 B：自己的服务器（推荐，数据持久）

```bash
# 服务端
git clone <your-repo> && cd pi-next-app
npm install          # 无依赖，实际是空操作
HTTPS_PROXY=http://127.0.0.1:17891 PORT=3000 node server.js
```

前置条件：

1. 进程监听 `PORT` 环境变量并绑定 `0.0.0.0`（`server.js` 已满足）
2. 反向代理到该端口并配好 HTTPS（nginx / caddy / 宝塔均可）
3. **如果服务器在中国大陆**，必须给 Node 进程配 `HTTPS_PROXY`（`server.js` 已支持 CONNECT 隧道），
   否则 `api.minepi.com` 直连被阻断，Pi 登录接口返回 502

### 部署后自检

```bash
curl -s https://<你的域名>/api/health
# 期望：{"ok":true,"service":"pi-next-report",...}
```

---

## 第 2 步：告诉 Pi 前端地址

把两个 URL 交给道枢代劳，或自己调用 MCP 工具 `update_app`：

```json
{
  "app_id": "6b0672d68f5d0b3dd1cbb3d9",
  "frontend_url": "https://<你的域名>",
  "privacy_policy_url": "https://<你的域名>/privacy.html"
}
```

> ⚠️ **只传 `frontend_url`，不要在同一调用里传 `development_url`**，也不要把 `development_url` 覆盖成公网地址。
> 主网 App 不使用 Sandbox。

`privacy_policy_url` 是主网上架的**必填项**，必须和 `frontend_url` 同域名或至少公网可访问。

---

## 第 3 步：域名归属验证

调用 MCP 工具 `verify_app_url_ownership`，参数 `app_id` + `frontend_url`。

- 验证成功 → 返回 `pi_url`（形如 `https://<subdomain>.pinet.com`）和 `pinet_subdomain`
- 需要校验文件 → 工具会返回 `validation_key`，把它作为**纯文本**写到站点的
  `/validation-key.txt`，部署后重试该工具

> `validation_key` 属于敏感信息：**不要提交 git，不要贴进对话**，`.gitignore` 已加规则。

---

## 第 4 步：在 Pi Browser 里测试

用 **Pi Browser**（手机 App 内的浏览器）打开 `pi_url`，测试：

1. 页面正常加载，4 个标签页可切换
2. 点「登录」→ 走 Pi 登录 → 授权成功
3. 登录后进度能云端同步（重新打开页面，进度还在）
4. 报告库在**未登录**状态下也能浏览（PiNet 不强制首屏登录）

> 注意：**Pi Browser 里不能登录 Pi Developers 控制台**，上架操作要在电脑浏览器做。

---

## 第 5 步：提交上架审核

在**电脑端**打开：

```
https://developers.minepi.com/devconsole/my-apps/6b0672d68f5d0b3dd1cbb3d9/listing
```

需要填的字段（`listing-assets/LISTING_MATERIALS.md` 里已备好现成文案）：

| 字段 | 值 |
|---|---|
| Subtitle | The Pi Next hackathon, decoded into one clear action plan |
| Description | 见 `LISTING_MATERIALS.md` 的 Description 段 |
| Category | Tools / Productivity（选控制台里最接近的） |
| Language | English |
| Privacy policy URL | 第 2 步已设 |
| Screenshots | 需要实机截图（Pi Browser 里的 4 个标签页） |

然后在控制台**提交审核**。MCP 不提供 `apply_listing`，这步必须手动。

---

## checklist 状态追踪

| 项 | 状态 | 说明 |
|---|---|---|
| `register_app` | ✅ | 已创建 |
| `configure_hosting` | ✅ | 已配置 |
| `dev_doc_opened` | ✅ | 已读官方文档 |
| Logo | ✅ | 已上传设置 |
| `add_privacy_policy` | ⬜ | 需第 1、2 步的公网 URL |
| `deploy_app` | ⬜ | 需第 1 步 |
| `validate_domain` | ⬜ | 第 3 步 |
| `add_pinet_subdomain` | ⬜ | 第 3 步验证成功后自动生效 |
| `create_wallet` | ⏸️ | 不需要（已决定不做支付） |
| `process_transaction` | ⏸️ | 不需要（已决定不做支付） |
| `configure_development_url` | — | 主网 App 不适用 |
| `sandbox_accessed` | — | 主网 App 不适用 |

---

## 安全红线

- **绝不**把助记词 / 私钥 / 恢复短语 / `PI_NETWORK_API_KEY` 贴进对话或提交 git
- `PI_NETWORK_API_KEY` 由你在 Pi Developers（settings_url → API key → Generate new key）生成，
  直接填进服务端密钥管理
- Pi 官方域名只有 `minepi.com` / `pinet.com`，第三方教程给的链接不要输入密钥
- 中国大陆虚拟货币合规风险仍适用，是否真正上架请自行判断
