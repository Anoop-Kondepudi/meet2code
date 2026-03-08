import { NextResponse } from "next/server"
import { execSync } from "child_process"
import path from "path"

export const dynamic = "force-dynamic"

interface GhPR {
  number: number
  title: string
  headRefName: string
  state: "OPEN" | "MERGED" | "CLOSED"
  additions: number
  deletions: number
  createdAt: string
}

export async function GET() {
  try {
    const projectRoot = path.resolve(process.cwd(), "..")
    const result = execSync(
      `gh pr list --repo Anoop-Kondepudi/hackai --state all --json number,title,headRefName,state,additions,deletions,createdAt --limit 50`,
      { cwd: projectRoot, timeout: 10000, encoding: "utf-8" }
    )

    const ghPRs: GhPR[] = JSON.parse(result)

    const prs = ghPRs.map((pr) => {
      // Only correlate open PRs with tasks (ignore old closed/merged ones)
      const branchMatch = pr.state === "OPEN"
        ? pr.headRefName.match(/hackai-TASK-(\d+)/i)
        : null
      const titleMatch = pr.state === "OPEN"
        ? pr.title.match(/TASK-(\d+)/i)
        : null
      const taskId = branchMatch
        ? parseInt(branchMatch[1])
        : titleMatch
          ? parseInt(titleMatch[1])
          : null

      // Extract issue number from title if present (e.g., "Fix #42")
      const issueMatch = pr.title.match(/#(\d+)/)
      const issueNumber = issueMatch ? parseInt(issueMatch[1]) : null

      return {
        id: pr.number,
        taskId,
        title: pr.title,
        branch: pr.headRefName,
        status: pr.state.toLowerCase() as "open" | "merged" | "closed",
        issueNumber,
        createdAt: pr.createdAt,
        additions: pr.additions,
        deletions: pr.deletions,
      }
    })

    return NextResponse.json(prs)
  } catch (e) {
    console.error("Failed to fetch PRs:", e)
    return NextResponse.json([])
  }
}
