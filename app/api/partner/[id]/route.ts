import { NextRequest, NextResponse } from "next/server"
import { API_ENDPOINTS } from "@/lib/api"

// GET – Public: fetch a partner's profile by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const partnerId = parseInt(id, 10)
        if (isNaN(partnerId)) {
            return NextResponse.json({ message: "Invalid partner ID" }, { status: 400 })
        }

        const url = API_ENDPOINTS.PARTNER_PUBLIC(partnerId)
        const response = await fetch(url)
        const data = await response.json()

        if (!response.ok) {
            return NextResponse.json(
                { message: data.detail || "Partner not found" },
                { status: response.status }
            )
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error("Fetch partner error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}
