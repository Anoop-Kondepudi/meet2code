# Meet2Code

A fully agentic meeting-to-PR pipeline. Join a meeting, discuss bugs and features — and watch as AI automatically transcribes the conversation, extracts tasks, creates GitHub issues with implementation plans, generates code, and opens pull requests. A real-time dashboard monitors every step.

**Flow:** Live Meeting → Audio Capture → Real-Time Transcription → Task Extraction → GitHub Issues → AI Implementation Plan → Code Generation → Pull Request

## How It Works

1. **Meeting Bot** joins a call and captures audio
2. **AssemblyAI** transcribes speech in real time with speaker diarization
3. **GPT-4.1-nano** extracts actionable tasks from the transcript every 5 seconds
4. **GitHub Issues** are created automatically for each task (draft → stabilized → planned)
5. **Codex GPT-5.4** generates implementation plans and posts them as issue comments
6. **Codex GPT-5.4** implements the code changes and opens PRs automatically
7. **Dashboard** shows the entire pipeline in real time — transcription, tasks, kanban board, activity feed

## Demo

The pipeline targets a demo to-do app (`demo/`) with 12 intentional bugs/missing features. During a meeting, discuss what needs fixing — the pipeline detects, plans, and fixes them autonomously.

See [`docs/demo-guide.md`](docs/demo-guide.md) for full setup and run instructions.

## Repo Structure

| Folder | Owner | Description |
|--------|-------|-------------|
| `bot/` | Nishil | Meeting bot — joins calls, captures audio |
| `transcription/` | Shiv | AssemblyAI streaming transcription with speaker labels |
| `pipeline/` | Anoop | Task extraction prompts and logic |
| `backend/` | Anoop | Orchestrator, GitHub ops, AI plan generation, PR creation |
| `dashboard/` | Anoop | Real-time Next.js monitoring UI |
| `demo/` | Target | To-do app with intentional issues (pipeline fixes these) |
| `shared/` | Everyone | Data contracts and config |
| `data/` | Runtime | Transcripts, tasks, pipeline state (gitignored) |

## Quick Start

```bash
git clone https://github.com/Anoop-Kondepudi/hackai.git
cd hackai
cp shared/config/.env .env
# Fill in OPENAI_API_KEY, ASSEMBLYAI_API_KEY, GITHUB_REPO
```

Then open 4 terminals:
```bash
# Terminal 1: Demo app
cd demo && npm install && npm run install:all && npm run dev

# Terminal 2: Transcription
cd transcription && npm run transcribe:local

# Terminal 3: Pipeline orchestrator
cd backend && python orchestrator.py --interval 5

# Terminal 4: Dashboard
cd dashboard && npm install && npm run dev
```

## Tech Stack

- **Transcription:** AssemblyAI Universal Streaming (real-time, speaker diarization)
- **Task Extraction:** OpenAI GPT-4.1-nano (stateless, full-context calls)
- **Planning & Implementation:** Codex GPT-5.4 (xhigh reasoning)
- **Dashboard:** Next.js 16, React 19, Tailwind v4, Framer Motion, WebSocket
- **GitHub Integration:** `gh` CLI for issues, PRs, labels
- **Audio Capture:** ffmpeg + BlackHole (macOS system audio)

## Team

- **Anoop** — Pipeline, backend orchestration, dashboard, PR creation
- **Shiv** — Audio transcription, AssemblyAI integration
- **Nishil** — Meeting bot, audio capture
