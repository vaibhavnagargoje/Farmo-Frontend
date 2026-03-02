import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"

// Rewrite absolute backend media URLs to the Next.js proxy
function rewriteMediaUrl(url: string | null | undefined): string | null {
    if (!url) return null
    const match = url.match(/https?:\/\/[^/]+\/media\/(.+)/)
    if (match) return `/api/media/${match[1]}`
    if (url.startsWith("/media/")) return `/api/media${url.slice(6)}`
    return url
}

// GET /api/services?category=slug
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const category = searchParams.get("category")

        let url = `${API_BASE_URL}/services/`
        const params = new URLSearchParams()
        if (category) params.set("category", category)
        const lat = searchParams.get("lat")
        const lng = searchParams.get("lng")
        const distance = searchParams.get("distance")
        if (lat) params.set("lat", lat)
        if (lng) params.set("lng", lng)
        if (distance) params.set("distance", distance)
        if (params.toString()) url += `?${params.toString()}`

        const res = await fetch(url, {
            headers: {
                "Content-Type": "application/json",
            },
        })

        const data = await res.json()

        // Rewrite thumbnail URLs in services
        const services = Array.isArray(data) ? data : data.results || []
        for (const svc of services) {
            if (svc.thumbnail) svc.thumbnail = rewriteMediaUrl(svc.thumbnail)
        }

        return NextResponse.json(data, { status: res.status })
    } catch (error) {
        console.error("Error fetching services:", error)
        return NextResponse.json(
            { error: "Failed to fetch services" },
            { status: 500 }
        )
    }
}
