import { NextRequest, NextResponse } from "next/server"
import { API_ENDPOINTS } from "@/lib/api"
import { apiRequest, getValidToken, unauthenticatedResponse } from "@/lib/api-server"

// GET – Retrieve partner's labor details
export async function GET() {
    try {
        const { response } = await apiRequest(API_ENDPOINTS.LABOR_DETAILS)

        if (!response) {
            return unauthenticatedResponse("Not authenticated")
        }

        const data = await response.json()

        if (!response.ok) {
            return NextResponse.json(
                { message: data.detail || data.error || "Failed to fetch labor details" },
                { status: response.status }
            )
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error("Fetch labor details error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}

// PATCH – Update partner's labor details (supports multipart for skill_card_photo)
export async function PATCH(request: NextRequest) {
    try {
        const token = await getValidToken()
        if (!token) {
            return unauthenticatedResponse("Not authenticated")
        }

        const contentType = request.headers.get("content-type") || ""

        let fetchOptions: RequestInit

        if (contentType.includes("multipart/form-data")) {
            // Forward multipart as-is
            const formData = await request.formData()
            const djangoFormData = new FormData()

            const textFields = ["skills", "daily_wage_estimate", "is_migrant_worker"]
            for (const field of textFields) {
                const value = formData.get(field)
                if (value && typeof value === "string") {
                    djangoFormData.append(field, value)
                }
            }
            const photo = formData.get("skill_card_photo")
            if (photo instanceof File) {
                djangoFormData.append("skill_card_photo", photo)
            }

            fetchOptions = {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
                body: djangoFormData,
            }
        } else {
            // Forward JSON
            const body = await request.text()
            fetchOptions = {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body,
            }
        }

        const response = await fetch(API_ENDPOINTS.LABOR_DETAILS, fetchOptions)
        const data = await response.json()

        if (!response.ok) {
            return NextResponse.json(
                { message: data.detail || data.error || "Failed to update labor details" },
                { status: response.status }
            )
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error("Update labor details error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}
