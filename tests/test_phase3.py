#!/usr/bin/env python3
"""
Test Phase 3 (sanity check + PR creation) with an actionable task.

Uses a realistic task that targets actual files in this codebase.

Usage:
    python tests/test_phase3.py              # dry run
    python tests/test_phase3.py --live        # real GitHub PR
"""

import argparse
import json
import shutil
import sys
from datetime import datetime
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from orchestrator import run_cycle, _plan_threads

# A meeting where someone asks to add a simple docstring/comment to an existing file
# This is actionable because shared/config/.env.example exists
MEETING_CHUNKS = [
    ("Anoop", "We need to add a CODEX_TIMEOUT variable to the env example file so people know they can configure the timeout."),
    ("Shiv", "Yeah that makes sense, add it to the .env.example."),
    # Filler to stabilize
    ("Anoop", "Cool, anything else?"),
    ("Shiv", "Nope, that's it."),
    ("Anoop", "Alright let's wrap up."),
    ("SYSTEM", "MEETING_ENDED"),
]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--live", action="store_true", help="Create real GitHub issues and PRs")
    args = parser.parse_args()

    sim_dir = PROJECT_ROOT / "data" / "sim_transcripts"
    tasks_file = PROJECT_ROOT / "data" / "tasks" / "tasks.md"
    dry_run = not args.live

    # Start clean
    if sim_dir.exists():
        shutil.rmtree(sim_dir)
    sim_dir.mkdir(parents=True, exist_ok=True)
    if tasks_file.exists():
        tasks_file.unlink()

    base_time = datetime(2026, 3, 7, 15, 0, 0)
    all_chunks = []
    prev_chunk_count = 0

    mode = "LIVE" if args.live else "DRY RUN"
    print("=" * 60)
    print(f"  PHASE 3 TEST ({mode})")
    print("=" * 60)
    print()

    for i, (speaker, text) in enumerate(MEETING_CHUNKS):
        timestamp = (base_time).strftime("%Y-%m-%dT%H:%M:%S")
        base_time = base_time.__class__(2026, 3, 7, 15, 0, (i + 1) * 5)

        chunk = {"speaker": speaker, "text": text, "timestamp": timestamp}
        all_chunks.append(chunk)

        (sim_dir / "transcript.json").write_text(json.dumps(all_chunks, indent=2))

        print(f"--- Chunk {i + 1}/{len(MEETING_CHUNKS)} ---")
        print(f"  {speaker}: \"{text}\"")
        print()

        _, prev_chunk_count = run_cycle(sim_dir, dry_run=dry_run, prev_chunk_count=prev_chunk_count)

        # Show task state
        if tasks_file.exists():
            content = tasks_file.read_text().strip()
            for line in content.split("\n"):
                if line.startswith("## TASK-") or line.startswith("Status:") or line.startswith("Issue:"):
                    print(f"    {line}")
        print()

    # Wait for background threads
    if _plan_threads:
        print(f"\n[wait] Waiting for {len(_plan_threads)} background thread(s)...")
        for t in _plan_threads:
            t.join()
        _plan_threads.clear()
        print("[wait] All threads completed.")

    # Final state
    print()
    print("=" * 60)
    print("  FINAL tasks.md")
    print("=" * 60)
    if tasks_file.exists():
        print(tasks_file.read_text())

    shutil.rmtree(sim_dir)


if __name__ == "__main__":
    main()
