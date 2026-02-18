"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { PartnerLayout } from "@/components/partner-layout"
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

export default function PartnerDashboard() {
  const [instantRequests, setInstantRequests] = useState<InstantRequestItem[]>([])
  const [pendingBookings, setPendingBookings] = useState<BookingItem[]>([])
  const [confirmedBookings, setConfirmedBookings] = useState<BookingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    try {
      const [instantRes, pendingRes, confirmedRes] = await Promise.all([
        fetch("/api/partner/bookings/instant"),
        fetch("/api/partner/bookings?status=PENDING"),
        fetch("/api/partner/bookings?status=CONFIRMED"),
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
    } catch (error) {
      console.error("Dashboard fetch error:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [fetchDashboardData])

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
    <PartnerLayout pageTitle="Dashboard">
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* ─── Main Content ─── */}
          <div className="lg:col-span-2 flex flex-col gap-6">
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
            {totalActiveRequests === 0 && confirmedBookings.length === 0 && (
              <div className="bg-card rounded-2xl border border-border p-12 text-center">
                <span className="material-symbols-outlined text-6xl text-muted/30 mb-4">inbox</span>
                <h3 className="text-lg font-bold text-foreground mb-2">No Active Requests</h3>
                <p className="text-muted text-sm max-w-md mx-auto">
                  You'll receive bookings here when customers request your services. Stay online!
                </p>
              </div>
            )}
          </div>

          {/* ─── Right Sidebar Cards ─── */}
          <div className="flex flex-col gap-6">
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

            {/* Help Card */}
            <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-orange-600">help_outline</span>
                <h3 className="font-bold text-orange-900">Need Help?</h3>
              </div>
              <p className="text-sm text-orange-800/80 mb-4 leading-relaxed">
                Having trouble with bookings or payments? Our support team is here 24/7.
              </p>
              <Link
                href="/support"
                className="block w-full py-2.5 bg-white text-orange-600 font-medium text-sm rounded-lg shadow-sm hover:bg-orange-50 transition-colors border border-orange-200 text-center"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      )}
    </PartnerLayout>
  )
}

// ─── Sub-components ──────────────────────────────────────

function InstantRequestCard({
  request,
  onAction,
  actionLoading,
  formatDate,
  formatAmount,
}: {
  request: InstantRequestItem
  onAction: (id: string, action: "accept" | "reject", type: "instant" | "scheduled") => void
  actionLoading: string | null
  formatDate: (d: string) => string
  formatAmount: (a: string | number) => string
}) {
  const booking = request.booking
  const isLoading = actionLoading === booking.booking_id
  const customerName = booking.customer
    ? `${booking.customer.first_name} ${booking.customer.last_name}`.trim()
    : "Customer"

  return (
    <div className="bg-card rounded-2xl shadow-lg overflow-hidden border-2 border-primary/20 relative">
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
}: {
  booking: BookingItem
  onAction: (id: string, action: "accept" | "reject", type: "instant" | "scheduled") => void
  actionLoading: string | null
  formatDate: (d: string) => string
  formatAmount: (a: string | number) => string
}) {
  const isLoading = actionLoading === booking.booking_id

  return (
    <div className="bg-card p-4 rounded-2xl border border-border">
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
