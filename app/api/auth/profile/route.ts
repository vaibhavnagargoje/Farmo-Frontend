import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { API_ENDPOINTS } from "@/lib/api"
import { USER_COOKIE_NAME, cookieOptions, REFRESH_TOKEN_MAX_AGE } from "@/lib/auth"
import { apiRequest, unauthenticatedResponse, extractErrorMessage } from "@/lib/api-server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Add a timeout to prevent hanging on Vercel when the VPS is unreachable
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout

    let result: { response: Response | null; token: string | null }
    try {
      result = await apiRequest(API_ENDPOINTS.USER_PROFILE, {
        method: "POST",
        body: JSON.stringify(body),
        signal: controller.signal,
      })
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId)
      // Check if it was a timeout / abort
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        console.error("Profile update timed out connecting to backend")
        return NextResponse.json(
          { message: "Server is taking too long to respond. Please try again." },
          { status: 504 }
        )
      }
      // Connection refused, DNS failure, etc.
      console.error("Profile update fetch failed:", fetchError)
      return NextResponse.json(
        { message: "Unable to reach the server. Please try again later." },
        { status: 502 }
      )
    }
    clearTimeout(timeoutId)

    const { response, token } = result

    if (!response) {
      return unauthenticatedResponse("Not authenticated")
    }

    const data = await response.json()

    if (!response.ok) {
      console.error("Profile update returned", response.status, JSON.stringify(data))
      const message = extractErrorMessage(data, "Failed to update profile")
      return NextResponse.json({ message, errors: data }, { status: response.status })
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