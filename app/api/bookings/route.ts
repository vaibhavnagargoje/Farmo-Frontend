import { NextRequest, NextResponse } from "next/server"
import { API_ENDPOINTS } from "@/lib/api"
import { apiRequest, unauthenticatedResponse, extractErrorMessage } from "@/lib/api-server"

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
    const body = await request.json()
    const allowedPriceUnits = ["HOUR", "DAY", "KM", "ACRE", "FIXED"]

    // Validate required fields
    const { service_id, scheduled_date, scheduled_time, address, lat, lng, quantity, price_unit } = body

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

    if (price_unit && !allowedPriceUnits.includes(String(price_unit).toUpperCase())) {
      return NextResponse.json(
        { message: "Invalid price unit" },
        { status: 400 }
      )
    }

    // Create booking via Django API
    const { response } = await apiRequest(
      API_ENDPOINTS.CUSTOMER_BOOKINGS,
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
          price_unit: price_unit ? String(price_unit).toUpperCase() : undefined,
          note: body.note || "",
        }),
      }
    )

    if (!response) {
      return unauthenticatedResponse("Please login to book a service")
    }

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: data.message || "Booking created successfully",
        booking: data.booking || data,
      })
    } else {
      // Check for duplicate provider conflict
      // Django returns non_field_errors as an array; each item can be a dict
      const nonFieldErrors = data.non_field_errors || []
      const duplicateEntry = Array.isArray(nonFieldErrors)
        ? nonFieldErrors.find((e: any) => typeof e === 'object' && e.duplicate_provider)
        : null
      const isDuplicate = !!duplicateEntry || data.duplicate_provider

      return NextResponse.json(
        {
          message: isDuplicate
            ? (duplicateEntry?.message || "You already have an active booking with this provider.")
            : extractErrorMessage(data, "Failed to create booking"),
          ...(isDuplicate ? { duplicate_provider: true } : {}),
        },
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
