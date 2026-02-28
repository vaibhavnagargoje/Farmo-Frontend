"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { DesktopHeader } from "@/components/desktop-header"
import { MobileHeader } from "@/components/mobile-header"
import { BottomNav } from "@/components/bottom-nav"
import { useAuth } from "@/contexts/auth-context"
import { type Service } from "@/lib/api"
import { cn } from "@/lib/utils"

export default function NewBookingPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const serviceId = params.serviceId as string

  // Service Data
  const [service, setService] = useState<Service | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Image Gallery
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  // Booking Form
  const [quantity, setQuantity] = useState(1)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [note, setNote] = useState("")

  // Location from profile
  const [profileAddress, setProfileAddress] = useState<string | null>(null)
  const [profileLat, setProfileLat] = useState<number | null>(null)
  const [profileLng, setProfileLng] = useState<number | null>(null)

  // Booking State
  const [isBooking, setIsBooking] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)

  // Fetch service details
  useEffect(() => {
    const fetchService = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/services/${serviceId}`)
        if (res.ok) {
          const data = await res.json()
          setService(data)
        } else {
          setError("Service not found")
        }
      } catch (err) {
        console.error("Error fetching service:", err)
        setError("Failed to load service")
      } finally {
        setIsLoading(false)
      }
    }

    if (serviceId) {
      fetchService()
    }
  }, [serviceId])

  // Fetch address from user profile
  useEffect(() => {
    const fetchProfileAddress = async () => {
      try {
        const res = await fetch("/api/profile", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          if (data.profile?.user_address) {
            setProfileAddress(data.profile.user_address)
          }
          if (data.profile?.latitude) setProfileLat(parseFloat(data.profile.latitude))
          if (data.profile?.longitude) setProfileLng(parseFloat(data.profile.longitude))
        }
      } catch {
        // Profile fetch failed — address will be empty
      }
    }
    fetchProfileAddress()
  }, [])

  // Set default date/time to now
  useEffect(() => {
    const now = new Date()
    const dateStr = now.toISOString().split("T")[0]
    const timeStr = now.toTimeString().slice(0, 5)
    setScheduledDate(dateStr)
    setScheduledTime(timeStr)
  }, [])



  // Handle booking submission
  const handleBookService = async () => {
    if (!isAuthenticated) {
      router.push(`/auth?redirect=/booking/new/${serviceId}`)
      return
    }

    if (!service) return

    setIsBooking(true)
    setBookingError(null)

    try {
      const bookingData = {
        service_id: service.id,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        address: profileAddress || "",
        lat: profileLat || 0,
        lng: profileLng || 0,
        quantity: quantity,
        note: note || undefined,
      }

      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(bookingData),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        // Redirect to bookings list with success message
        router.push(`/bookings?success=true&booking_id=${data.booking?.booking_id || ""}`)
      } else {
        setBookingError(data.message || "Failed to create booking")
      }
    } catch (err) {
      console.error("Booking error:", err)
      setBookingError("Something went wrong. Please try again.")
    } finally {
      setIsBooking(false)
    }
  }

  // Price calculation
  const getPriceUnit = () => {
    if (!service) return ""
    switch (service.price_unit) {
      case "HOUR": return "/hr"
      case "DAY": return "/day"
      case "ACRE": return "/acre"
      case "KM": return "/km"
      default: return ""
    }
  }

  const totalPrice = service ? parseFloat(service.price) * quantity : 0

  // Get all images including thumbnail
  const allImages = service?.images?.length 
    ? service.images 
    : service?.thumbnail 
      ? [{ id: 0, image: service.thumbnail, is_thumbnail: true }]
      : []

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

  if (error || !service) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <DesktopHeader variant="farmer" />
        <MobileHeader />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <span className="material-symbols-outlined text-6xl text-muted">error</span>
          <p className="text-lg font-medium text-foreground">{error || "Service not found"}</p>
          <Link href="/" className="text-primary font-semibold">
            Go back home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col pb-24 lg:pb-0 bg-background">
      <DesktopHeader variant="farmer" />
      <MobileHeader />

      {/* Desktop Layout */}
      <div className="hidden lg:block max-w-6xl mx-auto w-full px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted mb-6">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link href={`/category/${service.category?.slug || ""}`} className="hover:text-primary transition-colors">
            {service.category?.name || service.category_name}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Book Service</span>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Left - Images & Details */}
          <div className="col-span-2 flex flex-col gap-6">
            {/* Image Gallery */}
            <div className="bg-card rounded-2xl overflow-hidden border border-border">
              {/* Main Image */}
              <div className="relative aspect-video bg-muted">
                {allImages.length > 0 ? (
                  <Image
                    src={allImages[activeImageIndex]?.image || "/placeholder.svg"}
                    alt={service.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted">
                    <span className="material-symbols-outlined text-6xl">image</span>
                  </div>
                )}
                
                {/* Availability Badge */}
                {!service.is_available && (
                  <div className="absolute top-4 left-4 px-3 py-1 bg-destructive text-white text-sm font-bold rounded-full">
                    Currently Unavailable
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {allImages.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {allImages.map((img, index) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImageIndex(index)}
                      className={cn(
                        "relative w-20 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all",
                        activeImageIndex === index ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                      )}
                    >
                      <Image src={img.image} alt="" fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Service Info */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-primary font-semibold mb-1">{service.category?.name || service.category_name}</p>
                  <h1 className="text-2xl font-bold text-foreground">{service.title}</h1>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-navy">₹{service.price}</p>
                  <p className="text-sm text-muted">{getPriceUnit()}</p>
                </div>
              </div>

              {/* Partner Info */}
              <div className="flex items-center gap-3 py-4 border-t border-b border-border">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl text-muted-foreground">person</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{service.partner?.business_name || service.partner_name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <span className="material-symbols-outlined text-yellow-500 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="font-semibold text-foreground">{service.partner?.rating || service.partner_rating || "New"}</span>
                    <span>•</span>
                    <span>{service.partner?.jobs_completed || 0} jobs completed</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {service.description && (
                <div className="mt-4">
                  <h3 className="font-semibold text-foreground mb-2">Description</h3>
                  <p className="text-muted leading-relaxed">{service.description}</p>
                </div>
              )}

              {/* Specifications */}
              {service.specifications && Object.keys(service.specifications).length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-foreground mb-3">Specifications</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(service.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 px-3 bg-muted/30 rounded-lg">
                        <span className="text-muted text-sm">{key}</span>
                        <span className="font-medium text-foreground text-sm">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right - Booking Panel */}
          <div className="col-span-1">
            <div className="bg-card rounded-2xl p-6 border border-border sticky top-24">
              <h2 className="text-lg font-bold text-foreground mb-4">Book This Service</h2>

              {/* Quantity */}
              <div className="mb-4">
                <label className="text-sm font-medium text-foreground mb-2 block">Quantity</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full h-11 px-4 border border-border rounded-xl bg-background font-medium"
                />
              </div>

              {/* Location */}
              <div className="mb-4">
                <label className="text-sm font-medium text-foreground mb-2 block">Your Location</label>
                <div className="flex items-center gap-2 p-3 rounded-xl border border-border bg-muted/30">
                  <span className="material-symbols-outlined text-xl text-muted">location_on</span>
                  <span className="text-sm text-foreground">
                    {profileAddress || "No address on profile"}
                  </span>
                </div>
              </div>

              {/* Advanced Options Toggle */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-primary font-medium mb-4"
              >
                <span className="material-symbols-outlined text-lg">{showAdvanced ? "expand_less" : "expand_more"}</span>
                {showAdvanced ? "Hide" : "Show"} Advanced Options
              </button>

              {/* Advanced Options */}
              {showAdvanced && (
                <div className="space-y-4 mb-4 p-4 bg-muted/20 rounded-xl">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Schedule Date</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full h-10 px-3 border border-border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Schedule Time</label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full h-10 px-3 border border-border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Note for Partner (Optional)</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Any special instructions..."
                      className="w-full p-3 border border-border rounded-lg bg-background resize-none h-20"
                    />
                  </div>
                </div>
              )}

              {/* Price Summary */}
              <div className="border-t border-border pt-4 mb-4">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-muted">₹{service.price} × {quantity}</span>
                  <span className="text-foreground">₹{Math.round(totalPrice)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-2xl font-bold text-primary">₹{Math.round(totalPrice)}</span>
                </div>
              </div>

              {/* Error Message */}
              {bookingError && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                  {bookingError}
                </div>
              )}

              {/* Book Button */}
              <button
                onClick={handleBookService}
                disabled={isBooking || !service.is_available}
                className={cn(
                  "w-full h-14 rounded-xl font-bold text-lg transition-all",
                  service.is_available
                    ? "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {isBooking ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin material-symbols-outlined text-xl">sync</span>
                    Creating Booking...
                  </span>
                ) : service.is_available ? (
                  "Book Service"
                ) : (
                  "Currently Unavailable"
                )}
              </button>

              {!isAuthenticated && (
                <p className="text-xs text-center text-muted mt-3">
                  You'll need to <Link href={`/auth?redirect=/booking/new/${serviceId}`} className="text-primary font-medium">login</Link> to complete booking
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <main className="lg:hidden flex-1">
        {/* Image Gallery - Mobile */}
        <div className="relative aspect-[4/3] bg-muted">
          {allImages.length > 0 ? (
            <Image
              src={allImages[activeImageIndex]?.image || "/placeholder.svg"}
              alt={service.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted">
              <span className="material-symbols-outlined text-6xl">image</span>
            </div>
          )}
          
          {/* Back Button */}
          <Link
            href="/"
            className="absolute top-4 left-4 size-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>

          {/* Image Counter */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/60 rounded-full text-white text-sm">
              {activeImageIndex + 1} / {allImages.length}
            </div>
          )}

          {/* Availability Badge */}
          {!service.is_available && (
            <div className="absolute top-4 right-4 px-3 py-1 bg-destructive text-white text-sm font-bold rounded-full">
              Unavailable
            </div>
          )}
        </div>

        {/* Thumbnail Strip - Mobile */}
        {allImages.length > 1 && (
          <div className="flex gap-2 p-4 overflow-x-auto bg-card border-b border-border">
            {allImages.map((img, index) => (
              <button
                key={img.id}
                onClick={() => setActiveImageIndex(index)}
                className={cn(
                  "relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all",
                  activeImageIndex === index ? "border-primary" : "border-transparent opacity-60"
                )}
              >
                <Image src={img.image} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Service Info - Mobile */}
        <div className="p-4 space-y-4">
          {/* Title & Price */}
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-sm text-primary font-semibold mb-1">{service.category?.name || service.category_name}</p>
            <h1 className="text-xl font-bold text-foreground mb-2">{service.title}</h1>
            <div className="flex items-end justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-yellow-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="font-semibold">{service.partner?.rating || service.partner_rating || "New"}</span>
                <span className="text-muted text-sm">• {service.partner?.business_name || service.partner_name}</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-navy">₹{service.price}</span>
                <span className="text-sm text-muted">{getPriceUnit()}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {service.description && (
            <div className="bg-card rounded-2xl p-4 border border-border">
              <h3 className="font-semibold text-foreground mb-2">About Service</h3>
              <p className="text-muted text-sm leading-relaxed">{service.description}</p>
            </div>
          )}

          {/* Booking Form - Mobile */}
          <div className="bg-card rounded-2xl p-4 border border-border space-y-4">
            <h3 className="font-semibold text-foreground">Book Now</h3>

            {/* Quantity */}
            <div>
              <label className="text-sm text-muted mb-2 block">Quantity</label>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full h-11 px-4 border border-border rounded-xl bg-background font-medium"
              />
            </div>

            {/* Location */}
            <div>
              <label className="text-sm text-muted mb-2 block">Your Location</label>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
                <span className="material-symbols-outlined text-xl text-muted">location_on</span>
                <span className="text-sm text-foreground">
                  {profileAddress || "No address on profile"}
                </span>
              </div>
            </div>

            {/* Advanced Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-primary font-medium"
            >
              <span className="material-symbols-outlined text-lg">{showAdvanced ? "expand_less" : "schedule"}</span>
              Schedule for later
            </button>

            {showAdvanced && (
              <div className="space-y-3 p-3 bg-muted/20 rounded-xl">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted mb-1 block">Date</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full h-10 px-3 text-sm border border-border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted mb-1 block">Time</label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full h-10 px-3 text-sm border border-border rounded-lg bg-background"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Note (Optional)</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Any instructions..."
                    className="w-full p-2 text-sm border border-border rounded-lg bg-background resize-none h-16"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Bar - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 lg:hidden z-40">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-muted">Total Amount</p>
            <p className="text-xl font-bold text-primary">₹{Math.round(totalPrice)}</p>
          </div>
          <div className="text-right text-xs text-muted">
            ₹{service.price} × {quantity}
          </div>
        </div>
        
        {bookingError && (
          <p className="text-xs text-destructive mb-2">{bookingError}</p>
        )}

        <button
          onClick={handleBookService}
          disabled={isBooking || !service.is_available}
          className={cn(
            "w-full h-12 rounded-xl font-bold transition-all",
            service.is_available
              ? "bg-primary text-white shadow-lg shadow-primary/25"
              : "bg-muted text-muted-foreground"
          )}
        >
          {isBooking ? "Creating Booking..." : service.is_available ? "Book Service" : "Unavailable"}
        </button>
      </div>

      <BottomNav variant="farmer" />
    </div>
  )
}
