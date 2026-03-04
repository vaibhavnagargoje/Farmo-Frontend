import { NextResponse } from "next/server"
import { API_ENDPOINTS } from "@/lib/api"
import { publicApiRequest } from "@/lib/api-server"

/**
 * GET /api/locations/districts?state_id=<id>
 * Proxy to Django backend — avoids CORS issues in production.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stateId = searchParams.get("state_id")

    const url = stateId
      ? `${API_ENDPOINTS.DISTRICTS}?state_id=${stateId}`
      : API_ENDPOINTS.DISTRICTS

    const response = await publicApiRequest(url)

    if (!response.ok) {
      return NextResponse.json([], { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Districts fetch error:", error)
    return NextResponse.json([], { status: 500 })
  }
}
