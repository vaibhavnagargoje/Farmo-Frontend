import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { apiRequest } from "@/lib/api-server"
import { API_ENDPOINTS } from "@/lib/api"
import { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME, USER_COOKIE_NAME } from "@/lib/auth"

export async function DELETE() {
  try {
    // 1. Forward the DELETE request to the Django backend
    const { response, token } = await apiRequest(API_ENDPOINTS.DELETE_ACCOUNT, {
      method: "DELETE",
    })

    // If not authenticated or token is invalid, apiRequest returns null
    if (!token || !response) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      )
    }

    // Check if the backend successfully soft-deleted the user
    if (!response.ok) {
        return NextResponse.json(
            { message: "Failed to delete account on the server." },
            { status: response.status }
        )
    }

    // 2. Clear out Next.js cookies to fully log out the user on the client side
    const cookieStore = await cookies()
    cookieStore.delete(AUTH_COOKIE_NAME)
    cookieStore.delete(REFRESH_COOKIE_NAME)
    cookieStore.delete(USER_COOKIE_NAME)

    return NextResponse.json(
      { message: "Account deleted and logged out successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Delete account proxy error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
