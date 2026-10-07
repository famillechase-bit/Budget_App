const U = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const T = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(cmd) {
  const r = await fetch(U, {
    method: "POST",
    headers: { Authorization: "Bearer " + T },
    body: JSON.stringify(cmd),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const pw = process.env.APP_PASSWORD;const { redis, verify } = require("./_lib");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const me = verify(req.headers.authorization);
  if (!me) return res.status(401).json({ error: "auth" });
  try {
    const raw = await redis(["GET", "budget"]);
    const cur = raw ? JSON.parse(raw) : { ver: 0, json: null, by: "" };
    if (req.method === "GET") return res.status(200).json(cur);
    if (req.method === "POST") {
      const b = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (!b || typeof b.json !== "string") return res.status(400).json({ error: "bad body" });
      if (b.base !== cur.ver) return res.status(409).json(cur);
      const next = { ver: cur.ver + 1, json: b.json, by: me, at: new Date().toISOString() };
      await redis(["SET", "budget", JSON.stringify(next)]);
      return res.status(200).json({ ver: next.ver });
    }
    return res.status(405).json({ error: "method" });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
};

  if (!pw || req.headers["x-pass"] !== pw) return res.status(401).json({ error: "auth" });
  if (!U || !T) return res.status(500).json({ error: "database not connected" });
  try {
    const raw = await redis(["GET", "budget"]);
    const cur = raw ? JSON.parse(raw) : { ver: 0, json: null };
    if (req.method === "GET") return res.status(200).json(cur);
    if (req.method === "POST") {
      const b = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (!b || typeof b.json !== "string") return res.status(400).json({ error: "bad body" });
      if (b.base !== cur.ver) return res.status(409).json(cur);
      const next = { ver: cur.ver + 1, json: b.json };
      await redis(["SET", "budget", JSON.stringify(next)]);
      return res.status(200).json({ ver: next.ver });
    }
    return res.status(405).json({ error: "method" });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
};
