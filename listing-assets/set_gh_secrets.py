#!/usr/bin/env python3
"""
设置 GitHub Actions Secrets（用仓库公钥加密后 PUT）。

用法:
    python set_gh_secrets.py <CF_API_TOKEN>

会设置 3 个 Secret：
    CLOUDFLARE_API_TOKEN  ← 传入的参数
    CLOUDFLARE_ACCOUNT_ID = 38e848a7a5031d103a244d52490c5645
    PI_VALIDATION_KEY     ← 从 public/validation-key.txt 读取
"""
import base64
import json
import os
import subprocess
import sys

from nacl import encoding, public

REPO = "huiyaozhonghua/next-edge-report"
GITHUB_TOKEN = os.environ["GH_TOKEN"]
KEY_ID = os.environ["KEY_ID"]
PUBKEY_B64 = os.environ["PUBKEY_B64"]
ACCOUNT_ID = "38e848a7a5031d103a244d52490c5645"
VALIDATION_KEY_FILE = os.environ.get(
    "VALIDATION_KEY_FILE", "public/validation-key.txt"
)


def encrypt(value: str) -> str:
    """用仓库公钥加密 secret 值，GitHub 要求 sealed box 格式。"""
    pk = public.PublicKey(PUBKEY_B64.encode(), encoding.Base64Encoder())
    sealed = public.SealedBox(pk).encrypt(value.encode())
    return base64.b64encode(sealed).decode()


def put_secret(name: str, value: str) -> bool:
    payload = {
        "encrypted_value": encrypt(value),
        "key_id": KEY_ID,
    }
    url = f"https://api.github.com/repos/{REPO}/actions/secrets/{name}"
    r = subprocess.run(
        [
            "curl", "-s", "-m", "30", "-x", "http://127.0.0.1:17891",
            "-X", "PUT", url,
            "-H", f"Authorization: Bearer {GITHUB_TOKEN}",
            "-H", "Accept: application/vnd.github+json",
            "-H", "User-Agent: set-secrets",
            "-H", "Content-Type: application/json",
            "-d", json.dumps(payload),
            "-w", "\n%{http_code}",
        ],
        capture_output=True,
        text=True,
    )
    out = r.stdout.strip().split("\n")
    code = out[-1] if out else "?"
    body = "\n".join(out[:-1])
    ok = code in ("201", "204")
    print(f"  {'✅' if ok else '❌'} {name} → HTTP {code}")
    if not ok:
        print(f"     {body[:300]}")
    return ok


def main():
    if len(sys.argv) < 2:
        print("用法: python set_gh_secrets.py <CF_API_TOKEN>")
        sys.exit(1)
    cf_token = sys.argv[1].strip()

    if not os.path.exists(VALIDATION_KEY_FILE):
        print(f"❌ 找不到 {VALIDATION_KEY_FILE}")
        sys.exit(1)
    with open(VALIDATION_KEY_FILE, "r", encoding="utf-8") as f:
        validation_key = f.read().strip()

    print("=== 设置 GitHub Actions Secrets ===")
    results = []
    results.append(put_secret("CLOUDFLARE_API_TOKEN", cf_token))
    results.append(put_secret("CLOUDFLARE_ACCOUNT_ID", ACCOUNT_ID))
    results.append(put_secret("PI_VALIDATION_KEY", validation_key))

    print()
    if all(results):
        print("✅ 全部设置成功 —— push 到 main 即可自动部署")
        print(f"   仓库: {REPO}")
        print("   Actions: https://github.com/" + REPO + "/actions/workflows/deploy-pages.yml")
    else:
        print("❌ 部分失败")
        sys.exit(1)


if __name__ == "__main__":
    main()
