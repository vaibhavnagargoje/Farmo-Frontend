import { NextResponse } from "next/server"
import { API_ENDPOINTS } from "@/lib/api"
import { publicApiRequest } from "@/lib/api-server"

/**
 * GET /api/services/price-units
 * Returns available price unit choices from the backend.
 * Public endpoint, no auth required.
 */
export async function GET() {
  try {
    const res = await publicApiRequest(API_ENDPOINTS.PRICE_UNITS)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error("Error fetching price units:", error)
    return NextResponse.json(
      { error: "Failed to fetch price units" },
      { status: 500 }
    )
  }
}
