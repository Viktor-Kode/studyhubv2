'use client'

import { useCallback, useRef, useState } from 'react'

type ToastState = {
  id: number
  message: string
}

export function useToast(timeoutMs = 2000) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timerRef = useRef<number | null>(null)

  const showToast = useCallback(
    (message: string) => {
      const id = Date.now()
      setToast({ id, message })

      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => {
        setToast((t) => (t?.id === id ? null : t))
      }, timeoutMs)
    },
    [timeoutMs],
  )

  return { toast, showToast }
}

