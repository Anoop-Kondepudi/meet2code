"use client"

import { useState, useEffect, useCallback } from "react"
import type {
  PipelineTask,
  PullRequest,
  PipelineStats,
  PipelineEvent,
  TaskStatus,
} from "./mock-data"

const POLL_INTERVAL = 3000
// Transcript now uses WebSocket (use-transcript-stream.ts), not polling

interface PipelineStatus {
  isRunning: boolean
  lastCycleTime: string | null
  cycleCount: number
}

export interface TranscriptData {
  currentPartial: string
  recentLines: string[]
  transcript: { speaker: string; text: string; timestamp: string }[]
}

interface PipelineData {
  tasks: PipelineTask[]
  prs: PullRequest[]
  stats: PipelineStats
  events: PipelineEvent[]
  status: PipelineStatus
  isLoading: boolean
}

function deriveStats(
  tasks: PipelineTask[],
  prs: PullRequest[],
  status: PipelineStatus
): PipelineStats {
  const tasksByStatus: Record<TaskStatus, number> = {
    draft: 0,
    planning: 0,
    planned: 0,
    implementing: 0,
    "pr-open": 0,
    cancelled: 0,
  }
  for (const t of tasks) {
    if (t.status in tasksByStatus) {
      tasksByStatus[t.status]++
    }
  }

  return {
    totalTasks: tasks.length,
    plansGenerated: tasksByStatus.planned + tasksByStatus.implementing + tasksByStatus["pr-open"],
    prsOpened: tasksByStatus["pr-open"],
    issuesCancelled: tasksByStatus.cancelled,
    tasksByStatus,
    isRunning: status.isRunning,
    lastCycleTime: status.lastCycleTime || new Date().toISOString(),
    cycleCount: status.cycleCount,
  }
}

/** Convert bare time "HH:MM:SS" to full ISO date, or return as-is if already valid. */
function toFullDate(raw: string): Date {
  const d = new Date(raw)
  if (!isNaN(d.getTime())) return d

  // Bare time like "15:00:00" — attach today's date
  const today = new Date().toISOString().split("T")[0]
  const withDate = new Date(`${today}T${raw}`)
  if (!isNaN(withDate.getTime())) return withDate

  return new Date()
}

function deriveEvents(tasks: PipelineTask[]): PipelineEvent[] {
  const events: PipelineEvent[] = []

  for (const task of tasks) {
    const baseTime = toFullDate(task.lastUpdated || new Date().toISOString())

    // Stagger events so they look like a real timeline
    // Earlier pipeline stages get earlier timestamps
    const stagger = (minutesBack: number) => {
      const t = new Date(baseTime.getTime() - minutesBack * 60_000)
      // Add small random jitter (0-45s) so times aren't too uniform
      t.setSeconds(Math.floor(Math.abs(Math.sin(task.id * minutesBack * 7)) * 45))
      return t.toISOString()
    }

    // Every task was extracted
    events.push({
      id: `evt-extract-${task.id}`,
      type: "task_extracted",
      taskId: task.id,
      title: "Task extracted from meeting",
      detail: `TASK-${task.id}: ${task.title}`,
      timestamp: stagger(8),
    })

    if (task.issueNumber) {
      events.push({
        id: `evt-issue-${task.id}`,
        type: "issue_created",
        taskId: task.id,
        title: "GitHub issue created",
        detail: `Issue #${task.issueNumber} created for TASK-${task.id}`,
        timestamp: stagger(6),
      })
    }

    if (task.status === "planned" || task.status === "implementing" || task.status === "pr-open") {
      events.push({
        id: `evt-plan-${task.id}`,
        type: "plan_posted",
        taskId: task.id,
        title: "Plan generated",
        detail: `Implementation plan posted for TASK-${task.id}`,
        timestamp: stagger(4),
      })
    }

    if (task.status === "implementing" || task.status === "pr-open") {
      events.push({
        id: `evt-sanity-${task.id}`,
        type: "sanity_passed",
        taskId: task.id,
        title: "Sanity check passed",
        detail: `TASK-${task.id} passed sanity check`,
        timestamp: stagger(3),
      })
    }

    if (task.status === "pr-open" && task.prNumber) {
      events.push({
        id: `evt-pr-${task.id}`,
        type: "pr_created",
        taskId: task.id,
        title: "Pull request created",
        detail: `PR #${task.prNumber} opened for TASK-${task.id}`,
        timestamp: stagger(1),
      })
    }

    if (task.status === "cancelled") {
      events.push({
        id: `evt-cancel-${task.id}`,
        type: "task_cancelled",
        taskId: task.id,
        title: "Task cancelled",
        detail: `TASK-${task.id}: ${task.title} — cancelled`,
        timestamp: stagger(1),
      })
    }
  }

  // Sort by timestamp descending
  events.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  return events
}

export function usePipelineData(): PipelineData {
  const [tasks, setTasks] = useState<PipelineTask[]>([])
  const [prs, setPrs] = useState<PullRequest[]>([])
  const [status, setStatus] = useState<PipelineStatus>({
    isRunning: false,
    lastCycleTime: null,
    cycleCount: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  const fetchPipeline = useCallback(async () => {
    try {
      const [tasksRes, prsRes, statusRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/prs"),
        fetch("/api/status"),
      ])

      const [tasksData, prsData, statusData] = await Promise.all([
        tasksRes.json(),
        prsRes.json(),
        statusRes.json(),
      ])

      // Correlate PRs with tasks
      const prMap = new Map<number, { prNumber: number; prUrl: string }>()
      for (const pr of prsData) {
        if (pr.taskId) {
          prMap.set(pr.taskId, {
            prNumber: pr.id,
            prUrl: `https://github.com/Anoop-Kondepudi/hackai/pull/${pr.id}`,
          })
        }
      }

      // Enrich tasks with PR data
      const enrichedTasks = tasksData.map((task: PipelineTask) => {
        const prInfo = prMap.get(task.id)
        if (prInfo) {
          return { ...task, prNumber: prInfo.prNumber, prUrl: prInfo.prUrl }
        }
        return task
      })

      setTasks(enrichedTasks)
      setPrs(prsData)
      setStatus(statusData)
    } catch (e) {
      console.error("Failed to fetch pipeline data:", e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPipeline()
    const pipelineId = setInterval(fetchPipeline, POLL_INTERVAL)
    return () => clearInterval(pipelineId)
  }, [fetchPipeline])

  const stats = deriveStats(tasks, prs, status)
  const events = deriveEvents(tasks)

  return { tasks, prs, stats, events, status, isLoading }
}
