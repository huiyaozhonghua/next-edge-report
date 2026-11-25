#!/usr/bin/env bash
# SoloHost 包端到端本地实跑验证
#
# 复现 Pi Desktop 的实际安装流程：validator → compose config → up -d → 探活 →
# 验证安装表单字段真的生效 → 检查 origin/frame → 清理。
#
# 用法:
#   bash verify_solohost.sh <package-dir> [host-port]
#   bash verify_solohost.sh <package-dir> 18632
#
# 退出码: 0 全部通过 | 1 有环节失败
#
# 关键经验（2026-11-15 / 2026-11-25 两次实测）:
#   1. 探活必须用 --retry-all-errors。Grafana 首启跑 SQLite migration，
#      只重试 connection-refused 会在超时类错误上直接失败（假阴性）。
#   2. X-Frame-Options 不是内嵌白屏的原因。Pi Desktop 的 App 标签页是顶层
#      webview 导航，不受该头约束。Origin 头也不影响响应。
#   3. 白屏优先排查「首启时机 / 刷新」，再考虑浏览器安全策略。
#   4. 端口冲突会报 "port is already allocated" —— 换一个 host 端口即可。
#   5. 用独立 compose project 名，避免污染 Pi Desktop 管理的实例。

set -uo pipefail

PKG_DIR="${1:?用法: bash verify_solohost.sh <package-dir> [host-port]}"
HOST_PORT="${2:-18642}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT="solohost-verify-$$"
RUN_DIR="$(mktemp -d)"
FAILURES=0

step() { printf '\n\033[1m▸ %s\033[0m\n' "$1"; }
ok()   { printf '  \033[32m[OK]\033[0m %s\n' "$1"; }
bad()  { printf '  \033[31m[FAIL]\033[0m %s\n' "$1"; FAILURES=$((FAILURES+1)); }

cleanup() {
  docker compose -p "$PROJECT" -f "$RUN_DIR/docker-compose.yml" down -v >/dev/null 2>&1
  rm -rf "$RUN_DIR"
}
trap cleanup EXIT

# ---------- 前置 ----------
step "前置检查"
command -v docker >/dev/null || { echo "  docker CLI 不存在"; exit 2; }
if docker info >/dev/null 2>&1; then
  ok "Docker daemon 就绪 ($(docker version --format '{{.ServerVersion}}' 2>/dev/null))"
else
  bad "Docker daemon 未运行 —— 先启动 Docker Desktop"
  exit 2
fi
[ -f "$PKG_DIR/docker-compose.yml" ] || { bad "缺 docker-compose.yml"; exit 2; }
[ -f "$PKG_DIR/config_options.yml" ] || { bad "缺 config_options.yml"; exit 2; }
ok "包文件齐全: $PKG_DIR"

# ---------- 步骤1：官方 validator ----------
step "步骤 1/6 — 官方 validator（发布前权威 gate）"
if python "$SCRIPT_DIR/validate_solohost.py" "$PKG_DIR" 2>&1 | sed 's/^/  /'; then
  ok "validator 通过"
else
  bad "validator 未通过 —— 不要往下走"
  exit 1
fi

# ---------- 步骤2：生成运行副本（换端口，避免与 Pi Desktop 实例冲突） ----------
step "步骤 2/6 — 生成运行副本（host 端口 → $HOST_PORT）"
cp "$PKG_DIR/docker-compose.yml" "$RUN_DIR/docker-compose.yml"
cp "$PKG_DIR/config_options.yml" "$RUN_DIR/config_options.yml"
# SOLOHOST_LOCAL_IMAGE 可把镜像名换成本地已构建的 tag（镜像未推 GHCR 时用）
if [ -n "${SOLOHOST_LOCAL_IMAGE:-}" ]; then
  python - "$RUN_DIR/docker-compose.yml" "$SOLOHOST_LOCAL_IMAGE" <<'PY'
import re, sys
p, local = sys.argv[1], sys.argv[2]
s = open(p, encoding='utf-8').read()
s = re.sub(r'image:\s*ghcr\.io/\S+', f'image: {local}', s)
open(p, 'w', encoding='utf-8').write(s)
print(f"  镜像替换为本地: {local}")
PY
fi
python - "$RUN_DIR/docker-compose.yml" "$HOST_PORT" <<'PY'
import re, sys
p, port = sys.argv[1], sys.argv[2]
s = open(p, encoding='utf-8').read()
# 只改 loopback 绑定的 HOST 端口，保留 CONTAINER 端口
s2 = re.sub(r'("127\.0\.0\.1:)(\d+)(:\d+")', lambda m: m.group(1)+port+m.group(3), s)
open(p, 'w', encoding='utf-8').write(s2)
print(f"  端口替换: {s != s2}")
PY
ok "运行副本: $RUN_DIR"

# ---------- 步骤3：compose config ----------
step "步骤 3/6 — compose config 渲染校验"
if docker compose -p "$PROJECT" -f "$RUN_DIR/docker-compose.yml" config >/dev/null 2>&1; then
  ok "compose 配置可解析"
else
  bad "compose config 失败"
  docker compose -p "$PROJECT" -f "$RUN_DIR/docker-compose.yml" config 2>&1 | head -20
  exit 1
fi

# ---------- 步骤4：up -d ----------
step "步骤 4/6 — 启动容器"
# 需要 .env 就用占位值
if ! [ -f "$RUN_DIR/.env" ]; then
  python - "$PKG_DIR/config_options.yml" "$RUN_DIR/.env" <<'PY'
import re, sys
cfg, out = sys.argv[1], sys.argv[2]
s = open(cfg, encoding='utf-8').read()
lines = []
for m in re.finditer(r'- name:\s*(\w+)(.*?)(?=\n  - name:|\Z)', s, re.S):
    name, body = m.group(1), m.group(2)
    t = (re.search(r'type:\s*(\w+)', body) or [None,'text'])[1]
    d = (re.search(r'default:\s*"?([^"\n]+)"?', body) or [None,''])[1]
    if t == 'password':
        lines.append(f"{name}=dummy-verify-only")
    elif d:
        lines.append(f"{name}={d}")
    else:
        lines.append(f"{name}=dummy")
open(out,'w',encoding='utf-8').write("\n".join(lines)+"\n")
print("  生成占位 .env:", len(lines), "个变量")
PY
fi
if docker compose -p "$PROJECT" -f "$RUN_DIR/docker-compose.yml" up -d 2>&1 | tail -3; then
  ok "容器已启动 (project=$PROJECT)"
else
  bad "启动失败 —— 检查端口是否被占用"
  exit 1
fi

# ---------- 步骤5：探活 ----------
step "步骤 5/6 — 探活（--retry-all-errors，容忍首启 migration）"
CODE=$(curl -s -m 90 --retry-all-errors --retry 30 --retry-delay 3 \
  -o /dev/null -w "%{http_code}" "http://127.0.0.1:$HOST_PORT/" 2>/dev/null)
if [ "$CODE" = "200" ] || [ "$CODE" = "302" ] || [ "$CODE" = "401" ]; then
  ok "服务响应 HTTP $CODE"
else
  bad "探活失败 (HTTP $CODE)"
fi

# ---------- 步骤6：契约逐项核对 ----------
step "步骤 6/6 — 契约逐项核对"
check_compose() {
  local name="$1" pattern="$2"
  if grep -qE "$pattern" "$RUN_DIR/docker-compose.yml"; then
    ok "$name"
  else
    bad "$name"
  fi
}
check_compose "每个 service 有 image:"        '^\s+image:\s*\S'
check_compose "UI 标签 pi.ui.primary"        'pi\.ui\.primary:\s*"true"'
check_compose "loopback 端口绑定"            '"?127\.0\.0\.1:[0-9]+:[0-9]+"?'
if grep -qE '^\s+build:' "$RUN_DIR/docker-compose.yml"; then bad "禁止 build:"; else ok "无 build:"; fi
if grep -qE '^\s+(privileged|cap_add|security_opt|devices|extends):' "$RUN_DIR/docker-compose.yml"; then
  bad "存在被禁构造 (privileged/cap_add/security_opt/devices/extends)"
else ok "无被禁构造"; fi
if grep -qE 'network_mode:\s*host|network_mode:\s*container:' "$RUN_DIR/docker-compose.yml"; then
  bad "禁止 host/container network_mode"
else ok "network_mode 合规"; fi
if grep -qE '^\s+-\s*["'"'"']?(/|\./)[^ ]*["'"'"']?\s*:' "$RUN_DIR/docker-compose.yml"; then
  bad "疑似 bind mount（应改用 named volume）"
else ok "无 host bind mount"; fi

# 变量声明检查
python - "$RUN_DIR/docker-compose.yml" "$RUN_DIR/config_options.yml" <<'PY'
import re, sys
comp, cfg = sys.argv[1], sys.argv[2]
c = open(comp, encoding='utf-8').read()
g = open(cfg, encoding='utf-8').read()
used = set(re.findall(r'\$\{([A-Za-z_][A-Za-z0-9_]*)\}', c))
declared = set(re.findall(r'- name:\s*([A-Za-z_][A-Za-z0-9_]*)', g))
missing = used - declared
if missing:
    print(f"  \033[31m[FAIL]\033[0m 未声明变量: {sorted(missing)}")
    sys.exit(1)
print(f"  \033[32m[OK]\033[0m 变量全部已声明 ({len(used)} 个)")
PY
[ $? -ne 0 ] && FAILURES=$((FAILURES+1))

# 顶层键封闭集合
python - "$RUN_DIR/config_options.yml" <<'PY'
import sys, re
allowed = {'title','eyebrow','description','footer_hint','output_file','after_save','fixed_values','fields'}
s = open(sys.argv[1], encoding='utf-8').read()
top = set()
for line in s.splitlines():
    if line and not line[0].isspace() and ':' in line:
        k = line.split(':',1)[0].strip()
        if k and not k.startswith('#'):
            top.add(k)
extra = top - allowed
if extra:
    print(f"  \033[31m[FAIL]\033[0m 非法顶层键: {sorted(extra)}")
    sys.exit(1)
print(f"  \033[32m[OK]\033[0m 顶层键合规 {sorted(top)}")
PY
[ $? -ne 0 ] && FAILURES=$((FAILURES+1))

# ---------- 汇总 ----------
printf '\n\033[1m%s\033[0m\n' "══════ 结果 ══════"
if [ "$FAILURES" -eq 0 ]; then
  printf '\033[32m全部通过\033[0m —— 包可进入 Pi Desktop 发布流程\n'
  exit 0
else
  printf '\033[31m%d 项失败\033[0m —— 先修好再发布\n' "$FAILURES"
  exit 1
fi
