// Vercel serverless proxy to Groq (production).
//
// In local dev the Vite server proxies /api/groq -> api.groq.com and attaches
// the key (see vite.config.ts). In production that dev proxy does not exist, so
// this function does the same job: it forwards the chat-completions request to
// Groq with the GROQ_API_KEY attached server-side. The key is a Vercel
// environment variable and is never sent to the browser.
//
// The client always calls /api/groq/openai/v1/chat/completions. In production a
// rewrite in vercel.json maps that path to this fixed function, so the only
// upstream endpoint we ever need is the chat-completions one below.
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: { message: "Method not allowed" } });
    return;
  }

  // A Groq key is printable ASCII ("gsk_..."). Strip any non-printable-ASCII
  // bytes the value may have picked up when the env var was set — PowerShell
  // piping can prepend a U+FEFF BOM, and HTTP header values must be
  // ByteString-safe, so a stray BOM would otherwise crash the fetch.
  const key = (process.env.GROQ_API_KEY || "").replace(/[^\x21-\x7E]/g, "");
  if (!key) {
    res.status(401).json({ error: { message: "GROQ_API_KEY is not set on the server." } });
    return;
  }

  try {
    const upstream = await fetch(GROQ_ENDPOINT, {
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
