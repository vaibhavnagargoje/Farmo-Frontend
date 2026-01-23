import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { API_ENDPOINTS, fetchWithAuth } from "@/lib/api"
import {
  AUTH_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  USER_COOKIE_NAME,
  isTokenExpired,
  setAuthCookies,
} from "@/lib/auth"

// GET - Fetch current user profile
export async function GET() {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(AUTH_COOKIE_NAME)?.value
    const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value

    if (!accessToken) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      )
    }

    let token = accessToken

    // If access token is expired, try to refresh
    if (isTokenExpired(accessToken) && refreshToken) {
      const refreshResponse = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/users/auth/token/refresh/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: refreshToken }),
        }
      )

      if (refreshResponse.ok) {
        const data = await refreshResponse.json()
        token = data.access

        // Update the access token cookie
        cookieStore.set(AUTH_COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60, // 1 hour
        })
      } else {
        return NextResponse.json(
          { message: "Session expired, please login again" },
          { status: 401 }
        )
      }
    }

    // Fetch user profile from Django
    const response = await fetchWithAuth(API_ENDPOINTS.PARTNER_PROFILE, token)

    if (!response.ok) {
      // If partner profile doesn't exist, just return basic user info from cookie
      if (response.status === 404) {
        const userCookie = cookieStore.get(USER_COOKIE_NAME)?.value
        if (userCookie) {
          return NextResponse.json({
            user: JSON.parse(userCookie),
            partner: null,
          })
        }
      }

      const error = await response.json()
      return NextResponse.json(
        { message: error.detail || "Failed to fetch profile" },
        { status: response.status }
      )
    }

    const partnerData = await response.json()
    const userCookie = cookieStore.get(USER_COOKIE_NAME)?.value
    const user = userCookie ? JSON.parse(userCookie) : null

    return NextResponse.json({
      user,
      partner: partnerData,
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json(
      { message: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}

// PATCH - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(AUTH_COOKIE_NAME)?.value
    const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value

    if (!accessToken) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      )
    }

    let token = accessToken

    // If access token is expired, try to refresh
    if (isTokenExpired(accessToken) && refreshToken) {
      const refreshResponse = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/users/auth/token/refresh/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: refreshToken }),
        }
      )

      if (refreshResponse.ok) {
        const data = await refreshResponse.json()
        token = data.access

        cookieStore.set(AUTH_COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60,
        })
      } else {
        return NextResponse.json(
          { message: "Session expired, please login again" },
          { status: 401 }
        )
      }
    }

    const body = await request.json()

    // Update partner profile
    const response = await fetchWithAuth(API_ENDPOINTS.PARTNER_PROFILE, token, {
      method: "PATCH",
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { message: error.detail || "Failed to update profile", errors: error },
        { status: response.status }
      )
    }

    const updatedProfile = await response.json()

    // Update the user cookie if name changed
    if (body.first_name || body.last_name) {
      const userCookie = cookieStore.get(USER_COOKIE_NAME)?.value
      if (userCookie) {
        const user = JSON.parse(userCookie)
        const updatedUser = {
          ...user,
          first_name: body.first_name || user.first_name,
          last_name: body.last_name || user.last_name,
        }
        cookieStore.set(USER_COOKIE_NAME, JSON.stringify(updatedUser), {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 7 * 24 * 60 * 60,
        })
      }
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      partner: updatedProfile,
    })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 }
    )
  }
}
