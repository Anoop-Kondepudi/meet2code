# Pipeline Phases

## Overview

The pipeline processes meeting transcripts through three phases. Each phase operates on a shared state file (`tasks.md`) and runs as stateless AI calls — no sessions, no memory. The `tasks.md` file IS the memory.

## Shared State

**`data/tasks/tasks.md`** — single file that evolves through all phases. Every phase reads it, updates it, and writes it back.

## Status Lifecycle

```
draft → planning → planned → implementing → pr-open
                                    ↘ cancelled (sanity check fails)
```

| Status | GitHub Label | Trigger |
|--------|-------------|---------|
| `draft` | `draft` + category | Task first extracted from meeting |
| `planning` | `planning` | Stabilized (3 unchanged cycles) or MEETING_ENDED |
| `planned` | `planned` | Plan generated and posted as issue comment |
| `implementing` | `implementing` | Sanity check passed, code being generated |
| `pr-open` | `pr-open` | PR created and linked to issue |
| `cancelled` | (issue closed) | AI cancels task, or sanity check fails |

## Phase 1: Task Extractor

- **Trigger:** Every 5 seconds during a live meeting (configurable via --interval)
- **Input:** Full transcript so far + current tasks.md
- **Output:** Updated tasks.md with new/modified tasks
- **Model:** gpt-4.1-nano via OpenAI API
- **Code:** `backend/extractor.py`, `backend/orchestrator.py`
- **What it does:**
  - Extract actionable tasks from conversation
  - Update existing tasks if more detail emerges
  - Detect if a task was walked back or cancelled
  - Create GitHub issues immediately with `draft` label
  - Relevance check: reset stabilization counter if task is still being discussed
  - Auto-stabilize: 3 consecutive unchanged cycles → `draft` → `planning`
  - MEETING_ENDED signal: immediately finalizes all remaining drafts
  - Never duplicate tasks

### GitHub Integration (during Phase 1)
- New task → `gh issue create` with `draft` + category label
- Task updated → `gh issue edit` to update title/body/labels
- Task stabilized → labels: `draft` → `planning`, triggers Phase 2
- Task cancelled → close the GitHub issue

## Phase 2: Plan Generator

- **Trigger:** Task status becomes `planning` (auto-stabilized or MEETING_ENDED)
- **Input:** Task details + repo file tree
- **Output:** Implementation plan posted as issue comment
- **Model:** GPT-5.4 via Codex CLI (xhigh reasoning)
- **Code:** `backend/plan_generator.py`
- **Concurrency:** Runs in background threads, non-blocking to extraction loop
- **On success:** Labels: `planning` → `planned`, plan posted as comment, chains to Phase 3
- **On failure:** Comment posted explaining failure, labels reverted to `draft` for retry

## Phase 3: PR Creator

Runs in the same background thread as Phase 2 (chained directly after plan generation).

### Phase 3.1: Sanity Check

- **Trigger:** Immediately after Phase 2 succeeds
- **Input:** Plan text + task details
- **Model:** GPT-5.4 via Codex CLI (xhigh reasoning, has codebase access)
- **Code:** `backend/pr_creator.py` → `sanity_check()`
- **What it does:** Evaluates whether the plan is concretely implementable. Catches cases where the plan says "not actionable" or "out of scope."
- **On not actionable:** Comment posted with explanation, issue closed, status → `cancelled`
- **On actionable:** Proceeds to Phase 3.2

### Phase 3.2: Implementation + PR

- **Trigger:** Sanity check passes
- **Input:** Plan text + task details
- **Model:** GPT-5.4 via Codex CLI (xhigh reasoning)
- **Code:** `backend/pr_creator.py` → `implement_and_pr()`
- **Concurrency:** Uses `git worktree` for isolation — each task gets its own working directory
- **Steps:**
  1. Create git worktree with branch `hackai-TASK-{id}`
  2. Run Codex to implement changes in the worktree
  3. Verify changes were made (non-empty diff)
  4. Commit, push branch
  5. Create PR via `gh pr create` with `Closes #{issue}` in body
  6. Post comment on issue linking to PR
  7. Labels: `implementing` → `pr-open`
  8. Clean up worktree
- **On failure:** Comment posted with error details, labels reverted to `planned`, worktree cleaned up

## Token Safety

- Hard stop at 80k tokens — preserve tasks.md as-is
- For 5-10 min meetings (~2-3k tokens) this will not be hit

## Bot Messaging

The pipeline can send messages back to the meeting chat via the bot:
- Token limit reached
- Error conditions
