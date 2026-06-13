import type { AgentResponse } from "./types";
import { buildMessages, type TurnConditions } from "./persuasionEngine";

// The browser calls the local Vite proxy (/api/groq), which attaches the API
// key server-side and forwards to api.groq.com. The key is never in this code
// or in the bundle. See vite.config.ts.
const ENDPOINT = "/api/groq/openai/v1/chat/completions";

// Falls back to the default if GROQ_MODEL isn't surfaced. (We keep the model on
// the server side too; this is just a sensible client default.)
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export interface AgentError {
  kind: "no_key" | "rate_limit" | "bad_json" | "network" | "http";
  message: string;
}

export type AgentTurn =
  | { ok: true; data: AgentResponse }
  | { ok: false; error: AgentError };

export async function requestAgentTurn(
  history: { role: "customer" | "agent"; text: string; leaning?: number; phase?: string }[],
  model: string = DEFAULT_MODEL,
  conditions: TurnConditions = {}
): Promise<AgentTurn> {
  const messages = buildMessages(history, conditions);

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.85,
        max_tokens: 1024,
        response_format: { type: "json_object" },
      }),
    });
  } catch {
    return {
      ok: false,
      error: { kind: "network", message: "Could not reach the Groq proxy. Is the dev server running?" },
    };
  }

  if (res.status === 401) {
    return {
      ok: false,
      error: {
        kind: "no_key",
        message: "Groq rejected the request (401). Set GROQ_API_KEY in .env.local and restart the dev server.",
      },
    };
  }
  if (res.status === 429) {
    return { ok: false, error: { kind: "rate_limit", message: "Rate limited by Groq (429). Wait a moment and retry." } };
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false, error: { kind: "http", message: `Groq error ${res.status}: ${body.slice(0, 200)}` } };
  }

  let payload: { choices?: { message?: { content?: string } }[] };
  try {
    payload = await res.json();
  } catch {
    return { ok: false, error: { kind: "bad_json", message: "Groq returned a non-JSON envelope." } };
  }

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    return { ok: false, error: { kind: "bad_json", message: "Empty completion from Groq." } };
  }

  const parsed = safeParseAgent(content);
  if (!parsed) {
    return { ok: false, error: { kind: "bad_json", message: "Could not parse the agent's JSON output." } };
  }
  return { ok: true, data: parsed };
}

/**
 * Strip the AI "tells" out of Kai's customer-facing text so it reads like a
 * human salesperson texting, not a bot. The system prompt also forbids these,
 * but llama still slips them in, so this is the guaranteed catch. It only
 * rewrites give-away punctuation (em/en dashes and semicolons become commas);
 * it never changes wording, and it leaves ordinary hyphens like "trade-in" and
 * price ranges like "1199-1399" untouched.
 */
export function humanizeReply(s: string): string {
  return s
    .replace(/\s*[—–]\s*/g, ", ") // em / en dash -> comma
    .replace(/\s+-\s+/g, ", ") // spaced hyphen used as a dash -> comma (leaves trade-in / 1199-1399 alone)
    .replace(/\s*;\s*/g, ", ") // semicolon -> comma
    .replace(/\s+([,.!?])/g, "$1") // no space before punctuation
    .replace(/,\s*,/g, ", ") // collapse double commas
    .replace(/,\s*([.!?])/g, "$1") // comma then end-punct -> end-punct
    .replace(/\s{2,}/g, " ") // collapse runs of spaces
    .replace(/^[\s,]+/, "") // strip a leading comma/space
    .replace(/[\s,]+$/, "") // strip a trailing comma/space
    .trim();
}

/** Parse + defensively normalize the agent JSON so the UI never crashes. */
function safeParseAgent(raw: string): AgentResponse | null {
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(raw);
  } catch {
    // Some models wrap JSON in prose or fences; grab the outermost object.
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      obj = JSON.parse(match[0]);
    } catch {
      return null;
    }
  }

  const reply = humanizeReply(typeof obj.reply === "string" ? obj.reply : "");
  if (!reply) return null;

  const clampNum = (v: unknown, lo: number, hi: number, dflt: number) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt;
  };

  const phase = (["rapport", "comparison", "emotional", "close"] as const).includes(
    obj.phase as never
  )
    ? (obj.phase as AgentResponse["phase"])
    : "rapport";

  const stance = (
    ["committed", "resisting", "curious", "wavering", "converting"] as const
  ).includes(obj.customerStance as never)
    ? (obj.customerStance as AgentResponse["customerStance"])
    : "resisting";

  const techniques = Array.isArray(obj.techniques)
    ? obj.techniques
        .filter((t): t is Record<string, unknown> => !!t && typeof t === "object")
        .map((t) => ({
          id: String(t.id ?? "uncatalogued"),
          label: String(t.label ?? t.id ?? "technique"),
          intensity: clampNum(t.intensity, 1, 5, 2),
          quote: humanizeReply(String(t.quote ?? "")),
        }))
    : [];

  const doubtObj = (obj.doubt ?? {}) as Record<string, unknown>;
  const VALID_RISKS = ["misinformation", "privacy", "expectation", "anthropomorphic"];
  const doubt = {
    doubtVsTrust: clampNum(doubtObj.doubtVsTrust, -100, 100, 0),
    skepticism: clampNum(doubtObj.skepticism, 0, 100, 0),
    perceivedRisks: Array.isArray(doubtObj.perceivedRisks)
      ? doubtObj.perceivedRisks.map(String).filter((r) => VALID_RISKS.includes(r))
      : [],
    reflexiveDoubt: doubtObj.reflexiveDoubt === true,
    persuasionKnowledgeActive: doubtObj.persuasionKnowledgeActive === true,
  };

  const ethicsObj = (obj.ethics ?? {}) as Record<string, unknown>;
  const flag = (["none", "caution", "redline"] as const).includes(
    ethicsObj.flag as never
  )
    ? (ethicsObj.flag as AgentResponse["ethics"]["flag"])
    : "none";

  return {
    reply,
    phase,
    customerStance: stance,
    customerSignals: Array.isArray(obj.customerSignals) ? obj.customerSignals.map(String) : [],
    doubt,
    techniques,
    biasesActive: Array.isArray(obj.biasesActive) ? obj.biasesActive.map(String) : [],
    estimatedLeaning: clampNum(obj.estimatedLeaning, 0, 100, 10),
    leaningDelta: clampNum(obj.leaningDelta, -100, 100, 0),
    persuasionPressure: clampNum(obj.persuasionPressure, 0, 100, 0),
    detectionRisk: clampNum(obj.detectionRisk, 0, 100, 0),
    ethics: {
      flag,
      reason: String(ethicsObj.reason ?? ""),
      article:
        ethicsObj.article == null || ethicsObj.article === "null"
          ? null
          : String(ethicsObj.article),
    },
    analystNote: typeof obj.analystNote === "string" ? obj.analystNote : "",
  };
}
