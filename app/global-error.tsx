'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error('[Global Error Boundary]', error)

  return (
    <html>
      <body>
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
          <div style={{ maxWidth: 560, width: '100%', border: '1px solid #fecaca', background: '#fef2f2', borderRadius: 16, padding: 24, textAlign: 'center' }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#b91c1c', marginBottom: 8 }}>App crashed unexpectedly</h2>
            <p style={{ color: '#b91c1c', marginBottom: 16 }}>
              Please reload or try again. If the issue persists, contact support.
            </p>
            <button
              onClick={() => reset()}
              style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 600, cursor: 'pointer' }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
