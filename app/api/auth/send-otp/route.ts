import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { API_ENDPOINTS } from "@/lib/api"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone_number, email } = body

    if (!phone_number || !email) {
      return NextResponse.json(
        { message: "Phone number and email are required" },
        { status: 400 }
      )
    }

    // Call Django backend
    const response = await fetch(API_ENDPOINTS.SEND_OTP, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone_number, email }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    // Return success response
    return NextResponse.json({
      message: data.message || "OTP sent to your email",
    })
  } catch (error) {
    console.error("Send OTP error:", error)
    return NextResponse.json(
      { message: "Failed to send OTP. Please try again." },
      { status: 500 }
    )
  }
}
