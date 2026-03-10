import { NextRequest, NextResponse } from "next/server"
import { API_ENDPOINTS } from "@/lib/api"
import { apiRequest, getValidToken, unauthenticatedResponse } from "@/lib/api-server"

// GET - List partner's own services
export async function GET() {
    try {
        const { response } = await apiRequest(API_ENDPOINTS.MY_SERVICES)

        if (!response) {
            return unauthenticatedResponse("Not authenticated")
        }

        const data = await response.json()

        if (!response.ok) {
            return NextResponse.json(
                { message: data.detail || "Failed to fetch services" },
                { status: response.status }
            )
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error("Fetch services error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}

// POST - Create a new service with images (multipart/form-data)
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

        // Forward to Django backend — don't set Content-Type (fetch auto-sets multipart boundary)
        const response = await fetch(API_ENDPOINTS.MY_SERVICES, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: djangoFormData,
        })

        // Safety: check that the response is JSON before trying to parse
        const contentType = response.headers.get("content-type") || ""
        if (!contentType.includes("application/json")) {
            const text = await response.text()
            console.error("Service creation returned non-JSON:", response.status, text.slice(0, 200))
            return NextResponse.json(
                { message: `Server error (${response.status}). Please try again.` },
                { status: response.status || 500 }
            )
        }

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
