'use client'

import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { WifiOff } from 'lucide-react'

/**
 * Fixed banner when the device is offline so users know sync and API calls are unavailable.
 */
export default function OfflineBanner() {
  const online = useOnlineStatus()

  if (online) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[9998] flex items-center justify-center gap-2 px-4 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] text-sm font-medium text-white shadow-md"
      style={{
        background: 'linear-gradient(90deg, #4338ca 0%, #5b4cf5 50%, #6366f1 100%)',
      }}
    >
      <WifiOff className="h-4 w-4 shrink-0 opacity-95" aria-hidden />
      <span>You’re offline. Saved work on this device may still be available; reconnect to sync.</span>
    </div>
  )
}
