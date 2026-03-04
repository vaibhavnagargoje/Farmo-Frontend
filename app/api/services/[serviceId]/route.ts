import { NextRequest, NextResponse } from "next/server"
import { API_ENDPOINTS } from "@/lib/api"
import { publicApiRequest } from "@/lib/api-server"

// GET /api/services/:serviceId — proxy to Django service detail
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ serviceId: string }> }
) {
    try {
        const { serviceId } = await params
        const res = await publicApiRequest(
            API_ENDPOINTS.SERVICE_DETAIL(Number(serviceId))
        )
        const data = await res.json()
        return NextResponse.json(data, { status: res.status })
    } catch (error) {
        console.error("Error fetching service detail:", error)
        return NextResponse.json(
            { error: "Failed to fetch service details" },
            { status: 500 }
        )
    }
}
