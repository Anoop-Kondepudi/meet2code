"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Activity, Clock, Hash } from "lucide-react"
import type { PipelineStats } from "@/lib/mock-data"

export function PipelineStatusBar({ stats }: { stats: PipelineStats }) {
  const { isRunning, lastCycleTime, cycleCount } = stats
  const [timeAgo, setTimeAgo] = useState("—")

  useEffect(() => {
    if (!lastCycleTime) {
      setTimeAgo("—")
      return
    }
    const lastCycle = new Date(lastCycleTime).getTime()
    const update = () => {
      const secs = Math.floor((Date.now() - lastCycle) / 1000)
      setTimeAgo(secs < 60 ? `${secs}s ago` : `${Math.floor(secs / 60)}m ago`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [lastCycleTime])

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-6 rounded-xl border border-zinc-800 bg-zinc-900/80 px-5 py-3"
    >
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-3 w-3">
          {isRunning && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex h-3 w-3 rounded-full ${
              isRunning ? "bg-emerald-500" : "bg-zinc-500"
            }`}
          />
        </span>
        <span className="text-sm font-medium text-zinc-200">
          {isRunning ? "Pipeline Running" : "Pipeline Stopped"}
        </span>
      </div>

      <div className="h-4 w-px bg-zinc-700" />

      <div className="flex items-center gap-1.5 text-sm text-zinc-400">
        <Clock className="w-3.5 h-3.5" />
        <span>Last cycle: {timeAgo}</span>
      </div>

      <div className="h-4 w-px bg-zinc-700" />

      <div className="flex items-center gap-1.5 text-sm text-zinc-400">
        <Hash className="w-3.5 h-3.5" />
        <span>Cycle {cycleCount}</span>
      </div>

      <div className="h-4 w-px bg-zinc-700" />

      <div className="flex items-center gap-1.5 text-sm text-zinc-400">
        <Activity className="w-3.5 h-3.5" />
        <span>3s poll</span>
      </div>
    </motion.div>
  )
}
