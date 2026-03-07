"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/lib/api"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (phoneNumber: string, otp: string) => Promise<{ success: boolean; isNewUser?: boolean; error?: string }>
  logout: () => Promise<void>
  sendOtp: (phoneNumber: string) => Promise<{ success: boolean; otp?: string; error?: string }>
  refreshUser: () => Promise<void>
  updateUser: (userData: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper to get user from cookie (client-side)
function getUserFromCookie(): User | null {
  if (typeof window === "undefined") return null

  const cookies = document.cookie.split(";")
  const userCookie = cookies.find((c) => c.trim().startsWith("farmo_user="))

  if (!userCookie) return null

  try {
    const value = userCookie.split("=")[1]
    return JSON.parse(decodeURIComponent(value))
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Keep a ref to the latest user so memoized callbacks don't need user as a dep
  const userRef = useRef<User | null>(null)
  userRef.current = user

  // Check authentication status on mount
  const checkAuth = useCallback(async () => {
    try {
      // First check cookie directly for faster initial load
      const cookieUser = getUserFromCookie()
      if (cookieUser) {
        setUser(cookieUser)
      }

      // Then verify with server (with timeout to prevent hanging)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else if (response.status === 401) {
        // Only clear user on explicit 401 (truly not authenticated)
        // AND if we do not have a valid user cookie (prevents aggressive logouts on mobile network delays)
        if (!cookieUser) {
          setUser(null)
        }
      }
      // On other errors (500, 502, etc.), keep the cookie-based user
      // This prevents transient backend issues from logging users out
    } catch (error) {
      // Network error / timeout — keep cookie-based user if we have one
      // Only clear if we never had a user at all
      if (!userRef.current) {
        setUser(null)
      }
      console.error("Auth check failed:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Send OTP (memoized to prevent unnecessary re-renders)
  const sendOtp = useCallback(async (phoneNumber: string): Promise<{ success: boolean; otp?: string; error?: string }> => {
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone_number: phoneNumber }),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.message || "Failed to send OTP",
        }
      }

      return {
        success: true,
        otp: data.otp, // Only returned in development mode
      }
    } catch (error) {
      console.error("Send OTP error:", error)
      return {
        success: false,
        error: "Network error. Please try again.",
      }
    }
  }, [])

  // Login with OTP verification (memoized)
  const login = useCallback(async (
    phoneNumber: string,
    otp: string
  ): Promise<{ success: boolean; isNewUser?: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ phone_number: phoneNumber, otp }),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.message || "Invalid OTP",
        }
      }

      // Update user state
      setUser(data.user)

      return {
        success: true,
        isNewUser: data.is_new_user,
      }
    } catch (error) {
      console.error("Login error:", error)
      return {
        success: false,
        error: "Network error. Please try again.",
      }
    }
  }, [])

  // Logout (memoized)
  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setUser(null)
      router.push("/auth")
    }
  }, [router])

  // Directly update user data (e.g., after profile update)
  const updateUser = useCallback((userData: User) => {
    setUser(userData)
  }, [])

  // Refresh user data
  const refreshUser = useCallback(async () => {
    await checkAuth()
  }, [checkAuth])

  const value = useMemo<AuthContextType>(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    sendOtp,
    refreshUser,
    updateUser,
  }), [user, isLoading, login, logout, sendOtp, refreshUser, updateUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
