"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { FiZap, FiEdit3 } from "react-icons/fi"

interface RetentionModeSwitcherProps {
  activeMode?: "flashcards" | "blind" | "standard"
  courseId?: string
  nodeId?: number | string
  onChangeMode?: (mode: "flashcards" | "blind") => void
  className?: string
  compact?: boolean
}

export default function RetentionModeSwitcher({
  activeMode = "flashcards",
  courseId = "csc202-queues-deques",
  nodeId = "4",
  onChangeMode,
  className = "",
  compact = false,
}: RetentionModeSwitcherProps) {
  const router = useRouter()

  const handleSelect = (mode: "flashcards" | "blind") => {
    if (onChangeMode) {
      onChangeMode(mode)
      return
    }

    const targetCourse = courseId || "csc202-queues-deques"
    const query = nodeId ? `?nodeId=${nodeId}&mode=${mode}` : `?mode=${mode}`
    router.push(`/vault/${targetCourse}${query}`)
  }

  return (
    <div
      className={`retention-mode-switcher-dock ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "#0c1322",
        border: "1px solid #1E293B",
        borderRadius: "999px",
        padding: "4px",
        gap: "4px",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
      }}
    >
      <button
        type="button"
        onClick={() => handleSelect("flashcards")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: compact ? "6px 14px" : "8px 18px",
          borderRadius: "999px",
          fontSize: compact ? "13px" : "14px",
          fontWeight: 800,
          fontFamily: "inherit",
          cursor: "pointer",
          border: "none",
          transition: "all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
          background: activeMode === "flashcards" ? "#059669" : "transparent",
          color: activeMode === "flashcards" ? "#FFFFFF" : "#94A3B8",
          boxShadow: activeMode === "flashcards" ? "0 2px 8px rgba(5, 150, 105, 0.4)" : "none",
        }}
      >
        <FiZap
          style={{
            fontSize: compact ? "15px" : "16px",
            color: activeMode === "flashcards" ? "#FFFFFF" : "#64748B",
          }}
        />
        <span>Flashcards</span>
      </button>

      <button
        type="button"
        onClick={() => handleSelect("blind")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: compact ? "6px 14px" : "8px 18px",
          borderRadius: "999px",
          fontSize: compact ? "13px" : "14px",
          fontWeight: 800,
          fontFamily: "inherit",
          cursor: "pointer",
          border: "none",
          transition: "all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
          background: activeMode === "blind" ? "#059669" : "transparent",
          color: activeMode === "blind" ? "#FFFFFF" : "#94A3B8",
          boxShadow: activeMode === "blind" ? "0 2px 8px rgba(5, 150, 105, 0.4)" : "none",
        }}
      >
        <FiEdit3
          style={{
            fontSize: compact ? "15px" : "16px",
            color: activeMode === "blind" ? "#FFFFFF" : "#64748B",
          }}
        />
        <span>Blind Summary</span>
      </button>
    </div>
  )
}
