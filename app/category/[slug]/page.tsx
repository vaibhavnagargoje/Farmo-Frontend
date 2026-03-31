"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { DesktopHeader } from "@/components/desktop-header"
import { MobileHeader } from "@/components/mobile-header"
import GoogleMapPicker, { type SelectedLocation, type ServiceMarker } from "@/components/GoogleMapPicker"
import { PlacesAutocomplete } from "@/components/PlacesAutocomplete"
import { APIProvider } from "@vis.gl/react-google-maps"
import { type Service, type Category, type PriceUnit } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { usePermission } from "@/contexts/permission-context"

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuth()
  const { lang, t } = useLanguage()
  const { requestLocationPermission, showLocationDeniedPrompt } = usePermission()
  const from = searchParams.get("from")

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

  // ── Instant Booking ──
  const [priceUnits, setPriceUnits] = useState<PriceUnit[]>([])
  const [quantity, setQuantity] = useState(1)
  const [selectedUnit, setSelectedUnit] = useState("")
  const [bookingNote, setBookingNote] = useState("")
  const [bookingStatus, setBookingStatus] = useState<"idle" | "creating" | "created" | "active_exists" | "error">("idle")
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null)
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null)
  const [activeExistingBookingId, setActiveExistingBookingId] = useState<string | null>(null)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  // ── Swipe slider ──
  const sliderRef = useRef<HTMLDivElement>(null)
  const [sliderProgress, setSliderProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const sliderStartX = useRef(0)
  const sliderWidth = useRef(0)
  const isSubmittingRef = useRef(false)

  // ── Build providers page URL ──
  const getProvidersUrl = useCallback(() => {
    return `/category/${slug}/providers?from=${encodeURIComponent(`/category/${slug}`)}`
  }, [slug])

  const handleBack = useCallback(() => {
    if (from) {
      router.push(from)
      return
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
      return
    }
    router.push("/")
  }, [from, router])

  // ── Client-side Geocoding Helper ──
  const reverseGeocodeClient = async (lat: number, lng: number): Promise<string | null> => {
    if (typeof window === "undefined") return null
    let retries = 30
    // Wait up to 3 seconds for Google Maps API to initialize via APIProvider
    while (!(window as any).google?.maps?.Geocoder && retries > 0) {
      await new Promise((r) => setTimeout(r, 100))
      retries--
    }
    if (!(window as any).google?.maps?.Geocoder) return null
    try {
      const geocoder = new (window as any).google.maps.Geocoder()
      const response = await geocoder.geocode({ location: { lat, lng } })
      if (response.results?.[0]?.formatted_address) {
        return response.results[0].formatted_address
      }
    } catch (e) {
      console.warn("Client geocode error", e)
    }
    return null
  }

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

      // No saved location — show custom prompt then auto-detect via GPS
      if ("geolocation" in navigator) {
        // Show custom location permission prompt before browser prompt
        const permResult = await requestLocationPermission()
        if (permResult === "denied" || permResult === "dismissed") {
          setLocationStatus("no_location")
          return
        }

        setLocationStatus("fetching_gps")

        const onGpsSuccess = async (position: GeolocationPosition) => {
          const { latitude, longitude } = position.coords
          let address = "Current location"

          const clientAddress = await reverseGeocodeClient(latitude, longitude)
          if (clientAddress) {
            address = clientAddress
          }

          const loc: SelectedLocation = { lat: latitude, lng: longitude, address }
          setSelectedLocation(loc)
          setSearchQuery(address)
          setLocationStatus("ready")

          fetch("/api/auth/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude, longitude, address }),
          }).catch(() => { })
        }

        // Try high accuracy first, fallback to network-based location
        navigator.geolocation.getCurrentPosition(
          onGpsSuccess,
          () => {
            // High accuracy failed — try lower accuracy (network/WiFi based)
            navigator.geolocation.getCurrentPosition(
              onGpsSuccess,
              (error) => {
                if (error.code === 1) {
                  showLocationDeniedPrompt()
                }
                setLocationStatus("no_location")
              },
              { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
            )
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
        )
      } else {
        setLocationStatus("no_location")
      }
    }

    initLocation()
  }, [requestLocationPermission, showLocationDeniedPrompt])

  // ── Fetch category data (re-fetches when location changes for zone pricing) ──
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const params = new URLSearchParams()
        if (selectedLocation) {
          params.set('lat', String(selectedLocation.lat))
          params.set('lng', String(selectedLocation.lng))
        }
        if (lang !== 'en') params.set('lang', lang)
        const qs = params.toString()
        const catUrl = qs ? `/api/services/categories?${qs}` : '/api/services/categories'
        const catRes = await fetch(catUrl)
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
  }, [slug, selectedLocation, lang])

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
    }).catch(() => { })
  }, [])

  // ── Handle "get my location" button ──
  const handleGetCurrentLocation = useCallback(async () => {
    if (!("geolocation" in navigator)) {
      alert("Geolocation is not supported by your browser.")
      return
    }

    // Show custom location permission prompt if needed
    const permResult = await requestLocationPermission()
    if (permResult === "denied" || permResult === "dismissed") return

    setLocationStatus("fetching_gps")

    const onSuccess = async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords
      let address = "Current location"
      const clientAddress = await reverseGeocodeClient(latitude, longitude)
      if (clientAddress) {
        address = clientAddress
      }
      const loc: SelectedLocation = { lat: latitude, lng: longitude, address }
      setSelectedLocation(loc)
      setSearchQuery(address)
      setLocationStatus("ready")

      // Save to profile in background
      fetch("/api/auth/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude, address }),
      }).catch(() => { })
    }

    const onFinalError = (error: GeolocationPositionError) => {
      console.error("Geolocation error:", error.code, error.message)
      if (error.code === 1) {
        // Permission denied — show custom recovery prompt
        showLocationDeniedPrompt()
      } else if (error.code === 2) {
        alert("Location is unavailable. Please check that your device's location services are turned on.")
      } else {
        alert("Location request timed out. Please try again or search for your location manually.")
      }
      setLocationStatus("no_location")
    }

    // Try high accuracy first (GPS), fallback to network-based
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (highAccError) => {
        console.warn("High accuracy geolocation failed, trying network fallback:", highAccError.message)
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          onFinalError,
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
        )
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    )
  }, [requestLocationPermission, showLocationDeniedPrompt])

  // ── Fetch price units on mount ──
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

  // ── Build service markers for the map ──
  const serviceMarkers: ServiceMarker[] = services
    .filter((s) => s.partner_location?.latitude && s.partner_location?.longitude)
    .map((s) => ({
      id: s.id,
      lat: parseFloat(s.partner_location!.latitude),
      lng: parseFloat(s.partner_location!.longitude),
      title: s.title,
      partnerName: s.partner_name,
    }))

  // ── Computed ──
  const categoryName = category?.name_translations?.[lang] || category?.name || slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  const availableProviders = services.filter((s) => s.is_available).length
  const instantPrice = category ? Math.round(parseFloat(category.instant_price || "0")) : 0
  const estimatedTotal = instantPrice * quantity
  const activeDistanceLabel = DISTANCE_OPTIONS.find((d) => d.value === activeDistance)?.label || "All Areas"
  const resolvedUnit = selectedUnit || category?.instant_price_unit || ""

  const tUnitKey = `unit.${resolvedUnit.toLowerCase()}`
  const tUnit = resolvedUnit ? t(tUnitKey) : ""
  const fallbackLabel = priceUnits.find((u) => u.value === resolvedUnit)?.label || resolvedUnit || "Per unit"
  const priceUnitLabel = tUnit === tUnitKey ? fallbackLabel : tUnit

  const isInstantEnabled = category?.instant_enabled !== false
  const topProviderAvatars = services.filter((s) => s.is_available).slice(0, 3)
  const remainingProviderCount = Math.max(availableProviders - topProviderAvatars.length, 0)

  useEffect(() => {
    if (category?.instant_price_unit) {
      setSelectedUnit(category.instant_price_unit)
    }
  }, [category?.instant_price_unit])

  // ── Instant Booking: Create ──
  const handleInstantBooking = useCallback(async () => {
    if (bookingStatus === "creating" || isSubmittingRef.current) return
    isSubmittingRef.current = true

    if (!isAuthenticated) {
      setShowLoginPrompt(true)
      setSliderProgress(0)
      isSubmittingRef.current = false
      return
    }
    if (!selectedLocation || !category) {
      setBookingError("Please set your location first")
      setSliderProgress(0)
      isSubmittingRef.current = false
      return
    }

    setBookingStatus("creating")
    setBookingError(null)
    try {
      const res = await fetch("/api/bookings/instant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: category.id,
          quantity,
          price_unit: selectedUnit || category.instant_price_unit,
          note: bookingNote,
          address: selectedLocation.address,
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
        }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        const bookingId = data.booking?.booking_id
        const orderNumber = data.booking?.order_number
        setCreatedBookingId(bookingId)
        setCreatedOrderNumber(orderNumber || bookingId)
        setBookingStatus("created")
      } else {
        // Check if user already has an active order
        if (data.active_booking_id) {
          setActiveExistingBookingId(
            Array.isArray(data.active_booking_id)
              ? data.active_booking_id[0]
              : data.active_booking_id
          )
          setBookingStatus("active_exists")
          setSliderProgress(0)
          return
        }

        setBookingError(data.message || "Failed to create booking")
        setBookingStatus("error")
        setTimeout(() => setBookingStatus("idle"), 3000)
      }
    } catch {
      setBookingError("Network error. Please try again.")
      setBookingStatus("error")
      setTimeout(() => setBookingStatus("idle"), 3000)
    }
    setSliderProgress(0)
    isSubmittingRef.current = false
  }, [bookingStatus, isAuthenticated, selectedLocation, category, quantity, selectedUnit, bookingNote])

  // ── Slider handlers ──
  const onSliderTouchStart = (e: React.TouchEvent) => {
    if (!sliderRef.current || (bookingStatus !== "idle" && bookingStatus !== "error")) return
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
      setTimeout(() => handleInstantBooking(), 0)
    } else {
      setSliderProgress(0)
    }
  }

  const onSliderMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current || (bookingStatus !== "idle" && bookingStatus !== "error")) return
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
          setTimeout(() => handleInstantBooking(), 0)
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
          <div className="flex items-start gap-3 px-4 lg:px-6 pt-3 pb-2">
            <button
              onClick={handleBack}
              className="size-9 lg:size-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground shadow-sm active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-base lg:text-lg font-bold text-foreground truncate">{categoryName}</h1>
              <div className="mt-0.5 flex items-center gap-2">
                <p className="text-[11px] lg:text-xs text-muted-foreground">
                  {availableProviders > 0
                    ? `${availableProviders} ${t("common.available")}`
                    : t("common.find_providers")}
                </p>
                {topProviderAvatars.length > 0 && (
                  <div className="flex items-center -space-x-1.5">
                    {topProviderAvatars.map((s) => (
                      <div key={s.id} className="size-5 rounded-full bg-muted/50 overflow-hidden relative border border-background shrink-0 shadow-sm">
                        <Image src={s.thumbnail || "/placeholder.svg"} alt="" fill className="object-cover" />
                      </div>
                    ))}
                    {remainingProviderCount > 0 && (
                      <div className="size-5 rounded-full bg-muted text-[9px] font-bold text-muted-foreground border border-background shrink-0 shadow-sm flex items-center justify-center">
                        +{remainingProviderCount}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="shrink-0 text-right lg:hidden">
              <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">{t("common.starting_at")}</p>
              <p className="text-2xl font-bold text-navy leading-none">
                {instantPrice ? (
                  <>
                    ₹{instantPrice}
                    <span className="text-[10px] font-medium text-navy/70 ml-0.5">/{priceUnitLabel}</span>
                  </>
                ) : (
                  "\u2014"
                )}
              </p>
            </div>
          </div>

          {/* ─── SEARCH BAR + LOCATION BTN + FILTER ─── */}
          <div className="px-4 lg:px-6 pb-3">
            <div className="flex items-center gap-2">
              {/* Search input with suggestions */}
              <div className="flex-1 min-w-0">
                <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
                  <PlacesAutocomplete
                    defaultValue={searchQuery}
                    onPlaceSelect={(place) => {
                      const loc: SelectedLocation = {
                        lat: place.lat,
                        lng: place.lng,
                        address: place.address,
                      }
                      handleLocationSelect(loc)
                    }}
                  />
                </APIProvider>
              </div>

              {/* Get Location button */}
              <button
                onClick={handleGetCurrentLocation}
                className={`size-10 shrink-0 rounded-xl border flex items-center justify-center shadow-sm active:scale-95 transition-all ${locationStatus === "fetching_gps"
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
              <div className="relative shrink-0" ref={filterRef}>
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

        {/* ── LEFT / TOP: Google Map (B&W / Grayscale) ── */}
        <div className="lg:flex-1 lg:sticky lg:top-[120px] lg:self-start">
          <div className="px-4 lg:px-6 pt-3 pb-4 lg:pb-3">
            <div >
              <GoogleMapPicker
                onLocationSelect={handleLocationSelect}
                selectedLocation={selectedLocation}
                serviceMarkers={serviceMarkers}
                className="aspect-[4/3] sm:aspect-[16/9] lg:aspect-auto lg:h-[calc(100vh-220px)]"
                restrictToCenter={true}
                defaultZoom={14}
              />
            </div>
          </div>
        </div>

        {/* ── RIGHT / BOTTOM: Booking Panel ── */}
        <div className="lg:w-[420px] xl:w-[460px] lg:border-l lg:border-border/50 flex flex-col">

          {/* ── Stats + Instant Booking Form ── */}
          {selectedLocation && (
            <div className="px-4 lg:px-6 pb-3 lg:pt-4 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">

              {/* ── Providers & Price Row ── */}
              <div className="hidden lg:flex bg-card border border-border rounded-xl p-4 items-center justify-between shadow-sm">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${availableProviders > 0 ? "bg-green-400" : "bg-red-400"}`} />
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${availableProviders > 0 ? "bg-green-500" : "bg-red-500"}`} />
                    </span>
                    <span className="text-[12px] font-medium text-foreground">
                      {t("provider.available").replace("{count}", String(availableProviders)).replace("{plural}", availableProviders !== 1 ? "s" : "")}
                    </span>
                  </div>
                  {services.length > 0 && (
                    <div className="flex items-center -space-x-1.5 pl-1">
                      {services.slice(0, 5).map((s) => (
                        <div key={s.id} className="size-6 rounded-full bg-muted/50 overflow-hidden relative border-[1.5px] border-card shrink-0 shadow-sm">
                          <Image src={s.thumbnail || "/placeholder.svg"} alt="" fill className="object-cover" />
                        </div>
                      ))}
                      {services.length > 5 && (
                        <div className="size-6 rounded-full bg-muted flex items-center justify-center border-[1.5px] border-card text-[9px] font-bold text-muted-foreground shrink-0 shadow-sm">
                          +{services.length - 5}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">{t("common.starting_at")}</p>
                  <p className="text-2xl font-bold text-navy leading-none">
                    {instantPrice ? (
                      <>
                        ₹{instantPrice}
                        <span className="text-xs font-medium text-navy/70 ml-0.5">/{priceUnitLabel}</span>
                      </>
                    ) : (
                      "\u2014"
                    )}
                  </p>
                </div>
              </div>

              {/* ── Instant Booking Form ── */}
              {isInstantEnabled && availableProviders > 0 && (
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-foreground">{t("booking.enter_estimated_detail")}</h3>
                  </div>

                  {/* Estimated */}
                  <div className={`flex-1 ${priceUnits.length > 0 ? "mb-1 grid grid-cols-2 gap-3" : "mb-1"}`}>
                    {/* Quantity */}
                    <div>
                      {/* <label className="text-[11px] font-medium text-muted-foreground mb-1 block">{t("booking.estimated")}</label> */}
                      <div className="flex items-center w-full h-11 border border-border rounded-lg bg-background overflow-hidden">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="h-full px-3 text-foreground/70 active:text-foreground active:bg-muted/50 transition-colors border-r border-border shrink-0 flex items-center justify-center font-medium focus:outline-none text-lg select-none"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <div className="flex-1 text-center font-medium text-foreground bg-transparent w-full text-sm">
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
                        {/* <label className="text-[11px] font-medium text-muted-foreground mb-1 block">{t("booking.unit")}</label> */}
                        <div className="relative">
                          <select
                            value={selectedUnit || category?.instant_price_unit || ""}
                            onChange={(e) => setSelectedUnit(e.target.value)}
                            className="w-full h-11 pl-3 pr-8 border border-border rounded-lg bg-background font-medium appearance-none text-foreground focus:outline-none focus:ring-2 focus:ring-navy/20 text-sm"
                          >
                            <option value="" disabled>
                              {t("booking.select_unit")}
                            </option>
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

                  {/* Estimated Total
                  {instantPrice > 0 && (
                    <div className="flex items-center justify-between bg-navy/5 rounded-lg px-3 py-2">
                      <span className="text-[11px] text-muted-foreground">
                        Est. Total ({quantity} × ₹{instantPrice})
                      </span>
                      <span className="text-sm font-bold text-navy">₹{estimatedTotal}</span>
                    </div>
                  )} */}

                  {/* Note */}
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">{t("booking.additional_note")}</label>
                    <textarea
                      value={bookingNote}
                      onChange={(e) => setBookingNote(e.target.value)}
                      placeholder={t("booking.note_placeholder")}
                      rows={2}
                      className="w-full border border-border rounded-lg bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-navy/20 resize-none placeholder:text-muted-foreground/50 transition-all"
                    />
                  </div>

                  {/* Error message */}
                  {bookingError && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
                      <span className="material-symbols-outlined text-[16px]">error</span>
                      <p className="text-xs font-medium">{bookingError}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Swipe to Book slider */}
              {availableProviders > 0 && isInstantEnabled ? (
                (bookingStatus === "idle" || bookingStatus === "error") ? (
                  <div
                    ref={sliderRef}
                    className="relative h-14 lg:h-16 rounded-xl overflow-hidden select-none touch-none shadow-lg bg-navy"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className={`text-white/60 text-sm font-semibold tracking-wide transition-opacity duration-200 ${sliderProgress > 0.15 ? "opacity-0" : "opacity-100"}`}>
                        {t("booking.swipe_to_book")}
                      </p>
                    </div>
                    <div
                      className="absolute inset-y-0 left-0 bg-green-500/20 rounded-xl transition-[width] duration-75"
                      style={{ width: `${sliderProgress * 100}%` }}
                    />
                    <div
                      className="absolute top-1.5 bottom-1.5 w-[52px] rounded-[10px] bg-white flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing z-10 transition-[left] duration-75"
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
                ) : bookingStatus === "creating" ? (
                  <div className="relative h-14 lg:h-16 rounded-xl bg-navy/80 flex items-center justify-center gap-2">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    <p className="text-white/80 text-sm font-semibold">{t("category.creating_booking")}</p>
                  </div>
                ) : null
              ) : availableProviders === 0 ? (
                <div className="relative h-14 bg-muted/60 border border-border rounded-xl flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-muted-foreground text-[20px]">search_off</span>
                  <p className="text-sm font-medium text-muted-foreground">{t("category.no_providers")}</p>
                </div>
              ) : null}

              {/* ─── BROWSE PROVIDERS BUTTON ─── */}
              <Link
                href={getProvidersUrl()}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-card border-2 border-navy/15 rounded-xl text-sm font-semibold text-foreground hover:bg-navy/5 hover:border-navy/30 active:scale-[0.98] transition-all group"
              >
                <span className="material-symbols-outlined text-[20px] text-navy" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
                <span>{t("common.direct_providers")}</span>
                <span className="material-symbols-outlined text-[16px] text-muted-foreground group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
              </Link>
            </div>
          )}

          {/* Prompt to set location */}
          {!selectedLocation && locationStatus === "no_location" && !isLoading && (
            <div className="px-4 lg:px-6 py-8 text-center">
              <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2">pin_drop</span>
              <p className="text-base font-medium text-foreground">{t("category.set_location")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("category.set_location_hint")}</p>
            </div>
          )}

          {/* Location detection in progress */}
          {!selectedLocation && (locationStatus === "checking" || locationStatus === "fetching_gps") && (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                <p className="text-sm text-muted-foreground">
                  {locationStatus === "checking" ? t("category.checking_location") : t("category.detecting_gps")}
                </p>
              </div>
            </div>
          )}

          {isLoading && selectedLocation && (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                <p className="text-sm text-muted-foreground">{t("common.loading_services") || "Loading services..."}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── ORDER CREATED POPUP ─── */}
      {bookingStatus === "created" && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-md mx-4 bg-card rounded-t-3xl lg:rounded-3xl border border-border shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
            <div className="bg-gradient-to-br from-green-600 to-green-700 px-6 py-8 text-center text-white">
              <div className="size-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <h2 className="text-xl font-bold mb-1">{t("booking.order_created")}</h2>
              <p className="text-sm text-white/80">
                {categoryName} • {quantity} {priceUnitLabel}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-navy/5 rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{t("common.order")}</span>
                  <span className="font-semibold text-foreground">{createdOrderNumber || createdBookingId || "—"}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{t("common.quantity")}</span>
                  <span className="font-semibold text-foreground">{quantity} {priceUnitLabel}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{t("booking.est_total")}</span>
                  <span className="font-bold text-navy">₹{quantity * instantPrice}</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                {t("booking.see_status")}
              </p>

              <button
                onClick={() => {
                  setBookingStatus("idle")
                  setCreatedBookingId(null)
                  setCreatedOrderNumber(null)
                }}
                className="w-full py-3 bg-navy text-white font-semibold rounded-xl hover:bg-navy/90 transition-colors text-sm"
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ACTIVE ORDER EXISTS MODAL ─── */}
      {bookingStatus === "active_exists" && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setBookingStatus("idle")} />
          <div className="relative w-full max-w-md mx-4 bg-card rounded-t-3xl lg:rounded-3xl border border-border shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-6 py-8 text-center text-white">
              <div className="size-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              </div>
              <h2 className="text-xl font-bold mb-1">{t("booking.active_exists_title")}</h2>
              <p className="text-sm text-white/80">{t("booking.active_exists")}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-orange-600 text-[24px] shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t("booking.cannot_create")}</p>
                  <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
                    {t("booking.cancel_or_wait")}
                  </p>
                </div>
              </div>

              {activeExistingBookingId && (
                <div className="bg-navy/5 rounded-xl p-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t("booking.active_order")}</span>
                    <span className="font-semibold text-foreground">{activeExistingBookingId}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => router.push("/orders")}
                  className="flex-1 py-3 bg-navy text-white font-semibold rounded-xl hover:bg-navy/90 transition-colors text-sm"
                >
                  {t("booking.view_orders")}
                </button>
                <button
                  onClick={() => {
                    setBookingStatus("idle")
                    setActiveExistingBookingId(null)
                  }}
                  className="flex-1 py-3 bg-muted/50 text-foreground font-semibold rounded-xl hover:bg-muted transition-colors text-sm"
                >
                  {t("common.close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── LOGIN PROMPT ─── */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLoginPrompt(false)} />
          <div className="relative w-full max-w-md mx-4 bg-card rounded-t-3xl lg:rounded-3xl border border-border shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
            <div className="bg-gradient-to-br from-navy to-navy/90 px-6 py-8 text-center text-white">
              <div className="size-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>login</span>
              </div>
              <h2 className="text-xl font-bold mb-1">{t("login.required")}</h2>
              <p className="text-sm text-white/80">{t("login.prompt")}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-3">
                <Link
                  href="/auth"
                  className="flex-1 py-3 bg-navy text-white font-semibold rounded-xl hover:bg-navy/90 transition-colors text-sm text-center"
                >
                  {t("login.login_signup")}
                </Link>
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="py-3 px-4 bg-muted/50 text-foreground font-semibold rounded-xl hover:bg-muted transition-colors text-sm"
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

