import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { USER_COOKIE_NAME, cookieOptions } from "@/lib/auth"
import { getValidToken, apiRequest } from "@/lib/api-server"
import { API_ENDPOINTS } from "@/lib/api"

export async function GET() {
  try {
    const token = await getValidToken()

    if (!token) {
      // No valid token — clean up the stale farmo_user cookie so the client
      // doesn't show a "ghost" logged-in state.
      const cookieStore = await cookies()
      cookieStore.delete(USER_COOKIE_NAME)

      return NextResponse.json(
        { message: "Not authenticated", user: null },
        { status: 401 }
      )
    }

    // Actually fetch from Django backend
    const { response } = await apiRequest(API_ENDPOINTS.USER_PROFILE)
    
    if (!response || !response.ok) {
       const cookieStore = await cookies()
       cookieStore.delete(USER_COOKIE_NAME)
       return NextResponse.json(
          { message: "Not authenticated", user: null },
          { status: 401 }
       )
    }

    const data = await response.json()
    const user = data.user || data // depending on how your backend serializes it

    // Map common fields correctly from DRF
    const normalizedUser = {
      id: user.id || user.user_id,
      phone_number: user.phone_number || user.phone,
      email: user.email,
      role: user.role,
      full_name: user.full_name || user.name,
      is_active: user.is_active,
    }

    // Refresh the local cookie with fresh data from backend
    const cookieStore = await cookies()
    cookieStore.set(USER_COOKIE_NAME, JSON.stringify(normalizedUser), {
        ...cookieOptions,
        httpOnly: false, // Allow client to read user info
        maxAge: 7 * 24 * 60 * 60, // Match REFRESH_TOKEN_MAX_AGE
    })

    return NextResponse.json({
      message: "Authenticated",
      user: normalizedUser,
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json(
      { message: "Authentication check failed", user: null },
      { status: 500 }
    )
  }
}
