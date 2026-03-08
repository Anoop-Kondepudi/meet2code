import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import type { TaskStatus, TaskLabel } from "@/lib/mock-data"

export const dynamic = "force-dynamic"

interface ParsedTask {
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

function parseTasks(mdContent: string): ParsedTask[] {
  const blocks = mdContent.split(/(?=^## TASK-\d+:)/m)
  const tasks: ParsedTask[] = []

  for (const block of blocks) {
    const trimmed = block.trim()
    if (!trimmed.startsWith("## TASK-")) continue

    const firstLine = trimmed.split("\n")[0]
    const headerMatch = firstLine.match(
      /^## TASK-(\d+):\s*(.+?)(?:\s*\[(DRAFT|CANCELLED|PLANNING|PLANNED|IMPLEMENTING|PR-OPEN)\])?\s*$/
    )
    if (!headerMatch) continue

    const taskId = parseInt(headerMatch[1])
    let title = headerMatch[2].trim()
    title = title.replace(/\s*\[(?:pending|open|draft)\]\s*/gi, "").trim()

    function getField(name: string): string {
      const match = trimmed.match(new RegExp(`^${name}:\\s*(.+)$`, "mi"))
      return match ? match[1].trim() : ""
    }

    const issueStr = getField("Issue")
    const issueNumber = issueStr.startsWith("#")
      ? parseInt(issueStr.slice(1))
      : null

    const cyclesStr = getField("Unchanged-Cycles")
    const unchangedCycles = /^\d+$/.test(cyclesStr) ? parseInt(cyclesStr) : 0

    const rawStatus = getField("Status").toLowerCase()
    const status = (
      ["draft", "planning", "planned", "implementing", "pr-open", "cancelled"].includes(rawStatus)
        ? rawStatus
        : "draft"
    ) as TaskStatus

    const rawLabel = getField("Label").toLowerCase()
    const label = (
      ["bug", "feature", "refactor", "improvement"].includes(rawLabel)
        ? rawLabel
        : "feature"
    ) as TaskLabel

    tasks.push({
      id: taskId,
      title,
      status,
      label,
      issueNumber,
      prNumber: null,
      prUrl: null,
      description: getField("Description"),
      source: getField("Source"),
      lastUpdated: getField("Last-Updated"),
      unchangedCycles,
    })
  }

  return tasks
}

export async function GET() {
  try {
    const projectRoot = path.resolve(process.cwd(), "..")
    const tasksFile = path.join(projectRoot, "data", "tasks", "tasks.md")

    if (!fs.existsSync(tasksFile)) {
      return NextResponse.json([])
    }

    const content = fs.readFileSync(tasksFile, "utf-8")
    const tasks = parseTasks(content)

    return NextResponse.json(tasks)
  } catch (e) {
    console.error("Failed to read tasks:", e)
    return NextResponse.json([])
  }
}
