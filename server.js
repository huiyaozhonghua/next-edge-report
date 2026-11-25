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

/** Perform an HTTPS GET through an HTTP CONNECT tunnel when a proxy is configured. */
function httpsGetViaProxy(host, path, headers, cb) {
  const proxy = proxyUrl();
  if (!proxy) return null;
  const req = http.request({
    host: proxy.host, port: proxy.port, method: "CONNECT",
    path: `${host}:443`, headers: { host: `${host}:443` }, timeout: 15000
  });
  req.on("connect", (res, socket) => {
    if (res.statusCode !== 200) { socket.destroy(); return cb(null); }
    const tlsReq = https.request({ host, path, method: "GET", headers, socket, agent: false, timeout: 15000 }, (up) => {
      let raw = "";
      up.on("data", (c) => (raw += c));
      up.on("end", () => { socket.end(); cb({ statusCode: up.statusCode, body: raw }); });
    });
    tlsReq.on("error", () => { socket.destroy(); cb(null); });
    tlsReq.end();
  });
  req.on("timeout", () => { req.destroy(); cb(null); });
  req.on("error", () => cb(null));
  req.end();
  return true;
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

  // Payment stubs — filled by prompt_payments after MCP onboarding.
  if (req.method === "POST" && p === "/api/payments/incomplete") {
    return json(res, 200, { ok: true, note: "resolution pending MCP onboarding" });
  }
  if (req.method === "POST" && p === "/api/payments/complete") {
    return json(res, 501, { ok: false, error: "payments not yet enabled" });
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
