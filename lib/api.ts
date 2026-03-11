// API Configuration and utilities
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

export const API_ENDPOINTS = {
  // Auth
  SEND_OTP: `${API_BASE_URL}/users/auth/send-otp/`,
  VERIFY_OTP: `${API_BASE_URL}/users/auth/verify-otp/`,
  TOKEN_REFRESH: `${API_BASE_URL}/users/auth/token/refresh/`,
  USER_PROFILE: `${API_BASE_URL}/users/profile/`,

  // Location (moved to locations app)
  USER_LOCATION: `${API_BASE_URL}/locations/user-location/`,
  STATES: `${API_BASE_URL}/locations/states/`,
  DISTRICTS: `${API_BASE_URL}/locations/districts/`,
  TAHSILS: `${API_BASE_URL}/locations/tahsils/`,
  VILLAGES: `${API_BASE_URL}/locations/villages/`,

  // Partners
  PARTNER_STATUS: `${API_BASE_URL}/partners/status/`,
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

  // Instant Bookings
  INSTANT_BOOKING_CREATE: `${API_BASE_URL}/bookings/instant/`,
  INSTANT_BOOKING_STATUS: (id: string) => `${API_BASE_URL}/bookings/instant/${id}/status/`,

  // Provider Instant Requests
  PROVIDER_INSTANT_REQUESTS: `${API_BASE_URL}/bookings/provider/instant-requests/`,
  PROVIDER_INSTANT_REQUEST_ACCEPT: (id: number) => `${API_BASE_URL}/bookings/provider/instant-requests/${id}/accept/`,
  PROVIDER_INSTANT_REQUEST_DECLINE: (id: number) => `${API_BASE_URL}/bookings/provider/instant-requests/${id}/decline/`,

  // Price Units
  PRICE_UNITS: `${API_BASE_URL}/services/price-units/`,

} as const

// Types for API responses
export interface User {
  id: string // UUID from Django
  phone_number: string
  email: string | null
  role: "CUSTOMER" | "PARTNER" | "ADMIN" | "SUPERADMIN"
  full_name: string
  is_active: boolean
}

export interface CustomerProfile {
  full_name: string
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
  full_name: string
  partner_type: "LABOR" | "MACHINERY_OWNER" | "TRANSPORTER"
  about: string
  is_verified: boolean
  is_kyc_submitted: boolean
  rating: string
  jobs_completed: number
  created_at: string
}

export interface PartnerDashboard {
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
  instant_price: string
  instant_price_unit: string
  instant_enabled: boolean
  instant_timeout_minutes?: number
  instant_search_radius_km?: number
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
  partner_location?: { latitude: string; longitude: string; address: string } | null
  service_radius_km?: number
  specifications?: Record<string, string>
  images?: { id: number; image: string; is_thumbnail: boolean }[]
  created_at?: string
  updated_at?: string
}

export interface Booking {
  id: string
  booking_id: string
  booking_type: "SCHEDULED" | "INSTANT"
  order_number: string | null
  service: Service
  provider: PartnerProfile
  customer?: User
  status: "PENDING" | "SEARCHING" | "CONFIRMED" | "REJECTED" | "EXPIRED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  payment_status: "PENDING" | "PAID" | "FAILED" | "REFUNDED"
  category_name?: string | null
  scheduled_date: string
  scheduled_time: string
  expires_at?: string | null
  broadcast_count: number
  current_broadcast_radius?: string | null
  assigned_at?: string | null
  quantity: number
  price_unit?: string
  unit_price: string
  total_amount: string
  address: string
  lat?: string
  lng?: string
  note?: string
  cancellation_reason?: string
  cancelled_by?: User

  work_started_at?: string
  work_completed_at?: string
  start_job_otp?: string
  end_job_otp?: string
  created_at: string
  updated_at: string
}



export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

export interface PriceUnit {
  value: string
  label: string
}

export interface InstantBookingStatus {
  booking_id: string
  order_number: string | null
  status: "PENDING" | "SEARCHING" | "CONFIRMED" | "REJECTED" | "EXPIRED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  booking_type: "INSTANT"
  category_name: string | null
  quantity: number
  price_unit: string
  unit_price: string
  total_amount: string
  broadcast_count: number
  current_broadcast_radius: string | null
  expires_at: string | null
  assigned_at: string | null
  created_at: string
  providers_notified: number
  providers_declined: number
  provider?: {
    id: number
    full_name: string
    rating: string
    jobs_completed: number
    phone: string
  }
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
