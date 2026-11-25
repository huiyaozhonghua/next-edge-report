# SoloHost 路线可行性评估

> 评估时间：2026-11-25
> 问题：把「本地 AI Agent 托管工具包」作为 SoloHost App 投 Pi Next 黑客松，可行吗？
> 结论：**可行，且是当前性价比最高的第二选择**（相对「再做一个 Pi App」）。

---

## 一句话结论

**技术链路已 100% 跑通、成本极低、风险可控**，但有两个必须正视的软肋：
**「42 万节点」是官方自报数据，不是真实活跃用户**；**SoloHost 路线不做公网部署，也就没有 Pi Browser 流量**。

**建议：作为第 2 个名额投，主攻评委奖（不是社区奖）。**

---

## 一、路线确认：SoloHost 确实是官方认可的独立赛道

官方两条参赛路径（多家媒体转述官方页一致）：

| | 路径一：标准 Pi App | 路径二：SoloHost App |
|---|---|---|
| 构建方式 | Developer Web Console | Pi Desktop → SoloHost 发布 |
| 提交方式 | `create_app` + 域名验证 + 上架 | **提交表里填 SoloHost App ID** |
| 分发 | Pi Browser + PiNet | Pi Desktop 420K+ 节点 |
| MCP 工具 | 13 个（create_app/update_app/…） | **无专用 MCP 工具**（走 Pi Desktop 图形流程） |
| 上架要求 | Mainnet Listing 全套 | SoloHost 发布规范（+ 同质量标准） |

> OrbitWatch 转述官方：「Submit in the console by the same deadline, **entering the SoloHost App ID**.」

### 关键差异（决定成本）

SoloHost 路线**不需要**：
- ❌ 公网 HTTPS 部署
- ❌ `update_app(frontend_url)`
- ❌ `verify_app_url_ownership` 域名验证
- ❌ `validation-key.txt`
- ❌ Mainnet 上架审核

**需要的**：
- ✅ 一个公开 Docker 镜像（已发布）
- ✅ 两个 YAML 文件（`docker-compose.yml` + `config_options.yml`）
- ✅ 通过官方 validator
- ✅ 在 Pi Desktop 里发布，拿到 **SoloHost App ID**
- ✅ 在开发者控制台提交表填入该 App ID

---

## 二、⭐ 决定性发现：你已经完整走通过一次

`G:\WORKBUDDY\2026-11-15-10-27-57\solohost-phase1\` 里躺着 **11-15 的完整交付记录**，
而且全链路实测通过（`VALIDATION.md` 逐项记录）：

| 环节 | 状态 |
|---|---|
| 官方 validator `Result: OK` | ✅ 三次通过（v1 / v2 / 回退后） |
| `docker compose config` 渲染 | ✅ `127.0.0.1:18630→3000` 正确 |
| 镜像拉取（grafana/grafana:11.1.0, 453MB） | ✅ |
| `up -d` 独立 project 实跑 | ✅ 探活 HTTP 302 |
| Pi Desktop 发布（Unlisted — link only） | ✅ 4 步表单走通 |
| 安装 → 容器 running | ✅ inventory `0 apps []` → `1 apps [...:running]` |
| 外部浏览器登录 Grafana | ✅ 中文首页完整渲染 |
| Pi Desktop 内嵌 App 标签页 | ✅ 完整渲染登录页 |

**本次复测（2026-11-25）**：

```
官方 validator POST /api/apps/validate
  → grafana-solohost 包         ok = true   ← 10 天前的成果在当前契约下依然有效
  → 官方示例 web-app            ok = true
  → 官方示例 openclaw           ok = true
  → 官方示例 hermes             ok = true
```

> 官方 skill 仓库 `pi-node/solohost` 已克隆到本地，含完整契约 + 3 个官方示例 + 校验脚本。

### 已知的坑（11-15 踩过，省下的都是真金白银）

| 坑 | 真相 |
|---|---|
| 内嵌白屏误判为 iframe 策略 | **不是**。Pi Desktop App 标签页是顶层 webview 导航，不受 `X-Frame-Options` 约束。白屏是**首启时机**（Grafana 跑 SQLite migration，webview 加载时 HTTP server 还没监听）。⚠️ 诊断 UI 白屏必须验证「修复变量确实应用到运行容器」+「响应头确实变了」，不能只靠临时容器验证变量语义就下因果结论 |
| `GF_SECURITY_ALLOW_EMBEDDING` v2 尝试 | 已撤回。该变量关闭 Grafana 点击劫持防护且并不需要 |
| `X-Frame-Options: deny` 仍在 | 页面正常显示时它依然存在，进一步证明它不是白屏原因 |
| 失效代理 `127.0.0.1:4285` / `21075` | 会同时打中 npm 与 Python urllib，**两者都需进程级清空后直连** |

---

## 三、官方包契约（v0）要点速查

完整契约见 `pi-node/solohost/skills/solohost-package/references/contract.md`。
**契约会演进，打包前必须重新拉取**，不要复用快照。

### 包 = 两个文件

```text
package/
├── docker-compose.yml    # 运行时栈：跑哪些容器
└── config_options.yml    # 安装表单：问操作员什么问题
```

**包不含源码，只指向预构建的公开镜像。Desktop 只 pull，永不 build。**

### `docker-compose.yml` 最小可用形态

```yaml
services:
  web:
    image: ghcr.io/owner/app:1.2.3      # 必须有 image；禁止 build:
    restart: unless-stopped
    labels:
      pi.ui.primary: "true"               # 唯一有效的 SoloHost UI 标签，恰好一个
    ports:
      - "127.0.0.1:18642:8642"           # 必须 127.0.0.1:HOST:CONTAINER，恰好一个
    environment:
      API_KEY: '${API_KEY}'               # 每个 ${VAR} 都必须在 config_options 声明
    volumes:
      - app_data:/data                    # named volume，禁止 bind mount
volumes:
  app_data:
```

### 关键标签真相

| 标签 | 状态 |
|---|---|
| `pi.ui.primary: "true"` | ✅ 唯一实际使用的 UI 标签。**验证器不检查，但缺了 Desktop 检测不到应用、页面白屏** |
| `pi.ui.port` | ❌ **不存在**。端口来自绑定 |
| `pi.health.path` | ❌ **不存在**。healthcheck 只是普通 Compose 能力，当前非必需 |

### 被验证器拒绝的构造（写错就过不了）

`privileged` / `cap_add` / `security_opt` / `devices` / `extends` / `include` /
`network_mode: host|container:` / `pid|ipc|uts|cgroup: host` / `userns_mode: host` /
bind mount / 文件式 `secrets`|`configs` / 顶层 volume 的 `external:` 或自定义 `name:` /
顶层 `build:` / `container_name:`（建议不用）

### `config_options.yml` 顶层键是封闭集合

`title` `eyebrow` `description` `footer_hint` `output_file` `after_save` `fixed_values` `fields`
—— 出现任何其他顶层键直接被拒。

字段类型仅：`text` `password` `number` `select` `hidden`
—— `placeholder` / `min` / `max` **会被拒**；数字默认值必须写成字符串 `"30"`。

### 三个最隐蔽的坑

1. **origin fallback**（OpenClaw 示例注释专门强调）：
   Desktop 访问的是 `127.0.0.1:HOST`，应用内部以为自己是 `localhost:CONTAINER` ——
   **两个不同 origin**，应用可能拒绝 → 空白标签页。
   解法：镜像需支持 allow-embedding / origin fallback / host-header fallback，
   通过 `environment:` 或启动脚本配置。
   > 这正是 11-15 Grafana 白屏排查绕的弯路 —— 通用教训。

2. **Compose 插值陷阱**：
   - 默认值里**不能有冒号**：`"${IMAGE:-owner/name:tag}"` 会被误判 → 改用 `hidden` 字段
   - 类型化字段**不能用插值**：`context_size: 65536` 必须是字面量
   - `command:` 里的容器内 shell 变量要用 `$$VAR`，否则被 Compose 抢先插值

3. **`select.set` 写入的键不算已声明**：
   若 Compose 引用了 `select` 的 `set:` 里的键，必须**额外**声明为 `hidden` 字段。

### 验证 API（公开、无 token，是发布前权威 gate）

```
POST https://solohost-nohcqud24xwnsmna.staging.piappengine.com/api/apps/validate
Body: {"composeYaml": "...", "configOptionsYaml": "..."}
Pass: {"ok": true}
```

配套脚本 `scripts/validate_api.py`（仅标准库），冷启动可能 502，脚本自动重试。

**实测可达**（直连即可，无需代理）—— 这意味着可以本地快速迭代验证。

---

## 四、我们的候选 App 评估

作战台评估过的 5 个选题里，符合 SoloHost 形态的：

### 候选 A：本地 AI Agent 托管工具包 ⭐ 推荐

| 项 | 评估 |
|---|---|
| 形态匹配度 | ⭐⭐⭐ 官方点名的主推形态：「locally running AI agents」「AI agents running locally」 |
| 技术资产 | 本机 Docker 打包能力 + 本地 TTS/FFmpeg 全链路（记忆档案里已确认） |
| 官方对标 | OpenClaw（本地 AI Agent）、Hermes（自改进 Agent + DMR 本地模型）—— 官方示例就是这两个 |
| 差异化 | 可做「**中文本地 AI 助手一键托管**」：官方示例都是英文/海外模型，中文本地化是空白 |
| 评审匹配 | 命中「Pi utility」「技术完整性」「独特性」 |
| 成本 | 包 = 2 个 YAML + 1 个公开镜像 |
| 风险 | 需解决 origin fallback；需处理模型/API key 的安装表单 |

### 候选 B：中文创作者效率工具（字幕/配音/剪辑）

| 项 | 评估 |
|---|---|
| 形态匹配度 | ⭐⭐ SoloHost 官方示例未覆盖这类，但「self-hosted utilities」在官方定义里 |
| 技术资产 | **最强** —— FFmpeg + 本地中文 TTS（Huihui 女声 / Kangkang 男声）已打通 |
| 差异化 | 官方 OpenClaw/Hermes 都不做中文配音，这是真空白 |
| 风险 | 体积大（FFmpeg + 模型），拉取慢；单人使用场景留存一般 |

### 候选 C：中文创作者效率工具 + Agent 混合

把 A 的托管壳 + B 的字幕/配音能力合成一个「**本地 AI 视频生产力套件**」：
- 一个镜像里同时有 Agent 网关 + FFmpeg 工具链
- 更接近官方 Hermes 那种「多服务」形态
- 但实现复杂度显著上升

---

## 五、真实风险（必须正视，不能自我安慰）

### 风险 1：「42 万节点」是官方自报，不等于真实活跃用户

Pi 官方口径是 420,000+ Nodes，但：
- 2026 官方博客自己说 Node 网络是「**over 420,000 Pioneer-operated computers**」——
  是「装了 Pi Desktop 的机器数」，不是「每月活跃用户数」
- Pi Desktop 0.6.3 才刚加入「按 running count 排名」，说明**生态还很新**
- 历史参考：2025 届黑客松 215 个参赛项目

**结论**：SoloHost 触达的是「对本地 AI 有隐私需求的节点操作者」这个**小而精准**的人群，
不是 42 万个等着下载你的用户。**别把它当流量渠道，它是分发渠道。**

### 风险 2：没有 Pi Browser 流量 = 社区参与奖天然吃亏

社区参与奖（75% 现金）看「真实用户参与度、留存、社区传播」。
SoloHost App 跑在用户自己电脑上，**没有公网 URL** → 没有 Pi Browser 浏览量、
没有搜索引擎收录、没有自然分享链路。

> 但反过来说：SoloHost 的用户是**主动装到本机**的，天然比随手点开的用户更精准。

**所以路线定位必须调整**：
- ❌ SoloHost App 打**社区参与奖**（缺传播链路）
- ✅ SoloHost App 打**评委奖**（技术完整性、创新性、独特性、UI/UX —— 全靠作品本身说话）

### 风险 3：SoloHost 上架 ≠ 通过黑客松评审

官方规则里 SoloHost 是合法参赛路径，但 SoloHost 走的是「结构检查、无人工预审」的开放流程，
**「发布成功」不代表「通过评审」**。评审还要看：
英文名/描述质量、合规 Logo、界面预览图、隐私政策、**公开 Demo 视频（≤3 分钟，讲 5 件事）**。

### 风险 4：Docker 资产需要是「公开可拉取的镜像」

契约原文：「No app source lives in a package; it points at a pre-built, **public** image.」
→ 你需要有一个**推送到公开 registry**（GHCR / Docker Hub）的镜像。
本机目前只有本地镜像，**这一环需要专门处理**。

---

## 六、工作量与时间账

剩余 **42 天**（至 2027-01-06 15:59 北京时间）。

| 步骤 | 预估 | 依赖 |
|---|---|---|
| 选定具体 App + 形态 | 0.5 天 | 你的决策 |
| 推送公开镜像（CI 或本地 build+push） | 0.5 天 | Docker daemon（本机需手动启动，WSL 被沙箱策略拦） |
| 写 2 个 YAML + 过 validator | 0.5 天 | ✅ 校验 API 已实测可达 |
| 本地 `compose up` 实跑 + 探活 | 0.5 天 | Docker daemon |
| origin fallback 排查（若白屏） | 0.5–1 天 | 11-15 教训：别急着归因 |
| Pi Desktop 发布 → 拿 App ID | 0.5 天 | 图形流程，我无法代劳 |
| 录 ≤3 分钟公开 Demo 视频 | 1 天 | 需真实操作录屏 |
| 准备英文名/描述/Logo/预览图/隐私政策 | 1 天 | 复用现有物料，Logo 已有 |
| 控制台提交（填 App ID） | 0.5 天 | 需你在电脑端操作 |
| **合计** | **≈ 6 天** | |

**对比「再做一个标准 Pi App」**：还要 + 部署 + 域名验证 + 上架审核 + Pi Browser 测试，
且**必然与作战台同质**（都是「参赛辅助工具」，克隆风险）。

**6 天 vs 42 天 = 有充足缓冲。** 前提是**作战台本身先做完**（它卡在公网 HTTPS 部署上）。

---

## 七、建议的执行顺序

```
P0  报名 Pi Next + 确认 KYC（0 或 1 的门槛，不做直接出局）
P0  作战台：部署 → 域名验证 → Demo 视频 → 提交       ← 唯一确定能拿分的路径
P1  SoloHost：定选题 → 公开镜像 → 2 个 YAML → validator → 本地实跑
P1  SoloHost：Pi Desktop 发布 → 拿 App ID
P2  SoloHost：Demo 视频 + 上架物料 + 控制台提交（填 App ID）
```

**关键顺序理由**：作战台卡在「等公网地址」这个外部依赖上，SoloHost 全程可控。
**两条线并行推进，作战台的等待期正好用来啃 SoloHost。**

---

## 八、需要你决策的 3 件事

1. **选哪个 SoloHost App？** 我推荐「中文本地 AI 助手一键托管」（候选 A），
   或「本地 AI 视频生产力套件」（候选 C，难度高但更完整）。
   你也可以直接指定别的。

2. **公开镜像推到哪？** GHCR（Pi 官方示例常用）还是 Docker Hub？

3. **Demo 视频谁来录？** 需要真实操作 Pi Desktop 的画面。
   我可以写好逐字稿 + 录制脚本，但最终录屏需要真机操作。

---

## 附：关键文件位置

| 内容 | 路径 |
|---|---|
| 官方 SoloHost skill 仓库（已克隆） | `C:\Users\HUAWEI\AppData\Local\Temp\solohost-src\` |
| 官方包契约 v0 | `solohost-src/skills/solohost-package/references/contract.md` |
| 官方示例（Grafana / OpenClaw / Hermes） | `solohost-src/skills/solohost-package/examples/` |
| 官方校验脚本 | `solohost-src/skills/solohost-package/scripts/validate_api.py` |
| **你 11-15 的交付记录** | `G:\WORKBUDDY\2026-11-15-10-27-57\solohost-phase1\VALIDATION.md` |
| **你 11-15 的包（已复测 ok:true）** | `G:\WORKBUDDY\2026-11-15-10-27-57\solohost-phase1\grafana-solohost\` |

## 官方来源

- `https://github.com/pi-node/solohost`（官方 skill 仓库，含包契约）
- `https://minepi.com/blog/pi2day2026/`（官方：SoloHost 是开放无许可发布流程，420K 节点口径）
- `https://minepi.com/blog/solohost-pi-desktop-0-6-3/`（官方：My Apps、按 running count 排名、发布工具）
- `https://minepi.com/blog/developer-platform-updates`（官方：AI 辅助打包 skill）
- `https://developers.minepi.com/hackathon`（官方：两条路径、≤3 App）
- OrbitWatch / Bitrue / KuCoin / CoinPost365（多家对 22 条 Rules 与 SoloHost 提交要求转述一致）
