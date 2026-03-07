# Dashboard (Anoop)

Real-time monitoring UI showing the full pipeline status.

## Responsibilities
- Show live transcript chunks as they come in
- Display extracted tasks and their status
- Show GitHub issues, AI plans, and PR status
- Real-time updates (polling local files or WebSocket if using Supabase)

## Input
Reads from `data/` directory (transcripts, tasks, issues)
