# Next Edge Report —— Pi Ecosystem 上架提交包

> **App ID** `6b0672d68f5d0b3dd1cbb3d9` ｜ **slug** `next-edge-report-7m5v`
> **PiNet URL** `https://nextedgereportmv0511.pinet.com`
> **源站** `https://next-edge-report.pages.dev`
> **提交入口** https://developers.minepi.com/devconsole/my-apps/6b0672d68f5d0b3dd1cbb3d9/listing
>
> **核对基准（2026-11-25）**：官方 hackathon 页 + Mainnet Listing Requirements 原文 + 多家媒体交叉验证。
> 本文所有数字、名称、日期均已逐条核对，**可直接照抄**。

---

## ⚡ 提交前 5 分钟检查

| # | 检查项 | 状态 |
|---|---|---|
| 1 | **KYC 已完成** | ⬜ **你的事，硬门槛** |
| 2 | Hackathon 标签页已报名（Pi Next） | ⬜ **你的事** |
| 3 | Demo 视频已录制并**公开发布** | ⬜ 逐字稿已就绪 |
| 4 | 隐私政策 URL 可访问 | ✅ 已验证 |
| 5 | Logo 已上传（1024×1024 PNG） | ✅ 已设 |
| 6 | 预览图 5 张 | ✅ 已生成 |
| 7 | 域名归属验证 | ✅ **已通过** |
| 8 | PiNet 子域名 | ✅ **已分配** |

---

## 📋 表单字段（逐格填）

### 1. App name (English)

```
Next Edge Report
```

✅ 不以 "pi" 开头 ✅ 不含 Pi 官方标识 ✅

### 2. Subtitle（副标题）—— ✅ 已设置

```
Your Pi Next war room
```

> ⚠️ **硬限制：≤ 30 字符**。我最初写的 "The Pi Next hackathon, decoded into one clear action plan"
> 是 57 字符，被 Pi 侧拒绝（`description_short_too_long`），已缩短。

**备选**（都在 30 字符内）：
- `Topic matcher + 46-day plan`（28）
- `Pick the right topic, then ship`（32 ❌ 超了）
- `Decoded into one action plan`（28）

### 3. Category —— ✅ 已设置

```
Productivity
```

> Pi 官方枚举（来自 `update_app` 的 schema，16 个）：
> `Art` `Career` `Commerce` `Education` `Entertainment` `Finance` `Games` `Health`
> `Lifestyle` `Music` `NFT` **`Productivity`** `Social` `Sports` `Travel` `Utilities`
>
> 我们的 App 是工具型（匹配器 + 计划 + 打卡）→ `Productivity` 最贴切。

### 4. Language —— ✅ 已设置

```
English
```

### 5. Description（完整英文，直接粘贴）

```
Next Edge is a war room for Pi Next hackathon participants — not just another report.

Answer 5 questions and the built-in matcher scores the best app ideas for YOUR skills, time,
and assets. Then track a 46-day phased checklist and build a daily check-in streak. Progress
saves automatically and syncs to your Pi account.

Why it exists: 75% of the $200,000 USDT prize pool rewards real user engagement and retention.
So we built a tool people come back to — not a one-time read.

Features:
- Topic matcher with a transparent weighted scoring engine (computed locally, nothing uploaded)
- 46-day plan from eligibility to submission, with auto-saved progress
- Daily check-in streak to keep you moving
- Cross-verified research library: prizes, judging criteria, past winners, expected value, red lines
- Original deep-dive: prize structure breakdown, hard entry thresholds, risk grading, and
  three low-cost topic directions

Built for the Pi ecosystem: Pi sign-in and PiNet compatible. Browse freely; sign in to sync.
```

**⚠️ 一处必须改**：最后一段原文写的是 "Pi sign-in, Pi payments, and PiNet compatible"
—— **我们 declined payments，没有 Pi 支付**。说有的会被评审点开发现是假的，
反而扣分（官方评审标准含 "Technical completeness"）。上面这版已改为
**"Pi sign-in and PiNet compatible"**，与实现一致。

### 6. App URL / PiNet URL

```
https://nextedgereportmv0511.pinet.com
```

### 7. Privacy policy URL

```
https://next-edge-report.pages.dev/privacy.html
```

✅ 已设置到 Pi 侧（`add_privacy_policy: true`），实测 200。

### 7b. Terms of Service URL —— ✅ 已设置

```
https://next-edge-report.pages.dev/terms.html
```

> ⚠️ **这个字段之前是空的！** 从 `update_app` 的 schema 发现
> `terms_of_service_url` 是 **"Required for a Mainnet listing"**。
> 已新建 `public/terms.html`（含合规免责：不构成投资建议、与 Pi 官方无隶属关系等）并部署上线。

---

### 8. Preview images（5 张，按此顺序上传）

| 顺序 | 文件 | 公网 URL（可直接填） | 展示内容 |
|---|---|---|---|
| **1（封面）** | `05-matcher-result.png` | `https://next-edge-report.pages.dev/previews/05-matcher-result.png` | **选题匹配结果态** —— 69/67/63 三档差异化评分 + 5 题选项高亮。最能体现"个性化"，做封面 |
| 2 | `01-dashboard.png` | `https://next-edge-report.pages.dev/previews/01-dashboard.png` | 作战台全景：42 天倒计时 + 20万 + 75% + 进度环 + 打卡卡 |
| 3 | `02-topic-matcher.png` | `https://next-edge-report.pages.dev/previews/02-topic-matcher.png` | 选题匹配器表单（5 题全貌） |
| 4 | `03-46day-plan.png` | `https://next-edge-report.pages.dev/previews/03-46day-plan.png` | 46 天计划 5 阶段 15 项任务 |
| 5 | `04-report-library-expanded.png` | `https://next-edge-report.pages.dev/previews/04-report-library-expanded.png` | 调研报告库全展开：奖金表、置信度徽章、期望值测算、红线 |

**尺寸**：全部 1440px 宽（手机竖版布局），Pi 目录正是这个形态。
**状态**：5 张都已部署上线，实测 200 ✅

> 📌 **官方校验逻辑**（从开发者门户 JS 提取）：
> `"missing_remote_previews": "Add 3 screenshots first."`
> → **至少 3 张**。我们有 5 张。
>
> ⚠️ **上传位置**：MCP 工具里**没有预览图上传接口**（只有 logo 的），
> 预览图必须去 **Dashboard → listing 页面手动上传**（拖拽文件，或填上面的公网 URL）。
> 本地文件在 `listing-assets/screenshots/`，公网副本在 `public/previews/`。

> **封面选 05 的理由**：官方评审标准第一条是
> "Pi utility and alignment with overall community and ecosystem needs"，
> 而 **75% 的奖金看参与度和留存** —— 一张"同一套题目、不同的人得到不同答案"的截图，
> 比任何文字都能说明"这是工具不是报告"。

### 📌 上架审核不必等通过

官方提交流程原文：*"For a Mainnet app, submit its listing for review — **it does not have to be
approved yet**."*

→ **提交上架审核后就能参赛**，不用等 Pi 审核通过。
→ 另外：*"You can replace the link or withdraw at any time until the deadline."*
→ **视频链接在截止前可以随时替换** —— 先交占位、后面补真视频也是允许的。

### 9. Logo

✅ 已上传并设置（`app_logo_url` 已有值）
文件：`listing-assets/logo-1024.png`（1024×1024 PNG，24KB）

### 10. Demo video

⬜ **待录** —— 逐字稿 `DEMO_VIDEO_SCRIPT.md`（2:52，英文，官方 5 项全覆盖）
要求：**≤3 分钟**、**英文**、**公开**（YouTube 等）、链接填进表单

### 11. Team members

⬜ 列出**全部队员**，且**每人各自注册**了 Pi Next
（官方规则 9 原文：*"Each team member must register individually for the Pi Next hackathon
before joining a team. Each team member must be a single individual with a single, active
Organizer account."*）

> 📌 **团队人数无上限**（规则 10：*"the Organizer has determined that there is no limit to the
> team size"*）。
> 但**每个 App 只由一名队员提交**（官方：*"Only one team member should submit each app"*）。
> 单人参赛无需协调。

### 12. Demo of a real transaction

⬜ 不适用 —— 我们 declined payments，App 对参赛者全免费。
（官方允许；`create_wallet` / `process_transaction` 在 Pi 侧显示"不适用"是正常的）

---

## 🔍 上架表单的 5 项硬校验（从官方 JS 提取）

官方开发者门户的前端会实时校验这 5 项，每项都有明确报错文案：

| 校验码 | 官方报错文案 | 我们的状态 |
|---|---|---|
| `not_deployed` | `"App not deployed"` | ✅ 已部署 |
| `domain_not_verified` | `"Domain not verified"` | ✅ 已通过验证 |
| `listing_not_submitted` | `"Mainnet listing not submitted for review"` | ⬜ **你去 Dashboard 提交审核** |
| `video_missing` | `"Demo video missing"` | ⬜ **你录视频** |
| `moderated` | `"App is blocked or delisted"` | ✅ 无 |
| `missing_languages` | `"Choose a language on this listing page first."` | ✅ 已设 English |
| `missing_remote_previews` | `"Add 3 screenshots first."` | ⬜ **你上传（5 张已备好 URL）** |
| `missing_description_short` | `"Save the listing first so it has a subtitle."` | ✅ 已设 "Your Pi Next war room" |
| `frontend_url_not_validated` | `"Deploy the app at a verified public URL first."` | ✅ 已验证 |
| `pi_kyc_not_applied` | `"Apply for Pi KYC in the Pi app first."` | ✅ **已 KYC**（你截图确认） |

**视频链接的合法性判定**（官方源码）：
```js
protocol === "https:" && !username && !password && hostname.includes(".")
```
→ **必须 https、不能带账号密码、域名要含点**。YouTube 链接 ✅

**官方列出的视频发布渠道**：
`X` / `YouTube` / `Ecosystem Summit` / `Facebook` / `Instagram` / `Telegram` /
`Mine Pi app` / `Email from Pi` / `Friend or teammate`

---

## ✅ Mainnet Listing Requirements 逐条自查

| 官方要求 | 我们的状态 | 证据 |
|---|---|---|
| Fully functional app, professional UI | ✅ | 4 标签页全部可交互；shadcn 风格 UI；移动端响应式 |
| Complete KYC verification | ⬜ | **你的事** |
| 不以 "pi" 开头 / 不滥用商标 | ✅ | `next-edge-report`；配色 teal/indigo/amber ≠ Pi 蓝白；logo 无 π 符号 |
| Use Only Pi Authentication | ✅ | 只有 `Pi.authenticate(["username"])`，无邮箱/第三方登录 |
| Pi-Only Transactions | ✅ | 无任何交易（免费 App），不存在非 Pi 交易 |
| Avoid Redirection to External Sites | ✅ | 无外链、无跳板 |
| Limit Data Collection | ✅ | 只存 `uid` + 进度 JSON；不采集邮箱/手机号 |
| 隐私政策 | ✅ | `https://next-edge-report.pages.dev/privacy.html` |
| PiNet 集成 | ✅ | `https://nextedgereportmv0511.pinet.com` |
| 英文名称 + 英文描述 + 预览图 | ✅ | 本文件 |
| Demo 视频 ≤3 分钟且公开 | ⬜ | 逐字稿已就绪 |

---

## 🖼️ 上架截图是中文的 —— 要不要英文化？

**当前状态**：5 张截图都是**中文界面**。

官方要求原文只说 *"include preview images that show the app's interface"*，
**没有明确要求界面必须是英文**。但评审是国际的，中文截图会增加理解成本。

**三个选项**：

| 方案 | 成本 | 效果 |
|---|---|---|
| **A. 保持中文 + 后期加英文标注** | 1 小时 | ✅ 够用，评审看得懂功能 |
| **B. 翻译 index.html + app.js 文案** | 2–3 小时 | ⭐ 最好 |
| **C. 用 en.html 截图** | ❌ 不可行 | en.html 是静态页，无交互，截不出功能 |

**我推荐 B**，但不是现在 —— 等 Demo 视频录完、Demo 提交了，如果还有时间再做。

如果选 B，需要翻译的位置：`public/index.html`（文案）+ `public/app.js`（toast、结果标签）。
逻辑不动，约 80 处文案。改动后重新跑 `node listing-assets/make_screenshots.mjs` 即可。

---

## 📅 提交时间线建议

| 日期 | 事项 |
|---|---|
| **11/26（明天）** | KYC + 报名确认 → 手机上验证 pi_url 能打开 → 录 Demo |
| 11/27 | 后期 + 审片 + 发布 YouTube（**设为公开**） |
| 11/28 | 填 listing 表单 + 上传 5 张图 + 提交 |
| 11/29 起 | 补 Demo（可选，中期提交拿早期反馈）、准备答辩、盯社区传播 |

> ⏰ 官方截止 **2027-01-05 23:59 PST = 北京时间 1/6 15:59**，还有 **42 天**，
> 但**别拖到最后** —— Demo 视频要公开发布，YouTube 审核/网络问题需要缓冲。

---

## 🔗 速查链接

| 用途 | 链接 |
|---|---|
| 上架表单 | https://developers.minepi.com/devconsole/my-apps/6b0672d68f5d0b3dd1cbb3d9/listing |
| 应用总览 | https://developers.minepi.com/devconsole/my-apps/6b0672d68f5d0b3dd1cbb3d9 |
| 设置（URL / API Key） | https://developers.minepi.com/devconsole/my-apps/6b0672d68f5d0b3dd1cbb3d9/settings |
| 部署 | https://developers.minepi.com/devconsole/my-apps/6b0672d68f5d0b3dd1cbb3d9/deploy |
| **PiNet URL（给用户）** | **https://nextedgereportmv0511.pinet.com** |
| 源站（给开发者） | https://next-edge-report.pages.dev |
| GitHub | https://github.com/huiyaozhonghua/next-edge-report |
