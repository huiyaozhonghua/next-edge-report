# Next Edge — Pi Next 参赛作战台

把「Pi Next 个人搞钱报告」做成了一个真正的 Pi Network App：**不是一次性报告，而是陪参赛者打到 1/5 的工具**——选题匹配器 + 46 天进度追踪 + 每日打卡 + 报告库。

## 当前状态

- ✅ 前端：4 标签页作战台（作战台 / 选题匹配 / 46天计划 / 报告库）+ Pi SDK（`sandbox:false` 主网）+ 登录条；报告默认可浏览，符合 PiNet「不强制首屏登录」规则
- ✅ 选题匹配器：5 题加权评分引擎，本地计算，输出 5 个参赛选题的个性化排序（不同画像已验证有区分度）
- ✅ 进度系统：localStorage 匿名保存 + 登录后 `/api/progress` 按 Pi UID 云端同步；每日打卡连续天数
- ✅ 后端：Express-free 零依赖 Node http，`/api/auth/verify` 调 Pi `/v2/me`；`/api/progress` token 校验后按 uid 存本地 JSON；Sandbox 安全响应头
- ✅ 出站代理：`HTTPS_PROXY`/`HTTP_PROXY` 支持（CONNECT 隧道，零依赖），解决 `api.minepi.com` 直连被阻断导致的登录 502
- ✅ 合规文件：隐私政策、英文版首页 `public/en.html`、上架物料 `listing-assets/`（Logo + 英文文案 + 截图清单）
- ✅ 测试：`node test.js` 9 项全过
- ✅ **Pi 主网 App 已注册**：`6b0672d68f5d0b3dd1cbb3d9`（Next Edge Report，slug `next-edge-report-7m5v`），Logo 已上传设置，`.pi-onboard.json` 已写入
- ⏳ 待完成：公网 HTTPS 部署 → `frontend_url` → `verify_app_url_ownership` → Pi Browser 测试 → Ecosystem 上架提交审核
- ⏸️ 已决策不做：Pi 支付（`create_wallet` / `process_transaction` 不适用，App 对参赛者全免费）

### Pi 开发者控制台链接

| 用途 | 链接 |
|---|---|
| 应用总览 | https://developers.minepi.com/devconsole/my-apps/6b0672d68f5d0b3dd1cbb3d9 |
| 设置（API Key / URL） | https://developers.minepi.com/devconsole/my-apps/6b0672d68f5d0b3dd1cbb3d9/settings |
| 部署 | https://developers.minepi.com/devconsole/my-apps/6b0672d68f5d0b3dd1cbb3d9/deploy |
| **上架提交** | https://developers.minepi.com/devconsole/my-apps/6b0672d68f5d0b3dd1cbb3d9/listing |

## 本地运行

```bash
npm install
npm start
# http://localhost:3000
```

本机已有 Node 22，无需额外安装运行时。

若本机需要走代理访问 Pi API，启动时带上代理变量：

```bash
HTTPS_PROXY=http://127.0.0.1:17891 npm start
```

## 关键实现说明（来自官方文档核对）

- SDK 由 `https://sdk.minepi.com/pi-sdk.js` 提供，页面加载即 `Pi.init({version:"2.0", sandbox:false})`。
- 登录用 `Pi.authenticate(["username"], onIncompletePaymentFound)`；服务端把 accessToken 发到 `https://api.minepi.com/v2/me` 校验，**服务端是唯一事实来源**。
- PiNet 兼容：报告默认可浏览，不强制首屏登录；认证延后到用户主动点击。
- 未发送 `X-Frame-Options`；CSP `frame-ancestors` 仅允许 self / `*.pinet.com` / `*.minepi.com`。
- 应用名**不能以 "Pi" 开头**（Pi 商标规则），故用 "Next Edge Report"，不与 Pi 官方标识混淆。

## 剩余步骤（依赖公网 HTTPS 地址）

1. 部署本项目到公网 HTTPS（`npm start` 需监听 `PORT` 且绑定 `0.0.0.0`）。
2. `update_app(app_id, frontend_url=<https url>)` —— **只传 frontend_url**，不要传 development_url。
3. `update_app(app_id, privacy_policy_url=<https url>/privacy.html)`。
4. `verify_app_url_ownership(app_id)` → 若要求校验，部署 `/validation-key.txt`（内容为返回的 validation_key，纯文本）后重试。
5. 成功后在 **Pi Browser** 打开 `pi_url` 测试 Pi 登录。
6. 在电脑端打开 `listing_url`，补齐 subtitle / category / language，提交审核。

> 注意：Pi 官方明确要求 API Key、助记词、恢复短语**只能由你在 Pi Developers / 钱包中自行生成并填入服务端密钥管理**，不得粘贴到对话里。本报告遵守该要求。
