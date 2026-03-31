"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { APIProvider } from "@vis.gl/react-google-maps"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { DesktopHeader } from "@/components/desktop-header"
import { MobileHeader } from "@/components/mobile-header"
import { PlacesAutocomplete } from "@/components/PlacesAutocomplete"
import { type Service, type Category } from "@/lib/api"
import { useLanguage } from "@/contexts/language-context"

// ── Constants ──
const KM_OPTIONS = [5, 10, 20, 50]

interface SelectedLocation {
    lat: number
    lng: number
    address: string
}

export default function ProvidersPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const slug = params.slug as string
    const { t, lang } = useLanguage()
    const from = searchParams.get("from")

    // ── Data ──
    const [services, setServices] = useState<Service[]>([])
    const [category, setCategory] = useState<Category | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // ── Location ──
    const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null)
    const [locationStatus, setLocationStatus] = useState<"checking" | "fetching_gps" | "ready" | "no_location">("checking")
    const [searchQuery, setSearchQuery] = useState("")

    // ── Filters ──
    const [activeDistance, setActiveDistance] = useState(5)

    // ── Reverse geocode helper (client-side) ──
    const reverseGeocodeClient = async (lat: number, lng: number): Promise<string | null> => {
        if (typeof window === "undefined") return null
        let retries = 30
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
        } catch {
            // Ignore geocoder failures and keep fallback address
        }
        return null
    }

    // ── Initialize location from saved profile or GPS ──
    useEffect(() => {
        const initLocation = async () => {
            setLocationStatus("checking")
            try {
                const res = await fetch("/api/auth/location", { credentials: "include" })
                if (res.ok) {
                    const data = await res.json()
                    if (data.has_location && data.location) {
                        const lat = parseFloat(data.location.latitude)
                        const lng = parseFloat(data.location.longitude)
                        const address = data.location.address || "Saved location"
                        setSelectedLocation({ lat, lng, address })
                        setSearchQuery(address)
                        setLocationStatus("ready")
                        return
                    }
                }
            } catch {
                // Ignore and fall back to GPS
            }

            if (!("geolocation" in navigator)) {
                setLocationStatus("no_location")
                return
            }

            setLocationStatus("fetching_gps")
            const onSuccess = async (position: GeolocationPosition) => {
                const { latitude, longitude } = position.coords
                let address = "Current location"
                const clientAddress = await reverseGeocodeClient(latitude, longitude)
                if (clientAddress) address = clientAddress

                const location: SelectedLocation = { lat: latitude, lng: longitude, address }
                setSelectedLocation(location)
                setSearchQuery(address)
                setLocationStatus("ready")

                fetch("/api/auth/location", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ latitude, longitude, address }),
                }).catch(() => { })
            }

            navigator.geolocation.getCurrentPosition(
                onSuccess,
                () => {
                    navigator.geolocation.getCurrentPosition(
                        onSuccess,
                        () => setLocationStatus("no_location"),
                        { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
                    )
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
            )
        }

        initLocation()
    }, [])

    const handleLocationSelect = (place: { address: string; lat: number; lng: number }) => {
        setSearchQuery(place.address)
        setSelectedLocation({ lat: place.lat, lng: place.lng, address: place.address })
        setLocationStatus("ready")
        setError(null)

        fetch("/api/auth/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude: place.lat, longitude: place.lng, address: place.address }),
        }).catch(() => { })
    }

    const handleGetCurrentLocation = () => {
        if (!("geolocation" in navigator)) {
            alert(t("location.not_supported"))
            return
        }

        setLocationStatus("fetching_gps")
        const onSuccess = async (position: GeolocationPosition) => {
            const { latitude, longitude } = position.coords
            let address = "Current location"
            const clientAddress = await reverseGeocodeClient(latitude, longitude)
            if (clientAddress) address = clientAddress

            setSelectedLocation({ lat: latitude, lng: longitude, address })
            setSearchQuery(address)
            setLocationStatus("ready")
            setError(null)

            fetch("/api/auth/location", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ latitude, longitude, address }),
            }).catch(() => { })
        }

        navigator.geolocation.getCurrentPosition(
            onSuccess,
            () => {
                navigator.geolocation.getCurrentPosition(
                    onSuccess,
                    () => {
                        setLocationStatus("no_location")
                        alert(t("location.unable"))
                    },
                    { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
                )
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
        )
    }

    // ── Fetch category data (re-fetches when lang changes for translations) ──
    useEffect(() => {
        const fetchCategory = async () => {
            try {
                const params = new URLSearchParams()
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
    }, [slug, lang])

    // ── Fetch services when location or distance changes ──
    useEffect(() => {
        if (!selectedLocation || locationStatus !== "ready") return

        const fetchServices = async () => {
            setIsLoading(true)
            setError(null)
            try {
                const qp = new URLSearchParams()
                qp.set("category", slug)
                qp.set("lat", selectedLocation.lat.toString())
                qp.set("lng", selectedLocation.lng.toString())
                qp.set("distance", String(activeDistance))
                const servicesRes = await fetch(`/api/services?${qp.toString()}`)
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
    }, [slug, selectedLocation, locationStatus, activeDistance])

    // ── Computed ──
    const categoryName = category?.name_translations?.[lang] || category?.name || slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    const activeDistanceLabel = `${activeDistance} km`
    const shortAddress = selectedLocation?.address
        ? selectedLocation.address.split(",").slice(0, 2).join(",").trim()
        : t("location.no_location")

    const filteredServices = services
    const nextDistance = activeDistance < 10 ? 10 : activeDistance < 20 ? 20 : 50
    const fastBookHref = `/category/${slug}?from=${encodeURIComponent(`/category/${slug}/providers`)}`

    const handleBack = () => {
        if (from) {
            router.push(from)
            return
        }
        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back()
            return
        }
        router.push("/")
    }

    return (
        <div className="relative min-h-screen flex flex-col pb-24 lg:pb-0 bg-background">
            <DesktopHeader variant="farmer" />
            <MobileHeader />

            {/* ─── STICKY HEADER ─── */}
            <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
                <div className="max-w-3xl mx-auto">
                    {/* Title Bar */}
                    <div className="flex items-center gap-3 px-4 lg:px-6 pt-3 pb-2.5">
                        <button
                            onClick={handleBack}
                            className="size-9 lg:size-10 rounded-lg bg-card border border-border flex items-center justify-center text-foreground shadow-sm active:scale-95 transition-transform"
                        >
                            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                        </button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-base lg:text-lg font-bold text-foreground truncate">
                                {t("providers.title").replace("{category}", categoryName)}
                            </h1>
                            <p className="text-[11px] lg:text-xs text-muted-foreground flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                                {locationStatus === "checking" || locationStatus === "fetching_gps"
                                    ? t("providers.loading_location")
                                    : shortAddress}
                            </p>
                        </div>
                        <Link
                            href={fastBookHref}
                            className="h-9 px-3.5 rounded-lg bg-navy text-white border border-navy flex items-center justify-center text-xs font-semibold shadow-sm hover:bg-navy/90 active:scale-95 transition-transform whitespace-nowrap"
                        >
                            Fast Book
                        </Link>
                    </div>

                    {/* ─── LOCATION BAR ─── */}
                    <div className="px-4 lg:px-6 pb-2.5">
                        <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                                <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
                                    <PlacesAutocomplete
                                        defaultValue={searchQuery}
                                        placeholder={t("location.search_placeholder")}
                                        onPlaceSelect={handleLocationSelect}
                                    />
                                </APIProvider>
                            </div>
                            <button
                                onClick={handleGetCurrentLocation}
                                className={`size-10 shrink-0 rounded-xl border flex items-center justify-center shadow-sm active:scale-95 transition-all ${locationStatus === "fetching_gps"
                                    ? "bg-primary/10 border-primary/30 text-primary"
                                    : "bg-card text-primary border-border hover:bg-primary/5"
                                    }`}
                                title={t("location.get_current")}
                            >
                                {locationStatus === "fetching_gps" ? (
                                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                                ) : (
                                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>my_location</span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* ─── FILTER BAR ─── */}
                    <div className="px-4 lg:px-6 pb-3">
                        <div className="bg-card/80 border border-border rounded-lg px-3 py-2.5 shadow-sm">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="material-symbols-outlined text-muted-foreground text-[18px]">radar</span>
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mr-0.5">
                                    {t("distance.range")}
                                </span>
                                {KM_OPTIONS.map((km) => (
                                    <button
                                        key={km}
                                        onClick={() => setActiveDistance(km)}
                                        className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all ${activeDistance === km
                                            ? "bg-navy text-white shadow-sm"
                                            : "bg-background text-muted-foreground border border-border hover:bg-muted/30"
                                            }`}
                                    >
                                        {km}km
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── CONTENT ─── */}
            <div className="flex-1 max-w-3xl mx-auto w-full">
                {/* Results count */}
                {locationStatus === "ready" && selectedLocation && !isLoading && (
                    <div className="px-4 lg:px-6 pt-4 pb-2">
                        <div className="bg-card/70 border border-border rounded-lg px-3.5 py-2.5">
                            <h2 className="text-sm font-bold text-foreground">
                                {t("providers.count_label").replace("{count}", String(filteredServices.length)).replace("{plural}", filteredServices.length === 1 ? "" : "s")}
                            </h2>
                            <p className="text-[11px] text-muted-foreground">
                                {t("distance.within")} {activeDistanceLabel}
                            </p>
                        </div>
                    </div>
                )}

                {/* Loading */}
                {(locationStatus === "checking" || locationStatus === "fetching_gps" || (locationStatus === "ready" && isLoading)) && (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-3">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                            <p className="text-sm text-muted-foreground">
                                {locationStatus === "checking"
                                    ? t("location.checking")
                                    : locationStatus === "fetching_gps"
                                        ? t("location.fetching_gps")
                                        : t("providers.searching")}
                            </p>
                        </div>
                    </div>
                )}

                {/* Error */}
                {!isLoading && locationStatus === "ready" && error && (
                    <div className="px-4 lg:px-6 text-center py-16">
                        <span className="material-symbols-outlined text-5xl text-muted-foreground mb-3">cloud_off</span>
                        <p className="text-base font-medium text-foreground">{error}</p>
                        <p className="text-sm text-muted-foreground mt-1">Please try again later</p>
                    </div>
                )}

                {/* No location set */}
                {locationStatus === "no_location" && !isLoading && !error && (
                    <div className="px-4 lg:px-6 py-16 text-center">
                        <span className="material-symbols-outlined text-5xl text-muted-foreground/50 mb-3">pin_drop</span>
                        <p className="text-base font-medium text-foreground">{t("providers.no_location_title")}</p>
                        <p className="text-sm text-muted-foreground mt-1">{t("providers.no_location_desc")}</p>
                        <button
                            onClick={handleGetCurrentLocation}
                            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy/90 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>my_location</span>
                            {t("location.use_my_location")}
                        </button>
                    </div>
                )}

                {/* Empty state */}
                {!isLoading && locationStatus === "ready" && !error && selectedLocation && filteredServices.length === 0 && (
                    <div className="px-4 lg:px-6 text-center py-16">
                        <span className="material-symbols-outlined text-5xl text-muted-foreground/50 mb-3">search_off</span>
                        <p className="text-base font-medium text-foreground">{t("providers.no_providers_title")}</p>
                        <p className="text-sm text-muted-foreground mt-1">{t("providers.no_providers_desc")}</p>
                        <div className="flex items-center justify-center gap-3 mt-5">
                            {activeDistance < 50 && (
                                <button
                                    onClick={() => setActiveDistance(nextDistance)}
                                    className="px-4 py-2 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy/90 transition-colors"
                                >
                                    {t("labor.expand_to").replace("{km}", String(nextDistance))}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── PROVIDER CARDS ─── */}
                {!isLoading && locationStatus === "ready" && !error && filteredServices.length > 0 && (
                    <div className="px-4 lg:px-6 pb-6 flex flex-col gap-2.5">
                        {filteredServices.map((service) => (
                            <ProviderCard key={service.id} service={service} />
                        ))}
                    </div>
                )}
            </div>

            <BottomNav variant="farmer" />
        </div>
    )
}

// ─── Provider Card ───────────────────────────────────────
function ProviderCard({ service }: { service: Service }) {
    const { t } = useLanguage()
    const tUnit = `unit.${service.price_unit?.toLowerCase()}`
    const translatedUnit = service.price_unit ? t(tUnit) : ""
    const priceUnitLabel = translatedUnit === tUnit ? `/${service.price_unit?.toLowerCase()}` : `/${translatedUnit}`
    const priceUnit = service.price_unit ? priceUnitLabel : ""
    const rating = service.partner_rating ? parseFloat(service.partner_rating) : 0
    return (
        <Link
            href={`/booking/new/${service.id}`}
            className="bg-card rounded-lg shadow-sm border border-border/70 overflow-hidden group hover:shadow-md hover:border-primary/25 transition-all flex"
        >
            <div className="relative w-28 sm:w-36 shrink-0 overflow-hidden bg-muted/60 flex items-center justify-center">
                {service.thumbnail || service.partner_profile_picture ? (
                    <Image
                        src={(service.thumbnail || service.partner_profile_picture)!}
                        alt={service.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <span className="text-muted-foreground text-4xl font-bold">
                        {service.partner_name?.charAt(0).toUpperCase() || "P"}
                    </span>
                )}
                {!service.is_available && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold bg-black/40 px-2 py-0.5 rounded-sm">{t("providers.offline")}</span>
                    </div>
                )}
                {service.is_available ? (
                    <div className="absolute top-2 left-2">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                        </span>
                    </div>
                ) : null}
            </div>

            <div className="flex-1 p-3 lg:p-4 flex flex-col justify-between min-w-0">
                <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-foreground text-sm lg:text-base line-clamp-1 group-hover:text-primary transition-colors">
                            {service.title}
                        </h3>
                        {rating > 0 && (
                            <div className="flex items-center gap-0.5 bg-success/10 px-1.5 py-0.5 rounded text-[11px] font-bold text-success shrink-0">
                                <span>{rating.toFixed(1)}</span>
                                <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                        {service.partner_name || t("providers.default_name")}
                    </p>
                    {service.description && (
                        <p className="text-[11px] text-muted-foreground/70 line-clamp-1 mt-1">{service.description}</p>
                    )}
                </div>

                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/50">
                    <div className="flex items-baseline gap-0.5">
                        <span className="text-lg font-bold text-navy">₹{service.price}</span>
                        <span className="text-[10px] text-muted-foreground">{priceUnit}</span>
                    </div>
                    <div className="flex items-center gap-1 text-primary bg-primary/5 px-2.5 py-1 rounded-md border border-primary/10">
                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
                        <span className="text-xs font-semibold">{t("providers.book_now")}</span>
                        <span className="material-symbols-outlined text-[12px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}
