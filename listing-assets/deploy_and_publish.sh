#!/usr/bin/env bash
# 一键部署作战台到 Cloudflare Pages + 完成 Pi 侧全部操作
#
# 用法:
#   bash deploy_and_publish.sh <cloudflare-api-token>
#   或先 export CLOUDFLARE_API_TOKEN=xxx 再 bash deploy_and_publish.sh
#
# 脚本会：
#   1. 验证 token
#   2. 创建 KV namespace（进度同步用，失败不阻断）
#   3. 部署 public/ 到 Pages
#   4. 实测验证（含 validation-key.txt 精确匹配）
#   5. MCP: verify_app_url_ownership → 拿 pi_url
#   6. MCP: update_app(privacy_policy_url)
#
# 注意：token 不会写入任何项目文件；用完请 unset

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export HTTP_PROXY=http://127.0.0.1:17891
export HTTPS_PROXY=http://127.0.0.1:17891
export http_proxy=http://127.0.0.1:17891
export https_proxy=http://127.0.0.1:17891

PROJ="next-edge-report"
APP_ID="6b0672d68f5d0b3dd1cbb3d9"
MCP_DIR="C:/Users/HUAWEI/AppData/Local/Temp/pi"

# token 优先级：命令行参数 > 环境变量 > 临时文件
TOKEN="${1:-${CLOUDFLARE_API_TOKEN:-}}"
if [ -z "$TOKEN" ] && [ -f "$TEMP/cf_token.txt" ]; then
  TOKEN=$(cat "$TEMP/cf_token.txt" 2>/dev/null)
fi
if [ -z "$TOKEN" ]; then
  echo "❌ 没有找到 Cloudflare API token"
  echo "   用法: bash deploy_and_publish.sh <token>"
  echo "   或 export CLOUDFLARE_API_TOKEN=xxx"
  echo "   或写入 $TEMP/cf_token.txt"
  exit 1
fi
export CLOUDFLARE_API_TOKEN="$TOKEN"
# 显式指定账户 ID —— 账户 token 不需要 Account Settings:Read 权限
export CLOUDFLARE_ACCOUNT_ID="38e848a7a5031d103a244d52490c5645"

echo "═══════════════════════════════════════════"
echo " 部署 Next Edge Report → Cloudflare Pages"
echo "═══════════════════════════════════════════"
echo

# ---------- 1. 验证 token ----------
echo "▸ 1/6 验证 token"
# 注意：账户级 token（cfat_）不能用 /user/tokens/verify 验证 ——
#       那个端点只认用户级 token（cfut_），对 cfat_ 会返回 "Invalid API Token"。
#       账户 token 用账户端点验证。
ACC_ID="38e848a7a5031d103a244d52490c5645"
VERIFY=$(curl -s -m 25 -H "Authorization: Bearer $TOKEN" -H "User-Agent: deploy" \
  "https://api.cloudflare.com/client/v4/accounts/$ACC_ID")
if echo "$VERIFY" | grep -q '"success":true'; then
  ACC_NAME=$(echo "$VERIFY" | python -c "
import sys,json
try: print((json.load(sys.stdin).get('result') or {}).get('name',''))
except Exception: print('')" 2>/dev/null)
  echo "  ✅ token 有效（账户：${ACC_NAME:-未知}）"
else
  echo "  ❌ token 无效或无权访问账户:"
  echo "$VERIFY" | python -c "
import sys,json
try:
    d=json.load(sys.stdin)
    for e in d.get('errors',[]): print('     ', e.get('code'), e.get('message'))
except Exception: print('     ', sys.stdin.read()[:200])" 2>/dev/null
  exit 1
fi

# ---------- 2. KV namespace ----------
echo "▸ 2/6 准备 KV namespace"
KV_ID=$(wrangler kv namespace list 2>/dev/null | grep -oE "id: [a-f0-9]+" | head -1 | cut -d' ' -f2)
if [ -z "$KV_ID" ]; then
  wrangler kv namespace create NEXT_EDGE_PROGRESS >/dev/null 2>&1
  KV_ID=$(wrangler kv namespace list 2>/dev/null | grep -oE "id: [a-f0-9]+" | head -1 | cut -d' ' -f2)
fi
if [ -n "$KV_ID" ]; then
  echo "  ✅ KV id: $KV_ID"
  if ! grep -q "^\[\[kv_namespaces\]\]" wrangler.toml 2>/dev/null; then
    printf '\n[[kv_namespaces]]\nbinding = "PROGRESS_KV"\nid = "%s"\n' "$KV_ID" >> wrangler.toml
    echo "  ✅ 已写入 wrangler.toml"
  fi
else
  echo "  ⚠️ KV 创建失败 —— 进度同步不可用（核心功能不受影响）"
fi

# ---------- 3. 部署 ----------
echo "▸ 3/6 部署静态资源"
DEPLOY_OUT=$(wrangler pages deploy public --project-name="$PROJ" --branch=main --commit-dirty=true 2>&1)
echo "$DEPLOY_OUT" | tail -6 | sed 's/^/  /'
if echo "$DEPLOY_OUT" | grep -qiE "Deployment complete|https://[a-z0-9.-]*\.pages\.dev"; then
  echo "  ✅ 部署成功"
else
  echo "  ❌ 部署失败"
  exit 1
fi

URL="https://${PROJ}.pages.dev"
echo
echo "  站点地址: $URL"

# ---------- 4. 自检 ----------
echo "▸ 4/6 部署自检"
node verify_deployment.js "$URL" 2>&1 | sed 's/^/  /'
VERIFY_RC=${PIPESTATUS[0]}

# ---------- 5. Pi 侧：验证归属 ----------
echo "▸ 5/6 Pi 侧：验证域名归属"
cd "$MCP_DIR" || exit 1
VERIFY_OUT=$(node mcpcli.mjs call verify_app_url_ownership "{\"app_id\":\"$APP_ID\"}" 2>&1)
echo "$VERIFY_OUT" | head -25 | sed 's/^/  /'
if echo "$VERIFY_OUT" | grep -qE '"pi_url"|"pinet_subdomain"'; then
  echo "  ✅ 归属验证通过 —— 已分配 PiNet 子域名"
  PI_URL=$(echo "$VERIFY_OUT" | python -c "
import sys,json
try:
    d=json.load(sys.stdin)
    app=d.get('app') or d
    print(app.get('pi_url') or app.get('pinet_subdomain') or '')
except Exception: print('')" 2>/dev/null)
  [ -n "$PI_URL" ] && echo "     pi_url: $PI_URL"
else
  echo "  ⚠️ 未拿到 pi_url —— 看上面的输出定位原因"
fi

# ---------- 6. Pi 侧：隐私政策 ----------
echo "▸ 6/6 Pi 侧：设置隐私政策 URL"
POLICY_OUT=$(node mcpcli.mjs call update_app "{\"app_id\":\"$APP_ID\",\"privacy_policy_url\":\"$URL/privacy.html\"}" 2>&1)
if echo "$POLICY_OUT" | grep -q '"privacy_policy_url": "https://'; then
  echo "  ✅ privacy_policy_url 已设置"
  echo "$POLICY_OUT" | grep -oE '"privacy_policy_url": "[^"]*"' | head -1 | sed 's/^/     /'
else
  echo "  ⚠️ 未能确认隐私政策 URL —— 手动检查："
  echo "$POLICY_OUT" | head -12 | sed 's/^/     /'
fi

# ---------- 清理 ----------
unset CLOUDFLARE_API_TOKEN
if [ -f "$TEMP/cf_token.txt" ]; then
  rm -f "$TEMP/cf_token.txt"
  echo
  echo "🔒 已删除临时 token 文件"
fi

cat <<EOF

═══════════════════════════════════════════
 完成
═══════════════════════════════════════════
 站点: $URL
 部署自检: $([ $VERIFY_RC -eq 0 ] && echo "全部通过" || echo "有失败项，见上")

 下一步（在 Pi Developer Console）：
  1. 打开 https://developers.minepi.com/devconsole/my-apps/$APP_ID/listing
  2. 填 subtitle / category / language
  3. 提交审核

 如果上面第 5 步拿到了 pi_url，记住它 —— 提交表单要填。
EOF
