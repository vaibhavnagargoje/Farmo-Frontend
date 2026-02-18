"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { BottomNav } from "@/components/bottom-nav"
import { DesktopHeader } from "@/components/desktop-header"
import { MobileHeader } from "@/components/mobile-header"
import { Switch } from "@/components/ui/switch"

// Types matching backend serializer
interface BookingItem {
  id: number
  booking_id: string
  booking_type: "INSTANT" | "SCHEDULED"
  status: string
  service_title: string
  category_name: string | null
  provider_name: string | null
  customer_phone: string
  scheduled_date: string | null
  scheduled_time: string | null
  total_amount: string
  expires_at: string | null
  created_at: string
}

interface InstantRequestItem {
  id: number
  provider: number
  provider_name: string
  status: string
  distance_km: string | null
  notified_at: string
  booking: {
    booking_id: string
    booking_type: string
    status: string
    category_name: string | null
    customer: { first_name: string; last_name: string; phone_number: string }
    address: string
    total_amount: string
    quantity: number
    unit_price: string
    created_at: string
  }
}

interface DashboardStats {
  total_bookings: number
  active_bookings: number
  completed_bookings: number
  total_earnings: number
}

export default function PartnerDashboard() {
  const [instantRequests, setInstantRequests] = useState<InstantRequestItem[]>([])
  const [pendingBookings, setPendingBookings] = useState<BookingItem[]>([])
  const [confirmedBookings, setConfirmedBookings] = useState<BookingItem[]>([])
  const [isOnline, setIsOnline] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [partnerName, setPartnerName] = useState("Partner")
  const [stats, setStats] = useState<DashboardStats>({
    total_bookings: 0, active_bookings: 0, completed_bookings: 0, total_earnings: 0,
  })

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch all data in parallel
      const [instantRes, pendingRes, confirmedRes, profileRes] = await Promise.all([
        fetch("/api/partner/bookings/instant"),
        fetch("/api/partner/bookings?status=PENDING"),
        fetch("/api/partner/bookings?status=CONFIRMED"),
        fetch("/api/partner/onboarding"), // Uses the status endpoint which returns user data
      ])

      if (instantRes.ok) {
        const data = await instantRes.json()
        setInstantRequests(Array.isArray(data) ? data : data.results || [])
      }

      if (pendingRes.ok) {
        const data = await pendingRes.json()
        setPendingBookings(Array.isArray(data) ? data : data.results || [])
      }

      if (confirmedRes.ok) {
        const data = await confirmedRes.json()
        setConfirmedBookings(Array.isArray(data) ? data : data.results || [])
      }

      if (profileRes.ok) {
        const data = await profileRes.json()
        if (data.user) {
          const name = [data.user.first_name, data.user.last_name].filter(Boolean).join(" ")
          setPartnerName(name || "Partner")
        }
        if (data.partner) {
          setIsOnline(data.partner.is_available !== false)
        }
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
    // Poll for new requests every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [fetchDashboardData])

  const handleToggleOnline = async (checked: boolean) => {
    setIsOnline(checked)
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_available: checked }),
      })
    } catch (error) {
      console.error("Toggle error:", error)
      setIsOnline(!checked) // revert
    }
  }

  const handleBookingAction = async (
    bookingId: string,
    action: "accept" | "reject",
    type: "instant" | "scheduled"
  ) => {
    setActionLoading(bookingId)
    try {
      const res = await fetch(`/api/partner/bookings/${bookingId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          type,
          rejection_reason: action === "reject" ? "Not available right now" : undefined,
        }),
      })

      if (res.ok) {
        // Refresh data
        fetchDashboardData()
      }
    } catch (error) {
      console.error("Booking action error:", error)
    } finally {
      setActionLoading(null)
    }
  }

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

  const formatAmount = (amount: string | number) => {
    return `₹${Number(amount).toLocaleString("en-IN")}`
  }

  const totalActiveRequests = instantRequests.length + pendingBookings.length

  return (
    <div className="relative flex h-full w-full flex-col overflow-x-hidden bg-background min-h-screen">
      <DesktopHeader variant="partner" />
      <MobileHeader />

      {/* Mobile Header */}
      <header className="bg-navy pt-14 pb-6 px-5 sticky top-0 z-30 rounded-b-[2rem] shadow-lg lg:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-xl">person</span>
              </div>
              <div>
                <p className="text-white font-bold text-sm">{partnerName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Switch
                    checked={isOnline}
                    onCheckedChange={handleToggleOnline}
                    className="scale-90 data-[state=checked]:bg-success data-[state=unchecked]:bg-muted"
                  />
                  <span className={`text-xs font-semibold ${isOnline ? "text-green-300" : "text-white/50"}`}>
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <Link
            href="/partner/services"
            className="bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-primary text-lg">construction</span>
            <span className="text-white text-sm font-semibold">My Services</span>
          </Link>
        </div>
      </header>

      {/* Desktop Layout */}
      <div className="hidden lg:block max-w-7xl mx-auto w-full px-6 py-8">
        {/* Desktop Status Bar */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-full bg-navy/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-navy text-2xl">person</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Welcome back, {partnerName}!</h2>
                  <p className="text-muted">{isOnline ? "Ready to accept jobs" : "Currently offline"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 pl-6 border-l border-border">
                <span className="text-sm font-medium text-muted">Status:</span>
                <Switch
                  checked={isOnline}
                  onCheckedChange={handleToggleOnline}
                  className="scale-125 data-[state=checked]:bg-success data-[state=unchecked]:bg-muted"
                />
                <span className={`text-sm font-semibold ${isOnline ? "text-success" : "text-muted"}`}>
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/partner/services"
                className="bg-navy/5 hover:bg-navy/10 transition-colors rounded-xl px-6 py-3 flex items-center gap-3"
              >
                <span className="material-symbols-outlined text-primary text-2xl">construction</span>
                <div>
                  <p className="text-xs text-muted">Services</p>
                  <p className="text-base font-bold text-navy">Manage</p>
                </div>
              </Link>
              <Link
                href="/partner/earnings"
                className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                View Earnings
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="col-span-2 flex flex-col gap-6">
            {/* Instant Requests */}
            {instantRequests.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary animate-pulse">bolt</span>
                  <h3 className="text-lg font-bold text-foreground">Instant Requests</h3>
                  <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {instantRequests.length}
                  </span>
                </div>
                <div className="flex flex-col gap-4">
                  {instantRequests.map((req) => (
                    <InstantRequestCard
                      key={req.id}
                      request={req}
                      onAction={handleBookingAction}
                      actionLoading={actionLoading}
                      formatDate={formatDate}
                      formatAmount={formatAmount}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Pending Bookings */}
            {pendingBookings.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-amber-500">schedule</span>
                  <h3 className="text-lg font-bold text-foreground">Pending Bookings</h3>
                  <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                    {pendingBookings.length}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {pendingBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onAction={handleBookingAction}
                      actionLoading={actionLoading}
                      formatDate={formatDate}
                      formatAmount={formatAmount}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Confirmed/Upcoming */}
            {confirmedBookings.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-success">check_circle</span>
                  <h3 className="text-lg font-bold text-foreground">Upcoming Jobs</h3>
                </div>
                <div className="flex flex-col gap-3">
                  {confirmedBookings.map((booking) => (
                    <div key={booking.id} className="bg-card p-4 rounded-2xl border border-border flex items-center gap-4">
                      <div className="size-12 rounded-xl bg-green-50 text-success flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-2xl">work</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-foreground font-bold truncate">{booking.service_title}</h4>
                        <p className="text-xs text-muted mt-0.5">
                          {booking.scheduled_date || formatDate(booking.created_at)}
                          {booking.scheduled_time && ` • ${booking.scheduled_time}`}
                        </p>
                      </div>
                      <p className="text-primary font-bold">{formatAmount(booking.total_amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && totalActiveRequests === 0 && confirmedBookings.length === 0 && (
              <div className="bg-card rounded-2xl border border-border p-12 text-center">
                <span className="material-symbols-outlined text-6xl text-muted/30 mb-4">inbox</span>
                <h3 className="text-lg font-bold text-foreground mb-2">No Active Requests</h3>
                <p className="text-muted text-sm max-w-md mx-auto">
                  {isOnline
                    ? "You'll receive bookings here when customers request your services. Stay online!"
                    : "Go online to start receiving booking requests."}
                </p>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="col-span-1 flex flex-col gap-6">
            {/* Quick Stats */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-bold text-lg text-foreground mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{totalActiveRequests}</p>
                  <p className="text-xs text-muted">Active Requests</p>
                </div>
                <div className="bg-background rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-success">{confirmedBookings.length}</p>
                  <p className="text-xs text-muted">Upcoming Jobs</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-bold text-lg text-foreground mb-4">Quick Actions</h3>
              <div className="flex flex-col gap-3">
                <Link
                  href="/partner/services"
                  className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border hover:bg-muted/10 transition-colors"
                >
                  <div className="size-10 rounded-xl bg-blue-50 text-navy flex items-center justify-center">
                    <span className="material-symbols-outlined">construction</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">Manage Services</p>
                    <p className="text-xs text-muted">Add, edit, or remove services</p>
                  </div>
                  <span className="material-symbols-outlined text-muted/50">chevron_right</span>
                </Link>
                <Link
                  href="/partner/earnings"
                  className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border hover:bg-muted/10 transition-colors"
                >
                  <div className="size-10 rounded-xl bg-green-50 text-success flex items-center justify-center">
                    <span className="material-symbols-outlined">account_balance_wallet</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">Earnings</p>
                    <p className="text-xs text-muted">View payment history</p>
                  </div>
                  <span className="material-symbols-outlined text-muted/50">chevron_right</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MOBILE ===== */}
      <main className="flex-1 px-4 py-6 flex flex-col gap-6 pb-28 lg:hidden">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {/* Instant Requests (Mobile) */}
        {instantRequests.length > 0 && (
          <div>
            <div className="flex items-center gap-2 px-1 mb-3">
              <span className="material-symbols-outlined text-primary animate-pulse">bolt</span>
              <h3 className="text-navy text-lg font-bold">Instant Requests</h3>
              <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full ml-auto">
                {instantRequests.length}
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {instantRequests.map((req) => (
                <InstantRequestCard
                  key={req.id}
                  request={req}
                  onAction={handleBookingAction}
                  actionLoading={actionLoading}
                  formatDate={formatDate}
                  formatAmount={formatAmount}
                  mobile
                />
              ))}
            </div>
          </div>
        )}

        {/* Pending Bookings (Mobile) */}
        {pendingBookings.length > 0 && (
          <div>
            <div className="flex items-center gap-2 px-1 mb-3">
              <span className="material-symbols-outlined text-amber-500">schedule</span>
              <h3 className="text-navy text-lg font-bold">Pending Bookings</h3>
            </div>
            <div className="flex flex-col gap-3">
              {pendingBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onAction={handleBookingAction}
                  actionLoading={actionLoading}
                  formatDate={formatDate}
                  formatAmount={formatAmount}
                  mobile
                />
              ))}
            </div>
          </div>
        )}

        {/* Confirmed Jobs (Mobile) */}
        {confirmedBookings.length > 0 && (
          <div>
            <div className="flex items-center gap-2 px-1 mb-3">
              <span className="material-symbols-outlined text-success">check_circle</span>
              <h3 className="text-navy text-lg font-bold">Upcoming Jobs</h3>
            </div>
            <div className="flex flex-col gap-3">
              {confirmedBookings.map((booking) => (
                <div key={booking.id} className="bg-card p-4 rounded-2xl shadow-sm border border-border flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-green-50 text-success flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-2xl">work</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-foreground font-bold truncate">{booking.service_title}</h4>
                    <p className="text-xs text-muted mt-0.5">
                      {booking.scheduled_date || formatDate(booking.created_at)}
                    </p>
                  </div>
                  <p className="text-primary font-bold text-sm">{formatAmount(booking.total_amount)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State (Mobile) */}
        {!isLoading && totalActiveRequests === 0 && confirmedBookings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-6xl text-muted/30 mb-4">inbox</span>
            <h3 className="text-lg font-bold text-foreground mb-2">No Active Requests</h3>
            <p className="text-muted text-sm px-8">
              {isOnline
                ? "Stay online — bookings will appear here."
                : "Go online to start receiving booking requests."}
            </p>
          </div>
        )}
      </main>

      <BottomNav variant="partner" />
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────

function InstantRequestCard({
  request,
  onAction,
  actionLoading,
  formatDate,
  formatAmount,
  mobile,
}: {
  request: InstantRequestItem
  onAction: (id: string, action: "accept" | "reject", type: "instant" | "scheduled") => void
  actionLoading: string | null
  formatDate: (d: string) => string
  formatAmount: (a: string | number) => string
  mobile?: boolean
}) {
  const booking = request.booking
  const isLoading = actionLoading === booking.booking_id
  const customerName = booking.customer
    ? `${booking.customer.first_name} ${booking.customer.last_name}`.trim()
    : "Customer"

  return (
    <div className={`bg-card ${mobile ? "rounded-[1.5rem]" : "rounded-2xl"} shadow-lg overflow-hidden border-2 border-primary/20 relative`}>
      {/* Urgency Banner */}
      <div className="bg-primary/10 px-4 py-2 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-sm animate-pulse">bolt</span>
        <span className="text-primary text-xs font-bold uppercase tracking-wider">Instant Request</span>
        <span className="ml-auto text-xs text-muted">{formatDate(request.notified_at)}</span>
        {request.distance_km && (
          <span className="bg-card text-foreground text-xs font-bold px-2 py-0.5 rounded-full border border-border">
            {request.distance_km} km
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-navy text-xl font-extrabold">{booking.category_name || "Service"}</h3>
            <p className="text-muted text-sm mt-0.5">{booking.address}</p>
          </div>
          <div className="text-right">
            <p className="text-primary text-xl font-black">{formatAmount(booking.total_amount)}</p>
            <p className="text-xs text-muted">Qty: {booking.quantity}</p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="flex items-center gap-3 mb-4 bg-background p-3 rounded-xl border border-border">
          <div className="size-10 rounded-full bg-navy/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-navy">person</span>
          </div>
          <div className="flex-1">
            <p className="text-navy font-bold text-sm">{customerName}</p>
            <p className="text-xs text-muted">{booking.customer?.phone_number}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            disabled={isLoading}
            onClick={() => onAction(booking.booking_id, "reject", "instant")}
            className="flex-1 h-12 rounded-xl border-2 border-border text-muted font-bold flex items-center justify-center hover:bg-muted/10 transition-all disabled:opacity-50"
          >
            Decline
          </button>
          <button
            disabled={isLoading}
            onClick={() => onAction(booking.booking_id, "accept", "instant")}
            className="flex-[1.5] h-12 rounded-xl bg-primary text-white font-bold flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "ACCEPT"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function BookingCard({
  booking,
  onAction,
  actionLoading,
  formatDate,
  formatAmount,
  mobile,
}: {
  booking: BookingItem
  onAction: (id: string, action: "accept" | "reject", type: "instant" | "scheduled") => void
  actionLoading: string | null
  formatDate: (d: string) => string
  formatAmount: (a: string | number) => string
  mobile?: boolean
}) {
  const isLoading = actionLoading === booking.booking_id

  return (
    <div className={`bg-card p-4 ${mobile ? "rounded-2xl shadow-sm" : "rounded-2xl"} border border-border`}>
      <div className="flex items-start gap-4">
        <div className="size-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-2xl">
            {booking.booking_type === "INSTANT" ? "bolt" : "calendar_month"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-foreground font-bold truncate">{booking.service_title}</h4>
              <p className="text-xs text-muted mt-0.5">
                {booking.scheduled_date || formatDate(booking.created_at)}
                {booking.scheduled_time && ` • ${booking.scheduled_time}`}
              </p>
            </div>
            <p className="text-primary font-bold shrink-0">{formatAmount(booking.total_amount)}</p>
          </div>

          {booking.status === "PENDING" && (
            <div className="flex gap-2 mt-3">
              <button
                disabled={isLoading}
                onClick={() => onAction(booking.booking_id, "reject", "scheduled")}
                className="flex-1 h-9 rounded-lg border border-border text-muted text-sm font-semibold hover:bg-muted/10 transition-all disabled:opacity-50"
              >
                Reject
              </button>
              <button
                disabled={isLoading}
                onClick={() => onAction(booking.booking_id, "accept", "scheduled")}
                className="flex-1 h-9 rounded-lg bg-primary text-white text-sm font-semibold shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                ) : (
                  "Accept"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
