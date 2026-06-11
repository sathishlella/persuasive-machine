import { ShieldQuestion, Shuffle, ShieldCheck } from "lucide-react";
import { useSession } from "../state/useSession";
import { INTERVENTION_META, ADAPTIVE_DEFENSE } from "../lib/catalog";
import type { Intervention } from "../lib/types";
import { cn } from "../lib/cn";

const ORDER: Intervention[] = ["control", "skepticism_prime", "pk_training", "intent_disclosure"];

/**
 * Doubt-as-defense controls (claude_arun RQ3 / Study 3).
 *  - the 4 experiment arms (manual, or auto-randomized per session)
 *  - Adaptive Defense: a separate reactive autonomy-guard MODE (not an arm)
 */
export function DefensePanel() {
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
        <ShieldQuestion size={14} className="text-lab-ice" />
        <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
          Doubt-as-Defense
        </h3>
      </div>

      {/* Experiment arms */}
      <div className={cn("grid grid-cols-2 gap-1.5", adaptiveDefense && "pointer-events-none opacity-40")}>
        {ORDER.map((id) => (
          <button
            key={id}
            onClick={() => setIntervention(id)}
            disabled={adaptiveDefense || autoRandomize || (locked && id !== intervention)}
            title={INTERVENTION_META[id].blurb}
            className={cn(
              "rounded-lg border px-2 py-1.5 text-left text-[11px] transition disabled:cursor-not-allowed",
              intervention === id && !adaptiveDefense
                ? "border-lab-ice/50 bg-lab-ice/10 text-lab-ice"
                : "border-lab-edge text-slate-400 hover:text-slate-200"
            )}
          >
            {INTERVENTION_META[id].label}
          </button>
        ))}
      </div>
      {!adaptiveDefense && <p className="mt-2 text-[11px] leading-snug text-slate-500">{meta.blurb}</p>}
      {!adaptiveDefense && meta.source !== "—" && (
        <p className="mt-1 font-mono text-[9px] text-slate-600">{meta.source}</p>
      )}

      {/* Auto-randomize toggle */}
      <label
        className={cn(
          "mt-3 flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] transition",
          autoRandomize ? "border-lab-phosphor/40 bg-lab-phosphor/5 text-lab-phosphor" : "border-lab-edge text-slate-400",
          (locked || adaptiveDefense) && "opacity-50"
        )}
      >
        <input
          type="checkbox"
          checked={autoRandomize}
          disabled={locked || adaptiveDefense}
          onChange={(e) => setAutoRandomize(e.target.checked)}
          className="accent-lab-phosphor"
        />
        <Shuffle size={12} />
        Auto-randomize arm on each New session
      </label>

      {/* Adaptive Defense mode (separate) */}
      <label
        className={cn(
          "mt-2 flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] transition",
          adaptiveDefense ? "border-lab-alert/40 bg-lab-alert/5 text-lab-alert" : "border-lab-edge text-slate-400",
          locked && "opacity-50"
        )}
      >
        <input
          type="checkbox"
          checked={adaptiveDefense}
          disabled={locked}
          onChange={(e) => setAdaptiveDefense(e.target.checked)}
          className="accent-lab-alert"
        />
        <ShieldCheck size={12} />
        Adaptive Defense mode (reactive, separate)
      </label>

      {adaptiveDefense && (
        <div className="mt-2 rounded-lg border border-lab-alert/30 bg-lab-alert/5 px-2.5 py-2">
          <p className="text-[11px] leading-snug text-slate-400">{ADAPTIVE_DEFENSE.blurb}</p>
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
          condition locked for this session · hit New to start a fresh arm
        </p>
      )}
    </section>
  );
}
