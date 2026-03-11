/**
 * api-server.ts — Centralized server-side API utilities
 *
 * Every Next.js API route should import from here instead of
 * re-declaring API_BASE_URL, token-refresh logic, or cookie settings.
 */
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { API_ENDPOINTS } from "./api"
import {
    AUTH_COOKIE_NAME,
    REFRESH_COOKIE_NAME,
    USER_COOKIE_NAME,
    cookieOptions,
    ACCESS_TOKEN_MAX_AGE,
    isTokenExpired,
} from "./auth"

// ── Base URLs (single source of truth) ──────────────────────────────
export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"

/** Backend origin without the /api/v1 path — used by the media proxy */
export const BACKEND_ORIGIN = (() => {
    try {
        return new URL(API_BASE_URL).origin
    } catch {
        return "http://127.0.0.1:8000"
    }
})()

// ── Token Management ────────────────────────────────────────────────

/**
 * Read access + refresh tokens from cookies.
 * If the access token is expired but a refresh token exists,
 * automatically refresh and update the cookie.
 *
 * @returns A valid access token string, or `null` if unauthenticated.
 */
export async function getValidToken(): Promise<string | null> {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(AUTH_COOKIE_NAME)?.value
    const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value

    // No tokens at all
    if (!accessToken && !refreshToken) return null

    // Access token is still valid
    if (accessToken && !isTokenExpired(accessToken)) return accessToken

    // Access token missing or expired — try to refresh
    if (refreshToken) {
        try {
            const res = await fetch(API_ENDPOINTS.TOKEN_REFRESH, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh: refreshToken }),
            })

            if (res.ok) {
                const data = await res.json()
                const newToken: string = data.access

                // Persist the fresh access token
                cookieStore.set(AUTH_COOKIE_NAME, newToken, {
                    ...cookieOptions,
                    maxAge: ACCESS_TOKEN_MAX_AGE,
                })

                return newToken
            }

            if (res.status === 401) {
                // Refresh token is truly invalid/expired — clear everything
                cookieStore.delete(AUTH_COOKIE_NAME)
                cookieStore.delete(REFRESH_COOKIE_NAME)
                cookieStore.delete(USER_COOKIE_NAME)
            }
            // On other errors (500, 502, etc.) — keep cookies for retry
        } catch (err) {
            // Network error — don't delete cookies, keep refresh token for retry
            console.error("Token refresh failed:", err)
        }
    }

    return null
}

// ── Request Helpers ─────────────────────────────────────────────────

/**
 * Make an authenticated request to the Django backend.
 * Automatically refreshes the access token if expired.
 *
 * Returns `{ response, token }` on success.
 * Returns `{ response: null, token: null }` if not authenticated
 *   (caller should return 401).
 */
export async function apiRequest(
    url: string,
    options: RequestInit = {}
): Promise<{ response: Response | null; token: string | null }> {
    const token = await getValidToken()

    if (!token) return { response: null, token: null }

    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
    })

    return { response, token }
}

/**
 * Make a public (no-auth) request to the Django backend.
 */
export async function publicApiRequest(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    return fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    })
}

// ── Media URL Rewriting ─────────────────────────────────────────────

/**
 * Rewrite absolute backend media URLs to the Next.js `/api/media/` proxy.
 * Handles both `http://host/media/...` and relative `/media/...` forms.
 */
export function rewriteMediaUrl(
    url: string | null | undefined
): string | null {
    if (!url) return null
    const match = url.match(/https?:\/\/[^/]+\/media\/(.+)/)
    if (match) return `/api/media/${match[1]}`
    if (url.startsWith("/media/")) return `/api/media${url.slice(6)}`
    return url
}

// ── Error Parsing ───────────────────────────────────────────────────

/**
 * Extract a human-readable error message from a Django error response body.
 * Handles the many different formats Django REST Framework can return.
 */
export function extractErrorMessage(
    data: Record<string, unknown>,
    fallback = "Something went wrong"
): string {
    if (typeof data.detail === "string") return data.detail
    if (typeof data.error === "string") return data.error
    if (typeof data.message === "string") return data.message
    if (Array.isArray(data.message)) return (data.message as string[]).join(", ")

    // Check non_field_errors
    if (data.non_field_errors) {
        const nfe = data.non_field_errors
        return Array.isArray(nfe) ? (nfe[0] as string) : String(nfe)
    }

    // Fall back to first field error
    for (const value of Object.values(data)) {
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
            return value[0]
        }
        if (typeof value === "string") return value
    }

    return fallback
}

// ── Unauthenticated Response Helper ─────────────────────────────────

/**
 * Standard 401 JSON response.
 */
export function unauthenticatedResponse(message = "Session expired, please login again") {
    return NextResponse.json({ message }, { status: 401 })
}
