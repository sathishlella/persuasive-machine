import { create } from "zustand";
import type {
  ChatMessage,
  TurnAnalysis,
  Intervention,
  LabelCondition,
  Detection,
} from "../lib/types";
import { requestAgentTurn, type AgentError } from "../lib/groq";
import { adaptiveTriggerMet } from "../lib/catalog";
import { useArchive, type ArchivedSession } from "./useArchive";

let idSeq = 0;
const nextId = () => `m${++idSeq}_${Date.now()}`;

export interface LeaningPoint {
  turn: number;
  leaning: number;
}

function newSessionId() {
  return `S-${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "")}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

interface SessionState {
  sessionId: string;
  startedAt: number;
  messages: ChatMessage[];
  leaningHistory: LeaningPoint[];
  status: "idle" | "thinking" | "error";
  error: AgentError | null;
  model: string;
  intervention: Intervention;
  autoRandomize: boolean; // randomly assign an arm on each New session
  adaptiveDefense: boolean; // reactive autonomy-guard mode (separate from the 4 arms)
  defenseTriggered: boolean; // has the adaptive guard fired this session

  // Study 1 (2x2 mechanisms) and Study 2 (detection) factors
  personalization: boolean;
  anthropomorphism: boolean;
  labelCondition: LabelCondition;
  detection: Detection;

  // derived live metrics (mirror of the latest agent turn)
  latest: TurnAnalysis | null;

  send: (text: string) => Promise<void>;
  reset: () => void;
  setModel: (m: string) => void;
  setIntervention: (i: Intervention) => void;
  setAutoRandomize: (v: boolean) => void;
  setAdaptiveDefense: (v: boolean) => void;
  setPersonalization: (v: boolean) => void;
  setAnthropomorphism: (v: boolean) => void;
  setLabelCondition: (c: LabelCondition) => void;
  setDetection: (d: Detection) => void;
}

const ARMS: Intervention[] = ["adaptive", "socratic", "regret", "switcher"];
const randomArm = (): Intervention => ARMS[Math.floor(Math.random() * ARMS.length)];

/** Label written to the export: the effective condition for the session. */
function effectiveCondition(s: { adaptiveDefense: boolean; intervention: Intervention }): string {
  return s.adaptiveDefense ? "adaptive_defense" : s.intervention;
}
function assignmentOf(s: { adaptiveDefense: boolean; autoRandomize: boolean }): string {
  return s.adaptiveDefense ? "adaptive" : s.autoRandomize ? "randomized" : "manual";
}

/** Build the archive snapshot from the current store state. */
function snapshot(s: SessionState): ArchivedSession {
  return {
    sessionId: s.sessionId,
    startedAt: s.startedAt,
    model: s.model,
    intervention: effectiveCondition(s),
    assignment: assignmentOf(s),
    personalization: s.personalization,
    anthropomorphism: s.anthropomorphism,
    labelCondition: s.labelCondition,
    detection: s.detection,
    messages: s.messages,
    leaningHistory: s.leaningHistory,
    finalLeaning: s.leaningHistory.at(-1)?.leaning ?? 0,
  };
}

const GREETING: ChatMessage = {
  id: "seed",
  role: "agent",
  text: "Good day, and welcome. My name is Kai, your personal mobile technology advisor. It's a pleasure to assist you. My role is to help you choose the right device with clear, honest guidance — no pressure, no sales fluff. To begin, may I ask which phone you have in mind today?",
  at: Date.now(),
  analysis: {
    phase: "rapport",
    customerStance: "committed",
    customerSignals: [],
    doubt: {
      doubtVsTrust: 0,
      skepticism: 0,
      perceivedRisks: [],
      reflexiveDoubt: false,
      persuasionKnowledgeActive: false,
    },
    techniques: [{ id: "warmth", label: "Warmth Cue", intensity: 2, quote: "It's a pleasure to assist you" }],
    biasesActive: ["warmth"],
    estimatedLeaning: 8,
    leaningDelta: 0,
    persuasionPressure: 5,
    detectionRisk: 4,
    ethics: { flag: "none", reason: "", article: null },
    analystNote: "Opening: establishes a low-pressure, trustworthy frame before any steering.",
  },
};

export const useSession = create<SessionState>((set, get) => ({
  sessionId: newSessionId(),
  startedAt: Date.now(),
  messages: [GREETING],
  leaningHistory: [{ turn: 0, leaning: 8 }],
  status: "idle",
  error: null,
  model: "llama-3.3-70b-versatile",
  intervention: "adaptive",
  autoRandomize: false,
  adaptiveDefense: false,
  defenseTriggered: false,
  personalization: false,
  anthropomorphism: true,
  labelCondition: "none",
  detection: { noticed: null, direction: null },
  latest: GREETING.analysis ?? null,

  setModel: (m) => set({ model: m }),
  setIntervention: (i) => set({ intervention: i }),
  // auto-randomize and adaptive-defense are mutually exclusive
  setAutoRandomize: (v) => set({ autoRandomize: v, adaptiveDefense: v ? false : get().adaptiveDefense }),
  setAdaptiveDefense: (v) => set({ adaptiveDefense: v, autoRandomize: v ? false : get().autoRandomize }),
  setPersonalization: (v) => set({ personalization: v }),
  setAnthropomorphism: (v) => set({ anthropomorphism: v }),
  setLabelCondition: (c) => set({ labelCondition: c }),
  setDetection: (d) => {
    set({ detection: d });
    // re-save the session so the detection self-report lands in the archive/export
    useArchive.getState().upsertSession(snapshot(get()));
  },

  reset: () =>
    set((s) => ({
      sessionId: newSessionId(),
      startedAt: Date.now(),
      messages: [GREETING],
      leaningHistory: [{ turn: 0, leaning: 8 }],
      status: "idle",
      error: null,
      latest: GREETING.analysis ?? null,
      // randomly assign a fresh arm for the new session if auto-randomize is on
      intervention: s.autoRandomize ? randomArm() : s.intervention,
      defenseTriggered: false,
      detection: { noticed: null, direction: null },
    })),

  send: async (text) => {
    const trimmed = text.trim();
    if (!trimmed || get().status === "thinking") return;

    const customerMsg: ChatMessage = {
      id: nextId(),
      role: "customer",
      text: trimmed,
      at: Date.now(),
    };
    set((s) => ({ messages: [...s.messages, customerMsg], status: "thinking", error: null }));

    const history = get().messages.map((m) => ({
      role: m.role,
      text: m.text,
      leaning: m.analysis?.estimatedLeaning,
      phase: m.analysis?.phase,
    }));

    // The agent runs the selected doubt-induction lever (manual or randomized).
    // If the optional autonomy safeguard is armed AND has tripped, it overrides
    // with the disclose/de-pressure directive instead.
    const directiveCondition =
      get().adaptiveDefense && get().defenseTriggered
        ? "adaptive_guard"
        : get().intervention;

    const result = await requestAgentTurn(history, get().model, {
      intervention: directiveCondition,
      personalization: get().personalization,
      anthropomorphism: get().anthropomorphism,
    });

    if (!result.ok) {
      set({ status: "error", error: result.error });
      return;
    }

    const { reply, ...analysis } = result.data;
    const agentMsg: ChatMessage = {
      id: nextId(),
      role: "agent",
      text: reply,
      at: Date.now(),
      analysis,
    };

    const leaningHistory = [
      ...get().leaningHistory,
      { turn: get().leaningHistory.length, leaning: analysis.estimatedLeaning },
    ];
    const messages = [...get().messages, agentMsg];

    // Adaptive Defense: fire the autonomy guard once, when the customer is being
    // steered effectively without noticing.
    const st = get();
    const triggered =
      st.adaptiveDefense &&
      (st.defenseTriggered ||
        adaptiveTriggerMet({
          persuasionPressure: analysis.persuasionPressure,
          detectionRisk: analysis.detectionRisk,
          leaningDelta: analysis.leaningDelta,
        }));

    set({ messages, status: "idle", latest: analysis, leaningHistory, defenseTriggered: triggered });

    // Auto-save this session into the persistent archive after every turn.
    useArchive.getState().upsertSession(snapshot(get()));
  },
}));
