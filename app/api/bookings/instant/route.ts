import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { API_ENDPOINTS, fetchWithAuth } from "@/lib/api"
import {
  AUTH_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  isTokenExpired,
} from "@/lib/auth"

/**
 * POST /api/bookings/instant
 * Create an instant (quick) booking
 *
 * Body: {
 *   category_id: number,
 *   quantity: number,
 *   price_unit: string,
 *   note?: string,
 *   address: string,
 *   lat: number,
 *   lng: number,
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(AUTH_COOKIE_NAME)?.value
    const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value

    if (!accessToken) {
      return NextResponse.json(
        { message: "Please login to create an instant booking" },
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

    // Validate required fields
    const { category_id, quantity, price_unit, address, lat, lng } = body

    if (!category_id) {
      return NextResponse.json(
        { message: "Category is required" },
        { status: 400 }
      )
    }

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { message: "Quantity must be at least 1" },
        { status: 400 }
      )
    }

    if (!price_unit) {
      return NextResponse.json(
        { message: "Price unit is required" },
        { status: 400 }
      )
    }

    if (!address || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { message: "Location is required" },
        { status: 400 }
      )
    }

    // Round lat/lng to 6 decimal places to fit Django DecimalField(max_digits=9, decimal_places=6)
    const roundedLat = parseFloat(Number(lat).toFixed(6))
    const roundedLng = parseFloat(Number(lng).toFixed(6))

    // Create instant booking via Django API
    const response = await fetchWithAuth(
      API_ENDPOINTS.INSTANT_BOOKING_CREATE,
      token,
      {
        method: "POST",
        body: JSON.stringify({
          category_id,
          quantity,
          price_unit,
          address,
          lat: roundedLat,
          lng: roundedLng,
          note: body.note || "",
        }),
      }
    )

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: data.message || "Instant booking created",
        booking: data.booking || data,
        providers_notified: data.providers_notified || 0,
      })
    } else {
      let errorMessage = "Failed to create instant booking"
      let activeBookingId: string | null = null

      // Check for active booking conflict
      if (data.active_booking_id) {
        activeBookingId = Array.isArray(data.active_booking_id)
          ? data.active_booking_id[0]
          : data.active_booking_id
        errorMessage = data.message
          ? (Array.isArray(data.message) ? data.message[0] : data.message)
          : "You already have an active order. Cancel it or wait for it to expire."
      } else if (data.detail) {
        errorMessage = data.detail
      } else if (data.category_id) {
        errorMessage = Array.isArray(data.category_id) ? data.category_id[0] : data.category_id
      } else if (data.quantity) {
        errorMessage = Array.isArray(data.quantity) ? data.quantity[0] : data.quantity
      } else if (data.price_unit) {
        errorMessage = Array.isArray(data.price_unit) ? data.price_unit[0] : data.price_unit
      } else if (data.error) {
        errorMessage = data.error
      } else if (data.non_field_errors) {
        errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors
      } else if (typeof data === "object") {
        const firstError = Object.values(data)[0]
        if (Array.isArray(firstError)) {
          errorMessage = firstError[0] as string
        } else if (typeof firstError === "string") {
          errorMessage = firstError
        }
      }

      return NextResponse.json(
        {
          message: errorMessage,
          ...(activeBookingId ? { active_booking_id: activeBookingId } : {}),
        },
        { status: response.status }
      )
    }
  } catch (error) {
    console.error("Instant booking creation error:", error)
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
