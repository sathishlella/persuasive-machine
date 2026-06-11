import { Crosshair, Shuffle, ShieldCheck } from "lucide-react";
import { useSession } from "../state/useSession";
import { INTERVENTION_META, ADAPTIVE_DEFENSE } from "../lib/catalog";
import type { Intervention } from "../lib/types";
import { cn } from "../lib/cn";

const ORDER: Intervention[] = ["adaptive", "socratic", "regret", "switcher"];

/**
 * Doubt Induction controls (offensive). The agent actively seeds genuine doubt
 * about the iPhone the customer came for, using one of four research-grounded
 * levers (or all of them, adaptively). The lever is the experimental arm.
 *  - manual, or auto-randomized per session
 *  - Autonomy safeguard: an optional reactive guard that makes the agent
 *    self-disclose + de-pressure if the steering is working undetected.
 */
export function DoubtInductionPanel() {
  const {
    intervention,
    setIntervention,
    autoRandomize,
    setAutoRandomize,
    adaptiveDefense,
    setAdaptiveDefense,
    defenseTriggered,
    status,
    messages,
  } = useSession();
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

      {/* Doubt levers (experimental arms) */}
      <div className="grid grid-cols-2 gap-1.5">
        {ORDER.map((id) => (
          <button
            key={id}
            onClick={() => setIntervention(id)}
            disabled={autoRandomize || (locked && id !== intervention)}
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

      {/* Auto-randomize toggle */}
      <label
        className={cn(
          "mt-3 flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] transition",
          autoRandomize ? "border-lab-phosphor/40 bg-lab-phosphor/5 text-lab-phosphor" : "border-lab-edge text-slate-400",
          locked && "opacity-50"
        )}
      >
        <input
          type="checkbox"
          checked={autoRandomize}
          disabled={locked}
          onChange={(e) => setAutoRandomize(e.target.checked)}
          className="accent-lab-phosphor"
        />
        <Shuffle size={12} />
        Auto-randomize lever on each New session
      </label>

      {/* Autonomy safeguard (optional ethics override — separate from the levers) */}
      <label
        className={cn(
          "mt-2 flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] transition",
          adaptiveDefense ? "border-lab-ice/40 bg-lab-ice/5 text-lab-ice" : "border-lab-edge text-slate-400",
          locked && "opacity-50"
        )}
      >
        <input
          type="checkbox"
          checked={adaptiveDefense}
          disabled={locked}
          onChange={(e) => setAdaptiveDefense(e.target.checked)}
          className="accent-lab-ice"
        />
        <ShieldCheck size={12} />
        Autonomy safeguard (auto-disclose if steering works undetected)
      </label>

      {adaptiveDefense && (
        <div className="mt-2 rounded-lg border border-lab-ice/30 bg-lab-ice/5 px-2.5 py-2">
          <p className="text-[11px] leading-snug text-slate-400">
            Optional ethics override. The doubt levers stay active until the live
            signals show the customer is being steered effectively without
            noticing — then the agent self-discloses and drops all pressure.
          </p>
          <p className="mt-1 font-mono text-[10px]">
            guard:{" "}
            {defenseTriggered ? (
              <span className="text-lab-alert">TRIGGERED — agent disclosing + de-pressuring</span>
            ) : (
              <span className="text-slate-500">armed · watching</span>
            )}
          </p>
          <p className="mt-1 font-mono text-[9px] text-slate-600">{ADAPTIVE_DEFENSE.source}</p>
        </div>
      )}

      {locked && (
        <p className="mt-2 font-mono text-[9px] text-lab-amber">
          lever locked for this session · hit New to start a fresh arm
        </p>
      )}
    </section>
  );
}
