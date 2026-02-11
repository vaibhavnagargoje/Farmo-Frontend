import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"

// GET /api/services?category=slug
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const category = searchParams.get("category")

        let url = `${API_BASE_URL}/services/`
        if (category) {
            url += `?category=${category}`
        }

        const res = await fetch(url, {
            headers: {
                "Content-Type": "application/json",
            },
        })

        const data = await res.json()
        return NextResponse.json(data, { status: res.status })
    } catch (error) {
        console.error("Error fetching services:", error)
        return NextResponse.json(
            { error: "Failed to fetch services" },
            { status: 500 }
        )
    }
}
