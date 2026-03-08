"use client"

import { motion } from "framer-motion"
import {
  FileText,
  GitPullRequest,
  AlertCircle,
  CheckCircle2,
  XCircle,
  CircleDot,
  ShieldCheck,
} from "lucide-react"
import type { PipelineEvent, EventType } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const eventConfig: Record<
  EventType,
  { icon: React.ElementType; color: string; iconBg: string }
> = {
  task_extracted: {
    icon: FileText,
    color: "text-blue-400",
    iconBg: "bg-blue-500/15",
  },
  issue_created: {
    icon: CircleDot,
    color: "text-emerald-400",
    iconBg: "bg-emerald-500/15",
  },
  plan_posted: {
    icon: CheckCircle2,
    color: "text-amber-400",
    iconBg: "bg-amber-500/15",
  },
  sanity_passed: {
    icon: ShieldCheck,
    color: "text-emerald-400",
    iconBg: "bg-emerald-500/15",
  },
  sanity_failed: {
    icon: AlertCircle,
    color: "text-red-400",
    iconBg: "bg-red-500/15",
  },
  pr_created: {
    icon: GitPullRequest,
    color: "text-purple-400",
    iconBg: "bg-purple-500/15",
  },
  task_cancelled: {
    icon: XCircle,
    color: "text-zinc-400",
    iconBg: "bg-zinc-500/15",
  },
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

export function ActivityFeed({ events, limit }: { events: PipelineEvent[]; limit?: number }) {
  const displayed = limit ? events.slice(0, limit) : events

  return (
    <div className="space-y-1">
      {displayed.map((event, i) => {
        const config = eventConfig[event.type]
        const Icon = config.icon
        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800/40 transition-colors"
          >
            <div className={cn("p-1.5 rounded-md mt-0.5 shrink-0", config.iconBg)}>
              <Icon className={cn("w-3.5 h-3.5", config.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-200 leading-snug truncate">
                {event.detail}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">{event.title}</p>
            </div>
            <span className="text-xs text-zinc-500 tabular-nums shrink-0 mt-0.5">
              {formatTime(event.timestamp)}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}
