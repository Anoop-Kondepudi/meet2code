# Pipeline (Anoop)

Consumes transcript chunks and extracts actionable tasks using an LLM.

## Responsibilities
- Read transcript chunks from `data/transcripts/`
- Use Claude to identify action items from conversation
- Output structured tasks matching `shared/schemas/task.json`
- Write tasks to `data/tasks/`

## Input
TranscriptChunk JSON from `shared/schemas/transcript_chunk.json`

## Output
Task JSON matching `shared/schemas/task.json`
