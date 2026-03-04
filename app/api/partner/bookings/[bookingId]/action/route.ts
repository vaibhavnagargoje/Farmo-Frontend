import { NextRequest, NextResponse } from "next/server"
import { API_ENDPOINTS } from "@/lib/api"
import { apiRequest, unauthenticatedResponse } from "@/lib/api-server"

// POST - Take action on a booking (accept/reject/start/complete)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ bookingId: string }> }
) {
    try {
        const { bookingId } = await params
        const body = await request.json()
        const { action, otp, rejection_reason } = body

        // Regular booking action
        const url = API_ENDPOINTS.PROVIDER_BOOKING_ACTION(bookingId)
        const payload: Record<string, string> = { action }
        if (otp) payload.otp = otp
        if (rejection_reason) payload.rejection_reason = rejection_reason

        const { response } = await apiRequest(url, {
            method: "POST",
            body: JSON.stringify(payload),
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
        console.error("Booking action error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}
