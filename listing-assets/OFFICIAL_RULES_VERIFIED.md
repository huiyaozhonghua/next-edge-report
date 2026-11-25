# Pi Next 官方规则核对（从 developers.minepi.com 的 JS bundle 提取的原文）

> **提取方式**：页面是 SPA，HTML 只有 866 字节壳。正文在
> `https://developers.minepi.com/assets/index-D3vXiSUx.js`（1.85 MB）里，
> 规则以 React JSX 节点形式内联。本文是从该 bundle 里**逐条抠出来的原文**，
> 不是二手摘要。
>
> **核对时间**：2026-11-25

---

## ⚠️ 本文修正了之前物料里的 3 处不准确

| # | 之前的说法 | 官方原文 | 修正 |
|---|---|---|---|
| 1 | 「每队**只有一名**队员提交」 | 规则 10：*"the Organizer has determined that there is **no limit to the team size**"*；提交环节：*"**Only one team member should submit each app**"* | 提交动作是一人制 ✅ 但**团队人数无上限**，我之前把它混为一谈了 |
| 2 | 「每队最多 3 个 App」当硬限制 | 报名页：*"**Up to 3 apps** — Mainnet Pi apps and SoloHost apps"* | 这是**提交上限**（每队最多交 3 个），不是"每队只能有 3 个" ✅ 表述需精确 |
| 3 | 「上架必须审核通过才能参赛」 | 提交流程：*"For a Mainnet app, submit its listing for review — **it does not have to be approved yet**"* | ❌ **不需要等审核通过** —— 提交审核即可参赛 |

第 3 条**解除了一个关键顾虑**：我们不用等 Pi 审核通过就能提交参赛。

---

## 22 条规则标题（完整清单）

```
 1. Introduction                    12. Ethics and Code of Conduct
 2. Definitions                    13. Data and Resources
 3. Eligibility                    14. Rules for using Data and Resources
 4. Dates                          15. Confidential Information Sharing
 5. Deadlines and Rules             16. Intellectual Property (IP) Rights
 6. Hackathon App                  17. Prizes, Cryptocurrency Rewards,
 7. Single Account Only                 Winning Team Feature and Hosting
 8. Data Collection                18. Winner's Obligations
 9. Teams                          19. Disqualification
10. Team Size                      20. Warranties and Obligations
11. Submissions                    21. Limitation of Liability
                                   22. Reservation of Rights
```

---

## 与我们直接相关的规则原文

### 规则 3 · Eligibility（节选）

> "The Pi Next hackathon will officially begin on **November 19, 2026**, and will conclude on
> **January 5, 2027**. To be considered for winner selection, You must **register for the Pi Next
> hackathon and submit your app** by Tuesday, January 5, 2027 23:59 PT
> (Wednesday, January 6, 2027 07:59 UTC). The Organizer reserves the sole and absolute
> discretion to determine the Pi Next hackathon winner, or to determine that there is **no
> winner**."

📌 **"or to determine that there is no winner"** —— 官方保留"可以无人获奖"的裁量权。
诚实评估期望值时该记住这点。

### 规则 9 · Teams

> "A Participant may either participate in their individual capacity or collaborate with more than
> one Participant to form a team. **Each team member must be a single individual with a single,
> active Organizer account. Each team member must register individually** for the Pi Next
> hackathon before joining a team."

📌 每个队员：**一个自然人 + 一个账号 + 各自注册**。

### 规则 10 · Team Size

> "For the purpose of the Pi Next hackathon, the Organizer has determined that there is
> **no limit to the team size**."

📌 团队人数无上限。

### 规则 11 · Submissions（节选）

> "Submissions may include ideas, prototypes, and applications. **All submissions that the
> Participants make must be original and unique.** All submissions must be made on or before the
> applicable Submission Deadline and must meet all the guidelines defined for this purpose."

📌 **原创且唯一** —— 我们的代码是原创的 ✅

### 规则 17 · Prizes（节选）

> "The winning teams of Pi Next hackathon 2026 are eligible to receive the following prizes
> in **USDT** for a total prize pool of **200,000 USDT**:
> - **Judges' Pick** — total pool of **50,000 USDT**: 1st place **25,000 USDT**, 2nd place
>   **15,000 USDT**, 3rd place **10,000 USDT**
> - **Community Engagement Awards** — ..."

📌 奖金是 **USDT**（不是 Pi）✅ 与我们页面里的表述一致。

---

## 🎯 官方提交流程（关键 —— 从 bundle 提取的 UI 文案）

### 第一步：报名
> "Confirm your contact details, review the rules, and join the hackathon.
> **No app is required to register.**"

📌 报名**不需要**有 App —— 先报名，App 后面再交。

### 第二步：填表
> "Create a new Pi app, select an existing Mainnet app, or add a Solohost app by its app ID.
> For a Mainnet app, **submit its listing for review — it does not have to be approved yet.**
> Add a link to your demo video, then submit the app to Pi Next before [deadline].
> **You can replace the link or withdraw at any time until the deadline.**"

📌 三个关键点：
1. 可以**选已有的 Mainnet App**（不用新建）—— 我们的 `6b0672d68f5d0b3dd1cbb3d9` 直接选
2. **上架审核不通过也能参赛**（"does not have to be approved yet"）
3. **视频链接可以随时替换**，截止前也能撤回 —— 所以先交占位，后面补真视频也行

### 第三步：登记 App
> "**Registering alone doesn't enter your app.** Each app still has to be entered under
> 'Your Pi Next apps' below, with its final submission completed before [deadline]."

📌 **报名 ≠ 参赛**。必须再到 "Your Pi Next apps" 里把 App 正式登记进去。

---

## 🔍 表单校验逻辑（从 bundle 提取）

提交表单的**实时校验项**：

| 校验 | 提示原文 |
|---|---|
| App 未部署 | `"App not deployed"` |
| 域名未验证 | `"Domain not verified"` |
| 上架未提交 | `"Mainnet listing not submitted for review"` |
| 视频缺失 | `"Demo video missing"` |
| App 被封禁/下架 | `"App is blocked or delisted"` |
| 视频链接格式 | `"Enter a valid https:// link to your demo video."` |

视频链接的合法性判定（源码逻辑）：
```js
const zU = e => {
  try {
    const t = new URL(e);
    return t.protocol === "https:" && !t.username && !t.password && t.hostname.includes(".");
  } catch { return false; }
};
```
→ **必须是 `https://`、不能带用户名密码、域名必须含点**。
→ YouTube 链接 ✅（`https://www.youtube.com/watch?v=...`）

**视频链接可选的发布渠道**（bundle 里的选项列表）：
```
X / YouTube / Ecosystem Summit / Facebook / Instagram / Telegram /
Mine Pi app / Email from Pi / Friend or teammate
```

📌 **YouTube 在官方列表里** —— 我们的计划正确。

---

## ✅ 我们的状态对照

| 表单校验项 | 我们的状态 |
|---|---|
| App not deployed | ✅ 已部署（`next-edge-report.pages.dev`） |
| Domain not verified | ✅ 已通过（`validate_domain: true`） |
| Mainnet listing not submitted for review | ⬜ **待做 —— 去 listing 页提交审核** |
| Demo video missing | ⬜ **待做 —— 录 ≤3 分钟英文视频** |
| App is blocked or delisted | ✅ 无 |
| 视频链接是 https | ✅ YouTube 链接满足 |

---

## 📌 官方原文（存档用）

> **The video should cover:**
> - what your app is and what it does;
> - a walkthrough of its features and interface;
> - who the app is for;
> - the problem or need it addresses; and
> - how Pi is part of the experience, such as Pi Sign-in or Pi payments
>
> Post the video publicly on YouTube or another video platform, and include the link in
> the submission form. Keep it to **3 minutes or less**.
>
> — Pi Next Hackathon 官方页面
