'use client'

import { useEffect, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'

function RootChallengeRedirectContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const topicId = params?.topicId as string
    const query = searchParams.toString()
    const dest = topicId
      ? `/dashboard/student/map/${topicId}/challenge${query ? `?${query}` : ''}`
      : '/dashboard/student'
    router.replace(dest)
  }, [params, router, searchParams])

  return null
}

export default function RootChallengeRedirect() {
  return (
    <Suspense fallback={null}>
      <RootChallengeRedirectContent />
    </Suspense>
  )
}

