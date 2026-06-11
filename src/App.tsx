import { useState } from "react";
import { motion } from "framer-motion";
import { PanelsTopLeft, FlaskConical, X } from "lucide-react";
import { ChatPanel } from "./components/ChatPanel";
import { ControlRoom } from "./components/ControlRoom";
import { ExportBar } from "./components/ExportBar";
import { ArchiveBar } from "./components/ArchiveBar";
import { CodingLab } from "./components/CodingLab";

export default function App() {
  const [showConsole, setShowConsole] = useState(true);
  const [briefed, setBriefed] = useState(false);
  const [labOpen, setLabOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-lab-bg">
      {/* Title bar */}
      <div className="flex flex-none items-center justify-between border-b border-lab-edge bg-ink px-5 py-2.5">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-[19px] font-semibold tracking-tight text-slate-100">
            The Persuasive Machine
          </h1>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500 sm:inline">
            Consumer-Behaviour Research Console
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ArchiveBar onOpenLab={() => setLabOpen(true)} />
          <span className="h-5 w-px bg-lab-edge" />
          <ExportBar />
          <span className="h-5 w-px bg-lab-edge" />
          <button
            onClick={() => setShowConsole((v) => !v)}
            className="flex items-center gap-1.5 rounded-md border border-lab-edge px-2.5 py-1.5 font-mono text-[11px] text-slate-300 transition hover:border-lab-phosphor/40 hover:text-lab-phosphor"
          >
            {showConsole ? <PanelsTopLeft size={13} /> : <FlaskConical size={13} />}
            {showConsole ? "Hide console" : "Show console"}
          </button>
        </div>
      </div>

      {/* Split workspace */}
      <div
        className="grid min-h-0 flex-1"
        style={{
          gridTemplateColumns: showConsole ? "minmax(0,1fr) minmax(0,1.15fr)" : "1fr",
          gridTemplateRows: "minmax(0, 1fr)",
        }}
      >
        <div className="min-h-0 min-w-0 overflow-hidden border-r border-lab-edge">
          <ChatPanel />
        </div>
        {showConsole && (
          <div className="min-h-0 min-w-0 overflow-hidden">
            <ControlRoom />
          </div>
        )}
      </div>

      {/* One-time research framing overlay */}
      {!briefed && <Briefing onClose={() => setBriefed(true)} />}

      {/* Coding Lab overlay */}
      {labOpen && <CodingLab onClose={() => setLabOpen(false)} />}
    </div>
  );
}

function Briefing({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative max-w-lg rounded-2xl border border-lab-edge bg-lab-panel p-7"
      >
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-500 hover:text-slate-300">
          <X size={18} />
        </button>
        <FlaskConical className="mb-3 text-lab-phosphor" size={24} />
        <h2 className="font-display text-2xl font-semibold text-slate-100">The Persuasive Machine</h2>
        <p className="mt-3 text-[13.5px] leading-relaxed text-slate-400">
          A closed-lab instrument for studying how an AI sales agent shifts a purchase decision —
          and how visible that influence is. The <span className="text-warm-accent">left panel</span> is
          the participant's view: an ordinary phone advisor. The{" "}
          <span className="text-lab-phosphor">right panel</span> is the researcher's console, exposing
          every technique the agent deploys, the live decision-shift estimate, the detection-risk, and an
          EU AI&nbsp;Act boundary monitor.
        </p>
        <ul className="mt-4 space-y-1.5 text-[12.5px] text-slate-400">
          <li>· Techniques and effect sizes are grounded in the project's research corpus.</li>
          <li>· The agent stays factually honest; red-line tactics are flagged and refused.</li>
          <li>· For consenting, debriefed study participants only.</li>
        </ul>
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-lab-phosphor/90 py-2.5 font-mono text-[12px] font-semibold uppercase tracking-wider text-ink transition hover:bg-lab-phosphor"
        >
          Enter console
        </button>
      </motion.div>
    </div>
  );
}
