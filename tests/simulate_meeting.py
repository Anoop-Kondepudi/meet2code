#!/usr/bin/env python3
"""
Simulate a real meeting flow with incremental transcript chunks.

Each chunk is ~5 seconds of speech (1-2 sentences). Bypasses
the orchestrator to directly call extract_tasks() so we can
print exactly what the model receives.

Usage:
    python tests/simulate_meeting.py
"""

import json
import shutil
import sys
from datetime import datetime, timedelta
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from extractor import extract_tasks
from task_parser import parse_tasks, diff_tasks, tasks_to_md

# Simulated transcript — each entry is one ~5-second chunk of speech
MEETING_CHUNKS = [
    ("Shiv", "Hey everyone, let's get started. How's everything going?"),
    ("Anoop", "Good, good. So I looked at the login page this morning."),
    ("Anoop", "The login is acting weird. Like sometimes it just..."),
    ("Anoop", "...hangs on the redirect. I think it's the OAuth config."),
    ("Shiv", "Yeah I saw that too. Is it Google OAuth specifically?"),
    ("Anoop", "Yeah, Google OAuth. The redirect URI is wrong in production."),
    ("Shiv", "Got it. So we need to fix the redirect URI in the prod config."),
    ("Shiv", "Also, the API has been getting hammered lately."),
    ("Anoop", "We should probably add rate limiting to the endpoints."),
    ("Shiv", "Yeah, especially the public ones. Maybe 100 requests per minute?"),
]

def main():
    tasks_file = PROJECT_ROOT / "data" / "tasks" / "tasks.md"

    # Start clean
    if tasks_file.exists():
        tasks_file.unlink()

    base_time = datetime(2026, 3, 7, 14, 0, 0)
    all_chunks = []
    current_tasks_md = ""

    for i, (speaker, text) in enumerate(MEETING_CHUNKS):
        chunk_time = base_time + timedelta(seconds=i * 5)
        timestamp = chunk_time.strftime("%Y-%m-%dT%H:%M:%S")

        chunk = {"speaker": speaker, "text": text, "timestamp": timestamp}
        all_chunks.append(chunk)

        transcript_text = json.dumps(all_chunks, indent=2)

        print("=" * 60)
        print(f"  CYCLE {i + 1}/{len(MEETING_CHUNKS)}")
        print("=" * 60)
        print()
        print(f"  NEW CHUNK: {speaker}: \"{text}\"")
        print()
        print(f"  TRANSCRIPT SENT TO MODEL ({len(all_chunks)} chunks):")
        print(f"  {transcript_text}")
        print()
        print(f"  TASKS.MD SENT TO MODEL:")
        print(f"  {current_tasks_md if current_tasks_md.strip() else '(empty)'}")
        print()

        # Call the model directly
        print("  [calling gpt-4.1-nano...]")
        new_md = extract_tasks(transcript_text, current_tasks_md)
        print()

        if new_md is None:
            print("  [API returned None — skipping]")
            continue

        print(f"  MODEL RETURNED:")
        print(f"  {new_md}")
        print()

        # Diff
        old_tasks = parse_tasks(current_tasks_md) if current_tasks_md.strip() else []
        new_tasks = parse_tasks(new_md)

        changes = diff_tasks(old_tasks, new_tasks if new_tasks else [])
        added = len(changes["added"])
        updated = len(changes["updated"])
        cancelled = len(changes["cancelled"])
        unchanged = len(changes["unchanged"])
        print(f"  DIFF: +{added} new, ~{updated} updated, x{cancelled} cancelled, ={unchanged} unchanged")

        # Update current state
        all_tasks = changes["added"] + changes["updated"] + changes["cancelled"] + changes["unchanged"]
        all_tasks.sort(key=lambda t: t.id)

        if all_tasks:
            header = f"# Meeting Tasks — {datetime.now().strftime('%Y-%m-%d')}\n\n"
            current_tasks_md = header + tasks_to_md(all_tasks)
        else:
            current_tasks_md = ""

        print()
        print()


if __name__ == "__main__":
    main()
