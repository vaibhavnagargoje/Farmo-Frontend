"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { DesktopHeader } from "@/components/desktop-header"
import { MobileHeader } from "@/components/mobile-header"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

// Booking type from backend
interface BookingItem {
  id: number
  booking_id: string
  status: "PENDING" | "CONFIRMED" | "REJECTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  payment_status: "PENDING" | "PAID" | "REFUNDED"
  service_title: string
  provider_name: string
  scheduled_date: string
  scheduled_time: string
  total_amount: string
  created_at: string
}

// Status config for display
const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: "Pending", color: "text-yellow-600", bgColor: "bg-yellow-100" },
  CONFIRMED: { label: "Confirmed", color: "text-primary", bgColor: "bg-primary/10" },
  REJECTED: { label: "Rejected", color: "text-destructive", bgColor: "bg-destructive/10" },
  IN_PROGRESS: { label: "In Progress", color: "text-blue-600", bgColor: "bg-blue-100" },
  COMPLETED: { label: "Completed", color: "text-success", bgColor: "bg-success/10" },
  CANCELLED: { label: "Cancelled", color: "text-muted", bgColor: "bg-muted" },
}

// Tab filters
const tabs = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Upcoming" },
  { key: "in_progress", label: "Active" },
  { key: "completed", label: "Completed" },
]

export default function BookingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  
  // Check for success message from new booking
  const isNewBooking = searchParams.get("success") === "true"
  const newBookingId = searchParams.get("booking_id")

  // Fetch bookings
  const fetchBookings = async (status?: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const url = status && status !== "all" 
        ? `/api/booking/list?status=${status}` 
        : "/api/booking/list"
      
      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
      })
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        setBookings(data.bookings || [])
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

  // Fetch on mount and tab change
  useEffect(() => {
    if (!authLoading) {
      fetchBookings(activeTab)
    }
  }, [activeTab, authLoading])

  // Format date for display
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
      // Convert 24hr to 12hr format
      const [hours, minutes] = timeStr.split(":")
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? "PM" : "AM"
      const hour12 = hour % 12 || 12
      dateDisplay += `, ${hour12}:${minutes} ${ampm}`
    }
    
    return dateDisplay
  }

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  // Not authenticated view
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col pb-24 lg:pb-0 bg-background">
        <DesktopHeader variant="farmer" />
        <MobileHeader />
        
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <span className="material-symbols-outlined text-6xl text-muted mb-4">lock</span>
          <h2 className="text-xl font-bold text-foreground mb-2">Login Required</h2>
          <p className="text-muted mb-6">Please login to view your bookings</p>
          <Link 
            href="/auth?redirect=/bookings" 
            className="px-6 py-3 bg-primary text-white rounded-xl font-semibold"
          >
            Login Now
          </Link>
        </div>
        
        <BottomNav variant="farmer" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col pb-24 lg:pb-0 bg-background">
      {/* Desktop Header */}
      <DesktopHeader variant="farmer" />
      <MobileHeader />

      {/* Mobile Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm pt-4 pb-3 px-6 border-b border-border lg:hidden">
        <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
        <p className="text-sm text-muted mt-1">Track your service bookings</p>
      </header>

      {/* Desktop Content Wrapper */}
      <div className="lg:max-w-7xl lg:mx-auto lg:w-full lg:px-6 lg:py-8">
        {/* Desktop Header */}
        <div className="hidden lg:flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Bookings</h1>
            <p className="text-muted mt-1">Track and manage your service bookings</p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined">add</span>
            New Booking
          </Link>
        </div>

        {/* Success Message */}
        {isNewBooking && (
          <div className="mx-6 lg:mx-0 mb-4 p-4 bg-success/10 border border-success/20 rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-success">check_circle</span>
            <div className="flex-1">
              <p className="font-semibold text-success">Booking Created Successfully!</p>
              {newBookingId && <p className="text-sm text-muted">Booking ID: {newBookingId}</p>}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="px-6 lg:px-0 py-4 flex gap-2 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={cn(
                "px-4 lg:px-6 py-2 lg:py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all",
                activeTab === tab.key
                  ? "bg-navy text-white"
                  : "bg-card text-foreground border border-border hover:bg-muted/50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 text-center">
            <span className="material-symbols-outlined text-5xl text-muted mb-3">cloud_off</span>
            <p className="text-foreground font-medium">{error}</p>
            <button 
              onClick={() => fetchBookings(activeTab)}
              className="mt-4 px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && bookings.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 text-center">
            <span className="material-symbols-outlined text-6xl text-muted mb-4">calendar_month</span>
            <h3 className="text-lg font-bold text-foreground mb-2">No Bookings Yet</h3>
            <p className="text-muted mb-6">
              {activeTab === "all" 
                ? "You haven't made any bookings yet. Start exploring our services!"
                : `No ${tabs.find(t => t.key === activeTab)?.label.toLowerCase()} bookings found.`
              }
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
          <main className="flex-1 px-6 lg:px-0 flex flex-col lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 pb-6">
            {bookings.map((booking) => {
              const status = statusConfig[booking.status] || statusConfig.PENDING
              
              return (
                <Link
                  key={booking.id}
                  href={`/booking/${booking.booking_id}`}
                  className={cn(
                    "bg-card rounded-2xl p-4 lg:p-5 shadow-sm border border-border flex flex-col gap-4 active:scale-[0.99] hover:shadow-lg transition-all",
                    isNewBooking && booking.booking_id === newBookingId && "ring-2 ring-success"
                  )}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground lg:text-lg line-clamp-1">
                        {booking.service_title}
                      </h3>
                      <p className="text-sm text-muted mt-0.5">{booking.provider_name}</p>
                    </div>
                    <span className={cn(
                      "px-2 py-1 rounded text-[10px] font-bold uppercase shrink-0",
                      status.bgColor, status.color
                    )}>
                      {status.label}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted">
                      <span className="material-symbols-outlined text-[18px]">schedule</span>
                      <span className="text-sm">{formatDate(booking.scheduled_date, booking.scheduled_time)}</span>
                    </div>
                    <span className="font-bold text-navy lg:text-lg">₹{booking.total_amount}</span>
                  </div>

                  {/* Booking ID Footer */}
                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted">#{booking.booking_id}</span>
                    <div className="flex items-center gap-1 text-primary text-sm font-medium">
                      <span>View Details</span>
                      <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </main>
        )}
      </div>

      <BottomNav variant="farmer" />
    </div>
  )
}
