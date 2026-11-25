/**
 * Next Edge · Pi Next 参赛作战台 — client logic
 * - Topic matcher: weighted scoring engine (local, no upload)
 * - 46-day plan: localStorage persistence, optional server sync after Pi login
 * - Daily check-in: streak logic
 * - Pi SDK: PiNet-compatible (report browsable without login), auth on demand
 */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var KEY = "nextedge_state_v1";

  var defaultState = {
    checked: {},
    answers: {},
    checkins: [],
    topTopic: null,
    uid: null
  };
  var state = load();

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return JSON.parse(JSON.stringify(defaultState));
      var s = JSON.parse(raw);
      for (var k in defaultState) if (!(k in s)) s[k] = defaultState[k];
      return s;
    } catch (e) { return JSON.parse(JSON.stringify(defaultState)); }
  }
  var accessToken = null;   // 服务端 /api/progress 需要 Bearer 才会写盘
  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
    if (state.uid && accessToken) {
      fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + accessToken },
        body: JSON.stringify({ uid: state.uid, state: state })
      }).catch(function () {});
    }
    showToast("已保存");
  }
  var toastTimer;
  function showToast(msg) {
    var t = $("toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove("show"); }, 1400);
  }

  function todayStr() { var d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function daysLeft() {
    var end = new Date("2027-01-06T15:59:00+08:00");
    return Math.max(0, Math.ceil((end - new Date()) / 86400000));
  }
  function streak() {
    if (!state.checkins.length) return 0;
    var set = {}; state.checkins.forEach(function (d) { set[d] = true; });
    var d = new Date(), n = 0;
    if (!set[todayStr()]) d.setDate(d.getDate() - 1);
    while (true) {
      var s = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
      if (!set[s]) break; n++; d.setDate(d.getDate() - 1);
    }
    return n;
  }

  var PLAN = [
    { phase: "阶段 0 · 资格确认（今天，30 分钟）", hint: "0 或 1 的门槛，先做这个", items: [
      { id: "p0a", t: "在 Developer Web Console 注册 Pi Next", s: "Hackathon 标签页，全员都要注册" },
      { id: "p0b", t: "确认本人 KYC 状态", s: "未完成立刻启动，这是硬门槛" },
      { id: "p0c", t: "确认网络选择：Production 主网", s: "官方规定不可更改，只有主网能上架参赛" }
    ]},
    { phase: "阶段 1 · 选题与资产盘点（本周，2 小时）", hint: "复用优于从零开发", items: [
      { id: "p1a", t: "跑一遍选题匹配器，锁定头号方向", s: "见「选题匹配」标签页" },
      { id: "p1b", t: "盘点现有 Docker 镜像 / AI 资产", s: "挑 1–2 个能接 Pi 登录支付的" },
      { id: "p1c", t: "报名 Midpoint 提交", s: "可选但有官方曝光和反馈，细则走邮件" }
    ]},
    { phase: "阶段 2 · 合规改造（11 月底，4–8 小时）", hint: "不达标直接出局", items: [
      { id: "p2a", t: "改成 Pi 登录 + Pi 支付", s: "禁止邮箱/第三方登录，禁止法币" },
      { id: "p2b", t: "去掉外链跳转与多余数据采集", s: "禁止收集邮箱手机号" },
      { id: "p2c", t: "加隐私政策 + 合规 Logo + PiNet 集成", s: "上架必需，物料已备好" }
    ]},
    { phase: "阶段 3 · 留存与社区（12 月，持续）", hint: "60% 精力放这里，奖金的 75% 在这", items: [
      { id: "p3a", t: "设计让用户「回来第二次」的钩子", s: "打卡 / 进度 / 提醒 / 数据沉淀" },
      { id: "p3b", t: "找有 Pi 用户池的队友组队", s: "社区奖看真实参与、留存、传播；每人须各自注册" },
      { id: "p3c", t: "录制 ≤3 分钟英文演示视频", s: "必须公开（YouTube 等）；讲清 5 件事：这是什么 / 界面功能 / 目标用户 / 解决什么问题 / Pi 如何参与" }
    ]},
    { phase: "阶段 4 · 提交（1 月 5 日前）", hint: "截止北京时间 1/6 15:59，别卡点", items: [
      { id: "p4a", t: "备齐英文名称/描述/预览图/Logo", s: "上架物料在 listing-assets/" },
      { id: "p4b", t: "公网 HTTPS 部署 + 域名验证", s: "validation-key.txt 模板已备" },
      { id: "p4c", t: "由一名队员提交，确认 SoloHost App ID", s: "每队最多 3 个 App；提交后截图存档" }
    ]}
  ];

  function renderPlan() {
    var html = "";
    PLAN.forEach(function (ph) {
      html += '<div class="phase"><h3>' + ph.phase + ' <span>' + ph.hint + '</span></h3>';
      ph.items.forEach(function (it) {
        var on = !!state.checked[it.id];
        html += '<label class="item' + (on ? ' done' : '') + '">' +
          '<input type="checkbox" data-task="' + it.id + '"' + (on ? ' checked' : '') + '>' +
          '<span class="txt">' + it.t + '<small>' + it.s + '</small></span></label>';
      });
      html += '</div>';
    });
    $("planList").innerHTML = html;
    Array.prototype.forEach.call(document.querySelectorAll("[data-task]"), function (cb) {
      cb.addEventListener("change", function () {
        state.checked[cb.getAttribute("data-task")] = cb.checked;
        save(); renderPlan(); renderDash();
      });
    });
  }

  function renderDash() {
    var total = 0, done = 0;
    PLAN.forEach(function (ph) { ph.items.forEach(function (it) { total++; if (state.checked[it.id]) done++; }); });
    var pct = total ? Math.round(done / total * 100) : 0;
    $("ringPct").textContent = pct + "%";
    $("ringArc").setAttribute("stroke-dashoffset", String(314 - 314 * pct / 100));
    $("pBar").style.width = pct + "%";
    $("pCount").textContent = done + " / " + total + " 项任务完成";
    var stages = ["还没开始 · 先做资格确认", "资格就绪 · 开始盘点资产", "选题锁定 · 进入合规改造", "合规完成 · 主攻留存与社区", "接近完成 · 准备提交"];
    $("pStage").textContent = stages[Math.min(4, Math.floor(pct / 25))];
    $("pDesc").textContent = pct === 0 ? "完成第一个任务，作战台就正式启动了。" : pct < 50 ? "稳住节奏，社区分发才是钱最多的地方。" : "快到终点了，检查演示视频和英文物料。";
    var st = streak();
    $("sStreak").textContent = st; $("streakBig").textContent = st;
    $("sLeft").textContent = daysLeft(); $("cdDays").textContent = daysLeft();
    var hd = $("heroDays"); if (hd) hd.textContent = daysLeft();
    $("sMatch").textContent = state.topTopic ? state.topTopic.name : "—";
    var checkedToday = state.checkins.indexOf(todayStr()) >= 0;
    $("checkinBtn").disabled = checkedToday;
    $("checkinBtn").textContent = checkedToday ? "今日已打卡 ✓" : "今日打卡 ✓";
    var dots = "", d = new Date();
    var set = {}; state.checkins.forEach(function (x) { set[x] = true; });
    for (var i = 6; i >= 0; i--) {
      var dd = new Date(d); dd.setDate(dd.getDate() - i);
      var s = dd.getFullYear() + "-" + pad(dd.getMonth() + 1) + "-" + pad(dd.getDate());
      dots += '<div class="day' + (set[s] ? ' on' : '') + '">' + dd.getDate() + '</div>';
    }
    $("dayDots").innerHTML = dots;
    var next = null;
    for (var pi = 0; pi < PLAN.length && !next; pi++) {
      next = PLAN[pi].items.filter(function (it) { return !state.checked[it.id]; })[0];
    }
    if (next) { $("todayTask").textContent = next.t; $("todayWhy").textContent = next.s; }
  }

  var QUESTIONS = [
    { id: "tech", q: "你的主力技术栈是？", opts: [
      { v: "fullstack", l: "全栈 / Web 开发" }, { v: "ai", l: "AI / Agent 工程" },
      { v: "docker", l: "Docker / 运维 / 节点" }, { v: "nocode", l: "低代码 / 不会写代码" }
    ]},
    { id: "time", q: "这 46 天能投入多少小时？", opts: [
      { v: "lt10", l: "10 小时以内" }, { v: "10_40", l: "10–40 小时" },
      { v: "40_100", l: "40–100 小时" }, { v: "gt100", l: "100 小时以上" }
    ]},
    { id: "asset", q: "你手上现成的资产？（可多选）", multi: true, opts: [
      { v: "docker_img", l: "现成 Docker 镜像" }, { v: "agent", l: "AI Agent / MCP 项目" },
      { v: "content", l: "内容创作 / 视频能力" }, { v: "node", l: "Pi 节点在跑" },
      { v: "audience", l: "Pi 生态用户池" }, { v: "none", l: "基本没有" }
    ]},
    { id: "goal", q: "你最想要哪个奖？", opts: [
      { v: "judge", l: "评委奖（拼作品）" }, { v: "community", l: "社区奖（拼运营）" },
      { v: "learn", l: "先跑通流程学习" }
    ]},
    { id: "pi", q: "Pi 生态里有现成受众吗？", opts: [
      { v: "yes", l: "有，能触达 KYC 用户" }, { v: "no", l: "没有，从零开始" }
    ]}
  ];

  var TOPICS = [
    { id: "ai_selector", name: "AI 选题决策助手（SoloHost 版）",
      desc: "输入技能/时间/资源，输出个性化选题与胜率评分，带每日进度与提醒。把一次性内容变成每天回来的工具。",
      fit: { tech: { fullstack: 3, ai: 5, docker: 4, nocode: 1 }, time: { lt10: 3, "10_40": 5, "40_100": 4, gt100: 3 },
             goal: { judge: 4, community: 5, learn: 5 }, pi: { yes: 5, no: 3 } },
      bonus: { agent: 3, docker_img: 2, node: 2, content: 1, audience: 1 },
      hours: "15–30h", tags: ["高留存", "AI 叙事对齐", "评委+社区双吃"] },
    { id: "agent_host", name: "本地 AI Agent 托管工具包",
      desc: "把 AI Agent 打包成 Docker 镜像，通过 SoloHost 分发给 42 万节点用户。官方主推赛道，竞争者少。",
      fit: { tech: { fullstack: 3, ai: 4, docker: 5, nocode: 0 }, time: { lt10: 3, "10_40": 4, "40_100": 5, gt100: 4 },
             goal: { judge: 5, community: 3, learn: 3 }, pi: { yes: 4, no: 3 } },
      bonus: { agent: 3, docker_img: 3, node: 3, content: 0, audience: 1 },
      hours: "20–40h", tags: ["SoloHost 赛道", "节点优势", "边际成本低"] },
    { id: "creator_tools", name: "中文创作者效率工具",
      desc: "字幕/配音/剪辑辅助，接 Pi 支付做按次付费。你的 FFmpeg + 本地 TTS 全链路是现成壁垒。",
      fit: { tech: { fullstack: 4, ai: 4, docker: 3, nocode: 1 }, time: { lt10: 2, "10_40": 4, "40_100": 5, gt100: 4 },
             goal: { judge: 4, community: 4, learn: 3 }, pi: { yes: 4, no: 2 } },
      bonus: { content: 4, agent: 1, docker_img: 1, node: 0, audience: 1 },
      hours: "30–60h", tags: ["现有技能复用", "变现路径清晰", "需内容受众"] },
    { id: "task_match", name: "Pi 生态任务撮合（对接 DataLab 思路）",
      desc: "把 Pi 的 KYC 人力池和企业 AI 数据任务撮合起来，蹭官方 2000 万 Pi 拉新预算。",
      fit: { tech: { fullstack: 5, ai: 3, docker: 3, nocode: 0 }, time: { lt10: 1, "10_40": 3, "40_100": 5, gt100: 5 },
             goal: { judge: 5, community: 5, learn: 2 }, pi: { yes: 5, no: 1 } },
      bonus: { audience: 4, agent: 2, docker_img: 1, node: 1, content: 0 },
      hours: "60h+", tags: ["战略对齐", "强依赖 Pi 受众", "高风险高回报"] },
    { id: "privacy_social", name: "隐私优先的匿名社交",
      desc: "2025 冠军 Blind_Lounge 的赛道。用 Pi 身份验证做反滥用，但竞争拥挤、留存难。",
      fit: { tech: { fullstack: 5, ai: 2, docker: 2, nocode: 0 }, time: { lt10: 1, "10_40": 2, "40_100": 4, gt100: 5 },
             goal: { judge: 4, community: 4, learn: 2 }, pi: { yes: 4, no: 1 } },
      bonus: { audience: 3, content: 1, agent: 0, docker_img: 0, node: 0 },
      hours: "80h+", tags: ["往届冠军赛道", "拥挤", "不推荐"] }
  ];

  function renderQuestions() {
    var html = "";
    QUESTIONS.forEach(function (q, idx) {
      html += '<div class="q"><span class="q-label"><span class="q-num">' + (idx + 1) + '</span>' + q.q + '</span><div class="opts">';
      q.opts.forEach(function (o) {
        var arr = state.answers[q.id] || [];
        var on = q.multi ? arr.indexOf(o.v) >= 0 : state.answers[q.id] === o.v;
        html += '<button class="opt' + (on ? ' sel' : '') + '" data-q="' + q.id + '" data-v="' + o.v + '">' + o.l + '</button>';
      });
      html += '</div></div>';
    });
    $("questions").innerHTML = html;
    Array.prototype.forEach.call(document.querySelectorAll(".opt"), function (b) {
      b.addEventListener("click", function () {
        var qid = b.getAttribute("data-q"), v = b.getAttribute("data-v");
        var q = QUESTIONS.filter(function (x) { return x.id === qid; })[0];
        if (q.multi) {
          var arr = state.answers[qid] || [];
          var i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v);
          state.answers[qid] = arr;
          if (arr.indexOf("none") >= 0 && arr.length > 1 && v === "none") state.answers[qid] = ["none"];
          else if (arr.length > 1) state.answers[qid] = arr.filter(function (x) { return x !== "none"; });
        } else state.answers[qid] = v;
        save(); renderQuestions();
      });
    });
  }

  function score(t) {
    var s = 0;
    ["tech", "time", "goal", "pi"].forEach(function (k) {
      var v = state.answers[k];
      if (v && t.fit[k] && t.fit[k][v]) s += t.fit[k][v];
    });
    var assets = state.answers.asset || [];
    assets.forEach(function (a) { if (t.bonus[a]) s += t.bonus[a]; });
    return Math.min(98, Math.round(25 + s * 1.9));
  }

  function runMatch() {
    var missing = QUESTIONS.filter(function (q) { return !state.answers[q.id] || (q.multi && !state.answers[q.id].length); });
    if (missing.length) { showToast("还有 " + missing.length + " 题没答"); return null; }
    var ranked = TOPICS.map(function (t) { return { t: t, sc: score(t) }; }).sort(function (a, b) { return b.sc - a.sc; });
    state.topTopic = { name: ranked[0].t.name, score: ranked[0].sc };
    var html = '<div class="result top"><div class="rank">头号推荐 · 最适合你</div><span class="score">' + ranked[0].sc + '<small>/100</small></span>' +
      '<h3>' + ranked[0].t.name + '</h3><p>' + ranked[0].t.desc + '</p>' +
      '<div class="chips"><span class="chip">预计 ' + ranked[0].t.hours + '</span>' + ranked[0].t.tags.map(function (x) { return '<span class="chip">' + x + '</span>'; }).join("") + '</div></div>';
    html += ranked.slice(1, 3).map(function (r, i) {
      return '<div class="result"><div class="rank">备选 ' + (i + 2) + '</div><span class="score">' + r.sc + '<small>/100</small></span>' +
        '<h3>' + r.t.name + '</h3><p>' + r.t.desc + '</p><div class="chips"><span class="chip">预计 ' + r.t.hours + '</span></div></div>';
    }).join("");
    $("matchResults").innerHTML = html;
    save(); renderDash();
    return ranked[0];
  }

  Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (b) {
    b.addEventListener("click", function () {
      Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (x) { x.classList.remove("on"); });
      Array.prototype.forEach.call(document.querySelectorAll(".view"), function (x) { x.classList.remove("on"); });
      b.classList.add("on"); $("v-" + b.getAttribute("data-v")).classList.add("on");
    });
  });

  $("checkinBtn").addEventListener("click", function () {
    var t = todayStr(); if (state.checkins.indexOf(t) < 0) state.checkins.push(t);
    save(); renderDash(); showToast("打卡成功，连续 " + streak() + " 天");
  });
  $("matchBtn").addEventListener("click", function () { if (runMatch()) showToast("匹配完成，结果已保存"); });
  $("resetQ").addEventListener("click", function () { state.answers = {}; state.topTopic = null; save(); renderQuestions(); $("matchResults").innerHTML = ""; renderDash(); });

  function onIncomplete(payment) { console.warn("[Pi] incomplete payment", payment && payment.identifier); }
  if (typeof window.Pi === "undefined") {
    $("loginBtn").textContent = "在 Pi Browser 中登录";
    $("saveTip").textContent = "进度保存在本机浏览器";
  } else {
    window.Pi.init({ version: "2.0", sandbox: false });
    $("loginBtn").addEventListener("click", function () {
      $("loginBtn").disabled = true;
      window.Pi.authenticate(["username"], onIncomplete).then(function (auth) {
        var u = auth.user || {};
        state.uid = u.uid || null;
        accessToken = auth.accessToken || null;
        $("uid").textContent = u.username ? "@" + u.username : "";
        $("loginBtn").style.display = "none"; $("logoutBtn").style.display = "inline-block";
        $("saveTip").textContent = "已登录 · 进度云同步";
        save();
        fetch("/api/progress", { method: "GET", headers: { "Authorization": "Bearer " + auth.accessToken } })
          .then(function (r) { return r.json(); }).then(function (d) {
            if (d && d.state) { state = d.state; save(); renderPlan(); renderDash(); renderQuestions(); }
          }).catch(function () {});
      }).catch(function () { $("loginBtn").disabled = false; showToast("登录取消或失败"); });
    });
    $("logoutBtn").addEventListener("click", function () {
      state.uid = null; accessToken = null; save();
      $("uid").textContent = ""; $("logoutBtn").style.display = "none"; $("loginBtn").style.display = "inline-block";
      $("saveTip").textContent = "进度保存在本机浏览器";
    });
  }

  renderPlan(); renderDash(); renderQuestions();
  if (state.answers.tech && state.answers.time && state.answers.goal) runMatch();
})();
