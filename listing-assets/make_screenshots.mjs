#!/usr/bin/env node
/**
 * 为 Next Edge 生成 Pi Ecosystem 上架截图（4 个标签页）。
 *
 * 为什么不直接截 localhost：WorkBuddy 的沙箱会隔离跨进程 localhost socket，
 * 截图进程访问不到本地服务器。所以走「直接调用 handler 渲染 HTML →
 * 写入临时目录 → file:// 协议交给 Chrome headless」这条路，绕开 socket。
 *
 * 用法:
 *   node make_screenshots.mjs
 *   PI_MCP_PROXY=... node make_screenshots.mjs   # 无关，本脚本不需要 MCP
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const PROJECT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const OUT_DIR = path.join(PROJECT, 'listing-assets', 'screenshots');
const TMP_DIR = path.join(os.tmpdir(), 'next-edge-shots');

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
];
const chrome = CHROME_CANDIDATES.find(p => fs.existsSync(p));
if (!chrome) {
  console.error('找不到 Chrome / Edge 可执行文件，无法截图。');
  process.exit(2);
}

// ---- 1. 用项目自身的 handler 渲染各标签页 HTML（不走 socket）----------------
const { handler } = require(path.join(PROJECT, 'server.js'));
fs.mkdirSync(TMP_DIR, { recursive: true });

function renderIndex() {
  return new Promise((resolve) => {
    const res = {
      statusCode: null, headers: {}, body: '',
      writeHead(s, h) { this.statusCode = s; Object.assign(this.headers, h || {}); },
      setHeader(k, v) { this.headers[k] = v; },
      removeHeader(k) { delete this.headers[k]; },
      end(b) { this.body = b; this._d && this._d(); },
    };
    res._d = () => resolve(Buffer.isBuffer(res.body) ? res.body.toString('utf8') : String(res.body || ''));
    handler({
      method: 'GET', url: '/', headers: { host: 'localhost' },
      on(ev, fn) { if (ev === 'end') setImmediate(fn); },
    }, res);
  });
}

const VIEWS = ['dash', 'match', 'plan', 'report'];
const HEIGHTS = { dash: 1400, match: 2000, plan: 2400, report: 2200 };
const FILES = {
  dash: '01-dashboard.png',
  match: '02-topic-matcher.png',
  plan: '03-46day-plan.png',
  report: '04-report-library-expanded.png',
};

/**
 * 结果态截图：预置一份合法画像答案，让匹配引擎跑出差异化评分。
 * 选项值必须严格取自 public/app.js 的 QUESTIONS 定义，否则全部匹配不到、
 * 三个选题都会是基础分 25（看起来像引擎坏了）。
 */
const PRESET_ANSWERS = {
  version: 1,
  answers: { tech: 'ai', time: '40_100', asset: ['agent', 'content'], goal: 'community', pi: 'yes' },
  checkins: [],
  topTopic: null,
};

const base = await renderIndex();
if (!base || !base.includes('pi-sdk.js')) {
  console.error('首页渲染异常，终止。');
  process.exit(1);
}

// 复制静态资源，让 file:// 能加载 /app.js
for (const f of ['app.js', 'en.html', 'privacy.html']) {
  fs.copyFileSync(path.join(PROJECT, 'public', f), path.join(TMP_DIR, f));
}

// ---- 2. 逐个标签页生成 HTML 副本（切 view.on + 展开 details）----------------
function buildPage(view, expandDetails) {
  let h = base;
  // /app.js 绝对路径在 file:// 下 404，改相对路径
  h = h.replace('src="/app.js"', 'src="app.js"');
  for (const v of VIEWS) {
    h = h.split(`<div class="view on" id="v-${v}">`).join(`<div class="view" id="v-${v}">`);
    h = h.split(`<button class="tab on" data-v="${v}">`).join(`<button class="tab" data-v="${v}">`);
  }
  h = h.replace(`<div class="view" id="v-${view}">`, `<div class="view on" id="v-${view}">`);
  h = h.replace(`<button class="tab" data-v="${view}">`, `<button class="tab on" data-v="${view}">`);
  if (expandDetails) h = h.replace(/<details/g, '<details open');
  return h;
}

/** 结果态：注入预置答案到 localStorage（必须在 app.js 之前） */
function buildResultPage() {
  let h = base.replace('src="/app.js"', 'src="app.js"');
  const inject = `<script>(function(){try{localStorage.setItem('nextedge_state_v1',${JSON.stringify(JSON.stringify(PRESET_ANSWERS))});}catch(e){}})();</script>`;
  h = h.replace('<script src="app.js"></script>', inject + '<script src="app.js"></script>');
  for (const v of VIEWS) {
    h = h.split(`<div class="view on" id="v-${v}">`).join(`<div class="view" id="v-${v}">`);
    h = h.split(`<button class="tab on" data-v="${v}">`).join(`<button class="tab" data-v="${v}">`);
  }
  h = h.replace('<div class="view" id="v-match">', '<div class="view on" id="v-match">');
  h = h.replace('<button class="tab" data-v="match">', '<button class="tab on" data-v="match">');
  return h;
}

// ---- 3. Chrome headless 截图 -------------------------------------------------
fs.mkdirSync(OUT_DIR, { recursive: true });
for (const view of VIEWS) {
  const html = buildPage(view, view === 'report');
  const htmlPath = path.join(TMP_DIR, `page_${view}.html`);
  fs.writeFileSync(htmlPath, html, 'utf8');
  const outPath = path.join(OUT_DIR, FILES[view]);
  execFileSync(chrome, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    `--window-size=1440,${HEIGHTS[view]}`,
    '--virtual-time-budget=9000',
    `--screenshot=${outPath}`,
    'file:///' + htmlPath.replace(/\\/g, '/'),
  ], { stdio: 'ignore' });
  const kb = (fs.statSync(outPath).size / 1024).toFixed(0);
  console.log(`  ${FILES[view]}  ${kb} KB`);
}

// 5) 匹配结果态（差异化评分 —— 上架最能体现个性化的一张）
{
  const htmlPath = path.join(TMP_DIR, 'page_match_result.html');
  fs.writeFileSync(htmlPath, buildResultPage(), 'utf8');
  const outPath = path.join(OUT_DIR, '05-matcher-result.png');
  execFileSync(chrome, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    '--window-size=1440,1900',
    '--virtual-time-budget=10000',
    `--screenshot=${outPath}`,
    'file:///' + htmlPath.replace(/\\/g, '/'),
  ], { stdio: 'ignore' });
  console.log(`  05-matcher-result.png  ${(fs.statSync(outPath).size / 1024).toFixed(0)} KB`);
}

console.log('截图完成 →', OUT_DIR);
