import { NextRequest } from 'next/server'
import { proxyBackend } from '@/lib/server/backend-proxy'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function GET(req: NextRequest) {
  return proxyBackend(req, 'generate-path')
}

export async function POST(req: NextRequest) {
  return proxyBackend(req, 'generate-path')
}
