import { NextRequest, NextResponse } from "next/server"
import { API_ENDPOINTS } from "@/lib/api"
import { apiRequest, unauthenticatedResponse } from "@/lib/api-server"

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
    const body = await request.json()

    // Call Django cancel endpoint
    const { response } = await apiRequest(
      API_ENDPOINTS.CUSTOMER_BOOKING_CANCEL(bookingId),
      {
        method: "POST",
        body: JSON.stringify({ reason: body.reason || "Cancelled by customer" }),
      }
    )

    if (!response) {
      return unauthenticatedResponse("Please login to cancel a booking")
    }

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
