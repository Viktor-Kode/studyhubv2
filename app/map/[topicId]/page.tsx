'use client'

import { useEffect, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'

function RootMapRedirectContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const topicId = (params?.topicId as string) || 'csc202-queues-deques'
    const query = searchParams.toString()
    router.replace(`/dashboard/student/map/${topicId}${query ? `?${query}` : ''}`)
  }, [params, router, searchParams])

  return null
}

export default function RootMapRedirect() {
  return (
    <Suspense fallback={null}>
      <RootMapRedirectContent />
    </Suspense>
  )
}
