#!/usr/bin/env bash
# 验证 Cloudflare API token 是否可用（不部署，只检查）
#
# 用法:
#   bash check_cf_token.sh <token>
#   或 token 已写入 $TEMP/cf_token.txt 时直接 bash check_cf_token.sh
#
# 会检查:
#   1. token 是否有效
#   2. 能否读到账户列表
#   3. 能否读到 Pages 项目（决定部署能不能成功）
#   4. 能否读到 KV 命名空间（可选权限）

set -uo pipefail

export HTTP_PROXY=http://127.0.0.1:17891
export HTTPS_PROXY=http://127.0.0.1:17891
export http_proxy=http://127.0.0.1:17891
export https_proxy=http://127.0.0.1:17891

TOKEN="${1:-}"
if [ -z "$TOKEN" ] && [ -f "$TEMP/cf_token.txt" ]; then
  TOKEN=$(cat "$TEMP/cf_token.txt" 2>/dev/null)
fi
# 显式指定账户 ID —— 账户 token 无需 "Account Settings:Read" 权限
export CLOUDFLARE_ACCOUNT_ID="38e848a7a5031d103a244d52490c5645"
if [ -z "$TOKEN" ]; then
  echo "用法: bash check_cf_token.sh <token>"
  echo "  或先把 token 写入 \$TEMP\\cf_token.txt"
  exit 1
fi

echo "═══════════════════════════════════════════"
echo " Cloudflare token 检查"
echo "═══════════════════════════════════════════"
echo

# 1) token 有效性
# 注意：账户级 token（cfat_）不能用 /user/tokens/verify —— 那个端点只认用户级
#       token（cfut_），对 cfat_ 会返回 "Invalid API Token"。账户 token 用账户端点验证。
V=$(curl -s -m 25 -H "Authorization: Bearer $TOKEN" -H "User-Agent: check" \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID")
if echo "$V" | grep -q '"success":true'; then
  echo "✅ 1. token 有效（账户级）"
else
  echo "❌ 1. token 无效或无权访问账户"
  echo "$V" | python -c "
import sys,json
try:
    d=json.load(sys.stdin)
    for e in d.get('errors',[]): print('     ', e.get('code'), e.get('message'))
except Exception: print('     ', sys.stdin.read()[:200])
" 2>/dev/null
  exit 1
fi

# 2) 账户 —— 账户 token 已绑定账户，直接用已知 ID（不需要 Account Settings:Read）
ACC_ID="$CLOUDFLARE_ACCOUNT_ID"
ACC=$(curl -s -m 25 -H "Authorization: Bearer $TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/$ACC_ID")
if echo "$ACC" | grep -q '"success":true'; then
  ACC_NAME=$(echo "$ACC" | python -c "
import sys,json
try: print((json.load(sys.stdin).get('result') or {}).get('name',''))
except Exception: print('')" 2>/dev/null)
  echo "✅ 2. 账户可访问: ${ACC_NAME:-（名称未返回）}"
  echo "      id: $ACC_ID"
else
  echo "⚠️ 2. 访问账户失败 —— token 的资源范围可能没选到这个账户"
  echo "$ACC" | python -c "
import sys,json
try:
    d=json.load(sys.stdin)
    for e in d.get('errors',[]): print('     ', e.get('code'), e.get('message'))
except Exception: pass" 2>/dev/null
  exit 1
fi

# 3) Pages 权限
P=$(curl -s -m 25 -H "Authorization: Bearer $TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/$ACC_ID/pages/projects")
if echo "$P" | grep -q '"success":true'; then
  N=$(echo "$P" | python -c "
import sys,json
try: print(len(json.load(sys.stdin).get('result') or []))
except Exception: print('?')" 2>/dev/null)
  echo "✅ 3. Pages 权限可用（现有项目 $N 个）"
else
  echo "❌ 3. Pages 权限不可用:"
  echo "$P" | python -c "
import sys,json
try:
    d=json.load(sys.stdin)
    for e in d.get('errors',[]): print('     ', e.get('code'), e.get('message'))
except Exception: pass" 2>/dev/null
  echo "     → 补权限: Account | Cloudflare Pages | Edit"
  exit 1
fi

# 4) KV 权限（可选）
K=$(curl -s -m 25 -H "Authorization: Bearer $TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/$ACC_ID/storage/kv/namespaces")
if echo "$K" | grep -q '"success":true'; then
  echo "✅ 4. KV 权限可用"
else
  echo "⚠️ 4. KV 权限不可用（可选，不影响部署）"
  echo "     → 进度同步会降级到 localStorage，App 核心功能不受影响"
fi

echo
echo "═══════════════════════════════════════════"
echo " 可以部署了。执行："
echo "   bash listing-assets/deploy_and_publish.sh"
echo "═══════════════════════════════════════════"
