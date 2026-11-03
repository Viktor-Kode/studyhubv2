import { NextRequest } from 'next/server'
import { proxyBackend } from '@/lib/server/backend-proxy'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ jobId: string }> }

export async function GET(req: NextRequest, context: RouteContext) {
  const { jobId } = await context.params
  return proxyBackend(req, `jobs/${encodeURIComponent(jobId)}`)
}
