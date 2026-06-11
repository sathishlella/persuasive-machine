import { useSession } from "../state/useSession";
import { PHASE_META } from "../lib/catalog";
import { cn } from "../lib/cn";

const ORDER = ["rapport", "comparison", "emotional", "close"] as const;

/** Shows where in the 5-phase persuasion pipeline the agent currently is. */
export function PipelineTracker() {
  const { latest } = useSession();
  const current = latest?.phase ?? "rapport";
  const currentIdx = PHASE_META[current]?.index ?? 0;

  return (
    <section className="rounded-xl border border-lab-edge bg-lab-panel p-4">
      <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
        Persuasion Pipeline
      </h3>
      <div className="flex flex-col gap-1.5">
        {ORDER.map((phase, i) => {
          const meta = PHASE_META[phase];
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <div
              key={phase}
              className={cn(
                "flex items-start gap-3 rounded-lg border px-3 py-2 transition",
                active
                  ? "border-lab-phosphor/40 bg-lab-phosphor/5"
                  : done
                    ? "border-lab-edge bg-lab-bg/40"
                    : "border-transparent"
              )}
            >
              <div
                className={cn(
                  "mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full border font-mono text-[10px]",
                  active
                    ? "border-lab-phosphor text-lab-phosphor"
                    : done
                      ? "border-slate-600 bg-slate-700 text-slate-300"
                      : "border-lab-edge text-slate-600"
                )}
              >
                {done ? "✓" : i + 1}
              </div>
              <div>
                <div
                  className={cn(
                    "text-[12.5px] font-semibold leading-tight",
                    active ? "text-lab-phosphor" : done ? "text-slate-300" : "text-slate-500"
                  )}
                >
                  {meta.label}
                </div>
                {active && <div className="mt-0.5 text-[11px] leading-snug text-slate-400">{meta.blurb}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
