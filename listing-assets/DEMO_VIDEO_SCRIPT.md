# Next Edge — Demo 视频逐字稿

> **目标观众**：Pi Next 评委（英文）+ Pi 生态用户
> **时长**：≤ 3 分钟（官方硬限制），本稿设计为 **2 分 45 秒**
> **语言**：⚠️ **必须英文**（官方提交要求 + App 本身有英文版 `en.html`）
> **必须公开**：YouTube / 其他公开平台，链接填进提交表单
> **必须讲清 5 件事**（官方原文，见文末对照表）

---

## 🎯 官方 5 项要求 → 本稿覆盖位置

| # | 官方要求（原文） | 本稿时间码 | 覆盖方式 |
|---|---|---|---|
| 1 | *what your app is and what it does* | 0:00–0:25 | 开场一句话 + 界面全景 |
| 2 | *a walkthrough of its features and interface* | 0:25–1:50 | 四个标签页逐一演示 |
| 3 | *who the app is for* | 1:50–2:05 | 目标用户明确点出 |
| 4 | *the problem or need it addresses* | 2:05–2:25 | 痛点：75% 奖金给运营不是代码 |
| 5 | *how Pi is part of the experience* | 2:25–2:45 | Pi 登录 + PiNet 嵌入 + 身份即账号 |

---

## 🎬 拍摄清单（先备好，别到时候现找）

| 素材 | 状态 | 备注 |
|---|---|---|
| 浏览器窗口，宽度 ≥ 1280 | 需准备 | Chrome/Edge 均可，**不要深色模式**（App 是浅色） |
| **Pi Browser 手机**（真机） | ⚠️ 必需 | 第 5 段要在真机 Pi Browser 里演示登录 |
| 已在 Pi Developer Console 注册 Pi Next | 需确认 | 团队每个人都必须注册 |
| 一个填好答案的匹配结果截图 | 建议预录 | 见「保险方案」 |
| 背景音乐 | 选配 | 轻电子，-20dB，人声优先 |

---

## 📌 关键决策：Demo 演示哪个页面

项目里有两页：

| 页面 | 内容 | 用在哪 |
|---|---|---|
| `index.html`（**中文，265 行**） | **完整应用** —— 四个标签页、匹配器、计划、打卡、报告库、Pi 登录 | ✅ **Demo 视频演示这个** |
| `en.html`（英文，96 行） | 静态英文介绍页（hero + 数据 + 说明），**没有交互功能** | 供普通浏览器访问/分享 |

> ⚠️ **别用 en.html 录 Demo** —— 它没有匹配器、计划、打卡，演不出功能。
> 正确做法：**录中文版 index.html，配英文字幕 + 英文口播**。
> 字幕承担「看不懂」的缺口，这是国际评审 Demo 的标准做法。
>
> 如果想彻底英文化界面，需要把 index.html 的 4 个标签页 + app.js 全部翻译 ——
> 约 2–3 小时工作量。**不是必须**，因为 App 本身有 `en.html` 作为英文入口，
> 且官方只要求「English name / description / preview images」，不要求界面全英文。

---

# ▸ 逐字稿正文

> **图例**：`[画面]` = 镜头说明 ｜ `旁白：` = 说的话 ｜ `⏱` = 时间码
> 每段旁白都给了**字数**和**朗读时长**，请照着念，不要即兴发挥。

---

## 【镜头 0】标题卡 — ⏱ 0:00–0:06

`[画面] 黑底白字。标题 "Next Edge" 淡入，下方小字 "Pi Next Hackathon · Submission Video"。右下角 Pi logo。]`

**旁白（英文，19 词 ≈ 8 秒）：**

> "This is Next Edge — a war room for Pi Next participants, built as a native Pi app."

`[画面] 标题淡出，切到浏览器全屏]`

---

## 【镜头 1】What it is — 是什么 — ⏱ 0:06–0:25

`[画面] 浏览器打开 pi_url（PiNet 地址）。停在「作战台」标签页。不动，让观众看清。]`

**旁白（38 词 ≈ 17 秒）：**

> "Pi Next has a two-hundred-thousand-USDT prize pool. But here's the thing: seventy-five percent of that money goes to community engagement — real users, retention, and traction. Not to writing better code.
>
> So Next Edge is a war room, not a report. It answers one question: given your skills, your time, and what you already own — what should you build, and how do you finish it?"

`[画面] 鼠标移到顶部三个数据上，依次轻点：天数剩余 / 20万 / 75%]`

**屏幕标注（后期加字幕/箭头）：**
- `43 days left`
- `$200K prize pool`
- `75% goes to engagement`

---

## 【镜头 2】Feature A — 选题匹配器 — ⏱ 0:25–1:00

`[画面] 点「选题匹配」标签页。`

**旁白（30 词 ≈ 13 秒）：**

> "Start here. Five questions about your tech stack, your hours, your existing assets, and which prize you're chasing."

`[画面] 快速点击答完 5 题（可加速 4 倍）。已答的选项高亮。]`

`[画面] 点「匹配」按钮。结果区淡入。]`

**旁白（24 词 ≈ 10 秒）：**

> "The matcher scores all five candidate topics against your answers — locally, in your browser. Nothing you answer ever leaves your device."

`[画面] 停在结果区。头号推荐卡片右上角直接显示分数（不用悬停），下方是预计工时和标签 chip。]`

**旁白（16 词 ≈ 7 秒）：**

> "For this profile it recommends the AI decision assistant, sixty-five out of a hundred, estimated at fifteen to thirty hours."

> ⚠️ **分数随所选答案变化**。录制前先跑一遍，用真实分数替换这句。
> 参考值：AI-Agent 画像 = 65/100；Docker 画像 = 73/100（本地 AI Agent 托管工具包）；零基础画像 = 48/100。

---

## 【镜头 3】Feature B — 46 天计划 — ⏱ 1:00–1:30

`[画面] 点「46天计划」标签页。滚动展示 5 个阶段。]`

**旁白（34 词 ≈ 15 秒）：**

> "Then a phased plan. Five stages, from eligibility checks on day one to final submission. Each task says why it matters and roughly how long it takes."

`[画面] 滚动到「阶段 3 · 留存与社区」，停留。鼠标划过任务项。]`

**旁白（26 词 ≈ 11 秒）：**

> "Stage three is the one people skip: retention and community. That's where the seventy-five percent is decided. Design a reason for users to come back a second time."

`[画面] 勾选任意一个任务。进度环立刻动（0% → 7%，因为共 15 项任务），阶段提示文字同步变化。]`

**旁白（14 词 ≈ 6 秒）：**

> "Check it off. Progress saves instantly, even before you sign in."

---

## 【镜头 4】Feature C — 每日打卡 + 报告库 — ⏱ 1:30–1:50

`[画面] 回到「作战台」，点「今日打卡 ✓」。打卡成功提示。]`

**旁白（19 词 ≈ 8 秒）：**

> "A daily check-in builds a streak. This is the retention hook — small, but it's what brings people back."

`[画面] 点「报告库」标签页。展开「奖金结构与真实价值」和「交叉验证与矛盾对齐」。]`

**旁白（22 词 ≈ 9 秒）：**

> "And a research library with every conclusion cross-checked against official sources, each with a confidence rating — including where sources disagreed."

---

## 【镜头 5】Who it's for + 解决什么问题 — ⏱ 1:50–2:25

`[画面] 回到作战台全景。]`

**旁白（33 词 ≈ 14 秒）：**

> "So who is this for? Solo developers and small teams entering Pi Next — the people deciding what to build, and worried about finishing.
>
> The problem it solves is a decision problem, not a coding problem. Five cross-verified research modules, distilled into a ranked answer and a day-by-day plan."

---

## 【镜头 6】How Pi is part of it — ⏱ 2:25–2:45 ⭐ 关键段

`[画面] ⚠️ 切到手机真机 Pi Browser，打开 pi_url。点右上角「用 Pi 登录」。]`

**旁白（27 词 ≈ 12 秒）：**

> "Pi is how you sign in. No new account, no email, no password — your Pi identity is your account."

`[画面] Pi 授权弹窗 → 批准。回到 App，右上角显示 @username，提示变为「已登录 · 进度云同步」。]`

**旁白（20 词 ≈ 9 秒）：**

> "Sign in once and your progress syncs to your Pi account across devices."

`[画面] 切回浏览器，指向页脚的 "Pi Sign-in · PiNet compatible"。]`

**旁白（11 词 ≈ 5 秒）：**

> "And it runs inside PiNet — reachable from a normal browser too."

---

## 【镜头 7】收尾 — ⏱ 2:45–2:52

`[画面] 定格在作战台全景，四个标签页可见。]`

**旁白（19 词 ≈ 8 秒）：**

> "Next Edge. Pick the right topic, then finish it. Built for Pi Next, on Pi. Thank you."

`[画面] 淡出到片尾卡：App 名 / pi_url / 团队名 / GitHub 链接]`

---

# 📊 时长核算

| 段 | 内容 | 时长 | 累计 |
|---|---|---|---|
| 0 | 标题卡 | 6s | 0:06 |
| 1 | 是什么 + 数据 | 19s | 0:25 |
| 2 | 选题匹配器 | 35s | 1:00 |
| 3 | 46 天计划 | 30s | 1:30 |
| 4 | 打卡 + 报告库 | 20s | 1:50 |
| 5 | 目标用户 + 痛点 | 35s | 2:25 |
| 6 | Pi 登录 + PiNet | 20s | 2:45 |
| 7 | 收尾 | 7s | **2:52** |

✅ **2 分 52 秒 < 3 分钟**，余量 8 秒（念快了会到 2:40，念慢了别超）。

---

# ⚠️ 录制前必须核对的事实（防止说错被扣分）

| 说法 | 正确值 | 来源 |
|---|---|---|
| 奖金池 | **200,000 USDT**（20 万） | 官方 hackathon 页 |
| 评委奖 | 5 万 USDT（1st 2.5万 / 2nd 1.5万 / 3rd 1万） | 官方 |
| 社区参与奖 | **15 万 USDT**，最多 2 队 | 官方 |
| 社区奖占现金奖池 | **75%** | 15/20 |
| 截止 | **2027-01-05 23:59 PST**（= 1/6 07:59 UTC） | 官方 |
| 最多提交 | **3 个 App**（主网 App 或 SoloHost） | 官方 |
| Pi 生态规模 | 60M+ Engaged Users / 420,000+ Nodes | 官方 |
| 报名要求 | **每个队员都要注册** | 官方 |
| 提交人 | 每队**只有一名**队员提交 | 官方 |

❌ **不要说的**：
- 不要说「46 天后截止」—— 那是计划的跨度，截止日是 **1 月 5 日**
- 不要说「Pi 币奖金」—— 现金奖是 **USDT**，2000 万 Pi 是**营销激励**，且 Pi 现价约 $0.058，不可当收益算
- 不要承诺具体获奖概率

### ⚠️ 「46 天计划」标签要说清楚

界面上那个标签写的是「**46天计划**」—— 这是**计划的跨度名称**（从报名日 11/19 起算到 1/5 截止），
不是「今天还剩 46 天」。实际剩余天数以 hero 区的**动态倒计时**为准（逐日递减，录制当天约 40 天）。

两种处理方式：
- **A（推荐）**：旁白说 "a phased plan from eligibility to submission" —— 不提具体天数（本稿第 3 段已这样写）
- **B**：加一句 "forty-six days from sign-up to deadline" —— 明确是「从报名起算」

❌ **绝对不要说**："46 days left" / "46 天后截止" —— 那个数字会错。

---

# 🛡 保险方案（万一真机 Pi Browser 演示失败）

真机登录是**唯一有风险的环节**（网络、二维码、KYC 状态都可能掉链子）。准备一个兜底：

**方案 A（首选）**：提前录好 Pi 登录成功的 8 秒片段，剪辑时插入

**方案 B（无需真机）**：在浏览器里打开 App，此时登录按钮会显示「在 Pi Browser 中登录」（这是**正常状态**，说明 SDK 正确加载了）：

> "Outside Pi Browser, sign-in is intentionally unavailable — the app knows it's not inside Pi Browser yet."

这句**反而是加分项**：证明 App 正确检测了运行环境。

**方案 C（备选）**：只演示「已登录」状态 —— 提前用小号登录过一次，录屏时直接展示右上角的 @username 和「已登录 · 进度云同步」。

> 💡 关键：第 5 项要求是 **"how Pi is part of the experience"**。
> 即使真机失败，也必须讲到 Pi 登录这件事 —— 哪怕是「按钮在非 Pi Browser 环境下的正确降级」也是证据。

---

# 🎨 后期字幕（建议全部加上，评委多半静音看）

| 时间码 | 字幕 |
|---|---|
| 0:00 | Next Edge — A war room for Pi Next participants |
| 0:12 | $200K prize pool · 75% goes to engagement, not code |
| 0:30 | 5 questions → your best-fit topic, scored locally |
| 1:05 | 5 stages · from eligibility to submission |
| 1:38 | Daily check-in = the retention hook |
| 1:55 | For solo devs deciding what to build |
| 2:28 | Sign in with Pi. No email, no password. |
| 2:45 | Pick the right topic. Then finish it. |

### 🌐 中文界面 + 英文旁白：字幕桥接策略

界面是中文、旁白是英文时，字幕要承担**双语桥接**。做法：

1. **屏幕中文字幕照搬**（保持界面真实）
2. **英文口播单独一层字幕**（在画面下方第二行，或替换中文行）
3. **关键界面元素加英文标注**（后期加箭头 + 英文标签）

举例（镜头 2）：

```
画面元素：  选题匹配  |  你的主力技术栈是？  |  全栈 / Web 开发
后期标注：  ← Topic Matcher        ← Your main tech stack?      ← Full-stack / Web
```

**最少要标注 8 处**（覆盖所有核心功能点）：

| 时间码 | 标注位置 | 英文标注 |
|---|---|---|
| 0:06 | 4 个标签页 | War Room / Topic Matcher / 46-Day Plan / Research Library |
| 0:30 | 5 道题 | 5 questions about your stack, time, assets, goal, audience |
| 0:45 | 结果区标题 | **Top Pick for You** + score |
| 1:05 | 5 个阶段标题 | Stage 0–4: Eligibility → Topic → Compliance → Retention → Submit |
| 1:32 | 打卡按钮 | **Daily Check-in** |
| 1:40 | 报告库 | Research Library · cross-verified, confidence-rated |
| 2:28 | 登录按钮 | **Sign in with Pi** |
| 2:40 | 页脚 | Pi Sign-in · PiNet compatible |

> 💡 **加标注比全英化界面省 2–3 小时，且效果一样好** —— 评审要的是「看懂功能」，不是「界面是英文的」。
> 有余力的话再做英文化界面（翻译 index.html + app.js 的文案即可，逻辑不动）。

---

# ✅ 提交前 checklist

- [ ] 视频 **≤ 3 分钟**
- [ ] **英文**旁白
- [ ] 已**公开**发布（YouTube / Vimeo / B站英文频道等），设为公开可访问
- [ ] 5 件事全部覆盖（对照文首表格）
- [ ] **App 能打开**（Pi Browser + 普通浏览器都能打开 pi_url）
- [ ] **App 名英文**、Logo 合规、英文描述、预览图、隐私政策 —— 官方要求逐项
- [ ] **集成 PiNet** ✅
- [ ] 团队成员**全部注册** Pi Next
- [ ] 只由**一名**队员提交，填入 **SoloHost App ID**（作战台 + Studio 各一次）
- [ ] 提交后**截图存档**（提交回执页）

---

# 📎 附：中文版旁白（仅供你理解，不用于录音）

| 时间码 | 中文 |
|---|---|
| 0:06 | 这是 Next Edge —— 给 Pi Next 参赛者用的作战台，做成了原生 Pi App。 |
| 0:12 | 20 万 USDT 奖池，但 **75% 的现金奖给社区参与** —— 真实用户、留存、传播。不是给代码写得更好的。 |
| 0:25 | 先看选题匹配器。5 道题问你的技术栈、时间、现有资产、想冲哪个奖。 |
| 0:40 | 本地给 5 个候选选题打分，**答案不出你的浏览器**。 |
| 1:00 | 46 天计划，5 个阶段，从第一天的资格确认到最终提交，每项都写清楚为什么重要、大概要多久。 |
| 1:12 | 第三阶段是留存与社区 —— **75% 的钱在这里决定**。要设计让用户回来第二次的理由。 |
| 1:32 | 打卡后进度立刻保存，登录之前也能存。 |
| 1:38 | 报告库里每个结论都交叉验证过，还标了置信度，包括来源打架的地方。 |
| 1:50 | 目标用户：参加 Pi Next 的独立开发者和小团队 —— 正在纠结做什么、担心做不完的人。 |
| 2:05 | 它解决的是**决策问题，不是编码问题**。5 个交叉验证的研究模块，浓缩成一个排序答案和一份逐日计划。 |
| 2:25 | Pi 是登录方式 —— 不要新账号、不要邮箱、不要密码，Pi 身份就是你的账号。 |
| 2:36 | 登录一次，进度就跟着你的 Pi 账号跨设备同步。 |
| 2:42 | 而且能在 PiNet 里跑，普通浏览器也打得开。 |
| 2:45 | Next Edge，选对方向，然后做完它。为 Pi Next 而生，在 Pi 上运行。 |

---

## 📎 官方要求原文对照（存档用）

> **The video should cover:**
> - what your app is and what it does;
> - a walkthrough of its features and interface;
> - who the app is for;
> - the problem or need it addresses; and
> - how Pi is part of the experience, such as Pi Sign-in or Pi payments
>
> Post the video publicly on YouTube or another video platform, and include the link in
> the submission form. Keep it to 3 minutes or less.
>
> — Pi Next Hackathon 官方页面

> **Submission:** Tuesday, January 5, 2027 11:59 PM PT (Wednesday, January 6, 2027 07:59 AM UTC)
> **Must submit:** app + demo video + team member list（每队仅一名队员提交）
> **每 App 还要有：** English name / 合规 Logo / accurate English description /
> preview images / PiNet integration / privacy policy
