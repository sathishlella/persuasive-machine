import { motion } from "framer-motion";
import { useSession } from "../state/useSession";
import { riskMeta } from "../lib/catalog";
import { cn } from "../lib/cn";

/**
 * Doubt & skepticism readout — operationalizes the four seed references:
 * Evans 2021 (doubt↔trust language), IJHTA 2026 (skepticism + perceived risks),
 * Thompson 2005 (reflexive doubt), Friestad & Wright 1994 (persuasion knowledge).
 */
export function DoubtPanel() {
  const { latest } = useSession();
  const d = latest?.doubt;
  const dvt = d?.doubtVsTrust ?? 0;
  const skep = d?.skepticism ?? 0;

  return (
    <section className="rounded-xl border border-lab-edge bg-lab-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
          Doubt &amp; Skepticism
        </h3>
        <span className="font-mono text-[9px] text-slate-600">Evans · IJHTA · Thompson · PKM</span>
      </div>

      {/* Doubt vs trust language bar (Evans 2021) */}
      <div className="mb-1 flex justify-between font-mono text-[10px] text-slate-500">
        <span>trusting</span>
        <span>doubt language</span>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full border border-lab-edge bg-lab-bg">
        <div className="absolute inset-y-0 left-1/2 w-px bg-lab-edge" />
        <motion.div
          className="absolute top-0 h-full w-1 rounded-full bg-lab-ice shadow-glow shadow-lab-ice"
          animate={{ left: `${((dvt + 100) / 200) * 100}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
        />
      </div>

      {/* Skepticism bar (IJHTA 2026) */}
      <div className="mt-3 mb-1 flex justify-between font-mono text-[10px] text-slate-500">
        <span>skepticism</span>
        <span className="tabular">{skep.toFixed(0)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-lab-bg">
        <motion.div
          className="h-full bg-lab-amber"
          animate={{ width: `${skep}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
        />
      </div>

      {/* Perceived risks (IJHTA 2026) */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {(d?.perceivedRisks ?? []).length > 0 ? (
          d!.perceivedRisks.map((r) => (
            <span key={r} className="rounded border border-lab-amber/30 bg-lab-amber/5 px-1.5 py-0.5 text-[10px] text-lab-amber">
              {riskMeta(r).label}
            </span>
          ))
        ) : (
          <span className="text-[10px] text-slate-600">no perceived-risk concerns voiced</span>
        )}
      </div>

      {/* Flags: reflexive doubt (Thompson) + persuasion knowledge (PKM) */}
      <div className="mt-3 flex gap-2">
        <Flag on={d?.reflexiveDoubt ?? false} label="Reflexive doubt" hint="identity-based resistance" />
        <Flag on={d?.persuasionKnowledgeActive ?? false} label="PKM active" hint="recognised the pitch" />
      </div>
    </section>
  );
}

function Flag({ on, label, hint }: { on: boolean; label: string; hint: string }) {
  return (
    <div
      title={hint}
      className={cn(
        "flex-1 rounded-lg border px-2 py-1.5 text-center transition",
        on ? "border-lab-alert/50 bg-lab-alert/10" : "border-lab-edge bg-lab-bg/40"
      )}
    >
      <div className={cn("text-[11px] font-semibold", on ? "text-lab-alert" : "text-slate-600")}>
        {label}
      </div>
      <div className="text-[9px] text-slate-500">{on ? "detected" : "—"}</div>
    </div>
  );
}
