#!/usr/bin/env node
/**
 * verify_deployment.js — 部署后自检
 *
 * 用法: node verify_deployment.js https://next-edge-report.pages.dev
 *
 * 检查项（对应 Pi 官方 Production App Access 的要求）：
 *   1. 首页 200
 *   2. /privacy.html 200（上架需要）
 *   3. /validation-key.txt 200 且内容与本地 key 精确相等（Pi 域名归属验证靠它）
 *   4. CSP 存在，且 frame-ancestors 含 PiNet 子域名
 *   5. X-Frame-Options 未设置（Pi Browser 用 iframe 加载，设了会阻断嵌入）
 *   6. CSP 含 style-src/img-src/media-src/font-src（否则页面在 Pi 里白屏）
 *   7. /api/progress 路由命中（Functions 生效；无 token 时应返回 401 而非 404）
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const base = process.argv[2] || "https://next-edge-report.pages.dev";
const KEYFILE = path.join(__dirname, "public", "validation-key.txt");

let pass = 0, fail = 0;
const ok = (m) => { console.log(`  [OK]   ${m}`); pass++; };
const bad = (m) => { console.log(`  [FAIL] ${m}`); fail++; };

function req(urlPath) {
  return new Promise((resolve) => {
    const u = new URL(urlPath, base);
    let hops = 0;
    const go = (target) => {
      hops += 1;
      if (hops > 5) {
        return resolve({ status: 0, headers: {}, body: "", error: "too many redirects" });
      }
      https.get(target, { headers: { "User-Agent": "next-edge-verify" } }, (res) => {
        // Cloudflare Pages 会把 /privacy.html 规范化成 /privacy（308），
        // 而 /privacy 又重定向回 /privacy/ —— 必须限制跳数，否则死循环。
        if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location && hops < 5) {
          res.resume();
          const next = new URL(res.headers.location, target).href;
          return go(next);
        }
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
      }).on("error", (e) => resolve({ status: 0, headers: {}, body: "", error: e.message }));
    };
    go(u.href);
  });
}

(async () => {
  console.log(`\n═══════════════════════════════════════════`);
  console.log(` 部署自检: ${base}`);
  console.log(`═══════════════════════════════════════════\n`);

  // 1. 首页
  console.log("── 1. 首页 ──");
  const idx = await req("/");
  if (idx.status === 200) ok(`GET / → 200 (${idx.body.length} bytes)`);
  else bad(`GET / → ${idx.status} ${idx.error || ""}`);
  if (idx.body.includes("pi-sdk.js")) ok("index.html 加载了 Pi SDK");
  else bad("index.html 缺少 pi-sdk.js —— Pi Browser 里 window.Pi 会是 undefined");

  // 2. 隐私政策
  console.log("\n── 2. 隐私政策 ──");
  const pv = await req("/privacy.html");
  if (pv.status === 200) ok("GET /privacy.html → 200");
  else bad(`GET /privacy.html → ${pv.status}`);

  // 3. validation-key.txt
  console.log("\n── 3. 域名归属验证关键文件 ──");
  const vk = await req("/validation-key.txt");
  if (vk.status === 200) {
    ok("GET /validation-key.txt → 200");
    if (fs.existsSync(KEYFILE)) {
      const local = fs.readFileSync(KEYFILE, "utf8");
      if (vk.body === local) ok("内容与本地 key 精确相等（无多余空白/换行）");
      else {
        bad(`内容不匹配 — 线上 ${vk.body.length} 字节 vs 本地 ${local.length} 字节`);
        console.log(`         线上首 32: ${JSON.stringify(vk.body.slice(0, 32))}`);
      }
    }
    if (!/[\r\n]\s*$/.test(vk.body)) ok("无尾随换行");
    else bad("有尾随换行 —— Pi 要求 body 精确等于 key");
  } else {
    bad(`GET /validation-key.txt → ${vk.status} —— Pi 域名验证会失败`);
  }

  // 4/5/6. 安全头
  console.log("\n── 4. Pi Browser 嵌入相关安全头 ──");
  const csp = idx.headers["content-security-policy"] || "";
  if (csp) ok("Content-Security-Policy 已设置");
  else bad("缺少 CSP");
  if (csp.includes("frame-ancestors")) ok("CSP 含 frame-ancestors");
  else bad("CSP 缺 frame-ancestors");
  if (csp.includes("https://*.pinet.com")) ok("frame-ancestors 允许 PiNet 子域名");
  else bad("frame-ancestors 未允许 https://*.pinet.com —— PiNet 嵌入会被拒");
  if (!idx.headers["x-frame-options"]) ok("未设置 X-Frame-Options（正确）");
  else bad(`X-Frame-Options: ${idx.headers["x-frame-options"]} —— 会阻断 Pi Browser 的 iframe 嵌入`);
  for (const d of ["style-src", "img-src", "media-src", "font-src"]) {
    if (csp.includes(d)) ok(`CSP 含 ${d}`);
    else bad(`CSP 缺 ${d} —— 页面在 Pi Browser 里可能白屏`);
  }

  // 7. Functions 路由
  console.log("\n── 5. Functions 路由 ──");
  const api = await req("/api/progress");
  if (api.status === 401) ok("GET /api/progress → 401（路由命中，鉴权生效）");
  else if (api.status === 404) bad("GET /api/progress → 404 —— Pages Functions 没生效");
  else ok(`GET /api/progress → ${api.status}（路由已命中）`);

  console.log(`\n═══════════════════════════════════════════`);
  console.log(fail === 0 ? `  全部通过 (${pass}) —— 可以去 Pi 侧验证域名归属` : `  ${fail} 项失败 / ${pass} 项通过`);
  console.log(`═══════════════════════════════════════════\n`);
  process.exit(fail === 0 ? 0 : 1);
})();
