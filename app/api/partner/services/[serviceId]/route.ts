import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { API_ENDPOINTS, fetchWithAuth } from "@/lib/api"
import { AUTH_COOKIE_NAME, isTokenExpired } from "@/lib/auth"

// PATCH - Update a service (price, description, availability, etc.)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ serviceId: string }> }
) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

        if (!token || isTokenExpired(token)) {
            return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
        }

        const { serviceId } = await params
        const body = await request.json()

        const response = await fetchWithAuth(
            API_ENDPOINTS.MY_SERVICE_DETAIL(Number(serviceId)),
            token,
            {
                method: "PATCH",
                body: JSON.stringify(body),
            }
        )

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
        const cookieStore = await cookies()
        const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

        if (!token || isTokenExpired(token)) {
            return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
        }

        const { serviceId } = await params

        const response = await fetchWithAuth(
            API_ENDPOINTS.MY_SERVICE_DETAIL(Number(serviceId)),
            token,
            { method: "DELETE" }
        )

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
