const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "OPENAI_API_KEY is not configured" });
    return;
  }

  const payload = normalizePayload(req.body);
  if (!payload) {
    res.status(400).json({ error: "Invalid JSON payload" });
    return;
  }

  try {
    const upstream = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const text = await upstream.text();
    const contentType = upstream.headers.get("content-type") || "application/json; charset=utf-8";

    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", contentType);
    res.status(upstream.status).send(text);
  } catch (err) {
    const message = err && err.message ? err.message : "Upstream request failed";
    res.status(502).json({ error: message });
  }
};

function normalizePayload(body) {
  if (!body) return null;
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch (_) {
      return null;
    }
  }
  if (typeof body === "object") return body;
  return null;
}
