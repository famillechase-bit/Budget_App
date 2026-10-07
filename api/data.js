const { redis, verify } = require("./_lib");

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
