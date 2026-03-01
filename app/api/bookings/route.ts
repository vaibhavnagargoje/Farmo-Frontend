import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { API_ENDPOINTS, fetchWithAuth } from "@/lib/api"
import {
  AUTH_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  isTokenExpired,
} from "@/lib/auth"

/**
 * POST /api/bookings
 * Create a new booking
 * 
 * Body: {
 *   service_id: number,
 *   scheduled_date: string (YYYY-MM-DD),
 *   scheduled_time: string (HH:MM),
 *   address: string,
 *   lat: number,
 *   lng: number,
 *   quantity: number,
 *   note?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(AUTH_COOKIE_NAME)?.value
    const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value

    if (!accessToken) {
      return NextResponse.json(
        { message: "Please login to book a service" },
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

    const body = await request.json()

    // Validate required fields
    const { service_id, scheduled_date, scheduled_time, address, lat, lng, quantity } = body

    if (!service_id) {
      return NextResponse.json(
        { message: "Service ID is required" },
        { status: 400 }
      )
    }

    if (!scheduled_date || !scheduled_time) {
      return NextResponse.json(
        { message: "Schedule date and time are required" },
        { status: 400 }
      )
    }

    if (!address || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { message: "Location is required" },
        { status: 400 }
      )
    }

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { message: "Quantity must be at least 1" },
        { status: 400 }
      )
    }

    // Create booking via Django API
    const response = await fetchWithAuth(
      API_ENDPOINTS.CUSTOMER_BOOKINGS,
      token,
      {
        method: "POST",
        body: JSON.stringify({
          service_id,
          scheduled_date,
          scheduled_time,
          address,
          lat,
          lng,
          quantity,
          note: body.note || "",
        }),
      }
    )

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: data.message || "Booking created successfully",
        booking: data.booking || data,
      })
    } else {
      // Handle Django validation errors
      let errorMessage = "Failed to create booking"

      if (data.detail) {
        errorMessage = data.detail
      } else if (data.service_id) {
        errorMessage = Array.isArray(data.service_id) ? data.service_id[0] : data.service_id
      } else if (data.scheduled_date) {
        errorMessage = Array.isArray(data.scheduled_date) ? data.scheduled_date[0] : data.scheduled_date
      } else if (data.quantity) {
        errorMessage = Array.isArray(data.quantity) ? data.quantity[0] : data.quantity
      } else if (data.error) {
        errorMessage = data.error
      } else if (data.non_field_errors) {
        errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors
      } else if (typeof data === "object") {
        // Get first error from any field
        const firstError = Object.values(data)[0]
        if (Array.isArray(firstError)) {
          errorMessage = firstError[0] as string
        } else if (typeof firstError === "string") {
          errorMessage = firstError
        }
      }

      return NextResponse.json(
        { message: errorMessage },
        { status: response.status }
      )
    }
  } catch (error) {
    console.error("Booking creation error:", error)
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
