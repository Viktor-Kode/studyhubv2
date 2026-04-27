import { NextRequest } from 'next/server'
import { proxyBackend } from '@/lib/server/backend-proxy'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> | { id: string } }

/**
 * Returns the direct Cloudinary URL for a document.
 * The frontend can use this URL to load a PDF directly — no file streaming through the backend.
 * This permanently fixes 502 errors caused by Render's free-tier sleeping.
 */
export async function GET(req: NextRequest, context: RouteContext) {
  const resolvedParams = await context.params
  const id = resolvedParams.id || ''
  return proxyBackend(req, `library/documents/${id}/url`)
}
