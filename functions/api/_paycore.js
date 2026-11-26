/**
 * Shared Pi Payments core — NOT a route on its own.
 *
 * The leading underscore keeps Cloudflare Pages from treating this file as an endpoint.
 * Routes live in:
 *   functions/api/payments.js         → GET  /api/payments
 *   functions/api/payments/approve.js → POST /api/payments/approve
 *   functions/api/payments/complete.js→ POST /api/payments/complete
 *
 * ⚠️ Cloudflare Pages Functions route by FILE PATH — a file at api/payments.js does NOT
 *    serve api/payments/approve. Separate route files are required.
 *
 * 作用：Pi Payments (user_to_app) 的服务端授权与完成确认。
 *
 * 流程（官方 Payments 文档）：
 *   1. 前端 Pi.createPayment() 发起 → 得到 payment id
 *   2. 前端 onReadyForServerApproval → 调本端点 /approve
 *      服务端用 PI_NETWORK_API_KEY 调 Pi Platform API 校验这笔支付
 *   3. 前端 onReadyForServerCompletion → 调本端点 /complete
 *      服务端调 Pi API 的 /payments/:id/approve 与 /complete 完成结算
 *
 * 安全要点：
 *   · 金额档位由服务端定义（SERVER_OFFERS），客户端只能选择 key，不能传金额
 *   · 支付状态、幂等记录存在 KV，key = payment id
 *   · 权益（支持者徽章）只在服务端确认完成后才发放，且每个 payment id 只发一次
 *   · PI_NETWORK_API_KEY 只从服务端环境变量读取，绝不下发到浏览器
 *
 * 环境变量：
 *   PI_NETWORK_API_KEY  必需。Pi Developers → Settings → API key → Generate new key
 *   PROGRESS_KV         必需（复用进度同步的 KV 命名空间）
 */

export const PI_API = "https://api.minepi.com/v2";

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * 服务端权威的打赏档位。客户端只传 offerKey，金额由这里决定。
 * 全部为自愿捐赠，不设付费墙，不影响任何功能的免费使用。
 */
export const SERVER_OFFERS = {
  small: { pi: 1, label: "1 Pi" },
  medium: { pi: 5, label: "5 Pi" },
  large: { pi: 10, label: "10 Pi" },
};

export const MEMO = "Support Next Edge - server and research costs";

export function json(code, obj) {
  return new Response(JSON.stringify(obj), {
    status: code,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
  });
}

export async function verifyToken(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const r = await fetch(`${PI_API}/me`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!r.ok) return null;
    const u = await r.json();
    return u && u.uid ? { uid: u.uid, username: u.username || null } : null;
  } catch (e) {
    return null;
  }
}

export function bearer(request) {
  const h = request.headers.get("authorization") || "";
  return h.replace(/^Bearer\s+/i, "") || null;
}

/** 用服务端 API key 调 Pi Platform API */
export async function piApi(path, apiKey, method = "GET", body) {
  const res = await fetch(`${PI_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch (e) { /* 非 JSON 响应 */ }
  return { ok: res.ok, status: res.status, data };
}

export async function handleOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

/** GET /api/payments — 返回服务端档位 + 当前是否已配置。 */
export async function handleGet(context) {
  const { request, env } = context;
  const verified = await verifyToken(bearer(request));
  if (!verified) return json(401, { ok: false, error: "invalid token" });

  const configured = !!(env && env.PI_NETWORK_API_KEY);
  const offers = Object.keys(SERVER_OFFERS).map((k) => ({
    key: k,
    pi: SERVER_OFFERS[k].pi,
    label: SERVER_OFFERS[k].label,
  }));

  // 已支持者标记（只给本人看，不公开名单）
  const kv = env && env.PROGRESS_KV;
  let supporter = false;
  if (kv) {
    const s = await kv.get("supporter-" + String(verified.uid).replace(/[^a-zA-Z0-9_-]/g, ""), "json");
    supporter = !!(s && s.supporter);
  }

  return json(200, {
    ok: true,
    configured,
    offers,
    memo: MEMO,
    supporter,
    walletConfigured: false, // 真实状态由 Pi 侧 get_app 的 checklist.create_wallet 决定
  });
}

/** POST /api/payments/{approve|complete} */
export async function handlePost(context, forcedAction) {
  const { request, env } = context;
  const verified = await verifyToken(bearer(request));
  if (!verified) return json(401, { ok: false, error: "invalid token" });

  const apiKey = env && env.PI_NETWORK_API_KEY;
  if (!apiKey) {
    return json(503, {
      ok: false,
      error: "payments not configured",
      hint: "Set PI_NETWORK_API_KEY in the deployment environment (Pi Developers → Settings → API key).",
    });
  }

  let body = null;
  try { body = await request.json(); } catch (e) { return json(400, { ok: false, error: "bad json" }); }
  if (!body || typeof body !== "object") return json(400, { ok: false, error: "bad body" });

  const action = forcedAction || body.action;
  const paymentId = typeof body.paymentId === "string" ? body.paymentId.trim() : "";
  if (!paymentId) return json(400, { ok: false, error: "paymentId required" });

  const kv = env && env.PROGRESS_KV;
  const payKey = "payment-" + paymentId.replace(/[^a-zA-Z0-9_-]/g, "");

  // ── 幂等：同一 payment id 重复请求直接返回已记录的结果 ──
  if (kv) {
    const prior = await kv.get(payKey, "json");
    if (prior && prior.stage === "completed") {
      return json(200, { ok: true, idempotent: true, stage: "completed", paymentId, ...(prior.result || {}) });
    }
  }

  // ── 拉取这笔支付的权威状态 ──
  const fetched = await piApi(`/payments/${encodeURIComponent(paymentId)}`, apiKey);
  if (!fetched.ok || !fetched.data) {
    return json(502, { ok: false, error: "cannot read payment", status: fetched.status });
  }
  const p = fetched.data;

  // ── 校验：金额、方向、收款方 ──
  const amount = Number(p.amount);
  const direction = p.direction || (p.transaction && p.transaction.direction);
  if (direction !== "user_to_app") {
    return json(400, { ok: false, error: "wrong direction", direction });
  }
  // 金额必须等于服务端定义的某个档位
  const matched = Object.keys(SERVER_OFFERS).find(
    (k) => SERVER_OFFERS[k].pi === amount
  );
  if (!matched) {
    return json(400, { ok: false, error: "amount not in server offers", amount });
  }
  // 用户必须是当前已认证的用户
  const payerUid = p.from_user_uid || (p.transaction && p.transaction.from_user_uid) || null;
  if (payerUid && String(payerUid) !== String(verified.uid)) {
    return json(403, { ok: false, error: "payer mismatch" });
  }

  const base = {
    ok: true,
    paymentId,
    offerKey: matched,
    pi: amount,
    label: SERVER_OFFERS[matched].label,
    memo: MEMO,
  };

  if (action === "approve") {
    // 只做校验与登记，尚未完成结算
    if (kv) {
      await kv.put(payKey, JSON.stringify({
        stage: "approved",
        uid: verified.uid,
        offerKey: matched,
        pi: amount,
        updated: Date.now(),
      }));
    }
    return json(200, { ...base, stage: "approved" });
  }

  if (action === "complete") {
    // 先 approve 再 complete（官方要求服务端完成这两步）
    const appr = await piApi(`/payments/${encodeURIComponent(paymentId)}/approve`, apiKey, "POST", {});
    if (!appr.ok && appr.status !== 409) {
      return json(502, { ok: false, error: "approve failed", status: appr.status });
    }
    const comp = await piApi(`/payments/${encodeURIComponent(paymentId)}/complete`, apiKey, "POST", {});
    if (!comp.ok && comp.status !== 409) {
      return json(502, { ok: false, error: "complete failed", status: comp.status });
    }

    // ── 发放权益：只在这里，且幂等（以 payment id 为准）──
    const supKey = "supporter-" + String(verified.uid).replace(/[^a-zA-Z0-9_-]/g, "");
    if (kv) {
      const already = await kv.get(supKey, "json");
      if (!already || !already.supporter) {
        await kv.put(supKey, JSON.stringify({
          supporter: true,
          uid: verified.uid,
          amount,
          paymentId,
          updated: Date.now(),
        }));
      }
      await kv.put(payKey, JSON.stringify({
        stage: "completed",
        uid: verified.uid,
        offerKey: matched,
        pi: amount,
        updated: Date.now(),
        result: { supporter: true, pi: amount, offerKey: matched },
      }));
    }

    return json(200, { ...base, stage: "completed", supporter: true });
  }

  return json(400, { ok: false, error: "unknown action" });
}
