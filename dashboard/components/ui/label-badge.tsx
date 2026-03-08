"use client"

import { cn } from "@/lib/utils"
import type { TaskLabel } from "@/lib/mock-data"

const labelConfig: Record<TaskLabel, { label: string; className: string }> = {
  bug: {
    label: "Bug",
    className: "bg-red-500/15 text-red-400 border-red-500/25",
  },
  feature: {
    label: "Feature",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  },
  refactor: {
    label: "Refactor",
    className: "bg-orange-500/15 text-orange-400 border-orange-500/25",
  },
  improvement: {
    label: "Improvement",
    className: "bg-teal-500/15 text-teal-400 border-teal-500/25",
  },
}

export function LabelBadge({
  label,
  className,
}: {
  label: TaskLabel
  className?: string
}) {
  const config = labelConfig[label]
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
