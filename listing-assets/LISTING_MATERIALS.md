# Pi Next Report — Ecosystem Listing Materials

Ready-to-use copy for the Pi Developers `/listing` page and the MCP tools.
All fields avoid Pi trademark issues (no name/domain starting with "pi", no Pi logo/colors).

> **核对基准（2026-11-25）**：`developers.minepi.com/hackathon` 官方页 +
> `developers.minepi.com/docs/build-first-app/MainnetListing` 上架要求 +
> 多家媒体报道交叉验证。本目录所有字段已按官方原文复核。

---

## ⚠️ 官方提交要求速查（22 条规则里跟我们相关的）

| 项 | 官方要求 | 我们的状态 |
|---|---|---|
| App 数量 | 每队**最多 3 个**，必须是主网 Pi App 或 SoloHost App | ✅ 已建 1 个（Next Edge Report） |
| 提交人 | 一个 App 只由**一名队员**提交 | — 单人参赛，无需协调 |
| 报名 | 在 Developer Web Console 的 Hackathon 标签页注册；**所有队员各自注册** | ⬜ 待办 |
| 规则同意 | 报名须同意《Pi Next Hackathon 2026 Rules》22 条 | ⬜ 报名时勾选 |
| 年龄 | 报名时**年满 18 岁** | — |
| 关联排除 | 组织方及其母子公司的高管/员工/顾问/实习生/承包商/评委/推广机构及其直系亲属**不得参赛** | — |
| 账号 | 每人只能用一个账号；多账号 = 取消资格 + 永久封禁社区 | — |
| KYC | 开发者须完成 KYC | ⬜ 待办 |
| 英文要素 | 英文名称、英文描述、Logo（合规商标）、界面预览图、PiNet 集成、隐私政策 | ✅ 物料已备 |
| Demo 视频 | **≤3 分钟、必须公开**（YouTube 等），讲清 5 件事 | ⬜ 待录 |
| 视频 5 件事 | ①这是什么 ②界面与功能 ③目标用户 ④解决什么问题 ⑤Pi 如何参与（Pi 登录/支付） | — |
| 提交方式 | Developer Web Console 提交表 + Pi Developer Console 提交最终 App | ⬜ 待办 |
| 中期提交 | 可选（邮件通知日期），拿早期反馈与曝光 | ⬜ 建议做 |
| 最终截止 | 2027-01-05 23:59 PST = 2027-01-06 07:59 UTC = **北京时间 1/6 15:59** | ⏰ |
| 原创性 | 须原创；不得含第三方 IP；须声明非工作时间完成、不受雇主合同约束 | ⬜ 声明时勾选 |
| 获奖后义务 | 奖金以 USDT 发放，不提供法币/非加密货币奖金 | — |
| 上架合规 | 完整可用 + 专业 UI；仅 Pi 登录；仅 Pi 交易；不外链跳转；不超量采集数据 | ✅ 架构已符合 |

**两条容易漏的**：
1. **Demo 视频必须公开可见**，不是私下给评委 —— 要发到 YouTube 等公开平台
2. **Demo 视频必须讲 Pi 怎么参与** —— 我们 App 走 Pi 登录 + PiNet 同步，视频里要明确演示这一点

---

## Basic listing fields

| Field | Value |
|---|---|
| App name (English) | **Next Edge Report** |
| Subtitle | The Pi Next hackathon, decoded into one clear action plan |
| Category | **Tools / Productivity** (pick the closest available in console) |
| Language | **English** |
| App URL type | Mainnet app (Pi Browser) + PiNet subdomain |
| Privacy policy URL | `/privacy.html` (already in `public/`) |
| Team members | 提交表里列出全部队员（每人须各自注册） |
| Demo video | 待录（≤3 min，公开） |

### Description (English, paste into listing description)

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

Built for the Pi ecosystem: Pi sign-in and PiNet compatible. Browse freely; sign in to sync.
```

### Why this version is a stronger hackathon entry

The earlier build was a static report — a one-time read with no reason to return. Judges look at
"whether users come back," and 75% of cash is tied to engagement and retention. This version is a
tool with three return hooks (matcher results, plan progress, daily streak), which directly
targets the criteria that decide the money.

---

## Logo prompt (for `prepare_app_logo_upload`)

When the MCP tool `prepare_app_logo_upload` returns a `logo_prompt` and `requirements`, adapt to them. If it asks us to generate from our own prompt, use:

```
A clean, modern app icon for a research and insights application. A rounded-square tile
with a smooth diagonal gradient from teal (#0D9488) to indigo (#374BB5). Centered: a white
document card with four short horizontal indigo lines representing text, and a bold amber
(#F59E0B) upward trending arrow rising across the lower-right of the card. Flat vector
style, no text, no letters, high contrast, centered composition, 1024x1024. Do NOT use
the Pi Network logo, the Greek letter pi, or a blue-and-white color scheme.
```

**Local file already generated**: `listing-assets/logo-1024.png` (1024×1024 PNG, verified).
If `prepare_app_logo_upload` accepts our file directly, upload this one. If it mandates
generation from `logo_prompt`, use the prompt above with an image tool.

---

## Preview screenshots checklist

Pi listing asks for screenshots. **已生成 5 张现成截图** → `listing-assets/screenshots/`

| # | Screen | File | What it shows |
|---|---|---|---|
| 1 | Dashboard | `01-dashboard.png` | Hero + completion ring + three stat cards (streak / top topic / days left) + daily check-in card with 7-day dot row |
| 2 | Matcher (form) | `02-topic-matcher.png` | The 5-question weighted form with all option buttons |
| 3 | 46-day plan | `03-46day-plan.png` | 4 phases (D0 门槛确认 / D1 选题 / D2 冲刺 / D3 提交), 16 checkable tasks with sub-labels |
| 4 | Research library | `04-report-library-expanded.png` | Expanded: prize breakdown table, hard-gate checklist with confidence badges, expected-value table, red-line list |
| 5 | **Matcher result** | `05-matcher-result.png` | 答完 5 题的**差异化评分结果**（69 / 67 / 63 三档 + 已选选项高亮）—— 最能体现"个性化"卖点，优先用这张做封面 |

重新生成（改完前端后跑）：

```bash
node listing-assets/make_screenshots.mjs
```

> 实现说明：脚本不启服务器 —— WorkBuddy 沙箱隔离跨进程 localhost socket。
> 它直接调用 `server.js` 的 handler 渲染 HTML，写入临时目录后用
> `file://` 协议交给 Chrome headless 截图，绕开 socket。
> - 报告库那张会自动展开所有 `<details>`，否则折叠态看不出实质内容
> - 结果态那张会往 localStorage 注入一份预置画像（tech=ai / time=40_100 /
>   asset=[agent,content] / goal=community / pi=yes），让引擎跑出真实差异化评分
> - ⚠️ 预置答案的选项值必须严格取自 `public/app.js` 的 `QUESTIONS` 定义
>   （`tech: ai|fullstack|docker|nocode`、`time: lt10|10_40|40_100|gt100`、
>   `goal: judge|community|learn`、`pi: yes|no`、
>   `asset: docker_img|agent|content|node|audience|none`），
>   写错会导致全部匹配不到、三个选题都是基础分 25

**上架时还需补 1 张**（需 Pi Browser 或移动视口实拍）：

| # | Screen | 说明 |
|---|---|---|
| 6 | Signed-in state | 登录后进度同步成功的状态 —— 证明 Pi 登录链路真的通了 |

Tip: capture in Pi Browser (or a 390×844 mobile viewport) so reviewers see the real environment. English UI recommended for listing screenshots; the app content can remain bilingual.

---

## `validation-key.txt` deployment template

When `verify_app_url_ownership` returns a `validation_key`, serve it at the app's public HTTPS root:

**Option A — static file** (easiest for a deployed frontend):
1. Create `public/validation-key.txt` whose body is **exactly** the key (plain text, no newline, no quotes).
2. Redeploy the site.
3. Retry `verify_app_url_ownership`.

**Option B — dynamic route** (add to `server.js` before static serving, if we don't want to commit the key):

```javascript
// TEMPORARY: remove after verification succeeds.
// The key comes from an env var so it is never committed to source control.
app.get("/validation-key.txt", (req, res) => {
  res.type("text/plain").send(process.env.PI_VALIDATION_KEY || "");
});
```

Then set `PI_VALIDATION_KEY` in the server environment, restart, retry verification, and delete the route.

**Security**: never log or commit the `validation_key`. It is returned only by `verify_app_url_ownership`.

---

## App naming rationale

- "Next Edge Report" avoids the `pi` prefix (Mainnet Listing rule: domain/name must not start with "pi" or misuse Pi branding).
- Colors (teal/indigo/amber) are distinct from Pi's official blue/white identity.
- The icon contains no Pi logo, no π symbol, no Pi colors.

---

## Status

Ready to use the moment Pi OAuth works and `create_app` returns an App ID.
No Pi tools are required to prepare these materials.
