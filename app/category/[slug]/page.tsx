"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { DesktopHeader } from "@/components/desktop-header"
import { MobileHeader } from "@/components/mobile-header"
import GoogleMapPicker, { type SelectedLocation, type ServiceMarker } from "@/components/GoogleMapPicker"
import { PlacesAutocomplete } from "@/components/PlacesAutocomplete"
import { APIProvider } from "@vis.gl/react-google-maps"
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
  const slug = params.slug as string

  // ── Data ──
  const [services, setServices] = useState<Service[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Location ──
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null)
  const [locationStatus, setLocationStatus] = useState<"checking" | "fetching_gps" | "ready" | "no_location">("checking")

  // ── Search ──
  const [searchQuery, setSearchQuery] = useState("")

  // ── Filters ──
  const [activeDistance, setActiveDistance] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  // ── Coming Soon popup ──
  const [showComingSoon, setShowComingSoon] = useState(false)

  // ── Swipe slider ──
  const sliderRef = useRef<HTMLDivElement>(null)
  const [sliderProgress, setSliderProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const sliderStartX = useRef(0)
  const sliderWidth = useRef(0)

  // ── Build providers page URL ──
  const getProvidersUrl = useCallback(() => {
    return `/category/${slug}/providers`
  }, [slug])

  // ── Fetch saved location from profile, fallback to GPS ──
  useEffect(() => {
    const initLocation = async () => {
      setLocationStatus("checking")

      try {
        const res = await fetch("/api/auth/location")
        if (res.ok) {
          const data = await res.json()
          if (data.has_location && data.location) {
            setSelectedLocation({
              lat: parseFloat(data.location.latitude),
              lng: parseFloat(data.location.longitude),
              address: data.location.address || "Saved location",
            })
            setSearchQuery(data.location.address || "Saved location")
            setLocationStatus("ready")
            return
          }
        }
      } catch {
        // Not logged in or fetch failed
      }

      // No saved location — auto-detect via GPS
      if ("geolocation" in navigator) {
        setLocationStatus("fetching_gps")
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords
            let address = "Current location"

            try {
              const geocodeRes = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
              )
              if (geocodeRes.ok) {
                const geocodeData = await geocodeRes.json()
                if (geocodeData.results?.[0]?.formatted_address) {
                  address = geocodeData.results[0].formatted_address
                }
              }
            } catch {
              // Geocode failed
            }

            const loc: SelectedLocation = { lat: latitude, lng: longitude, address }
            setSelectedLocation(loc)
            setSearchQuery(address)
            setLocationStatus("ready")

            fetch("/api/auth/location", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ latitude, longitude, address }),
            }).catch(() => {})
          },
          () => {
            setLocationStatus("no_location")
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        )
      } else {
        setLocationStatus("no_location")
      }
    }

    initLocation()
  }, [])

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

  // ── Location handler (when user picks on map) ──
  const handleLocationSelect = useCallback((location: SelectedLocation) => {
    setSelectedLocation(location)
    setSearchQuery(location.address)
    setLocationStatus("ready")
    fetch("/api/auth/location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latitude: location.lat,
        longitude: location.lng,
        address: location.address,
      }),
    }).catch(() => {})
  }, [])

  // ── Handle "get my location" button ──
  const handleGetCurrentLocation = useCallback(() => {
    if (!("geolocation" in navigator)) return
    setLocationStatus("fetching_gps")
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        let address = "Current location"
        try {
          const geocodeRes = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
          )
          if (geocodeRes.ok) {
            const geocodeData = await geocodeRes.json()
            if (geocodeData.results?.[0]?.formatted_address) {
              address = geocodeData.results[0].formatted_address
            }
          }
        } catch {
          // Geocode failed
        }
        const loc: SelectedLocation = { lat: latitude, lng: longitude, address }
        setSelectedLocation(loc)
        setSearchQuery(address)
        setLocationStatus("ready")
      },
      () => {
        setLocationStatus("no_location")
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
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
      : 0
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
      setShowComingSoon(true)
      setTimeout(() => setSliderProgress(0), 300)
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
          setShowComingSoon(true)
          setTimeout(() => setSliderProgress(0), 300)
          return 1
        }
        return 0
      })
    }
    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
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
                {availableProviders > 0
                  ? `${availableProviders} providers Available`
                  : "Find Available Providers"}
              </p>
            </div>
          </div>

          {/* ─── SEARCH BAR + LOCATION BTN + FILTER ─── */}
          <div className="px-4 lg:px-6 pb-3">
            <div className="flex items-center gap-2">
              {/* Search input with suggestions */}
              <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
                <PlacesAutocomplete 
                  defaultValue={searchQuery}
                  onPlaceSelect={(place) => {
                    setSearchQuery(place.address)
                    const loc: SelectedLocation = {
                      lat: place.lat,
                      lng: place.lng,
                      address: place.address,
                    }
                    setSelectedLocation(loc)
                    setLocationStatus("ready")
                  }} 
                />
              </APIProvider>

              {/* Get Location button */}
              <button
                onClick={handleGetCurrentLocation}
                className={`size-10 rounded-xl border flex items-center justify-center shadow-sm active:scale-95 transition-all ${
                  locationStatus === "fetching_gps"
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-card text-primary border-border hover:bg-primary/5"
                }`}
                title="Get current location"
              >
                {locationStatus === "fetching_gps" ? (
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                ) : (
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>my_location</span>
                )}
              </button>

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

        {/* ── LEFT / TOP: Google Map (B&W / Grayscale) ── */}
        <div className="lg:flex-1 lg:sticky lg:top-[120px] lg:self-start">
          <div className="px-4 lg:px-6 pt-3 pb-4 lg:pb-3">
            <div >
              <GoogleMapPicker
                onLocationSelect={handleLocationSelect}
                selectedLocation={selectedLocation}
                serviceMarkers={serviceMarkers}
                className="aspect-[4/3] sm:aspect-[16/9] lg:aspect-auto lg:h-[calc(100vh-220px)]"
              />
            </div>
          </div>
        </div>

        {/* ── RIGHT / BOTTOM: Booking Panel ── */}
        <div className="lg:w-[420px] xl:w-[460px] lg:border-l lg:border-border/50 flex flex-col">

          {/* ── Stats + Swipe to Book ── */}
          {selectedLocation && (
            <div className="px-4 lg:px-6 pb-3 lg:pt-4 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">

              {/* ── Providers + Price Row ── */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Available Providers */}
                <div className="bg-card border border-border rounded-2xl p-3.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${availableProviders > 0 ? "bg-green-400" : "bg-red-400"}`} />
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${availableProviders > 0 ? "bg-green-500" : "bg-red-500"}`} />
                    </span>
                    <span className="text-[11px] font-medium text-muted-foreground">Available</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground leading-none">{availableProviders}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Providers</p>
                  {services.length > 0 && (
                    <div className="flex items-center -space-x-2 mt-2.5">
                      {services.slice(0, 5).map((s) => (
                        <div key={s.id} className="size-7 rounded-full bg-muted/50 overflow-hidden relative border-2 border-card shrink-0">
                          <Image src={s.thumbnail || "/placeholder.svg"} alt="" fill className="object-cover" />
                        </div>
                      ))}
                      {services.length > 5 && (
                        <div className="size-7 rounded-full bg-muted flex items-center justify-center border-2 border-card text-[9px] font-bold text-muted-foreground shrink-0">
                          +{services.length - 5}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Fixed Price */}
                <div className="bg-gradient-to-br from-navy/5 to-navy/10 border border-navy/15 rounded-2xl p-3.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="material-symbols-outlined text-navy text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                    <span className="text-[11px] font-medium text-navy">Fixed Price</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground leading-none">{avgPrice || "\u2014"}</p>
                  <p className="text-[9px] text-navy/60 mt-1.5">Pay after service fee</p>
                </div>
              </div>

              {/* Swipe to Book slider */}
              {availableProviders > 0 ? (
                <div
                  ref={sliderRef}
                  className="relative h-14 lg:h-16 rounded-2xl overflow-hidden select-none touch-none shadow-lg bg-navy"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className={`text-white/60 text-sm font-semibold tracking-wide transition-opacity duration-200 ${sliderProgress > 0.15 ? "opacity-0" : "opacity-100"}`}>
                      Swipe to Book Instantly \u2192
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
                <div className="relative h-14 bg-muted/60 border border-border rounded-2xl flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-muted-foreground text-[20px]">search_off</span>
                  <p className="text-sm font-medium text-muted-foreground">No providers available in this area</p>
                </div>
              )}

              {/* ─── BROWSE PROVIDERS BUTTON ─── */}
              <Link
                href={getProvidersUrl()}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-card border-2 border-navy/15 rounded-2xl text-sm font-semibold text-foreground hover:bg-navy/5 hover:border-navy/30 active:scale-[0.98] transition-all group"
              >
                <span className="material-symbols-outlined text-[20px] text-navy" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
                <span>Browse & Schedule Providers</span>
                <span className="material-symbols-outlined text-[16px] text-muted-foreground group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
              </Link>
            </div>
          )}

          {/* Prompt to set location */}
          {!selectedLocation && locationStatus === "no_location" && !isLoading && (
            <div className="px-4 lg:px-6 py-8 text-center">
              <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2">pin_drop</span>
              <p className="text-base font-medium text-foreground">Set your location</p>
              <p className="text-sm text-muted-foreground mt-1">Search above or click on the map to set your location</p>
            </div>
          )}

          {/* Location detection in progress */}
          {!selectedLocation && (locationStatus === "checking" || locationStatus === "fetching_gps") && (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                <p className="text-sm text-muted-foreground">
                  {locationStatus === "checking" ? "Checking your saved location..." : "Detecting your GPS location..."}
                </p>
              </div>
            </div>
          )}

          {isLoading && selectedLocation && (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                <p className="text-sm text-muted-foreground">Loading services...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── COMING SOON POPUP ─── */}
      {showComingSoon && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowComingSoon(false)} />
          <div className="relative w-full max-w-md mx-4 bg-card rounded-t-3xl lg:rounded-3xl border border-border shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">

            {/* Header */}
            <div className="bg-gradient-to-br from-navy to-navy/90 px-6 py-8 text-center text-white">
              <div className="size-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
              </div>
              <h2 className="text-xl font-bold mb-1">Coming Soon!</h2>
              <p className="text-sm text-white/80">Instant booking is under development</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-[24px] shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Instant Booking Feature</p>
                  <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
                    We&apos;re working hard to bring you instant equipment booking. Soon you&apos;ll be able to
                    book Available providers with just a swipe!
                  </p>
                </div>
              </div>

              <div className="bg-muted/30 rounded-xl p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-navy text-[24px] shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Browse & Schedule</p>
                  <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
                    You can browse available providers and schedule a booking at your preferred date and time.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Link
                  href={getProvidersUrl()}
                  onClick={() => setShowComingSoon(false)}
                  className="flex-1 py-3 bg-navy text-white font-semibold rounded-xl hover:bg-navy/90 transition-colors text-sm text-center"
                >
                  Browse Providers
                </Link>
                <button
                  onClick={() => setShowComingSoon(false)}
                  className="py-3 px-4 bg-muted/50 text-foreground font-semibold rounded-xl hover:bg-muted transition-colors text-sm"
                >
                  Close
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
