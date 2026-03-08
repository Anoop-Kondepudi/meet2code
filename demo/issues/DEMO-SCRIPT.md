# Demo Meeting Script

3 speakers. ~2 minutes. Keep it natural — no one says "action item" or sounds rehearsed.

---

## Speakers

- **Anoop** — leads the meeting, brings up the app
- **Shiv** — notices bugs, suggests features
- **Nishil** — agrees, adds detail, brings up his own issue

---

## Script

**Anoop:** Alright guys, so we've got this to-do app and there's a bunch of stuff we need to fix before we ship it. I pulled it up — let me share my screen so we can go through it together.

**Shiv:** Yeah I was messing around with it earlier. The first thing I noticed — there's no dark mode at all. It's just this bright white screen. We need a dark mode toggle, like a little sun-moon icon in the header. And it should save your preference so it doesn't reset every time you refresh.

**Anoop:** Agreed, that's basic. We should definitely add that. What else did you find?

**Shiv:** The other big one — if you restart the server, all the todos are gone. Like completely wiped. It's all stored in memory, there's no persistence at all. We need to save todos to a file or something so they don't disappear.

**Nishil:** Wait, really? So every time the backend restarts we lose everything? That's a pretty big bug honestly.

**Shiv:** Yeah, it just uses an in-memory array. It resets to the seed data every time.

**Anoop:** Okay yeah, the data persistence thing is critical. Let's make that priority one. Nishil, what about on your end — did you notice anything?

**Nishil:** Yeah actually. You can't edit a todo after you create it. Like if you make a typo or want to change the title, you have to delete it and make a new one. We should add inline editing — double-click to edit, Enter to save, Escape to cancel.

**Anoop:** Good call. That's a pretty standard feature, we definitely need that.

**Nishil:** Also one more small thing — if you type a really long title, like paste a URL or something, it overflows the card and breaks the whole layout. The text just goes off the screen. We should add word wrap or truncate it.

**Anoop:** Oh yeah, that's ugly. Alright so we've got four things — dark mode, data persistence, inline editing, and the text overflow bug. Let's get these knocked out. Anything else?

**Shiv:** I think that covers the big stuff for now.

**Anoop:** Cool. Let's get to work.

---

## What to Show During Recording

### Screen layout (split or switch between):

1. **Terminal with transcriber** — word-by-word text appearing in real time as you speak
2. **Dashboard at localhost:3000** — the main thing judges see:
   - Watch the status bar flip from "Pipeline Stopped" to "Pipeline Running"
   - Stat cards increment as tasks are extracted (Total Tasks: 0 → 1 → 2 → 3 → 4)
   - Activity feed fills up with events ("TASK-1 extracted from meeting", "Issue #47 created"...)
   - Task Status Breakdown bar grows with draft segments
3. **Pipeline page (localhost:3000/pipeline)** — after ~15-20 seconds, tasks start moving through columns:
   - Draft → Planning → Planned → Implementing → PR Open
4. **GitHub** — show the auto-created issues and PRs on the repo page
5. **Demo app before/after** — if a PR finishes in time, checkout the branch and show the fix

### Timing guide:

| Time | What's happening |
|------|-----------------|
| 0:00 | Start recording, show the demo app briefly ("here's our to-do app") |
| 0:15 | Start the meeting conversation, show transcriber terminal |
| 0:30 | Switch to dashboard — tasks should start appearing |
| 1:00 | Pipeline view — cards in Draft column |
| 1:30 | Meeting ends (Ctrl+C transcriber), tasks finalize |
| 2:00 | Show dashboard as tasks flow through Planning → Planned |
| 2:30+ | Show GitHub issues/PRs being created automatically |
| 3:00+ | If a PR landed, show before/after of the demo app |
