import { NextRequest, NextResponse } from "next/server"
import { API_ENDPOINTS } from "@/lib/api"
import { apiRequest, unauthenticatedResponse, extractErrorMessage } from "@/lib/api-server"

/**
 * POST /api/bookings/instant
 * Create an instant (quick) booking
 *
 * Body: {
 *   category_id: number,
 *   quantity: number,
 *   note?: string,
 *   address: string,
 *   lat: number,
 *   lng: number,
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const { category_id, quantity, address, lat, lng } = body

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
    const { response } = await apiRequest(
      API_ENDPOINTS.INSTANT_BOOKING_CREATE,
      {
        method: "POST",
        body: JSON.stringify({
          category_id,
          quantity,
          address,
          lat: roundedLat,
          lng: roundedLng,
          note: body.note || "",
        }),
      }
    )

    if (!response) {
      return unauthenticatedResponse("Please login to create an instant booking")
    }

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: data.message || "Instant booking created",
        booking: data.booking || data,
        providers_notified: data.providers_notified || 0,
      })
    } else {
      // Check for active booking conflict
      let activeBookingId: string | null = null
      let errorMessage = "Failed to create instant booking"

      if (data.active_booking_id) {
        activeBookingId = Array.isArray(data.active_booking_id)
          ? data.active_booking_id[0]
          : data.active_booking_id
        errorMessage = extractErrorMessage(data, "You already have an active order. Cancel it or wait for it to expire.")
      } else {
        errorMessage = extractErrorMessage(data, "Failed to create instant booking")
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
