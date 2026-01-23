import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { API_ENDPOINTS } from "@/lib/api"
import {
  AUTH_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  USER_COOKIE_NAME,
  cookieOptions,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
} from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone_number, otp } = body

    if (!phone_number || !otp) {
      return NextResponse.json(
        { message: "Phone number and OTP are required" },
        { status: 400 }
      )
    }

    // Call Django backend to verify OTP
    const response = await fetch(API_ENDPOINTS.VERIFY_OTP, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone_number, otp }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    // Extract tokens and user from response
    // Django returns access and refresh at root level, not in a tokens object
    const { access, refresh, user, is_new_user, message } = data

    if (!access || !refresh || !user) {
      console.error("Invalid response structure:", { hasAccess: !!access, hasRefresh: !!refresh, hasUser: !!user })
      return NextResponse.json(
        { message: "Invalid response from authentication server" },
        { status: 500 }
      )
    }

    // Get cookie store
    const cookieStore = await cookies()

    // Set HTTP-only cookies for tokens
    cookieStore.set(AUTH_COOKIE_NAME, access, {
      ...cookieOptions,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    })

    cookieStore.set(REFRESH_COOKIE_NAME, refresh, {
      ...cookieOptions,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    })

    // Set user cookie (readable by client for UI purposes)
    cookieStore.set(USER_COOKIE_NAME, JSON.stringify(user), {
      ...cookieOptions,
      httpOnly: false, // Allow client to read user info
      maxAge: REFRESH_TOKEN_MAX_AGE,
    })

    // Return success response (without tokens - they're in cookies)
    return NextResponse.json({
      message: message || "Login successful",
      is_new_user,
      user,
    })
  } catch (error) {
    console.error("Verify OTP error:", error)
    return NextResponse.json(
      { message: "Failed to verify OTP. Please try again." },
      { status: 500 }
    )
  }
}
