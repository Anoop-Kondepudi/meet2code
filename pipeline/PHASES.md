# Pipeline Phases

## Overview

The pipeline processes meeting transcripts through multiple phases. Each phase has its own prompt and operates on a shared state file (`tasks.md`).

All phases send the FULL transcript text accumulated so far (not just new chunks) for maximum context. Each call is stateless — no sessions, no memory. The `tasks.md` file IS the memory.

## Shared State

**`data/tasks/tasks.md`** — single file that evolves through all phases. Every phase reads it, updates it, and writes it back.

Template: `pipeline/templates/tasks_template.md`

## Phase 1: Task Extractor

- **Trigger:** Every 3-5 seconds during a live meeting
- **Input:** Full transcript so far + current tasks.md
- **Output:** Updated tasks.md with new/modified tasks
- **Prompt:** `pipeline/prompts/task_extractor.md`
- **Model:** Fast model (Codex Spark / Haiku) — needs near-instant response
- **What it does:**
  - Extract actionable tasks from conversation
  - Update existing tasks if more detail emerges
  - Detect if a task was walked back or cancelled
  - Create GitHub issues immediately with `draft` label
  - Auto-stabilize: when a task hasn't changed for 3-4 consecutive chunks, flip from `draft` → `open` and remove the `draft` label on GitHub
  - Never duplicate tasks

### GitHub Integration (during Phase 1)
- New task extracted → `gh issue create` with `draft` label → store issue number in tasks.md
- Task updated → `gh issue edit` to update title/body/labels
- Task stabilized (no updates for 3-4 chunks) → remove `draft` label, status becomes `open`
- Task cancelled → close the GitHub issue

### Auto-Stabilization Logic
Each task tracks `Last-Updated` timestamp. The orchestrator compares this against the current chunk timestamp. If a task hasn't been updated for 3-4 consecutive processing cycles, it's considered stable:
1. Remove `draft` label on GitHub
2. Set status to `open`
3. This task is now eligible for Phase 2

## Phase 2: Plan Generator (TODO)

- **Trigger:** When a task's status becomes `open` (auto-stabilized)
- **Input:** The specific task from tasks.md + relevant transcript context
- **Output:** Updated tasks.md with implementation plan added to the task
- **Prompt:** `pipeline/prompts/plan_generator.md` (not yet created)
- **Model:** Stronger model (Claude Sonnet/Opus) — quality over speed
- **GitHub:** Posts plan as a comment on the issue

## Phase 3: PR Creator (TODO)

- **Trigger:** After plan is generated (or on manual approval)
- **Input:** Task + plan from tasks.md
- **Output:** GitHub PR with code changes
- **Prompt:** `pipeline/prompts/pr_creator.md` (not yet created)
- **Uses:** Claude Code CLI in headless mode
- **GitHub:** Opens PR linked to the issue

## Token Safety

- Track token count of full transcript on each call
- If transcript exceeds 80k tokens: stop processing, preserve tasks.md as-is
- Send message via bot to meeting chat: "Meeting transcript limit reached. Task tracking paused — all tasks so far are preserved."
- For 5-10 min meetings (~2-3k tokens) this will not be hit

## Bot Messaging

The pipeline can send messages back to the meeting chat via the bot:
- Token limit reached
- Error conditions
- Potentially: task extraction confirmations
