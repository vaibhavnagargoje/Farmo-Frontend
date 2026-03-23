import { NextResponse } from "next/server"
import { API_ENDPOINTS } from "@/lib/api"
import { publicApiRequest, rewriteMediaUrl } from "@/lib/api-server"

// GET /api/services/categories?lat=...&lng=...
export async function GET(request: Request) {
    try {
        // Forward lat/lng for zone pricing resolution
        const { searchParams } = new URL(request.url)
        let url = API_ENDPOINTS.CATEGORIES
        const lat = searchParams.get('lat')
        const lng = searchParams.get('lng')
        if (lat && lng) {
            url += `?lat=${lat}&lng=${lng}`
        }
        const res = await publicApiRequest(url)
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
