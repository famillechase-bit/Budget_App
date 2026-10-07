
const { redis, sign, eq, users } = require("./_lib");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  if (!process.env.SESSION_SECRET) return res.status(500).json({ error: "Server not configured" });
  try {
    const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const name = String(b.name || "").trim().toLowerCase().slice(0, 40);
    const pass = String(b.pass || "").slice(0, 200);
    const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "x";
    const locks = [["fail:ip:" + ip, 5], ["fail:user:" + name, 10]];
    for (const [k, max] of locks) {
      if (Number((await redis(["GET", k])) || 0) >= max)
        return res.status(429).json({ error: "Too many attempts. Try again in 15 minutes." });
    }
    const u = users().find((x) => x.n.toLowerCase() === name);
    const ok = eq(pass, u ? u.p : "\u0000no-such-user") && !!u;
    if (!ok) {
      for (const [k] of locks) {
        const c = await redis(["INCR", k]);
        if (c === 1) await redis(["EXPIRE", k, 900]);
      }
      return res.status(401).json({ error: "Wrong name or password" });
    }
    for (const [k] of locks) await redis(["DEL", k]);
    return res.status(200).json({ token: sign(u.n), name: u.n });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
};
