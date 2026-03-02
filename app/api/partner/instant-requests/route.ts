import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { API_ENDPOINTS, fetchWithAuth } from "@/lib/api"
import { AUTH_COOKIE_NAME, isTokenExpired } from "@/lib/auth"

// GET - List pending instant booking requests for the provider
export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

        if (!token || isTokenExpired(token)) {
            return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
        }

        const response = await fetchWithAuth(API_ENDPOINTS.PROVIDER_INSTANT_REQUESTS, token)
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
