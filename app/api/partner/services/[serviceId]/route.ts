import { NextRequest, NextResponse } from "next/server"
import { API_ENDPOINTS } from "@/lib/api"
import { apiRequest, unauthenticatedResponse } from "@/lib/api-server"

// PATCH - Update a service (price, description, availability, etc.)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ serviceId: string }> }
) {
    try {
        const { serviceId } = await params
        const body = await request.json()

        const { response } = await apiRequest(
            API_ENDPOINTS.MY_SERVICE_DETAIL(Number(serviceId)),
            {
                method: "PATCH",
                body: JSON.stringify(body),
            }
        )

        if (!response) {
            return unauthenticatedResponse("Not authenticated")
        }

        const data = await response.json()

        if (!response.ok) {
            return NextResponse.json(
                { message: data.error || data.detail || "Failed to update service" },
                { status: response.status }
            )
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error("Service update error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}

// DELETE - Delete a service
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ serviceId: string }> }
) {
    try {
        const { serviceId } = await params

        const { response } = await apiRequest(
            API_ENDPOINTS.MY_SERVICE_DETAIL(Number(serviceId)),
            { method: "DELETE" }
        )

        if (!response) {
            return unauthenticatedResponse("Not authenticated")
        }

        if (response.status === 204) {
            return NextResponse.json({ message: "Service deleted successfully" })
        }

        if (!response.ok) {
            const data = await response.json()
            return NextResponse.json(
                { message: data.error || data.detail || "Failed to delete service" },
                { status: response.status }
            )
        }

        return NextResponse.json({ message: "Service deleted successfully" })
    } catch (error) {
        console.error("Service delete error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}
