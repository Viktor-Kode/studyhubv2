/* Simple redirect page for email CTA links pointing to /upgrade.
   Shows a quick spinner then sends the user to the homepage pricing section. */
'use client'

import { useEffect } from 'react'

export default function UpgradeRedirectPage() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = '/#pricing'
    }, 400)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif',
        background: '#F7F8FA',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          border: '3px solid #E8EAED',
          borderTop: '3px solid #5B4CF5',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p style={{ color: '#64748B', fontSize: 14, margin: 0 }}>
        Taking you to our plans...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

