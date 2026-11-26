/**
 * Pi Next Report — backend using only Node.js built-in modules (zero dependencies).
 * - Serves the static report app
 * - Verifies Pi access tokens against Pi Platform API /me (server is source of truth)
 * - Sandbox-safe embed headers; payment endpoints stubbed for MCP onboarding
 *
 * Security:
 * - PI_NETWORK_API_KEY read from env, never exposed to client or logged.
 */
const http = require("http");
const https = require("https");
const net = require("net");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, ".data");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml",
  ".ico": "image/x-icon", ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

/**
 * Outbound proxy support.
 * The Pi Platform API (api.minepi.com) is unreachable from some networks
 * without a proxy, so the token-verification call must honour
 * HTTPS_PROXY / https_proxy / HTTP_PROXY / http_proxy.
 * Implemented with a plain CONNECT tunnel so the project stays dependency-free.
 */
function proxyUrl() {
  const raw = process.env.HTTPS_PROXY || process.env.https_proxy ||
              process.env.HTTP_PROXY || process.env.http_proxy;
  if (!raw) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `http://${raw}`);
    return { host: u.hostname, port: Number(u.port) || (u.protocol === "https:" ? 443 : 80) };
  } catch (e) {
    return null;
  }
}

/**
 * Perform an HTTPS request (GET or POST) through an HTTP CONNECT tunnel when a proxy is configured.
 * Returns null when no proxy is set (caller should fall back to a direct request).
 */
function httpsReqViaProxy(host, path, headers, method, body, cb) {
  const proxy = proxyUrl();
  if (!proxy) return null;
  const req = http.request({
    host: proxy.host, port: proxy.port, method: "CONNECT",
    path: `${host}:443`, headers: { host: `${host}:443` }, timeout: 15000
  });
  req.on("connect", (res, socket) => {
    if (res.statusCode !== 200) { socket.destroy(); return cb(null); }
    const payload = body ? Buffer.from(body, "utf8") : null;
    const h = Object.assign({}, headers);
    if (payload) h["Content-Length"] = payload.length;
    const tlsReq = https.request({ host, path, method: method || "GET", headers: h, socket, agent: false, timeout: 15000 }, (up) => {
      let raw = "";
      up.on("data", (c) => (raw += c));
      up.on("end", () => { socket.end(); cb({ statusCode: up.statusCode, body: raw }); });
    });
    tlsReq.on("error", () => { socket.destroy(); cb(null); });
    if (payload) tlsReq.write(payload);
    tlsReq.end();
  });
  req.on("timeout", () => { req.destroy(); cb(null); });
  req.on("error", () => cb(null));
  req.end();
  return true;
}

/** Perform an HTTPS GET through an HTTP CONNECT tunnel when a proxy is configured. */
function httpsGetViaProxy(host, path, headers, cb) {
  return httpsReqViaProxy(host, path, headers, "GET", null, cb);
}

function send(res, status, body, type) {
  res.writeHead(status, { "Content-Type": type || "application/json; charset=utf-8" });
  res.end(body);
}
function json(res, status, obj) { send(res, status, JSON.stringify(obj)); }

// Sandbox-safe: no X-Frame-Options; frame-ancestors restricted.
function securityHeaders(res) {
  res.setHeader(
    "Content-Security-Policy",
    "frame-ancestors 'self' https://*.pinet.com https://*.minepi.com; " +
    "connect-src 'self' https://socialchain.app https://api.minepi.com; " +
    "script-src 'self' https://sdk.minepi.com 'unsafe-inline'; " +
    // 内联 <style>、内联 SVG 的 data: URI、<video>/<img>、系统字体
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob:; " +
    "media-src 'self' blob: data:; " +
    "font-src 'self' data:; " +
    "object-src 'none'; base-uri 'self'; form-action 'self'"
  );
  res.removeHeader("X-Frame-Options");
}

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === "/" || rel === "") rel = "/index.html";
  // prevent path traversal
  const safe = path.normalize(rel).replace(/^([.]{2}[/\\])+/, "");
  let filePath = path.join(PUBLIC_DIR, safe);
  if (!filePath.startsWith(PUBLIC_DIR)) return send(res, 403, "Forbidden", "text/plain");
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback to index.html for unknown non-asset paths
      if (!path.extname(filePath)) {
        return fs.readFile(path.join(PUBLIC_DIR, "index.html"), (e2, html) => {
          if (e2) return send(res, 404, "Not found", "text/plain");
          send(res, 200, html, MIME[".html"]);
        });
      }
      return send(res, 404, "Not found", "text/plain");
    }
    send(res, 200, data, MIME[path.extname(filePath)] || "application/octet-stream");
  });
}

function readBody(req, cb) {
  let raw = "";
  req.on("data", (c) => {
    raw += c;
    if (raw.length > 1e6) req.destroy();
  });
  req.on("end", () => {
    try { cb(raw ? JSON.parse(raw) : {}); } catch (e) { cb({}); }
  });
}

/** Extract the bearer token from the Authorization header. */
function bearerOf(req) {
  const h = (req.headers && req.headers.authorization) || "";
  return h.replace(/^Bearer\s+/i, "") || null;
}

/** Verify a Pi access token via GET /v2/me. cb(payload|null). */
function verifyTokenBasic(token, cb) {
  if (!token || typeof token !== "string") return cb(null);
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
  const viaProxy = httpsGetViaProxy("api.minepi.com", "/v2/me", headers, (res) => {
    if (!res || res.statusCode !== 200) return cb(null);
    try {
      const payload = JSON.parse(res.body);
      return cb(payload && payload.uid ? payload : null);
    } catch (e) { return cb(null); }
  });
  if (viaProxy) return;
  const options = {
    hostname: "api.minepi.com", path: "/v2/me", method: "GET", headers
  };
  const upstream = https.request(options, (up) => {
    let raw = "";
    up.on("data", (c) => (raw += c));
    up.on("end", () => {
      try {
        const payload = JSON.parse(raw);
        return cb(up.statusCode === 200 && payload && payload.uid ? payload : null);
      } catch (e) { return cb(null); }
    });
  });
  upstream.on("error", () => cb(null));
  upstream.end();
}

/** Verify Pi access token via Pi Platform API GET /v2/me */
function verifyToken(token, res) {
  if (!token || typeof token !== "string") {
    return json(res, 400, { verified: false, error: "missing accessToken" });
  }
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
  const handle = (statusCode, payload) => {
    if (statusCode === 200 && payload && payload.uid) {
      // Server derives identity from verified UID; never trust client user data.
      return json(res, 200, { verified: true, uid: payload.uid, username: payload.username || null });
    }
    return json(res, 401, { verified: false, error: "token rejected by Pi API" });
  };
  const viaProxy = httpsGetViaProxy("api.minepi.com", "/v2/me", headers, (r) => {
    if (!r) return json(res, 502, { verified: false, error: "upstream error" });
    // The Pi API may answer 401 with an empty body; that is a rejection, not a parse error.
    let payload = null;
    if (r.body && r.body.trim()) {
      try { payload = JSON.parse(r.body); }
      catch (e) { return json(res, 502, { verified: false, error: "invalid upstream response" }); }
    }
    return handle(r.statusCode, payload);
  });
  if (viaProxy) return;
  const options = {
    hostname: "api.minepi.com",
    path: "/v2/me",
    method: "GET",
    headers
  };
  const upstream = https.request(options, (up) => {
    let raw = "";
    up.on("data", (c) => (raw += c));
    up.on("end", () => {
      let payload = null;
      if (raw && raw.trim()) {
        try { payload = JSON.parse(raw); } catch (e) {
          return json(res, 502, { verified: false, error: "invalid upstream response" });
        }
      }
      return handle(up.statusCode, payload);
    });
  });
  upstream.on("error", (err) => {
    console.error("[verify] upstream error:", err.message);
    return json(res, 502, { verified: false, error: "upstream error" });
  });
  upstream.end();
}

const handler = (req, res) => {
  securityHeaders(res);
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const p = url.pathname;

  if (req.method === "GET" && p === "/api/health") {
    return json(res, 200, { ok: true, service: "pi-next-report", ts: Date.now() });
  }

  if (req.method === "POST" && p === "/api/auth/verify") {
    return readBody(req, (body) => verifyToken(body.accessToken, res));
  }

  if (req.method === "POST" && p === "/api/auth/logout") {
    return json(res, 200, { ok: true });
  }

  // ── Pi Payments (user_to_app) ──
  // 服务端权威档位：客户端只传 offerKey，金额由服务端决定，浏览器输入不可信。
  const PAY_OFFERS = {
    small: { pi: 1, label: "1 Pi" },
    medium: { pi: 5, label: "5 Pi" },
    large: { pi: 10, label: "10 Pi" },
  };
  const PAY_MEMO = "Support Next Edge - server and research costs";

  function payStorePath(name) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    return path.join(DATA_DIR, name + ".json");
  }
  function payStoreRead(name) {
    try { return JSON.parse(fs.readFileSync(payStorePath(name), "utf8")); } catch (e) { return null; }
  }
  function payStoreWrite(name, obj) {
    try { fs.writeFileSync(payStorePath(name), JSON.stringify(obj), "utf8"); } catch (e) { /* ignore */ }
  }

  /** 用服务端 API key 调 Pi Platform API（GET/POST）。 */
  function piApiReq(apiPath, apiKey, method, body, cb) {
    const headers = {
      Authorization: "Bearer " + apiKey,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    const payload = body ? JSON.stringify(body) : null;
    const viaProxy = httpsReqViaProxy("api.minepi.com", apiPath, headers, method || "GET", payload, (r) => {
      if (!r) return cb(null);
      let data = null;
      try { data = JSON.parse(r.body); } catch (e) { /* 非 JSON */ }
      return cb({ ok: r.statusCode >= 200 && r.statusCode < 300, status: r.statusCode, data });
    });
    if (viaProxy) return;
    const opts = {
      hostname: "api.minepi.com", path: apiPath, method: method || "GET",
      headers: Object.assign({}, headers, payload ? { "Content-Length": Buffer.byteLength(payload) } : {})
    };
    const up = https.request(opts, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        let data = null;
        try { data = JSON.parse(raw); } catch (e) { /* 非 JSON */ }
        cb({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data });
      });
    });
    up.on("error", () => cb(null));
    if (payload) up.write(payload);
    up.end();
  }

  if (req.method === "GET" && p === "/api/payments") {
    return verifyTokenBasic(bearerOf(req), (verified) => {
      if (!verified) return json(res, 401, { ok: false, error: "invalid token" });
      const configured = !!process.env.PI_NETWORK_API_KEY;
      const offers = Object.keys(PAY_OFFERS).map(function (k) {
        return { key: k, pi: PAY_OFFERS[k].pi, label: PAY_OFFERS[k].label };
      });
      const s = payStoreRead("supporter-" + String(verified.uid).replace(/[^a-zA-Z0-9_-]/g, ""));
      return json(res, 200, {
        ok: true, configured: configured, offers: offers, memo: PAY_MEMO,
        supporter: !!(s && s.supporter), walletConfigured: false
      });
    });
  }

  if (req.method === "POST" && (p === "/api/payments/approve" || p === "/api/payments/complete")) {
    return verifyTokenBasic(bearerOf(req), (verified) => {
      if (!verified) return json(res, 401, { ok: false, error: "invalid token" });
      const apiKey = process.env.PI_NETWORK_API_KEY;
      if (!apiKey) {
        return json(res, 503, {
          ok: false, error: "payments not configured",
          hint: "Set PI_NETWORK_API_KEY in the server environment."
        });
      }
      return readBody(req, (body) => {
        const paymentId = String((body && body.paymentId) || "").trim();
        if (!paymentId) return json(res, 400, { ok: false, error: "paymentId required" });
        const action = p === "/api/payments/complete" ? "complete" : "approve";
        const payKey = "payment-" + paymentId.replace(/[^a-zA-Z0-9_-]/g, "");

        // 幂等：已完成则直接返回
        const prior = payStoreRead(payKey);
        if (prior && prior.stage === "completed") {
          return json(res, 200, Object.assign({ ok: true, idempotent: true, stage: "completed", paymentId: paymentId }, prior.result || {}));
        }

        // 拉取权威支付状态
        piApiReq("/v2/payments/" + encodeURIComponent(paymentId), apiKey, "GET", null, (got) => {
          if (!got || !got.ok || !got.data) {
            return json(res, 502, { ok: false, error: "cannot read payment", status: got && got.status });
          }
          const pay = got.data;
          const amount = Number(pay.amount);
          const direction = pay.direction || (pay.transaction && pay.transaction.direction);
          if (direction !== "user_to_app") return json(res, 400, { ok: false, error: "wrong direction", direction: direction });
          const matched = Object.keys(PAY_OFFERS).filter(function (k) { return PAY_OFFERS[k].pi === amount; })[0];
          if (!matched) return json(res, 400, { ok: false, error: "amount not in server offers", amount: amount });
          const payerUid = pay.from_user_uid || (pay.transaction && pay.transaction.from_user_uid) || null;
          if (payerUid && String(payerUid) !== String(verified.uid)) {
            return json(res, 403, { ok: false, error: "payer mismatch" });
          }

          const base = {
            ok: true, paymentId: paymentId, offerKey: matched, pi: amount,
            label: PAY_OFFERS[matched].label, memo: PAY_MEMO
          };

          if (action === "approve") {
            payStoreWrite(payKey, { stage: "approved", uid: verified.uid, offerKey: matched, pi: amount, updated: Date.now() });
            return json(res, 200, Object.assign({}, base, { stage: "approved" }));
          }

          // complete：服务端 approve → complete
          piApiReq("/v2/payments/" + encodeURIComponent(paymentId) + "/approve", apiKey, "POST", {}, (appr) => {
            if (!appr || (!appr.ok && appr.status !== 409)) {
              return json(res, 502, { ok: false, error: "approve failed", status: appr && appr.status });
            }
            piApiReq("/v2/payments/" + encodeURIComponent(paymentId) + "/complete", apiKey, "POST", {}, (comp) => {
              if (!comp || (!comp.ok && comp.status !== 409)) {
                return json(res, 502, { ok: false, error: "complete failed", status: comp && comp.status });
              }
              // 发放权益：只在确认完成后，且按 payment id 幂等
              const supKey = "supporter-" + String(verified.uid).replace(/[^a-zA-Z0-9_-]/g, "");
              const already = payStoreRead(supKey);
              if (!already || !already.supporter) {
                payStoreWrite(supKey, { supporter: true, uid: verified.uid, amount: amount, paymentId: paymentId, updated: Date.now() });
              }
              payStoreWrite(payKey, {
                stage: "completed", uid: verified.uid, offerKey: matched, pi: amount, updated: Date.now(),
                result: { supporter: true, pi: amount, offerKey: matched }
              });
              return json(res, 200, Object.assign({}, base, { stage: "completed", supporter: true }));
            });
          });
        });
      });
    });
  }

  // Progress sync — local JSON file keyed by Pi UID. Requires a Pi access token
  // verified against Pi /me, so one user cannot read another's progress.
  if (req.method === "POST" && p === "/api/progress") {
    return readBody(req, (body) => {
      const token = req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, "");
      if (!token) return json(res, 401, { ok: false, error: "auth required" });
      return verifyTokenBasic(token, (verified) => {
        if (!verified) return json(res, 401, { ok: false, error: "invalid token" });
        const uid = verified.uid;
        try {
          if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
          const file = path.join(DATA_DIR, "progress-" + uid.replace(/[^a-zA-Z0-9_-]/g, "") + ".json");
          fs.writeFileSync(file, JSON.stringify({ uid, state: body.state || {}, updated: Date.now() }), "utf8");
          return json(res, 200, { ok: true });
        } catch (e) {
          return json(res, 500, { ok: false, error: "write failed" });
        }
      });
    });
  }
  if (req.method === "GET" && p === "/api/progress") {
    const token = req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, "");
    if (!token) return json(res, 401, { ok: false, error: "auth required" });
    return verifyTokenBasic(token, (verified) => {
      if (!verified) return json(res, 401, { ok: false, error: "invalid token" });
      const file = path.join(DATA_DIR, "progress-" + verified.uid.replace(/[^a-zA-Z0-9_-]/g, "") + ".json");
      if (!fs.existsSync(file)) return json(res, 200, { ok: true, state: null });
      try { return json(res, 200, { ok: true, state: JSON.parse(fs.readFileSync(file, "utf8")).state }); }
      catch (e) { return json(res, 200, { ok: true, state: null }); }
    });
  }

  if (req.method === "GET" || req.method === "HEAD") {
    return serveStatic(req, res, p);
  }
  return json(res, 405, { error: "method not allowed" });
};

const server = http.createServer(handler);

// Export handler for offline unit tests (sandbox blocks localhost sockets).
module.exports = { handler, verifyToken, securityHeaders };

if (require.main === module) {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[pi-next-report] listening on 0.0.0.0:${PORT}`);
  });
}
