import { NextRequest, NextResponse } from "next/server"
import { API_ENDPOINTS } from "@/lib/api"
import { apiRequest, unauthenticatedResponse } from "@/lib/api-server"

/**
 * GET /api/bookings/list
 * Fetch all bookings for the logged-in customer
 */
export async function GET(request: NextRequest) {
  try {
    // Get query params for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    // Build URL with optional status filter
    let url = API_ENDPOINTS.CUSTOMER_BOOKINGS
    if (status && status !== "all") {
      url += `?status=${status.toUpperCase()}`
    }

    const { response } = await apiRequest(url)

    if (!response) {
      return unauthenticatedResponse("Please login to view bookings")
    }

    const data = await response.json()

    if (response.ok) {
      // Handle paginated or non-paginated response
      const bookings = data.results || data || []
      return NextResponse.json({
        success: true,
        bookings: bookings,
        count: data.count || bookings.length,
      })
    } else {
      return NextResponse.json(
        { message: data.detail || "Failed to fetch bookings" },
        { status: response.status }
      )
    }
  } catch (error) {
    console.error("Fetch bookings error:", error)
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
