#!/usr/bin/env python3
"""
Pi Payments 链上验证脚本 —— 支付跑通后跑一次，确认交易真的在链上。

官方明确要求：
  "After a Mainnet payment attempt, verify on-chain activity in the Pi Blockexplorer
   Mainnet account page for this app's wallet public address ... Do not claim success
   from API callbacks alone if the explorer shows no matching transaction."

用法：
  python verify_payment.py <payment_id>            # 只查 app wallet 的入账
  python verify_payment.py <payment_id> --payer     # 同时查打赏方（个人钱包）的出账
  python verify_payment.py --just-addresses        # 只打印两个地址
"""
import json
import sys
import urllib.request
import urllib.error

PROXY = "http://127.0.0.1:17891"
PI_MAINNET = "https://api.mainnet.minepi.com"

# ── 本 App 的两个角色地址 ──
APP_WALLET = "GBRAGPYVPUDVRRW7KOAJPBMNGGIG6GSDHLZ7WRNG4K2GJR2DJTJ754HD"  # 收款方（app wallet）
PAYER_WALLET = "GDUOFQWPIXGP2IAYMNHJKF6FWKWFHLN4YPIPAIY3PMB4KDZ2PNDBZUEX"  # 打赏方（你的个人钱包）

opener = urllib.request.build_opener(
    urllib.request.ProxyHandler({"http": PROXY, "https": PROXY})
)


def api(path):
    """调 Pi 主网 API，返回 (status, json|None)"""
    req = urllib.request.Request(PI_MAINNET + path, headers={"Accept": "application/json"})
    try:
        with opener.open(req, timeout=25) as r:
            return r.status, json.loads(r.read().decode("utf-8", "ignore"))
    except urllib.error.HTTPError as e:
        return e.code, None
    except Exception as e:
        print(f"  ⚠️ 请求失败: {e}")
        return 0, None


def not_found(data):
    return isinstance(data, dict) and "not_found" in str(data.get("type", ""))


def check_account(addr, label):
    """查账户：余额 + 是否存在"""
    st, d = api(f"/v2/accounts/{addr}")
    if st == 404 or not_found(d):
        print(f"  ❌ {label}")
        print(f"     {addr}")
        print(f"     链上状态: 账户不存在 —— 还没有任何交易落到这个地址")
        return None
    if st != 200 or not d:
        print(f"  ⚠️ {label}: HTTP {st}")
        return None
    bal = (d.get("balances") or [{}])[0]
    print(f"  ✅ {label}")
    print(f"     {addr}")
    print(f"     余额: {bal.get('balance','?')} {bal.get('asset_code','')}")
    print(f"     序号: {d.get('sequence','?')}")
    return d


def check_payment(payment_id):
    """按 payment id 查这笔支付的链上状态"""
    print(f"  ═══ payment {payment_id} ═══")
    st, d = api(f"/v2/payments/{payment_id}")
    if st == 404 or not_found(d):
        print(f"  ❌ 查不到这笔支付（HTTP {st}）")
        print(f"     可能原因：payment id 写错 / 交易尚未上链 / 用了错误的网络")
        return None
    if st != 200 or not d:
        print(f"  ⚠️ HTTP {st}")
        return None
    print(f"  状态     : {d.get('status','?')}")
    print(f"  金额     : {d.get('amount','?')} Pi")
    print(f"  方向     : {d.get('direction','?')}")
    print(f"  memo     : {d.get('memo','')}")
    tx = d.get("transaction") or {}
    if tx:
        print(f"  交易 hash: {tx.get('hash','?')}")
        print(f"  来源     : {tx.get('from_user_uid') or tx.get('from','?')}")
        print(f"  收款     : {tx.get('to_user_uid') or tx.get('to','?')}")
    return d


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    want_payer = "--payer" in sys.argv
    only_addr = "--just-addresses" in sys.argv

    if only_addr:
        print("  App wallet (收款方):", APP_WALLET)
        print("  Payer wallet (打赏方):", PAYER_WALLET)
        print()
        print("  Blockexplorer 页面:")
        print(f"    https://blockexplorer.minepi.com/mainnet/accounts/{APP_WALLET}")
        print(f"    https://blockexplorer.minepi.com/mainnet/accounts/{PAYER_WALLET}")
        return

    print("════════════════════════════════════════════")
    print(" Pi Payments 链上验证")
    print("════════════════════════════════════════════")
    print()

    if args:
        check_payment(args[0])
        print()

    print("  ═══ 收款方 App wallet（应看到 U2A 入账）═══")
    check_account(APP_WALLET, "App wallet")
    print()

    if want_payer:
        print("  ═══ 打赏方 个人钱包（应看到出账）═══")
        check_account(PAYER_WALLET, "Payer wallet")
        print()

    print("  浏览器人工确认（官方指定的最终依据）:")
    print(f"    https://blockexplorer.minepi.com/mainnet/accounts/{APP_WALLET}")
    print()
    print("  ⚠️ 只有看到链上真的出现那笔 U2A 入账，才能说支付跑通了。")
    print("     API 返回 200 不等于链上成功。")


if __name__ == "__main__":
    main()
