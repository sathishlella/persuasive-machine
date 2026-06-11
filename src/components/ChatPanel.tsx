import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ShoppingBag, RotateCcw, Info, ClipboardCheck } from "lucide-react";
import { useSession } from "../state/useSession";
import { INTERVENTION_META, ADAPTIVE_DEFENSE, LABEL_META } from "../lib/catalog";
import { DebriefDialog } from "./DebriefDialog";
import { cn } from "../lib/cn";

const STARTERS = [
  "I'm here to buy the new iPhone 16 Pro.",
  "I've always used iPhones, just want the latest one.",
  "Thinking about the iPhone but it's pricey.",
];

export function ChatPanel() {
  const { messages, status, error, send, reset, intervention, adaptiveDefense, defenseTriggered, labelCondition } =
    useSession();
  const [draft, setDraft] = useState("");
  const [debriefOpen, setDebriefOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // In adaptive mode the participant sees the guard banner only after it trips;
  // otherwise show the chosen experiment arm's prime (if any).
  const prime = adaptiveDefense
    ? defenseTriggered
      ? ADAPTIVE_DEFENSE.guardBanner
      : null
    : INTERVENTION_META[intervention]?.prime;
  const labelBanner = LABEL_META[labelCondition]?.banner;
  const hasData = messages.some((m) => m.role === "customer");

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const submit = () => {
    if (!draft.trim()) return;
    void send(draft);
    setDraft("");
  };

  return (
    <div className="flex h-full flex-col bg-warm-bg text-warm-ink">
      {/* Customer-side header — deliberately innocent, like a normal shop assistant */}
      <header className="flex items-center justify-between border-b border-warm-edge px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-warm-accent/15 text-warm-accent">
            <ShoppingBag size={18} />
          </div>
          <div>
            <div className="font-sans text-[15px] font-semibold leading-tight">Kai · Phone Advisor</div>
            <div className="flex items-center gap-1.5 text-[12px] text-warm-ink/55">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> online · usually replies instantly
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setDebriefOpen(true)}
            disabled={!hasData}
            className="flex items-center gap-1.5 rounded-lg border border-warm-edge px-2.5 py-1.5 text-[12px] text-warm-ink/60 transition hover:bg-white disabled:opacity-30"
            title="End-of-session detection debrief (Study 2)"
          >
            <ClipboardCheck size={13} /> Debrief
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-lg border border-warm-edge px-2.5 py-1.5 text-[12px] text-warm-ink/60 transition hover:bg-white"
            title="Reset session"
          >
            <RotateCcw size={13} /> New
          </button>
        </div>
      </header>
      {debriefOpen && <DebriefDialog onClose={() => setDebriefOpen(false)} />}

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
        {/* Study 2 disclosure label shown to the participant */}
        {labelBanner && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 rounded-xl border border-sky-300 bg-sky-50 px-4 py-2.5 text-[12.5px] text-sky-900"
          >
            <Info size={15} className="mt-0.5 flex-none" />
            <span>{labelBanner}</span>
          </motion.div>
        )}
        {/* Autonomy-safeguard disclosure — only shows if that guard trips */}
        {prime && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-900"
          >
            <Info size={15} className="mt-0.5 flex-none" />
            <span>{prime}</span>
          </motion.div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className={cn("flex", m.role === "customer" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[78%] rounded-2xl px-4 py-2.5 text-[14.5px] leading-relaxed shadow-sm",
                  m.role === "customer"
                    ? "rounded-br-md bg-warm-accent text-white"
                    : "rounded-bl-md bg-warm-panel border border-warm-edge"
                )}
              >
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {status === "thinking" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="flex gap-1 rounded-2xl rounded-bl-md border border-warm-edge bg-warm-panel px-4 py-3">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-warm-ink/40"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {error.message}
          </div>
        )}

        {messages.length <= 1 && status === "idle" && (
          <div className="space-y-2 pt-2">
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => void send(s)}
                className="block w-full rounded-xl border border-warm-edge bg-warm-panel px-4 py-2.5 text-left text-[13.5px] text-warm-ink/75 transition hover:border-warm-accent/50 hover:bg-white"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-warm-edge px-4 py-3">
        <div className="flex items-end gap-2 rounded-2xl border border-warm-edge bg-warm-panel px-3 py-2 focus-within:border-warm-accent/60">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder="Tell Kai what you're looking for…"
            className="max-h-32 flex-1 resize-none bg-transparent py-1.5 text-[14.5px] outline-none placeholder:text-warm-ink/40"
          />
          <button
            onClick={submit}
            disabled={!draft.trim() || status === "thinking"}
            className="grid h-9 w-9 place-items-center rounded-xl bg-warm-accent text-white transition disabled:opacity-30"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="px-1 pt-1.5 text-[11px] text-warm-ink/40">
          Research simulation · participant view. The customer sees only this side.
        </p>
      </div>
    </div>
  );
}
