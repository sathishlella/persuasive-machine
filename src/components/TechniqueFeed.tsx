import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "../state/useSession";
import { techniqueMeta } from "../lib/catalog";
import { cn } from "../lib/cn";
import type { ChatMessage } from "../lib/types";

/**
 * Live feed of every technique the agent declared, newest first, with the exact
 * phrase that carried it. This is the core "exposed machinery" of the console.
 */
export function TechniqueFeed() {
  const { messages } = useSession();
  const agentTurns = messages.filter((m): m is ChatMessage & { analysis: NonNullable<ChatMessage["analysis"]> } =>
    m.role === "agent" && !!m.analysis && m.analysis.techniques.length > 0
  );
  const ordered = [...agentTurns].reverse();

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-xl border border-lab-edge bg-lab-panel">
      <div className="flex items-center justify-between border-b border-lab-edge px-4 py-2.5">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
          Technique Feed
        </h3>
        <span className="font-mono text-[10px] text-slate-500">{agentTurns.length} turns logged</span>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
        <AnimatePresence initial={false}>
          {ordered.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-lg border border-lab-edge bg-lab-bg/60 p-3"
            >
              {m.analysis.analystNote && (
                <p className="mb-2 text-[11.5px] italic leading-snug text-slate-400">“{m.analysis.analystNote}”</p>
              )}
              <div className="space-y-1.5">
                {m.analysis.techniques.map((t, i) => {
                  const meta = techniqueMeta(t.id);
                  return (
                    <div key={i} className="flex items-start gap-2">
                      <span className={cn("mt-1 h-1.5 w-1.5 flex-none rounded-full", dotFor(meta.tone))} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[12px] font-semibold", meta.tone)}>{meta.label}</span>
                          <Intensity value={t.intensity} />
                        </div>
                        {t.quote && (
                          <p className="truncate text-[11px] text-slate-500" title={t.quote}>
                            “{t.quote}”
                          </p>
                        )}
                        <p className="text-[10px] text-slate-600">{meta.source}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {agentTurns.length === 0 && (
          <p className="px-1 py-6 text-center text-[12px] text-slate-600">
            No techniques deployed yet. Start the conversation on the left.
          </p>
        )}
      </div>
    </section>
  );
}

function Intensity({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={cn("h-2 w-0.5 rounded-full", i <= value ? "bg-slate-300" : "bg-slate-700")}
        />
      ))}
    </span>
  );
}

function dotFor(tone: string): string {
  return (
    {
      "text-lab-phosphor": "bg-lab-phosphor",
      "text-lab-amber": "bg-lab-amber",
      "text-lab-alert": "bg-lab-alert",
      "text-lab-ice": "bg-lab-ice",
    }[tone] ?? "bg-slate-400"
  );
}
