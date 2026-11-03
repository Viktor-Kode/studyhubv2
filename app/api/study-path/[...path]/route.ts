import { NextRequest } from 'next/server'
import { proxyBackend } from '@/lib/server/backend-proxy'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

type RouteParams = { path?: string[] }
type RouteContext = { params: Promise<RouteParams> | RouteParams }

async function forward(req: NextRequest, context: RouteContext) {
  const resolved = await context.params
  const sub = resolved.path?.join('/') || ''
  const path = sub ? `study-path/${sub}` : 'study-path'
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

export async function DELETE(req: NextRequest, context: RouteContext) {
  return forward(req, context)
}
