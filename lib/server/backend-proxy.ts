import { NextRequest } from 'next/server'

/**
 * Express mounts all JSON routes under `/api` (e.g. `/api/cbt/...`).
 * Vercel often sets BACKEND_API_URL to the bare Render host — append `/api` in that case.
 */
export function getBackendApiRoot(): string {
  const fallback = 'https://studyhelp-zyqw.onrender.com/api'
  const raw = process.env.BACKEND_API_URL?.trim()
  if (!raw) return fallback.replace(/\/+$/, '')
  const trimmed = raw.replace(/\/+$/, '')
  try {
    const u = new URL(trimmed)
    if (!u.pathname || u.pathname === '/') {
      return `${trimmed}/api`
    }
  } catch {
    return fallback.replace(/\/+$/, '')
  }
  return trimmed
}

/**
 * Forward to StudyHelp API: pathAfterApi is e.g. `cbt/questions` (no leading slash).
 */
export async function proxyBackend(req: NextRequest, pathAfterApi: string): Promise<Response> {
  const base = getBackendApiRoot()
  const query = req.nextUrl.searchParams.toString()
  const url = `${base}/${pathAfterApi}${query ? `?${query}` : ''}`

  const incomingContentType = req.headers.get('content-type')
  const headers: Record<string, string> = {
    accept: req.headers.get('accept') || 'application/json',
  }
  // Preserve multipart boundary and other charsets; only default for JSON-ish requests
  if (incomingContentType) {
    headers['content-type'] = incomingContentType
  } else if (!['GET', 'HEAD'].includes(req.method)) {
    headers['content-type'] = 'application/json'
  }
  const auth = req.headers.get('authorization')
  if (auth) headers.authorization = auth

  // Multipart and other binary bodies must not go through .text() — that corrupts uploads.
  let body: ArrayBuffer | undefined
  if (!['GET', 'HEAD'].includes(req.method)) {
    const buf = await req.arrayBuffer()
    body = buf.byteLength ? buf : undefined
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    body,
    redirect: 'manual',
    cache: 'no-store',
  }

  const resp = await fetch(url, init)
  const contentType = resp.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const data = await resp.json()
    return new Response(JSON.stringify(data), {
      status: resp.status,
      headers: { 'content-type': 'application/json' },
    })
  }
  const text = await resp.text()
  return new Response(text, { status: resp.status })
}
