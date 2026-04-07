import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()
  const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL || 'http://localhost:3000'

  // If not authenticated, redirect to landing sign-in
  if (!userId) {
    return NextResponse.redirect(`${LANDING_URL}/sign-in?redirect_url=${encodeURIComponent(req.url)}`)
  }

  // Get user role from session claims (unsafeMetadata)
  const metadata = sessionClaims?.unsafeMetadata as { role?: string } | undefined
  const role = metadata?.role

  // If no role set, redirect to onboarding
  if (!role) {
    return NextResponse.redirect(`${LANDING_URL}/onboarding`)
  }

  // Only allow restaurant_admin and manager roles
  if (!['restaurant_admin', 'manager'].includes(role)) {
    return NextResponse.redirect(`${LANDING_URL}?error=unauthorized`)
  }

  // Check for admin-only routes
  const { pathname } = req.nextUrl
  const adminOnlyRoutes = ['/settings', '/staff', '/subscription']
  const isAdminRoute = adminOnlyRoutes.some(route => pathname.includes(route))

  if (isAdminRoute && role !== 'restaurant_admin') {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Allow the request
  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}