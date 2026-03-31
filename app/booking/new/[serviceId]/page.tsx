"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { DesktopHeader } from "@/components/desktop-header"
import { MobileHeader } from "@/components/mobile-header"
import { BottomNav } from "@/components/bottom-nav"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { type Service, type PriceUnit } from "@/lib/api"
import { cn } from "@/lib/utils"

export default function NewBookingPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { t, lang } = useLanguage()
  const serviceId = params.serviceId as string

  // Service Data
  const [service, setService] = useState<Service | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Image Gallery
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  // Booking Form
  const [quantity, setQuantity] = useState(1)
  const [selectedUnit, setSelectedUnit] = useState<string>("")
  const [priceUnits, setPriceUnits] = useState<PriceUnit[]>([])
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
  const [duplicateProvider, setDuplicateProvider] = useState(false)

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

  // Fetch address from user location (shared UserLocation model)
  useEffect(() => {
    const fetchProfileAddress = async () => {
      try {
        const res = await fetch("/api/auth/location", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          if (data.has_location && data.location) {
            if (data.location.address) setProfileAddress(data.location.address)
            if (data.location.latitude) setProfileLat(parseFloat(data.location.latitude))
            if (data.location.longitude) setProfileLng(parseFloat(data.location.longitude))
          }
        }
      } catch {
        // Location fetch failed — address will be empty
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
    setDuplicateProvider(false)

    try {
      const bookingData = {
        service_id: service.id,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        address: profileAddress || "",
        lat: profileLat || 0,
        lng: profileLng || 0,
        quantity: quantity,
        price_unit: selectedUnit || service.price_unit,
        note: note || undefined,
      }

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(bookingData),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        // Redirect to bookings list with success message
        router.push(`/bookings?success=true&booking_id=${data.booking?.booking_id || ""}`)
      } else if (data.duplicate_provider) {
        // Show duplicate provider popup
        setDuplicateProvider(true)
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
  // Fetch price units on mount
  useEffect(() => {
    const fetchPriceUnits = async () => {
      try {
        const res = await fetch("/api/services/price-units")
        if (res.ok) {
          const data = await res.json()
          setPriceUnits(Array.isArray(data) ? data : [])
        }
      } catch {
        // Price units fetch is optional fallback
      }
    }
    fetchPriceUnits()
  }, [])

  // Auto-select unit when service loads
  useEffect(() => {
    if (service && service.price_unit && !selectedUnit) {
      setSelectedUnit(service.price_unit)
    }
  }, [service, selectedUnit])

  const getPriceUnitLabel = (unitValue: string) => {
    const unit = priceUnits.find(u => u.value === unitValue)
    const tKey = `unit.${unitValue.toLowerCase()}`
    const tVal = t(tKey)
    const lbl = tVal === tKey ? (unit ? unit.label : unitValue.toLowerCase()) : tVal
    return `/${lbl}`
  }

  const getPriceUnit = () => getPriceUnitLabel(selectedUnit || service?.price_unit || "")

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
          <p className="text-lg font-medium text-foreground">{error || t("service.not_found")}</p>
          <Link href="/" className="text-primary font-semibold">
            {t("booking.go_back_home")}
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
          <Link href="/" className="hover:text-primary transition-colors">{t("nav.home")}</Link>
          <span>/</span>
          <Link href={`/category/${service.category?.slug || ""}`} className="hover:text-primary transition-colors">
            {service.category?.name_translations?.[lang] || service.category?.name || service.category_name}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{t("booking.book_this_service")}</span>
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
                    className="object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted">
                    <span className="material-symbols-outlined text-6xl">image</span>
                  </div>
                )}

                {/* Availability Badge */}
                {!service.is_available && (
                  <div className="absolute top-4 left-4 px-3 py-1 bg-destructive text-white text-sm font-bold rounded-full">
                    {t("booking.unavailable")}
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
                <div className="flex-1 pr-4">
                  <p className="text-sm text-primary font-semibold mb-1">
                    {service.category?.name_translations?.[lang] || service.category?.name || service.category_name}
                  </p>
                  <h1 className="text-2xl font-bold text-foreground overflow-hidden text-ellipsis">{service.title}</h1>
                </div>
                <div className="flex flex-col items-end justify-start shrink-0">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-navy">₹{service.price}</span>
                    <span className="text-sm font-medium text-muted">{getPriceUnit()}</span>
                  </div>
                </div>
              </div>

              {/* Partner Info */}
              <div className="flex items-center gap-3 py-4 border-t border-b border-border">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl text-muted-foreground">person</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{service.partner?.full_name || service.partner_name}</p>
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
                  <h3 className="font-semibold text-foreground mb-2">{t("booking.about_service")}</h3>
                  <p className="text-muted leading-relaxed">{service.description}</p>
                </div>
              )}

              {/* Specifications */}
              {service.specifications && Object.keys(service.specifications).length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-foreground mb-3">{t("booking.specifications")}</h3>
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
              <h2 className="text-lg font-bold text-foreground mb-4">{t("booking.book_this_service")}</h2>

              {/* Quantity & Unit Row */}
              <div className={cn("mb-4", priceUnits.length > 0 ? "grid grid-cols-2 gap-4" : "")}>
                {/* Quantity */}
                <div>
                  {/* <label className="text-sm font-medium text-foreground mb-2 block">{t("booking.quantity") || "Quantity"}</label> */}
                  <div className="flex items-center w-full h-11 border border-border rounded-xl bg-background overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-full px-4 text-foreground/70 hover:text-foreground hover:bg-muted/50 transition-colors border-r border-border shrink-0 flex items-center justify-center font-bold text-lg focus:outline-none"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <div className="flex-1 text-center font-medium text-foreground bg-transparent w-full">
                      {quantity}
                    </div>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="h-full px-4 text-foreground/70 hover:text-foreground hover:bg-muted/50 transition-colors border-l border-border shrink-0 flex items-center justify-center font-bold text-lg focus:outline-none"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Unit Selector */}
                {priceUnits.length > 0 && (
                  <div>
                    {/* <label className="text-sm font-medium text-foreground mb-2 block">{t("booking.unit") || "Unit"}</label> */}
                    <div className="relative">
                      <select
                        value={selectedUnit || service.price_unit}
                        onChange={(e) => setSelectedUnit(e.target.value)}
                        className="w-full h-11 pl-4 pr-10 border border-border rounded-xl bg-background font-medium appearance-none text-foreground"
                      >
                        {priceUnits.map((u) => {
                          const mkKey = `unit.${u.value.toLowerCase()}`
                          const translated = t(mkKey)
                          const optLabel = translated === mkKey ? u.label : translated
                          return (
                            <option key={u.value} value={u.value}>
                              {optLabel}
                            </option>
                          )
                        })}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                        <span className="material-symbols-outlined text-[20px]">expand_more</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Note */}
              <div className="mb-4">
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">{t("booking.additional_note")}</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("booking.note_placeholder")}
                  rows={2}
                  className="w-full border border-border rounded-lg bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-navy/20 resize-none placeholder:text-muted-foreground/50 transition-all"
                />
              </div>

              {/* Error Message */}
              {bookingError && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                  {bookingError}
                </div>
              )}

              {/* Swipe To Book */}
              <SwipeToBookControl
                onComplete={handleBookService}
                isLoading={isBooking}
                disabled={!service.is_available}
                swipeText={t("booking.swipe_to_book")}
                loadingText={t("booking.creating_booking")}
                unavailableText={t("booking.unavailable")}
              />

              {!isAuthenticated && (
                <p className="text-xs text-center text-muted mt-3">
                  <Link href={`/auth?redirect=/booking/new/${serviceId}`} className="text-primary font-medium">{t("booking.login_required")}</Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <main className="lg:hidden flex-1 w-full overflow-x-hidden pb-40">
        {/* Image Gallery - Mobile */}
        <div className="relative aspect-video w-full max-w-full overflow-hidden bg-muted">
          {allImages.length > 0 ? (
            <Image
              src={allImages[activeImageIndex]?.image || "/placeholder.svg"}
              alt={service.title}
              fill
              className="object-contain"
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
              {t("booking.unavailable")}
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
            <p className="text-sm text-primary font-semibold mb-1">
              {service.category?.name_translations?.[lang] || service.category?.name || service.category_name}
            </p>
            <h1 className="text-xl font-bold text-foreground mb-2 wrap-break-word">{service.title}</h1>
            <div className="flex items-end justify-between gap-2 mt-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="material-symbols-outlined text-yellow-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="font-semibold text-sm">{service.partner?.rating || service.partner_rating || "New"}</span>
                <span className="text-muted text-xs truncate max-w-30">• {service.partner?.full_name || service.partner_name}</span>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-navy">₹{service.price}</span>
                  <span className="text-sm font-medium text-muted">{getPriceUnit()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {service.description && (
            <div className="bg-card rounded-2xl p-4 border border-border">
              <h3 className="font-semibold text-foreground mb-2">{t("booking.about_service")}</h3>
              <p className="text-muted text-sm leading-relaxed">{service.description}</p>
            </div>
          )}

          {/* Booking Form - Mobile */}
          <div className="bg-card rounded-2xl p-4 border border-border space-y-4">
            <h3 className="font-semibold text-foreground">{t("booking.enter_estimated_detail") || "Enter Estimated Details"}</h3>

            <div className={cn("mb-2", priceUnits.length > 0 ? "grid grid-cols-2 gap-3" : "")}>
              {/* Quantity */}
              <div>
                {/* <label className="text-sm text-muted mb-2 block">{t("booking.quantity") || "Quantity"}</label> */}
                <div className="flex items-center w-full h-11 border border-border rounded-xl bg-background overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-full px-3 text-foreground/70 active:text-foreground active:bg-muted/50 transition-colors border-r border-border shrink-0 flex items-center justify-center font-medium focus:outline-none text-lg select-none"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center font-medium text-foreground bg-transparent w-full">
                    {quantity}
                  </div>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-full px-3 text-foreground/70 active:text-foreground active:bg-muted/50 transition-colors border-l border-border shrink-0 flex items-center justify-center font-medium focus:outline-none text-lg select-none"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Unit Selector */}
              {priceUnits.length > 0 && (
                <div>
                  {/* <label className="text-sm text-muted mb-2 block">{t("booking.unit") || "Unit"}</label> */}
                  <div className="relative">
                    <select
                      value={selectedUnit || service.price_unit}
                      onChange={(e) => setSelectedUnit(e.target.value)}
                      className="w-full h-11 pl-3 pr-8 border border-border rounded-xl bg-background font-medium appearance-none text-foreground text-sm"
                    >
                      {priceUnits.map((u) => {
                        const mkKey = `unit.${u.value.toLowerCase()}`
                        const translated = t(mkKey)
                        const optLabel = translated === mkKey ? u.label : translated
                        return (
                          <option key={u.value} value={u.value}>
                            {optLabel}
                          </option>
                        )
                      })}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-muted-foreground">
                      <span className="material-symbols-outlined text-[18px]">expand_more</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Note */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">{t("booking.additional_note")}</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("booking.note_placeholder")}
                rows={2}
                className="w-full border border-border rounded-lg bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-navy/20 resize-none placeholder:text-muted-foreground/50 transition-all"
              />
            </div>

            {bookingError && (
              <p className="text-xs text-destructive">{bookingError}</p>
            )}

            <SwipeToBookControl
              onComplete={handleBookService}
              isLoading={isBooking}
              disabled={!service.is_available}
              swipeText={t("booking.swipe_to_book")}
              loadingText={t("booking.creating_booking")}
              unavailableText={t("booking.unavailable")}
            />
          </div>
        </div>
      </main>

      {/* ─── DUPLICATE PROVIDER MODAL ─── */}
      {duplicateProvider && (
        <div className="fixed inset-0 z-100 flex items-end lg:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDuplicateProvider(false)} />
          <div className="relative w-full max-w-md mx-4 bg-card rounded-t-3xl lg:rounded-3xl border border-border shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
            <div className="bg-linear-to-br from-orange-500 to-orange-600 px-6 py-8 text-center text-white">
              <div className="size-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              </div>
              <h2 className="text-xl font-bold mb-1">{t("booking.duplicate_provider_title")}</h2>
              <p className="text-sm text-white/80">{t("booking.duplicate_provider_msg")}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-orange-600 text-[24px] shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t("booking.duplicate_provider_info")}</p>
                  <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
                    {t("booking.duplicate_provider_wait")}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => router.push("/orders")}
                  className="flex-1 py-3 bg-navy text-white font-semibold rounded-xl hover:bg-navy/90 transition-colors text-sm"
                >
                  {t("booking.view_orders")}
                </button>
                <button
                  onClick={() => setDuplicateProvider(false)}
                  className="flex-1 py-3 bg-muted/50 text-foreground font-semibold rounded-xl hover:bg-muted transition-colors text-sm"
                >
                  {t("common.close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav variant="farmer" />
    </div>
  )
}

function SwipeToBookControl({
  onComplete,
  isLoading,
  disabled,
  swipeText,
  loadingText,
  unavailableText,
}: {
  onComplete: () => Promise<void> | void
  isLoading: boolean
  disabled: boolean
  swipeText: string
  loadingText: string
  unavailableText: string
}) {
  const sliderRef = useRef<HTMLDivElement>(null)
  const sliderStartX = useRef(0)
  const sliderWidth = useRef(0)
  const [sliderProgress, setSliderProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const triggerComplete = () => {
    Promise.resolve(onComplete()).finally(() => {
      setSliderProgress(0)
      setIsDragging(false)
    })
  }

  const onSliderTouchStart = (e: React.TouchEvent) => {
    if (!sliderRef.current || isLoading || disabled) return
    setIsDragging(true)
    sliderStartX.current = e.touches[0].clientX
    sliderWidth.current = sliderRef.current.offsetWidth - 64
  }

  const onSliderTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const pct = Math.min(Math.max((e.touches[0].clientX - sliderStartX.current) / sliderWidth.current, 0), 1)
    setSliderProgress(pct)
  }

  const onSliderTouchEnd = () => {
    setIsDragging(false)
    if (sliderProgress > 0.85) {
      setSliderProgress(1)
      triggerComplete()
    } else {
      setSliderProgress(0)
    }
  }

  const onSliderMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current || isLoading || disabled) return
    setIsDragging(true)
    sliderStartX.current = e.clientX
    sliderWidth.current = sliderRef.current.offsetWidth - 64

    const onMouseMove = (ev: MouseEvent) => {
      const pct = Math.min(Math.max((ev.clientX - sliderStartX.current) / sliderWidth.current, 0), 1)
      setSliderProgress(pct)
    }

    const onMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
      setSliderProgress((prev) => {
        if (prev > 0.85) {
          setTimeout(() => triggerComplete(), 0)
          return 1
        }
        return 0
      })
    }

    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
  }

  if (isLoading) {
    return (
      <div className="relative h-14 rounded-xl bg-navy/80 flex items-center justify-center gap-2">
        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
        <p className="text-white/80 text-sm font-semibold">{loadingText}</p>
      </div>
    )
  }

  if (disabled) {
    return (
      <div className="relative h-14 bg-muted/60 border border-border rounded-xl flex items-center justify-center gap-2">
        <span className="material-symbols-outlined text-muted-foreground text-[20px]">search_off</span>
        <p className="text-sm font-medium text-muted-foreground">{unavailableText}</p>
      </div>
    )
  }

  return (
    <div
      ref={sliderRef}
      className="relative h-14 rounded-xl overflow-hidden select-none touch-none shadow-lg bg-navy"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <p className={`text-white/60 text-sm font-semibold tracking-wide transition-opacity duration-200 ${sliderProgress > 0.15 ? "opacity-0" : "opacity-100"}`}>
          {swipeText}
        </p>
      </div>
      <div
        className="absolute inset-y-0 left-0 bg-green-500/20 rounded-xl transition-[width] duration-75"
        style={{ width: `${sliderProgress * 100}%` }}
      />
      <div
        className="absolute top-1.5 bottom-1.5 w-13 rounded-[10px] bg-white flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing z-10 transition-[left] duration-75"
        style={{ left: `calc(6px + ${sliderProgress * (100 - 15)}%)` }}
        onTouchStart={onSliderTouchStart}
        onTouchMove={onSliderTouchMove}
        onTouchEnd={onSliderTouchEnd}
        onMouseDown={onSliderMouseDown}
      >
        {sliderProgress > 0.85 ? (
          <span className="material-symbols-outlined text-green-600 text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
        ) : (
          <span className="material-symbols-outlined text-navy text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>double_arrow</span>
        )}
      </div>
    </div>
  )
}
