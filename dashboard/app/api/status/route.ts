import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const projectRoot = path.resolve(process.cwd(), "..")
    const statusFile = path.join(projectRoot, "data", "pipeline-status.json")

    if (!fs.existsSync(statusFile)) {
      return NextResponse.json({
        isRunning: false,
        lastCycleTime: null,
        cycleCount: 0,
      })
    }

    const content = fs.readFileSync(statusFile, "utf-8")
    const status = JSON.parse(content)

    // Consider pipeline "running" if last cycle was within 15 seconds
    if (status.lastCycleTime) {
      const elapsed = Date.now() - new Date(status.lastCycleTime).getTime()
      status.isRunning = elapsed < 15000
    }

    return NextResponse.json(status)
  } catch (e) {
    console.error("Failed to read pipeline status:", e)
    return NextResponse.json({
      isRunning: false,
      lastCycleTime: null,
      cycleCount: 0,
    })
  }
}
