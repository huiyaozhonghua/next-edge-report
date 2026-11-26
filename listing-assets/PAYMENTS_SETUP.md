# Pi Payments 配置指南 — Next Edge Report

> 方向：**`user_to_app`（自愿打赏）**
> 官方指导来源：`prompt_payments`（MCP 工具返回，2026-11-26）
> 状态：**代码已实现并部署 ✅ ｜ 钱包与凭证待你配置 ⬜**

---

## 这条功能是什么

用户登录后可自愿给项目打赏 Pi（1 / 5 / 10 Pi 三档）。

- **不设付费墙** —— 所有功能对所有 Pi Next 参赛者永久免费
- **不影响社区参与奖** —— 打赏是自愿的支持行为，不是使用门槛
- **服务端权威** —— 金额档位、memo、支付状态全在服务端，浏览器只传档位 key

---

## ✅ 已实现（代码已部署）

### 前端
| 文件 | 内容 |
|---|---|
| `public/app.js` | `loadPayConfig()` / `renderSupport()` / `startPayment()`；`Pi.authenticate` scope 扩为 `["username", "payments"]` |
| `public/index.html` | 打赏容器 `#supportBox` + 页脚 Privacy / Terms 链接（评审在 App 内可直接点开） |

### 服务端
| 文件 | 路由 | 作用 |
|---|---|---|
| `functions/api/_paycore.js` | — | 共享核心（`_` 前缀 ⇒ Cloudflare 不当路由） |
| `functions/api/payments.js` | `GET /api/payments` | 返回服务端档位 + configured 标志 + 本人的 supporter 标记 |
| `functions/api/payments/approve.js` | `POST /api/payments/approve` | 校验并登记（对应 SDK 的 `onReadyForServerApproval`） |
| `functions/api/payments/complete.js` | `POST /api/payments/complete` | 调 Pi API approve+complete，确认完成后发放权益 |
| `server.js` | 同上三路由 | 本地开发服务器等价实现（测试依赖它） |

### 安全设计（对齐官方 SHARED SECURITY RULES）
- ✅ **金额只在服务端定义**（`SERVER_OFFERS`），客户端只能传 `offerKey`
- ✅ 每次请求都用**用户自己的 accessToken** 调 Pi `/me` 验证身份，不信任客户端 uid
- ✅ 校验 **direction === user_to_app**
- ✅ 校验 **金额命中服务端档位**（否则 400）
- ✅ 校验 **付款人 === 已认证用户**（否则 403）
- ✅ **幂等**：以 `payment id` 为键记录，重复提交只发放一次权益
- ✅ **权益只在服务端确认完成后发放**
- ✅ `PI_NETWORK_API_KEY` 只从服务端环境变量读，**从不下发到浏览器**
- ✅ `.env` / `.data/` 已在 `.gitignore`

### ⚠️ 一个实测抓到的坑
Cloudflare Pages Functions **按文件路径路由** —— `functions/api/payments.js` **不会**服务
`/api/payments/approve`。首次部署时线上返回 **405**（Method Not Allowed）。
修复：拆成 `functions/api/payments/approve.js` + `complete.js` 独立路由文件，共享逻辑放 `_paycore.js`。
> 本地 `server.js` 因为是自己路由，**测不出来** —— 必须实测线上端点才发现。

---

## 📍 关键地址（已记录）

| 角色 | 地址 | 说明 |
|---|---|---|
| **App wallet（收款方）** | `GBRAGPYVPUDVRRW7KOAJPBMNGGIG6GSDHLZ7WRNG4K2GJR2DJTJ754HD` | user_to_app 的入账地址 |
| **个人钱包（打赏方）** | `GDUOFQWPIXGP2IAYMNHJKF6FWKWFHLN4YPIPAIY3PMB4KDZ2PNDBZUEX` | 你用来付款的钱包 |

**链上状态（2026-11-26 实测）**：两个地址在主网都还**查无账户**
（`api.mainnet.minepi.com/v2/accounts/...` → 404），即**还没有任何交易落到它们上面**。

这说明 wallet **尚未在链上激活**（Pi 的 Mainnet 钱包申请需要审核，审核通过后才部署）。
所以现在还不能测支付 —— 测了也不会成功。

**一键验证脚本**（支付跑通后跑）：
```bash
python listing-assets/verify_payment.py <payment_id> --payer
```
它会同时查：payment id 的链上状态、app wallet 的 U2A 入账、你的钱包出账，
并打印官方指定的 Blockexplorer 页面链接。

---

## ⬜ 你需要做的三步

### 1️⃣ 申请 App Wallet（Pi 审核）

打开（**Pi 会审核每个 Mainnet 钱包申请**，需要时间）：
```
https://developers.minepi.com/devconsole/my-apps/6b0672d68f5d0b3dd1cbb3d9/settings#app-wallets
```

`user_to_app` 只需要 **incoming multisig wallet**（收款）。
> `app_to_user`（打赏给别人）才需要 outgoing wallet + `PI_WALLET_SEED`。

完成后 `checklist.create_wallet` 会变成 `true`。

### 2️⃣ 生成 API Key

打开 Settings → API key → **Generate new key**（新 key 会替换旧的）：
```
https://developers.minepi.com/devconsole/my-apps/6b0672d68f5d0b3dd1cbb3d9/settings
```

然后把它设到 **Cloudflare Pages 的环境变量**里：
```
变量名：PI_NETWORK_API_KEY
值：    你刚生成的 key
```

> ⚠️ **不要把 key 贴到对话里**、不要写进代码、不要提交到 git。
> 只在 Cloudflare 的 Secret 面板里填。

### 3️⃣ 在 Pi Browser 里测一笔

1. 手机上打开 **Pi Browser**
2. 访问 `https://nextedgereportmv0511.pinet.com`
3. 用 Pi 登录
4. 页面底部出现「Support Next Edge」→ 选一档（1 Pi）
5. 完成支付

### 4️⃣ 链上确认（必做）

官方明确要求：**不能只凭 API 回调就宣布成功**，必须去区块浏览器确认交易真的出现。

用钱包创建时显示的 **G… 开头的公开地址**打开：
```
https://blockexplorer.minepi.com/mainnet/accounts/<APP_WALLET_PUBLIC_ADDRESS>
```
确认能看到那笔 **U2A 入账**。

---

## 📋 完成状态报告口径

| 项 | 状态 |
|---|---|
| 代码实现 | ✅ 已完成并部署 |
| 本地测试 | ✅ 12/12 通过（含 3 条支付鉴权测试） |
| 线上端点 | ✅ 三路由实测 401（进鉴权逻辑） |
| 方向确认 | ✅ 用户选定 `user_to_app`（自愿打赏） |
| App wallet | ⬜ **待你申请**（`create_wallet: false`） |
| `PI_NETWORK_API_KEY` | ⬜ **待你生成并配置** |
| 端到端支付验证 | ⬜ 待 wallet + key 就绪后在 Pi Browser 测 |
| 链上确认 | ⬜ 待交易完成后查 Blockexplorer |

> 官方措辞：*"Report wallet/credential readiness **separately** from successful end-to-end payment verification."*
> —— 所以「代码就绪」和「支付跑通」是两件事，不能混为一谈。

---

## 🔍 常见问题

**Q：会不会因为有支付功能而影响社区参与奖？**
不会。打赏是自愿、无门槛，所有功能免费。这反而是「Pi 如何深度参与」的正面证据。

**Q：为什么不做成付费解锁？**
你选择了自愿打赏。付费墙会让参赛者付费意愿为零，也会削弱「社区参与奖」的观感。自愿打赏保留了参与感，同时展示了完整的 Pi Payments 集成。

**Q：为什么打赏了只给一个徽章，不给实际权益？**
官方示例里的常见设计。给「Supporter」标记 + 感谢 toast，不公开个人身份（链上交易本身公开，但不在 App 内展示名单）。

**Q：金额为什么是 1/5/10 Pi？**
三档覆盖「随手」「有心意」「大力支持」。金额由服务端定义，客户端改不了。

---

## 🧹 复选清单（做完打勾）

- [ ] 申请 incoming multisig wallet（Pi 审核，需时间）
- [ ] `get_app` 确认 `checklist.create_wallet: true`
- [ ] 生成 API key 并设到 Cloudflare Pages 环境变量 `PI_NETWORK_API_KEY`
- [ ] Pi Browser 打开 pi_url，登录后看到「Support Next Edge」
- [ ] 完成一笔 1 Pi 支付
- [ ] Pi Blockexplorer Mainnet 确认 U2A 入账
- [ ] 重新登录确认「Supporter」徽章生效
