import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"

// GET /api/services/:serviceId — proxy to Django service detail
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ serviceId: string }> }
) {
    try {
        const { serviceId } = await params
        const url = `${API_BASE_URL}/services/${serviceId}/`

        const res = await fetch(url, {
            headers: {
                "Content-Type": "application/json",
            },
        })

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
