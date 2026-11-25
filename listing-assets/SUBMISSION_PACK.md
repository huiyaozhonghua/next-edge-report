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

### 2. Subtitle（副标题，一句话）

```
The Pi Next hackathon, decoded into one clear action plan
```

**备选**：
- `Pick the right topic, then finish it — a war room for Pi Next`
- `Your Pi Next war room: topic matcher, 46-day plan, daily streaks`

> 💡 副标题是评审在目录里第一眼看到的。**第一个版本强调"结果"（one clear action plan），
> 第二个版本更强调"动作"。我推荐第一个** —— 简洁且说明价值。

### 3. Category

选最接近的：
- **Tools / Productivity** ← 推荐
- Utilities
- Education

> ⚠️ Pi 目录的具体分类在下拉框里，先看有没有 "Tools"；有就选它。

### 4. Language

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

### 8. Preview images（5 张，按此顺序上传）

| 顺序 | 文件 | 展示内容 |
|---|---|---|
| **1（封面）** | `listing-assets/screenshots/05-matcher-result.png` | **选题匹配结果态** —— 69/67/63 三档差异化评分 + 5 题选项高亮。最能体现"个性化"，做封面 |
| 2 | `01-dashboard.png` | 作战台全景：42 天倒计时 + 20万 + 75% + 进度环 + 打卡卡 |
| 3 | `02-topic-matcher.png` | 选题匹配器表单（5 题全貌） |
| 4 | `03-46day-plan.png` | 46 天计划 5 阶段 15 项任务 |
| 5 | `04-report-library-expanded.png` | 调研报告库全展开：奖金表、置信度徽章、期望值测算、红线 |

> **封面选 05 的理由**：官方评审标准第一条是
> "Pi utility and alignment with overall community and ecosystem needs"，
> 而 **75% 的奖金看参与度和留存** —— 一张"同一套题目、不同的人得到不同答案"的截图，
> 比任何文字都能说明"这是工具不是报告"。

### 9. Logo

✅ 已上传并设置（`app_logo_url` 已有值）
文件：`listing-assets/logo-1024.png`（1024×1024 PNG，24KB）

### 10. Demo video

⬜ **待录** —— 逐字稿 `DEMO_VIDEO_SCRIPT.md`（2:52，英文，官方 5 项全覆盖）
要求：**≤3 分钟**、**英文**、**公开**（YouTube 等）、链接填进表单

### 11. Team members

⬜ 列出**全部队员**，且**每人各自注册**了 Pi Next
（官方原文：*"All team members must register in order to participate"*）
提交由**一名**队员完成。

### 12. Demo of a real transaction

⬜ 不适用 —— 我们 declined payments，App 对参赛者全免费。
（官方允许；`create_wallet` / `process_transaction` 在 Pi 侧显示"不适用"是正常的）

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
