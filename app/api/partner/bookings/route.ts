import { NextRequest, NextResponse } from "next/server"
import { API_ENDPOINTS } from "@/lib/api"
import { apiRequest, unauthenticatedResponse } from "@/lib/api-server"

// GET - List provider's scheduled/regular bookings
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get("status")

        let url = API_ENDPOINTS.PROVIDER_BOOKINGS
        if (status) {
            url += `?status=${status}`
        }

        const { response } = await apiRequest(url)

        if (!response) {
            return unauthenticatedResponse("Not authenticated")
        }

        const data = await response.json()

        if (!response.ok) {
            return NextResponse.json(
                { message: data.detail || "Failed to fetch bookings" },
                { status: response.status }
            )
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error("Provider bookings error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}
