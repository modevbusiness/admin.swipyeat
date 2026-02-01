import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request)

  const { pathname } = request.nextUrl

  // Redirect logged-in users away from auth pages
  if (pathname === '/login' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (pathname === '/') {
    const target = user ? '/dashboard' : '/login'
    const url = request.nextUrl.clone()
    url.pathname = target
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/dashboard') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && pathname.startsWith('/dashboard')) {
    let role = user.user_metadata?.role as string | undefined
    if (!role) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      role = userProfile?.role
    }

    const allowedRoles = ['manager', 'restaurant_admin']

    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const OnlyAdminRoutes = ['/settings', '/staff', '/subscription']
    const isRestrictedRoute = OnlyAdminRoutes.some(route => pathname.includes(route))

    if (isRestrictedRoute && !['restaurant_admin'].includes(role)) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/login',
    '/dashboard/:path*',
  ],
}