import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { USER_COOKIE_NAME } from "@/lib/auth"
import { getValidToken } from "@/lib/api-server"

export async function GET() {
  try {
    const token = await getValidToken()

    if (!token) {
      return NextResponse.json(
        { message: "Not authenticated", user: null },
        { status: 401 }
      )
    }

    // Parse user from cookie
    const cookieStore = await cookies()
    const userCookie = cookieStore.get(USER_COOKIE_NAME)?.value

    let user = null
    if (userCookie) {
      try {
        user = JSON.parse(userCookie)
      } catch {
        user = null
      }
    }

    return NextResponse.json({
      message: "Authenticated",
      user,
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json(
      { message: "Authentication check failed", user: null },
      { status: 500 }
    )
  }
}
