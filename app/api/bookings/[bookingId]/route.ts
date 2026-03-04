import { NextRequest, NextResponse } from "next/server"
import { API_ENDPOINTS } from "@/lib/api"
import { apiRequest, unauthenticatedResponse } from "@/lib/api-server"

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

    const { response } = await apiRequest(
      API_ENDPOINTS.CUSTOMER_BOOKING_DETAIL(bookingId)
    )

    if (!response) {
      return unauthenticatedResponse("Please login to view booking details")
    }

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
