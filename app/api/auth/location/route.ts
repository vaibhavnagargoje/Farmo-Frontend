import { NextResponse } from "next/server"
import { API_ENDPOINTS } from "@/lib/api"
import { apiRequest, unauthenticatedResponse } from "@/lib/api-server"

/**
 * GET /api/auth/location
 * Fetch the authenticated user's saved location from the backend.
 */
export async function GET() {
  try {
    const { response, token } = await apiRequest(API_ENDPOINTS.USER_LOCATION)

    if (!response) {
      // Not authenticated — return empty location (graceful fallback)
      return NextResponse.json(
        { has_location: false, location: null },
        { status: 200 }
      )
    }

    if (!response.ok) {
      return NextResponse.json(
        { has_location: false, location: null },
        { status: 200 }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Location fetch error:", error)
    return NextResponse.json(
      { has_location: false, location: null },
      { status: 200 }
    )
  }
}

/**
 * POST /api/auth/location
 * Save / update the authenticated user's location on the backend.
 * Body: { latitude: number, longitude: number, address?: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Round coordinates to 6 decimal places to match backend DecimalField precision
    if (typeof body.latitude === "number") body.latitude = parseFloat(body.latitude.toFixed(6))
    if (typeof body.longitude === "number") body.longitude = parseFloat(body.longitude.toFixed(6))

    const { response } = await apiRequest(API_ENDPOINTS.USER_LOCATION, {
      method: "POST",
      body: JSON.stringify(body),
    })

    if (!response) {
      return unauthenticatedResponse("Not authenticated")
    }

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Location update error:", error)
    return NextResponse.json(
      { message: "Failed to update location" },
      { status: 500 }
    )
  }
}
