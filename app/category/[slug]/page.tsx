"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { DesktopHeader } from "@/components/desktop-header"
import { MobileHeader } from "@/components/mobile-header"
import GoogleMapPicker, { type SelectedLocation, type ServiceMarker } from "@/components/GoogleMapPicker"
import { type Service, type Category } from "@/lib/api"

// ── Constants ──
const DISTANCE_OPTIONS = [
  { value: "all", label: "All Areas" },
  { value: "5", label: "5 km" },
  { value: "10", label: "10 km" },
  { value: "20", label: "20 km" },
  { value: "50", label: "50 km" },
]

export default function CategoryServicesPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  // ── Data ──
  const [services, setServices] = useState<Service[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Location ──
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null)

  // ── Filters ──
  const [activeDistance, setActiveDistance] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  // ── Booking ──
  const [showConfirmPopup, setShowConfirmPopup] = useState(false)
  const [isBookingConfirmed, setIsBookingConfirmed] = useState(false)
  const [bookingId, setBookingId] = useState("")

  // ── Advanced (browse & schedule providers) ──
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // ── Swipe slider ──
  const sliderRef = useRef<HTMLDivElement>(null)
  const [sliderProgress, setSliderProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const sliderStartX = useRef(0)
  const sliderWidth = useRef(0)

  // ── Fetch category data once ──
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const catRes = await fetch("/api/services/categories")
        if (catRes.ok) {
          const catData = await catRes.json()
          const categories = catData.results || catData || []
          setCategory(categories.find((c: Category) => c.slug === slug) || null)
        }
      } catch {
        // Category fetch optional
      }
    }
    if (slug) fetchCategory()
  }, [slug])

  // ── Fetch services when location or distance changes ──
  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set("category", slug)
        if (selectedLocation) {
          params.set("lat", selectedLocation.lat.toString())
          params.set("lng", selectedLocation.lng.toString())
          if (activeDistance !== "all") {
            params.set("distance", activeDistance)
          }
        }
        const servicesRes = await fetch(`/api/services?${params.toString()}`)
        if (servicesRes.ok) {
          const servicesData = await servicesRes.json()
          setServices(servicesData.results || servicesData || [])
        } else {
          setServices([])
        }
      } catch {
        setError("Unable to connect to server")
      } finally {
        setIsLoading(false)
      }
    }
    if (slug) fetchServices()
  }, [slug, selectedLocation, activeDistance])

  // ── Close filter dropdown on outside click ──
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilters(false)
      }
    }
    if (showFilters) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showFilters])

  // ── Location handler ──
  const handleLocationSelect = useCallback((location: SelectedLocation) => {
    setSelectedLocation(location)
  }, [])

  // ── Build service markers for the map ──
  const serviceMarkers: ServiceMarker[] = services
    .filter((s) => s.location_lat && s.location_lng)
    .map((s) => ({
      id: s.id,
      lat: parseFloat(s.location_lat!),
      lng: parseFloat(s.location_lng!),
      title: s.title,
      partnerName: s.partner_name,
    }))

  // ── Computed ──
  const categoryName = category?.name || slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  const availableProviders = services.filter((s) => s.is_available).length
  const avgPrice =
    services.length > 0
      ? Math.round(services.reduce((sum, s) => sum + parseFloat(s.price || "0"), 0) / services.length)
      : 500
  const estimatedArrival = Math.floor(Math.random() * 15) + 5
  const activeDistanceLabel = DISTANCE_OPTIONS.find((d) => d.value === activeDistance)?.label || "All Areas"

  // ── Slider handlers ──
  const onSliderTouchStart = (e: React.TouchEvent) => {
    if (!sliderRef.current) return
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
      triggerBooking()
    } else {
      setSliderProgress(0)
    }
  }

  const onSliderMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return
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
          triggerBooking()
          return 1
        }
        return 0
      })
    }
    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
  }

  const triggerBooking = () => {
    setBookingId("FB-" + Date.now().toString(36).toUpperCase())
    setShowConfirmPopup(true)
    setIsBookingConfirmed(true)
  }

  const resetBooking = () => {
    setSliderProgress(0)
    setShowConfirmPopup(false)
    setIsBookingConfirmed(false)
    setBookingId("")
  }

  // ── Short address for display ──
  const shortAddress = selectedLocation
    ? selectedLocation.address.split(",").slice(0, 2).join(",").trim()
    : ""

  return (
    <div className="relative min-h-screen flex flex-col pb-24 lg:pb-0 bg-background">
      <DesktopHeader variant="farmer" />
      <MobileHeader />

      {/* ─── STICKY HEADER ─── */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-6xl mx-auto">
          {/* Back + Title */}
          <div className="flex items-center gap-3 px-4 lg:px-6 pt-3 pb-2">
            <Link
              href="/"
              className="size-9 lg:size-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground shadow-sm active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-base lg:text-lg font-bold text-foreground truncate">{categoryName}</h1>
              <p className="text-[11px] lg:text-xs text-muted-foreground">
                {selectedLocation
                  ? `Near ${shortAddress} · ${availableProviders} providers`
                  : "Find nearby providers instantly"}
              </p>
            </div>
            {showAdvanced && (
              <button
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                className="size-9 rounded-full bg-card border border-border flex items-center justify-center text-foreground shadow-sm active:scale-95 transition-transform lg:hidden"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {viewMode === "grid" ? "view_list" : "grid_view"}
                </span>
              </button>
            )}
          </div>

          {/* ─── LOCATION DISPLAY + FILTER ─── */}
          <div className="px-4 lg:px-6 pb-3">
            <div className="flex items-center gap-2">
              {/* Location display */}
              <div className="flex-1 flex items-center bg-card border border-border rounded-xl shadow-sm overflow-hidden px-3 py-2.5 gap-2">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${selectedLocation ? "bg-green-400" : "bg-amber-400"}`} />
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${selectedLocation ? "bg-green-500" : "bg-amber-500"}`} />
                </span>
                <p className="text-sm text-foreground truncate flex-1">
                  {selectedLocation ? shortAddress : "Click on map to set location..."}
                </p>
                {selectedLocation && (
                  <button
                    onClick={() => setSelectedLocation(null)}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                    title="Clear location"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>

              {/* Filter button */}
              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`size-10 rounded-xl border flex items-center justify-center shadow-sm active:scale-95 transition-all ${activeDistance !== "all"
                    ? "bg-navy text-white border-navy"
                    : "bg-card text-foreground border-border hover:bg-muted/50"
                    }`}
                  title="Filters"
                >
                  <span className="material-symbols-outlined text-[20px]">tune</span>
                </button>

                {/* Filter dropdown */}
                {showFilters && (
                  <div className="absolute top-full right-0 mt-1.5 w-48 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Distance Range</p>
                    </div>
                    {DISTANCE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setActiveDistance(option.value)
                          setShowFilters(false)
                        }}
                        className={`w-full px-3 py-2.5 text-left text-sm flex items-center justify-between transition-colors ${activeDistance === option.value
                          ? "bg-navy/5 text-navy font-semibold"
                          : "text-foreground hover:bg-muted/40"
                          }`}
                      >
                        <span>{option.label}</span>
                        {activeDistance === option.value && (
                          <span className="material-symbols-outlined text-[16px] text-navy" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Active filter badge */}
            {activeDistance !== "all" && (
              <div className="flex items-center gap-1.5 mt-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-navy/10 text-navy px-2.5 py-1 rounded-lg">
                  <span className="material-symbols-outlined text-[13px]">filter_alt</span>
                  Within {activeDistanceLabel}
                  <button onClick={() => setActiveDistance("all")} className="ml-0.5 hover:bg-navy/10 rounded-full">
                    <span className="material-symbols-outlined text-[13px]">close</span>
                  </button>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-6xl mx-auto w-full">
        <div className="flex-1 flex flex-col">
          {/* ── Google Map ── */}
          <div className="px-4 lg:px-6 pt-3 pb-4 lg:pb-3">
            <GoogleMapPicker
              onLocationSelect={handleLocationSelect}
              selectedLocation={selectedLocation}
              serviceMarkers={serviceMarkers}
              className="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[3/1]"
            />
          </div>

          {/* ── Stats + Swipe to Book ── */}
          {selectedLocation && !isBookingConfirmed && (
            <div className="px-3 sm:px-4 lg:px-6 pb-3 lg:pb-4 space-y-2 lg:space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="grid grid-cols-3 gap-2 lg:gap-3">
                {/* Nearby Providers */}
                <div className="bg-card border border-border rounded-xl lg:rounded-2xl p-2.5 lg:p-3">
                  <p className="text-xl lg:text-2xl font-bold text-foreground text-center">{availableProviders}</p>
                  <p className="text-[10px] lg:text-xs text-muted-foreground text-center">Providers</p>
                  {services.length > 0 && (
                    <div className="flex items-center justify-center -space-x-1.5 mt-2">
                      {services.slice(0, 3).map((s) => (
                        <div key={s.id} className="size-6 lg:size-7 rounded-full bg-muted/50 overflow-hidden relative border-2 border-card shrink-0">
                          <Image src={s.thumbnail || "/placeholder.svg"} alt={s.title} fill className="object-cover" />
                        </div>
                      ))}
                      {services.length > 3 && (
                        <div className="size-6 lg:size-7 rounded-full bg-muted flex items-center justify-center border-2 border-card text-[8px] lg:text-[9px] font-bold text-muted-foreground shrink-0">
                          +{services.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                  {services.length === 0 && (
                    <p className="text-[9px] text-muted-foreground text-center mt-1">None nearby</p>
                  )}
                </div>

                {/* Price */}
                <div className="bg-card border border-border rounded-xl lg:rounded-2xl p-2.5 lg:p-3">
                  <p className="text-xl lg:text-2xl font-bold text-foreground text-center">₹{avgPrice}</p>
                  <p className="text-[10px] lg:text-xs text-muted-foreground text-center">Est. Price</p>
                  <p className="text-[9px] lg:text-[10px] text-muted-foreground text-center mt-1.5">+ ₹0 platform fee</p>
                  <p className="text-[7px] lg:text-[8px] text-muted-foreground text-center mt-0.5">*May vary</p>
                </div>

                {/* ETA */}
                <div className="bg-card border border-border rounded-xl lg:rounded-2xl p-2.5 lg:p-3 text-center">
                  <p className="text-xl lg:text-2xl font-bold text-foreground">{estimatedArrival}m</p>
                  <p className="text-[10px] lg:text-xs text-muted-foreground">Arrival</p>
                </div>
              </div>

              {availableProviders > 0 ? (
                <div
                  ref={sliderRef}
                  className="relative h-14 lg:h-16 bg-navy rounded-2xl overflow-hidden select-none touch-none shadow-lg"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className={`text-white/60 text-sm font-semibold tracking-wide transition-opacity duration-200 ${sliderProgress > 0.15 ? "opacity-0" : "opacity-100"}`}>
                      Swipe to Book Instantly →
                    </p>
                  </div>
                  <div
                    className="absolute inset-y-0 left-0 bg-green-500/20 rounded-2xl transition-[width] duration-75"
                    style={{ width: `${sliderProgress * 100}%` }}
                  />
                  <div
                    className="absolute top-1.5 bottom-1.5 w-[52px] rounded-[14px] bg-white flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing z-10 transition-[left] duration-75"
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
              ) : (
                <div className="relative h-14 lg:h-16 bg-muted/60 border border-border rounded-2xl flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-muted-foreground text-[20px]">search_off</span>
                  <p className="text-sm font-medium text-muted-foreground">No providers available in this area</p>
                </div>
              )}
            </div>
          )}


          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                <p className="text-sm text-muted-foreground">Loading services...</p>
              </div>
            </div>
          )}

          {/* ─── ADVANCED OPTIONS (desktop only) ─── */}
          {!isLoading && selectedLocation && (
            <div className="hidden lg:block px-4 lg:px-6 py-3">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-card border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-muted/50 active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined text-[18px] text-navy" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {showAdvanced ? "expand_less" : "tune"}
                </span>
                {showAdvanced ? "Hide Advanced Options" : "Advanced Options"}
                {!showAdvanced && (
                  <span className="text-[11px] text-muted-foreground font-normal ml-1">Browse & schedule specific providers</span>
                )}
              </button>
            </div>
          )}

          {/* ─── ADVANCED SECTION (desktop only) ─── */}
          {showAdvanced && (
            <div className="hidden lg:block animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 lg:px-6 pb-2 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-foreground">Browse Providers</h2>
                  <p className="text-[11px] text-muted-foreground">
                    {services.length} services available{activeDistance !== "all" && ` · Within ${activeDistanceLabel}`}
                  </p>
                </div>
                <div className="hidden lg:flex border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`size-8 flex items-center justify-center transition-colors ${viewMode === "grid" ? "bg-navy text-white" : "bg-card text-muted-foreground"}`}
                  >
                    <span className="material-symbols-outlined text-[16px]">grid_view</span>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`size-8 flex items-center justify-center transition-colors ${viewMode === "list" ? "bg-navy text-white" : "bg-card text-muted-foreground"}`}
                  >
                    <span className="material-symbols-outlined text-[16px]">view_list</span>
                  </button>
                </div>
              </div>

              <div className="px-4 lg:px-6 pb-6">
                {error && (
                  <div className="text-center py-12">
                    <span className="material-symbols-outlined text-5xl text-muted-foreground mb-3">cloud_off</span>
                    <p className="text-base font-medium text-foreground">{error}</p>
                    <p className="text-sm text-muted-foreground mt-1">Please try again later</p>
                  </div>
                )}

                {!error && services.length === 0 && (
                  <div className="text-center py-12">
                    <span className="material-symbols-outlined text-5xl text-muted-foreground mb-3">inventory_2</span>
                    <p className="text-base font-medium text-foreground">No services found</p>
                    <button
                      onClick={() => setActiveDistance("all")}
                      className="mt-4 px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}

                {!error && services.length > 0 && (
                  <div className={viewMode === "grid" ? "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4" : "flex flex-col gap-3 lg:gap-4"}>
                    {services.map((service) => (
                      <ServiceCard key={service.id} service={service} viewMode={viewMode} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>



        {/* ── Mobile Advanced Options (after price/providers) ── */}
        {!isLoading && selectedLocation && (
          <div className="lg:hidden px-4 pb-3">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-card border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-muted/50 active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-[18px] text-navy" style={{ fontVariationSettings: "'FILL' 1" }}>
                {showAdvanced ? "expand_less" : "tune"}
              </span>
              {showAdvanced ? "Hide Advanced Options" : "Advanced Options"}
              {!showAdvanced && (
                <span className="text-[11px] text-muted-foreground font-normal ml-1">Browse & schedule</span>
              )}
            </button>

            {/* ─── ADVANCED SECTION (mobile) ─── */}
            {showAdvanced && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200 mt-3">
                <div className="pb-2 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-foreground">Browse Providers</h2>
                    <p className="text-[11px] text-muted-foreground">
                      {services.length} services available{activeDistance !== "all" && ` · Within ${activeDistanceLabel}`}
                    </p>
                  </div>
                  <div className="flex border border-border rounded-xl overflow-hidden">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`size-8 flex items-center justify-center transition-colors ${viewMode === "grid" ? "bg-navy text-white" : "bg-card text-muted-foreground"}`}
                    >
                      <span className="material-symbols-outlined text-[16px]">grid_view</span>
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`size-8 flex items-center justify-center transition-colors ${viewMode === "list" ? "bg-navy text-white" : "bg-card text-muted-foreground"}`}
                    >
                      <span className="material-symbols-outlined text-[16px]">view_list</span>
                    </button>
                  </div>
                </div>

                <div className="pb-6">
                  {error && (
                    <div className="text-center py-12">
                      <span className="material-symbols-outlined text-5xl text-muted-foreground mb-3">cloud_off</span>
                      <p className="text-base font-medium text-foreground">{error}</p>
                      <p className="text-sm text-muted-foreground mt-1">Please try again later</p>
                    </div>
                  )}

                  {!error && services.length === 0 && (
                    <div className="text-center py-12">
                      <span className="material-symbols-outlined text-5xl text-muted-foreground mb-3">inventory_2</span>
                      <p className="text-base font-medium text-foreground">No services found</p>
                      <button
                        onClick={() => setActiveDistance("all")}
                        className="mt-4 px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                      >
                        Clear Filters
                      </button>
                    </div>
                  )}

                  {!error && services.length > 0 && (
                    <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"}>
                      {services.map((service) => (
                        <ServiceCard key={service.id} service={service} viewMode={viewMode} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}


      </div>

      {/* ─── CONFIRMATION POPUP ─── */}
      {showConfirmPopup && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConfirmPopup(false)} />
          <div className="relative w-full max-w-md mx-4 bg-card rounded-t-3xl lg:rounded-3xl border border-border shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
            <div className="bg-gradient-to-br from-green-500 to-green-600 px-6 py-8 text-center text-white">
              <div className="size-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <h2 className="text-xl font-bold mb-1">Booking Confirmed!</h2>
              <p className="text-sm text-white/80">Finding nearest provider for you...</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between bg-muted/30 rounded-xl px-4 py-3">
                <span className="text-xs text-muted-foreground">Booking ID</span>
                <span className="text-sm font-bold text-foreground font-mono">{bookingId}</span>
              </div>
              <div className="space-y-3">
                <ConfirmDetail icon="agriculture" iconClass="text-primary" label="Service Type" value={categoryName} />
                <ConfirmDetail icon="location_on" iconClass="text-primary" label="Your Location" value={shortAddress || "Not set"} />
                <ConfirmDetail icon="currency_rupee" iconClass="text-primary" label="Pay after service" value={`₹${avgPrice} (estimated)`} />
                <ConfirmDetail icon="schedule" iconClass="text-amber-500" label="Estimated arrival" value={`~${estimatedArrival} minutes`} />
              </div>
              <div className="bg-navy/5 border border-navy/10 rounded-xl p-4 flex items-center gap-3">
                <div className="animate-spin h-5 w-5 border-2 border-navy border-t-transparent rounded-full shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-navy">Searching for providers...</p>
                  <p className="text-[11px] text-muted-foreground">You&apos;ll be notified when a provider accepts</p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowConfirmPopup(false); router.push("/bookings") }} className="flex-1 py-3 bg-navy text-white font-semibold rounded-xl hover:bg-navy/90 transition-colors text-sm">
                  View My Bookings
                </button>
                <button onClick={resetBooking} className="py-3 px-4 bg-muted/50 text-foreground font-semibold rounded-xl hover:bg-muted transition-colors text-sm">
                  Done
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

// ─── Confirmation Detail Row ───
function ConfirmDetail({ icon, iconClass, label, value }: { icon: string; iconClass: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`material-symbols-outlined ${iconClass} text-[20px]`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      <div>
        <p className="text-sm font-medium text-foreground">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

// ─── Service Card ───
function ServiceCard({ service, viewMode = "grid" }: { service: Service; viewMode?: "grid" | "list" }) {
  const priceUnit = service.price_unit === "HOUR" ? "/hr" : service.price_unit === "DAY" ? "/day" : ""

  if (viewMode === "list") {
    return (
      <Link
        href={`/booking/new/${service.id}`}
        className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden group hover:shadow-lg transition-all flex gap-0"
      >
        <div className="relative w-28 sm:w-36 lg:w-44 shrink-0 overflow-hidden">
          <Image src={service.thumbnail || "/placeholder.svg"} alt={service.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
          {!service.is_available && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">Unavailable</span>
            </div>
          )}
        </div>
        <div className="flex-1 p-3 lg:p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-foreground text-sm lg:text-base line-clamp-1 group-hover:text-primary transition-colors">{service.title}</h3>
              {service.partner_rating && parseFloat(service.partner_rating) > 0 && (
                <div className="flex items-center gap-0.5 bg-success/10 px-1.5 py-0.5 rounded text-[11px] font-bold text-success shrink-0">
                  <span>{parseFloat(service.partner_rating).toFixed(1)}</span>
                  <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">{service.partner_name || "Service Provider"}</p>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <span className="text-base lg:text-lg font-bold text-navy">₹{service.price}</span>
              <span className="text-[10px] text-muted-foreground">{priceUnit}</span>
            </div>
            <div className="flex items-center gap-1 text-primary">
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
              <span className="text-xs font-semibold">Schedule</span>
              <span className="material-symbols-outlined text-[14px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/booking/new/${service.id}`}
      className="bg-card rounded-2xl p-3 lg:p-4 shadow-sm border border-border/50 flex flex-col gap-3 group hover:shadow-lg transition-shadow"
    >
      <div className="relative w-full aspect-[4/3] bg-muted/20 rounded-xl overflow-hidden">
        <Image src={service.thumbnail || "/placeholder.svg"} alt={service.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-2 right-2 bg-card/95 backdrop-blur shadow-sm px-2 py-1 rounded-lg flex items-center gap-0.5 z-10 border border-border">
          <span className="text-navy font-bold text-sm">₹{service.price}</span>
          <span className="text-muted-foreground text-[10px]">{priceUnit}</span>
        </div>
        {!service.is_available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-xs font-bold px-2 py-1 bg-black/50 rounded">Unavailable</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-bold text-foreground text-sm lg:text-base line-clamp-1 group-hover:text-primary transition-colors">{service.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-1">{service.partner_name || "Service Provider"}</p>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1 text-primary">
            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
            <span className="text-[11px] font-semibold">Schedule</span>
          </div>
          {service.partner_rating && parseFloat(service.partner_rating) > 0 && (
            <div className="flex items-center gap-0.5 text-xs font-bold text-success">
              <span>{parseFloat(service.partner_rating).toFixed(1)}</span>
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
