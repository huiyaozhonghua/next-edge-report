#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SoloHost 包校验器（封装官方 validate_api.py）

官方脚本的坑（已在 2026-11-15 实测踩过）：Python urllib 不读系统代理，
失效的 HTTP_PROXY 会直接打中 urllib 导致超时。本脚本在进程级清空代理变量
并强制直连，同时提供更清晰的输出。

用法:
  python validate_solohost.py <package-dir> [<package-dir> ...]
  python validate_solohost.py --preview-env <package-dir> [KEY=VALUE ...]
  python validate_solohost.py --examples        # 校验官方三个示例做对照

退出码: 0 全通过 | 1 有包未通过 | 2 用法/IO 错误 | 3 无法连接 API | 4 被限流
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request

HOST = os.environ.get(
    "SOLOHOST_API",
    "https://solohost-nohcqud24xwnsmna.staging.piappengine.com",
).rstrip("/")
VALIDATE_URL = HOST + "/api/apps/validate"
PREVIEW_ENV_URL = HOST + "/api/apps/preview-env"

# 进程级清空失效代理 —— 官方脚本和裸 urllib 都会被这个坑到
for _v in ("HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy", "ALL_PROXY", "all_proxy"):
    os.environ.pop(_v, None)

HERE = os.path.dirname(os.path.abspath(__file__))


def _post(url, payload, timeout=90):
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url, data=body, headers={"Content-Type": "application/json"}
    )
    return urllib.request.urlopen(req, timeout=timeout).read().decode("utf-8")


def _post_retry(url, payload, attempts=4):
    """冷启动 API 可能短暂 502 —— 传输层重试，不是校验重试。"""
    last = None
    for i in range(attempts):
        try:
            return _post(url, payload)
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", "replace")
            if e.code == 429:
                print("  [限流] API 返回 429，等待后重试…", file=sys.stderr)
                time.sleep(20)
                last = e
                continue
            if e.code >= 500:
                last = e
                time.sleep(4 * (i + 1))
                continue
            # 4xx 是真实校验失败，直接返回给调用方解析
            return json.dumps({"ok": False, "httpStatus": e.code, "errors": [{"rule": "http", "message": body}]})
        except Exception as e:  # 网络/超时
            last = e
            time.sleep(4 * (i + 1))
    raise last


def validate(pkg_dir):
    cpath = os.path.join(pkg_dir, "docker-compose.yml")
    opath = os.path.join(pkg_dir, "config_options.yml")
    for p in (cpath, opath):
        if not os.path.isfile(p):
            print(f"  [缺失] {p}")
            return False
    payload = {
        "composeYaml": open(cpath, encoding="utf-8").read(),
        "configOptionsYaml": open(opath, encoding="utf-8").read(),
    }
    try:
        raw = _post_retry(VALIDATE_URL, payload)
    except Exception as e:
        print(f"  [无法连接] {e}")
        sys.exit(3)
    try:
        res = json.loads(raw)
    except Exception:
        print("  [响应异常]", raw[:300])
        return False
    ok = res.get("ok") is True
    print(f"  [{'OK' if ok else 'FAIL'}] {os.path.basename(pkg_dir)}")
    if not ok:
        for err in res.get("errors", []) or []:
            rule = err.get("rule", "?")
            msg = err.get("message", "")
            print(f"      rule={rule}\n      {msg}")
    return ok


def preview_env(pkg_dir, values):
    opath = os.path.join(pkg_dir, "config_options.yml")
    payload = {
        "configOptionsYaml": open(opath, encoding="utf-8").read(),
        "values": values,
    }
    try:
        raw = _post_retry(PREVIEW_ENV_URL, payload)
    except Exception as e:
        print(f"  [无法连接] {e}")
        sys.exit(3)
    print(raw)
    out = os.path.join(pkg_dir, ".env")
    try:
        data = json.loads(raw)
        env = data.get("env") or data.get("output") or ""
        with open(out, "w", encoding="utf-8") as f:
            f.write(env)
        print(f"  → 已写入 {out}")
    except Exception:
        print("  (响应里没找到 env 字段，看上面原始输出)")


def main():
    argv = sys.argv[1:]
    if not argv:
        print(__doc__)
        sys.exit(2)

    if argv[0] == "--examples":
        base = os.path.join(HERE, "solohost-reference", "examples")
        if not os.path.isdir(base):
            print(f"找不到 examples/ 目录：{base}")
            sys.exit(2)
        dirs = [os.path.join(base, d) for d in sorted(os.listdir(base))]
    elif argv[0] == "--preview-env":
        if len(argv) < 2:
            print("用法: validate_solohost.py --preview-env <package-dir> [KEY=VALUE ...]")
            sys.exit(2)
        vals = {}
        for a in argv[2:]:
            if "=" in a:
                k, v = a.split("=", 1)
                vals[k] = v
        preview_env(argv[1], vals)
        sys.exit(0)
    else:
        dirs = argv

    print(f"SoloHost validation via {VALIDATE_URL}\n")
    results = [validate(d) for d in dirs]
    passed = sum(1 for r in results if r)
    print(f"\n{passed}/{len(results)} 通过")
    sys.exit(0 if all(results) else 1)


if __name__ == "__main__":
    main()
