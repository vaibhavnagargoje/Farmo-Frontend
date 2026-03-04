import { NextRequest, NextResponse } from "next/server"
import { API_ENDPOINTS } from "@/lib/api"
import { getValidToken, apiRequest, unauthenticatedResponse } from "@/lib/api-server"

// GET - Check partner status (is the user already a partner?)
export async function GET() {
    try {
        const { response } = await apiRequest(API_ENDPOINTS.PARTNER_STATUS)

        if (!response) {
            return unauthenticatedResponse("Not authenticated")
        }

        const data = await response.json()

        if (!response.ok) {
            return NextResponse.json(
                { message: data.detail || "Failed to fetch partner status" },
                { status: response.status }
            )
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error("Partner status check error:", error)
        return NextResponse.json(
            { message: "Failed to check partner status" },
            { status: 500 }
        )
    }
}

// POST - Register as partner with KYC documents (multipart/form-data)
export async function POST(request: NextRequest) {
    try {
        const token = await getValidToken()

        if (!token) {
            return unauthenticatedResponse("Not authenticated")
        }

        // Parse the incoming multipart form data
        const formData = await request.formData()

        // Build a new FormData to forward to Django
        const djangoFormData = new FormData()

        // Text fields — forward all partner registration fields
        const textFields = ["partner_type", "business_name", "about"]
        for (const field of textFields) {
            const value = formData.get(field)
            if (value && typeof value === "string") {
                djangoFormData.append(field, value)
            }
        }

        // File fields (KYC documents)
        const fileFields = ["aadhar_card_front", "aadhar_card_back", "pan_card"]
        for (const field of fileFields) {
            const file = formData.get(field)
            if (file instanceof File) {
                djangoFormData.append(field, file)
            }
        }

        // Forward to Django backend - do NOT set Content-Type header
        // so fetch auto-sets the multipart boundary
        const response = await fetch(API_ENDPOINTS.PARTNER_REGISTER, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: djangoFormData,
        })

        const data = await response.json()

        if (!response.ok) {
            return NextResponse.json(
                {
                    message: data.error || data.detail || "Failed to register as partner",
                    errors: data,
                },
                { status: response.status }
            )
        }

        return NextResponse.json({
            message: "Partner registration successful",
            partner: data.partner || data,
        })
    } catch (error) {
        console.error("Partner onboarding error:", error)
        return NextResponse.json(
            { message: "Failed to register as partner" },
            { status: 500 }
        )
    }
}
