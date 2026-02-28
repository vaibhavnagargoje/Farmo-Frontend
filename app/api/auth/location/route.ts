import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { API_ENDPOINTS } from "@/lib/api"
import { AUTH_COOKIE_NAME } from "@/lib/auth"

/**
 * GET /api/auth/location
 * Fetch the authenticated user's saved location from the backend.
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(AUTH_COOKIE_NAME)?.value

    if (!accessToken) {
      return NextResponse.json(
        { has_location: false, location: null },
        { status: 200 }
      )
    }

    const response = await fetch(API_ENDPOINTS.USER_LOCATION, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    })

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
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(AUTH_COOKIE_NAME)?.value

    if (!accessToken) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Round coordinates to 6 decimal places to match backend DecimalField precision
    if (typeof body.latitude === "number") body.latitude = parseFloat(body.latitude.toFixed(6))
    if (typeof body.longitude === "number") body.longitude = parseFloat(body.longitude.toFixed(6))

    const response = await fetch(API_ENDPOINTS.USER_LOCATION, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    })

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
