import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL
    ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
    : "http://127.0.0.1:8000"

// GET /api/media/[...path] — proxy media files from Django backend
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await params
        const mediaPath = path.join("/")
        const backendUrl = `${BACKEND_URL}/media/${mediaPath}`

        const res = await fetch(backendUrl)

        if (!res.ok) {
            return new NextResponse(null, { status: res.status })
        }

        const buffer = await res.arrayBuffer()
        const contentType = res.headers.get("content-type") || "application/octet-stream"

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400, immutable",
            },
        })
    } catch (error) {
        console.error("Media proxy error:", error)
        return new NextResponse(null, { status: 502 })
    }
}
