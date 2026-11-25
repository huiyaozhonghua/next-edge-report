# YouTube 上架物料 —— Next Edge Demo

> 成片：`listing-assets/demo/next-edge-demo-v1.mp4`（95.6 秒 / 1920×1080 / 全英文）
> 缩略图：`listing-assets/demo/youtube-thumbnail.png`（1280×720，已生成）
>
> **官方要求**（提交时勾选）：≤3 分钟 ✅ ｜ **公开可见**（非"仅受邀者"）⬜ 需你设置

---

## 📌 标题（Title）

**主推**（74 字符，含搜索关键词）
```
Next Edge — Your Pi Next War Room: Topic Matcher, 46-Day Plan & Daily Streaks
```

**备选 A**（66 字符，价值主张更直白）
```
Next Edge: Pick the Right Pi Next Topic, Then Finish It in 46 Days
```

**备选 B**（61 字符，钩子最强）
```
75% of the Pi Next prize depends on engagement. So we built a war room.
```

> 💡 YouTube 标题上限 100 字符，**前 40 字符在手机上才完整显示** —— 主推版把品牌名和
> "Pi Next War Room" 放在最前，关键词在后。备选 B 适合 X/Telegram 二次分发。

---

## 📝 描述（Description）

> ⚠️ **已修正**：v1 曾把「标签（Tags）」段落误粘进描述框，且时间轴是旧版。
> **最终版已单独存好** → `listing-assets/demo/youtube-description-final.txt`
> （3239 字符 / 15 个时间戳 / 首个 0:00 / 严格递增 / 无标签污染）
>
> **用法**：打开那个 txt → 全选复制 → 粘贴到 YouTube 描述框。
> 下面保留的是同一份内容，方便对照。
>
> ⚠️ **v4 修正（最终版）**：章节按 YouTube 官方 4 条硬规则重排。
>
> | 规则 | 说明 |
> |---|---|
> | 1 | 第一个时间戳必须是 `0:00`（不能是 `0:01`）|
> | 2 | 至少 3 个章节 |
> | 3 | 严格递增 |
> | 4 | **每个章节至少 10 秒** ← 最容易踩 |
>
> **踩坑记录**：
> - v1：Timeline 在描述末尾（第 2652 字符）→ 不渲染
> - v2：移到开头但第 1 行是 `─── Timeline ───` 装饰符 → 仍不渲染
> - v3：`0:00` 在第 1 行，但 **15 个章节间隔全是 6–8 秒** → **违反规则 4**，整张列表被静默丢弃
> - **v4：合并成 7 个章节，间隔 12–19 秒，全部 ≥10 秒** ✅
>
> 💡 YouTube **不报错、不警告**，任何一条规则不满足就整个列表不显示。

复制以下全部内容，粘到 YouTube 描述框：

```

Next Edge is a war room for Pi Next participants — not just another report.

75% of the $200,000 USDT prize pool is awarded for real user engagement and retention,
not for writing better code. So we built a tool people come back to, with three return
hooks: a personalised topic match, a 46-day phased plan, and a daily check-in streak.

▸ Open the app: https://nextedgereportmv0511.pinet.com
▸ Source code: https://github.com/huiyaozhonghua/next-edge-report
▸ PiNet URL (works in any browser): https://nextedgereportmv0511.pinet.com

─── What this app does ───

1. TOPIC MATCHER — Answer 5 questions about your stack, your available hours and the
   assets you already own. A transparent weighted scoring engine ranks five candidate
   hackathon topics against your answers. Everything is computed locally in your browser,
   so nothing you answer is ever uploaded.

2. 46-DAY PLAN — Broken into 5 phases, from eligibility checks on day one to final
   submission. 15 concrete tasks, each with a stated reason and a time estimate. Tick one
   and progress saves instantly, even before you sign in.

3. DAILY CHECK-IN — A streak counter that gives you a reason to come back tomorrow.
   This is the retention hook that the Community Engagement Award actually rewards.

4. RESEARCH LIBRARY — Cross-verified findings with confidence ratings. Prize structure,
   submission rules, hard eligibility gates, expected-value estimates for each path, and
   the red lines you must not cross.

─── Who it is for ───

Solo developers and small teams entering Pi Next — the people deciding WHAT to build and
stressing about FINISHING it. This solves a decision problem, not a coding problem.

─── How Pi is part of the experience ───

• Pi Authentication is the only sign-in method. No email, no password, no third-party
  account. Your Pi identity is your account.
• Progress syncs to your Pi account after sign-in, so it follows you across devices.
• The app runs inside PiNet, so it is reachable from any browser — Chrome, Safari or
  Brave — not only from inside the Pi Browser app.
• The app is free and accepts no payments. No transactions are performed.

─── Technical notes ───

• Static frontend on Cloudflare Pages + a Pages Function for authenticated sync
• Progress stored in Cloudflare Workers KV, keyed by your server-verified Pi UID
• No email addresses or phone numbers collected. Identity data is used only to sign you
  in and to associate your own progress with your account.
• Built as an entry for the Pi Next hackathon. Research cross-checked against
  developers.minepi.com/hackathon and the Mainnet Listing Requirements.

Next Edge — pick the right topic, then finish it. Built for Pi Next, on Pi.
```

---

## 🏷️ 标签（Tags）

> ⚠️ **标签填进上方的「Tags」输入框，不要粘进描述框**（v1 就是这么翻车的）。

```
pi next hackathon,
pi network,
pi browser,
pinet,
pi app,
hackathon 2026,
build in public,
developer tools,
productivity app,
topic matcher,
hackathon planning,
solo developer,
solohost,
pi ecosystem,
pi sdk,
web3 app,
retention,
engagement,
```

> 💡 官方认可的发布渠道里有 **X / Telegram / Facebook / Instagram / Ecosystem Summit**。
> 标签只影响 YouTube 搜索，外部分发靠下面的文案。

---

## 📌 置顶评论（Pinned comment）

上传后立刻发这条（YouTube 前 3 小时互动权重高）：

```
Next Edge is live — try it here: https://nextedgereportmv0511.pinet.com

It's a Pi Native app: sign in with Pi, no email or password, and your progress syncs
across devices. Runs in any browser via PiNet.

If you're entering Pi Next, the topic matcher takes 60 seconds and tells you which of
five topics actually fits your skills and hours. That's the part most teams skip.

Open source: https://github.com/huiyaozhonghua/next-edge-report

#PiNext #PiNetwork #BuildInPublic #Hackathon
```

---

## 🔁 外部分发文案（X / Telegram / Facebook）

**X（≤280 字符）**
```
75% of the $200K Pi Next prize goes to engagement, not code.

So we built Next Edge: a topic matcher, a 46-day plan, and a daily streak for Pi Next
participants. Sign in with Pi — no email, no password.

https://nextedgereportmv0511.pinet.com
```

**Telegram / Discord（长版）**
```
🧭 Next Edge — a war room for Pi Next participants

75% of the $200,000 USDT prize pool is awarded for engagement and retention, not for
better code. Next Edge gives you three reasons to come back:

▸ Topic matcher — 5 questions, 5 ranked topics, scored locally in your browser
▸ 46-day plan — 5 phases, 15 tasks, every one with a time estimate
▸ Daily check-in — the retention hook the Community Award actually rewards

Plus a cross-verified research library: prize structure, hard gates, expected value per
path, and the red lines you must not cross.

Sign in with Pi — no email, no password. Runs in any browser via PiNet.

→ https://nextedgereportmv0511.pinet.com
→ Source: https://github.com/huiyaozhonghua/next-edge-report
```

---

## ⚙️ 上传设置

| 项 | 值 |
|---|---|
| Visibility | **Public** ← 官方要求公开可访问 |
| Category | Science & Technology |
| Language | English |
| Playlist | Pi Next Hackathon 2026 |
| End screen | 指向 pi_url 的卡片 |
| Cards | 0:20 → pi_url；1:40 → GitHub |
| Subtitles | 视频已烧英文硬字幕；**再上传一份 .srt 做多语言**（可选） |

---

## 📄 生成 SRT 字幕（可选但推荐）

硬字幕已经够用，但**外挂字幕让评委能搜索/跳段**，也是加分项：

**已生成**：`listing-assets/demo/next-edge-demo.srt`（15 条，时间轴精确到毫秒）

生成方式：不走 Whisper（会出错别字），而是直接量 `build/vo/*.wav` 的真实音频时长
+ 累加段落偏移，与硬字幕完全一致。

重生成：
```bash
python Temp/make_srt.py
```

上传到 YouTube 后，在「字幕」面板上传该 .srt 并设为 English。

---

## ✅ 上传后自查

- [ ] **无痕窗口能打开视频**（不是"仅受邀者可见"）
- [ ] 链接能被非登录用户访问
- [ ] 描述里的 pi_url 可点且能打开
- [ ] 缩略图在手机上看得清（下载页预览图试一下）
- [ ] 前 40 字符的标题完整
- [ ] 置顶评论已发

---

## 🔗 速查

| 用途 | 链接 |
|---|---|
| App（PiNet） | https://nextedgereportmv0511.pinet.com |
| 源站 | https://next-edge-report.pages.dev |
| GitHub | https://github.com/huiyaozhonghua/next-edge-report |
| 上架表单 | https://developers.minepi.com/devconsole/my-apps/6b0672d68f5d0b3dd1cbb3d9/listing |
| 隐私政策 | https://next-edge-report.pages.dev/privacy.html |
| 服务条款 | https://next-edge-report.pages.dev/terms.html |
