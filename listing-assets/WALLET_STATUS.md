# App Wallet 状态说明

> 核验时间：2026-11-26 11:45

---

## 📍 你的三个地址

| 角色 | 值 | 是什么 |
|---|---|---|
| **App wallet · public_key** | `GBRAGPYVPUDVRRW7KOAJPBMNGGIG6GSDHLZ7WRNG4K2GJR2DJTJ754HD` | 这条钱包的**链上地址**（G 开头 = 主网，56 字符） |
| **App wallet · tpa_wallet_id** | `wcavgyioyhdbwrviqezspvv7pifeuarb8gf4dzvqneqobhfx5clhfriwn9fn6i3c` | 同一条钱包记录的**记录 ID**（门户内部用，64 字符小写） |
| **你的个人钱包** | `GDUOFQWPIXGP2IAYMNHJKF6FWKWFHLN4YPIPAIY3PMB4KDZ2PNDBZUEX` | 打赏付款方 |

前两个是**同一条钱包**的两个标识 —— 从开发者门户的前端代码里确认的关联方式：
```js
public_key = wallets.find(k => k.id === application.tpa_wallet_id)?.public_key
```

---

## 📊 当前状态：还没激活

| 检查项 | 结果 |
|---|---|
| Pi 侧 `checklist.create_wallet` | ❌ **false** |
| Pi 侧 `incoming_multisig_wallet_id` | ❌ null |
| Pi 侧 `outgoing_wallet_id` | ❌ null |
| 链上账户（`api.mainnet.minepi.com/v2/accounts/GBRAG...`） | ❌ **404 账户不存在** |
| 链上合约端点（`/v2/contracts/GBRAG...`） | ❌ 404 |

**结论**：这条钱包**还没有在链上激活**，Pi 侧也还没把它挂到 App 上。

---

## 🔄 门户的钱包审核状态机

从 `developers.minepi.com` 的前端代码里提取的完整状态机：

| `status` | 门户显示 | 含义 |
|---|---|---|
| `pending` | **Pending review** | 申请已提交，**等 Pi 团队人工审核** |
| `pre_approved` | **creating** | 审核通过，正在创建链上钱包 |
| `approved` | **approved** | 已激活，可用 |
| — | `connected` | 已挂到 App 上（`outgoing_wallet_id` 已设置） |

门户原文：
> *"Generate a wallet, then apply for it to become your outgoing app wallet."*
> *"You can submit once \<app name\> is deployed at a verified public URL."*

---

## ⬜ 你的操作

### 1️⃣ 去 Settings#app-wallets 看这一条的状态

```
https://developers.minepi.com/my-apps/6b0672d68f5d0b3dd1cbb3d9/settings#app-wallets
```

找到 public_key 为 `GBRAG...54HD` 的那一行，看它显示：

- **Pending review** → 等 Pi 团队审核，**这一步只能等**
- **creating** → 快好了
- **approved** → 已激活，继续下一步

### 2️⃣ ⚠️ 关键：user_to_app 要的是 **Receiving（收款）钱包**

门户对两类钱包的区分（bundle 里的端点）：
```
GET  /portal/third_party_apps/{id}/wallets/receiving   ← 收款钱包（user_to_app 需要）
POST /portal/third_party_apps/{id}/wallets               ← 注册（生成）新钱包
```

- **Receiving / incoming multisig** → `user_to_app`（用户打赏给 App）✅ **你要的是这个**
- **Outgoing** → `app_to_user`（App 打赏给用户），还需要 `PI_WALLET_SEED`

> 如果你申请的是 **outgoing** 钱包，需要再申请一个 **receiving** 钱包。
> 判断方法：看那一行是 "Sending" 还是 "Receiving"。

### 3️⃣ 生成 API Key → 设到 Cloudflare

```
https://developers.minepi.com/my-apps/6b0672d68f5d0b3dd1cbb3d9/settings
```
→ API key → Generate new key → 设到 Cloudflare Pages 环境变量 `PI_NETWORK_API_KEY`

> ⚠️ 别贴到对话里、别写进代码、别 commit。

### 4️⃣ 等 `create_wallet: true` 后，在 Pi Browser 测一笔

手机 Pi Browser → `https://nextedgereportmv0511.pinet.com` → 登录 → **Support Next Edge** → 选 1 Pi

### 5️⃣ 链上确认（官方指定方式）

```bash
python listing-assets/verify_payment.py <payment_id> --payer
```

或手动打开：
```
https://blockexplorer.minepi.com/mainnet/accounts/GBRAGPYVPUDVRRW7KOAJPBMNGGIG6GSDHLZ7WRNG4K2GJR2DJTJ754HD
```

必须看到那笔 **U2A 入账** 才能算跑通 —— 官方原文：
> *"Do not claim success from API callbacks alone if the explorer shows no matching transaction."*

---

## 📌 为什么不阻塞上架

官方原文：
> *"For a Mainnet app, submit its listing for review — **it does not have to be approved yet**."*

**listing 提交不需要 wallet**。支付是独立的一条线，不影响你现在就去提交上架审核。

---

## 🔧 顺手记录的排障经验

**Pi MCP 502 / 代理突然全挂**：
- 端口 `17891` 的进程是 **`0dcloudCore`**（0dcloud 加速器），不是 Clash
- 它**刚启动的约 20 秒内隧道未就绪**，之后自动恢复
- 症状：`curl` status 35、`HTTP 000`、`node fetch` `UND_ERR_CONNECT_TIMEOUT`
- 处理：**等 20~30 秒重试**，别急着改配置

**Pi 地址格式**：56 字符，G 开头 = 主网，M 开头 = 测试网。不是 58。
