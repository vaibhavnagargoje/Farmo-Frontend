import { NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"

// Rewrite absolute backend media URLs to the Next.js proxy
function rewriteMediaUrl(url: string | null | undefined): string | null {
    if (!url) return null
    const match = url.match(/https?:\/\/[^/]+\/media\/(.+)/)
    if (match) return `/api/media/${match[1]}`
    if (url.startsWith("/media/")) return `/api/media${url.slice(6)}`
    return url
}

// GET /api/services/categories
export async function GET() {
    try {
        const res = await fetch(`${API_BASE_URL}/services/categories/`, {
            headers: {
                "Content-Type": "application/json",
            },
        })

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
