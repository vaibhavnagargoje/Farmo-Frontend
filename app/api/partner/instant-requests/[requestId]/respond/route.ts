import { NextRequest, NextResponse } from "next/server"
import { API_ENDPOINTS } from "@/lib/api"
import { apiRequest, unauthenticatedResponse } from "@/lib/api-server"

// POST - Accept or decline an instant booking request
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ requestId: string }> }
) {
    try {
        const { requestId } = await params
        const body = await request.json()
        const { action } = body // "accept" or "decline"

        const id = parseInt(requestId, 10)
        if (isNaN(id)) {
            return NextResponse.json({ message: "Invalid request ID" }, { status: 400 })
        }

        let url: string
        if (action === "accept") {
            url = API_ENDPOINTS.PROVIDER_INSTANT_REQUEST_ACCEPT(id)
        } else if (action === "decline") {
            url = API_ENDPOINTS.PROVIDER_INSTANT_REQUEST_DECLINE(id)
        } else {
            return NextResponse.json({ message: "Invalid action. Use 'accept' or 'decline'." }, { status: 400 })
        }

        const { response } = await apiRequest(url, {
            method: "POST",
            body: JSON.stringify({}),
        })

        if (!response) {
            return unauthenticatedResponse("Not authenticated")
        }

        const data = await response.json()

        if (!response.ok) {
            return NextResponse.json(
                { message: data.error || data.detail || "Action failed" },
                { status: response.status }
            )
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error("Instant request action error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}
