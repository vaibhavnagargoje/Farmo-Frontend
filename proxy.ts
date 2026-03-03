import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/lib/auth"

// Define protected routes
const protectedRoutes = [
  "/profile",
  "/bookings",
  "/booking",
  "/partner",
  "/category",
]

// Define auth routes (should redirect to home if logged in)
const authRoutes = ["/auth"]

// Define public routes (no auth required)
const publicRoutes = [
  "/",
  "/search",
  "/categories",
  "/api",
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get tokens from cookies
  const accessToken = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value
  const userCookie = request.cookies.get("farmo_user")?.value

  const isAuthenticated = !!(accessToken || refreshToken)

  let isProfileIncomplete = false
  if (isAuthenticated) {
    if (userCookie) {
      try {
        const user = JSON.parse(decodeURIComponent(userCookie))
        // If user has no first_name, profile is incomplete
        if (!user.first_name) {
          isProfileIncomplete = true
        }
      } catch (e) {
        // Ignore parse errors
      }
    } else {
      // If authenticated but no user cookie, we can't verify profile status.
      // We could force them to /auth, but it might cause issues if they just logged in
      // and the cookie hasn't propagated. Let's just rely on the frontend check.
    }
  }

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  // Check if it's an auth route
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  // If profile is incomplete, force them to /auth
  if (isAuthenticated && isProfileIncomplete && !isAuthRoute && !pathname.startsWith("/api/")) {
    return NextResponse.redirect(new URL("/auth", request.url))
  }

  // Redirect to login if trying to access protected route without auth
  if (isProtectedRoute && !isAuthenticated) {
    const url = new URL("/auth", request.url)
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  // Redirect to home if trying to access auth route while logged in and profile is complete
  if (isAuthRoute && isAuthenticated && !isProfileIncomplete) {
    // Check if there's a redirect parameter
    const redirect = request.nextUrl.searchParams.get("redirect")
    const redirectUrl = redirect || "/"
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     * - API routes (handled separately)
     */
    "/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
