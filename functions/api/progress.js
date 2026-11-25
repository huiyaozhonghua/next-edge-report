/**
 * Cloudflare Pages Function — /api/progress
 *
 * 作用：登录后跨设备同步进度。
 * 数据存在 Cloudflare KV（命名空间 PROGRESS_KV），键 = uid，值 = {uid, state, updated}。
 *
 * 安全：每次请求都用用户自己的 accessToken 调 Pi Platform API 的 /me 验证身份，
 *       只信任服务端拿到的 uid，绝不信任客户端传来的 uid。
 *
 * 环境变量：
 *   PI_PLATFORM_API  可选，默认 https://api.minepi.com/v2
 *   PROGRESS_KV      KV 命名空间绑定（Pages 控制台里绑）
 */
const PI_API = "https://api.minepi.com/v2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(code, obj) {
  return new Response(JSON.stringify(obj), {
    status: code,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
  });
}

/** 用 accessToken 调 Pi /me 拿可信身份 */
async function verifyToken(token) {
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

function bearer(request) {
  const h = request.headers.get("authorization") || "";
  return h.replace(/^Bearer\s+/i, "") || null;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const verified = await verifyToken(bearer(request));
  if (!verified) return json(401, { ok: false, error: "invalid token" });
  const kv = env && env.PROGRESS_KV;
  if (!kv) return json(500, { ok: false, error: "KV not bound" });
  const key = "progress-" + String(verified.uid).replace(/[^a-zA-Z0-9_-]/g, "");
  const raw = await kv.get(key, "json");
  return json(200, { ok: true, state: raw ? raw.state || raw : null });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const verified = await verifyToken(bearer(request));
  if (!verified) return json(401, { ok: false, error: "invalid token" });
  const kv = env && env.PROGRESS_KV;
  if (!kv) return json(500, { ok: false, error: "KV not bound" });

  let body = null;
  try {
    body = await request.json();
  } catch (e) {
    return json(400, { ok: false, error: "bad json" });
  }
  if (!body || typeof body.state !== "object" || body.state === null) {
    return json(400, { ok: false, error: "state required" });
  }

  const key = "progress-" + String(verified.uid).replace(/[^a-zA-Z0-9_-]/g, "");
  await kv.put(key, JSON.stringify({ uid: verified.uid, state: body.state, updated: Date.now() }));
  return json(200, { ok: true });
}
