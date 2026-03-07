# Backend (Anoop)

Orchestrates GitHub issue creation, AI planning, and PR generation.

## Responsibilities
- Read tasks from `data/tasks/`
- Create GitHub issues via `gh` CLI or GitHub API
- Run Claude Code (headless CLI) to generate implementation plans
- Post plans as issue comments
- On approval, run Claude Code to generate code and open PRs
- Track status in `data/issues/` matching `shared/schemas/issue_status.json`

## Input
Task JSON from `shared/schemas/task.json`

## Output
IssueStatus JSON matching `shared/schemas/issue_status.json`
