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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // --- Site Access Protection ---
  const SITE_ACCESS_PASSWORD = process.env.SITE_ACCESS_PASSWORD || "farmo2026"
  const siteAccessCookie = request.cookies.get("site_access_token")?.value

  if (pathname === "/site-access-login" && request.method === "POST") {
    try {
      const formData = await request.formData();
      const code = formData.get("code");

      if (code === SITE_ACCESS_PASSWORD) {
        const response = NextResponse.redirect(new URL("/", request.url));
        // Set cookie for 24 hours
        response.cookies.set("site_access_token", "granted", {
          maxAge: 60 * 60 * 24, // 24 hours
          httpOnly: true,
          path: "/",
        });
        return response;
      } else {
        // Redirect back with error
        return NextResponse.redirect(new URL("/?error=wrong_code", request.url));
      }
    } catch (e) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // If not authenticated for the site, show the overlay form
  if (siteAccessCookie !== "granted" && !pathname.startsWith("/_next") && !pathname.startsWith("/api")) {
    const errorParam = request.nextUrl.searchParams.get("error");
    const errorMsg = errorParam === "wrong_code" ? "<p style='color:red;'>Incorrect access code.</p>" : "";

    // Return simple HTML form
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Site Access</title>
        <meta name="viewport" content="width=device-width, initial-width=1" />
        <style>
          body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f3f4f6; }
          .container { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
          input { padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 1rem; width: 100%; box-sizing: border-box; }
          button { padding: 0.5rem 1rem; background-color: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%; }
          button:hover { background-color: #059669; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Site Under Development</h2>
          <p>Please enter the access code.</p>
          ${errorMsg}
          <form method="POST" action="/site-access-login">
            <input type="password" name="code" placeholder="Access Code" required autofocus />
            <button type="submit">Enter</button>
          </form>
        </div>
      </body>
      </html>
      `,
      {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }
    );
  }

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
        // If user has no full_name, profile is incomplete
        if (!user.full_name) {
          isProfileIncomplete = true
        }
      } catch (e) {
        // Ignore parse errors
      }
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
