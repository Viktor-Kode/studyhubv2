import { NextRequest } from 'next/server'
import { proxyBackend } from '@/lib/server/backend-proxy'

export const dynamic = 'force-dynamic'

/**
 * Explicit route so Vercel always resolves POST /api/backend/cbt/generate-topic-questions
 * (avoids rare catch-all / deployment edge cases).
 */
export async function POST(req: NextRequest) {
  return proxyBackend(req, 'cbt/generate-topic-questions')
}
