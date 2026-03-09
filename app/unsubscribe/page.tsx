'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function UnsubscribePage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (done) return
    if (!email) {
      window.location.href = '/unsubscribed?error=missing'
      return
    }
    setDone(true)
    fetch(`/api/backend/unsubscribe?email=${encodeURIComponent(email)}`, {
      headers: { Accept: 'application/json' },
    })
      .then((res) => res.json())
      .then(() => { window.location.href = '/unsubscribed' })
      .catch(() => { window.location.href = '/unsubscribed?error=1' })
  }, [email, done])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <p className="text-gray-500">Processing unsubscribe...</p>
    </div>
  )
}
