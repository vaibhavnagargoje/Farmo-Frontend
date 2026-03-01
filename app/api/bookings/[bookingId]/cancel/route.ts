import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { API_ENDPOINTS } from "@/lib/api"
import {
  AUTH_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  isTokenExpired,
} from "@/lib/auth"

/**
 * POST /api/bookings/[bookingId]/cancel
 * Cancel a booking by booking_id
 */
export async function POST(
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
        { message: "Please login to cancel a booking" },
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

    // Call Django cancel endpoint
    const response = await fetch(
      API_ENDPOINTS.CUSTOMER_BOOKING_CANCEL(bookingId),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: body.reason || "Cancelled by customer" }),
      }
    )

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: data.message || "Booking cancelled successfully",
      })
    } else {
      return NextResponse.json(
        { message: data.detail || data.reason?.[0] || "Failed to cancel booking" },
        { status: response.status }
      )
    }
  } catch (error) {
    console.error("Cancel booking error:", error)
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
