import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import {
  AUTH_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  USER_COOKIE_NAME,
} from "@/lib/auth"

export async function POST() {
  try {
    const cookieStore = await cookies()

    // Clear all auth cookies
    cookieStore.delete(AUTH_COOKIE_NAME)
    cookieStore.delete(REFRESH_COOKIE_NAME)
    cookieStore.delete(USER_COOKIE_NAME)

    return NextResponse.json({
      message: "Logged out successfully",
    })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { message: "Failed to logout" },
      { status: 500 }
    )
  }
}
