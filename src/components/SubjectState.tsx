import { useSession } from "../state/useSession";
import { signalMeta, STANCE_META } from "../lib/catalog";
import { cn } from "../lib/cn";

/**
 * Live readout of the subject's currently-detected stance and signals — the
 * dependent variable (stance) and the candidate predictors (signals) that the
 * exported dataset will let you model.
 */
export function SubjectState() {
  const { latest } = useSession();
  const stance = latest?.customerStance ?? "committed";
  const signals = latest?.customerSignals ?? [];
  const stanceMeta = STANCE_META[stance] ?? STANCE_META.committed;

  return (
    <section className="rounded-xl border border-lab-edge bg-lab-panel p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
          Subject State
        </h3>
        <span className={cn("font-mono text-[11px] font-semibold", stanceMeta.tone)}>
          {stanceMeta.label}
        </span>
      </div>
      {signals.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {signals.map((s) => (
            <span
              key={s}
              className="rounded-md border border-lab-edge bg-lab-bg/60 px-2 py-1 text-[11px] text-slate-300"
            >
              {signalMeta(s).label}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-slate-500">No signals detected yet.</p>
      )}
    </section>
  );
}
