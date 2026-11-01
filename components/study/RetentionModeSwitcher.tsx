"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { FiZap, FiEdit3 } from "react-icons/fi"

interface RetentionModeSwitcherProps {
  activeMode?: "flashcards" | "blurting" | "standard"
  courseId?: string
  nodeId?: number | string
  onChangeMode?: (mode: "flashcards" | "blurting") => void
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

  const handleSelect = (mode: "flashcards" | "blurting") => {
    if (onChangeMode) {
      onChangeMode(mode)
      return
    }

    if (mode === "flashcards") {
      const targetCourse = courseId || "csc202-queues-deques"
      const query = nodeId ? `?nodeId=${nodeId}` : ""
      router.push(`/vault/${targetCourse}${query}`)
    } else {
      const targetNode = nodeId || "1"
      router.push(`/blurting/${targetNode}`)
    }
  }

  return (
    <div
      className={`retention-mode-switcher-dock ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "rgba(15, 23, 42, 0.85)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(148, 163, 184, 0.16)",
        borderRadius: "14px",
        padding: "4px",
        gap: "4px",
        boxShadow: "0 8px 24px -4px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
      }}
    >
      <button
        type="button"
        onClick={() => handleSelect("flashcards")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: compact ? "6px 12px" : "8px 18px",
          borderRadius: "10px",
          fontSize: compact ? "13px" : "14px",
          fontWeight: 700,
          fontFamily: "inherit",
          cursor: "pointer",
          border: "none",
          transition: "all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
          background:
            activeMode === "flashcards"
              ? "linear-gradient(135deg, #FFD23F 0%, #F59E0B 100%)"
              : "transparent",
          color: activeMode === "flashcards" ? "#0F172A" : "#94A3B8",
          boxShadow:
            activeMode === "flashcards"
              ? "0 4px 14px rgba(245, 158, 11, 0.35), 0 2px 0 #D97706"
              : "none",
        }}
        onMouseEnter={(e) => {
          if (activeMode !== "flashcards") {
            e.currentTarget.style.color = "#F1F5F9"
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"
          }
        }}
        onMouseLeave={(e) => {
          if (activeMode !== "flashcards") {
            e.currentTarget.style.color = "#94A3B8"
            e.currentTarget.style.background = "transparent"
          }
        }}
      >
        <FiZap
          style={{
            fontSize: compact ? "15px" : "16px",
            color: activeMode === "flashcards" ? "#0F172A" : "#FBBF24",
          }}
        />
        <span>Flashcards</span>
      </button>

      <button
        type="button"
        onClick={() => handleSelect("blurting")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: compact ? "6px 12px" : "8px 18px",
          borderRadius: "10px",
          fontSize: compact ? "13px" : "14px",
          fontWeight: 700,
          fontFamily: "inherit",
          cursor: "pointer",
          border: "none",
          transition: "all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
          background:
            activeMode === "blurting"
              ? "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)"
              : "transparent",
          color: activeMode === "blurting" ? "#FFFFFF" : "#94A3B8",
          boxShadow:
            activeMode === "blurting"
              ? "0 4px 14px rgba(139, 92, 246, 0.35), 0 2px 0 #5B21B6"
              : "none",
        }}
        onMouseEnter={(e) => {
          if (activeMode !== "blurting") {
            e.currentTarget.style.color = "#F1F5F9"
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"
          }
        }}
        onMouseLeave={(e) => {
          if (activeMode !== "blurting") {
            e.currentTarget.style.color = "#94A3B8"
            e.currentTarget.style.background = "transparent"
          }
        }}
      >
        <FiEdit3
          style={{
            fontSize: compact ? "15px" : "16px",
            color: activeMode === "blurting" ? "#FFFFFF" : "#A78BFA",
          }}
        />
        <span>Blurting Method</span>
      </button>
    </div>
  )
}
