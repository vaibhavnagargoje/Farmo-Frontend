import { NextRequest, NextResponse } from "next/server"
import { API_ENDPOINTS } from "@/lib/api"
import { apiRequest, unauthenticatedResponse } from "@/lib/api-server"

/**
 * POST /api/notifications/register-device
 * Registers an FCM device token for the authenticated user.
 * Proxies to Django: POST /api/v1/notifications/register-device/
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.token) {
      return NextResponse.json(
        { message: "FCM token is required" },
        { status: 400 }
      )
    }

    const { response } = await apiRequest(
      API_ENDPOINTS.REGISTER_DEVICE,
      {
        method: "POST",
        body: JSON.stringify({ token: body.token }),
      }
    )

    if (!response) {
      return unauthenticatedResponse("Please login to register device")
    }

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: data.message || "Device registered successfully",
      })
    } else {
      return NextResponse.json(
        { message: data.message || "Failed to register device" },
        { status: response.status }
      )
    }
  } catch (error) {
    console.error("Device registration error:", error)
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
