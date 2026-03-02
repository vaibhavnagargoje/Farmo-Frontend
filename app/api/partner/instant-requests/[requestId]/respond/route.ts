import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { API_ENDPOINTS, fetchWithAuth } from "@/lib/api"
import { AUTH_COOKIE_NAME, isTokenExpired } from "@/lib/auth"

// POST - Accept or decline an instant booking request
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ requestId: string }> }
) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

        if (!token || isTokenExpired(token)) {
            return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
        }

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

        const response = await fetchWithAuth(url, token, {
            method: "POST",
            body: JSON.stringify({}),
        })

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
