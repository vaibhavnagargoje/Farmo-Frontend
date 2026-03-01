import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { API_ENDPOINTS, fetchWithAuth } from "@/lib/api"
import {
  AUTH_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  isTokenExpired,
} from "@/lib/auth"

/**
 * GET /api/bookings/[bookingId]
 * Fetch booking details by booking_id
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(AUTH_COOKIE_NAME)?.value
    const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value

    if (!accessToken) {
      return NextResponse.json(
        { message: "Please login to view booking details" },
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

    // Fetch booking detail from Django API
    const response = await fetchWithAuth(
      API_ENDPOINTS.CUSTOMER_BOOKING_DETAIL(bookingId),
      token
    )
    const data = await response.json()

    if (response.ok) {
      return NextResponse.json({
        success: true,
        booking: data,
      })
    } else {
      return NextResponse.json(
        { message: data.detail || "Booking not found" },
        { status: response.status }
      )
    }
  } catch (error) {
    console.error("Fetch booking detail error:", error)
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
