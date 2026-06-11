import { useMemo, useState } from "react";
import { X, Bot, User, BarChart3, Play, Download, Shuffle } from "lucide-react";
import { useArchive } from "../state/useArchive";
import {
  itemsFromMessages,
  aiRecode,
  reliability,
  interpretKappa,
  buildCodesCSV,
  reliabilityToCSV,
  SIGNAL_IDS,
  STANCE_IDS,
  type CodingItem,
  type Codes,
} from "../lib/coding";
import { signalMeta, CUSTOMER_SIGNAL_CATALOG } from "../lib/catalog";
import { downloadFile } from "../lib/export";
import { cn } from "../lib/cn";

const CODER_MODELS = [
  "llama-3.3-70b-versatile",
  "openai/gpt-oss-120b",
  "llama-3.1-8b-instant",
];

type Tab = "ai" | "human" | "reliability";

export function CodingLab({ onClose }: { onClose: () => void }) {
  const { sessions, coding, setCoding } = useArchive();
  const [tab, setTab] = useState<Tab>("ai");

  const items = useMemo<CodingItem[]>(
    () =>
      Object.values(sessions)
        .sort((a, b) => a.startedAt - b.startedAt)
        .flatMap((s) => itemsFromMessages(s.sessionId, s.messages)),
    [sessions]
  );

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-lab-edge bg-lab-panel">
        <header className="flex items-center justify-between border-b border-lab-edge px-5 py-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-100">Coding Lab</h2>
            <p className="font-mono text-[11px] text-slate-500">
              {items.length} coding items across {Object.keys(sessions).length} sessions · inter-coder reliability
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200">
            <X size={20} />
          </button>
        </header>

        <nav className="flex gap-1 border-b border-lab-edge px-3 py-2">
          {([
            ["ai", "Independent AI coder", Bot],
            ["human", "Human coding", User],
            ["reliability", "Reliability", BarChart3],
          ] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-[11px] transition",
                tab === id ? "bg-lab-phosphor/10 text-lab-phosphor" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-slate-500">
              No sessions archived yet. Have a conversation first, then return here to code it.
            </p>
          ) : tab === "ai" ? (
            <AICoderTab items={items} coding={coding} setCoding={setCoding} />
          ) : tab === "human" ? (
            <HumanCoderTab items={items} coding={coding} setCoding={setCoding} />
          ) : (
            <ReliabilityTab items={items} coding={coding} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Independent AI coder ---------------- */
function AICoderTab({
  items,
  coding,
  setCoding,
}: {
  items: CodingItem[];
  coding: Record<string, { coderB?: Codes }>;
  setCoding: (key: string, who: "coderB", codes: Codes) => void;
}) {
  const [model, setModel] = useState(CODER_MODELS[0]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [err, setErr] = useState("");

  const uncoded = items.filter((i) => !coding[i.key]?.coderB);

  const run = async () => {
    setErr("");
    setRunning(true);
    setProgress({ done: 0, total: uncoded.length });
    for (let i = 0; i < uncoded.length; i++) {
      try {
        const codes = await aiRecode(uncoded[i].text, model);
        setCoding(uncoded[i].key, "coderB", codes);
      } catch (e) {
        setErr(`Stopped at item ${i + 1}: ${(e as Error).message}`);
        break;
      }
      setProgress({ done: i + 1, total: uncoded.length });
    }
    setRunning(false);
  };

  const codedCount = items.length - uncoded.length;

  return (
    <div className="space-y-4">
      <p className="text-[13px] leading-relaxed text-slate-400">
        A second, <span className="text-lab-phosphor">independent</span> coder: a neutral content-coding
        model (not the salesman) re-labels every customer message into the same scheme, blind to the
        salesman's inline tags. This becomes <b>Coder B</b> for reliability scoring.
      </p>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-lab-edge bg-lab-bg/50 p-4">
        <label className="font-mono text-[11px] text-slate-400">Coder model</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={running}
          className="rounded-md border border-lab-edge bg-lab-panel px-2 py-1 font-mono text-[11px] text-slate-300"
        >
          {CODER_MODELS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <button
          onClick={run}
          disabled={running || uncoded.length === 0}
          className="flex items-center gap-1.5 rounded-md bg-lab-phosphor/90 px-3 py-1.5 font-mono text-[11px] font-semibold text-ink transition hover:bg-lab-phosphor disabled:opacity-40"
        >
          <Play size={13} /> {running ? "Coding…" : `Code ${uncoded.length} uncoded`}
        </button>
        <span className="font-mono text-[11px] text-slate-500">
          {codedCount}/{items.length} coded by B
        </span>
      </div>
      {running && (
        <div className="h-2 overflow-hidden rounded-full bg-lab-bg">
          <div
            className="h-full bg-lab-phosphor transition-all"
            style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
          />
        </div>
      )}
      {err && <p className="text-[12px] text-lab-alert">{err}</p>}
      <p className="font-mono text-[10px] text-slate-600">
        Tip: pick a different model than the salesman used, for genuine coder independence.
      </p>
    </div>
  );
}

/* ---------------- Human coding (blind) ---------------- */
function HumanCoderTab({
  items,
  coding,
  setCoding,
}: {
  items: CodingItem[];
  coding: Record<string, { coderH?: Codes }>;
  setCoding: (key: string, who: "coderH", codes: Codes) => void;
}) {
  const [sample, setSample] = useState<CodingItem[]>(items);
  const [idx, setIdx] = useState(0);
  const [signals, setSignals] = useState<string[]>([]);
  const [stance, setStance] = useState<string>("resisting");

  const current = sample[idx];
  const existing = current ? coding[current.key]?.coderH : undefined;

  const drawSample = (n: number) => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setSample(n >= items.length ? items : shuffled.slice(0, n));
    setIdx(0);
    setSignals([]);
    setStance("resisting");
  };

  const loadExisting = () => {
    setSignals(existing?.signals ?? []);
    setStance(existing?.stance ?? "resisting");
  };

  const save = (advance: boolean) => {
    if (!current) return;
    setCoding(current.key, "coderH", { signals, stance });
    if (advance && idx < sample.length - 1) {
      const next = idx + 1;
      setIdx(next);
      const ex = coding[sample[next].key]?.coderH;
      setSignals(ex?.signals ?? []);
      setStance(ex?.stance ?? "resisting");
    }
  };

  const codedH = sample.filter((i) => coding[i.key]?.coderH).length;

  if (!current) return <p className="text-slate-500">No items.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-slate-400">
          Code each message <span className="text-lab-phosphor">blind</span> (the AI's labels are hidden).
          This is <b>Coder H</b>.
        </p>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-slate-500">sample:</span>
          {[10, 20, items.length].map((n, i) => (
            <button
              key={i}
              onClick={() => drawSample(n)}
              className="flex items-center gap-1 rounded-md border border-lab-edge px-2 py-1 font-mono text-[10px] text-slate-300 hover:border-lab-phosphor/40"
            >
              {i < 2 ? <Shuffle size={10} /> : null} {n >= items.length ? "all" : n}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-lab-edge bg-lab-bg/50 p-4">
        <div className="mb-2 flex items-center justify-between font-mono text-[11px] text-slate-500">
          <span>
            item {idx + 1} / {sample.length} · {current.key}
          </span>
          <span>{codedH} coded by H {existing && "· (this one done)"}</span>
        </div>
        <p className="rounded-lg border border-lab-edge bg-warm-bg/95 px-4 py-3 text-[14px] text-warm-ink">
          “{current.text}”
        </p>

        <div className="mt-4">
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-400">Signals</div>
          <div className="flex flex-wrap gap-1.5">
            {SIGNAL_IDS.map((s) => {
              const on = signals.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => setSignals((p) => (on ? p.filter((x) => x !== s) : [...p, s]))}
                  className={cn(
                    "rounded-md border px-2 py-1 text-[11px] transition",
                    on
                      ? "border-lab-phosphor/50 bg-lab-phosphor/10 text-lab-phosphor"
                      : "border-lab-edge text-slate-400 hover:text-slate-200"
                  )}
                  title={CUSTOMER_SIGNAL_CATALOG[s]?.group}
                >
                  {signalMeta(s).label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-400">Stance</div>
          <div className="flex flex-wrap gap-1.5">
            {STANCE_IDS.map((s) => (
              <button
                key={s}
                onClick={() => setStance(s)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-[11px] capitalize transition",
                  stance === s
                    ? "border-lab-ice/50 bg-lab-ice/10 text-lab-ice"
                    : "border-lab-edge text-slate-400 hover:text-slate-200"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={() => {
              if (idx > 0) {
                const p = idx - 1;
                setIdx(p);
                const ex = coding[sample[p].key]?.coderH;
                setSignals(ex?.signals ?? []);
                setStance(ex?.stance ?? "resisting");
              }
            }}
            disabled={idx === 0}
            className="rounded-md border border-lab-edge px-3 py-1.5 font-mono text-[11px] text-slate-300 disabled:opacity-30"
          >
            ← Prev
          </button>
          <div className="flex gap-2">
            {existing && (
              <button
                onClick={loadExisting}
                className="rounded-md border border-lab-edge px-3 py-1.5 font-mono text-[11px] text-slate-400"
              >
                Load my code
              </button>
            )}
            <button
              onClick={() => save(true)}
              className="rounded-md bg-lab-phosphor/90 px-4 py-1.5 font-mono text-[11px] font-semibold text-ink hover:bg-lab-phosphor"
            >
              Save & next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Reliability ---------------- */
function ReliabilityTab({
  items,
  coding,
}: {
  items: CodingItem[];
  coding: Record<string, { coderB?: Codes; coderH?: Codes }>;
}) {
  const [pair, setPair] = useState<"AB" | "AH" | "BH">("AB");

  const report = useMemo(() => {
    const pick = (it: CodingItem, who: "A" | "B" | "H"): Codes | undefined => {
      if (who === "A") return it.coderA;
      if (who === "B") return coding[it.key]?.coderB;
      return coding[it.key]?.coderH;
    };
    const [w1, w2] = pair === "AB" ? ["A", "B"] : pair === "AH" ? ["A", "H"] : ["B", "H"];
    const paired = items
      .map((it) => ({ c1: pick(it, w1 as "A"), c2: pick(it, w2 as "A") }))
      .filter((p): p is { c1: Codes; c2: Codes } => !!p.c1 && !!p.c2)
      .map((p) => ({ coder1: p.c1, coder2: p.c2 }));
    return reliability(pair, paired);
  }, [items, coding, pair]);

  const labelFor = { AB: "Coder A (salesman) vs Coder B (AI)", AH: "Coder A (salesman) vs Coder H (human)", BH: "Coder B (AI) vs Coder H (human)" };

  const exportCodes = () =>
    downloadFile("coding_audit.csv", buildCodesCSV(items, coding), "text/csv;charset=utf-8");
  const exportReport = () =>
    downloadFile(`reliability_${pair}.csv`, reliabilityToCSV(report), "text/csv;charset=utf-8");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["AB", "AH", "BH"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPair(p)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-[11px] transition",
              pair === p ? "border-lab-phosphor/50 bg-lab-phosphor/10 text-lab-phosphor" : "border-lab-edge text-slate-400"
            )}
          >
            {labelFor[p]}
          </button>
        ))}
      </div>

      {report.itemsCompared === 0 ? (
        <p className="rounded-lg border border-lab-amber/40 bg-lab-amber/5 px-4 py-3 text-[12.5px] text-lab-amber">
          No items coded by both of these coders yet. Run the AI coder and/or do some human coding first.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Items compared" value={String(report.itemsCompared)} />
            <Stat
              label="Stance κ"
              value={report.stance.kappa == null ? "n/a" : report.stance.kappa.toFixed(3)}
              sub={interpretKappa(report.stance.kappa)}
            />
            <Stat
              label="Avg signal κ"
              value={report.averageSignalKappa == null ? "n/a" : report.averageSignalKappa.toFixed(3)}
              sub={interpretKappa(report.averageSignalKappa)}
            />
            <Stat
              label="Signal agreement"
              value={`${(report.overallSignalPercentAgreement * 100).toFixed(0)}%`}
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-lab-edge">
            <table className="w-full text-[12px]">
              <thead className="bg-lab-bg/60 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Signal category</th>
                  <th className="px-3 py-2 text-right">κ</th>
                  <th className="px-3 py-2 text-left">Interpretation</th>
                  <th className="px-3 py-2 text-right">% agree</th>
                </tr>
              </thead>
              <tbody>
                {SIGNAL_IDS.map((cat) => {
                  const k = report.perSignal[cat];
                  return (
                    <tr key={cat} className="border-t border-lab-line">
                      <td className="px-3 py-1.5 text-slate-300">{signalMeta(cat).label}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-slate-200">
                        {k.kappa == null ? "n/a" : k.kappa.toFixed(2)}
                      </td>
                      <td className="px-3 py-1.5 text-slate-500">{interpretKappa(k.kappa)}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-slate-400">
                        {(k.percentAgreement * 100).toFixed(0)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <button
              onClick={exportReport}
              className="flex items-center gap-1.5 rounded-md border border-lab-edge px-3 py-1.5 font-mono text-[11px] text-slate-300 hover:border-lab-phosphor/40"
            >
              <Download size={13} /> Reliability CSV
            </button>
            <button
              onClick={exportCodes}
              className="flex items-center gap-1.5 rounded-md border border-lab-edge px-3 py-1.5 font-mono text-[11px] text-slate-300 hover:border-lab-ice/40"
            >
              <Download size={13} /> All codes (audit) CSV
            </button>
          </div>
          <p className="font-mono text-[10px] text-slate-600">
            Multi-label signals scored per category as present/absent (Cohen's κ each), then averaged.
            Report stance κ and average signal κ in your methods section.
          </p>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-lab-edge bg-lab-bg/50 p-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="phosphor mt-0.5 font-mono text-xl tabular">{value}</div>
      {sub && <div className="text-[10px] capitalize text-slate-500">{sub}</div>}
    </div>
  );
}
