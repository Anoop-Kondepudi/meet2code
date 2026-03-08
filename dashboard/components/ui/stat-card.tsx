"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

function useAnimatedCounter(target: number, duration = 1200) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (target === 0) return
    const start = performance.now()
    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return count
}

export function StatCard({
  title,
  value,
  icon: Icon,
  accentColor = "blue",
  className,
}: {
  title: string
  value: number
  icon: LucideIcon
  accentColor?: "blue" | "emerald" | "purple" | "red" | "amber"
  className?: string
}) {
  const animatedValue = useAnimatedCounter(value)

  const accentMap = {
    blue: "from-blue-500/20 to-blue-500/5 text-blue-400",
    emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-400",
    purple: "from-purple-500/20 to-purple-500/5 text-purple-400",
    red: "from-red-500/20 to-red-500/5 text-red-400",
    amber: "from-amber-500/20 to-amber-500/5 text-amber-400",
  }

  const iconBgMap = {
    blue: "bg-blue-500/15",
    emerald: "bg-emerald-500/15",
    purple: "bg-purple-500/15",
    red: "bg-red-500/15",
    amber: "bg-amber-500/15",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 p-5",
        className
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-50",
          accentMap[accentColor]
        )}
      />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400 font-medium">{title}</p>
          <p className="text-3xl font-bold text-zinc-100 mt-1 tabular-nums">
            {animatedValue}
          </p>
        </div>
        <div className={cn("p-2.5 rounded-lg", iconBgMap[accentColor])}>
          <Icon className={cn("w-5 h-5", accentMap[accentColor].split(" ").pop())} />
        </div>
      </div>
    </motion.div>
  )
}
