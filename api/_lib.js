const crypto = require("crypto");
const U = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const T = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(cmd) {
  if (!U || !T) throw new Error("database not connected");
  const r = await fetch(U, { method: "POST", headers: { Authorization: "Bearer " + T }, body: JSON.stringify(cmd) });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

const sha = (x) => crypto.createHash("sha256").update(String(x)).digest();
const eq = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));
const users = () =>
  [1, 2]
    .map((i) => ({ n: process.env["USER" + i + "_NAME"], p: process.env["USER" + i + "_PASS"] }))
    .filter((u) => u.n && u.p);
const sig = (p) => crypto.createHmac("sha256", process.env.SESSION_SECRET).update(p).digest("base64url");

function sign(name) {
  const p = Buffer.from(JSON.stringify({ n: name, e: Date.now() + 30 * 864e5 })).toString("base64url");
  return p + "." + sig(p);
}

// returns the signed-in user's name, or null
function verify(header) {
  if (!process.env.SESSION_SECRET) return null;
  const [p, s] = String(header || "").replace(/^Bearer /, "").split(".");
  if (!p || !s || !eq(s, sig(p))) return null;
  try {
    const o = JSON.parse(Buffer.from(p, "base64url").toString());
    return o.e > Date.now() && users().some((u) => u.n === o.n) ? o.n : null;
  } catch {
    return null;
  }
}

module.exports = { redis, sign, verify, eq, users };
