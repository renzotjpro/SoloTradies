import { createClient } from '@/lib/supabase/client'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

/**
 * Authenticated fetch wrapper that automatically attaches the Supabase
 * session JWT to every request as a Bearer token.
 *
 * Usage: drop-in replacement for fetch() when calling the backend API.
 *   const res = await authFetch("/clients")
 *   const res = await authFetch("/invoices", { method: "POST", body: JSON.stringify(data) })
 */
export async function authFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const headers = new Headers(init?.headers)

  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }

  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json')
  }

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`

  return fetch(url, {
    ...init,
    headers,
  })
}
