import { useSession } from "../state/useSession";

const MODELS = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
  { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B" },
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B (fast)" },
];

export function ModelPicker() {
  const { model, setModel, status } = useSession();
  return (
    <select
      value={model}
      onChange={(e) => setModel(e.target.value)}
      disabled={status === "thinking"}
      className="rounded-md border border-lab-edge bg-lab-panel px-2 py-1 font-mono text-[11px] text-slate-300 outline-none focus:border-lab-phosphor/50 disabled:opacity-50"
      title="Groq model"
    >
      {MODELS.map((m) => (
        <option key={m.id} value={m.id}>
          {m.label}
        </option>
      ))}
    </select>
  );
}
