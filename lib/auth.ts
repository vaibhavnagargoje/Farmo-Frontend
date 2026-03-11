import { cookies } from "next/headers"
import { jwtDecode } from "jwt-decode"
import type { User } from "./api"

// Cookie configuration
export const AUTH_COOKIE_NAME = "farmo_access_token"
export const REFRESH_COOKIE_NAME = "farmo_refresh_token"
export const USER_COOKIE_NAME = "farmo_user"

// Cookie options for HTTP-only secure cookies
export const cookieOptions = {
  httpOnly: true,
  // Secure is required for SameSite='None', but strict/lax work on http (localhost)
  // Only use secure=true if we are on production AND using an HTTPS API
  secure: process.env.NODE_ENV === "production" && !!process.env.NEXT_PUBLIC_API_URL?.startsWith("https"),
  sameSite: "lax" as const,
  path: "/",
}

// Access token expires in 60 minutes (from your Django settings)
export const ACCESS_TOKEN_MAX_AGE = 60 * 60 // 1 hour in seconds

// Refresh token expires in 7 days
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds

interface JWTPayload {
  token_type: string
  exp: number
  iat: number
  jti: string
  user_id: number
}

// Check if token is expired
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<JWTPayload>(token)
    const currentTime = Date.now() / 1000
    return decoded.exp < currentTime
  } catch {
    return true
  }
}

// Get tokens from cookies (server-side)
export async function getTokensFromCookies() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(AUTH_COOKIE_NAME)?.value
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value
  const userCookie = cookieStore.get(USER_COOKIE_NAME)?.value

  let user: User | null = null
  if (userCookie) {
    try {
      user = JSON.parse(userCookie)
    } catch {
      user = null
    }
  }

  return { accessToken, refreshToken, user }
}

// Set auth cookies (called from API routes)
export function setAuthCookies(
  cookieStore: ReturnType<typeof cookies> extends Promise<infer T> ? T : never,
  accessToken: string,
  refreshToken: string,
  user: User
) {
  // Set access token
  cookieStore.set(AUTH_COOKIE_NAME, accessToken, {
    ...cookieOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  })

  // Set refresh token
  cookieStore.set(REFRESH_COOKIE_NAME, refreshToken, {
    ...cookieOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  })

  // Set user info (not http-only so client can read it)
  cookieStore.set(USER_COOKIE_NAME, JSON.stringify(user), {
    ...cookieOptions,
    httpOnly: false, // Allow client to read user info
    maxAge: REFRESH_TOKEN_MAX_AGE,
  })
}

// Clear auth cookies (logout)
export function clearAuthCookies(
  cookieStore: ReturnType<typeof cookies> extends Promise<infer T> ? T : never
) {
  cookieStore.delete(AUTH_COOKIE_NAME)
  cookieStore.delete(REFRESH_COOKIE_NAME)
  cookieStore.delete(USER_COOKIE_NAME)
}

// Check if user is authenticated (server-side)
export async function isAuthenticated(): Promise<boolean> {
  const { accessToken, refreshToken } = await getTokensFromCookies()

  if (!accessToken && !refreshToken) {
    return false
  }

  if (accessToken && !isTokenExpired(accessToken)) {
    return true
  }

  // If access token is expired but refresh token exists, we can try to refresh
  if (refreshToken && !isTokenExpired(refreshToken)) {
    return true // Will need to refresh on next request
  }

  return false
}

// Get current user (server-side)
export async function getCurrentUser(): Promise<User | null> {
  // Use dynamic import to avoid circular dependency with api-server.ts
  const { getValidToken } = await import("./api-server")
  const token = await getValidToken()

  if (!token) {
    return null
  }

  const { user } = await getTokensFromCookies()
  return user
}
