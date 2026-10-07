
const { redis } = require("./_lib");

// Temporary checker: shows yes/no for each setting, never any values. Delete after use.
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const has = (k) => Boolean(process.env[k]);
  const out = {
    USER1_NAME: has("USER1_NAME"),
    USER1_PASS: has("USER1_PASS"),
    USER2_NAME: has("USER2_NAME"),
    USER2_PASS: has("USER2_PASS"),
    SESSION_SECRET: has("SESSION_SECRET"),
    database_url_found: has("KV_REST_API_URL") || has("UPSTASH_REDIS_REST_URL"),
    database_token_found: has("KV_REST_API_TOKEN") || has("UPSTASH_REDIS_REST_TOKEN"),
    database_connection: "not tested",
  };
  try {
    await redis(["PING"]);
    out.database_connection = "ok";
  } catch (e) {
    out.database_connection = "failed: " + String(e.message || e).slice(0, 80);
  }
  res.status(200).json(out);
};
