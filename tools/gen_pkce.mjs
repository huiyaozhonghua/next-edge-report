#!/usr/bin/env node
/**
 * gen_pkce.mjs —— 生成 Pi MCP OAuth 授权链接（PKCE S256）
 *
 * Pi 的 OAuth 授权必须由用户用「手机 Pi Browser 扫码批准」完成，agent 无法自己登录。
 * 本脚本生成授权链接 + verifier，等用户在手机批准拿到 code 后，用 verifier 换 token。
 *
 * 用法：
 *   node gen_pkce.mjs <client_id> <redirect_uri> [outDir]
 *
 * 例（WorkBuddy 的 client_id 与回调）：
 *   node gen_pkce.mjs \
 *     P7SIraXvRJb4KXu0Sj1iCrVI_8fAf3bF \
 *     "workbuddy://workbuddy/mcp/custom-mcp:pi-developers/oauth/callback"
 *
 * ⚠️ client_id 是按客户端注册的，不能混用 —— 混用会得到 invalid_client。
 *    需要自己的 client_id 时，走各自平台的 OAuth 客户端注册流程。
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const RESOURCE = "https://developers.minepi.com/mcp";
const SCOPE = "profile:read profile:write apps:read apps:write";

const [clientId, redirectUri, outDir] = process.argv.slice(2);
if (!clientId || !redirectUri) {
  console.error("用法: node gen_pkce.mjs <client_id> <redirect_uri> [outDir]");
  process.exit(1);
}
const dir = outDir || process.cwd();
fs.mkdirSync(dir, { recursive: true });

// ── PKCE (S256) ──
const verifier = crypto.randomBytes(32).toString("base64url");
const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
const state = crypto.randomBytes(16).toString("base64url");

const url =
  "https://developers.minepi.com/oauth/authorize" +
  "?response_type=code" +
  `&client_id=${encodeURIComponent(clientId)}` +
  `&state=${state}` +
  `&code_challenge=${challenge}` +
  "&code_challenge_method=S256" +
  `&redirect_uri=${encodeURIComponent(redirectUri)}` +
  `&scope=${encodeURIComponent(SCOPE)}` +
  `&resource=${encodeURIComponent(RESOURCE)}`;

// ── 生成授权页（给用户点开）──
const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>打开 Pi 授权页</title>
<style>
  body{font-family:-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;max-width:720px;margin:60px auto;padding:20px;color:#1a2233;line-height:1.7}
  h1{font-size:20px}
  .box{background:#f6f7fb;border:1px solid #e4e8f0;border-radius:12px;padding:18px;margin:18px 0}
  code{font-family:Consolas,Monaco,monospace;font-size:12px;word-break:break-all;color:#3f4bb5}
  a.btn{display:inline-block;background:#3f4bb5;color:#fff;padding:12px 22px;border-radius:9px;text-decoration:none;font-weight:600}
  .warn{background:#fdf0ec;border:1px solid #f3d5cb;border-radius:10px;padding:14px;font-size:13px}
</style>
</head>
<body>
<h1>打开 Pi 授权页</h1>
<p>点下面按钮，在打开的页面里用<strong>手机 Pi Browser 扫码批准</strong>。</p>
<a class="btn" href="${url}">打开 Pi 授权页 →</a>

<div class="box">
<strong>确认要点</strong>
<ul>
  <li>打开的网址必须以 <code>developers.minepi.com/oauth/authorize</code> 开头</li>
  <li>页面里不应出现 <code>accounts.pinet.com</code> 或「无法启动登录」</li>
  <li>如果没有出现扫码框，说明这个 client_id 与回调地址不匹配</li>
</ul>
</div>

<div class="warn">
<strong>安全提醒</strong>：只在你确认的 Pi 官方域名（minepi.com / pinet.com）页面扫码，
任何页面都不要输入助记词或私钥。
</div>

<p style="font-size:12px;color:#5b6478;margin-top:24px">
verifier 与 state 已保存到同目录的 <code>pkce.json</code>，换取 token 时要用。
</p>
</body>
</html>`;

fs.writeFileSync(path.join(dir, "pi-authorize.html"), html, "utf8");
fs.writeFileSync(
  path.join(dir, "pkce.json"),
  JSON.stringify({ client_id: clientId, redirect_uri: redirectUri, verifier, state, created: Date.now() }, null, 2),
  "utf8"
);

console.log("  ✅ 授权页   :", path.join(dir, "pi-authorize.html"));
console.log("  ✅ PKCE 状态:", path.join(dir, "pkce.json"));
console.log();
console.log("  授权链接（也可直接复制给用户）：");
console.log("  " + url);
console.log();
console.log("  下一步：");
console.log("   1. 让用户打开 pi-authorize.html（或上面的链接），用手机 Pi Browser 扫码批准");
console.log("   2. 拿到回调里的 code");
console.log("   3. POST https://developers.minepi.com/oauth/token 换 token：");
console.log("      grant_type=authorization_code");
console.log("      &code=<code>");
console.log(`      &client_id=${clientId}`);
console.log(`      &redirect_uri=${encodeURIComponent(redirectUri)}`);
console.log("      &code_verifier=" + verifier);
