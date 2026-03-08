"use client"

import { motion } from "framer-motion"
import { StatusBadge } from "@/components/ui/status-badge"
import { LabelBadge } from "@/components/ui/label-badge"
import type { PipelineTask } from "@/lib/mock-data"

export function TaskCard({
  task,
  onClick,
}: {
  task: PipelineTask
  onClick?: () => void
}) {
  return (
    <motion.div
      layout
      layoutId={`task-${task.id}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(16,185,129,0.08)" }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3.5 cursor-pointer hover:border-zinc-700 transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-mono text-zinc-500">TASK-{task.id}</span>
        {task.issueNumber && (
          <span className="text-xs text-zinc-500">#{task.issueNumber}</span>
        )}
      </div>
      <p className="text-sm font-medium text-zinc-200 leading-snug mb-3 line-clamp-2">
        {task.title}
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge status={task.status} />
        <LabelBadge label={task.label} />
        {task.prNumber && (
          <span className="text-xs text-emerald-400 font-mono">
            PR #{task.prNumber}
          </span>
        )}
      </div>
    </motion.div>
  )
}
