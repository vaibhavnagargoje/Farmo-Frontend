// API Configuration and utilities
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"

export const API_ENDPOINTS = {
  // Auth
  SEND_OTP: `${API_BASE_URL}/users/auth/send-otp/`,
  VERIFY_OTP: `${API_BASE_URL}/users/auth/verify-otp/`,
  USER_PROFILE: `${API_BASE_URL}/users/profile/`,
  
  // Partners
  PARTNER_REGISTER: `${API_BASE_URL}/partners/register/`,
  PARTNER_PROFILE: `${API_BASE_URL}/partners/profile/`,
  PARTNER_DASHBOARD: `${API_BASE_URL}/partners/dashboard/`,
  PARTNER_PUBLIC: (id: number) => `${API_BASE_URL}/partners/${id}/`,
  
  // Services
  CATEGORIES: `${API_BASE_URL}/services/categories/`,
  SERVICES: `${API_BASE_URL}/services/`,
  SERVICE_DETAIL: (id: number) => `${API_BASE_URL}/services/${id}/`,
  MY_SERVICES: `${API_BASE_URL}/services/my/`,
  MY_SERVICE_DETAIL: (id: number) => `${API_BASE_URL}/services/my/${id}/`,
  
  // Bookings - Customer
  CUSTOMER_BOOKINGS: `${API_BASE_URL}/bookings/`,
  CUSTOMER_BOOKING_DETAIL: (id: string) => `${API_BASE_URL}/bookings/${id}/`,
  CUSTOMER_BOOKING_CANCEL: (id: string) => `${API_BASE_URL}/bookings/${id}/cancel/`,
  
  // Bookings - Provider
  PROVIDER_BOOKINGS: `${API_BASE_URL}/bookings/provider/list/`,
  PROVIDER_BOOKING_DETAIL: (id: string) => `${API_BASE_URL}/bookings/provider/${id}/`,
  PROVIDER_BOOKING_ACTION: (id: string) => `${API_BASE_URL}/bookings/provider/${id}/action/`,
  PROVIDER_BOOKING_CANCEL: (id: string) => `${API_BASE_URL}/bookings/provider/${id}/cancel/`,
} as const

// Types for API responses
export interface User {
  id: string // UUID from Django
  phone_number: string
  email: string | null
  role: "CUSTOMER" | "PARTNER" | "ADMIN" | "SUPERADMIN"
  first_name: string
  last_name: string
  is_active: boolean
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface SendOTPResponse {
  message: string
  otp?: string // Only in development mode
}

// Django returns tokens at root level, not nested
export interface VerifyOTPResponse {
  message: string
  is_new_user: boolean
  user: User
  access: string
  refresh: string
}

export interface PartnerProfile {
  id: number
  user: number
  user_phone: string
  partner_type: "LABOR" | "MACHINERY_OWNER" | "TRANSPORTER"
  business_name: string
  about: string
  is_verified: boolean
  is_kyc_submitted: boolean
  base_city: string
  rating: string
  jobs_completed: number
  created_at: string
}

export interface PartnerDashboard {
  business_name: string
  is_verified: boolean
  rating: string
  stats: {
    total_bookings: number
    completed_jobs: number
    pending_jobs: number
    in_progress_jobs: number
    total_earnings: string
  }
}

export interface Category {
  id: number
  name: string
  slug: string
  icon: string
  is_active: boolean
}

export interface Service {
  id: number
  title: string
  description?: string
  price: string
  price_unit: string
  min_order_qty?: number
  category_name?: string
  category?: Category
  partner_name?: string
  partner_rating?: string
  partner?: PartnerProfile
  is_available: boolean
  thumbnail?: string
  location_lat?: string
  location_lng?: string
  service_radius_km?: number
  specifications?: Record<string, string>
  images?: { id: number; image: string; is_thumbnail: boolean }[]
  created_at?: string
  updated_at?: string
}

export interface Booking {
  id: string
  booking_id: string
  service: Service
  provider: PartnerProfile
  customer?: User
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  payment_status: "PENDING" | "PAID" | "REFUNDED"
  scheduled_date: string
  scheduled_time: string
  quantity: number
  total_amount: string
  location_address: string
  location_lat?: string
  location_lng?: string
  customer_notes?: string
  provider_notes?: string
  cancellation_reason?: string
  cancelled_by?: User
  created_at: string
  updated_at: string
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

// Helper to make API calls from server-side with auth token
export async function fetchWithAuth(
  url: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  })
}

// Helper to make public API calls (no auth)
export async function fetchPublic(
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
