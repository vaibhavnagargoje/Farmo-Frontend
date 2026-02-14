"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { DesktopHeader } from "@/components/desktop-header"
import { MobileHeader } from "@/components/mobile-header"
import { type Service, type Category } from "@/lib/api"

// ── Constants ──
const DUMMY_LOCATIONS = [
  { name: "Surat", area: "Gujarat", lat: 21.1702, lng: 72.8311 },
  { name: "Bardoli", area: "Surat District", lat: 21.1167, lng: 73.1167 },
  { name: "Navsari", area: "Gujarat", lat: 20.9467, lng: 72.952 },
  { name: "Valsad", area: "Gujarat", lat: 20.5992, lng: 72.9342 },
  { name: "Ankleshwar", area: "Bharuch District", lat: 21.6264, lng: 73.0153 },
  { name: "Bharuch", area: "Gujarat", lat: 21.6942, lng: 72.9571 },
  { name: "Vyara", area: "Tapi District", lat: 21.1122, lng: 73.3953 },
  { name: "Mandvi", area: "Surat District", lat: 21.2575, lng: 73.3025 },
  { name: "Kamrej", area: "Surat District", lat: 21.2694, lng: 72.9583 },
  { name: "Olpad", area: "Surat District", lat: 21.3389, lng: 72.7517 },
]

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
  const [locationQuery, setLocationQuery] = useState("")
  const [selectedLocation, setSelectedLocation] = useState<(typeof DUMMY_LOCATIONS)[0] | null>(null)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [mapPinPosition, setMapPinPosition] = useState({ x: 50, y: 50 })
  const [isLocating, setIsLocating] = useState(false)

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

  // ── Fetch data ──
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [catRes, servicesRes] = await Promise.all([
          fetch("/api/services/categories"),
          fetch(`/api/services?category=${slug}`),
        ])
        if (catRes.ok) {
          const catData = await catRes.json()
          const categories = catData.results || catData || []
          setCategory(categories.find((c: Category) => c.slug === slug) || null)
        }
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
    if (slug) fetchData()
  }, [slug])

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

  // ── Location helpers ──
  const filteredLocations =
    locationQuery.length > 1
      ? DUMMY_LOCATIONS.filter(
          (l) =>
            l.name.toLowerCase().includes(locationQuery.toLowerCase()) ||
            l.area.toLowerCase().includes(locationQuery.toLowerCase())
        )
      : []

  const selectLocation = useCallback((loc: (typeof DUMMY_LOCATIONS)[0]) => {
    setSelectedLocation(loc)
    setLocationQuery(`${loc.name}, ${loc.area}`)
    setShowLocationDropdown(false)
    setMapPinPosition({ x: 30 + Math.random() * 40, y: 30 + Math.random() * 40 })
  }, [])

  const handleUseCurrentLocation = useCallback(() => {
    setIsLocating(true)
    setTimeout(() => {
      const loc = DUMMY_LOCATIONS[0]
      setSelectedLocation(loc)
      setLocationQuery(`${loc.name}, ${loc.area}`)
      setMapPinPosition({ x: 48, y: 45 })
      setIsLocating(false)
    }, 1500)
  }, [])

  // ── Computed ──
  const categoryName = category?.name || slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  const availableProviders = Math.max(services.filter((s) => s.is_available).length, 3)
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
                  ? `Near ${selectedLocation.name} · ${availableProviders} providers`
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

          {/* ─── LOCATION BAR + FILTER ─── */}
          <div className="px-4 lg:px-6 pb-3">
            <div className="flex items-center gap-2">
              {/* Location search */}
              <div className="relative flex-1">
                <div className="flex items-center bg-card border border-border rounded-xl shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                  <div className="flex items-center justify-center pl-3">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your farm location..."
                    value={locationQuery}
                    onChange={(e) => {
                      setLocationQuery(e.target.value)
                      setShowLocationDropdown(true)
                      if (!e.target.value) setSelectedLocation(null)
                    }}
                    onFocus={() => {
                      if (locationQuery.length > 1) setShowLocationDropdown(true)
                    }}
                    className="flex-1 px-2.5 py-2.5 text-sm bg-transparent outline-none placeholder:text-muted-foreground/60"
                  />
                  <button
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    className="flex items-center gap-1.5 px-3 py-1.5 mr-1 text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                    title="Use current location"
                  >
                    {isLocating ? (
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    ) : (
                      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>my_location</span>
                    )}
                    <span className="text-xs font-semibold hidden sm:inline">{isLocating ? "Locating..." : "Current"}</span>
                  </button>
                </div>

                {/* Location dropdown */}
                {showLocationDropdown && filteredLocations.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden max-h-[240px] overflow-y-auto">
                    {filteredLocations.map((loc, i) => (
                      <button
                        key={i}
                        onClick={() => selectLocation(loc)}
                        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-muted/40 transition-colors text-left"
                      >
                        <span className="material-symbols-outlined text-[18px] text-muted-foreground" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                        <div>
                          <p className="text-sm font-medium text-foreground">{loc.name}</p>
                          <p className="text-[11px] text-muted-foreground">{loc.area}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Filter button */}
              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`size-10 rounded-xl border flex items-center justify-center shadow-sm active:scale-95 transition-all ${
                    activeDistance !== "all"
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
                        className={`w-full px-3 py-2.5 text-left text-sm flex items-center justify-between transition-colors ${
                          activeDistance === option.value
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
          {/* ── Map ── */}
          <div className="px-4 lg:px-6 pt-3 pb-2 lg:pb-3">
            <div className="relative w-full aspect-[16/9] lg:aspect-[16/8] bg-[#e8f4e8] dark:bg-[#1a2e1a] rounded-2xl overflow-hidden border border-border shadow-sm">
              <div className="absolute inset-0" style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)`,
                backgroundSize: "40px 40px",
              }} />
              <div className="absolute top-1/3 left-0 right-0 h-[2px] bg-amber-400/30" />
              <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-amber-400/30" />
              <div className="absolute top-2/3 left-0 right-0 h-[3px] bg-amber-300/20 rotate-[5deg]" />

              <div className="absolute top-[10%] left-[5%] w-24 h-16 bg-green-300/20 dark:bg-green-800/20 rounded-lg" />
              <div className="absolute top-[55%] right-[10%] w-32 h-20 bg-green-400/15 dark:bg-green-700/20 rounded-lg" />
              <div className="absolute bottom-[15%] left-[20%] w-20 h-14 bg-green-300/18 dark:bg-green-800/15 rounded-lg" />
              <div className="absolute top-[20%] right-[25%] w-28 h-12 bg-green-200/20 dark:bg-green-900/20 rounded-lg" />
              <div className="absolute bottom-[10%] right-[5%] w-16 h-10 bg-blue-300/20 dark:bg-blue-800/20 rounded-full" />

              {selectedLocation && (
                <>
                  <div className="absolute top-[25%] left-[30%]">
                    <div className="w-3.5 h-3.5 bg-navy rounded-full animate-pulse shadow-lg border-2 border-white" />
                  </div>
                  <div className="absolute top-[60%] left-[55%]">
                    <div className="w-3.5 h-3.5 bg-navy rounded-full animate-pulse shadow-lg border-2 border-white" />
                  </div>
                  <div className="absolute top-[40%] right-[20%]">
                    <div className="w-3.5 h-3.5 bg-navy rounded-full animate-pulse shadow-lg border-2 border-white" />
                  </div>
                  <div className="absolute top-[70%] left-[25%]">
                    <div className="w-3 h-3 bg-navy/60 rounded-full animate-pulse shadow-lg border-2 border-white/60" />
                  </div>
                </>
              )}

              {selectedLocation ? (
                <div
                  className="absolute z-10 -translate-x-1/2 -translate-y-full transition-all duration-500"
                  style={{ left: `${mapPinPosition.x}%`, top: `${mapPinPosition.y}%` }}
                >
                  <div className="flex flex-col items-center">
                    <div className="bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-lg mb-1 shadow-lg whitespace-nowrap">
                      {selectedLocation.name}
                    </div>
                    <span className="material-symbols-outlined text-primary text-[36px] drop-shadow-lg" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                    <div className="w-2 h-2 bg-primary/30 rounded-full -mt-1 animate-ping" />
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/10 dark:bg-black/30 backdrop-blur-[6px] rounded-2xl">
                  <div className="flex flex-col items-center gap-2 px-6 text-center">
                    <div className="size-14 rounded-full bg-card/90 border border-border shadow-lg flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>pin_drop</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-foreground">Set Your Location</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-[220px] leading-relaxed">
                      Set your location to see service prices, nearby providers & estimated arrival time
                    </p>
                    <button
                      onClick={handleUseCurrentLocation}
                      disabled={isLocating}
                      className="mt-1 inline-flex items-center gap-2 px-4 py-2 bg-navy text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-navy/90 transition-colors disabled:opacity-50 shadow-lg"
                    >
                      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>my_location</span>
                      {isLocating ? "Locating..." : "Use Current Location"}
                    </button>
                  </div>
                </div>
              )}

              <div className="absolute bottom-2 right-3 text-[10px] text-muted-foreground/40 font-medium">FARMO Maps</div>
              <div className="absolute top-3 right-3 flex flex-col gap-1">
                <button className="size-8 bg-card/90 backdrop-blur border border-border rounded-lg flex items-center justify-center shadow-sm hover:bg-card transition-colors">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
                <button className="size-8 bg-card/90 backdrop-blur border border-border rounded-lg flex items-center justify-center shadow-sm hover:bg-card transition-colors">
                  <span className="material-symbols-outlined text-[18px]">remove</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Stats + Swipe to Book ── */}
          {selectedLocation && !isBookingConfirmed && (
            <div className="px-4 lg:px-6 pb-4 space-y-2 lg:space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="grid grid-cols-3 gap-1.5 lg:gap-2">
                <div className="bg-card border border-border rounded-xl lg:rounded-2xl p-2 lg:p-3 text-center">
                  <div className="flex items-center justify-center text-green-600 mb-0.5 lg:mb-1">
                    <span className="material-symbols-outlined text-[18px] lg:text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                  </div>
                  <p className="text-base lg:text-xl font-bold text-foreground">{availableProviders}</p>
                  <p className="text-[9px] lg:text-xs text-muted-foreground">Available</p>
                </div>
                <div className="bg-card border border-border rounded-xl lg:rounded-2xl p-2 lg:p-3 text-center">
                  <div className="flex items-center justify-center text-navy mb-0.5 lg:mb-1">
                    <span className="material-symbols-outlined text-[18px] lg:text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>currency_rupee</span>
                  </div>
                  <p className="text-base lg:text-xl font-bold text-foreground">₹{avgPrice}</p>
                  <p className="text-[9px] lg:text-xs text-muted-foreground">Est. Price</p>
                </div>
                <div className="bg-card border border-border rounded-xl lg:rounded-2xl p-2 lg:p-3 text-center">
                  <div className="flex items-center justify-center text-amber-500 mb-0.5 lg:mb-1">
                    <span className="material-symbols-outlined text-[18px] lg:text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
                  </div>
                  <p className="text-base lg:text-xl font-bold text-foreground">{estimatedArrival}m</p>
                  <p className="text-[9px] lg:text-xs text-muted-foreground">ETA</p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl lg:rounded-2xl p-3 lg:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 lg:gap-3">
                    <div className="size-9 lg:size-10 rounded-xl bg-navy/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-navy text-[20px] lg:text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>agriculture</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{categoryName}</h3>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[13px]">location_on</span>
                          {selectedLocation.name}
                        </span>
                        <span>·</span>
                        <span className="text-navy font-bold text-sm">₹{avgPrice}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] lg:text-xs font-bold px-2 lg:px-2.5 py-0.5 lg:py-1 rounded-lg flex items-center gap-0.5 lg:gap-1">
                    <span className="material-symbols-outlined text-[12px] lg:text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                    QUICK BOOK
                  </div>
                </div>
              </div>

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
          {!isLoading && (
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

        {/* ── Mobile Price & Providers (below stats, visible only on mobile) ── */}
        {selectedLocation && !isBookingConfirmed && (
          <div className="lg:hidden px-4 pb-3 space-y-2">
            {/* Mobile Price Breakup */}
            <div className="bg-card border border-border rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price Breakup</h4>
                <span className="text-[10px] text-muted-foreground">*May vary</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-sm">
                  <div><span className="text-muted-foreground text-xs">Base </span><span className="font-semibold">₹{avgPrice}</span></div>
                  <span className="text-muted-foreground">+</span>
                  <div><span className="text-muted-foreground text-xs">Fee </span><span className="font-semibold">₹0</span></div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Total</p>
                  <p className="text-base font-bold text-navy">₹{avgPrice}</p>
                </div>
              </div>
            </div>

            {/* Mobile Nearby Providers */}
            {services.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Nearby Providers</h4>
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
                  {services.slice(0, 5).map((s) => (
                    <div key={s.id} className="flex flex-col items-center gap-1.5 shrink-0 w-16">
                      <div className="size-11 rounded-full bg-muted/50 overflow-hidden relative border-2 border-green-400">
                        <Image src={s.thumbnail || "/placeholder.svg"} alt={s.title} fill className="object-cover" />
                      </div>
                      <p className="text-[10px] font-medium text-foreground text-center line-clamp-1 w-full">{s.partner_name || "Provider"}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Mobile Advanced Options (after price/providers) ── */}
        {!isLoading && (
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

        {/* ── Desktop sidebar ── */}
        <div className="hidden lg:flex flex-col w-[380px] border-l border-border px-6 py-4 gap-4">
          {selectedLocation && (
            <>
              <div className="bg-card border border-border rounded-2xl p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Nearby Providers</h4>
                {services.slice(0, 4).map((s, i) => (
                  <div key={s.id} className={`flex items-center gap-3 py-2.5 ${i > 0 ? "border-t border-border" : ""}`}>
                    <div className="size-10 rounded-xl bg-muted/50 overflow-hidden relative shrink-0">
                      <Image src={s.thumbnail || "/placeholder.svg"} alt={s.title} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.partner_name || "Provider"}</p>
                      <p className="text-[11px] text-muted-foreground">{s.title}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-green-600 font-medium shrink-0">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                      </span>
                      Online
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-card border border-border rounded-2xl p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Price Breakup</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Base fare</span><span className="font-medium">₹{avgPrice}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Platform fee</span><span className="font-medium">₹0</span></div>
                  <div className="h-px bg-border my-1" />
                  <div className="flex justify-between font-bold"><span>Estimated Total</span><span className="text-navy">₹{avgPrice}</span></div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">*Final price may vary based on actual usage</p>
              </div>
            </>
          )}
        </div>
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
                <ConfirmDetail icon="location_on" iconClass="text-primary" label="Your Location" value={`${selectedLocation?.name}, ${selectedLocation?.area}`} />
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
