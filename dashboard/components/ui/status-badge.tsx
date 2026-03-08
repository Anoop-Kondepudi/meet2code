"use client"

import { cn } from "@/lib/utils"
import type { TaskStatus } from "@/lib/mock-data"

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
  },
  planning: {
    label: "Planning",
    className: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  planned: {
    label: "Planned",
    className: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
  implementing: {
    label: "Implementing",
    className: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
  "pr-open": {
    label: "PR Open",
    className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-500/20 text-red-300 border-red-500/30",
  },
}

export function StatusBadge({
  status,
  className,
}: {
  status: TaskStatus
  className?: string
}) {
  const config = statusConfig[status]
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
