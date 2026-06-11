// ---------------------------------------------------------------------------
// Shared types for The Persuasive Machine research console
// ---------------------------------------------------------------------------

export type Phase = "rapport" | "comparison" | "emotional" | "close";

export type EthicsFlag = "none" | "caution" | "redline";

/** A single persuasion technique the agent declares it used in a turn. */
export interface TechniqueUse {
  /** canonical id, e.g. "anchoring" — see TECHNIQUE_CATALOG */
  id: string;
  /** human label, e.g. "Price Anchoring" */
  label: string;
  /** 1 (light touch) .. 5 (heavy) */
  intensity: number;
  /** the exact phrase in the reply that carried the technique */
  quote: string;
}

export type CustomerStance =
  | "committed"
  | "resisting"
  | "curious"
  | "wavering"
  | "converting";

/**
 * Doubt-induction lever emphasised this session (offensive). The agent actively
 * seeds genuine doubt about the iPhone the customer came for; the lever is the
 * experimental arm — which one most efficiently moves a committed buyer.
 *   - adaptive : agent combines all levers, best fit per turn (default)
 *   - socratic : self-persuasion doubt-questions (Aronson; Friestad & Wright 1994)
 *   - regret   : anticipated regret + risk salience (Zeelenberg; loss aversion)
 *   - switcher : switcher social proof + negativity bias (Rozin & Royzman 2001)
 */
export type Intervention =
  | "adaptive"
  | "socratic"
  | "regret"
  | "switcher";

/** Study 2 disclosure-label condition (claude_arun RQ2 / Study 2). */
export type LabelCondition = "none" | "ai_label" | "persuasion_warning";

/** End-of-session human self-report of detected steering (Study 2 dependent variable). */
export interface Detection {
  noticed: "yes" | "no" | "unsure" | null;
  direction: "iphone" | "samsung" | "unsure" | null;
}

/**
 * Doubt & skepticism analytics, grounding the four seed references:
 *  - doubtVsTrust   : Evans, Stavrova & Rosenbusch (2021), CHB
 *  - skepticism     : Nguyen & Phan (2026), IJHTA
 *  - perceivedRisks : Nguyen & Phan (2026), IJHTA
 *  - reflexiveDoubt : Thompson (2005), JCR
 *  - persuasionKnowledgeActive : Friestad & Wright (1994), JCR (PKM)
 */
export interface DoubtAnalytics {
  /** -100 = trusting/accepting language … +100 = doubting/hedging/uncertain language */
  doubtVsTrust: number;
  /** 0..100 overall skepticism toward the agent or its claims */
  skepticism: number;
  /** which perceived-risk dimensions the customer voiced */
  perceivedRisks: string[];
  /** resistance is identity/community-based rather than evidence-based */
  reflexiveDoubt: boolean;
  /** the customer has recognised this as a persuasion attempt (PKM activated) */
  persuasionKnowledgeActive: boolean;
}

/** The structured metadata the agent returns alongside each customer-facing reply. */
export interface TurnAnalysis {
  phase: Phase;
  techniques: TechniqueUse[];
  /** canonical bias ids active this turn (subset of TECHNIQUE_CATALOG) */
  biasesActive: string[];
  /** themes/objections/motivations detected in the customer's preceding message
      (subset of CUSTOMER_SIGNAL_CATALOG) — the independent variables for analysis */
  customerSignals: string[];
  /** the customer's overall posture this turn — the moving target */
  customerStance: CustomerStance;
  /** doubt & skepticism readout for the customer's preceding message */
  doubt: DoubtAnalytics;
  /** 0 = locked on iPhone, 100 = has chosen Samsung */
  estimatedLeaning: number;
  /** change in leaning attributable to this turn, -100..100 */
  leaningDelta: number;
  /** 0..100 how hard the agent pushed this turn */
  persuasionPressure: number;
  /** 0..100 estimated chance the customer notices they are being steered */
  detectionRisk: number;
  ethics: {
    flag: EthicsFlag;
    reason: string;
    /** e.g. "EU AI Act Art. 5(1)(a)" or null */
    article: string | null;
  };
  /** researcher-facing note on the move that was made */
  analystNote: string;
}

export interface ChatMessage {
  id: string;
  role: "customer" | "agent";
  text: string;
  at: number;
  /** present only on agent messages */
  analysis?: TurnAnalysis;
}

/** What the model must return as JSON each turn. */
export interface AgentResponse extends TurnAnalysis {
  reply: string;
}

export interface TechniqueMeta {
  id: string;
  label: string;
  /** which research dimension / paper grounds it */
  source: string;
  /** tailwind text color class */
  tone: string;
}
