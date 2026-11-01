'use client'

import { useEffect, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'

function RootMapRedirectContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const topicId = params?.topicId as string
    const query = searchParams.toString()
    const dest = topicId
      ? `/dashboard/student/map/${topicId}${query ? `?${query}` : ''}`
      : '/dashboard/student'
    router.replace(dest)
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
