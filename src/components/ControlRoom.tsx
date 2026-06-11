import { Activity } from "lucide-react";
import { DecisionMeter } from "./DecisionMeter";
import { SubjectState } from "./SubjectState";
import { DoubtPanel } from "./DoubtPanel";
import { DefensePanel } from "./DefensePanel";
import { StudyPanel } from "./StudyPanel";
import { Gauges } from "./Gauges";
import { PipelineTracker } from "./PipelineTracker";
import { TechniqueFeed } from "./TechniqueFeed";
import { EthicsMonitor } from "./EthicsMonitor";
import { ModelPicker } from "./ModelPicker";
import { useSession } from "../state/useSession";

/** The researcher-facing observation console (right side of the split). */
export function ControlRoom() {
  const { status } = useSession();

  return (
    <div className="grain relative flex h-full flex-col bg-lab-bg">
      <div className="lab-grid pointer-events-none absolute inset-0 opacity-60" />

      <header className="relative z-10 flex items-center justify-between border-b border-lab-edge px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Activity size={16} className="text-lab-phosphor" />
            {status === "thinking" && (
              <span className="absolute -right-1 -top-1 h-2 w-2 animate-ping rounded-full bg-lab-phosphor" />
            )}
          </div>
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-300">
              Observation Console
            </div>
            <div className="font-mono text-[10px] text-slate-500">
              {status === "thinking" ? "agent computing turn…" : "live · subject under study"}
            </div>
          </div>
        </div>
        <ModelPicker />
      </header>

      <div className="relative z-10 grid min-h-0 flex-1 auto-rows-min gap-3 overflow-y-auto p-4">
        <DecisionMeter />
        <StudyPanel />
        <DefensePanel />
        <SubjectState />
        <DoubtPanel />
        <Gauges />
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <PipelineTracker />
          <EthicsMonitor />
        </div>
        <TechniqueFeed />
      </div>
    </div>
  );
}
