import { NextRequest } from 'next/server'

/** Stay a few seconds under Vercel `maxDuration` so the route can return JSON instead of platform 502.
 *  Render free tier can take 30–60 s on a cold start, so the default must exceed that.
 */
function proxyTimeoutMs(pathAfterApi: string): number {
  const p = pathAfterApi.toLowerCase()
  if (p.startsWith('ai/') || p.includes('generate') || p.startsWith('pdf-cbt') || p.includes('library/documents') || p.includes('library/proxy-pdf')) {
    return 55_000
  }
  // Default: 50 s — gives Render's cold start enough time to respond while
  // staying safely under Vercel's 60 s maxDuration limit.
  return 50_000
}

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
    // Follow upstream redirects (e.g. Render host canonicalization) so
    // callers receive final JSON responses instead of raw 301 HTML/text.
    redirect: 'follow',
    cache: 'no-store',
  }

  const ms = proxyTimeoutMs(pathAfterApi)
  const runFetch = () => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), ms)
    return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeoutId))
  }

  let resp: Response
  try {
    resp = await runFetch()
  } catch (error) {
    const isAbort = (error as Error)?.name === 'AbortError'
    const retryableGet = req.method === 'GET' && !isAbort
    if (retryableGet) {
      try {
        await new Promise((r) => setTimeout(r, 800))
        resp = await runFetch()
      } catch (e2) {
        const isAbort2 = (e2 as Error)?.name === 'AbortError'
        return new Response(
          JSON.stringify({
            success: false,
            error: isAbort2 ? 'Backend request timed out' : 'Backend request failed',
          }),
          {
            status: isAbort2 ? 504 : 502,
            headers: { 'content-type': 'application/json' },
          },
        )
      }
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: isAbort ? 'Backend request timed out' : 'Backend request failed',
        }),
        {
          status: isAbort ? 504 : 502,
          headers: { 'content-type': 'application/json' },
        },
      )
    }
  }

  const contentType = resp.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const raw = await resp.text()
    try {
      const data = raw.length ? JSON.parse(raw) : null
      return new Response(JSON.stringify(data), {
        status: resp.status,
        headers: { 'content-type': 'application/json' },
      })
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Backend returned non-JSON response',
          status: resp.status,
          detail: raw.slice(0, 500),
        }),
        {
          status: resp.status >= 400 ? resp.status : 502,
          headers: { 'content-type': 'application/json' },
        },
      )
    }
  }

  // PDFs and other binaries must not go through .text() — that corrupts the body
  const isBinary =
    contentType.includes('application/pdf') ||
    contentType.includes('octet-stream') ||
    contentType.startsWith('image/') ||
    contentType.includes('application/zip')

  if (isBinary) {
    const buf = await resp.arrayBuffer()
    const outHeaders = new Headers()
    outHeaders.set('content-type', contentType)
    const cd = resp.headers.get('content-disposition')
    if (cd) outHeaders.set('content-disposition', cd)
    return new Response(buf, {
      status: resp.status,
      headers: outHeaders,
    })
  }

  const text = await resp.text()
  return new Response(text, { status: resp.status })
}
