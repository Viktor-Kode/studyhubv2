import { NextRequest } from 'next/server'

const BACKEND_BASE = process.env.BACKEND_API_URL || 'https://studyhelp-zyqw.onrender.com/api'

async function forward(req: NextRequest, params: { path?: string[] }) {
  const path = params.path?.join('/') || ''
  const url = `${BACKEND_BASE}/${path}`

  const headers: Record<string, string> = {
    'content-type': req.headers.get('content-type') || 'application/json',
    'accept': req.headers.get('accept') || 'application/json',
    // Forward auth header if present
  }
  const auth = req.headers.get('authorization')
  if (auth) headers['authorization'] = auth

  const init: RequestInit = {
    method: req.method,
    headers,
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : await req.text(),
    // Do not forward cookies cross-origin; backend does not require them for auth
    redirect: 'manual',
    cache: 'no-store'
  }

  const resp = await fetch(url, init)
  const contentType = resp.headers.get('content-type') || ''

  // Stream through response preserving status and JSON/text
  if (contentType.includes('application/json')) {
    const data = await resp.json()
    return new Response(JSON.stringify(data), {
      status: resp.status,
      headers: { 'content-type': 'application/json' }
    })
  }
  const text = await resp.text()
  return new Response(text, { status: resp.status })
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

