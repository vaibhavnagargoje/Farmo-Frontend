"use client"

import { useEffect, useState, useCallback } from "react"
import { PartnerLayout } from "@/components/partner-layout"

// ─── Types ────────────────────────────────────────────────
interface BookingItem {
  id: number
  booking_id: string
  booking_type: "SCHEDULED" | "INSTANT"
  status: string
  service_title: string
  category_name: string | null
  provider_name: string | null
  customer_phone: string
  scheduled_date: string | null
  scheduled_time: string | null
  quantity: number
  price_unit: string
  unit_price: string
  total_amount: string
  expires_at: string | null
  created_at: string
  order_number: string | null
  address?: string
  lat?: string
  lng?: string
  note?: string
  cancellation_reason?: string
  // Detail fields (only from detail API)
  customer?: { phone_number: string; full_name: string }
  start_job_otp?: string
  end_job_otp?: string
  work_started_at?: string
  work_completed_at?: string
}

interface InstantRequestItem {
  id: number
  booking_id: string
  booking_type: "INSTANT"
  booking_status: string
  order_number: string | null
  category_name: string | null
  service_title: string
  customer_phone: string
  address: string
  lat: string
  lng: string
  quantity: number
  price_unit: string
  unit_price: string
  total_amount: string
  note: string
  expires_at: string | null
  created_at: string
  status: string
  distance_km: string | null
  notified_at: string
  response_deadline: string | null
}

// Unified card type for rendering
type DashboardBooking = {
  type: "scheduled" | "instant"
  id: string           // unique key for the card
  booking_id: string
  service_title: string
  category_name: string | null
  customer_phone: string
  amount: string
  created_at: string
  scheduled_date: string | null
  scheduled_time: string | null
  booking_type: "SCHEDULED" | "INSTANT"
  status: string
  quantity: number
  price_unit: string
  unit_price: string
  address: string
  lat: string
  lng: string
  note: string
  distance_km: string | null
  expires_at: string | null
  order_number: string | null
  // For actions
  original_booking_id?: string // booking_id for scheduled action
  instant_request_id?: number  // pk for instant action
  // Detail fields (loaded on demand)
  start_job_otp?: string
  end_job_otp?: string
  work_started_at?: string
  work_completed_at?: string
  cancellation_reason?: string
}

const PRICE_UNIT_LABELS: Record<string, string> = {
  HOUR: "Per Hour",
  DAY: "Per Day",
  KM: "Per Km",
  ACRE: "Per Acre",
  FIXED: "Fixed",
}

export default function PartnerDashboard() {
  // ─── State ──────────────────────────────────────────────
  const [waitingBookings, setWaitingBookings] = useState<DashboardBooking[]>([])
  const [acceptedBookings, setAcceptedBookings] = useState<DashboardBooking[]>([])
  const [rejectedBookings, setRejectedBookings] = useState<DashboardBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<DashboardBooking | null>(null)
  const [showRejected, setShowRejected] = useState(false)

  // ─── Data Fetching ──────────────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        fetch("/api/partner/bookings?status=PENDING"),
        fetch("/api/partner/instant-requests"),
        fetch("/api/partner/bookings?status=CONFIRMED"),
        fetch("/api/partner/bookings?status=IN_PROGRESS"),
        fetch("/api/partner/bookings?status=REJECTED"),
      ])

      // Parse all responses (fault-tolerant: failed requests return empty array)
      const parse = async (result: PromiseSettledResult<Response>) => {
        if (result.status === "rejected") return []
        const res = result.value
        if (!res.ok) return []
        try {
          const data = await res.json()
          return Array.isArray(data) ? data : data.results || []
        } catch { return [] }
      }

      const pending: BookingItem[] = await parse(results[0])
      const instant: InstantRequestItem[] = await parse(results[1])
      const confirmed: BookingItem[] = await parse(results[2])
      const inProgress: BookingItem[] = await parse(results[3])
      const rejected: BookingItem[] = await parse(results[4])

      // ── Build Waiting Bookings (pending scheduled + instant requests) ──
      const waitingList: DashboardBooking[] = [
        ...pending.map((b): DashboardBooking => ({
          type: "scheduled",
          id: `sched-${b.booking_id}`,
          booking_id: b.booking_id,
          service_title: b.service_title,
          category_name: b.category_name,
          customer_phone: b.customer_phone,
          amount: b.total_amount,
          created_at: b.created_at,
          scheduled_date: b.scheduled_date,
          scheduled_time: b.scheduled_time,
          booking_type: b.booking_type,
          status: b.status,
          quantity: b.quantity || 1,
          price_unit: b.price_unit || "HOUR",
          unit_price: b.unit_price || b.total_amount,
          address: b.address || "",
          lat: b.lat || "",
          lng: b.lng || "",
          note: b.note || "",
          distance_km: null,
          expires_at: b.expires_at,
          order_number: b.order_number,
          original_booking_id: b.booking_id,
        })),
        ...instant.map((r): DashboardBooking => ({
          type: "instant",
          id: `inst-${r.id}`,
          booking_id: r.booking_id,
          service_title: r.service_title,
          category_name: r.category_name,
          customer_phone: r.customer_phone,
          amount: String(r.total_amount),
          created_at: r.created_at,
          scheduled_date: null,
          scheduled_time: null,
          booking_type: "INSTANT",
          status: "PENDING",
          quantity: r.quantity,
          price_unit: r.price_unit,
          unit_price: String(r.unit_price),
          address: r.address,
          lat: r.lat,
          lng: r.lng,
          note: r.note || "",
          distance_km: r.distance_km,
          expires_at: r.expires_at,
          order_number: r.order_number,
          instant_request_id: r.id,
        })),
      ]
      setWaitingBookings(waitingList)

      // ── Build Accepted / Need to Complete ──
      const acceptedList: DashboardBooking[] = [
        ...confirmed.map((b) => bookingToDashboard(b, "CONFIRMED")),
        ...inProgress.map((b) => bookingToDashboard(b, "IN_PROGRESS")),
      ]
      setAcceptedBookings(acceptedList)

      // ── Build Rejected ──
      const rejectedList: DashboardBooking[] = rejected.map((b) => bookingToDashboard(b, "REJECTED"))
      setRejectedBookings(rejectedList)

    } catch (error) {
      console.error("Dashboard fetch error:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const bookingToDashboard = (b: BookingItem, status: string): DashboardBooking => ({
    type: b.booking_type === "INSTANT" ? "instant" : "scheduled",
    id: `book-${b.booking_id}`,
    booking_id: b.booking_id,
    service_title: b.service_title,
    category_name: b.category_name,
    customer_phone: b.customer_phone,
    amount: b.total_amount,
    created_at: b.created_at,
    scheduled_date: b.scheduled_date,
    scheduled_time: b.scheduled_time,
    booking_type: b.booking_type || "SCHEDULED",
    status,
    quantity: b.quantity || 1,
    price_unit: b.price_unit || "HOUR",
    unit_price: b.unit_price || b.total_amount,
    address: b.address || "",
    lat: b.lat || "",
    lng: b.lng || "",
    note: b.note || "",
    distance_km: null,
    expires_at: b.expires_at,
    order_number: b.order_number,
    original_booking_id: b.booking_id,
    cancellation_reason: b.cancellation_reason,
  })

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [fetchDashboardData])



  // ─── Actions ──────────────────────────────────────────
  const handleScheduledAction = async (bookingId: string, action: "accept" | "reject") => {
    setActionLoading(bookingId)
    try {
      const res = await fetch(`/api/partner/bookings/${bookingId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          rejection_reason: action === "reject" ? "Not available right now" : undefined,
        }),
      })
      if (res.ok) {
        setSelectedBooking(null)
        fetchDashboardData()
      }
    } catch (error) {
      console.error("Booking action error:", error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleInstantAction = async (requestId: number, action: "accept" | "decline") => {
    setActionLoading(`inst-${requestId}`)
    try {
      const res = await fetch(`/api/partner/instant-requests/${requestId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        setSelectedBooking(null)
        fetchDashboardData()
      } else {
        const data = await res.json()
        if (res.status === 409) {
          alert(data.message || "This booking is no longer available.")
          fetchDashboardData()
        }
      }
    } catch (error) {
      console.error("Instant action error:", error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleJobAction = async (bookingId: string, action: "start" | "complete", otp?: string) => {
    setActionLoading(bookingId)
    try {
      const res = await fetch(`/api/partner/bookings/${bookingId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, otp }),
      })
      if (res.ok) {
        setSelectedBooking(null)
        fetchDashboardData()
      } else {
        const data = await res.json()
        alert(data.message || "Action failed. Please check the OTP.")
      }
    } catch (error) {
      console.error("Job action error:", error)
    } finally {
      setActionLoading(null)
    }
  }

  // ─── Formatters ──────────────────────────────────────
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
  }

  const formatAmount = (amount: string | number) => `₹${Number(amount).toLocaleString("en-IN")}`

  const formatExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return null
    const exp = new Date(expiresAt)
    const now = new Date()
    const diffMs = exp.getTime() - now.getTime()
    if (diffMs <= 0) return "Expired"
    const diffMins = Math.floor(diffMs / 60000)
    const diffSecs = Math.floor((diffMs % 60000) / 1000)
    if (diffMins > 0) return `${diffMins}m ${diffSecs}s left`
    return `${diffSecs}s left`
  }

  // ─── Render ──────────────────────────────────────────
  return (
    <PartnerLayout pageTitle="Dashboard">
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && (
        <div className="flex flex-col gap-6">

          {/* ═══ Waiting Bookings ═══ */}
          {waitingBookings.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-amber-500">schedule</span>
                <h3 className="text-lg font-bold text-foreground">Waiting Bookings</h3>
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                  {waitingBookings.length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {waitingBookings.map((booking) => (
                  <WaitingBookingCard
                    key={booking.id}
                    booking={booking}
                    onView={() => setSelectedBooking(booking)}
                    onAccept={() => {
                      if (booking.type === "instant" && booking.instant_request_id) {
                        handleInstantAction(booking.instant_request_id, "accept")
                      } else if (booking.original_booking_id) {
                        handleScheduledAction(booking.original_booking_id, "accept")
                      }
                    }}
                    actionLoading={actionLoading}
                    formatDate={formatDate}
                    formatAmount={formatAmount}
                    formatExpiry={formatExpiry}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ═══ Accepted / Need to Complete ═══ */}
          {acceptedBookings.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-success">check_circle</span>
                <h3 className="text-lg font-bold text-foreground">Accepted / Need to Complete</h3>
                <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full">
                  {acceptedBookings.length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {acceptedBookings.map((booking) => (
                  <AcceptedBookingCard
                    key={booking.id}
                    booking={booking}
                    onView={() => setSelectedBooking(booking)}
                    formatDate={formatDate}
                    formatAmount={formatAmount}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ═══ Rejected ═══ */}
          {rejectedBookings.length > 0 && (
            <div>
              <button
                onClick={() => setShowRejected(!showRejected)}
                className="flex items-center gap-2 mb-3 w-full"
              >
                <span className="material-symbols-outlined text-red-400">cancel</span>
                <h3 className="text-lg font-bold text-foreground">Rejected</h3>
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {rejectedBookings.length}
                </span>
                <span className={`material-symbols-outlined text-muted ml-auto transition-transform ${showRejected ? "rotate-180" : ""}`}>
                  expand_more
                </span>
              </button>
              {showRejected && (
                <div className="flex flex-col gap-3">
                  {rejectedBookings.map((booking) => (
                    <div key={booking.id} className="bg-card p-4 rounded-2xl border border-red-100 opacity-70">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-red-50 text-red-400 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-xl">block</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-foreground font-semibold text-sm truncate">{booking.service_title}</h4>
                          <p className="text-xs text-muted mt-0.5">{formatDate(booking.created_at)}</p>
                        </div>
                        <p className="text-muted font-semibold text-sm">{formatAmount(booking.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ Empty State ═══ */}
          {waitingBookings.length === 0 && acceptedBookings.length === 0 && rejectedBookings.length === 0 && (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <span className="material-symbols-outlined text-6xl text-muted/30 mb-4">inbox</span>
              <h3 className="text-lg font-bold text-foreground mb-2">No Active Requests</h3>
              <p className="text-muted text-sm max-w-md mx-auto">
                You'll receive bookings here when customers request your services. Stay online!
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══ Booking Detail Modal ═══ */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onScheduledAction={handleScheduledAction}
          onInstantAction={handleInstantAction}
          onJobAction={handleJobAction}
          actionLoading={actionLoading}
          formatAmount={formatAmount}
          formatDate={formatDate}
          formatExpiry={formatExpiry}
        />
      )}
    </PartnerLayout>
  )
}


// ═══════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════

function WaitingBookingCard({
  booking,
  onView,
  onAccept,
  actionLoading,
  formatDate,
  formatAmount,
  formatExpiry,
}: {
  booking: DashboardBooking
  onView: () => void
  onAccept: () => void
  actionLoading: string | null
  formatDate: (d: string) => string
  formatAmount: (a: string | number) => string
  formatExpiry: (e: string | null) => string | null
}) {
  const expiry = formatExpiry(booking.expires_at)
  const isAccepting = actionLoading === booking.id || actionLoading === booking.booking_id

  return (
    <div className="w-full bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-md transition-all">
      {/* Card top: tap to view details */}
      <button onClick={onView} className="w-full text-left p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <div className={`size-10 sm:size-12 rounded-xl flex items-center justify-center shrink-0 ${booking.booking_type === "INSTANT"
            ? "bg-purple-50 text-purple-600"
            : "bg-amber-50 text-amber-600"
            }`}>
            <span className="material-symbols-outlined text-xl sm:text-2xl">
              {booking.booking_type === "INSTANT" ? "bolt" : "calendar_month"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-foreground font-bold text-sm sm:text-base truncate max-w-35 sm:max-w-none">{booking.service_title}</h4>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${booking.booking_type === "INSTANT"
                ? "bg-purple-100 text-purple-700"
                : "bg-blue-100 text-blue-700"
                }`}>
                {/* {booking.booking_type === "INSTANT" ? "Instant" : "📅 Scheduled"} */}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-xs text-muted">
                {booking.scheduled_date || formatDate(booking.created_at)}
                {booking.scheduled_time && ` • ${booking.scheduled_time}`}
              </p>
              {booking.distance_km && (
                <span className="text-xs text-blue-600 font-medium">
                  📍 {Number(booking.distance_km).toFixed(1)} km
                </span>
              )}
            </div>
            {/* Compact pricing row */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-primary font-bold text-sm">
                {formatAmount(booking.unit_price)} x {booking.quantity} {PRICE_UNIT_LABELS[booking.price_unit] || booking.price_unit}
              </span>
              <span className="text-[10px] text-muted">
                Total {formatAmount(booking.amount)}
              </span>
              {expiry && expiry !== "Expired" && (
                <span className="text-[10px] text-amber-600 font-medium ml-auto">⏱ {expiry}</span>
              )}
            </div>
          </div>
        </div>
      </button>
      {/* Card bottom: Accept button */}
      <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
        <button
          disabled={isAccepting}
          onClick={(e) => { e.stopPropagation(); onAccept() }}
          className="w-full h-10 rounded-xl bg-primary text-white font-bold text-sm shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isAccepting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">check_circle</span>
              Accept
            </>
          )}
        </button>
      </div>
    </div>
  )
}


function AcceptedBookingCard({
  booking,
  onView,
  formatDate,
  formatAmount,
}: {
  booking: DashboardBooking
  onView: () => void
  formatDate: (d: string) => string
  formatAmount: (a: string | number) => string
}) {
  return (
    <button
      onClick={onView}
      className="w-full text-left bg-card p-3 sm:p-4 rounded-2xl border border-border hover:border-green-200 hover:shadow-md transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className={`size-10 sm:size-12 rounded-xl flex items-center justify-center shrink-0 ${booking.status === "IN_PROGRESS"
          ? "bg-blue-50 text-blue-600"
          : "bg-green-50 text-success"
          }`}>
          <span className="material-symbols-outlined text-xl sm:text-2xl">
            {booking.status === "IN_PROGRESS" ? "engineering" : "work"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-foreground font-bold text-sm sm:text-base truncate max-w-35 sm:max-w-none">{booking.service_title}</h4>
            {booking.status === "IN_PROGRESS" && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 shrink-0">
                In Progress
              </span>
            )}
            {booking.booking_type === "INSTANT" && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 shrink-0">
                 Instant
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mt-1 gap-2">
            <p className="text-xs text-muted">
              {booking.scheduled_date || formatDate(booking.created_at)}
              {booking.scheduled_time && ` • ${booking.scheduled_time}`}
            </p>
            <span className="text-primary font-bold text-sm shrink-0">{formatAmount(booking.amount)}</span>
          </div>
        </div>
        <span className="material-symbols-outlined text-muted/40 group-hover:text-green-500 transition-colors self-center hidden sm:block">
          chevron_right
        </span>
      </div>
    </button>
  )
}


// ─── Booking Detail Modal ──────────────────────────────
function BookingDetailModal({
  booking,
  onClose,
  onScheduledAction,
  onInstantAction,
  onJobAction,
  actionLoading,
  formatAmount,
  formatDate,
  formatExpiry,
}: {
  booking: DashboardBooking
  onClose: () => void
  onScheduledAction: (id: string, action: "accept" | "reject") => void
  onInstantAction: (id: number, action: "accept" | "decline") => void
  onJobAction: (id: string, action: "start" | "complete", otp?: string) => void
  actionLoading: string | null
  formatAmount: (a: string | number) => string
  formatDate: (d: string) => string
  formatExpiry: (e: string | null) => string | null
}) {
  const [otp, setOtp] = useState("")
  const [detail, setDetail] = useState<{
    customer?: { phone_number: string; full_name: string }
    start_job_otp?: string
    end_job_otp?: string
    work_started_at?: string
    work_completed_at?: string
  } | null>(null)
  const isActioning = actionLoading !== null
  const expiry = formatExpiry(booking.expires_at)

  const isWaiting = booking.status === "PENDING"
  const isConfirmed = booking.status === "CONFIRMED"
  const isInProgress = booking.status === "IN_PROGRESS"
  const isRejected = booking.status === "REJECTED"

  // Fetch full details when modal opens (for OTP, customer info, etc.)
  useEffect(() => {
    if (!booking.booking_id) return
    if (isWaiting && booking.type === "instant") return // instant requests don't have detail endpoint yet
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/partner/bookings/${booking.booking_id}`)
        if (res.ok) {
          const data = await res.json()
          setDetail(data)
        }
      } catch { /* ignore — list data is sufficient fallback */ }
    }
    fetchDetail()
  }, [booking.booking_id, booking.type, isWaiting])

  const customerName = detail?.customer
    ? detail.customer.full_name || "Customer"
    : null

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-card w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-card z-10 px-4 sm:px-5 pt-4 pb-3 border-b border-border">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${isWaiting ? "bg-amber-50 text-amber-600" :
                isConfirmed ? "bg-green-50 text-success" :
                  isInProgress ? "bg-blue-50 text-blue-600" :
                    "bg-red-50 text-red-500"
                }`}>
                <span className="material-symbols-outlined text-lg">
                  {isWaiting ? "schedule" : isConfirmed ? "check_circle" : isInProgress ? "engineering" : "block"}
                </span>
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-foreground truncate">{booking.service_title}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${booking.booking_type === "INSTANT"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-blue-100 text-blue-700"
                    }`}>
                    {booking.booking_type === "INSTANT" ? "Instant" : "📅 Scheduled"}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isWaiting ? "bg-amber-100 text-amber-700" :
                    isConfirmed ? "bg-green-100 text-green-700" :
                      isInProgress ? "bg-blue-100 text-blue-700" :
                        "bg-red-100 text-red-700"
                    }`}>
                    {isWaiting ? "Waiting" : isConfirmed ? "Accepted" : isInProgress ? "In Progress" : "Rejected"}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="size-8 rounded-full bg-background flex items-center justify-center hover:bg-muted/20 transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-5 py-4 space-y-3">
          {/* Expiry Warning */}
          {isWaiting && expiry && expiry !== "Expired" && (
            <div className="flex items-center gap-2 p-2.5 bg-amber-50 rounded-xl border border-amber-100">
              <span className="material-symbols-outlined text-amber-600 text-base">timer</span>
              <p className="text-sm font-medium text-amber-800">Expires in {expiry}</p>
            </div>
          )}

          {/* Booking ID + Order Number — compact row */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-background rounded-lg">
              <span className="text-[10px] text-muted uppercase tracking-wide">ID</span>
              <span className="text-xs font-mono font-bold text-foreground">{booking.booking_id}</span>
            </div>
            {booking.order_number && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-background rounded-lg">
                <span className="text-[10px] text-muted uppercase tracking-wide">Order</span>
                <span className="text-xs font-mono font-bold text-foreground">{booking.order_number}</span>
              </div>
            )}
          </div>

          {/* Compact Pricing Row */}
          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">payments</span>
              <span className="text-sm text-foreground">
                {formatAmount(booking.unit_price)} × {booking.quantity} {PRICE_UNIT_LABELS[booking.price_unit] || booking.price_unit}
              </span>
            </div>
            <span className="text-base font-bold text-primary">{formatAmount(booking.amount)}</span>
          </div>

          {/* Distance */}
          {booking.distance_km && (
            <div className="flex items-center gap-2.5 p-2.5 bg-blue-50 rounded-xl border border-blue-100">
              <span className="material-symbols-outlined text-blue-600 text-base">distance</span>
              <p className="text-sm font-semibold text-blue-800">{Number(booking.distance_km).toFixed(1)} km away</p>
            </div>
          )}

          {/* Customer Name (from detail fetch) */}
          {customerName && (isConfirmed || isInProgress) && (
            <div className="flex items-center gap-2.5 p-2.5 bg-background rounded-xl">
              <span className="material-symbols-outlined text-foreground/60 text-base">person</span>
              <p className="text-sm font-semibold text-foreground">{customerName}</p>
            </div>
          )}

          {/* Schedule — only show for WAITING bookings, not confirmed/in-progress */}
          {isWaiting && (booking.scheduled_date || booking.scheduled_time) && (
            <div className="flex items-center gap-2.5 p-2.5 bg-background rounded-xl">
              <span className="material-symbols-outlined text-foreground/60 text-base">event</span>
              <p className="text-sm text-foreground">
                {booking.scheduled_date && <span className="font-semibold">{booking.scheduled_date}</span>}
                {booking.scheduled_date && booking.scheduled_time && <span className="text-muted mx-1">•</span>}
                {booking.scheduled_time && <span className="font-semibold">{booking.scheduled_time}</span>}
              </p>
            </div>
          )}

          {/* Location */}
          {booking.address && (
            <div className="flex items-start gap-2.5 p-2.5 bg-background rounded-xl">
              <span className="material-symbols-outlined text-foreground/60 text-base mt-0.5">location_on</span>
              <p className="text-sm text-foreground flex-1">{booking.address}</p>
            </div>
          )}

          {/* Notes */}
          {booking.note && (
            <div className="flex items-start gap-2.5 p-2.5 bg-background rounded-xl">
              <span className="material-symbols-outlined text-foreground/60 text-base mt-0.5">note</span>
              <p className="text-sm text-foreground italic flex-1">{booking.note}</p>
            </div>
          )}

          {/* Rejection Reason */}
          {isRejected && booking.cancellation_reason && (
            <div className="flex items-start gap-2.5 p-2.5 bg-red-50 rounded-xl border border-red-100">
              <span className="material-symbols-outlined text-red-500 text-base mt-0.5">info</span>
              <div>
                <p className="text-xs font-bold text-red-800">Rejection Reason</p>
                <p className="text-sm text-red-700 mt-0.5">{booking.cancellation_reason}</p>
              </div>
            </div>
          )}

          {/* ─── Quick Actions for Accepted Bookings ─── */}
          {(isConfirmed || isInProgress) && (
            <div className="grid grid-cols-2 gap-2">
              {/* Contact Customer */}
              <a
                href={`tel:${booking.customer_phone}`}
                className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-xl border border-green-100 hover:bg-green-100 transition-colors"
              >
                <span className="material-symbols-outlined text-xl text-green-600">call</span>
                <span className="text-xs font-bold text-green-800">Contact</span>
              </a>

              {/* See Direction */}
              {booking.lat && booking.lng && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${booking.lat},${booking.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl text-blue-600">directions</span>
                  <span className="text-xs font-bold text-blue-800">See Direction</span>
                </a>
              )}
            </div>
          )}

          {/* ─── OTP Entry for Start/Complete ─── */}
          {(isConfirmed || isInProgress) && (
            <div className="bg-background rounded-xl p-3 space-y-2.5">
              <p className="text-xs text-muted">
                {isConfirmed
                  ? "Enter the Start OTP from the customer to begin the job."
                  : "Enter the Completion OTP to mark job as done."}
              </p>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter OTP"
                className="w-full h-11 px-4 text-center text-lg font-mono font-bold rounded-xl border border-border bg-card tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                disabled={otp.length < 4 || isActioning}
                onClick={() => {
                  if (isConfirmed) onJobAction(booking.booking_id, "start", otp)
                  else onJobAction(booking.booking_id, "complete", otp)
                }}
                className={`w-full h-10 rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${isConfirmed
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-green-600 text-white hover:bg-green-700"
                  }`}
              >
                {isActioning ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                ) : isConfirmed ? (
                  "Start Job"
                ) : (
                  "Mark Completed ✓"
                )}
              </button>
            </div>
          )}
          <div className="h-6 sm:h-0" /> {/* Extra spacing for mobile */}
        </div>

        {/* ─── Footer Actions ─── */}
        {isWaiting && (
          <div className="sticky bottom-0 bg-card border-t border-border px-4 sm:px-5 py-3 pb-8 sm:pb-3">
            <div className="flex gap-3">
              {booking.type === "instant" && booking.instant_request_id ? (
                <>
                  <button
                    disabled={isActioning}
                    onClick={() => onInstantAction(booking.instant_request_id!, "decline")}
                    className="flex-1 h-10 rounded-xl border border-border text-muted font-bold text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <button
                    disabled={isActioning}
                    onClick={() => onInstantAction(booking.instant_request_id!, "accept")}
                    className="flex-1 h-10 rounded-xl bg-primary text-white font-bold text-sm shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    {isActioning ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    ) : (
                      "Accept ✓"
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    disabled={isActioning}
                    onClick={() => onScheduledAction(booking.booking_id, "reject")}
                    className="flex-1 h-10 rounded-xl border border-border text-muted font-bold text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    disabled={isActioning}
                    onClick={() => onScheduledAction(booking.booking_id, "accept")}
                    className="flex-1 h-10 rounded-xl bg-primary text-white font-bold text-sm shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    {isActioning ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    ) : (
                      "Accept ✓"
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

