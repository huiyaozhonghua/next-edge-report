#!/usr/bin/env bash
# Cloudflare token 权限探测 —— 精确告诉你缺哪个权限
#
# 用法: bash probe_cf_perms.sh <token>
#
# 逐个测试部署链路真正需要的 API 端点，输出明确的缺项清单。

set -uo pipefail

export HTTP_PROXY=http://127.0.0.1:17891
export HTTPS_PROXY=http://127.0.0.1:17891
export http_proxy=http://127.0.0.1:17891
export https_proxy=http://127.0.0.1:17891

TOKEN="${1:-}"
if [ -z "$TOKEN" ] && [ -f "$TEMP/cf_token.txt" ]; then
  TOKEN=$(cat "$TEMP/cf_token.txt" 2>/dev/null)
fi
if [ -z "$TOKEN" ]; then
  echo "用法: bash probe_cf_perms.sh <token>"
  exit 1
fi

ACC="38e848a7a5031d103a244d52490c5645"
API="https://api.cloudflare.com/client/v4"
H=(-H "Authorization: Bearer $TOKEN" -H "User-Agent: probe")

echo "═══════════════════════════════════════════"
echo " Cloudflare 权限探测"
echo "═══════════════════════════════════════════"
echo

probe() {
  local label="$1" path="$2" need="$3"
  local resp code ok
  resp=$(curl -s -m 25 "${H[@]}" "$API$path")
  code=$(echo "$resp" | python -c "
import sys,json
try:
    d=json.load(sys.stdin)
    print('OK' if d.get('success') else 'FAIL:'+str((d.get('errors') or [{}])[0].get('message','?'))[:60])
except Exception: print('PARSE_ERR')" 2>/dev/null)
  if [ "$code" = "OK" ]; then
    printf "  ✅ %-34s %s\n" "$label" "$need"
    return 0
  else
    printf "  ❌ %-34s %s\n      → %s\n" "$label" "$need" "$code"
    return 1
  fi
}

FAIL=0
echo "── 部署链路 ──"
probe "读取账户" "/accounts/$ACC" "账户级访问" || FAIL=1
probe "列出 Pages 项目" "/accounts/$ACC/pages/projects" "Pages:Read（Write 隐含）" || FAIL=1
probe "列出 KV 命名空间" "/accounts/$ACC/storage/kv/namespaces" "Workers KV Storage:Read" || {
  echo "      （可选 —— 跳过 KV 也能部署，进度同步会降级到 localStorage）"
}
echo

echo "── 实际需要的写入能力 ──"
echo "  · Pages:Write              → 创建 Pages 项目、触发部署"
echo "  · Workers KV Storage:Write → 建 KV 命名空间（可选）"
echo

if [ "$FAIL" -eq 0 ]; then
  echo "═══════════════════════════════════════════"
  echo " 权限足够 —— 可以部署"
  echo "   bash listing-assets/deploy_and_publish.sh"
  echo "═══════════════════════════════════════════"
else
  echo "═══════════════════════════════════════════"
  echo " 权限不足 —— 见上方 ❌ 标记的项"
  echo "   回到 Cloudflare 令牌编辑页补权限"
  echo "═══════════════════════════════════════════"
fi
