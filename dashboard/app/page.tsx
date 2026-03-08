"use client"

import { useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { CheckSquare, FileText, GitPullRequest, XCircle, Mic, FileText as TranscriptIcon } from "lucide-react"
import { PHASE_ORDER, PHASE_LABELS } from "@/lib/mock-data"
import type { TaskStatus } from "@/lib/mock-data"
import { usePipelineData } from "@/lib/use-pipeline"
import { useTranscriptStream } from "@/lib/use-transcript-stream"
import { StatCard } from "@/components/ui/stat-card"
import { PipelineStatusBar } from "@/components/pipeline/PipelineStatusBar"
import { ActivityFeed } from "@/components/pipeline/ActivityFeed"

const statusColors: Record<TaskStatus, { bg: string; text: string }> = {
  draft: { bg: "bg-zinc-500", text: "text-zinc-400" },
  planning: { bg: "bg-amber-500", text: "text-amber-400" },
  planned: { bg: "bg-blue-500", text: "text-blue-400" },
  implementing: { bg: "bg-purple-500", text: "text-purple-400" },
  "pr-open": { bg: "bg-emerald-500", text: "text-emerald-400" },
  cancelled: { bg: "bg-red-500", text: "text-red-400" },
}

export default function Dashboard() {
  const { stats, events, isLoading } = usePipelineData()
  const stream = useTranscriptStream()
  const liveScrollRef = useRef<HTMLDivElement>(null)
  const transcriptScrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll live terminal and transcript to bottom
  useEffect(() => {
    if (liveScrollRef.current) {
      liveScrollRef.current.scrollTop = liveScrollRef.current.scrollHeight
    }
  }, [stream.recentLines, stream.currentPartial])

  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight
    }
  }, [stream.transcript])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-500 text-sm">Loading pipeline data...</div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6 pb-8"
    >
      {/* Pipeline Status */}
      <PipelineStatusBar stats={stats} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tasks"
          value={stats.totalTasks}
          icon={CheckSquare}
          accentColor="blue"
        />
        <StatCard
          title="Plans Generated"
          value={stats.plansGenerated}
          icon={FileText}
          accentColor="amber"
        />
        <StatCard
          title="PRs Opened"
          value={stats.prsOpened}
          icon={GitPullRequest}
          accentColor="purple"
        />
        <StatCard
          title="Issues Cancelled"
          value={stats.issuesCancelled}
          icon={XCircle}
          accentColor="red"
        />
      </div>

      {/* Meeting Transcription */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Live Terminal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Mic className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-medium text-zinc-300">Live Transcription</h3>
            {stream.isConnected && (
              <span className="ml-auto flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${stream.currentPartial ? "bg-emerald-500 animate-pulse" : "bg-emerald-500/50"}`} />
                <span className="text-xs text-emerald-400">{stream.currentPartial ? "Listening" : "Connected"}</span>
              </span>
            )}
          </div>
          <div
            ref={liveScrollRef}
            className="h-[240px] overflow-y-auto font-mono text-xs leading-relaxed space-y-0.5 scrollbar-thin"
          >
            {stream.recentLines.length > 0 || stream.currentPartial ? (
              <>
                {stream.recentLines.map((line, i) => (
                  <div key={i} className="text-zinc-400">
                    {line}
                  </div>
                ))}
                {stream.currentPartial && (
                  <div className="text-emerald-400/70">
                    {stream.currentPartial}
                    <span className="animate-pulse">▊</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
                {stream.isConnected ? "Waiting for audio..." : "Connecting to transcriber..."}
              </div>
            )}
          </div>
        </motion.div>

        {/* Right: Final Transcript */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <TranscriptIcon className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-medium text-zinc-300">Meeting Transcript</h3>
            {stream.transcript.length > 0 && (
              <span className="ml-auto text-xs text-zinc-500">
                {stream.transcript.length} turns
              </span>
            )}
          </div>
          <div
            ref={transcriptScrollRef}
            className="h-[240px] overflow-y-auto space-y-2 scrollbar-thin"
          >
            {stream.transcript.length > 0 ? (
              stream.transcript.map((entry, i) => (
                <div key={i} className="text-sm">
                  <span className="font-semibold text-blue-400">
                    {entry.speaker === "A" ? "Anoop" : entry.speaker === "B" ? "Shiv" : entry.speaker === "C" ? "Nishil" : entry.speaker}
                  </span>
                  <span className="text-zinc-500 mx-1.5">·</span>
                  <span className="text-zinc-300">{entry.text}</span>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
                No transcript yet
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom Section: Status Breakdown + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5"
        >
          <h3 className="text-sm font-medium text-zinc-300 mb-4">
            Task Status Breakdown
          </h3>

          {/* Stacked bar — clip-path reveal animation */}
          {stats.totalTasks > 0 ? (
            <motion.div
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={{ clipPath: "inset(0 0% 0 0)" }}
              transition={{ delay: 0.3, duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
              className="h-9 rounded-xl overflow-hidden flex"
            >
              {PHASE_ORDER.map((status) => {
                const count = stats.tasksByStatus[status] || 0
                if (count === 0) return null
                const pct = (count / stats.totalTasks) * 100
                return (
                  <div
                    key={status}
                    style={{ width: `${pct}%` }}
                    className={`${statusColors[status].bg} flex items-center justify-center`}
                  >
                    {pct >= 10 && (
                      <span className="text-xs font-semibold text-white/90">
                        {count}
                      </span>
                    )}
                  </div>
                )
              })}
            </motion.div>
          ) : (
            <div className="h-9 rounded-xl bg-zinc-800 flex items-center justify-center">
              <span className="text-xs text-zinc-500">No tasks yet</span>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
            {PHASE_ORDER.map((status) => {
              const count = stats.tasksByStatus[status] || 0
              return (
                <div key={status} className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-sm ${statusColors[status].bg}`}
                  />
                  <span className="text-xs text-zinc-400">
                    {PHASE_LABELS[status]}{" "}
                    <span className={`font-medium ${statusColors[status].text}`}>
                      {count}
                    </span>
                  </span>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Live Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5"
        >
          <h3 className="text-sm font-medium text-zinc-300 mb-3">
            Live Activity Feed
          </h3>
          <div className="max-h-[340px] overflow-y-auto -mx-2 pr-1 scrollbar-thin">
            {events.length > 0 ? (
              <ActivityFeed events={events} limit={10} />
            ) : (
              <p className="text-sm text-zinc-500 text-center py-8">
                No pipeline activity yet. Start the orchestrator to see events.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
