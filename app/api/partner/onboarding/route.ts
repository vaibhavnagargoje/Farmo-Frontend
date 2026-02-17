import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { API_ENDPOINTS } from "@/lib/api"
import { AUTH_COOKIE_NAME, isTokenExpired } from "@/lib/auth"

// POST - Register as partner with KYC documents (multipart/form-data)
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

        // Parse the incoming multipart form data
        const formData = await request.formData()

        // Build a new FormData to forward to Django
        const djangoFormData = new FormData()

        // Text fields
        const textFields = ["partner_type", "business_name", "base_city", "about"]
        for (const field of textFields) {
            const value = formData.get(field)
            if (value && typeof value === "string") {
                djangoFormData.append(field, value)
            }
        }

        // File fields (Aadhar card images)
        const aadharFront = formData.get("aadhar_card_front")
        if (aadharFront instanceof File) {
            djangoFormData.append("aadhar_card_front", aadharFront)
        }

        const aadharBack = formData.get("aadhar_card_back")
        if (aadharBack instanceof File) {
            djangoFormData.append("aadhar_card_back", aadharBack)
        }

        // Forward to Django backend - do NOT set Content-Type header
        // so fetch auto-sets the multipart boundary
        const response = await fetch(API_ENDPOINTS.PARTNER_REGISTER, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
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
