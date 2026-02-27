import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { API_ENDPOINTS } from "@/lib/api"
import { AUTH_COOKIE_NAME, USER_COOKIE_NAME, cookieOptions, REFRESH_TOKEN_MAX_AGE } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(AUTH_COOKIE_NAME)?.value

    if (!accessToken) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()

    const response = await fetch(API_ENDPOINTS.USER_PROFILE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    // Update the user cookie with the new user data
    if (data.user) {
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