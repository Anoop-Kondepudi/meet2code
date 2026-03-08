import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const projectRoot = path.resolve(process.cwd(), "..")
    const liveStateFile = path.join(projectRoot, "data", "transcripts", "live_state.json")
    const transcriptFile = path.join(projectRoot, "data", "transcripts", "live_meeting.json")

    const result: {
      currentPartial: string
      recentLines: string[]
      transcript: { speaker: string; text: string; timestamp: string }[]
    } = {
      currentPartial: "",
      recentLines: [],
      transcript: [],
    }

    if (fs.existsSync(liveStateFile)) {
      const state = JSON.parse(fs.readFileSync(liveStateFile, "utf-8"))
      result.currentPartial = state.currentPartial || ""
      result.recentLines = state.recentLines || []
    }

    if (fs.existsSync(transcriptFile)) {
      result.transcript = JSON.parse(fs.readFileSync(transcriptFile, "utf-8"))
        .filter((c: { text: string }) => c.text !== "MEETING_ENDED")
    }

    return NextResponse.json(result)
  } catch (e) {
    console.error("Failed to read transcript:", e)
    return NextResponse.json({ currentPartial: "", recentLines: [], transcript: [] })
  }
}
