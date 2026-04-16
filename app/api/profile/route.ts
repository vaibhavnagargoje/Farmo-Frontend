import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { API_ENDPOINTS } from "@/lib/api"
import { USER_COOKIE_NAME } from "@/lib/auth"
import { apiRequest, extractErrorMessage, getValidToken, unauthenticatedResponse } from "@/lib/api-server"

const USER_COOKIE_MAX_AGE = 7 * 24 * 60 * 60

function getUserCookieOptions() {
  return {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: USER_COOKIE_MAX_AGE,
  }
}

async function parseResponseBody(response: Response): Promise<Record<string, unknown>> {
  const contentType = response.headers.get("content-type") || ""

  if (contentType.includes("application/json")) {
    return (await response.json()) as Record<string, unknown>
  }

  const text = await response.text()
  return { message: text || "Unexpected response from backend" }
}

async function setUserCookie(user: unknown) {
  if (!user || typeof user !== "object") {
    return
  }

  const cookieStore = await cookies()
  cookieStore.set(USER_COOKIE_NAME, JSON.stringify(user), getUserCookieOptions())
}

async function getUserFromCookie(): Promise<Record<string, unknown> | null> {
  const cookieStore = await cookies()
  const userCookie = cookieStore.get(USER_COOKIE_NAME)?.value

  if (!userCookie) {
    return null
  }

  try {
    return JSON.parse(userCookie) as Record<string, unknown>
  } catch {
    return null
  }
}

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
    const token = await getValidToken()

    if (!token) {
      return unauthenticatedResponse("Not authenticated")
    }

    const requestContentType = request.headers.get("content-type") || ""

    // Handle profile photo updates via multipart/form-data
    if (requestContentType.includes("multipart/form-data")) {
      const incomingFormData = await request.formData()
      const djangoFormData = new FormData()

      const fullName = incomingFormData.get("full_name")
      if (typeof fullName === "string") {
        djangoFormData.append("full_name", fullName.trim())
      }

      const photo = incomingFormData.get("profile_picture")
      if (photo instanceof File) {
        djangoFormData.append("profile_picture", photo)
      }

      const userResponse = await fetch(API_ENDPOINTS.USER_PROFILE, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: djangoFormData,
      })

      const userData = await parseResponseBody(userResponse)

      if (!userResponse.ok) {
        const message = extractErrorMessage(userData, "Failed to update profile")
        return NextResponse.json(
          { message, errors: userData },
          { status: userResponse.status }
        )
      }

      await setUserCookie(userData.user)

      return NextResponse.json({
        message: typeof userData.message === "string" ? userData.message : "Profile updated successfully",
        user: userData.user ?? null,
        profile: userData.profile ?? null,
        partner: null,
      })
    }

    const body = (await request.json()) as Record<string, unknown>
    const { full_name, address, default_lat, default_lng, ...otherData } = body

    let updatedUser: Record<string, unknown> | null = null

    // 1. Update basic User info (Name) via /users/profile/
    if (full_name !== undefined) {
      const normalizedName = typeof full_name === "string" ? full_name.trim() : ""
      const userUpdatePayload: Record<string, string> = {
        full_name: normalizedName,
      }

      const userResponse = await fetch(API_ENDPOINTS.USER_PROFILE, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userUpdatePayload),
      })

      const userData = await parseResponseBody(userResponse)
      if (!userResponse.ok) {
        const message = extractErrorMessage(userData, "Failed to update profile")
        return NextResponse.json(
          { message, errors: userData },
          { status: userResponse.status }
        )
      }

      if (userData.user && typeof userData.user === "object") {
        updatedUser = userData.user as Record<string, unknown>
        await setUserCookie(updatedUser)
      }
    }

    // 1b. Save coordinates to UserLocation if provided
    if (default_lat != null && default_lng != null) {
      const locationResponse = await fetch(API_ENDPOINTS.USER_LOCATION, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: default_lat,
          longitude: default_lng,
          address: typeof address === "string" ? address : "",
        }),
      })

      if (!locationResponse.ok) {
        const locationData = await parseResponseBody(locationResponse)
        const message = extractErrorMessage(locationData, "Failed to update location")
        return NextResponse.json(
          { message, errors: locationData },
          { status: locationResponse.status }
        )
      }
    }

    // 2. Update Partner Profile (Address/City) if exists
    let partnerData: Record<string, unknown> | null = null
    const partnerPayload: Record<string, unknown> = { ...otherData }

    if (Object.keys(partnerPayload).length > 0) {
      const partnerResponse = await fetch(API_ENDPOINTS.PARTNER_PROFILE, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(partnerPayload),
      })

      const partnerBody = await parseResponseBody(partnerResponse)
      if (!partnerResponse.ok) {
        const message = extractErrorMessage(partnerBody, "Failed to update partner profile")
        return NextResponse.json(
          { message, errors: partnerBody },
          { status: partnerResponse.status }
        )
      }

      if (partnerBody && typeof partnerBody === "object") {
        partnerData = partnerBody
      }
    }

    if (!updatedUser) {
      updatedUser = await getUserFromCookie()
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
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
