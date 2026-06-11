import { Download, FileJson, Sheet } from "lucide-react";
import { useSession } from "../state/useSession";
import { buildSessionJSON, buildSessionCSV, downloadFile } from "../lib/export";

/** Download the current session's transcript + analytics for offline analysis. */
export function ExportBar() {
  const s = useSession();
  const { messages, leaningHistory, sessionId } = s;
  const meta = {
    sessionId,
    startedAt: s.startedAt,
    model: s.model,
    intervention: s.adaptiveDefense ? "adaptive_defense" : s.intervention,
    assignment: s.adaptiveDefense ? "adaptive" : s.autoRandomize ? "randomized" : "manual",
    personalization: s.personalization,
    anthropomorphism: s.anthropomorphism,
    labelCondition: s.labelCondition,
    detection: s.detection,
  };
  const hasData = messages.some((m) => m.role === "customer");

  const exportJSON = () => {
    downloadFile(`${sessionId}.json`, buildSessionJSON(messages, leaningHistory, meta), "application/json");
  };
  const exportCSV = () => {
    downloadFile(`${sessionId}.csv`, buildSessionCSV(messages, meta), "text/csv;charset=utf-8");
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="mr-0.5 hidden items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-slate-500 md:flex">
        <Download size={12} /> Export
      </span>
      <button
        onClick={exportCSV}
        disabled={!hasData}
        title="Download analysis-ready CSV (one row per turn)"
        className="flex items-center gap-1.5 rounded-md border border-lab-edge px-2.5 py-1.5 font-mono text-[11px] text-slate-300 transition hover:border-lab-phosphor/40 hover:text-lab-phosphor disabled:opacity-30"
      >
        <Sheet size={13} /> CSV
      </button>
      <button
        onClick={exportJSON}
        disabled={!hasData}
        title="Download full session JSON (lossless transcript + analytics)"
        className="flex items-center gap-1.5 rounded-md border border-lab-edge px-2.5 py-1.5 font-mono text-[11px] text-slate-300 transition hover:border-lab-ice/40 hover:text-lab-ice disabled:opacity-30"
      >
        <FileJson size={13} /> JSON
      </button>
    </div>
  );
}
