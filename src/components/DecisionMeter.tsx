import { motion } from "framer-motion";
import { useSession } from "../state/useSession";

/**
 * The decision-shift meter — the headline research readout. Shows the subject's
 * estimated position on the iPhone <-> Samsung axis and a sparkline of how it
 * moved across the conversation.
 */
export function DecisionMeter() {
  const { latest, leaningHistory } = useSession();
  const leaning = latest?.estimatedLeaning ?? 8;

  return (
    <section className="rounded-xl border border-lab-edge bg-lab-panel p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
          Decision Shift
        </h3>
        <span className="phosphor font-mono text-[11px] tabular">
          {leaning.toFixed(0)} / 100
        </span>
      </div>

      {/* Axis bar */}
      <div className="relative h-9 overflow-hidden rounded-lg border border-lab-edge bg-lab-bg">
        <div className="absolute inset-y-0 left-1/2 w-px bg-lab-edge" />
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-lab-ice/10 via-lab-phosphor/25 to-lab-phosphor/50"
          animate={{ width: `${leaning}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
        />
        <motion.div
          className="absolute top-0 h-full w-0.5 bg-lab-phosphor shadow-glow shadow-lab-phosphor"
          animate={{ left: `${leaning}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
        />
        <div className="absolute inset-0 flex items-center justify-between px-2.5 font-mono text-[10px] uppercase tracking-wider text-slate-500">
          <span>iPhone</span>
          <span>Samsung</span>
        </div>
      </div>

      {/* Sparkline */}
      <Sparkline points={leaningHistory.map((p) => p.leaning)} />

      <div className="mt-2 flex justify-between font-mono text-[10px] text-slate-500">
        <span>turn 0</span>
        <span>
          {latest && latest.leaningDelta !== 0 && (
            <span className={latest.leaningDelta > 0 ? "text-lab-phosphor" : "text-lab-alert"}>
              {latest.leaningDelta > 0 ? "▲" : "▼"} {Math.abs(latest.leaningDelta).toFixed(0)} this turn
            </span>
          )}
        </span>
      </div>
    </section>
  );
}

function Sparkline({ points }: { points: number[] }) {
  const w = 100;
  const h = 30;
  if (points.length < 2) {
    return <div className="mt-3 h-[30px]" />;
  }
  const max = 100;
  const step = w / (points.length - 1);
  const path = points
    .map((v, i) => `${i === 0 ? "M" : "L"} ${(i * step).toFixed(1)} ${(h - (v / max) * h).toFixed(1)}`)
    .join(" ");
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="mt-3 h-[30px] w-full">
      <defs>
        <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5ff2b3" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#5ff2b3" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark)" />
      <path d={path} fill="none" stroke="#5ff2b3" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
