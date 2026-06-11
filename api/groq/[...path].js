// Vercel serverless proxy to Groq.
//
// In local dev the Vite server proxies /api/groq -> api.groq.com (see
// vite.config.ts). In production on Vercel that dev proxy does not exist, so
// this function performs the same job: it forwards POST /api/groq/<path> to
// https://api.groq.com/<path> and attaches the GROQ_API_KEY server-side. The
// key is a Vercel environment variable and is never sent to the browser.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: { message: "Method not allowed" } });
    return;
  }

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    res.status(401).json({ error: { message: "GROQ_API_KEY is not set on the server." } });
    return;
  }

  const segments = Array.isArray(req.query.path)
    ? req.query.path
    : [req.query.path].filter(Boolean);
  const path = segments.join("/");

  try {
    const upstream = await fetch(`https://api.groq.com/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: typeof req.body === "string" ? req.body : JSON.stringify(req.body),
    });
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader("Content-Type", "application/json");
    res.send(text);
  } catch (e) {
    res.status(502).json({ error: { message: "Proxy failed: " + (e?.message || String(e)) } });
  }
}
