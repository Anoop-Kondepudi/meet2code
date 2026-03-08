"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const pathname = usePathname();

  const getTitle = () => {
    if (pathname === "/") return "Dashboard Overview";
    if (pathname.startsWith("/pipeline")) return "Pipeline";
    if (pathname.startsWith("/tasks")) return "Tasks & Issues";
    if (pathname.startsWith("/prs")) return "Pull Requests";
    return "Overview";
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
      <h1 className="text-lg font-semibold text-zinc-100 tracking-tight">
        {getTitle()}
      </h1>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-zinc-950" />
          <Bell className="w-5 h-5 text-zinc-400" />
        </Button>
        <div className="h-8 w-px bg-zinc-800 mx-1" />
        <button className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-medium text-xs shadow-sm ring-2 ring-zinc-950 hover:ring-emerald-900 transition-all cursor-pointer">
          A
        </button>
      </div>
    </header>
  );
}
