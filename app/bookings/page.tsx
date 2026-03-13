"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { AccountLayout } from "@/components/account-layout"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"


// Booking type from backend
interface BookingItem {
  id: number
  booking_id: string
  booking_type: "SCHEDULED"
  order_number: string | null
  status: "PENDING" | "SEARCHING" | "CONFIRMED" | "REJECTED" | "EXPIRED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  payment_status: "PENDING" | "PAID" | "REFUNDED"
  service_title: string
  category_name: string | null
  provider_name: string
  scheduled_date: string
  scheduled_time: string
  total_amount: string
  broadcast_count: number
  assigned_at: string | null
  expires_at: string | null
  created_at: string
}

// Status config for display
const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: "Pending", color: "text-yellow-600", bgColor: "bg-yellow-100" },
  SEARCHING: { label: "Searching", color: "text-blue-600", bgColor: "bg-blue-100" },
  CONFIRMED: { label: "Confirmed", color: "text-primary", bgColor: "bg-primary/10" },
  REJECTED: { label: "Rejected", color: "text-destructive", bgColor: "bg-destructive/10" },
  EXPIRED: { label: "Expired", color: "text-orange-600", bgColor: "bg-orange-100" },
  IN_PROGRESS: { label: "In Progress", color: "text-blue-600", bgColor: "bg-blue-100" },
  COMPLETED: { label: "Completed", color: "text-success", bgColor: "bg-success/10" },
  CANCELLED: { label: "Cancelled", color: "text-muted", bgColor: "bg-muted" },
}



export default function BookingsPage() {
  return (
    <Suspense fallback={
      <AccountLayout pageTitle="My Bookings">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      </AccountLayout>
    }>
      <BookingsPageContent />
    </Suspense>
  )
}

function BookingsPageContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchingToast, setSearchingToast] = useState(false)

  // Cancel state
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const isNewBooking = searchParams.get("success") === "true"
  const newBookingId = searchParams.get("booking_id")

  // Fetch bookings
  const fetchBookings = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/bookings/list", {
        method: "GET",
        credentials: "include",
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setBookings(data.bookings || data.results || [])
      } else if (res.status === 401) {
        setError("Please login to view your bookings")
        setBookings([])
      } else {
        setError(data.message || "Failed to load bookings")
        setBookings([])
      }
    } catch (err) {
      console.error("Error fetching bookings:", err)
      setError("Unable to connect. Please try again.")
      setBookings([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      fetchBookings()
    }
  }, [authLoading])

  // Handle clicking on a booking card
  const handleBookingClick = (booking: BookingItem) => {
    if (booking.status === "SEARCHING" || booking.status === "CANCELLED" || booking.status === "EXPIRED") {
      setSearchingToast(true)
      setTimeout(() => setSearchingToast(false), 3000)
      return
    }
    router.push(`/bookings/${booking.booking_id}`)
  }

  // Open cancel modal
  const openCancelModal = (e: React.MouseEvent, bookingId: string) => {
    e.stopPropagation()
    setCancelBookingId(bookingId)
    setCancelReason("")
    setCancelError(null)
    setShowCancelModal(true)
  }

  // Cancel booking handler
  const handleCancelBooking = async () => {
    if (!cancelBookingId || cancelReason.trim().length < 10) {
      setCancelError("Please provide a reason (at least 10 characters)")
      return
    }

    setIsCancelling(true)
    setCancelError(null)

    try {
      const res = await fetch(`/api/bookings/${cancelBookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason: cancelReason.trim() }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setShowCancelModal(false)
        setCancelBookingId(null)
        setCancelReason("")
        fetchBookings() // Refresh list
      } else {
        setCancelError(data.message || "Failed to cancel booking")
      }
    } catch (err) {
      console.error("Cancel error:", err)
      setCancelError("Something went wrong. Please try again.")
    } finally {
      setIsCancelling(false)
    }
  }

  const isCancellable = (status: string) =>
    status === "PENDING" || status === "SEARCHING" || status === "CONFIRMED"

  // Format date
  const formatDate = (dateStr: string, timeStr?: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let dateDisplay = ""
    if (date.toDateString() === today.toDateString()) {
      dateDisplay = "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateDisplay = "Yesterday"
    } else {
      dateDisplay = date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
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

  return (
    <AccountLayout pageTitle="My Bookings">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl lg:text-2xl font-bold text-foreground">My Bookings</h2>
        <p className="text-sm text-muted mt-1">Track and manage your service bookings</p>
      </div>

      {/* Success Message */}
      {isNewBooking && (
        <div className="mb-4 p-4 bg-success/10 border border-success/20 rounded-xl flex items-center gap-3">
          <span className="material-symbols-outlined text-success">check_circle</span>
          <div className="flex-1">
            <p className="font-semibold text-success">Booking Created Successfully!</p>
            {newBookingId && <p className="text-sm text-muted">Booking ID: {newBookingId}</p>}
          </div>
        </div>
      )}

      {/* Searching Toast */}
      {searchingToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 bg-navy text-white rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="material-symbols-outlined text-lg">info</span>
          <span className="text-sm font-medium">Order details are not available for this booking.</span>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <span className="material-symbols-outlined text-5xl text-muted mb-3">cloud_off</span>
          <p className="text-foreground font-medium">{error}</p>
          <button
            onClick={() => fetchBookings()}
            className="mt-4 px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && bookings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <span className="material-symbols-outlined text-6xl text-muted mb-4">calendar_month</span>
          <h3 className="text-lg font-bold text-foreground mb-2">No Bookings Yet</h3>
          <p className="text-muted mb-6">
            You haven&apos;t made any bookings yet. Start exploring our services!
          </p>
          <Link
            href="/"
            className="px-6 py-3 bg-primary text-white rounded-xl font-semibold"
          >
            Browse Services
          </Link>
        </div>
      )}

      {/* Bookings List */}
      {!isLoading && !error && bookings.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 pb-4">
          {bookings.map((booking) => {
            const status = statusConfig[booking.status] || statusConfig.PENDING
            const isBlocked = booking.status === "SEARCHING" || booking.status === "CANCELLED" || booking.status === "EXPIRED"

            return (
              <div
                key={booking.id}
                onClick={() => handleBookingClick(booking)}
                className={cn(
                  "bg-card rounded-2xl p-4 lg:p-5 shadow-sm border border-border flex flex-col gap-4 transition-all",
                  isBlocked
                    ? "opacity-75 cursor-default"
                    : "active:scale-[0.99] hover:shadow-lg cursor-pointer",
                  isNewBooking && booking.booking_id === newBookingId && "ring-2 ring-success"
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground lg:text-lg line-clamp-1">
                        {booking.service_title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted mt-0.5">
                      {booking.status === "SEARCHING" ? "Finding provider..." : booking.provider_name}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={cn(
                      "px-2 py-1 rounded text-[10px] font-bold uppercase",
                      status.bgColor, status.color
                    )}>
                      {status.label}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted">
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                    <span className="text-sm">{formatDate(booking.scheduled_date, booking.scheduled_time)}</span>
                  </div>
                  <span className="font-bold text-navy lg:text-lg">₹{booking.total_amount}</span>
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted">
                    {booking.order_number ? booking.order_number : `#${booking.booking_id}`}
                  </span>
                  <div className="flex items-center gap-2">
                    {isCancellable(booking.status) && (
                      <button
                        onClick={(e) => openCancelModal(e, booking.booking_id)}
                        className="flex items-center gap-1 text-destructive/70 hover:text-destructive text-xs font-medium px-2 py-1 rounded-lg hover:bg-destructive/5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                        Cancel
                      </button>
                    )}
                    {booking.status === "SEARCHING" ? (
                      <div className="flex items-center gap-1 text-muted text-sm">
                        <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                        <span>Processing</span>
                      </div>
                    ) : isBlocked ? (
                      <div className="flex items-center gap-1 text-muted text-sm">
                        <span>{status.label}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-primary text-sm font-medium">
                        <span>View Details</span>
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
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
                <h3 className="font-bold text-lg text-foreground">Cancel Booking?</h3>
                <p className="text-sm text-muted">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium text-foreground mb-2 block">Reason for cancellation</label>
              <textarea
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value)
                  if (cancelError) setCancelError(null)
                }}
                placeholder="Please tell us why you want to cancel (min 10 characters)..."
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
                  setCancelBookingId(null)
                  setCancelReason("")
                  setCancelError(null)
                }}
                disabled={isCancelling}
                className="flex-1 py-3 rounded-xl border border-border text-foreground font-semibold hover:bg-muted/50 transition-colors"
              >
                Go Back
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
                  "Confirm Cancel"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AccountLayout>
  )
}
