import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { API_ENDPOINTS } from "@/lib/api"
import { AUTH_COOKIE_NAME, isTokenExpired } from "@/lib/auth"

// POST - Create a new service with images (multipart/form-data)
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
        const textFields = [
            "category", "title", "description", "price", "price_unit",
            "location_lat", "location_lng", "service_radius_km"
        ]
        for (const field of textFields) {
            const value = formData.get(field)
            if (value && typeof value === "string") {
                djangoFormData.append(field, value)
            }
        }

        // Image files (multiple)
        const images = formData.getAll("images")
        for (const image of images) {
            if (image instanceof File) {
                djangoFormData.append("images", image)
            }
        }

        // Forward to Django backend
        const response = await fetch(API_ENDPOINTS.MY_SERVICES, {
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
                    message: data.error || data.detail || "Failed to create service",
                    errors: data,
                },
                { status: response.status }
            )
        }

        return NextResponse.json({
            message: "Service created successfully",
            service: data.service || data,
        })
    } catch (error) {
        console.error("Service creation error:", error)
        return NextResponse.json(
            { message: "Failed to create service" },
            { status: 500 }
        )
    }
}
