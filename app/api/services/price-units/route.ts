import { NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"

/**
 * GET /api/services/price-units
 * Returns available price unit choices from the backend.
 * Public endpoint, no auth required.
 */
export async function GET() {
  try {
    const res = await fetch(`${API_BASE_URL}/services/price-units/`, {
      headers: {
        "Content-Type": "application/json",
      },
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error("Error fetching price units:", error)
    return NextResponse.json(
      { error: "Failed to fetch price units" },
      { status: 500 }
    )
  }
}
