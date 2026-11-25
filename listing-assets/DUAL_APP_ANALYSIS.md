# 双 App 参赛可行性分析

> 分析时间：2026-11-25
> 问题：能否把 `Pi_Next_个人搞钱报告.html`（原始报告）和 `pi-next-app`（作战台）
> 作为两个 App 分别提交 Pi Next？

## 一句话结论

**不能。而且第二个 App 不是"规则风险"，是根本不成立 —— 它既过不了主网上架硬门槛，
也和第一个 App 构成同源克隆关系，两头都不占。**

---

## 一、官方规则依据

### 1.1 「最多 3 个 App」的官方原文

`developers.minepi.com/hackathon` 官方页：

> WHAT TO SUBMIT
> Up to 3 apps
> Mainnet Pi apps and SoloHost apps

即：**上限是 3 个，不是"必须 3 个"**，且两个类型是 **Pi App 或 SoloHost App** 二选一/并列，
不是「报告页也算一个 App」。

### 1.2 关键限制条款

来自官方 22 条 Rules 的媒体逐条转述（OrbitWatch / Bitrue / KuCoin 多源一致）：

> Each team may submit a maximum of 3 applications, which must be **Mainnet Pi Apps or SoloHost Apps**.

以及历届黑客松沿用的资格条款（百亿财经转述官方要求）：

> **每个应用需要独特的用例，不能是现有应用的克隆。**
> 应用必须部署在沙盒之外的测试网上，并具备**基本可用的界面**。

以及 22 条 Rules 原文转述：

> **Previously winning projects cannot be re-submitted as the same project**,
> but new and substantially different projects may be submitted.

### 1.3 Mainnet 上架硬门槛（`developers.minepi.com/docs/build-first-app/MainnetListing`）

| 要求 | 原文要点 |
|---|---|
| Deliver a Fully Functional App | "must be fully operational"，所有交互元素须正常工作 |
| Complete KYC Verification | 开发者须完成 KYC |
| Avoid Trademark Violations | URL/域名不得以 "pi" 开头，不得误用 Pi 品牌 |
| Use Only Pi Authentication | **必须集成 Pi Authentication SDK**，禁止邮箱/第三方登录 |
| Pi-Only Transactions | 全部交易以 Pi 结算 |
| Avoid Redirection to External Sites | 不应把用户导向站外 |
| Limit Data Collection | 仅收集功能必需数据 |

---

## 二、实测：原始报告过不了上架门槛

对 `Pi_Next_个人搞钱报告.html` 逐条实测（25,170 字节，单文件）：

| Mainnet 要求 | 实测结果 | 判定 |
|---|---|---|
| Fully Functional App + 专业 UI | **交互元素 0 个**（0 个 button / input / select / form） | ❌ 不满足 |
| Use Only Pi Authentication | **Pi SDK 引用 0 处**（无 `sdk.minepi.com`、无 `Pi.init`、无 `Pi.authenticate`） | ❌ 不满足 |
| Avoid Redirection to External Sites | 外链 0 个 | ✅ 满足（但因为它压根不能交互） |
| Limit Data Collection | 采集表单 0 个 | ✅ 满足（同上） |
| Logo | 无独立 Logo（且无 Pi SDK 无法走 `set_app_logo` 流程） | ❌ 不满足 |
| 隐私政策 URL | 无独立可访问页面 | ❌ 不满足 |

**补充**：原始报告是**纯静态页、0 行 JavaScript**。它连"可交互应用"都算不上，
更不用说"app"。主网上架要求的是 App，不是文档。

---

## 三、实测：两个 App 是同源克隆

### 3.1 体量对比

| 维度 | 原始报告 | 作战台 |
|---|---|---|
| 主体积 | 25,170 B（单文件） | index.html 17,059 B + app.js 17,544 B + en.html 7,397 B |
| JavaScript 逻辑 | **0 处** | **50 处**（function / 箭头函数 / 事件监听） |
| 交互元素 | 0 | 9 button + 5 details + 3 table |
| Pi SDK | 无 | 有（`sandbox:false` 主网 + `Pi.authenticate`） |
| 后端 | 无 | 零依赖 Node 服务，token 校验 + 进度同步 |

### 3.2 关键数据点逐个重叠

对两个文件做关键词计数：

```
关键词              原始报告   作战台
215                  4        1
75,000               3        1
17.1                 2        2
2.99                 2        1
0.058                1        1
200,000 / 20万       2        2
2027-01-05           2        1
SoloHost             9        4
矛盾对齐             3        1
```

**所有关键研究数据点在两个文件里都出现。**

### 3.3 结构关系

原始报告的 4 个章节：
> 奖金结构解剖 / 参赛硬门槛（不达标直接出局）/ 风险分级 / 三个低边际成本的选题方向

作战台「报告库」标签页的 5 个折叠区：
> 一句话结论 / 奖金结构与真实价值 / 交叉验证与矛盾对齐 / 期望值测算 / 硬门槛与安全红线

**一一对应。** 作战台的「报告库」就是原始报告的改写版。

**结论：这是同一份调研的两个呈现壳，不是两个独立项目。**
提交两个 = 官方明令禁止的「clone of an existing app」。

---

## 四、为什么"多投一个"这个想法本身是错的

即使规则允许（不允许），策略上也不成立：

| 维度 | 情况 |
|---|---|
| 评审视角 | 同一团队提交两个高度相似的 App，评委会认为**缺乏原创性**——而"原创性/独特性"正是 6 条评审标准之一 |
| 精力稀释 | 距截止 43 天，要做的是部署 + 域名验证 + Demo 视频 + 上架提交。摊到两个 App 上，两个都做不好 |
| 社区参与奖看的是**真实参与度** | 43 天内把两个 App 各做出真实用户数据不现实；社区奖占 75% 现金却需要真实流量 |
| 关系风险 | 若被判定克隆，可能影响**整个团队**的参赛资格（Rules 明确：多账号 = 取消资格 + 永久封禁社区） |

---

## 五、真正该用的那 3 个名额

官方给的是 3 个名额，正确用法是**投 3 个真正不同的东西**，而不是同一份内容拆成 3 份。

### 5.1 首选：把 5 个选题变成 3 个独立 App

作战台里已经有 5 个被完整评估过的选题，且**每个选题的技术栈、目标用户、变现路径都不同**：

| # | 选题 | 技术栈 | 目标用户 | 独立 App 可行性 |
|---|---|---|---|---|
| 1 | **AI 选题决策助手（SoloHost 版）** | AI Agent / 本地模型 | 所有参赛者 | ⭐⭐⭐ 与作战台高度相关但可做成「独立单功能产品」——去掉进度追踪只保留评分 |
| 2 | **本地 AI Agent 托管工具包** | Docker / SoloHost | Pi Desktop 42万节点用户 | ⭐⭐⭐ 赛道官方主推、竞争者少、边际成本低 |
| 3 | **中文创作者效率工具** | FFmpeg / 本地 TTS | 内容创作者 | ⭐⭐⭐ 技术资产最完整 |
| 4 | Pi 生态任务撮合（DataLab） | 全栈 | 企业 + KYC 劳动力 | ⭐⭐ 高风险高回报 |
| 5 | 隐私优先匿名社交 | 全栈 | 泛社交用户 | ⭐ 竞争拥挤，不推荐 |

**建议组合（3 个名额）：**

- **名额 1 —— 作战台本体（Next Edge Report）**
  已建好 App ID，定位「参赛者决策 + 进度追踪工具」，
  打**评委奖**（技术完成度 + 创新性 + UI/UX）+ **社区参与奖**（有打卡/进度/匹配结果三个留存钩子）

- **名额 2 —— 本地 AI Agent 托管工具包（SoloHost 版）**
  走 SoloHost 渠道，打**评委奖**（官方主推赛道、42 万节点分发优势）。
  **与作战台零重叠**：不同技术栈、不同用户、不同分发渠道。
  边际成本最低——你已有 Docker 打包能力。

- **名额 3 —— 中文创作者效率工具**
  打**社区参与奖**（内容创作者群体本身活跃、传播性强）。
  技术资产（FFmpeg + 本地 TTS 全链路）现成。

> ⚠️ **重要**：如果只有一个人参赛，**每个 App 都需要自己的 Demo 视频**（≤3 分钟）。
> 3 个 App = 3 个视频 = 3 倍工作量。以 43 天的余量，
> **强烈建议先投 1 个（作战台），做扎实，再看精力决定要不要加第 2 个。**

### 5.2 什么绝对不能做

- ❌ 把原始报告当第 2 个 App 提交（0 交互、0 Pi SDK、克隆）
- ❌ 把作战台的 4 个标签页拆成 4 个 App（同一份调研 = 克隆）
- ❌ 同一份代码换皮（换个名字/配色）= 克隆

---

## 六、建议的下一步

| 优先级 | 动作 | 说明 |
|---|---|---|
| P0 | **完成作战台的部署 → 域名验证 → Demo 视频 → 提交** | 这是唯一确定能拿分的路径。缺 Demo 视频就等于没提交 |
| P0 | 报名 Pi Next（Hackathon 标签页）+ 确认 KYC | 0 或 1 的门槛，不做直接出局 |
| P1 | 录 3 分钟 Demo 视频（公开，5 项内容） | 必须演示 Pi 登录 |
| P2 | 评估 SoloHost 选题是否值得投第 2 个 | 你已有 Docker 资产，边际成本最低 |
| — | ~~注册原始报告为第 2 个 App~~ | ❌ 放弃这个想法 |

---

## 附：证据可复现

```bash
# 原始报告的交互/SDK 实测
grep -ciE "<button|<input|<select|<form" "G:/WORKBUDDY/2026-11-20-09-48-20/Pi_Next_个人搞钱报告.html"   # 0
grep -ci "sdk.minepi\|Pi.authenticate" "G:/WORKBUDDY/2026-11-20-09-48-20/Pi_Next_个人搞钱报告.html"     # 0

# 作战台的逻辑量
grep -cE "function |=>|addEventListener" pi-next-app/public/app.js   # 50
```

## 官方来源

- `https://developers.minepi.com/hackathon`（报名页，官方）
- `https://developers.minepi.com/docs/build-first-app/MainnetListing`（主网上架要求，官方）
- 22 条 Rules 转述：OrbitWatch / Bitrue / KuCoin / Coinfolytics / TokenPost（多家一致）
