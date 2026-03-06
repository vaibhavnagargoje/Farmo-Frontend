import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { API_ENDPOINTS } from "@/lib/api"
import { USER_COOKIE_NAME } from "@/lib/auth"
import { apiRequest, unauthenticatedResponse } from "@/lib/api-server"

// GET - Fetch current user profile
export async function GET() {
  try {
    const { response: userResponse, token } = await apiRequest(
      API_ENDPOINTS.USER_PROFILE
    )

    if (!userResponse || !token) {
      return unauthenticatedResponse("Not authenticated")
    }

    let userData = null

    if (userResponse.ok) {
      userData = await userResponse.json()
    } else {
      // Fallback to user cookie if user profile endpoint fails
      const cookieStore = await cookies()
      const userCookie = cookieStore.get(USER_COOKIE_NAME)?.value
      if (userCookie) {
        userData = { user: JSON.parse(userCookie), profile: null }
      }
    }

    // Try to fetch partner profile (may not exist)
    let partnerData = null
    try {
      const { response: partnerResponse } = await apiRequest(
        API_ENDPOINTS.PARTNER_PROFILE
      )
      if (partnerResponse?.ok) {
        partnerData = await partnerResponse.json()
      }
    } catch {
      // Partner profile doesn't exist — that's fine
    }

    return NextResponse.json({
      user: userData?.user || null,
      profile: userData?.profile || null,
      partner: partnerData,
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json(
      { message: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}

// PATCH - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { full_name, address, default_lat, default_lng, ...otherData } = body

    const { token } = await apiRequest(API_ENDPOINTS.USER_PROFILE)

    if (!token) {
      return unauthenticatedResponse("Not authenticated")
    }

    // 1. Update basic User info (Name) via /users/profile/
    if (full_name !== undefined) {
      const userUpdatePayload: Record<string, string> = {}
      if (full_name) userUpdatePayload.full_name = full_name
      if (address) userUpdatePayload.village = address

      await apiRequest(API_ENDPOINTS.USER_PROFILE, {
        method: "POST",
        body: JSON.stringify(userUpdatePayload),
      })
    }

    // 2. Update Partner Profile (Address/City) if exists
    let partnerData = null
    const partnerPayload: Record<string, unknown> = { ...otherData }

    if (Object.keys(partnerPayload).length > 0) {
      const { response: partnerResponse } = await apiRequest(
        API_ENDPOINTS.PARTNER_PROFILE,
        {
          method: "PATCH",
          body: JSON.stringify(partnerPayload),
        }
      )

      if (partnerResponse?.ok) {
        const contentType = partnerResponse.headers.get("content-type") || ""
        if (contentType.includes("application/json")) {
          partnerData = await partnerResponse.json()
        }
      }
    }

    // 3. Update User Cookie
    const cookieStore = await cookies()
    const userCookie = cookieStore.get(USER_COOKIE_NAME)?.value
    let user = userCookie ? JSON.parse(userCookie) : null

    if (user && full_name) {
      user.full_name = full_name

      cookieStore.set(USER_COOKIE_NAME, JSON.stringify(user), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      })
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      user,
      partner: partnerData,
    })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 }
    )
  }
}
