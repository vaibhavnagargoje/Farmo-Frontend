import { NextRequest, NextResponse } from "next/server"
import { API_ENDPOINTS } from "@/lib/api"
import { apiRequest, unauthenticatedResponse } from "@/lib/api-server"

/**
 * GET /api/bookings/instant/status?booking_id=FB-XXXXXXXX
 * Poll instant booking status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get("booking_id")

    if (!bookingId) {
      return NextResponse.json(
        { message: "Booking ID is required" },
        { status: 400 }
      )
    }

    const { response } = await apiRequest(
      API_ENDPOINTS.INSTANT_BOOKING_STATUS(bookingId)
    )

    if (!response) {
      return unauthenticatedResponse("Please login to check booking status")
    }

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json({
        success: true,
        ...data,
      })
    } else {
      return NextResponse.json(
        { message: data.detail || "Failed to fetch booking status" },
        { status: response.status }
      )
    }
  } catch (error) {
    console.error("Instant booking status error:", error)
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
