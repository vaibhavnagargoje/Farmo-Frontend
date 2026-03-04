import { NextResponse } from "next/server"
import { API_ENDPOINTS } from "@/lib/api"
import { publicApiRequest } from "@/lib/api-server"

/**
 * GET /api/locations/states
 * Proxy to Django backend — avoids CORS issues in production.
 */
export async function GET() {
  try {
    const response = await publicApiRequest(API_ENDPOINTS.STATES)

    if (!response.ok) {
      return NextResponse.json([], { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("States fetch error:", error)
    return NextResponse.json([], { status: 500 })
  }
}
