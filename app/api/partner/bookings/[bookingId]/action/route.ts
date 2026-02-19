import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { API_ENDPOINTS, fetchWithAuth } from "@/lib/api"
import { AUTH_COOKIE_NAME, isTokenExpired } from "@/lib/auth"

// POST - Take action on a booking (accept/reject/start/complete)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ bookingId: string }> }
) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

        if (!token || isTokenExpired(token)) {
            return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
        }

        const { bookingId } = await params
        const body = await request.json()
        const { action, otp, rejection_reason } = body

        // Regular booking action
        const url = API_ENDPOINTS.PROVIDER_BOOKING_ACTION(bookingId)
        const payload: Record<string, string> = { action }
        if (otp) payload.otp = otp
        if (rejection_reason) payload.rejection_reason = rejection_reason

        const response = await fetchWithAuth(url, token, {
            method: "POST",
            body: JSON.stringify(payload),
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
        console.error("Booking action error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}
