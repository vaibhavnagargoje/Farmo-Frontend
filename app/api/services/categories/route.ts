import { NextResponse } from "next/server"
import { API_ENDPOINTS } from "@/lib/api"
import { publicApiRequest, rewriteMediaUrl } from "@/lib/api-server"

// GET /api/services/categories
export async function GET() {
    try {
        const res = await publicApiRequest(API_ENDPOINTS.CATEGORIES)
        const data = await res.json()

        // Rewrite icon URLs in categories
        const categories = Array.isArray(data) ? data : data.results || []
        for (const cat of categories) {
            if (cat.icon) cat.icon = rewriteMediaUrl(cat.icon)
        }

        return NextResponse.json(data, { status: res.status })
    } catch (error) {
        console.error("Error fetching categories:", error)
        return NextResponse.json(
            { error: "Failed to fetch categories" },
            { status: 500 }
        )
    }
}
