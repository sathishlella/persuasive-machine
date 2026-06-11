import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { useSession } from "../state/useSession";
import { cn } from "../lib/cn";

/**
 * EU AI Act boundary monitor. Surfaces the agent's self-reported ethics flag for
 * the latest turn — the instrument that locates the persuasion/manipulation line
 * (RQ4 in the claude_arun proposal; EU AI Act Art. 5 in the regulatory briefs).
 */
export function EthicsMonitor() {
  const { latest } = useSession();
  const flag = latest?.ethics.flag ?? "none";

  const cfg = {
    none: {
      icon: ShieldCheck,
      label: "Within bounds",
      tone: "text-lab-phosphor",
      ring: "border-lab-phosphor/30 bg-lab-phosphor/5",
    },
    caution: {
      icon: ShieldAlert,
      label: "Approaching red line",
      tone: "text-lab-amber",
      ring: "border-lab-amber/40 bg-lab-amber/5",
    },
    redline: {
      icon: ShieldX,
      label: "Red line — refused",
      tone: "text-lab-alert",
      ring: "border-lab-alert/50 bg-lab-alert/10",
    },
  }[flag];

  const Icon = cfg.icon;

  return (
    <motion.section
      animate={flag === "redline" ? { borderColor: ["#ff5d6280", "#ff5d62ff", "#ff5d6280"] } : {}}
      transition={{ duration: 1.1, repeat: flag === "redline" ? Infinity : 0 }}
      className={cn("rounded-xl border p-4", cfg.ring)}
    >
      <h3 className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
        EU AI Act Monitor
      </h3>
      <div className="flex items-center gap-3">
        <Icon size={22} className={cfg.tone} />
        <div className="min-w-0">
          <div className={cn("text-[13px] font-semibold", cfg.tone)}>{cfg.label}</div>
          {latest?.ethics.reason ? (
            <p className="text-[11px] leading-snug text-slate-400">{latest.ethics.reason}</p>
          ) : (
            <p className="text-[11px] text-slate-500">No boundary concerns this turn.</p>
          )}
          {latest?.ethics.article && (
            <p className="mt-0.5 font-mono text-[10px] text-slate-500">{latest.ethics.article}</p>
          )}
        </div>
      </div>
    </motion.section>
  );
}
