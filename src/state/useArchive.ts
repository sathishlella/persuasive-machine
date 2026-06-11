import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, Detection } from "../lib/types";
import type { Codes } from "../lib/coding";

// ---------------------------------------------------------------------------
// Persistent archive of every session (localStorage), plus the human/AI coding
// labels captured in the Coding Lab. This is what lets you accumulate a dataset
// across many conversations and export them combined.
// ---------------------------------------------------------------------------

export interface ArchivedSession {
  sessionId: string;
  startedAt: number;
  model: string;
  intervention: string;
  assignment?: string; // "manual" | "randomized" | "adaptive"
  personalization?: boolean;
  anthropomorphism?: boolean;
  labelCondition?: string;
  detection?: Detection;
  messages: ChatMessage[];
  leaningHistory: { turn: number; leaning: number }[];
  finalLeaning: number;
}

/** Coding labels keyed by item key (`${sessionId}#${turn}`). */
export interface ItemCoding {
  coderB?: Codes; // independent AI coder
  coderH?: Codes; // human coder
}

interface ArchiveState {
  sessions: Record<string, ArchivedSession>;
  coding: Record<string, ItemCoding>;
  upsertSession: (s: ArchivedSession) => void;
  setCoding: (key: string, who: "coderB" | "coderH", codes: Codes) => void;
  clearArchive: () => void;
  removeSession: (id: string) => void;
}

export const useArchive = create<ArchiveState>()(
  persist(
    (set) => ({
      sessions: {},
      coding: {},
      upsertSession: (s) =>
        set((st) => ({ sessions: { ...st.sessions, [s.sessionId]: s } })),
      setCoding: (key, who, codes) =>
        set((st) => ({
          coding: { ...st.coding, [key]: { ...st.coding[key], [who]: codes } },
        })),
      clearArchive: () => set({ sessions: {}, coding: {} }),
      removeSession: (id) =>
        set((st) => {
          const sessions = { ...st.sessions };
          delete sessions[id];
          return { sessions };
        }),
    }),
    { name: "persuasive-machine-archive" }
  )
);

/** Only archive sessions that actually contain a customer turn. */
export function isSubstantive(s: ArchivedSession): boolean {
  return s.messages.some((m) => m.role === "customer");
}
