import { NextRequest, NextResponse } from "next/server"
import { apiRequest, unauthenticatedResponse } from "@/lib/api-server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

/**
 * POST /api/notifications/[id]/read
 * Marks a single notification as read.
 * Proxies to Django: POST /api/v1/notifications/<id>/read/
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { response } = await apiRequest(
      `${API_BASE_URL}/notifications/${id}/read/`,
      { method: "POST" }
    )

    if (!response) {
      return unauthenticatedResponse()
    }

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json(data)
    } else {
      return NextResponse.json(
        { message: data.message || "Failed to mark notification as read" },
        { status: response.status }
      )
    }
  } catch (error) {
    console.error("Mark notification read error:", error)
    return NextResponse.json(
      { message: "Something went wrong." },
      { status: 500 }
    )
  }
}
