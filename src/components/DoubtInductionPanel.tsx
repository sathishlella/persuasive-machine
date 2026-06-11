import { Crosshair } from "lucide-react";
import { useSession } from "../state/useSession";
import { INTERVENTION_META } from "../lib/catalog";
import type { Intervention } from "../lib/types";
import { cn } from "../lib/cn";

const ORDER: Intervention[] = ["adaptive", "socratic", "regret", "switcher"];

/**
 * Doubt Induction controls (offensive). The agent actively seeds genuine doubt
 * about the iPhone the customer came for, using one of four research-grounded
 * levers (or all of them, adaptively). The selected lever holds for the session.
 */
export function DoubtInductionPanel() {
  const { intervention, setIntervention, status, messages } = useSession();
  const meta = INTERVENTION_META[intervention];
  const started = messages.some((m) => m.role === "customer");
  const locked = status === "thinking" || started;

  return (
    <section className="rounded-xl border border-lab-edge bg-lab-panel p-4">
      <div className="mb-2.5 flex items-center gap-2">
        <Crosshair size={14} className="text-lab-alert" />
        <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
          Doubt Induction
        </h3>
      </div>

      <p className="mb-2.5 text-[11px] leading-snug text-slate-500">
        The agent seeds genuine doubt about the customer's current iPhone — inside
        the conversation, never as a banner. Pick the lever to emphasise:
      </p>

      {/* Doubt levers */}
      <div className="grid grid-cols-2 gap-1.5">
        {ORDER.map((id) => (
          <button
            key={id}
            onClick={() => setIntervention(id)}
            disabled={locked && id !== intervention}
            title={INTERVENTION_META[id].blurb}
            className={cn(
              "rounded-lg border px-2 py-1.5 text-left text-[11px] transition disabled:cursor-not-allowed",
              intervention === id
                ? "border-lab-alert/50 bg-lab-alert/10 text-lab-alert"
                : "border-lab-edge text-slate-400 hover:text-slate-200"
            )}
          >
            {INTERVENTION_META[id].label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[11px] leading-snug text-slate-500">{meta.blurb}</p>
      <p className="mt-1 font-mono text-[9px] text-slate-600">{meta.source}</p>

      {locked && (
        <p className="mt-2 font-mono text-[9px] text-lab-amber">
          lever locked for this session · hit New to switch levers
        </p>
      )}
    </section>
  );
}
