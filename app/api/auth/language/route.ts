import { NextResponse } from "next/server"
import { apiRequest, unauthenticatedResponse } from "@/lib/api-server"

const API_BASE = process.env.NEXT_PUBLIC_API_URL

// GET /api/auth/language → returns user's preferred language
export async function GET() {
    const { response } = await apiRequest(`${API_BASE}/users/language/`)
    if (!response) return unauthenticatedResponse()
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
}

// POST /api/auth/language → sets user's preferred language
export async function POST(request: Request) {
    const body = await request.json()
    const { response } = await apiRequest(`${API_BASE}/users/language/`, {
        method: "POST",
        body: JSON.stringify(body),
    })
    if (!response) return unauthenticatedResponse()
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
}
