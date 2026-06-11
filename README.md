# The Persuasive Machine — Research Console

A closed-lab instrument for studying how an AI sales agent shifts a consumer's
purchase decision in real time, and how detectable that influence is. Built for
the Dr. Arun AI-salesman research project, grounded in the research corpus in the
sibling folders (`Kimi_Agent ... Persuasion Research` and `claude_arun`).

The interface is a **split observation room**:

- **Left (participant view):** an ordinary, friendly phone advisor ("Kai"). The
  participant arrives intending to buy an iPhone. This is all the subject sees.
- **Right (researcher console):** the exposed machinery — every persuasion
  technique the agent deploys (with the exact phrase and its research source),
  the live **decision-shift meter** (iPhone ↔ Samsung), the **persuasion-pressure**
  and **detection-risk** gauges, the five-phase **pipeline tracker**, and an
  **EU AI Act boundary monitor**.

The agent runs on Groq (fast open-model inference) and returns, every turn, both
the customer-facing reply and a structured analysis object that drives the
console. That dual output is what makes the influence *observable* rather than a
black box — it is the research instrument.

---

## Quick start

```bash
# 1. Install (already done if node_modules exists)
npm install

# 2. Add your Groq API key
copy .env.local.example .env.local      # Windows
#   then edit .env.local and paste your key after GROQ_API_KEY=

# 3. Run
npm run dev
#   open http://localhost:3000
```

Get a key at https://console.groq.com/keys.

### Security: the API key

- The key goes in **`.env.local`** as `GROQ_API_KEY=...` with **no `VITE_` prefix**.
  Because of that, Vite never bundles it into the browser. The dev server proxies
  `/api/groq` → `api.groq.com` and attaches the key **server-side** (see
  `vite.config.ts`). The browser never sees it.
- `.env.local` is git-ignored. Never commit it.
- **Rotate any key that has ever been pasted into a chat, email, or screenshot** —
  treat it as compromised. Generate a fresh one for this file.
- For a real deployment (not a local research run), replace the Vite dev proxy
  with a proper backend service. Browser-side calls are fine only for local,
  single-researcher use.

---

## How it works

```
participant types  ─▶  useSession.send()
                         │
                         ▼
                  buildMessages()  ──▶  /api/groq proxy  ──▶  Groq LLM
                         │                                      │
                         │            JSON { reply, phase,      │
                         ▼            techniques[], leaning,    ▼
                  safeParseAgent()   pressure, detection,  ◀── structured turn
                         │            ethics, analystNote }
            ┌────────────┴────────────┐
            ▼                         ▼
     ChatPanel (reply only)    ControlRoom (all metadata)
```

### The persuasion doctrine (`src/lib/persuasionEngine.ts`)

The system prompt encodes the techniques documented in the research corpus:

- **Five-phase pipeline:** rapport → comparison → emotional → close
- **Six core biases:** anchoring, social proof, scarcity, authority/word-of-machine,
  framing, loss aversion
- **Disparagement > amplification** (Salvi et al. — the strongest, least-detectable
  lever): quietly understating the alternative beats overselling the target
- **AFFIRM-EXPAND-ENABLE** for identity-loyal Apple users (never attack the brand)
- **Two-sided messaging, warmth cues, psychological personalization**

### Built-in guardrails

The agent is instructed to stay factually honest (the research shows honest
two-sided messaging out-performs deception on trust) and to refuse red-line
tactics — fabricated specs/reviews, fake urgency, exploiting disclosed
vulnerabilities, or denying it is an AI when asked. Those turns raise the
EU AI Act monitor to **caution** or **redline**. This is both a guardrail and the
RQ4 instrument (locating the persuasion/manipulation boundary).

> Intended for consenting, debriefed study participants in a closed environment.
> The console is the debrief surface: it shows the subject exactly what was done.

---

## Project layout

```
src/
  lib/
    persuasionEngine.ts   # system prompt + message builder (the core IP)
    groq.ts               # proxy client + defensive JSON parsing
    catalog.ts            # technique catalog w/ research provenance + phases
    types.ts              # shared types
    cn.ts                 # tailwind class helper
  state/
    useSession.ts         # zustand store: turns, leaning history, live metrics
  components/
    ChatPanel.tsx         # left: participant view
    ControlRoom.tsx       # right: researcher console (assembles the below)
    DecisionMeter.tsx     # iPhone↔Samsung shift + sparkline
    Gauges.tsx            # persuasion pressure + detection risk dials
    PipelineTracker.tsx   # 5-phase progress
    TechniqueFeed.tsx     # live log of techniques + quotes + sources
    EthicsMonitor.tsx     # EU AI Act boundary flag
    ModelPicker.tsx       # Groq model switch
  App.tsx                 # split-screen shell + briefing overlay
```

## Scripts

| Command | Action |
|---|---|
| `npm run dev` | Dev server with the Groq proxy on :3000 |
| `npm run build` | Typecheck (`tsc -b`) then production build |
| `npm run preview` | Serve the production build (note: no proxy — dev only) |

## Exporting data for analysis

Top-right of the app: **CSV** and **JSON** buttons download the current session.

- **CSV** — one row per agent turn, ready for stats tools / a neural net. Each row
  is a `(customer state) → (agent action) → (outcome)` tuple. Columns:
  `session_id, turn, timestamp_iso, customer_message, customer_stance,
  customer_signals, agent_reply, phase, techniques, technique_count,
  biases_active, persuasion_pressure, detection_risk, leaning, leaning_delta,
  turn_outcome, ethics_flag, ethics_article`.
  `turn_outcome` is the label: `toward_switch` (leaning rose), `toward_resist`
  (fell), or `hold`.
- **JSON** — lossless: full transcript, every per-turn analysis object, the
  leaning trajectory, technique/signal frequencies, and a session `outcome`
  (`converted` / `resisted` / `undecided`).

### Building a dataset

Run many sessions (use **New** to reset; each gets a fresh `session_id`), export
each CSV, and concatenate them. Because every row carries its `session_id`, the
combined file stays analysable per session and in aggregate.

### Using it for your research

- **Thematic analysis:** the `customer_message` + `customer_signals` columns give
  you coded themes per utterance (ecosystem lock-in, price sensitivity, brand
  identity, skepticism, etc. — taxonomy in `src/lib/catalog.ts`).
- **Neural-net classifier (switch vs. resist):** features = `customer_signals`
  (one-hot), `phase`, `techniques` (one-hot), `persuasion_pressure`,
  `detection_risk`; target = `turn_outcome` (turn-level) or session `outcome`
  (session-level). This lets you learn *which signals + techniques* precede a
  shift toward switching.

> **Research-rigor note:** `customer_signals` and `customer_stance` are the
> model's own classification of each message, not ground-truth human coding.
> They are excellent for exploration, but for a publishable thematic analysis you
> should hand-code (or have a second coder validate) a sample and report
> inter-coder agreement. Treat the auto-tags as a strong first pass.

## Tuning

- **Model:** switch live in the console header, or set `GROQ_MODEL` in `.env.local`.
- **Agent behaviour:** edit `SYSTEM_PROMPT` in `src/lib/persuasionEngine.ts`.
- **Technique catalog / colours / sources:** `src/lib/catalog.ts`.
- **Target product / scenario:** the scenario (iPhone→Samsung) lives in the system
  prompt; change it there to study a different switch.
