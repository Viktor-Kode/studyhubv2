import { NextRequest } from 'next/server'
import { proxyBackend } from '@/lib/server/backend-proxy'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ path?: string[] }> }

export async function GET(req: NextRequest, context: RouteContext) {
  const { path: subPath } = await context.params
  const sub = subPath?.join('/') || ''
  return proxyBackend(req, `slides/${sub}`)
}

