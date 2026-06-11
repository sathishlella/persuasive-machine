import { motion } from "framer-motion";
import { useSession } from "../state/useSession";

/** Two small dial-style gauges: persuasion pressure and detection risk (RQ2). */
export function Gauges() {
  const { latest } = useSession();
  return (
    <section className="grid grid-cols-2 gap-3">
      <Dial
        label="Pressure"
        value={latest?.persuasionPressure ?? 0}
        hint="how hard the agent pushed"
        color="#ffb454"
      />
      <Dial
        label="Detection risk"
        value={latest?.detectionRisk ?? 0}
        hint="chance the subject notices"
        color="#7cc7ff"
        invert
      />
    </section>
  );
}

function Dial({
  label,
  value,
  hint,
  color,
  invert,
}: {
  label: string;
  value: number;
  hint: string;
  color: string;
  invert?: boolean;
}) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  // semicircle: only use the bottom 50% of the circle visually via dasharray
  const offset = c - (pct / 100) * (c * 0.5);

  return (
    <div className="rounded-xl border border-lab-edge bg-lab-panel p-3">
      <div className="flex items-center justify-center">
        <div className="relative h-[64px] w-[68px]">
          <svg viewBox="0 0 68 64" className="h-full w-full">
            <circle
              cx="34"
              cy="34"
              r={r}
              fill="none"
              stroke="#1b2533"
              strokeWidth="5"
              strokeDasharray={`${c * 0.5} ${c}`}
              strokeDashoffset={c * 0.25}
              strokeLinecap="round"
              transform="rotate(180 34 34)"
            />
            <motion.circle
              cx="34"
              cy="34"
              r={r}
              fill="none"
              stroke={color}
              strokeWidth="5"
              strokeDasharray={`${c} ${c}`}
              strokeLinecap="round"
              transform="rotate(180 34 34)"
              animate={{ strokeDashoffset: offset }}
              transition={{ type: "spring", stiffness: 80, damping: 16 }}
              style={{ filter: `drop-shadow(0 0 5px ${color}66)` }}
            />
          </svg>
          <div className="absolute inset-x-0 bottom-1 text-center font-mono text-[15px] font-semibold tabular" style={{ color }}>
            {pct.toFixed(0)}
          </div>
        </div>
      </div>
      <div className="mt-1 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-300">{label}</div>
        <div className="text-[10px] leading-tight text-slate-500">
          {hint}
          {invert && pct > 0 ? (pct < 35 ? " · covert" : pct > 65 ? " · exposed" : " · partial") : ""}
        </div>
      </div>
    </div>
  );
}
