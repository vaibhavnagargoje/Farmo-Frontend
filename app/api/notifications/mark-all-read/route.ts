import { NextResponse } from "next/server"
import { apiRequest, unauthenticatedResponse } from "@/lib/api-server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

/**
 * POST /api/notifications/mark-all-read
 * Marks all unread notifications as read for the authenticated user.
 * Proxies to Django: POST /api/v1/notifications/mark-all-read/
 */
export async function POST() {
  try {
    const { response } = await apiRequest(
      `${API_BASE_URL}/notifications/mark-all-read/`,
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
        { message: data.message || "Failed to mark all as read" },
        { status: response.status }
      )
    }
  } catch (error) {
    console.error("Mark all read error:", error)
    return NextResponse.json(
      { message: "Something went wrong." },
      { status: 500 }
    )
  }
}
