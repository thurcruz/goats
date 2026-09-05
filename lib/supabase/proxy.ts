import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const publicPaths = new Set(['/', '/login', '/cadastro', '/recuperar-senha', '/nova-senha'])

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.next()
  let response = NextResponse.next({ request })
  const supabase = createServerClient(url, key, { cookies: {
    getAll: () => request.cookies.getAll(),
    setAll: (cookiesToSet) => {
      cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
      response = NextResponse.next({ request })
      cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
    },
  } })
  const { data, error } = await supabase.auth.getClaims()
  const authenticated = !error && Boolean(data?.claims?.sub)
  const pathname = request.nextUrl.pathname
  const isPublic = publicPaths.has(pathname) || pathname.startsWith('/auth/')
  if (!authenticated && !isPublic) {
    const loginUrl = request.nextUrl.clone(); loginUrl.pathname = '/login'; loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
    return copyCookies(response, NextResponse.redirect(loginUrl))
  }
  if (authenticated && (pathname === '/login' || pathname === '/cadastro')) {
    const dashboardUrl = request.nextUrl.clone(); dashboardUrl.pathname = '/hoje'; dashboardUrl.search = ''
    return copyCookies(response, NextResponse.redirect(dashboardUrl))
  }
  return response
}

function copyCookies(from: NextResponse, to: NextResponse) { from.cookies.getAll().forEach(cookie => to.cookies.set(cookie)); return to }
