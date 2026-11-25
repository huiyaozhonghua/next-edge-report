# SoloHost 参赛 App 方案：本地成片工作台（Next Edge Studio）

> 制定时间：2026-11-25
> 目标：为 Pi Next 黑客松打造一个**真实的、自有的** SoloHost App，替代官方示例套壳。

---

## 一、先纠正一个错误结论

11-15 的 Grafana 包**不能作为参赛作品**。逐行 diff 证实：

```
你的包     vs    官方 examples/web-app/
image: grafana/grafana:11.1.0     ← 同一个镜像
GF_SECURITY_ADMIN_USER/PASSWORD  ← 同一组字段
唯一差异：127.0.0.1:18630  vs  127.0.0.1:13000
```

你自己的 `VALIDATION.md` 也写了「**等同官方 examples/web-app/ 示例**」。
那是一次**链路验证**（证明 SoloHost 全流程能跑通），不是产品。

**它已经完成了它的使命**：证明 validator → compose → Pi Desktop 发布 → 安装 → 内嵌渲染这条链路在你机器上可行。
现在要做的，是往这条链路上挂一个**真东西**。

---

## 二、真实资产盘点（全部来自你的工作区，非套壳）

| 资产 | 位置 | 证据 |
|---|---|---|
| **本地成片管线** | `~/.workbuddy/skills/local-video-composer/` | `compose.py` 19KB + `voiceover.py` 7.4KB |
| **8 个 FFmpeg 实战坑** | `references/pitfalls.md` | 每条都是实测定位的（`zoompan` 吃时长、`amix` 衰减、`xfade` 截断…） |
| **4 条真实成片** | `2026-11-19-10-08-22/` | APEC深圳格局版 97MB / 男声沉稳版 108MB / 精修版 108MB / 男声版 87MB |
| **中文男声 Piper TTS** | `2026-11-19-10-08-22/piper/` | Linux 原生，**可直接进容器** |
| **本机 FFmpeg 9.0.2 full build** | 已装 | 字幕/混音/规整全链路 |
| **Docker 打包与 SoloHost 全链路经验** | `2026-11-15-10-27-57/solohost-phase1/` | 发布→安装→内嵌渲染全通 |

> 这条管线的独特性：**中文 + 本地 + 精确控时到 0.02 秒 + 零联网依赖**。
> 官方 SoloHost 示例（OpenClaw / Hermes / Grafana）**全都不做中文**。

---

## 三、App 定位

### 名称候选
| 英文名 | 中文名 | 理由 |
|---|---|---|
| **Next Edge Studio** | 本地成片工作台 | 与作战台同品牌，不含 "Pi"，符合商标规则 |
| ClipForge Local | 片段锻造厂 | 更产品化 |
| FrameSmith | —— | 略长 |

**推荐 Next Edge Studio** —— 与已建的 "Next Edge Report" 形成同一品牌矩阵，
且两个 App 在评审眼里是「同一人/同一团队的两条不同产品线」，
**技术栈、用户、场景完全不同，不构成克隆**。

### 一句话介绍
> 把一堆照片和手机竖屏视频，变成一条带中文旁白和字幕的成片 —— 全程在你自己的电脑上跑，不上传任何素材。

### 目标用户（Pi 节点操作者）
- 有隐私顾虑，不愿把素材传到云端（**这是 SoloHost 存在的理由**）
- 做 Pi 生态内容传播 / 个人品牌宣传片
- 手里有素材但没有剪辑软件、没有时间学

---

## 四、形态设计（受 SoloHost 契约硬约束）

### 4.1 关键矛盾及解法

**矛盾**：SoloHost 禁止 bind mount，用户本机的照片/视频**进不了容器**。

**解法**：**容器内 Web UI 提供上传**，成片在浏览器内预览/下载。
这是唯一自闭环的形态，也是 OpenClaw（浏览器内配置）的同款思路。

### 4.2 服务结构

```
Next Edge Studio 容器
├── web        (pi.ui.primary)  ← UI：上传 / 时间线编辑 / 预览 / 下载
└── worker     (无 UI)         ← 渲染队列：compose.py + voiceover.py
```

**为什么拆两个服务**：
- 渲染是长任务（97MB 成片要几分钟），不能占着 UI 端口
- UI 端口必须唯一（契约要求 UI 服务恰好一个端口）
- worker 用 named volume 与 web 共享工作目录

### 4.3 数据流

```
用户浏览器
  │ ① 上传素材 (photos/videos) → web 写入 named volume /assets
  │ ② 编辑时间线 (JSON)       → web 写入 named volume /work/project.json
  ▼
web 服务 (Python http.server + 轻量 API)
  │ ③ POST /api/render  → 触发 worker 队列
  ▼
worker 服务 (Python, 轮询队列)
  │ ④ compose.py  → 无声成片 (HTML分镜 → Chrome → FFmpeg → concat)
  │ ⑤ voiceover.py → 逐句 TTS → atempo 校准 → loudnorm → adelay → amix
  ▼
named volume /work/out/成片.mp4
  │ ⑥ web 提供 <video> 预览 + 下载链接
  ▼
用户浏览器
```

### 4.4 契约合规要点

| 契约要求 | 本 App 怎么满足 |
|---|---|
| 每个 service 有 `image:` | ✅ 两个 service 都用公开镜像 |
| 恰好一个 `pi.ui.primary: "true"` | ✅ 只有 `web` |
| UI 服务恰好一个 loopback 端口 | ✅ `127.0.0.1:18790:8080` |
| 禁止 bind mount | ✅ 素材全走 named volume |
| 禁止 privileged / cap_add / devices | ✅ 都需要 Chrome `--no-sandbox`，用普通容器即可 |
| 禁止 `network_mode: host` | ✅ 默认 bridge |
| `${VAR}` 全部声明 | ✅ 见 config_options |
| 每个表单选项真正生效 | ⚠️ 必须实跑验证（契约第 16 条） |
| **origin fallback** | ⚠️ **必须处理** —— Desktop 访问 `127.0.0.1:18790`，容器内是 `localhost:8080`，两个 origin。UI 要允许嵌入 |

### 4.5 安装表单（config_options.yml）

```yaml
title: Next Edge Studio
eyebrow: SoloHost App
description: |
  Turn photos and vertical phone videos into a finished clip with Chinese
  narration and burned-in subtitles. Everything runs on your own machine —
  your footage never leaves it.
output_file: .env
fields:
  - name: TTS_ENGINE
    label: Narration engine
    type: select
    default: piper
    help: Piper runs fully offline. Edge TTS needs internet but sounds more natural.
    options:
      - value: piper
        label: Piper (offline, Chinese male voice)
      - value: edge
        label: Edge TTS (online, more natural)
  - name: EDGE_VOICE
    label: Edge TTS voice
    type: select
    default: zh-CN-YunyangNeural
    visible_if:
      field: TTS_ENGINE
      in: [edge]
    options:
      - value: zh-CN-YunyangNeural
        label: 云扬 (male)
      - value: zh-CN-XiaoxiaoNeural
        label: 晓晓 (female)
  - name: DEFAULT_VOICE_NAME
    label: Piper voice model
    type: hidden
    default: "zh_CN-huayan-medium"
  - name: SUBTITLE_STYLE
    label: Subtitle style
    type: select
    default: bottom
    options:
      - value: bottom
        label: Bottom bar
      - value: none
        label: No subtitles
```

> ⚠️ `EDGE_VOICE` 用 `select` 且 `TTS_ENGINE` 的 `edge` 选项引用它 —— 注意契约：
> **`select.set` 写入的键不算已声明**。这里没用到 `set:`，所以安全。
> 但 `TTS_ENGINE=edge` 时 compose 里引用 `${EDGE_VOICE}`，而 EDGE_VOICE 是 `visible_if` 字段
> （选 piper 时不显示 → 值为空）。需要 `default` 兜底，或用 `fixed_values`。

### 4.6 docker-compose.yml 骨架

```yaml
services:
  web:
    image: ghcr.io/<user>/next-edge-studio:1.0.0
    restart: unless-stopped
    labels:
      pi.ui.primary: "true"
    ports:
      - "127.0.0.1:18790:8080"
    environment:
      TTS_ENGINE: '${TTS_ENGINE}'
      EDGE_VOICE: '${EDGE_VOICE}'
      DEFAULT_VOICE_NAME: '${DEFAULT_VOICE_NAME}'
      SUBTITLE_STYLE: '${SUBTITLE_STYLE}'
    volumes:
      - studio_data:/data
    depends_on:
      - worker

  worker:
    image: ghcr.io/<user>/next-edge-studio:1.0.0
    restart: unless-stopped
    command: ["/app/worker.py"]
    environment:
      TTS_ENGINE: '${TTS_ENGINE}'
      EDGE_VOICE: '${EDGE_VOICE}'
      DEFAULT_VOICE_NAME: '${DEFAULT_VOICE_NAME}'
      SUBTITLE_STYLE: '${SUBTITLE_STYLE}'
    volumes:
      - studio_data:/data

volumes:
  studio_data:
```

---

## 五、镜像构建（这是最大的工作量）

### 5.1 基础镜像内容

| 组件 | 来源 | 体积 |
|---|---|---|
| Python 3.11 slim | docker hub | ~150MB |
| ffmpeg + ffprobe | apt | ~200MB |
| **Chromium + 中文字体** | apt (`chromium`, `fonts-noto-cjk`) | ~450MB |
| Pillow | pip | ~10MB |
| Piper TTS + 中文模型 | pip + 下载 onnx | ~120MB |
| 你的 compose.py / voiceover.py / web 服务 | 源码 | <100KB |
| **合计** | | **~900MB–1.1GB** |

> ⚠️ **体积风险**：接近 1GB 的镜像，Pi 节点用户下载会很慢。
> 缓解方案：
> - 用 **多阶段构建**，最终镜像只保留运行必需物
> - Chromium 用 `chromium-headless-shell` 而非完整 chromium（省 ~250MB）
> - 中文字体只打包 `Noto Sans CJK SC` 一个字重（省 ~200MB）
> - 目标压到 **≤600MB**

### 5.2 一个真实的约束

`compose.py` 里字体路径是 Windows/macOS 硬编码：
```python
"regular_font": [r"C:\Windows\Fonts\msyh.ttc", ...]
MAC_CANDIDATES = {...}
```
**容器是 Linux** —— 需要加 Linux 分支（`/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc`）。
这属于必要的容器适配，不算「重写」。

### 5.3 `edge-tts` 的网络依赖

`voiceover.py` 依赖 edge-tts（联网）。容器里默认能联网（除非 `network_mode: none`），
但**在中国大陆的 Pi 节点用户机器上大概率不可达** —— 这正是为什么主推 Piper（纯离线）。

---

## 六、诚实的风险评估

| 风险 | 等级 | 说明与对策 |
|---|---|---|
| **镜像体积 ~1GB** | 中 | 多阶段构建 + headless-shell + 单字重字体，压到 ≤600MB |
| **渲染耗时长** | 中 | 97MB 成片要几分钟；UI 必须做异步队列 + 进度条，不能同步等 |
| **Chrome 在容器里的稳定性** | 中 | `--no-sandbox` 必需；memory 低的机器可能 OOM |
| **中文 TTS 质量** | 低 | Piper 已验证可用（有试听 mp3）；edge-tts 音质更好但要联网 |
| **UI 开发量** | **高** | 现有管线是纯 CLI，**需要从零写 Web UI**（上传/时间线编辑/预览/下载） |
| **Pi 登录集成** | 低 | SoloHost 用 `fixed_values: detect: pi_username` 拿到用户名即可（仅作展示，**绝不能用于鉴权**） |
| **中文字幕渲染** | 低 | 已有 `crop_top` 等实测经验 |

### 最大的不确定性
**不是技术，是时间。** 从零写一个能用的 Web UI（上传 + 时间线编辑 + 实时预览 + 下载），
按我的估计需要 **3–5 天**（不含成片管线的容器适配 1–2 天）。

而剩余只有 **42 天**，且作战台还卡在公网部署。

---

## 七、三个方案对比

| | A. Next Edge Studio（成片工作台） | B. 中文 AI 助手一键托管 | C. 只投作战台 |
|---|---|---|---|
| 自有资产 | ✅ 管线 + 成片 + Piper + 8 坑 | ⚠️ 只有 Docker 能力 | ✅ |
| 官方示例是否已有 | ❌ 官方无中文成片工具 | ❌ 官方示例是英文助手 | — |
| 克隆风险 | 无 | 无 | — |
| 额外开发量 | 3–5 天（写 Web UI） | 2–3 天（包装现成镜像） | 0 |
| 技术栈差异 vs 作战台 | ✅ 完全不同（视频/FFmpeg） | ✅ 不同 | — |
| 打评委奖适配 | ⭐⭐⭐ 技术完成度 + 创新性 + 独特性 | ⭐⭐ 撞官方示例形态 | ⭐⭐⭐ |
| 真实用户价值 | ⭐⭐⭐ 隐私向本地成片刚需 | ⭐⭐ | ⭐⭐⭐ |

---

## 八、我的建议

**先做 A，但用一个更小的切口。**

原因：
1. A 的差异化最强（中文 + 离线 + 精确控时，官方全无）
2. 「隐私向本地成片」在 Pi 生态里是真需求 —— 节点操作者就是最在意隐私的人群
3. 你已有 4 条成片做验证素材，Demo 视频有真实画面
4. 你已经有 SoloHost 全链路经验（11-15），不是从零学

**建议的最小可行版本（MVP）**：
- 上传素材（多选）
- 一个极简时间线表单（每段：选素材 + 时长 + 旁白文本）
- 一键渲染（异步 + 进度）
- 浏览器内预览 + 下载
- **不做**：拖拽式时间线编辑器、字幕样式定制、多语言

这样能把 Web UI 从 3–5 天压到 **2–3 天**，且功能完整可演示。

---

## 九、待你决策

1. **选哪个 App？** 我推荐 A（Next Edge Studio），并按上面的 MVP 切口。
2. **镜像推到哪？** GHCR（官方示例常用，且 Pi 生态偏 GitHub）或 Docker Hub。
3. **现在动手还是先做作战台？**
   我的建议：**并行**。作战台卡在「等公网地址」这个外部依赖，
   正好用等待期来写 Studio。但如果你想先拿稳一个，作战台优先。

---

## 附：相关文件位置

| 内容 | 路径 |
|---|---|
| 本地成片管线 | `~/.workbuddy/skills/local-video-composer/` |
| 8 个 FFmpeg 坑 | `~/.workbuddy/skills/local-video-composer/references/pitfalls.md` |
| 项目配置示例 | `~/.workbuddy/skills/local-video-composer/assets/project.example.json` |
| 真实成片与 Piper | `G:\WORKBUDDY\2026-11-19-10-08-22\` |
| SoloHost 全链路经验 | `G:\WORKBUDDY\2026-11-15-10-27-57\solohost-phase1\VALIDATION.md` |
| 官方包契约 | `listing-assets/solohost-reference/contract.md` |
| 实跑验证脚本 | `listing-assets/verify_solohost.sh` |
