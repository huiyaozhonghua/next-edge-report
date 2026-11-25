# Next Edge — Demo 视频成片说明

> **成片**：`listing-assets/demo/next-edge-demo-v1.mp4`
> **规格**：1920×1080 / 30fps / H.264+AAC / **105 秒（1:45）** / 7.7 MB / -14.4 LUFS
> **生成时间**：2026-11-25
> **官方限制**：≤ 3 分钟 ✅（余量 75 秒）

---

## 🎬 这条片子是怎么来的

**不是录屏，也不是 PPT** —— 是**用代码从线上 App 生成**的：

```
真实线上站点 next-edge-report.pages.dev
  ↓ Chrome headless + CDP 协议（真实点击交互）
13 张关键帧（真实界面状态）
  ↓ FFmpeg 合成各段素材
9 段视频素材（Ken Burns 推近）
  ↓ local-video-composer（分镜 + 字幕 + 混音）
成片
```

**优点**：
- 画面是**真 App 在跑**，不是设计稿
- 每次改代码 → push → 重新生成，**文案和画面永远同步**
- 时长精确到 0.02 秒
- 无需任何剪辑软件

**技术要点**：
- 沙箱隔离了跨进程 localhost socket，CDP 的 `--remote-debugging-port` 用不了
  → 改用 `--remote-debugging-pipe`（fd 3/4 管道通信，**不走 socket**）
- Chrome 的 pipe 协议是 **`\0` 分隔**的 JSON，不是 DevTools socket 的 4 字节长度前缀

---

## 📋 结构（12 段 / 105 秒）

| # | 时长 | 画面 | 旁白要点 |
|---|---|---|---|
| 1 | 6.0s | 标题卡：Next Edge + 42/$200K/75% | "a war room for Pi Next participants" |
| 2 | 11.3s | 作战台全景 | 奖池 20 万 USDT；**75% 给参与度和留存，不是代码** |
| 3 | 11.2s | 选题匹配器（题面） | "a tool you come back to, not a report"；5 道题 |
| 4 | 10.2s | 匹配结果（67/63/61） | 本地计算，不上传；不同答案不同排序 |
| 5 | 10.3s | 46 天计划概览 | 5 阶段，从资格确认到提交 |
| 6 | 6.1s | 阶段 3 留存与社区 | 勾选即存 |
| 7 | 8.2s | 打卡成功 | 连续打卡 = 留存钩子 |
| 8 | 8.2s | 报告库（交叉验证表） | 每条结论交叉验证 + 置信度 |
| 9 | 7.5s | 文字卡：目标用户 | 独立开发者与小团队；决策问题不是编码问题 |
| 10 | 10.2s | 作战台（Pi 登录段） | **Pi 就是登录方式**：无账号、无邮箱、无密码 |
| 11 | 6.3s | 作战台（PiNet 段） | 登录一次，进度跨设备同步，在 PiNet 内 |
| 12 | 10.3s | 收尾卡 | "Pick the right topic. Then finish it." |

**官方 5 项要求覆盖**：

| 官方要求 | 覆盖段 |
|---|---|
| what your app is and what it does | 1、2 |
| walkthrough of features and interface | 2–8 |
| who the app is for | 9 |
| the problem or need it addresses | 2、9 |
| how Pi is part of the experience | 10、11 |

---

## 🔊 声音

- **配音**：`edge-tts` / `en-US-GuyNeural` / +8% 语速（Neural 音色，清晰自然）
- **字幕**：底部硬字幕（英文），每段一句，随旁白同步
- **响度**：-14.4 LUFS（YouTube 推荐区间 -14 ~ -16）
- **峰值**：-1.9 dBFS（无削波）
- **段间留白**：约 2 秒呼吸，不句句顶满

---

## 🔄 怎么重新生成

```bash
# 1. 录关键帧（真实点击线上 App）
cd C:/Users/HUAWEI/AppData/Local/Temp
node record_scenes.js C:/Users/HUAWEI/AppData/Local/Temp/scenes

# 2. 合成各段素材
cd demo && bash build_segments.sh

# 3. 出片
export HTTP_PROXY=http://127.0.0.1:17891 HTTPS_PROXY=http://127.0.0.1:17891
python "C:/Users/HUAWEI/.workbuddy/skills/local-video-composer/scripts/compose.py" project.json
python "C:/Users/HUAWEI/.workbuddy/skills/local-video-composer/scripts/voiceover.py" project.json
```

**改文案**：只改 `demo/project.json` 里的 `vo` 字段 → 重跑第 3 步
**改时长**：改 `dur` → 同时改 `build_segments.sh` 里对应的 `mkseg` 时长

---

## ⚠️ 上架前必做

- [ ] **上传到 YouTube 并设为公开**（官方要求公开可访问，不是"仅受邀者可见"）
- [ ] 确认**无痕窗口能打开**（测试是否真的公开）
- [ ] 链接填进 listing 表单的 "Demo video" 字段
- [ ] YouTube 描述里附上 pi_url 和 GitHub 链接

**官方视频链接校验规则**（源码）：
```js
protocol === "https:" && !username && !password && hostname.includes(".")
```
→ YouTube 链接 ✅

**官方认可的发布渠道**：X / YouTube / Ecosystem Summit / Facebook / Instagram /
Telegram / Mine Pi app / Email from Pi / Friend or teammate

---

## 💡 已知不足（可后续改进）

1. **Pi 登录段用的是界面演示，不是真机登录画面**
   → 建议：拿手机在 Pi Browser 里真机录 10 秒登录成功画面，替换第 10 段。
   → 稿子 `DEMO_VIDEO_SCRIPT.md` 里已经标了这一段是独立片段（R7），就是为替换预留的。

2. **界面是英文，但内容全靠字幕**
   → 已给 App 做了完整英文化（0 中文字符），字幕是冗余保险。

3. **报告库的中文分析结论已译成英文**，但中文版原文没了
   → 如果之后要做中文版，需要从 git 历史恢复。

4. **未做背景音乐**
   → 官方 Demo 一般不加BGM（评委可能静音看），纯人声更清晰。
   → 如需加，音量控制在 -22dB 以下。
