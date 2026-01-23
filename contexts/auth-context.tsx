"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
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

  // Check authentication status on mount
  const checkAuth = useCallback(async () => {
    try {
      // First check cookie directly for faster initial load
      const cookieUser = getUserFromCookie()
      if (cookieUser) {
        setUser(cookieUser)
      }

      // Then verify with server
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Send OTP
  const sendOtp = async (phoneNumber: string): Promise<{ success: boolean; otp?: string; error?: string }> => {
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
  }

  // Login with OTP verification
  const login = async (
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
  }

  // Logout
  const logout = async () => {
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
  }

  // Refresh user data
  const refreshUser = async () => {
    await checkAuth()
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    sendOtp,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
