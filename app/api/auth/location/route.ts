import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { API_ENDPOINTS, fetchWithAuth } from "@/lib/api"
import {
  AUTH_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  isTokenExpired,
} from "@/lib/auth"

/**
 * Helper: get a valid access token, refreshing if needed.
 * Returns the token string or a NextResponse error.
 */
async function getValidToken(): Promise<string | NextResponse> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(AUTH_COOKIE_NAME)?.value
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value

  if (!accessToken) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
  }

  let token = accessToken

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

  return token
}

// GET - Get user's saved location from profile
export async function GET() {
  try {
    const tokenOrError = await getValidToken()
    if (tokenOrError instanceof NextResponse) return tokenOrError

    const response = await fetchWithAuth(API_ENDPOINTS.USER_LOCATION, tokenOrError, {
      method: "GET",
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { message: error.detail || "Failed to get location" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Location fetch error:", error)
    return NextResponse.json(
      { message: "Failed to fetch location" },
      { status: 500 }
    )
  }
}

// POST - Update user location
export async function POST(request: NextRequest) {
  try {
    const tokenOrError = await getValidToken()
    if (tokenOrError instanceof NextResponse) return tokenOrError

    const body = await request.json()
    const { latitude, longitude, address } = body

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { message: "Latitude and longitude are required" },
        { status: 400 }
      )
    }

    const response = await fetchWithAuth(API_ENDPOINTS.USER_LOCATION, tokenOrError, {
      method: "POST",
      body: JSON.stringify({ latitude, longitude, address: address || "" }),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { message: error.detail || "Failed to update location" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Location update error:", error)
    return NextResponse.json(
      { message: "Failed to update location" },
      { status: 500 }
    )
  }
}
