import { NextRequest } from 'next/server'
import { proxyBackend } from '@/lib/server/backend-proxy'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Allow up to 60 s for cold-start + PDF fetch from Cloudinary
export const maxDuration = 60

type RouteContext = { params: Promise<{ id: string }> | { id: string } }

/**
 * PDF proxy: forward to the Express backend's /api/library/proxy-pdf/:id endpoint.
 * The backend handles auth (protect middleware), MongoDB lookup, and Cloudinary fetching.
 * Using the backend proxy avoids duplicating Firebase Admin + MongoDB logic here,
 * which was the source of persistent 500 errors.
 */
export async function GET(req: NextRequest, context: RouteContext) {
  const resolvedParams = await context.params
  const id = resolvedParams.id || ''
  return proxyBackend(req, `library/proxy-pdf/${id}`)
}

