import { NextRequest } from 'next/server'
import { proxyBackend } from '@/lib/server/backend-proxy'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ path?: string[] }> }

async function forward(req: NextRequest, context: RouteContext) {
  const { path: subPath } = await context.params
  const sub = subPath?.join('/') || ''
  return proxyBackend(req, `users/${sub}`)
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

