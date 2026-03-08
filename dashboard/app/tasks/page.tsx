"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { mockTasks, type TaskStatus, type TaskLabel, type PipelineTask, PHASE_ORDER, PHASE_LABELS } from "@/lib/mock-data"
import { StatusBadge } from "@/components/ui/status-badge"
import { LabelBadge } from "@/components/ui/label-badge"

const LABEL_OPTIONS: { value: TaskLabel | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature" },
  { value: "refactor", label: "Refactor" },
  { value: "improvement", label: "Improvement" },
]

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
}

export default function TasksPage() {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all")
  const [labelFilter, setLabelFilter] = useState<TaskLabel | "all">("all")
  const [selectedTask, setSelectedTask] = useState<PipelineTask | null>(null)

  const filtered = mockTasks.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false
    if (labelFilter !== "all" && t.label !== labelFilter) return false
    return true
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            statusFilter === "all"
              ? "bg-zinc-100/10 border-zinc-600 text-zinc-100"
              : "border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
          }`}
        >
          All
        </button>
        {PHASE_ORDER.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              statusFilter === s
                ? "bg-zinc-100/10 border-zinc-600 text-zinc-100"
                : "border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
            }`}
          >
            {PHASE_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Label filter */}
      <div className="flex flex-wrap gap-2">
        {LABEL_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setLabelFilter(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              labelFilter === opt.value
                ? "bg-zinc-100/10 border-zinc-600 text-zinc-100"
                : "border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3 text-left font-semibold">ID</th>
              <th className="px-4 py-3 text-left font-semibold">Title</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Label</th>
              <th className="px-4 py-3 text-left font-semibold">Issue</th>
              <th className="px-4 py-3 text-left font-semibold">PR</th>
              <th className="px-4 py-3 text-left font-semibold">Updated</th>
              <th className="px-4 py-3 text-right font-semibold">Cycles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {filtered.map((task) => (
              <tr
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="cursor-pointer bg-zinc-900/40 transition-colors hover:bg-zinc-800/60"
              >
                <td className="px-4 py-3 font-mono text-zinc-400 whitespace-nowrap">
                  TASK-{task.id}
                </td>
                <td className="px-4 py-3 text-zinc-100 font-medium max-w-xs truncate">
                  {task.title}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={task.status} />
                </td>
                <td className="px-4 py-3">
                  <LabelBadge label={task.label} />
                </td>
                <td className="px-4 py-3 font-mono text-zinc-400">
                  {task.issueNumber ? `#${task.issueNumber}` : "\u2014"}
                </td>
                <td className="px-4 py-3 font-mono text-zinc-400">
                  {task.prNumber ? `#${task.prNumber}` : "\u2014"}
                </td>
                <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                  {formatTime(task.lastUpdated)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-400">
                  {task.unchangedCycles}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-zinc-500">
                  No tasks match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div
            key={selectedTask.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-mono text-zinc-500">TASK-{selectedTask.id}</p>
                  <h2 className="text-lg font-semibold text-zinc-100">
                    {selectedTask.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={selectedTask.status} />
                    <LabelBadge label={selectedTask.label} />
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-zinc-300 leading-relaxed">
                {selectedTask.description}
              </p>

              {/* Source quote */}
              <div className="border-l-2 border-zinc-700 pl-4">
                <p className="text-sm italic text-zinc-400">
                  {selectedTask.source}
                </p>
              </div>

              {/* Metadata row */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-500 pt-2 border-t border-zinc-800">
                {selectedTask.issueNumber && (
                  <span>Issue <span className="font-mono text-zinc-400">#{selectedTask.issueNumber}</span></span>
                )}
                {selectedTask.prNumber && (
                  <span>PR <span className="font-mono text-zinc-400">#{selectedTask.prNumber}</span></span>
                )}
                <span>Last updated <span className="text-zinc-400">{formatTime(selectedTask.lastUpdated)}</span></span>
                <span>Unchanged cycles <span className="font-mono text-zinc-400">{selectedTask.unchangedCycles}</span></span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
