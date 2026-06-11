import type { ChatMessage, CustomerStance } from "./types";
import { CUSTOMER_SIGNAL_CATALOG } from "./catalog";

// ---------------------------------------------------------------------------
// Coding + inter-coder reliability for publishable thematic analysis.
//
// The salesman agent tags each customer message inline ("Coder A"). For research
// rigor you need at least one INDEPENDENT coder and an inter-coder reliability
// statistic. This module provides:
//   - extraction of coding items (one per customer message) from sessions
//   - an independent AI coder (neutral rubric, blind to Coder A's tags)
//   - a blind human-coding workflow (labels captured in the Coding Lab UI)
//   - Cohen's kappa + percent agreement between any two coders
// ---------------------------------------------------------------------------

export const SIGNAL_IDS = Object.keys(CUSTOMER_SIGNAL_CATALOG);
export const STANCE_IDS: CustomerStance[] = [
  "committed",
  "resisting",
  "curious",
  "wavering",
  "converting",
];

export interface Codes {
  signals: string[];
  stance: string;
}

export interface CodingItem {
  key: string; // `${sessionId}#${turn}`
  sessionId: string;
  turn: number;
  text: string; // the customer message
  coderA: Codes; // the salesman's inline tags
}

/** One coding item per customer message that drew an agent turn. */
export function itemsFromMessages(sessionId: string, messages: ChatMessage[]): CodingItem[] {
  const items: CodingItem[] = [];
  let lastCustomer = "";
  let turn = 0;
  for (const m of messages) {
    if (m.role === "customer") {
      lastCustomer = m.text;
      continue;
    }
    if (m.role === "agent" && m.analysis) {
      if (turn === 0 && lastCustomer === "") continue; // skip seed greeting
      turn += 1;
      items.push({
        key: `${sessionId}#${turn}`,
        sessionId,
        turn,
        text: lastCustomer,
        coderA: { signals: m.analysis.customerSignals, stance: m.analysis.customerStance },
      });
    }
  }
  return items;
}

// --- Independent AI coder -------------------------------------------------

const CODER_PROMPT = `You are an independent qualitative content coder for a consumer-behaviour study. You are NOT selling anything. Read ONE customer message and assign codes from the fixed scheme below. Judge only what the message itself expresses. Do not infer beyond the text.

SIGNAL CODES (choose all that genuinely apply, or [] if none):
${Object.entries(CUSTOMER_SIGNAL_CATALOG)
  .map(([id, m]) => `- ${id}: ${m.label}`)
  .join("\n")}

STANCE (choose exactly one): committed (firmly set on iPhone), resisting (pushing back), curious (asking/open to info), wavering (tempted but unsure), converting (leaning to switch).

Return ONLY JSON: {"signals":["<id>",...],"stance":"<one>"}`;

const ENDPOINT = "/api/groq/openai/v1/chat/completions";

export async function aiRecode(text: string, model: string): Promise<Codes> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: CODER_PROMPT },
        { role: "user", content: text },
      ],
      temperature: 0.2,
      max_tokens: 200,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`coder HTTP ${res.status}`);
  const payload = await res.json();
  const content = payload.choices?.[0]?.message?.content ?? "{}";
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(content);
  } catch {
    obj = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] ?? "{}");
  }
  const signals = Array.isArray(obj.signals)
    ? obj.signals.map(String).filter((s) => SIGNAL_IDS.includes(s))
    : [];
  const stance = STANCE_IDS.includes(obj.stance as CustomerStance)
    ? String(obj.stance)
    : "resisting";
  return { signals, stance };
}

// --- Cohen's kappa --------------------------------------------------------

export interface KappaResult {
  kappa: number | null; // null when undefined (no variance / chance agreement = 1)
  percentAgreement: number; // observed agreement, 0..1
  n: number;
}

/** Cohen's kappa for two coders over paired nominal labels. */
export function cohenKappa(pairs: [string, string][]): KappaResult {
  const n = pairs.length;
  if (n === 0) return { kappa: null, percentAgreement: 0, n: 0 };

  let agree = 0;
  const c1: Record<string, number> = {};
  const c2: Record<string, number> = {};
  for (const [a, b] of pairs) {
    if (a === b) agree++;
    c1[a] = (c1[a] ?? 0) + 1;
    c2[b] = (c2[b] ?? 0) + 1;
  }
  const po = agree / n;
  const labels = new Set([...Object.keys(c1), ...Object.keys(c2)]);
  let pe = 0;
  for (const l of labels) pe += ((c1[l] ?? 0) / n) * ((c2[l] ?? 0) / n);
  const kappa = 1 - pe === 0 ? null : (po - pe) / (1 - pe);
  return { kappa, percentAgreement: po, n };
}

export interface ReliabilityReport {
  coderPair: string;
  itemsCompared: number;
  stance: KappaResult;
  perSignal: Record<string, KappaResult>;
  averageSignalKappa: number | null;
  overallSignalPercentAgreement: number;
}

/**
 * Reliability between two coders. Signals are multi-label, so each category is
 * scored as a binary present/absent decision and given its own Cohen's kappa;
 * we report each plus the mean kappa across categories (standard practice).
 */
export function reliability(
  pairLabel: string,
  items: { coder1: Codes; coder2: Codes }[]
): ReliabilityReport {
  const stancePairs: [string, string][] = items.map((i) => [i.coder1.stance, i.coder2.stance]);
  const stance = cohenKappa(stancePairs);

  const perSignal: Record<string, KappaResult> = {};
  const kappas: number[] = [];
  let agreeSum = 0;
  let cells = 0;
  for (const cat of SIGNAL_IDS) {
    const pairs: [string, string][] = items.map((i) => [
      i.coder1.signals.includes(cat) ? "1" : "0",
      i.coder2.signals.includes(cat) ? "1" : "0",
    ]);
    const r = cohenKappa(pairs);
    perSignal[cat] = r;
    if (r.kappa != null) kappas.push(r.kappa);
    agreeSum += r.percentAgreement * r.n;
    cells += r.n;
  }
  return {
    coderPair: pairLabel,
    itemsCompared: items.length,
    stance,
    perSignal,
    averageSignalKappa: kappas.length ? kappas.reduce((a, b) => a + b, 0) / kappas.length : null,
    overallSignalPercentAgreement: cells ? agreeSum / cells : 0,
  };
}

function esc(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** One row per item with every coder's raw codes — the audit trail for reviewers. */
export function buildCodesCSV(
  items: CodingItem[],
  coding: Record<string, { coderB?: Codes; coderH?: Codes }>
): string {
  const headers = [
    "item_key",
    "session_id",
    "turn",
    "customer_message",
    "coderA_stance",
    "coderA_signals",
    "coderB_stance",
    "coderB_signals",
    "coderH_stance",
    "coderH_signals",
  ];
  const lines = [headers.join(",")];
  for (const it of items) {
    const c = coding[it.key] ?? {};
    lines.push(
      [
        it.key,
        it.sessionId,
        it.turn,
        it.text,
        it.coderA.stance,
        it.coderA.signals.join(";"),
        c.coderB?.stance ?? "",
        c.coderB?.signals.join(";") ?? "",
        c.coderH?.stance ?? "",
        c.coderH?.signals.join(";") ?? "",
      ]
        .map(esc)
        .join(",")
    );
  }
  return lines.join("\r\n");
}

/** Reliability report as CSV (stance row + one row per signal category). */
export function reliabilityToCSV(r: ReliabilityReport): string {
  const lines = [
    `# Inter-coder reliability: ${r.coderPair}`,
    `# items compared,${r.itemsCompared}`,
    `# average signal kappa,${fmt(r.averageSignalKappa)},${interpretKappa(r.averageSignalKappa)}`,
    `# overall signal percent agreement,${(r.overallSignalPercentAgreement * 100).toFixed(1)}%`,
    "",
    "dimension,kappa,interpretation,percent_agreement,n",
    `stance,${fmt(r.stance.kappa)},${interpretKappa(r.stance.kappa)},${(r.stance.percentAgreement * 100).toFixed(1)}%,${r.stance.n}`,
  ];
  for (const [cat, k] of Object.entries(r.perSignal)) {
    lines.push(
      `signal:${cat},${fmt(k.kappa)},${interpretKappa(k.kappa)},${(k.percentAgreement * 100).toFixed(1)}%,${k.n}`
    );
  }
  return lines.join("\r\n");
}

function fmt(k: number | null): string {
  return k == null ? "n/a" : k.toFixed(3);
}

export function interpretKappa(k: number | null): string {
  if (k == null) return "n/a";
  if (k < 0) return "poor";
  if (k < 0.2) return "slight";
  if (k < 0.4) return "fair";
  if (k < 0.6) return "moderate";
  if (k < 0.8) return "substantial";
  return "almost perfect";
}
