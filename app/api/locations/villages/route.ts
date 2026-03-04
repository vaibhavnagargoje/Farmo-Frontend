import { NextResponse } from "next/server"
import { API_ENDPOINTS } from "@/lib/api"
import { publicApiRequest } from "@/lib/api-server"

/**
 * GET /api/locations/villages?tahsil_id=<id>
 * Proxy to Django backend — avoids CORS issues in production.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tahsilId = searchParams.get("tahsil_id")

    const url = tahsilId
      ? `${API_ENDPOINTS.VILLAGES}?tahsil_id=${tahsilId}`
      : API_ENDPOINTS.VILLAGES

    const response = await publicApiRequest(url)

    if (!response.ok) {
      return NextResponse.json([], { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Villages fetch error:", error)
    return NextResponse.json([], { status: 500 })
  }
}
