import { Database, FlaskRound, Trash2 } from "lucide-react";
import { useArchive, isSubstantive } from "../state/useArchive";
import { buildArchiveCSV, buildArchiveJSON, downloadFile } from "../lib/export";

export function ArchiveBar({ onOpenLab }: { onOpenLab: () => void }) {
  const { sessions, clearArchive } = useArchive();
  const list = Object.values(sessions).filter(isSubstantive);
  const n = list.length;

  const exportAllCSV = () =>
    downloadFile(`all_sessions_${n}.csv`, buildArchiveCSV(list), "text/csv;charset=utf-8");
  const exportAllJSON = () =>
    downloadFile(`all_sessions_${n}.json`, buildArchiveJSON(list), "application/json");

  return (
    <div className="flex items-center gap-1.5">
      <span
        className="flex items-center gap-1 font-mono text-[11px] text-slate-400"
        title="Sessions saved in this browser"
      >
        <Database size={12} /> {n} saved
      </span>
      <button
        onClick={exportAllCSV}
        disabled={n === 0}
        title="Export all archived sessions as one CSV"
        className="rounded-md border border-lab-edge px-2 py-1.5 font-mono text-[11px] text-slate-300 transition hover:border-lab-phosphor/40 hover:text-lab-phosphor disabled:opacity-30"
      >
        All CSV
      </button>
      <button
        onClick={exportAllJSON}
        disabled={n === 0}
        title="Export all archived sessions as one JSON"
        className="rounded-md border border-lab-edge px-2 py-1.5 font-mono text-[11px] text-slate-300 transition hover:border-lab-ice/40 hover:text-lab-ice disabled:opacity-30"
      >
        All JSON
      </button>
      <button
        onClick={onOpenLab}
        title="Open the Coding Lab (inter-coder reliability)"
        className="flex items-center gap-1.5 rounded-md border border-lab-edge px-2.5 py-1.5 font-mono text-[11px] text-slate-300 transition hover:border-lab-phosphor/40 hover:text-lab-phosphor"
      >
        <FlaskRound size={13} /> Coding Lab
      </button>
      {n > 0 && (
        <button
          onClick={() => {
            if (confirm(`Clear all ${n} saved sessions and coding labels? This cannot be undone.`)) {
              clearArchive();
            }
          }}
          title="Clear the archive"
          className="rounded-md border border-lab-edge px-2 py-1.5 text-slate-500 transition hover:border-lab-alert/40 hover:text-lab-alert"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}
