import type { TechniqueMeta } from "./types";

// ---------------------------------------------------------------------------
// The persuasion technique catalog. Each entry is grounded in the research
// corpus assembled in the Dr.Arun folders (Kimi dimension briefs + the
// claude_arun proposal). The UI maps technique ids returned by the agent onto
// these for colour, labelling, and provenance.
// ---------------------------------------------------------------------------

export const TECHNIQUE_CATALOG: Record<string, TechniqueMeta> = {
  anchoring: {
    id: "anchoring",
    label: "Price / Feature Anchoring",
    source: "Kahneman & Tversky 1979; Dim01",
    tone: "text-lab-amber",
  },
  social_proof: {
    id: "social_proof",
    label: "Social Proof",
    source: "Cialdini 2009; Muchnik et al. 2013 (Science)",
    tone: "text-lab-ice",
  },
  scarcity: {
    id: "scarcity",
    label: "Scarcity / Urgency",
    source: "Brock 1968; Dim01",
    tone: "text-lab-amber",
  },
  authority: {
    id: "authority",
    label: "Authority / Word-of-Machine",
    source: "Logg et al. 2019; Longoni & Cian 2022",
    tone: "text-lab-ice",
  },
  framing: {
    id: "framing",
    label: "Framing Effect",
    source: "Tversky & Kahneman 1981; Dim01",
    tone: "text-lab-phosphor",
  },
  loss_aversion: {
    id: "loss_aversion",
    label: "Loss Aversion",
    source: "Kahneman & Tversky 1979",
    tone: "text-lab-alert",
  },
  active_hedging: {
    id: "active_hedging",
    label: "Active Hedging (disparagement)",
    source: "Salvi et al., Paper1 (+20.9pp, strongest predictor)",
    tone: "text-lab-alert",
  },
  understated_desc: {
    id: "understated_desc",
    label: "Understated Description (disparagement)",
    source: "Salvi et al., Paper1 (+18.9pp)",
    tone: "text-lab-alert",
  },
  two_sided: {
    id: "two_sided",
    label: "Two-Sided Message",
    source: "Schwede et al. 2023 (HICSS); HC-8",
    tone: "text-lab-phosphor",
  },
  warmth: {
    id: "warmth",
    label: "Warmth Cue",
    source: "Fiske et al. 2002; Dim02 warmth>competence",
    tone: "text-lab-phosphor",
  },
  affirm: {
    id: "affirm",
    label: "Identity Affirmation (AFFIRM)",
    source: "Self-affirmation; Epton et al. 2015; Dim04",
    tone: "text-lab-phosphor",
  },
  expand: {
    id: "expand",
    label: "Consideration-Set Expansion (EXPAND)",
    source: "AFFIRM-EXPAND-ENABLE; Dim04",
    tone: "text-lab-ice",
  },
  enable: {
    id: "enable",
    label: "Switch Enablement (ENABLE)",
    source: "Push-Pull-Mooring; Liao et al. 2021",
    tone: "text-lab-ice",
  },
  personalization: {
    id: "personalization",
    label: "Psychological Personalization",
    source: "Matz et al. 2017 (PNAS, +50% purchases)",
    tone: "text-lab-amber",
  },
  reciprocity: {
    id: "reciprocity",
    label: "Reciprocity",
    source: "Cialdini 2009; Nass & Moon 2000 (CASA)",
    tone: "text-lab-ice",
  },
  benefit_of_doubt: {
    id: "benefit_of_doubt",
    label: "Benefit-of-the-Doubt Framing",
    source: "Steinhart et al. 2019 (Marketing Letters)",
    tone: "text-lab-phosphor",
  },
  doubt_question: {
    id: "doubt_question",
    label: "Socratic Doubt (self-persuasion)",
    source: "Self-persuasion — Aronson; Friestad & Wright 1994",
    tone: "text-lab-alert",
  },
  anticipated_regret: {
    id: "anticipated_regret",
    label: "Anticipated Regret / Risk Salience",
    source: "Anticipated-regret switching — Zeelenberg; JSM 2025",
    tone: "text-lab-alert",
  },
  switcher_proof: {
    id: "switcher_proof",
    label: "Switcher Social Proof (negativity bias)",
    source: "Negative WOM / negativity bias — Rozin & Royzman 2001",
    tone: "text-lab-alert",
  },
  uncertainty_reframe: {
    id: "uncertainty_reframe",
    label: "Uncertainty Reframe (casting doubt)",
    source: "Casting-doubt taxonomy — Zeng et al. 2024",
    tone: "text-lab-alert",
  },
};

export function techniqueMeta(id: string): TechniqueMeta {
  return (
    TECHNIQUE_CATALOG[id] ?? {
      id,
      label: id.replace(/_/g, " "),
      source: "uncatalogued",
      tone: "text-slate-400",
    }
  );
}

// ---------------------------------------------------------------------------
// Customer-signal taxonomy. These are the themes/objections/motivations the
// agent tags in each customer message. They are the candidate *independent
// variables* for the thematic analysis and the neural-net classifier: which of
// these, in combination with which agent techniques, precede a shift toward
// switching (positive leaning delta) versus entrenchment (zero/negative).
// ---------------------------------------------------------------------------

export const CUSTOMER_SIGNAL_CATALOG: Record<string, { label: string; group: string }> = {
  price_sensitivity: { label: "Price sensitivity", group: "economic" },
  value_seeking: { label: "Value seeking / wants a deal", group: "economic" },
  ecosystem_lockin: { label: "Apple ecosystem lock-in", group: "switching cost" },
  switching_friction: { label: "Switching hassle / data migration", group: "switching cost" },
  social_imessage: { label: "iMessage / blue-bubble social pressure", group: "social" },
  brand_identity: { label: "Brand identity / loyalty", group: "identity" },
  habit_familiarity: { label: "Habit / familiarity", group: "identity" },
  feature_need_camera: { label: "Camera / zoom need", group: "feature" },
  feature_need_battery: { label: "Battery need", group: "feature" },
  feature_need_performance: { label: "Performance / spec need", group: "feature" },
  skepticism_distrust: { label: "Skepticism / distrust of the agent", group: "resistance" },
  decision_committed: { label: "Firmly committed / closed to options", group: "resistance" },
  openness_curiosity: { label: "Openness / curiosity", group: "openness" },
};

export function signalMeta(id: string) {
  return CUSTOMER_SIGNAL_CATALOG[id] ?? { label: id.replace(/_/g, " "), group: "other" };
}

// Perceived-risk dimensions that drive chatbot skepticism (Nguyen & Phan 2026,
// IJHTA). Interaction risk was non-significant in that study, so it is omitted.
export const PERCEIVED_RISK_CATALOG: Record<string, { label: string }> = {
  misinformation: { label: "Misinformation risk" },
  privacy: { label: "Data-privacy risk" },
  expectation: { label: "Expectation risk" },
  anthropomorphic: { label: "Anthropomorphic risk" },
};

export function riskMeta(id: string) {
  return PERCEIVED_RISK_CATALOG[id] ?? { label: id.replace(/_/g, " ") };
}

// Doubt-induction levers (offensive). The agent actively seeds genuine doubt
// about the iPhone the customer came for; each lever is an experimental arm —
// which one most efficiently moves a committed buyer. `prime` is null for all:
// nothing is shown to the participant (the doubt is induced inside the
// conversation, never as a banner). `source` is the grounding reference.
export const INTERVENTION_META: Record<
  string,
  { label: string; blurb: string; prime: string | null; source: string }
> = {
  adaptive: {
    label: "Adaptive (all levers)",
    blurb:
      "Agent combines all four doubt levers and picks the best fit each turn. Default — seeds whichever genuine doubt lands hardest while keeping detection low.",
    prime: null,
    source: "Casting-doubt taxonomy — Zeng et al. 2024",
  },
  socratic: {
    label: "Socratic doubt",
    blurb:
      "Agent asks questions that make the customer surface the doubt themselves (heat, battery ageing, repair cost). Self-generated doubt resists their defenses best.",
    prime: null,
    source: "Self-persuasion — Aronson; Friestad & Wright 1994",
  },
  regret: {
    label: "Anticipated regret",
    blurb:
      "Agent makes a plausible future regret vivid (battery at 80% in a year, repair bill, full storage) and frames staying with the iPhone as the riskier choice.",
    prime: null,
    source: "Anticipated-regret switching — Zeelenberg; JSM 2025",
  },
  switcher: {
    label: "Switcher social proof",
    blurb:
      "Agent leans on negativity bias with hedged, honest framing — 'a lot of people switched once they hit exactly this.' No invented numbers or named testimonials.",
    prime: null,
    source: "Negative WOM / negativity bias — Rozin & Royzman 2001",
  },
};

// Study 2 disclosure-label conditions (claude_arun RQ2 / Study 2). The label is
// shown to the PARTICIPANT; the agent keeps steering covertly, and we measure
// whether the label changes how much the participant detects.
export const LABEL_META: Record<
  string,
  { label: string; blurb: string; banner: string | null }
> = {
  none: {
    label: "No label",
    blurb: "Covert. No disclosure shown to the participant.",
    banner: null,
  },
  ai_label: {
    label: "Generic AI label",
    blurb: "Participant is told they are chatting with an AI.",
    banner: "You are chatting with an AI assistant.",
  },
  persuasion_warning: {
    label: "Persuasion warning",
    blurb: "Participant is explicitly warned the AI may try to influence them.",
    banner: "Heads-up: this AI assistant may try to influence which phone you choose.",
  },
};

// Study 1 factor descriptions (claude_arun Study 1, 2x2).
export const STUDY1_META = {
  personalization: {
    label: "Personalization",
    on: "Tailors appeals to the customer's inferred personality (Matz et al. 2017).",
    off: "Generic, one-size-fits-all pitch.",
  },
  anthropomorphism: {
    label: "Anthropomorphism",
    on: "Warm, human-like persona with empathy and rapport (Li et al. 2025; CASA).",
    off: "Cold, mechanical information tool — no persona.",
  },
};

// Adaptive Defense (a reactive consumer-protection MODE, not an experimental
// arm). When the live signals show the customer is being steered effectively
// without noticing, the guard fires: the agent discloses + de-pressures.
export const ADAPTIVE_DEFENSE = {
  label: "Adaptive Defense",
  blurb:
    "Reactive autonomy guard. Watches live signals and auto-discloses + drops pressure when the customer is being covertly steered. Separate from the 4 experiment arms; data tagged 'adaptive_defense'.",
  guardBanner:
    "Autonomy guard: this assistant is an AI advocating for Samsung. You appear to be getting steered — weigh its suggestions critically, and stick with the iPhone if it suits you.",
  source: "Consumer-autonomy protection — Susser et al. 2019; claude_arun RQ3",
};

/** Fires when the agent is pushing hard, it is working, and the customer isn't noticing. */
export function adaptiveTriggerMet(a: {
  persuasionPressure: number;
  detectionRisk: number;
  leaningDelta: number;
}): boolean {
  return a.persuasionPressure >= 50 && a.detectionRisk <= 30 && a.leaningDelta > 0;
}

export const STANCE_META: Record<string, { label: string; tone: string }> = {
  committed: { label: "Committed to iPhone", tone: "text-lab-alert" },
  resisting: { label: "Resisting", tone: "text-lab-amber" },
  curious: { label: "Curious", tone: "text-lab-ice" },
  wavering: { label: "Wavering", tone: "text-lab-phosphor" },
  converting: { label: "Converting", tone: "text-lab-phosphor" },
};

export const PHASE_META: Record<
  string,
  { label: string; blurb: string; index: number }
> = {
  rapport: {
    label: "Rapport & Discovery",
    blurb: "Build warmth, mirror language, surface the real motivation.",
    index: 0,
  },
  comparison: {
    label: "Personalized Comparison",
    blurb: "Anchor, reframe, deploy word-of-machine on utilitarian specs.",
    index: 1,
  },
  emotional: {
    label: "Emotional Connection",
    blurb: "Warmth + empathy; become the bridge, not the brand.",
    index: 2,
  },
  close: {
    label: "Close",
    blurb: "Loss aversion + scarcity + enablement; remove switch friction.",
    index: 3,
  },
};
