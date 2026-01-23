import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { API_ENDPOINTS, fetchWithAuth } from "@/lib/api"
import { AUTH_COOKIE_NAME, isTokenExpired } from "@/lib/auth"

// POST - Register as a partner
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(AUTH_COOKIE_NAME)?.value

    if (!accessToken) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      )
    }

    if (isTokenExpired(accessToken)) {
      return NextResponse.json(
        { message: "Session expired, please login again" },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate required fields
    const requiredFields = ["partner_type", "business_name", "base_city"]
    const missingFields = requiredFields.filter((field) => !body[field])

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          message: "Missing required fields",
          errors: missingFields.reduce(
            (acc, field) => ({ ...acc, [field]: ["This field is required"] }),
            {}
          ),
        },
        { status: 400 }
      )
    }

    // Register as partner
    const response = await fetchWithAuth(
      API_ENDPOINTS.PARTNER_REGISTER,
      accessToken,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        {
          message: error.detail || "Failed to register as partner",
          errors: error,
        },
        { status: response.status }
      )
    }

    const partnerData = await response.json()

    return NextResponse.json({
      message: "Partner registration successful",
      partner: partnerData,
    })
  } catch (error) {
    console.error("Partner registration error:", error)
    return NextResponse.json(
      { message: "Failed to register as partner" },
      { status: 500 }
    )
  }
}
