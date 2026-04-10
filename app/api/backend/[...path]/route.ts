import { NextRequest } from 'next/server'
import { proxyBackend } from '@/lib/server/backend-proxy'

export const dynamic = 'force-dynamic'

type RouteParams = { path?: string[] }
type RouteContext = { params: Promise<RouteParams> | RouteParams }

async function forward(req: NextRequest, context: RouteContext) {
  // Next.js 16 can provide `params` as a Promise in route handlers.
  const resolvedParams = await context.params
  const path = resolvedParams.path?.join('/') || ''
  return proxyBackend(req, path)
}

export async function GET(req: NextRequest, context: RouteContext) {
  return forward(req, context)
}
export async function POST(req: NextRequest, context: RouteContext) {
  return forward(req, context)
}
export async function PUT(req: NextRequest, context: RouteContext) {
  return forward(req, context)
}
export async function PATCH(req: NextRequest, context: RouteContext) {
  return forward(req, context)
}
export async function DELETE(req: NextRequest, context: RouteContext) {
  return forward(req, context)
}

