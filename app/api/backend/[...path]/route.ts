import { NextRequest } from 'next/server'
import { proxyBackend } from '@/lib/server/backend-proxy'

export const dynamic = 'force-dynamic'

async function forward(req: NextRequest, params: { path?: string[] }) {
  const path = params.path?.join('/') || ''
  return proxyBackend(req, path)
}

export async function GET(req: NextRequest, { params }: { params: { path?: string[] } }) {
  return forward(req, params)
}
export async function POST(req: NextRequest, { params }: { params: { path?: string[] } }) {
  return forward(req, params)
}
export async function PUT(req: NextRequest, { params }: { params: { path?: string[] } }) {
  return forward(req, params)
}
export async function PATCH(req: NextRequest, { params }: { params: { path?: string[] } }) {
  return forward(req, params)
}
export async function DELETE(req: NextRequest, { params }: { params: { path?: string[] } }) {
  return forward(req, params)
}

