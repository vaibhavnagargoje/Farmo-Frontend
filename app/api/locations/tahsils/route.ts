import { NextResponse } from "next/server"
import { API_ENDPOINTS } from "@/lib/api"
import { publicApiRequest } from "@/lib/api-server"

/**
 * GET /api/locations/tahsils?district_id=<id>
 * Proxy to Django backend — avoids CORS issues in production.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const districtId = searchParams.get("district_id")

    const url = districtId
      ? `${API_ENDPOINTS.TAHSILS}?district_id=${districtId}`
      : API_ENDPOINTS.TAHSILS

    const response = await publicApiRequest(url)

    if (!response.ok) {
      return NextResponse.json([], { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Tahsils fetch error:", error)
    return NextResponse.json([], { status: 500 })
  }
}
