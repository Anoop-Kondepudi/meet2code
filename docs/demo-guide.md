# Meet2Code Demo Guide

Everything you need to run the full pipeline end-to-end for the dev post demo.

## Prerequisites

- **Node.js** >= 20
- **Python 3** with `openai`, `python-dotenv` installed
- **ffmpeg** installed (`brew install ffmpeg`)
- **gh** CLI authenticated (`gh auth login`)
- **codex** CLI installed (for plan generation + PR creation)
- **BlackHole 2ch** installed (for system audio capture on macOS)
- **macOS Audio MIDI Setup**: Multi-Output Device configured (BlackHole + speakers)
- **System Sound Output** set to "Multi-Output Device"

## Environment Variables

Root `.env` (at `/Users/anoopkondepudi/Desktop/hackai/.env`):
```
OPENAI_API_KEY=sk-...
GITHUB_REPO=Anoop-Kondepudi/hackai
```

Transcription `.env` (at `transcription/.env`):
```
ASSEMBLYAI_API_KEY=...
ASSEMBLYAI_SPEECH_MODEL=universal-streaming-english
ASSEMBLYAI_SPEAKER_LABELS=true
ASSEMBLYAI_MAX_SPEAKERS=3
AUDIO_SAMPLE_RATE=16000
AUDIO_INPUT_FORMAT=avfoundation
AUDIO_INPUT_DEVICE=:1
AUDIO_INPUT_DEVICE_2=:0
```

## Fresh Start (Reset for Demo)

Before recording, clear old data:

```bash
# Clear old transcripts and tasks
rm -f data/transcripts/live_meeting.json
rm -f data/pipeline-status.json

# Reset tasks.md to empty
echo "" > data/tasks/tasks.md

# Clear debug log
echo "" > transcription/debug-transcription.log
```

---

## Terminal Layout (5 terminals)

### Terminal 1: Demo App (the "before")
```bash
cd /Users/anoopkondepudi/Desktop/hackai/demo
npm install && npm run install:all
npm run dev
```
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### Terminal 2: Live Transcription
```bash
cd /Users/anoopkondepudi/Desktop/hackai/transcription
npm run transcribe:local
```
- Shows word-by-word streaming in real time
- Saves final turns to `data/transcripts/live_meeting.json`
- Press Ctrl+C to stop (sends MEETING_ENDED signal to pipeline)

### Terminal 3: Pipeline Orchestrator
```bash
cd /Users/anoopkondepudi/Desktop/hackai/backend
python orchestrator.py --interval 5
```
- Reads transcripts every 5 seconds
- Extracts tasks → creates GitHub issues → generates plans → opens PRs
- Add `--dry-run` to test without GitHub operations

### Terminal 4: Dashboard
```bash
cd /Users/anoopkondepudi/Desktop/hackai/dashboard
npm install
npm run dev
```
- Opens at http://localhost:3000
- Polls pipeline data every 3 seconds
- Shows real-time kanban board, task list, PR status

### Terminal 5: General Purpose
Use for git commands, checking PRs, running the "after" demo server, etc.

---

## Demo Flow

### 1. Start all services
Open terminals 1-4 with the commands above. Verify:
- Demo app running at :5173
- Dashboard running at :3000
- Transcriber connected to AssemblyAI
- Orchestrator waiting for transcripts

### 2. Conduct the "meeting"
Have a conversation discussing bugs/features in the demo todo app. Example:

> "Alright, so the to-do app has some issues. First, there's no dark mode — we need a dark mode toggle. Also, you can't edit todos once they're created, that's a basic feature we need. Oh and the data gets lost every time the server restarts, we need to persist it somewhere."

The transcriber captures everything → saves to `data/transcripts/live_meeting.json`.

### 3. Watch the pipeline
On the dashboard at :3000, watch in real time:
- Tasks appear in the **Draft** column
- After 3 stable cycles (~15s), tasks move to **Planning**
- Plans get generated and posted as issue comments
- PRs get created automatically
- Cards flow through: Draft → Planning → Planned → Implementing → PR Open

### 4. End the meeting
Press **Ctrl+C** in Terminal 2 (transcriber). This:
- Appends `MEETING_ENDED` to the transcript
- Pipeline finalizes all remaining draft tasks immediately

### 5. Show the "before vs after"
See section below.

---

## Before vs After PR Demo

This is how to show the demo app BEFORE and AFTER a PR is merged.

### Option A: Side-by-Side (Recommended)

**Before** — already running on :5173 from Terminal 1.

**After** — once a PR is created (e.g., `hackai-TASK-2`):

```bash
# In Terminal 5, create a worktree for the PR branch
cd /Users/anoopkondepudi/Desktop/hackai
git fetch origin
git worktree add /tmp/hackai-pr hackai-TASK-2

# Run the demo app from the PR branch on a different port
cd /tmp/hackai-pr/demo
npm install && npm run install:all

# Start backend on port 3002, frontend on port 5174
PORT=3002 npx tsx watch backend/src/index.ts &
VITE_API_PORT=3002 npx vite --port 5174
```

Now open both:
- http://localhost:5173 — **Before** (main branch)
- http://localhost:5174 — **After** (PR branch)

### Option B: Sequential

```bash
# Stop the demo app (Ctrl+C in Terminal 1)

# Checkout the PR branch
cd /Users/anoopkondepudi/Desktop/hackai
git fetch origin
git checkout hackai-TASK-2

# Run the same demo app — now with PR changes
cd demo
npm run dev
```

Show the changes at :5173, then switch back:
```bash
git checkout main
```

### Cleanup worktrees
```bash
git worktree remove /tmp/hackai-pr
```

---

## Useful Commands

```bash
# Check pipeline status
cat data/pipeline-status.json | python3 -m json.tool

# View current tasks
cat data/tasks/tasks.md

# View live transcript
cat data/transcripts/live_meeting.json | python3 -m json.tool

# List open PRs
gh pr list --repo Anoop-Kondepudi/hackai

# View a specific PR
gh pr view <number> --repo Anoop-Kondepudi/hackai

# List issues
gh issue list --repo Anoop-Kondepudi/hackai

# Watch the debug transcription log
tail -f transcription/debug-transcription.log
```

## Audio Setup Reminder (macOS)

1. **System Settings → Sound → Output** = "Multi-Output Device"
2. **Audio MIDI Setup** → Multi-Output Device includes:
   - Your speakers/headphones (for hearing audio)
   - BlackHole 2ch (for capturing system audio)
3. Volume control: Adjust in Audio MIDI Setup or per-app (keyboard volume won't work with Multi-Output Device)

## Troubleshooting

| Problem | Fix |
|---------|-----|
| No transcription | Check ffmpeg is installed, BlackHole configured, Audio output = Multi-Output Device |
| Only 1 speaker detected | Expected — people speak one at a time. Speaker labels appear on finals. |
| Pipeline not extracting tasks | Check `OPENAI_API_KEY` in root `.env`. Run orchestrator with `--dry-run` first. |
| Dashboard empty | Check `data/tasks/tasks.md` has content. Dashboard polls `../data/` relative to itself. |
| `gh` errors | Run `gh auth login` to authenticate. Check `GITHUB_REPO` env var. |
| No PRs being created | Codex CLI must be installed. Tasks need 3 stable cycles to move to planning. |
| Can't hear audio | Multi-Output Device doesn't support keyboard volume. Adjust in Audio MIDI Setup. |

## Target Codebase

The pipeline creates PRs that modify files in `/demo/`. The 12 seeded issues are in `demo/issues/`:

| # | Issue | Type |
|---|-------|------|
| 1 | Dark Mode Toggle | feature |
| 2 | Edit Todo | feature |
| 3 | Due Dates | feature |
| 4 | Priority Levels | feature |
| 5 | Search & Filter | feature |
| 6 | Persistent Storage (data loss on restart) | bug |
| 7 | Delete Confirmation | improvement |
| 8 | Empty State | improvement |
| 9 | Long Text Overflow | bug |
| 10 | Hover States | improvement |
| 11 | Keyboard Shortcuts | improvement |
| 12 | Accessibility Labels | improvement |

During the meeting, discuss these issues naturally. The pipeline will extract them as tasks, create issues, generate plans, and open PRs — all automatically.
