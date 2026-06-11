import { Beaker, Eye } from "lucide-react";
import { useSession } from "../state/useSession";
import { STUDY1_META, LABEL_META } from "../lib/catalog";
import type { LabelCondition } from "../lib/types";
import { cn } from "../lib/cn";

const LABELS: LabelCondition[] = ["none", "ai_label", "persuasion_warning"];

/** Study 1 (2x2 mechanisms) and Study 2 (detection label) controls. */
export function StudyPanel() {
  const {
    personalization,
    setPersonalization,
    anthropomorphism,
    setAnthropomorphism,
    labelCondition,
    setLabelCondition,
    detection,
    status,
    messages,
  } = useSession();
  const locked = status === "thinking" || messages.some((m) => m.role === "customer");

  return (
    <section className="rounded-xl border border-lab-edge bg-lab-panel p-4">
      <div className="mb-2.5 flex items-center gap-2">
        <Beaker size={14} className="text-lab-phosphor" />
        <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
          Study 1 · Mechanisms (2×2)
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Factor
          label={STUDY1_META.personalization.label}
          on={personalization}
          onText={STUDY1_META.personalization.on}
          offText={STUDY1_META.personalization.off}
          disabled={locked}
          onToggle={() => setPersonalization(!personalization)}
        />
        <Factor
          label={STUDY1_META.anthropomorphism.label}
          on={anthropomorphism}
          onText={STUDY1_META.anthropomorphism.on}
          offText={STUDY1_META.anthropomorphism.off}
          disabled={locked}
          onToggle={() => setAnthropomorphism(!anthropomorphism)}
        />
      </div>

      <div className="mt-4 mb-2 flex items-center gap-2">
        <Eye size={14} className="text-lab-ice" />
        <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
          Study 2 · Detection
        </h3>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {LABELS.map((id) => (
          <button
            key={id}
            onClick={() => setLabelCondition(id)}
            disabled={locked && id !== labelCondition}
            title={LABEL_META[id].blurb}
            className={cn(
              "rounded-lg border px-2 py-1.5 text-[10.5px] transition disabled:opacity-40",
              labelCondition === id
                ? "border-lab-ice/50 bg-lab-ice/10 text-lab-ice"
                : "border-lab-edge text-slate-400 hover:text-slate-200"
            )}
          >
            {LABEL_META[id].label}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-[11px] text-slate-500">{LABEL_META[labelCondition].blurb}</p>

      {detection.noticed && (
        <p className="mt-1.5 font-mono text-[10px] text-lab-phosphor">
          debrief: noticed={detection.noticed}
          {detection.direction ? ` · toward=${detection.direction}` : ""}
        </p>
      )}
    </section>
  );
}

function Factor({
  label,
  on,
  onText,
  offText,
  disabled,
  onToggle,
}: {
  label: string;
  on: boolean;
  onText: string;
  offText: string;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "rounded-lg border p-2 text-left transition disabled:opacity-50",
        on ? "border-lab-phosphor/40 bg-lab-phosphor/5" : "border-lab-edge bg-lab-bg/40"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] font-semibold text-slate-200">{label}</span>
        <span
          className={cn(
            "font-mono text-[10px]",
            on ? "text-lab-phosphor" : "text-slate-500"
          )}
        >
          {on ? "ON" : "OFF"}
        </span>
      </div>
      <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{on ? onText : offText}</p>
    </button>
  );
}
