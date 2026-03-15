import { NextResponse } from "next/server"
import { API_ENDPOINTS } from "@/lib/api"
import { apiRequest, unauthenticatedResponse } from "@/lib/api-server"

/**
 * GET /api/notifications
 * Lists all notifications for the authenticated user.
 * Proxies to Django: GET /api/v1/notifications/
 */
export async function GET() {
  try {
    const { response } = await apiRequest(API_ENDPOINTS.NOTIFICATIONS)

    if (!response) {
      return unauthenticatedResponse()
    }

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json(data)
    } else {
      return NextResponse.json(
        { message: "Failed to fetch notifications" },
        { status: response.status }
      )
    }
  } catch (error) {
    console.error("Fetch notifications error:", error)
    return NextResponse.json(
      { message: "Something went wrong." },
      { status: 500 }
    )
  }
}
