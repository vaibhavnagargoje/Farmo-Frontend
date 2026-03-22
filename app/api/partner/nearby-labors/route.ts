import { NextRequest, NextResponse } from "next/server"
import { API_ENDPOINTS } from "@/lib/api"

// GET – Public endpoint: fetch nearby labor partners
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const lat = searchParams.get("lat")
        const lng = searchParams.get("lng")
        const distance = searchParams.get("distance") || "5"

        if (!lat || !lng) {
            return NextResponse.json(
                { message: "lat and lng are required" },
                { status: 400 }
            )
        }

        const url = `${API_ENDPOINTS.NEARBY_LABORS}?lat=${lat}&lng=${lng}&distance=${distance}`
        const response = await fetch(url)
        const data = await response.json()

        if (!response.ok) {
            return NextResponse.json(
                { message: data.error || data.detail || "Failed to fetch nearby labors" },
                { status: response.status }
            )
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error("Fetch nearby labors error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}
