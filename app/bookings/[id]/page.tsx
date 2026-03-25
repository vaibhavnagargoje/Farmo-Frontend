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

import { useLanguage } from "@/contexts/language-context"

// Booking Detail Type
interface BookingDetail {
  id: number
  booking_id: string
  booking_type: "SCHEDULED" | "INSTANT"
  order_number: string | null
  status: "PENDING" | "SEARCHING" | "CONFIRMED" | "REJECTED" | "EXPIRED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  payment_status: "PENDING" | "PAID" | "REFUNDED"
  category_name?: string
  price_unit: string
  service: {
    id: number
    title: string
    description?: string
    price: string
    price_unit: string
    thumbnail?: string
    category_name?: string
  } | null
  provider: {
    id: number
    full_name: string
    rating: string
    jobs_completed: number
    user_phone?: string
  } | null
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
  broadcast_count: number
  current_broadcast_radius: number | null
  assigned_at: string | null
  note?: string
  cancellation_reason?: string
  created_at: string
  updated_at: string
}

// Status config
const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  PENDING: { label: "Pending Confirmation", color: "text-yellow-600", bgColor: "bg-yellow-100", icon: "schedule" },
  SEARCHING: { label: "Searching Providers", color: "text-blue-600", bgColor: "bg-blue-100", icon: "travel_explore" },
  CONFIRMED: { label: "Confirmed", color: "text-primary", bgColor: "bg-primary/10", icon: "check_circle" },
  REJECTED: { label: "Rejected", color: "text-destructive", bgColor: "bg-destructive/10", icon: "cancel" },
  EXPIRED: { label: "Expired", color: "text-orange-600", bgColor: "bg-orange-100", icon: "timer_off" },
  IN_PROGRESS: { label: "In Progress", color: "text-blue-600", bgColor: "bg-blue-100", icon: "sync" },
  COMPLETED: { label: "Completed", color: "text-success", bgColor: "bg-success/10", icon: "task_alt" },
  CANCELLED: { label: "Cancelled", color: "text-muted-foreground", bgColor: "bg-gray-200", icon: "block" },
}

export default function BookingDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const bookingId = params.id as string
  const { t } = useLanguage()

  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showOTP, setShowOTP] = useState(false)

  // Cancel state
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const isCancellable = booking?.status === "PENDING" || booking?.status === "SEARCHING" || booking?.status === "CONFIRMED"

  // Fetch booking details
  const fetchBooking = async () => {
    if (!bookingId) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "GET",
        credentials: "include",
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setBooking(data.booking)
      } else if (res.status === 401) {
        setError(t("bookings.login_required"))
      } else {
        setError(data.message || t("bookings.not_found"))
      }
    } catch (err) {
      console.error("Error fetching booking:", err)
      setError(t("bookings.load_error"))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      fetchBooking()
    }
  }, [bookingId, authLoading])

  const handleCancelBooking = async () => {
    if (cancelReason.trim().length < 10) {
      setCancelError(t("bookings.cancel_reason_error"))
      return
    }

    setIsCancelling(true)
    setCancelError(null)

    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason: cancelReason.trim() }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setShowCancelModal(false)
        setCancelReason("")
        fetchBooking() // Refresh booking data
      } else {
        setCancelError(data.message || t("bookings.cancel_failed"))
      }
    } catch (err) {
      console.error("Cancel error:", err)
      setCancelError(t("common.error_generic"))
    } finally {
      setIsCancelling(false)
    }
  }

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
      dateDisplay = t("time.today")
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateDisplay = t("time.yesterday")
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dateDisplay = t("time.tomorrow")
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

  const getPriceUnit = (unit: string) => {
    switch (unit) {
      case "HOUR": return `/${t("unit.hour")}`
      case "DAY": return `/${t("unit.day")}`
      case "ACRE": return `/${t("unit.acre")}`
      case "KM": return `/${t("unit.km")}`
      case "FIXED": return `/${t("unit.fixed")}`
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
          <h2 className="text-xl font-bold text-foreground mb-2">{error || t("bookings.not_found")}</h2>
          <Link href="/bookings" className="text-primary font-semibold mt-4">
            {t("bookings.back_to_bookings")}
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
            <h1 className="text-lg font-bold text-foreground">{t("bookings.details_title")}</h1>
            <p className="text-xs text-muted">{booking.order_number || `#${booking.booking_id}`}</p>
          </div>
          <div className={cn("px-3 py-1 rounded-full text-xs font-bold", status.bgColor, status.color)}>
            {t(`status.${booking.status.toLowerCase()}`)}
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
              <h1 className="text-2xl font-bold text-foreground">
                {booking.order_number
                  ? t("bookings.order").replace("{id}", booking.order_number)
                  : t("bookings.booking_hash").replace("{id}", booking.booking_id)}
              </h1>
              <span className={cn("px-3 py-1 rounded-full text-sm font-bold", status.bgColor, status.color)}>
                {t(`status.${booking.status.toLowerCase()}`)}
              </span>
            </div>
            <p className="text-muted">{t("bookings.created_date").replace("{date}", formatDate(booking.created_at))}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="col-span-2 flex flex-col gap-6">
            {/* Service Card */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <div className="flex gap-6">
                <div className="size-32 rounded-xl overflow-hidden shrink-0 bg-muted">
                  {booking.service?.thumbnail ? (
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
                  <p className="text-sm text-primary font-semibold mb-1">{booking.service?.category_name || booking.category_name}</p>
                  <h2 className="text-2xl font-bold text-foreground">{booking.service?.title || booking.category_name || t("bookings.instant_booking")}</h2>
                  <p className="text-muted mt-1">
                    {t("bookings.by_provider").replace("{name}", booking.provider ? booking.provider.full_name : t("bookings.finding_provider"))}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-2xl font-bold text-navy">₹{booking.unit_price}</span>
                    <span className="text-muted">{getPriceUnit(booking.price_unit)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <h3 className="font-bold text-lg text-foreground mb-4">{t("bookings.details_title")}</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between items-center py-3 px-4 bg-background rounded-xl">
                  <span className="text-muted">{t("bookings.scheduled")}</span>
                  <span className="font-semibold text-foreground">{formatDate(booking.scheduled_date, booking.scheduled_time)}</span>
                </div>
                <div className="flex justify-between items-center py-3 px-4 bg-background rounded-xl">
                  <span className="text-muted">{t("bookings.quantity")}</span>
                  <span className="font-semibold text-foreground">{booking.quantity} {booking.price_unit === "HOUR" ? t("bookings.hours") : booking.price_unit === "ACRE" ? t("bookings.acres") : t("bookings.units")}</span>
                </div>
                <div className="col-span-2 flex justify-between items-center py-3 px-4 bg-background rounded-xl">
                  <span className="text-muted">{t("bookings.location")}</span>
                  <span className="font-semibold text-foreground text-right">{booking.address}</span>
                </div>
                {booking.note && (
                  <div className="col-span-2 flex flex-col gap-2 py-3 px-4 bg-background rounded-xl">
                    <span className="text-muted text-sm">{t("bookings.note_label")}</span>
                    <span className="text-foreground">{booking.note}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center py-4 mt-4 border-t border-border">
                <span className="text-lg font-medium text-foreground">{t("bookings.total_amount")}</span>
                <span className="font-bold text-2xl text-primary">₹{booking.total_amount}</span>
              </div>
            </div>

            {/* OTP Section for Confirmed Bookings */}
            {booking.status === "CONFIRMED" && booking.start_job_otp && (
              <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-primary text-2xl">key</span>
                  <h3 className="font-bold text-lg text-foreground">{t("bookings.start_otp")}</h3>
                </div>
                <p className="text-muted text-sm mb-3">{t("bookings.start_otp_desc_desktop")}</p>
                <div className="flex justify-center gap-2">
                  {booking.start_job_otp.split("").map((digit, i) => (
                    <div key={i} className="size-14 bg-white rounded-xl flex items-center justify-center text-2xl font-bold text-navy border border-border">
                      {digit}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* End OTP for In-Progress */}
            {booking.status === "IN_PROGRESS" && booking.end_job_otp && booking.end_job_otp !== "****" && (
              <div className="bg-success/5 border-2 border-success/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-success text-2xl">verified</span>
                  <h3 className="font-bold text-lg text-foreground">{t("bookings.end_otp")}</h3>
                </div>
                <p className="text-muted text-sm mb-3">{t("bookings.end_otp_desc_desktop")}</p>
                <div className="flex justify-center gap-2">
                  {booking.end_job_otp.split("").map((digit, i) => (
                    <div key={i} className="size-14 bg-white rounded-xl flex items-center justify-center text-2xl font-bold text-success border border-success/20">
                      {digit}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cancel Button — Desktop */}
            {isCancellable && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full py-3 rounded-xl border-2 border-destructive/30 text-destructive font-semibold hover:bg-destructive/5 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">cancel</span>
                {t("bookings.cancel_button")}
              </button>
            )}
          </div>

          {/* Sidebar */}
          <div className="col-span-1 flex flex-col gap-6">
            {/* Partner Info */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <h3 className="font-bold text-lg text-foreground mb-4">{t("bookings.service_provider")}</h3>
              {booking.provider ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="size-20 rounded-full bg-muted flex items-center justify-center border-2 border-primary/20 overflow-hidden">
                    {booking.provider.profile_picture ? (
                      <Image
                        src={booking.provider.profile_picture}
                        alt={booking.provider.full_name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-muted-foreground text-3xl font-bold">
                        {booking.provider.full_name?.charAt(0).toUpperCase() || "P"}
                      </span>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-foreground text-lg">{booking.provider.full_name}</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <span className="material-symbols-outlined text-yellow-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="text-sm font-bold">{booking.provider.rating || t("bookings.provider_new")}</span>
                      <span className="text-xs text-muted">• {t("bookings.provider_jobs").replace("{count}", String(booking.provider.jobs_completed))}</span>
                    </div>
                  </div>
                  {booking.provider.user_phone && (
                    <a
                      href={`tel:${booking.provider.user_phone}`}
                      className="w-full h-11 rounded-xl bg-success/10 text-success flex items-center justify-center gap-2 font-medium hover:bg-success/20 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">call</span>
                      {t("bookings.call_provider")}
                    </a>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <span className="material-symbols-outlined text-3xl text-muted/50 mb-2">person_search</span>
                  <p className="text-muted text-sm border border-dashed border-border rounded-xl py-3 bg-muted/10">{t("bookings.searching_desc_desktop")}</p>
                </div>
              )}
            </div>

            {/* Payment Status */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <h3 className="font-bold text-foreground mb-3">{t("bookings.payment")}</h3>
              <div className="flex items-center justify-between">
                <span className="text-muted">{t("bookings.status_label")}</span>
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
              <p className="text-sm text-muted">{t("bookings.need_help")}</p>
              <button className="text-primary font-semibold text-sm mt-1 hover:underline">{t("bookings.contact_support")}</button>
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
            <p className={cn("font-bold", status.color)}>
              {t(`status.${booking.status.toLowerCase()}`)}
            </p>
            <p className="text-xs text-muted">{t("bookings.updated_date").replace("{date}", formatDate(booking.updated_at))}</p>
          </div>
        </div>


        {/* Service Card */}
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
          <div className="flex gap-4">
            <div className="size-20 rounded-xl overflow-hidden shrink-0 bg-muted">
              {booking.service?.thumbnail ? (
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
              <p className="text-xs text-primary font-semibold">{booking.service?.category_name || booking.category_name}</p>
              <h2 className="text-lg font-bold text-foreground">{booking.service?.title || booking.category_name || t("bookings.instant_booking")}</h2>
              <p className="text-sm text-muted">{t("bookings.by_provider").replace("{name}", booking.provider ? booking.provider.full_name : t("bookings.finding_provider"))}</p>
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border flex flex-col gap-3">
          <h3 className="font-bold text-foreground">{t("bookings.details_title")}</h3>

          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-muted text-sm">{t("bookings.scheduled")}</span>
            <span className="font-semibold text-foreground text-sm">{formatDate(booking.scheduled_date, booking.scheduled_time)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-muted text-sm">{t("bookings.quantity")}</span>
            <span className="font-semibold text-foreground">{booking.quantity} {booking.price_unit === "HOUR" ? t("bookings.hours") : booking.price_unit === "ACRE" ? t("bookings.acres") : t("bookings.units")}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-muted text-sm">{t("bookings.location")}</span>
            <span className="font-semibold text-foreground text-sm text-right max-w-[60%]">{booking.address}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-muted text-sm">{t("bookings.total_amount")}</span>
            <span className="font-bold text-xl text-primary">₹{booking.total_amount}</span>
          </div>
        </div>

        {/* Start OTP Section */}
        {booking.status === "CONFIRMED" && booking.start_job_otp && (
          <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary">key</span>
              <h3 className="font-bold text-foreground">{t("bookings.start_otp")}</h3>
            </div>
            <p className="text-muted text-xs mb-3">{t("bookings.start_otp_desc_mobile")}</p>
            <div className="flex justify-center gap-2">
              {booking.start_job_otp.split("").map((digit, i) => (
                <div key={i} className="size-12 bg-white rounded-xl flex items-center justify-center text-xl font-bold text-navy border border-border">
                  {digit}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* End OTP Section — Mobile */}
        {booking.status === "IN_PROGRESS" && booking.end_job_otp && booking.end_job_otp !== "****" && (
          <div className="bg-success/5 border-2 border-success/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-success">verified</span>
              <h3 className="font-bold text-foreground">{t("bookings.end_otp")}</h3>
            </div>
            <p className="text-muted text-xs mb-3">{t("bookings.end_otp_desc_mobile")}</p>
            <div className="flex justify-center gap-2">
              {booking.end_job_otp.split("").map((digit, i) => (
                <div key={i} className="size-12 bg-white rounded-xl flex items-center justify-center text-xl font-bold text-success border border-success/20">
                  {digit}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cancel Button — Mobile */}
        {isCancellable && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="w-full py-3 rounded-xl border-2 border-destructive/30 text-destructive font-semibold active:bg-destructive/5 transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">cancel</span>
            {t("bookings.cancel_button")}
          </button>
        )}

        {/* Provider Info */}
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
          <h3 className="font-bold text-foreground mb-3">{t("bookings.service_provider")}</h3>
          {booking.provider ? (
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-full bg-muted flex items-center justify-center border-2 border-primary/20 overflow-hidden shrink-0">
                {booking.provider.profile_picture ? (
                  <Image
                    src={booking.provider.profile_picture}
                    alt={booking.provider.full_name}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-muted-foreground text-xl font-bold">
                    {booking.provider.full_name?.charAt(0).toUpperCase() || "P"}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground">{booking.provider.full_name}</p>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-yellow-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="text-sm font-semibold">{booking.provider.rating || t("bookings.provider_new")}</span>
                  <span className="text-xs text-muted">• {t("bookings.provider_jobs").replace("{count}", String(booking.provider.jobs_completed))}</span>
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
          ) : (
            <div className="text-center py-2">
              <p className="text-muted text-sm">{t("bookings.searching_desc_mobile")}</p>
            </div>
          )}
        </div>
      </main>

      <BottomNav variant="farmer" />

      {showOTP && booking.start_job_otp && (
        <OTPModal code={booking.start_job_otp} isOpen={showOTP} onDismiss={() => setShowOTP(false)} />
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-destructive text-2xl">warning</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">{t("bookings.cancel_title")}</h3>
                <p className="text-sm text-muted">{t("bookings.cancel_warning")}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium text-foreground mb-2 block">{t("bookings.cancel_reason_label")}</label>
              <textarea
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value)
                  if (cancelError) setCancelError(null)
                }}
                placeholder={t("bookings.cancel_reason_placeholder")}
                className="w-full h-24 px-4 py-3 bg-background border border-border rounded-xl text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              {cancelError && (
                <p className="text-destructive text-xs mt-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  {cancelError}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false)
                  setCancelReason("")
                  setCancelError(null)
                }}
                disabled={isCancelling}
                className="flex-1 py-3 rounded-xl border border-border text-foreground font-semibold hover:bg-muted/50 transition-colors"
              >
                {t("common.back")}
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={isCancelling || cancelReason.trim().length < 10}
                className={cn(
                  "flex-1 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2",
                  cancelReason.trim().length >= 10
                    ? "bg-destructive text-white hover:bg-destructive/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {isCancelling ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    Cancelling...
                  </>
                ) : (
                  t("bookings.confirm_cancel")
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
