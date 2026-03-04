import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { API_ENDPOINTS } from "@/lib/api"
import { USER_COOKIE_NAME, cookieOptions, REFRESH_TOKEN_MAX_AGE } from "@/lib/auth"
import { apiRequest, unauthenticatedResponse } from "@/lib/api-server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { response, token } = await apiRequest(API_ENDPOINTS.USER_PROFILE, {
      method: "POST",
      body: JSON.stringify(body),
    })

    if (!response) {
      return unauthenticatedResponse("Not authenticated")
    }

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    // Update the user cookie with the new user data
    if (data.user) {
      const cookieStore = await cookies()
      cookieStore.set(USER_COOKIE_NAME, JSON.stringify(data.user), {
        ...cookieOptions,
        httpOnly: false, // Allow client to read user info
        maxAge: REFRESH_TOKEN_MAX_AGE,
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 }
    )
  }
}