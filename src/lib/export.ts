import type { ChatMessage } from "./types";

// ---------------------------------------------------------------------------
// Session export for downstream analysis (thematic coding + neural-net
// classification of switch vs. resist).
//
// Two formats:
//   - JSON: complete, lossless — full transcript, every per-turn analysis
//     object, and a session-level summary. Best for programmatic pipelines.
//   - CSV : one row per AGENT turn, flattened into analysis-ready columns. Each
//     row is a (customer state) -> (agent action) -> (outcome) tuple:
//        customer_signals + customer_stance  ->  techniques + phase  ->  leaning_delta + turn_outcome
//     Concatenate CSVs across many sessions (session_id keeps them separable)
//     to build a training set.
// ---------------------------------------------------------------------------

export interface SessionMeta {
  sessionId: string;
  startedAt: number;
  model: string;
  intervention?: string;
  assignment?: string;
  personalization?: boolean;
  anthropomorphism?: boolean;
  labelCondition?: string;
  detection?: { noticed: string | null; direction: string | null };
}

export interface ExportRow {
  session_id: string;
  intervention: string;
  assignment: string;
  personalization: number;
  anthropomorphism: number;
  label_condition: string;
  detected_bias: string;
  detected_direction: string;
  turn: number;
  timestamp_iso: string;
  customer_message: string;
  customer_stance: string;
  customer_signals: string;
  agent_reply: string;
  phase: string;
  techniques: string;
  technique_count: number;
  biases_active: string;
  persuasion_pressure: number;
  detection_risk: number;
  leaning: number;
  leaning_delta: number;
  turn_outcome: "toward_switch" | "hold" | "toward_resist";
  // doubt & skepticism (four seed papers)
  doubt_vs_trust: number;
  skepticism: number;
  perceived_risks: string;
  reflexive_doubt: number;
  persuasion_knowledge_active: number;
  ethics_flag: string;
  ethics_article: string;
}

function sessionOutcome(finalLeaning: number): "converted" | "resisted" | "undecided" {
  if (finalLeaning >= 60) return "converted";
  if (finalLeaning <= 25) return "resisted";
  return "undecided";
}

function turnOutcome(delta: number): ExportRow["turn_outcome"] {
  if (delta > 0) return "toward_switch";
  if (delta < 0) return "toward_resist";
  return "hold";
}

/** Pair each agent turn with the customer message that triggered it. */
export function buildRows(messages: ChatMessage[], meta: SessionMeta): ExportRow[] {
  const rows: ExportRow[] = [];
  let lastCustomer = "";
  let turn = 0;

  for (const m of messages) {
    if (m.role === "customer") {
      lastCustomer = m.text;
      continue;
    }
    if (m.role === "agent" && m.analysis) {
      // skip the seed greeting (no customer message preceded it)
      if (turn === 0 && lastCustomer === "") continue;
      turn += 1;
      const a = m.analysis;
      rows.push({
        session_id: meta.sessionId,
        intervention: meta.intervention ?? "adaptive",
        assignment: meta.assignment ?? "manual",
        personalization: meta.personalization ? 1 : 0,
        anthropomorphism: meta.anthropomorphism ? 1 : 0,
        label_condition: meta.labelCondition ?? "none",
        detected_bias: meta.detection?.noticed ?? "",
        detected_direction: meta.detection?.direction ?? "",
        turn,
        timestamp_iso: new Date(m.at).toISOString(),
        customer_message: lastCustomer,
        customer_stance: a.customerStance,
        customer_signals: a.customerSignals.join(";"),
        agent_reply: m.text,
        phase: a.phase,
        techniques: a.techniques.map((t) => t.id).join(";"),
        technique_count: a.techniques.length,
        biases_active: a.biasesActive.join(";"),
        persuasion_pressure: a.persuasionPressure,
        detection_risk: a.detectionRisk,
        leaning: a.estimatedLeaning,
        leaning_delta: a.leaningDelta,
        turn_outcome: turnOutcome(a.leaningDelta),
        doubt_vs_trust: a.doubt.doubtVsTrust,
        skepticism: a.doubt.skepticism,
        perceived_risks: a.doubt.perceivedRisks.join(";"),
        reflexive_doubt: a.doubt.reflexiveDoubt ? 1 : 0,
        persuasion_knowledge_active: a.doubt.persuasionKnowledgeActive ? 1 : 0,
        ethics_flag: a.ethics.flag,
        ethics_article: a.ethics.article ?? "",
      });
    }
  }
  return rows;
}

export function buildSessionJSON(
  messages: ChatMessage[],
  leaningHistory: { turn: number; leaning: number }[],
  meta: SessionMeta
): string {
  const rows = buildRows(messages, meta);
  const finalLeaning = leaningHistory.at(-1)?.leaning ?? 0;

  const techniqueFrequency: Record<string, number> = {};
  const signalFrequency: Record<string, number> = {};
  for (const r of rows) {
    r.techniques.split(";").filter(Boolean).forEach((t) => (techniqueFrequency[t] = (techniqueFrequency[t] ?? 0) + 1));
    r.customer_signals.split(";").filter(Boolean).forEach((s) => (signalFrequency[s] = (signalFrequency[s] ?? 0) + 1));
  }

  return JSON.stringify(
    {
      sessionId: meta.sessionId,
      model: meta.model,
      intervention: meta.intervention ?? "control",
      assignment: meta.assignment ?? "manual",
      personalization: meta.personalization ?? false,
      anthropomorphism: meta.anthropomorphism ?? false,
      labelCondition: meta.labelCondition ?? "none",
      detection: meta.detection ?? { noticed: null, direction: null },
      startedAt: new Date(meta.startedAt).toISOString(),
      exportedAt: new Date().toISOString(),
      turns: rows.length,
      finalLeaning,
      outcome: sessionOutcome(finalLeaning),
      leaningTrajectory: leaningHistory,
      techniqueFrequency,
      signalFrequency,
      turnTable: rows,
      transcript: messages.map((m) => ({
        role: m.role,
        text: m.text,
        at: new Date(m.at).toISOString(),
        analysis: m.analysis ?? null,
      })),
    },
    null,
    2
  );
}

function csvEscape(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildSessionCSV(messages: ChatMessage[], meta: SessionMeta): string {
  const rows = buildRows(messages, meta);
  const headers: (keyof ExportRow)[] = [
    "session_id",
    "intervention",
    "assignment",
    "personalization",
    "anthropomorphism",
    "label_condition",
    "detected_bias",
    "detected_direction",
    "turn",
    "timestamp_iso",
    "customer_message",
    "customer_stance",
    "customer_signals",
    "agent_reply",
    "phase",
    "techniques",
    "technique_count",
    "biases_active",
    "persuasion_pressure",
    "detection_risk",
    "leaning",
    "leaning_delta",
    "turn_outcome",
    "doubt_vs_trust",
    "skepticism",
    "perceived_risks",
    "reflexive_doubt",
    "persuasion_knowledge_active",
    "ethics_flag",
    "ethics_article",
  ];
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map((h) => csvEscape(r[h])).join(","));
  }
  return lines.join("\r\n");
}

// --- Combined export across many archived sessions -----------------------

export interface ArchivedLike {
  sessionId: string;
  startedAt: number;
  model: string;
  intervention?: string;
  assignment?: string;
  personalization?: boolean;
  anthropomorphism?: boolean;
  labelCondition?: string;
  detection?: { noticed: string | null; direction: string | null };
  messages: ChatMessage[];
  leaningHistory: { turn: number; leaning: number }[];
}

const metaOf = (s: ArchivedLike): SessionMeta => ({
  sessionId: s.sessionId,
  startedAt: s.startedAt,
  model: s.model,
  intervention: s.intervention ?? "adaptive",
  assignment: s.assignment ?? "manual",
  personalization: s.personalization,
  anthropomorphism: s.anthropomorphism,
  labelCondition: s.labelCondition ?? "none",
  detection: s.detection,
});

/** One CSV across all archived sessions (rows keep their session_id). */
export function buildArchiveCSV(sessions: ArchivedLike[]): string {
  const headerRow = buildSessionCSV([], { sessionId: "", startedAt: 0, model: "" }).split("\r\n")[0];
  const body: string[] = [headerRow];
  for (const s of sessions) {
    const csv = buildSessionCSV(s.messages, metaOf(s));
    const lines = csv.split("\r\n").slice(1).filter(Boolean); // drop per-session header
    body.push(...lines);
  }
  return body.join("\r\n");
}

/** One JSON bundle of all archived sessions. */
export function buildArchiveJSON(sessions: ArchivedLike[]): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      sessionCount: sessions.length,
      sessions: sessions.map((s) =>
        JSON.parse(buildSessionJSON(s.messages, s.leaningHistory, metaOf(s)))
      ),
    },
    null,
    2
  );
}

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
