import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { API_ENDPOINTS, fetchWithAuth } from "@/lib/api"
import {
  AUTH_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  USER_COOKIE_NAME,
  isTokenExpired,
  setAuthCookies,
} from "@/lib/auth"

// GET - Fetch current user profile
export async function GET() {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(AUTH_COOKIE_NAME)?.value
    const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value

    if (!accessToken) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      )
    }

    let token = accessToken

    // If access token is expired, try to refresh
    if (isTokenExpired(accessToken) && refreshToken) {
      const refreshResponse = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/users/auth/token/refresh/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: refreshToken }),
        }
      )

      if (refreshResponse.ok) {
        const data = await refreshResponse.json()
        token = data.access

        // Update the access token cookie
        cookieStore.set(AUTH_COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60, // 1 hour
        })
      } else {
        return NextResponse.json(
          { message: "Session expired, please login again" },
          { status: 401 }
        )
      }
    }

    // 1. Fetch user profile from USER_PROFILE endpoint (always works for logged-in users)
    const userResponse = await fetchWithAuth(API_ENDPOINTS.USER_PROFILE, token)
    let userData = null

    if (userResponse.ok) {
      userData = await userResponse.json()
    } else {
      // Fallback to user cookie if user profile endpoint fails
      const userCookie = cookieStore.get(USER_COOKIE_NAME)?.value
      if (userCookie) {
        userData = { user: JSON.parse(userCookie), profile: null }
      }
    }

    // 2. Try to fetch partner profile (may not exist)
    let partnerData = null
    try {
      const partnerResponse = await fetchWithAuth(API_ENDPOINTS.PARTNER_PROFILE, token)
      if (partnerResponse.ok) {
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
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(AUTH_COOKIE_NAME)?.value
    const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value

    if (!accessToken) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      )
    }

    let token = accessToken

    // If access token is expired, try to refresh
    if (isTokenExpired(accessToken) && refreshToken) {
      const refreshResponse = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/users/auth/token/refresh/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: refreshToken }),
        }
      )

      if (refreshResponse.ok) {
        const data = await refreshResponse.json()
        token = data.access

        cookieStore.set(AUTH_COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60,
        })
      } else {
        return NextResponse.json(
          { message: "Session expired, please login again" },
          { status: 401 }
        )
      }
    }

    const body = await request.json()
    const { first_name, last_name, address, ...otherData } = body

    // 1. Update basic User info (Name) via /users/profile/
    if (first_name !== undefined || last_name !== undefined) {
      const userUpdatePayload: any = {}
      if (first_name) userUpdatePayload.first_name = first_name
      if (last_name) userUpdatePayload.last_name = last_name
      if (address) userUpdatePayload.village = address // Update CustomerProfile default_address as well

      await fetchWithAuth(API_ENDPOINTS.USER_PROFILE, token, {
        method: "POST",
        body: JSON.stringify(userUpdatePayload)
      })
    }

    // 2. Update Partner Profile (Address/City) if exists
    let partnerData = null

    // We attempt to update partner profile if address or other partner fields are present
    const partnerPayload: any = { ...otherData }
    if (address) partnerPayload.base_city = address

    if (Object.keys(partnerPayload).length > 0) {
      const partnerResponse = await fetchWithAuth(API_ENDPOINTS.PARTNER_PROFILE, token, {
        method: "PATCH",
        body: JSON.stringify(partnerPayload),
      })

      if (partnerResponse.ok) {
        partnerData = await partnerResponse.json()
      }
    }

    // 3. Update User Cookie
    const userCookie = cookieStore.get(USER_COOKIE_NAME)?.value
    let user = userCookie ? JSON.parse(userCookie) : null

    if (user && (first_name || last_name)) {
      if (first_name) user.first_name = first_name
      if (last_name) user.last_name = last_name

      cookieStore.set(USER_COOKIE_NAME, JSON.stringify(user), {
        httpOnly: false, // Ensure client side can read it if needed
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      })
    }

    // If no partner data fetched yet (but we didn't fail), try to fetch it to return consistent response
    // Or just return what we have.

    return NextResponse.json({
      message: "Profile updated successfully",
      user,
      partner: partnerData
    })

  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 }
    )
  }
}

