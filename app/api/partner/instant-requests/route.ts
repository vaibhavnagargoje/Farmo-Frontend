import { NextRequest, NextResponse } from "next/server"
import { API_ENDPOINTS } from "@/lib/api"
import { apiRequest, unauthenticatedResponse } from "@/lib/api-server"

// GET - List pending instant booking requests for the provider
export async function GET(request: NextRequest) {
    try {
        const { response } = await apiRequest(API_ENDPOINTS.PROVIDER_INSTANT_REQUESTS)

        if (!response) {
            return unauthenticatedResponse("Not authenticated")
        }

        const data = await response.json()

        if (!response.ok) {
            return NextResponse.json(
                { message: data.detail || "Failed to fetch instant requests" },
                { status: response.status }
            )
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error("Provider instant requests error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}
