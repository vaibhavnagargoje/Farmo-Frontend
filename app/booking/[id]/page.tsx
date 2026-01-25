"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { OTPModal } from "@/components/otp-modal"
import { DesktopHeader } from "@/components/desktop-header"
import { MobileHeader } from "@/components/mobile-header"
import { BottomNav } from "@/components/bottom-nav"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

// Booking Detail Type
interface BookingDetail {
  id: number
  booking_id: string
  status: "PENDING" | "CONFIRMED" | "REJECTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  payment_status: "PENDING" | "PAID" | "REFUNDED"
  service: {
    id: number
    title: string
    description?: string
    price: string
    price_unit: string
    thumbnail?: string
    category_name?: string
  }
  provider: {
    id: number
    business_name: string
    rating: string
    jobs_completed: number
    user_phone?: string
  }
  scheduled_date: string
  scheduled_time: string
  work_started_at?: string
  work_completed_at?: string
  start_job_otp?: string
  end_job_otp?: string
  address: string
  lat?: string
  lng?: string
  quantity: number
  unit_price: string
  total_amount: string
  note?: string
  cancellation_reason?: string
  created_at: string
  updated_at: string
}

// Status config
const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  PENDING: { label: "Pending Confirmation", color: "text-yellow-600", bgColor: "bg-yellow-100", icon: "schedule" },
  CONFIRMED: { label: "Confirmed", color: "text-primary", bgColor: "bg-primary/10", icon: "check_circle" },
  REJECTED: { label: "Rejected", color: "text-destructive", bgColor: "bg-destructive/10", icon: "cancel" },
  IN_PROGRESS: { label: "In Progress", color: "text-blue-600", bgColor: "bg-blue-100", icon: "sync" },
  COMPLETED: { label: "Completed", color: "text-success", bgColor: "bg-success/10", icon: "task_alt" },
  CANCELLED: { label: "Cancelled", color: "text-muted", bgColor: "bg-muted", icon: "block" },
}

export default function BookingDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const bookingId = params.id as string

  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showOTP, setShowOTP] = useState(false)

  // Fetch booking details
  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) return

      setIsLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/booking/${bookingId}`, {
          method: "GET",
          credentials: "include",
        })

        const data = await res.json()

        if (res.ok && data.success) {
          setBooking(data.booking)
        } else if (res.status === 401) {
          setError("Please login to view this booking")
        } else {
          setError(data.message || "Booking not found")
        }
      } catch (err) {
        console.error("Error fetching booking:", err)
        setError("Unable to load booking details")
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading) {
      fetchBooking()
    }
  }, [bookingId, authLoading])

  // Format date for display
  const formatDate = (dateStr: string, timeStr?: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    let dateDisplay = ""
    if (date.toDateString() === today.toDateString()) {
      dateDisplay = "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateDisplay = "Yesterday"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dateDisplay = "Tomorrow"
    } else {
      dateDisplay = date.toLocaleDateString("en-IN", { 
        weekday: "short", 
        day: "numeric", 
        month: "short", 
        year: "numeric" 
      })
    }
    
    if (timeStr) {
      const [hours, minutes] = timeStr.split(":")
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? "PM" : "AM"
      const hour12 = hour % 12 || 12
      dateDisplay += `, ${hour12}:${minutes} ${ampm}`
    }
    
    return dateDisplay
  }

  // Get price unit display
  const getPriceUnit = (unit: string) => {
    switch (unit) {
      case "HOUR": return "/hr"
      case "DAY": return "/day"
      case "ACRE": return "/acre"
      case "KM": return "/km"
      default: return ""
    }
  }

  // Loading state
  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <DesktopHeader variant="farmer" />
        <MobileHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !booking) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <DesktopHeader variant="farmer" />
        <MobileHeader />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <span className="material-symbols-outlined text-6xl text-muted mb-4">error</span>
          <h2 className="text-xl font-bold text-foreground mb-2">{error || "Booking not found"}</h2>
          <Link href="/bookings" className="text-primary font-semibold mt-4">
            Back to Bookings
          </Link>
        </div>
        <BottomNav variant="farmer" />
      </div>
    )
  }

  const status = statusConfig[booking.status] || statusConfig.PENDING

  return (
    <div className="min-h-screen flex flex-col pb-24 lg:pb-0 bg-background">
      {/* Desktop Header */}
      <DesktopHeader variant="farmer" />
      <MobileHeader />

      {/* Mobile Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm pt-4 pb-3 px-4 border-b border-border lg:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/bookings"
            className="size-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground shadow-sm"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Booking Details</h1>
            <p className="text-xs text-muted">#{booking.booking_id}</p>
          </div>
          <div className={cn("px-3 py-1 rounded-full text-xs font-bold", status.bgColor, status.color)}>
            {status.label}
          </div>
        </div>
      </header>

      {/* Desktop Layout */}
      <div className="hidden lg:block max-w-5xl mx-auto w-full px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/bookings"
            className="size-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground shadow-sm hover:bg-muted/50 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">Booking #{booking.booking_id}</h1>
              <span className={cn("px-3 py-1 rounded-full text-sm font-bold", status.bgColor, status.color)}>
                {status.label}
              </span>
            </div>
            <p className="text-muted">Created {formatDate(booking.created_at)}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="col-span-2 flex flex-col gap-6">
            {/* Service Card */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <div className="flex gap-6">
                <div className="size-32 rounded-xl overflow-hidden shrink-0 bg-muted">
                  {booking.service.thumbnail ? (
                    <Image
                      src={booking.service.thumbnail}
                      alt={booking.service.title}
                      width={128}
                      height={128}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-muted-foreground">agriculture</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-primary font-semibold mb-1">{booking.service.category_name}</p>
                  <h2 className="text-2xl font-bold text-foreground">{booking.service.title}</h2>
                  <p className="text-muted mt-1">by {booking.provider.business_name}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-2xl font-bold text-navy">₹{booking.service.price}</span>
                    <span className="text-muted">{getPriceUnit(booking.service.price_unit)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <h3 className="font-bold text-lg text-foreground mb-4">Booking Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between items-center py-3 px-4 bg-background rounded-xl">
                  <span className="text-muted">Scheduled</span>
                  <span className="font-semibold text-foreground">{formatDate(booking.scheduled_date, booking.scheduled_time)}</span>
                </div>
                <div className="flex justify-between items-center py-3 px-4 bg-background rounded-xl">
                  <span className="text-muted">Quantity</span>
                  <span className="font-semibold text-foreground">{booking.quantity} {booking.service.price_unit === "HOUR" ? "Hours" : booking.service.price_unit === "ACRE" ? "Acres" : "Units"}</span>
                </div>
                <div className="col-span-2 flex justify-between items-center py-3 px-4 bg-background rounded-xl">
                  <span className="text-muted">Location</span>
                  <span className="font-semibold text-foreground text-right">{booking.address}</span>
                </div>
                {booking.note && (
                  <div className="col-span-2 flex flex-col gap-2 py-3 px-4 bg-background rounded-xl">
                    <span className="text-muted text-sm">Note</span>
                    <span className="text-foreground">{booking.note}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center py-4 mt-4 border-t border-border">
                <span className="text-lg font-medium text-foreground">Total Amount</span>
                <span className="font-bold text-2xl text-primary">₹{booking.total_amount}</span>
              </div>
            </div>

            {/* OTP Section for Confirmed Bookings */}
            {booking.status === "CONFIRMED" && booking.start_job_otp && (
              <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-primary text-2xl">key</span>
                  <h3 className="font-bold text-lg text-foreground">Start OTP</h3>
                </div>
                <p className="text-muted text-sm mb-3">Share this OTP with the service provider to start the job</p>
                <div className="flex justify-center gap-2">
                  {booking.start_job_otp.split("").map((digit, i) => (
                    <div key={i} className="size-14 bg-white rounded-xl flex items-center justify-center text-2xl font-bold text-navy border border-border">
                      {digit}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completion OTP for In-Progress */}
            {booking.status === "IN_PROGRESS" && (
              <div className="bg-success/5 border-2 border-success/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-success text-2xl">verified</span>
                  <h3 className="font-bold text-lg text-foreground">Job In Progress</h3>
                </div>
                <p className="text-muted text-sm">The service provider has started working on your booking. You will receive a completion OTP when the job is done.</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="col-span-1 flex flex-col gap-6">
            {/* Partner Info */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <h3 className="font-bold text-lg text-foreground mb-4">Service Provider</h3>
              <div className="flex flex-col items-center gap-4">
                <div className="size-20 rounded-full bg-muted flex items-center justify-center border-2 border-primary/20">
                  <span className="material-symbols-outlined text-3xl text-muted-foreground">person</span>
                </div>
                <div className="text-center">
                  <p className="font-bold text-foreground text-lg">{booking.provider.business_name}</p>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <span className="material-symbols-outlined text-yellow-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="text-sm font-bold">{booking.provider.rating || "New"}</span>
                    <span className="text-xs text-muted">• {booking.provider.jobs_completed} jobs</span>
                  </div>
                </div>
                {booking.provider.user_phone && (
                  <a 
                    href={`tel:${booking.provider.user_phone}`}
                    className="w-full h-11 rounded-xl bg-success/10 text-success flex items-center justify-center gap-2 font-medium hover:bg-success/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">call</span>
                    Call Provider
                  </a>
                )}
              </div>
            </div>

            {/* Payment Status */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <h3 className="font-bold text-foreground mb-3">Payment</h3>
              <div className="flex items-center justify-between">
                <span className="text-muted">Status</span>
                <span className={cn(
                  "px-2 py-1 rounded text-xs font-bold",
                  booking.payment_status === "PAID" ? "bg-success/10 text-success" : "bg-yellow-100 text-yellow-600"
                )}>
                  {booking.payment_status}
                </span>
              </div>
            </div>

            {/* Help */}
            <div className="bg-muted/30 rounded-2xl p-4 text-center">
              <p className="text-sm text-muted">Need help with your booking?</p>
              <button className="text-primary font-semibold text-sm mt-1 hover:underline">Contact Support</button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Content */}
      <main className="flex-1 p-4 flex flex-col gap-4 lg:hidden">
        {/* Status Banner */}
        <div className={cn("rounded-xl p-4 flex items-center gap-3", status.bgColor)}>
          <span className={cn("material-symbols-outlined text-2xl", status.color)}>{status.icon}</span>
          <div>
            <p className={cn("font-bold", status.color)}>{status.label}</p>
            <p className="text-xs text-muted">Updated {formatDate(booking.updated_at)}</p>
          </div>
        </div>

        {/* Service Card */}
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
          <div className="flex gap-4">
            <div className="size-20 rounded-xl overflow-hidden shrink-0 bg-muted">
              {booking.service.thumbnail ? (
                <Image
                  src={booking.service.thumbnail}
                  alt={booking.service.title}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-muted-foreground">agriculture</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs text-primary font-semibold">{booking.service.category_name}</p>
              <h2 className="text-lg font-bold text-foreground">{booking.service.title}</h2>
              <p className="text-sm text-muted">by {booking.provider.business_name}</p>
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border flex flex-col gap-3">
          <h3 className="font-bold text-foreground">Booking Details</h3>

          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-muted text-sm">Scheduled</span>
            <span className="font-semibold text-foreground text-sm">{formatDate(booking.scheduled_date, booking.scheduled_time)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-muted text-sm">Quantity</span>
            <span className="font-semibold text-foreground">{booking.quantity} {booking.service.price_unit === "HOUR" ? "Hours" : "Units"}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-muted text-sm">Location</span>
            <span className="font-semibold text-foreground text-sm text-right max-w-[60%]">{booking.address}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-muted text-sm">Total Amount</span>
            <span className="font-bold text-xl text-primary">₹{booking.total_amount}</span>
          </div>
        </div>

        {/* OTP Section */}
        {booking.status === "CONFIRMED" && booking.start_job_otp && (
          <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary">key</span>
              <h3 className="font-bold text-foreground">Start OTP</h3>
            </div>
            <p className="text-muted text-xs mb-3">Share with provider to start</p>
            <div className="flex justify-center gap-2">
              {booking.start_job_otp.split("").map((digit, i) => (
                <div key={i} className="size-12 bg-white rounded-xl flex items-center justify-center text-xl font-bold text-navy border border-border">
                  {digit}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Provider Info */}
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
          <h3 className="font-bold text-foreground mb-3">Service Provider</h3>
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-full bg-muted flex items-center justify-center border-2 border-primary/20">
              <span className="material-symbols-outlined text-2xl text-muted-foreground">person</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-foreground">{booking.provider.business_name}</p>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-yellow-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="text-sm font-semibold">{booking.provider.rating || "New"}</span>
                <span className="text-xs text-muted">• {booking.provider.jobs_completed} jobs</span>
              </div>
            </div>
            {booking.provider.user_phone && (
              <a 
                href={`tel:${booking.provider.user_phone}`}
                className="size-12 rounded-full bg-success/10 text-success flex items-center justify-center"
              >
                <span className="material-symbols-outlined">call</span>
              </a>
            )}
          </div>
        </div>
      </main>

      <BottomNav variant="farmer" />
      
      {showOTP && booking.start_job_otp && (
        <OTPModal code={booking.start_job_otp} isOpen={showOTP} onDismiss={() => setShowOTP(false)} />
      )}
    </div>
  )
}
