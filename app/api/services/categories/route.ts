import { NextResponse } from "next/server"
import { API_ENDPOINTS } from "@/lib/api"
import { publicApiRequest, rewriteMediaUrl } from "@/lib/api-server"

// GET /api/services/categories?lat=...&lng=...
export async function GET(request: Request) {
    try {
        // Forward query params (lat, lng for zone pricing; lang for translations)
        const { searchParams } = new URL(request.url)
        const params = new URLSearchParams()
        const lat = searchParams.get('lat')
        const lng = searchParams.get('lng')
        const lang = searchParams.get('lang')
        if (lat && lng) { params.set('lat', lat); params.set('lng', lng) }
        if (lang) { params.set('lang', lang) }
        const qs = params.toString()
        const url = qs ? `${API_ENDPOINTS.CATEGORIES}?${qs}` : API_ENDPOINTS.CATEGORIES
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
