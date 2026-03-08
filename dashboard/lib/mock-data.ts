// Types matching the actual Meet2Code pipeline data model

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

export interface PullRequest {
  id: number
  taskId: number | null
  title: string
  branch: string
  status: "open" | "merged" | "closed"
  issueNumber: number | null
  createdAt: string
  additions: number
  deletions: number
}

// Constants
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
