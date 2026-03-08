"use client"

import { useState, useEffect, useRef } from "react"

interface TranscriptEntry {
  speaker: string
  text: string
}

interface TranscriptStream {
  recentLines: string[]
  currentPartial: string
  transcript: TranscriptEntry[]
  isConnected: boolean
}

export function useTranscriptStream(): TranscriptStream {
  const [recentLines, setRecentLines] = useState<string[]>([])
  const [currentPartial, setCurrentPartial] = useState("")
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>

    function connect() {
      const ws = new WebSocket("ws://localhost:3002")
      wsRef.current = ws

      ws.onopen = () => setIsConnected(true)

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === "partial") {
          setCurrentPartial(`[${data.speaker}] ${data.text}`)
        } else if (data.type === "final") {
          setRecentLines((prev) => [...prev.slice(-50), `[${data.speaker}] ${data.text}`])
          setCurrentPartial("")
          setTranscript((prev) => [...prev, { speaker: data.speaker, text: data.text }])
        }
      }

      ws.onclose = () => {
        setIsConnected(false)
        // Reconnect after 2s
        reconnectTimer = setTimeout(connect, 2000)
      }

      ws.onerror = () => ws.close()
    }

    connect()

    return () => {
      clearTimeout(reconnectTimer)
      wsRef.current?.close()
    }
  }, [])

  return { recentLines, currentPartial, transcript, isConnected }
}
