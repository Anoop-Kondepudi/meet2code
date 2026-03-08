// Types matching the actual HackAI pipeline data model

export type TaskStatus = "draft" | "planning" | "planned" | "implementing" | "pr-open" | "cancelled"
export type TaskLabel = "bug" | "feature" | "refactor" | "improvement"

export interface PipelineTask {
  id: number
  title: string
  status: TaskStatus
  label: TaskLabel
  issueNumber: number | null
  prNumber: number | null
  prUrl: string | null
  description: string
  source: string
  lastUpdated: string
  unchangedCycles: number
}

export type EventType =
  | "task_extracted"
  | "issue_created"
  | "plan_posted"
  | "sanity_passed"
  | "sanity_failed"
  | "pr_created"
  | "task_cancelled"

export interface PipelineEvent {
  id: string
  type: EventType
  taskId: number
  title: string
  detail: string
  timestamp: string
}

export interface PipelineStats {
  totalTasks: number
  plansGenerated: number
  prsOpened: number
  issuesCancelled: number
  tasksByStatus: Record<TaskStatus, number>
  isRunning: boolean
  lastCycleTime: string
  cycleCount: number
}

// --- Mock Data ---

export const mockTasks: PipelineTask[] = [
  {
    id: 1,
    title: "Fix Google OAuth redirect URI in production",
    status: "pr-open",
    label: "bug",
    issueNumber: 42,
    prNumber: 46,
    prUrl: "https://github.com/Anoop-Kondepudi/hackai/pull/46",
    description:
      "Google OAuth login is broken in production. The redirect URI is hardcoded to localhost instead of the production domain. Need to use environment variable for the redirect URI.",
    source: '"The auth system is completely broken, nobody can log in with Google right now." — Shiv, 14:00:05',
    lastUpdated: "2026-03-07T14:12:30Z",
    unchangedCycles: 8,
  },
  {
    id: 2,
    title: "Add rate limiting to API endpoints",
    status: "implementing",
    label: "feature",
    issueNumber: 43,
    prNumber: null,
    prUrl: null,
    description:
      "API endpoints have no rate limiting. Need to add express-rate-limit middleware with configurable limits per endpoint. Start with 100 req/min for auth, 200 req/min for general.",
    source: '"We got hit with a bunch of spam requests yesterday, we need rate limiting ASAP." — Nishil, 14:01:22',
    lastUpdated: "2026-03-07T14:10:15Z",
    unchangedCycles: 5,
  },
  {
    id: 3,
    title: "Refactor database connection pooling",
    status: "planned",
    label: "refactor",
    issueNumber: 44,
    prNumber: null,
    prUrl: null,
    description:
      "Current DB setup creates a new connection per request. Switch to connection pooling with pg-pool. Configure max 20 connections, idle timeout 30s.",
    source: '"The database connections keep maxing out under load, we need proper pooling." — Anoop, 14:02:45',
    lastUpdated: "2026-03-07T14:08:00Z",
    unchangedCycles: 4,
  },
  {
    id: 4,
    title: "Add webhook notifications for deployment status",
    status: "planning",
    label: "feature",
    issueNumber: 45,
    prNumber: null,
    prUrl: null,
    description:
      "Set up webhook notifications to Slack when deployments succeed or fail. Use the existing Slack bot token. Send to #deployments channel.",
    source: '"Can we get notified when deploys finish? I keep checking manually." — Shiv, 14:03:50',
    lastUpdated: "2026-03-07T14:06:20Z",
    unchangedCycles: 2,
  },
  {
    id: 5,
    title: "Improve error messages in onboarding flow",
    status: "draft",
    label: "improvement",
    issueNumber: 47,
    prNumber: null,
    prUrl: null,
    description:
      "Error messages during user onboarding are generic. Replace with specific, actionable messages for each validation failure (email format, password strength, duplicate account).",
    source: '"Users keep getting confused by the error messages during signup." — Nishil, 14:05:10',
    lastUpdated: "2026-03-07T14:05:10Z",
    unchangedCycles: 0,
  },
  {
    id: 6,
    title: "Add dark mode support to email templates",
    status: "draft",
    label: "feature",
    issueNumber: 48,
    prNumber: null,
    prUrl: null,
    description:
      "Email templates don't respect dark mode. Add prefers-color-scheme media queries and test across major email clients (Gmail, Outlook, Apple Mail).",
    source: '"Our emails look terrible in dark mode, especially on Apple Mail." — Anoop, 14:06:30',
    lastUpdated: "2026-03-07T14:06:30Z",
    unchangedCycles: 0,
  },
  {
    id: 13,
    title: "Add retry logic to webhook delivery",
    status: "draft",
    label: "bug",
    issueNumber: 56,
    prNumber: null,
    prUrl: null,
    description:
      "Webhooks fail silently when the target server is down. Add exponential backoff retry (3 attempts, 1s/5s/30s) with dead letter queue for permanent failures.",
    source: '"We lost a bunch of webhook events last night when the partner API went down." — Nishil, 14:13:20',
    lastUpdated: "2026-03-07T14:13:20Z",
    unchangedCycles: 0,
  },
  {
    id: 7,
    title: "Migrate cron jobs to BullMQ",
    status: "pr-open",
    label: "refactor",
    issueNumber: 49,
    prNumber: 52,
    prUrl: "https://github.com/Anoop-Kondepudi/hackai/pull/52",
    description:
      "Replace node-cron with BullMQ for better job scheduling, retry logic, and monitoring. Migrate all 4 existing cron jobs.",
    source: '"The cron jobs keep failing silently, we need something more robust." — Shiv, 14:07:15',
    lastUpdated: "2026-03-07T14:14:00Z",
    unchangedCycles: 10,
  },
  {
    id: 8,
    title: "Fix N+1 query in team members endpoint",
    status: "planned",
    label: "bug",
    issueNumber: 50,
    prNumber: null,
    prUrl: null,
    description:
      "GET /api/teams/:id/members makes a separate DB query for each member. Refactor to use a single JOIN query with eager loading.",
    source: '"The team page takes forever to load when there are a lot of members." — Nishil, 14:08:40',
    lastUpdated: "2026-03-07T14:09:00Z",
    unchangedCycles: 3,
  },
  {
    id: 9,
    title: "Add CSV export for analytics dashboard",
    status: "implementing",
    label: "feature",
    issueNumber: 51,
    prNumber: null,
    prUrl: null,
    description:
      "Users want to export analytics data as CSV. Add export button to dashboard that generates CSV with all visible metrics and date range.",
    source: '"The product team keeps asking me to manually export data, let\'s just add a button." — Anoop, 14:09:55',
    lastUpdated: "2026-03-07T14:11:00Z",
    unchangedCycles: 4,
  },
  {
    id: 10,
    title: "Update README with setup instructions",
    status: "cancelled",
    label: "improvement",
    issueNumber: 53,
    prNumber: null,
    prUrl: null,
    description: "README is outdated. But we decided to use a wiki instead.",
    source: '"We should update the README..." — Shiv, 14:04:20',
    lastUpdated: "2026-03-07T14:07:00Z",
    unchangedCycles: 0,
  },
  {
    id: 11,
    title: "Remove deprecated v1 API routes",
    status: "cancelled",
    label: "refactor",
    issueNumber: 54,
    prNumber: null,
    prUrl: null,
    description: "v1 API routes still exist but have no consumers. Cancelled — will handle in next sprint.",
    source: '"Should we clean up the old v1 routes?" — Nishil, 14:10:30',
    lastUpdated: "2026-03-07T14:11:30Z",
    unchangedCycles: 0,
  },
  {
    id: 12,
    title: "Add input sanitization to comment endpoints",
    status: "planning",
    label: "bug",
    issueNumber: 55,
    prNumber: null,
    prUrl: null,
    description:
      "Comment creation endpoint doesn't sanitize HTML input. Add DOMPurify server-side to prevent XSS in user comments.",
    source: '"I noticed you can inject script tags in comments, that\'s bad." — Anoop, 14:12:00',
    lastUpdated: "2026-03-07T14:12:00Z",
    unchangedCycles: 1,
  },
]

export const mockEvents: PipelineEvent[] = [
  {
    id: "evt-1",
    type: "task_extracted",
    taskId: 1,
    title: "Task extracted from meeting",
    detail: "TASK-1: Fix Google OAuth redirect URI in production",
    timestamp: "2026-03-07T14:00:10Z",
  },
  {
    id: "evt-2",
    type: "issue_created",
    taskId: 1,
    title: "GitHub issue created",
    detail: "Issue #42 created for TASK-1",
    timestamp: "2026-03-07T14:00:15Z",
  },
  {
    id: "evt-3",
    type: "task_extracted",
    taskId: 2,
    title: "Task extracted from meeting",
    detail: "TASK-2: Add rate limiting to API endpoints",
    timestamp: "2026-03-07T14:01:30Z",
  },
  {
    id: "evt-4",
    type: "issue_created",
    taskId: 2,
    title: "GitHub issue created",
    detail: "Issue #43 created for TASK-2",
    timestamp: "2026-03-07T14:01:35Z",
  },
  {
    id: "evt-5",
    type: "task_extracted",
    taskId: 3,
    title: "Task extracted from meeting",
    detail: "TASK-3: Refactor database connection pooling",
    timestamp: "2026-03-07T14:02:50Z",
  },
  {
    id: "evt-6",
    type: "plan_posted",
    taskId: 1,
    title: "Plan posted",
    detail: "Implementation plan posted to Issue #42",
    timestamp: "2026-03-07T14:03:00Z",
  },
  {
    id: "evt-7",
    type: "sanity_passed",
    taskId: 1,
    title: "Sanity check passed",
    detail: "TASK-1 passed sanity check — plan is actionable",
    timestamp: "2026-03-07T14:03:30Z",
  },
  {
    id: "evt-8",
    type: "task_extracted",
    taskId: 4,
    title: "Task extracted from meeting",
    detail: "TASK-4: Add webhook notifications for deployment status",
    timestamp: "2026-03-07T14:04:00Z",
  },
  {
    id: "evt-9",
    type: "task_extracted",
    taskId: 5,
    title: "Task extracted from meeting",
    detail: "TASK-5: Improve error messages in onboarding flow",
    timestamp: "2026-03-07T14:05:15Z",
  },
  {
    id: "evt-10",
    type: "task_cancelled",
    taskId: 10,
    title: "Task cancelled",
    detail: "TASK-10: Update README — not actionable, using wiki instead",
    timestamp: "2026-03-07T14:07:10Z",
  },
  {
    id: "evt-11",
    type: "plan_posted",
    taskId: 3,
    title: "Plan posted",
    detail: "Implementation plan posted to Issue #44",
    timestamp: "2026-03-07T14:08:10Z",
  },
  {
    id: "evt-12",
    type: "plan_posted",
    taskId: 4,
    title: "Plan posted",
    detail: "Implementation plan posted to Issue #45",
    timestamp: "2026-03-07T14:08:30Z",
  },
  {
    id: "evt-13",
    type: "sanity_passed",
    taskId: 3,
    title: "Sanity check passed",
    detail: "TASK-3 passed sanity check",
    timestamp: "2026-03-07T14:08:45Z",
  },
  {
    id: "evt-14",
    type: "pr_created",
    taskId: 1,
    title: "Pull request created",
    detail: "PR #46 opened for TASK-1 (hackai-TASK-1)",
    timestamp: "2026-03-07T14:09:00Z",
  },
  {
    id: "evt-15",
    type: "task_extracted",
    taskId: 9,
    title: "Task extracted from meeting",
    detail: "TASK-9: Add CSV export for analytics dashboard",
    timestamp: "2026-03-07T14:10:00Z",
  },
  {
    id: "evt-16",
    type: "task_cancelled",
    taskId: 11,
    title: "Task cancelled",
    detail: "TASK-11: Remove deprecated v1 API routes — deferred to next sprint",
    timestamp: "2026-03-07T14:11:40Z",
  },
  {
    id: "evt-17",
    type: "sanity_failed",
    taskId: 12,
    title: "Sanity check flagged",
    detail: "TASK-12 plan needs revision — missing test coverage details",
    timestamp: "2026-03-07T14:12:20Z",
  },
  {
    id: "evt-18",
    type: "pr_created",
    taskId: 7,
    title: "Pull request created",
    detail: "PR #52 opened for TASK-7 (hackai-TASK-7)",
    timestamp: "2026-03-07T14:14:10Z",
  },
]

export const mockStats: PipelineStats = {
  totalTasks: 13,
  plansGenerated: 7,
  prsOpened: 2,
  issuesCancelled: 2,
  tasksByStatus: {
    draft: 3,
    planning: 2,
    planned: 2,
    implementing: 2,
    "pr-open": 2,
    cancelled: 2,
  },
  isRunning: true,
  lastCycleTime: "2026-03-07T14:14:30Z",
  cycleCount: 47,
}

// PR-specific data for the PRs page
export interface PullRequest {
  id: number
  taskId: number
  title: string
  branch: string
  status: "open" | "merged" | "closed"
  issueNumber: number
  createdAt: string
  additions: number
  deletions: number
}

export const mockPRs: PullRequest[] = [
  {
    id: 46,
    taskId: 1,
    title: "TASK-1: Fix Google OAuth redirect URI in production",
    branch: "hackai-TASK-1",
    status: "open",
    issueNumber: 42,
    createdAt: "2026-03-07T14:09:00Z",
    additions: 24,
    deletions: 8,
  },
  {
    id: 52,
    taskId: 7,
    title: "TASK-7: Migrate cron jobs to BullMQ",
    branch: "hackai-TASK-7",
    status: "open",
    issueNumber: 49,
    createdAt: "2026-03-07T14:14:10Z",
    additions: 187,
    deletions: 93,
  },
]

// Helpers
export const PHASE_ORDER: TaskStatus[] = [
  "draft",
  "planning",
  "planned",
  "implementing",
  "pr-open",
  "cancelled",
]

export const PHASE_LABELS: Record<TaskStatus, string> = {
  draft: "Draft",
  planning: "Planning",
  planned: "Planned",
  implementing: "Implementing",
  "pr-open": "PR Open",
  cancelled: "Cancelled",
}

export function getTasksByStatus(status: TaskStatus): PipelineTask[] {
  return mockTasks.filter((t) => t.status === status)
}
