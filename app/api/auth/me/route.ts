import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import {
  AUTH_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  USER_COOKIE_NAME,
  cookieOptions,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
  isTokenExpired,
} from "@/lib/auth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"

export async function GET() {
  try {
    const cookieStore = await cookies()
    let accessToken = cookieStore.get(AUTH_COOKIE_NAME)?.value
    const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value
    const userCookie = cookieStore.get(USER_COOKIE_NAME)?.value

    // No tokens at all
    if (!accessToken && !refreshToken) {
      return NextResponse.json(
        { message: "Not authenticated", user: null },
        { status: 401 }
      )
    }

    // If access token is expired but we have refresh token, try to refresh
    if ((!accessToken || isTokenExpired(accessToken)) && refreshToken) {
      try {
        // Construct clean URL for refresh token endpoint
        // Assuming API_BASE_URL is like 'http://.../api/v1'
        // We need 'http://.../api/token/refresh/'
        const baseUrl = new URL(API_BASE_URL)
        const rootApiUrl = baseUrl.pathname.replace(/\/v1\/?$/, "") // Remove /v1 suffix
        const refreshUrl = `${baseUrl.origin}${rootApiUrl}/token/refresh/`

        console.log(`Refreshing token at: ${refreshUrl}`)

        const refreshResponse = await fetch(refreshUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh: refreshToken }),
        })

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          accessToken = refreshData.access

          // Update the access token cookie
          cookieStore.set(AUTH_COOKIE_NAME, accessToken!, {
            ...cookieOptions,
            maxAge: ACCESS_TOKEN_MAX_AGE,
          })
        } else {
          // Refresh failed, clear cookies and return unauthorized
          cookieStore.delete(AUTH_COOKIE_NAME)
          cookieStore.delete(REFRESH_COOKIE_NAME)
          cookieStore.delete(USER_COOKIE_NAME)

          return NextResponse.json(
            { message: "Session expired. Please login again.", user: null },
            { status: 401 }
          )
        }
      } catch (error) {
        console.error("Token refresh error:", error)
        return NextResponse.json(
          { message: "Session expired. Please login again.", user: null },
          { status: 401 }
        )
      }
    }

    // Still no valid access token
    if (!accessToken || isTokenExpired(accessToken)) {
      return NextResponse.json(
        { message: "Not authenticated", user: null },
        { status: 401 }
      )
    }

    // Parse user from cookie
    let user = null
    if (userCookie) {
      try {
        user = JSON.parse(userCookie)
      } catch {
        user = null
      }
    }

    return NextResponse.json({
      message: "Authenticated",
      user,
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json(
      { message: "Authentication check failed", user: null },
      { status: 500 }
    )
  }
}
