"use client"

import { motion } from "framer-motion"
import { GitPullRequest, GitMerge, XCircle, FileCode } from "lucide-react"
import { mockPRs, type PullRequest } from "@/lib/mock-data"
import { StatCard } from "@/components/ui/stat-card"

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

const openCount = mockPRs.filter((pr) => pr.status === "open").length
const mergedCount = mockPRs.filter((pr) => pr.status === "merged").length
const closedCount = mockPRs.filter((pr) => pr.status === "closed").length

const statusStyles: Record<PullRequest["status"], { icon: typeof GitPullRequest; border: string; iconBg: string; iconColor: string; badgeBg: string; badgeText: string; label: string }> = {
  open: {
    icon: GitPullRequest,
    border: "border-emerald-500/20",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    badgeBg: "bg-emerald-500/20",
    badgeText: "text-emerald-300",
    label: "Open",
  },
  merged: {
    icon: GitMerge,
    border: "border-purple-500/20",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
    badgeBg: "bg-purple-500/20",
    badgeText: "text-purple-300",
    label: "Merged",
  },
  closed: {
    icon: XCircle,
    border: "border-red-500/20",
    iconBg: "bg-red-500/10",
    iconColor: "text-red-400",
    badgeBg: "bg-red-500/20",
    badgeText: "text-red-300",
    label: "Closed",
  },
}

export default function PRsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Open PRs" value={openCount} icon={GitPullRequest} accentColor="emerald" />
        <StatCard title="Merged PRs" value={mergedCount} icon={GitMerge} accentColor="purple" />
        <StatCard title="Closed PRs" value={closedCount} icon={XCircle} accentColor="red" />
      </div>

      {/* PR cards */}
      <div className="space-y-4">
        {mockPRs.map((pr, i) => {
          const style = statusStyles[pr.status]
          const Icon = style.icon

          return (
            <motion.div
              key={pr.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
              className={`rounded-xl border bg-zinc-900/80 p-5 ${style.border}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Icon */}
                <div className={`p-2 rounded-lg shrink-0 ${style.iconBg}`}>
                  <Icon className={`w-5 h-5 ${style.iconColor}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-base font-semibold text-zinc-100 truncate">
                      {pr.title}
                    </h3>
                    <span className="font-mono text-sm text-zinc-500">#{pr.id}</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${style.badgeBg} ${style.badgeText} border-current/20`}
                    >
                      {style.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-zinc-400">
                    <span className="flex items-center gap-1.5 font-mono text-xs bg-zinc-800 px-2 py-0.5 rounded">
                      <FileCode className="w-3 h-3 shrink-0" />
                      {pr.branch}
                    </span>
                    <span>
                      Closes <span className="font-mono text-zinc-300">#{pr.issueNumber}</span>
                    </span>
                    <span>{formatDate(pr.createdAt)}</span>
                  </div>
                </div>

                {/* Diff stats */}
                <div className="flex items-center gap-3 shrink-0 font-mono text-sm">
                  <span className="text-emerald-400">+{pr.additions}</span>
                  <span className="text-red-400">-{pr.deletions}</span>
                </div>
              </div>
            </motion.div>
          )
        })}

        {mockPRs.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            No pull requests yet.
          </div>
        )}
      </div>
    </motion.div>
  )
}
