#!/usr/bin/env bash
# 作战台部署到 Cloudflare Pages —— 一键脚本
#
# 前置：
#   1. 已注册 Cloudflare 账号 https://dash.cloudflare.com/sign-up
#   2. 已执行过一次 `wrangler login`（浏览器授权）
#
# 用法: bash deploy_pages.sh [项目名]
#   项目名默认 next-edge-report

set -uo pipefail

PROJ="${1:-next-edge-report}"
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 2

export HTTP_PROXY=http://127.0.0.1:17891
export HTTPS_PROXY=http://127.0.0.1:17891
export http_proxy=http://127.0.0.1:17891
export https_proxy=http://127.0.0.1:17891

echo "═══════════════════════════════════════════"
echo " 部署 Next Edge Report → Cloudflare Pages"
echo "   项目名: $PROJ"
echo "═══════════════════════════════════════════"
echo

# ---------- 1) 登录检查 ----------
if ! wrangler whoami >/dev/null 2>&1; then
  echo "❌ 未登录 Cloudflare。执行："
  echo "     wrangler login"
  echo "   （会打开浏览器，点 Allow 授权）"
  exit 1
fi
echo "✅ Cloudflare 已登录"
wrangler whoami 2>&1 | grep -iE "account|email|Account ID" | head -3 | sed 's/^/   /'
echo

# ---------- 2) 静态文件检查 ----------
echo "→ 检查静态资源"
NEEDED=(public/index.html public/app.js public/en.html public/privacy.html public/_headers)
MISSING=0
for f in "${NEEDED[@]}"; do
  if [ -f "$f" ]; then
    echo "   ✅ $f"
  else
    echo "   ❌ $f 缺失"; MISSING=1
  fi
done
[ "$MISSING" -eq 1 ] && exit 1
echo

# ---------- 3) 创建 KV namespace（进度同步用）----------
echo "→ 准备 KV namespace (PROGRESS_KV)"
KV_LIST=$(wrangler kv namespace list 2>/dev/null | grep -oE "id: [a-f0-9]+" | head -1 | cut -d' ' -f2)
if [ -z "$KV_LIST" ]; then
  echo "   创建中…"
  wrangler kv namespace create NEXT_EDGE_PROGRESS 2>&1 | tail -3 | sed 's/^/   /'
  KV_LIST=$(wrangler kv namespace list 2>/dev/null | grep -oE "id: [a-f0-9]+" | head -1 | cut -d' ' -f2)
fi
if [ -n "$KV_LIST" ]; then
  echo "   ✅ KV id: $KV_LIST"
  # 写入 wrangler.toml
  if ! grep -q "^\[\[kv_namespaces\]\]" wrangler.toml 2>/dev/null; then
    cat >> wrangler.toml <<EOF

[[kv_namespaces]]
binding = "PROGRESS_KV"
id = "$KV_LIST"
EOF
    echo "   ✅ 已写入 wrangler.toml"
  fi
else
  echo "   ⚠️ KV 创建失败 —— 进度同步会不可用（App 核心功能不受影响）"
fi
echo

# ---------- 4) 部署 ----------
echo "→ 部署静态资源到 Pages"
echo "   （首次部署会创建项目，输出 https://<项目名>.pages.dev）"
wrangler pages deploy public --project-name="$PROJ" --branch=main 2>&1 | tail -12 | sed 's/^/   /'
echo

# ---------- 5) 结果 ----------
URL="https://${PROJ}.pages.dev"
echo "═══════════════════════════════════════════"
echo " 部署完成"
echo "   URL: $URL"
echo "═══════════════════════════════════════════"
echo
echo "下一步（在 Pi 侧操作）："
echo "  1. 验证 URL 可访问："
echo "     curl -sI $URL | head -5"
echo
echo "  2. 取得 validation key 并部署到 $URL/validation-key.txt"
echo "     （我会通过 MCP 调用 verify_app_url_ownership 拿到 key）"
echo
echo "  3. 设置 frontend_url 并验证归属："
echo "     update_app(app_id, frontend_url=$URL)"
echo "     verify_app_url_ownership(app_id)"
echo
echo "  4. 设置隐私政策 URL："
echo "     update_app(app_id, privacy_policy_url=$URL/privacy.html)"
