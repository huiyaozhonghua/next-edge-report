/**
 * Offline unit tests for the Next Edge app handler.
 * Mocks req/res so we can verify routing without a network socket
 * (the sandbox isolates localhost across processes).
 */
const { handler } = require("./server");

function mockRes() {
  return {
    statusCode: null, headers: {}, body: "",
    writeHead(s, h) { this.statusCode = s; Object.assign(this.headers, h || {}); },
    setHeader(k, v) { this.headers[k] = v; },
    removeHeader(k) { delete this.headers[k]; },
    end(b) { this.body = b; this._done && this._done(); },
    on(ev, fn) { if (ev === "finish") this._done = fn; }
  };
}
function req(method, url, bodyObj, headers) {
  const body = bodyObj ? JSON.stringify(bodyObj) : "";
  return {
    method, url, headers: Object.assign({ host: "localhost", "content-type": "application/json" }, headers || {}),
    on(ev, fn) { if (ev === "data") fn(body); if (ev === "end") setImmediate(fn); }
  };
}

function run(name, method, url, bodyObj, check, headers) {
  return new Promise((resolve) => {
    const res = mockRes();
    res._done = () => {
      try { check(res); console.log("PASS", name); }
      catch (e) { console.error("FAIL", name, "-", e.message); process.exitCode = 1; }
      resolve();
    };
    handler(req(method, url, bodyObj, headers), res);
  });
}

(async () => {
  await run("GET /api/health", "GET", "/api/health", null, (r) => {
    if (r.statusCode !== 200) throw new Error("status " + r.statusCode);
    if (!JSON.parse(r.body).ok) throw new Error("not ok");
  });
  await run("GET / -> war-room HTML with SDK", "GET", "/", null, (r) => {
    if (r.statusCode !== 200) throw new Error("status " + r.statusCode);
    const b = r.body.toString();
    if (!b.includes("pi-sdk.js")) throw new Error("SDK script missing");
    if (!b.includes("参赛作战台")) throw new Error("new product title missing");
    if (!b.includes("选题匹配")) throw new Error("matcher tab missing");
    if (!b.includes("今日打卡")) throw new Error("checkin missing");
    // Hero countdown must be driven by JS, not a hardcoded stale number.
    if (!b.includes('id="heroDays"')) throw new Error("hero countdown must be dynamic (heroDays)");
    const csp = r.headers["Content-Security-Policy"] || "";
    if (!csp.includes("frame-ancestors")) throw new Error("missing frame-ancestors CSP");
    if (r.headers["X-Frame-Options"]) throw new Error("X-Frame-Options must not be set");
  });
  await run("GET /app.js -> matcher + persistence", "GET", "/app.js", null, (r) => {
    if (r.statusCode !== 200) throw new Error("status " + r.statusCode);
    const b = r.body.toString();
    if (!b.includes("Pi.authenticate")) throw new Error("auth call missing");
    if (!b.includes("sandbox: false")) throw new Error("mainnet sandbox flag missing");
    if (!b.includes("TOPICS")) throw new Error("matcher engine missing");
    if (!b.includes("nextedge_state_v1")) throw new Error("localStorage key missing");
    // Deadline must equal the official 2027-01-05 23:59 PST == 2027-01-06 15:59 +08:00.
    if (!b.includes("2027-01-06T15:59:00+08:00")) throw new Error("deadline mismatch vs official");
    // Hero countdown must be wired to the same dynamic value.
    if (!b.includes('heroDays')) throw new Error("heroDays not wired to daysLeft()");
  });
  await run("GET /en.html -> English version", "GET", "/en.html", null, (r) => {
    if (r.statusCode !== 200) throw new Error("status " + r.statusCode);
    const b = r.body.toString();
    if (!b.includes("Next Edge")) throw new Error("EN name missing");
    if (!b.includes("Topic matcher")) throw new Error("EN matcher feature missing");
    if (!b.includes("pi-sdk.js")) throw new Error("EN SDK missing");
  });
  await run("GET /privacy.html", "GET", "/privacy.html", null, (r) => {
    if (r.statusCode !== 200) throw new Error("status " + r.statusCode);
    if (!r.body.toString().toLowerCase().includes("privacy policy")) throw new Error("no privacy policy");
  });
  await run("POST /api/auth/verify rejects empty token", "POST", "/api/auth/verify", {}, (r) => {
    if (r.statusCode !== 400) throw new Error("status " + r.statusCode);
    if (JSON.parse(r.body).verified !== false) throw new Error("should be unverified");
  });
  await run("POST /api/payments/complete not enabled", "POST", "/api/payments/complete", {}, (r) => {
    if (r.statusCode !== 501) throw new Error("status " + r.statusCode);
  });
  await run("POST /api/progress requires auth", "POST", "/api/progress", { state: {} }, (r) => {
    if (r.statusCode !== 401) throw new Error("status " + r.statusCode);
  });
  await run("GET /api/progress requires auth", "GET", "/api/progress", null, (r) => {
    if (r.statusCode !== 401) throw new Error("status " + r.statusCode);
  });
  console.log("ALL TESTS DONE");
})();
