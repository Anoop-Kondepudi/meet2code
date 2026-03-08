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

interface PipelineStatus {
  isRunning: boolean
  lastCycleTime: string | null
  cycleCount: number
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
    prsOpened: prs.filter((p) => p.status === "open").length,
    issuesCancelled: tasksByStatus.cancelled,
    tasksByStatus,
    isRunning: status.isRunning,
    lastCycleTime: status.lastCycleTime || new Date().toISOString(),
    cycleCount: status.cycleCount,
  }
}

function deriveEvents(tasks: PipelineTask[]): PipelineEvent[] {
  const events: PipelineEvent[] = []

  for (const task of tasks) {
    // Every task was extracted
    events.push({
      id: `evt-extract-${task.id}`,
      type: "task_extracted",
      taskId: task.id,
      title: "Task extracted from meeting",
      detail: `TASK-${task.id}: ${task.title}`,
      timestamp: task.lastUpdated || new Date().toISOString(),
    })

    if (task.issueNumber) {
      events.push({
        id: `evt-issue-${task.id}`,
        type: "issue_created",
        taskId: task.id,
        title: "GitHub issue created",
        detail: `Issue #${task.issueNumber} created for TASK-${task.id}`,
        timestamp: task.lastUpdated || new Date().toISOString(),
      })
    }

    if (task.status === "planned" || task.status === "implementing" || task.status === "pr-open") {
      events.push({
        id: `evt-plan-${task.id}`,
        type: "plan_posted",
        taskId: task.id,
        title: "Plan generated",
        detail: `Implementation plan posted for TASK-${task.id}`,
        timestamp: task.lastUpdated || new Date().toISOString(),
      })
    }

    if (task.status === "implementing" || task.status === "pr-open") {
      events.push({
        id: `evt-sanity-${task.id}`,
        type: "sanity_passed",
        taskId: task.id,
        title: "Sanity check passed",
        detail: `TASK-${task.id} passed sanity check`,
        timestamp: task.lastUpdated || new Date().toISOString(),
      })
    }

    if (task.status === "pr-open" && task.prNumber) {
      events.push({
        id: `evt-pr-${task.id}`,
        type: "pr_created",
        taskId: task.id,
        title: "Pull request created",
        detail: `PR #${task.prNumber} opened for TASK-${task.id}`,
        timestamp: task.lastUpdated || new Date().toISOString(),
      })
    }

    if (task.status === "cancelled") {
      events.push({
        id: `evt-cancel-${task.id}`,
        type: "task_cancelled",
        taskId: task.id,
        title: "Task cancelled",
        detail: `TASK-${task.id}: ${task.title} — cancelled`,
        timestamp: task.lastUpdated || new Date().toISOString(),
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

  const fetchAll = useCallback(async () => {
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
    fetchAll()
    const id = setInterval(fetchAll, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [fetchAll])

  const stats = deriveStats(tasks, prs, status)
  const events = deriveEvents(tasks)

  return { tasks, prs, stats, events, status, isLoading }
}
