"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { DesktopHeader } from "@/components/desktop-header"
import { MobileHeader } from "@/components/mobile-header"
import { type Service, type Category } from "@/lib/api"
import { useLanguage } from "@/contexts/language-context"

// ── Constants ──
const DISTANCE_OPTIONS = [
    { value: "5", label: "5 km" },
    { value: "10", label: "10 km" },
    { value: "20", label: "20 km" },
    { value: "50", label: "50 km" },
]

const SORT_OPTIONS_KEYS = [
    { value: "distance", labelKey: "providers.nearest", icon: "near_me" },
    { value: "price_low", labelKey: "providers.price_low", icon: "arrow_upward" },
    { value: "price_high", labelKey: "providers.price_high", icon: "arrow_downward" },
    { value: "rating", labelKey: "providers.top_rated", icon: "star" },
]

export default function ProvidersPage() {
    const params = useParams()
    const slug = params.slug as string
    const { t, lang } = useLanguage()

    // ── Translated sort options ──
    const SORT_OPTIONS = SORT_OPTIONS_KEYS.map((o) => ({ ...o, label: t(o.labelKey) }))

    // ── Data ──
    const [services, setServices] = useState<Service[]>([])
    const [category, setCategory] = useState<Category | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // ── Location (fetched from profile) ──
    const [lat, setLat] = useState<string | null>(null)
    const [lng, setLng] = useState<string | null>(null)
    const [address, setAddress] = useState("Your location")
    const [locationLoaded, setLocationLoaded] = useState(false)

    // ── Filters ──
    const [activeDistance, setActiveDistance] = useState("5")
    const [sortBy, setSortBy] = useState("distance")
    const [showFilters, setShowFilters] = useState(false)
    const [showSortMenu, setShowSortMenu] = useState(false)
    const [onlyAvailable, setOnlyAvailable] = useState(false)
    const filterRef = useRef<HTMLDivElement>(null)
    const sortRef = useRef<HTMLDivElement>(null)

    // ── View ──
    const [viewMode, setViewMode] = useState<"grid" | "list">("list")

    // ── Fetch saved location from profile on mount ──
    useEffect(() => {
        const fetchSavedLocation = async () => {
            try {
                const res = await fetch("/api/auth/location", { credentials: "include" })
                if (res.ok) {
                    const data = await res.json()
                    if (data.has_location && data.location) {
                        setLat(data.location.latitude)
                        setLng(data.location.longitude)
                        setAddress(data.location.address || "Your location")
                    }
                }
            } catch {
                // Not logged in or fetch failed
            } finally {
                setLocationLoaded(true)
            }
        }
        fetchSavedLocation()
    }, [])

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
        if (!locationLoaded) return // Wait for location fetch to complete

        const fetchServices = async () => {
            setIsLoading(true)
            setError(null)
            try {
                const qp = new URLSearchParams()
                qp.set("category", slug)
                if (lat && lng) {
                    qp.set("lat", lat)
                    qp.set("lng", lng)
                    if (activeDistance === "all") {
                        qp.set("distance", "0")
                    } else {
                        qp.set("distance", activeDistance)
                    }
                }
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
    }, [slug, lat, lng, activeDistance, locationLoaded])

    // ── Close dropdowns on outside click ──
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilters(false)
            if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortMenu(false)
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // ── Computed ──
    const categoryName = category?.name_translations?.[lang] || category?.name || slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    const activeDistanceLabel = DISTANCE_OPTIONS.find((d) => d.value === activeDistance)?.label || "All Areas"
    const currentSort = SORT_OPTIONS.find((s) => s.value === sortBy) || SORT_OPTIONS[0]
    const shortAddress = address.split(",").slice(0, 2).join(",").trim()

    // ── Sort & filter services ──
    const filteredServices = (onlyAvailable ? services.filter((s) => s.is_available) : services)
        .slice()
        .sort((a, b) => {
            switch (sortBy) {
                case "price_low":
                    return parseFloat(a.price || "0") - parseFloat(b.price || "0")
                case "price_high":
                    return parseFloat(b.price || "0") - parseFloat(a.price || "0")
                case "rating":
                    return parseFloat(b.partner_rating || "0") - parseFloat(a.partner_rating || "0")
                default:
                    return 0 // distance (already sorted by API)
            }
        })

    const availableCount = services.filter((s) => s.is_available).length

    return (
        <div className="relative min-h-screen flex flex-col pb-24 lg:pb-0 bg-background">
            <DesktopHeader variant="farmer" />
            <MobileHeader />

            {/* ─── STICKY HEADER ─── */}
            <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
                <div className="max-w-3xl mx-auto">
                    {/* Title Bar */}
                    <div className="flex items-center gap-3 px-4 lg:px-6 pt-3 pb-2">
                        <Link
                            href={`/category/${slug}`}
                            className="size-9 lg:size-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground shadow-sm active:scale-95 transition-transform"
                        >
                            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                        </Link>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-base lg:text-lg font-bold text-foreground truncate">
                                {t("providers.title").replace("{category}", categoryName)}
                            </h1>
                            <p className="text-[11px] lg:text-xs text-muted-foreground flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                                {!locationLoaded ? t("providers.loading_location") : shortAddress}
                            </p>
                        </div>
                        {/* View toggle */}
                        <button
                            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                            className="size-9 rounded-full bg-card border border-border flex items-center justify-center text-foreground shadow-sm active:scale-95 transition-transform"
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                {viewMode === "grid" ? "view_list" : "grid_view"}
                            </span>
                        </button>
                    </div>

                    {/* ─── FILTER BAR ─── */}
                    <div className="px-4 lg:px-6 pb-3 flex items-center gap-2">
                        {/* Distance filter */}
                        <div className="relative shrink-0" ref={filterRef}>
                            <button
                                onClick={() => { setShowFilters(!showFilters); setShowSortMenu(false) }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${activeDistance !== "all"
                                    ? "bg-navy text-white border-navy"
                                    : "bg-card text-foreground border-border hover:bg-muted/50"
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[14px]">filter_alt</span>
                                {activeDistance !== "all" ? activeDistanceLabel : t("providers.distance")}
                            </button>
                            {showFilters && (
                                <div className="absolute top-full left-0 mt-1.5 w-44 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                    <div className="px-3 py-2 border-b border-border">
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t("providers.distance_range")}</p>
                                    </div>
                                    {DISTANCE_OPTIONS.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => { setActiveDistance(option.value); setShowFilters(false) }}
                                            className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between transition-colors ${activeDistance === option.value
                                                ? "bg-navy/5 text-navy font-semibold"
                                                : "text-foreground hover:bg-muted/40"
                                                }`}
                                        >
                                            <span>{option.label}</span>
                                            {activeDistance === option.value && (
                                                <span className="material-symbols-outlined text-[14px] text-navy" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Sort */}
                        <div className="relative shrink-0" ref={sortRef}>
                            <button
                                onClick={() => { setShowSortMenu(!showSortMenu); setShowFilters(false) }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-medium text-foreground hover:bg-muted/50 transition-all"
                            >
                                <span className="material-symbols-outlined text-[14px]">{currentSort.icon}</span>
                                {currentSort.label}
                            </button>
                            {showSortMenu && (
                                <div className="absolute top-full left-0 mt-1.5 w-52 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                    <div className="px-3 py-2 border-b border-border">
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t("providers.sort_by")}</p>
                                    </div>
                                    {SORT_OPTIONS.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => { setSortBy(option.value); setShowSortMenu(false) }}
                                            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${sortBy === option.value
                                                ? "bg-navy/5 text-navy font-semibold"
                                                : "text-foreground hover:bg-muted/40"
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-[16px]">{option.icon}</span>
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Available only toggle */}
                        <button
                            onClick={() => setOnlyAvailable(!onlyAvailable)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all shrink-0 ${onlyAvailable
                                ? "bg-green-600 text-white border-green-600"
                                : "bg-card text-foreground border-border hover:bg-muted/50"
                                }`}
                        >
                            <span className="material-symbols-outlined text-[14px]">verified</span>
                            {t("providers.available_count").replace("{count}", String(availableCount))}
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── CONTENT ─── */}
            <div className="flex-1 max-w-3xl mx-auto w-full">
                {/* Results count */}
                {locationLoaded && lat && (
                    <div className="px-4 lg:px-6 pt-4 pb-2 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-foreground">
                                {t("providers.count_label").replace("{count}", String(filteredServices.length)).replace("{plural}", filteredServices.length === 1 ? "" : "s")}
                            </h2>
                            <p className="text-[11px] text-muted-foreground">
                                {activeDistance !== "all" && t("providers.within_distance").replace("{distance}", activeDistanceLabel).replace("{sort}", currentSort.label.toLowerCase())}
                                {activeDistance === "all" && t("providers.sort_by") + " " + currentSort.label.toLowerCase()}
                            </p>
                        </div>
                    </div>
                )}

                {/* Loading */}
                {(isLoading || !locationLoaded) && (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-3">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                            <p className="text-sm text-muted-foreground">
                                {!locationLoaded ? t("providers.loading_location") : t("providers.searching")}
                            </p>
                        </div>
                    </div>
                )}

                {/* Error */}
                {!isLoading && locationLoaded && error && (
                    <div className="px-4 lg:px-6 text-center py-16">
                        <span className="material-symbols-outlined text-5xl text-muted-foreground mb-3">cloud_off</span>
                        <p className="text-base font-medium text-foreground">{error}</p>
                        <p className="text-sm text-muted-foreground mt-1">Please try again later</p>
                    </div>
                )}

                {/* No location set */}
                {!isLoading && locationLoaded && !error && !lat && (
                    <div className="px-4 lg:px-6 py-16 text-center">
                        <span className="material-symbols-outlined text-5xl text-muted-foreground/50 mb-3">pin_drop</span>
                        <p className="text-base font-medium text-foreground">{t("providers.no_location_title")}</p>
                        <p className="text-sm text-muted-foreground mt-1">{t("providers.no_location_desc")}</p>
                        <Link
                            href={`/category/${slug}`}
                            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy/90 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                            Go Back
                        </Link>
                    </div>
                )}

                {/* Empty state */}
                {!isLoading && locationLoaded && !error && lat && filteredServices.length === 0 && (
                    <div className="px-4 lg:px-6 text-center py-16">
                        <span className="material-symbols-outlined text-5xl text-muted-foreground/50 mb-3">search_off</span>
                        <p className="text-base font-medium text-foreground">{t("providers.no_providers_title")}</p>
                        <p className="text-sm text-muted-foreground mt-1">{t("providers.no_providers_desc")}</p>
                        <div className="flex items-center justify-center gap-3 mt-5">
                            {activeDistance !== "all" && (
                                <button
                                    onClick={() => setActiveDistance("all")}
                                    className="px-4 py-2 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy/90 transition-colors"
                                >
                                    {t("providers.clear_distance")}
                                </button>
                            )}
                            {onlyAvailable && (
                                <button
                                    onClick={() => setOnlyAvailable(false)}
                                    className="px-4 py-2 bg-card border border-border text-foreground rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors"
                                >
                                    {t("providers.show_unavailable")}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── PROVIDER CARDS ─── */}
                {!isLoading && locationLoaded && !error && filteredServices.length > 0 && (
                    <div className={`px-4 lg:px-6 pb-6 ${viewMode === "grid" ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"
                        }`}>
                        {filteredServices.map((service) => (
                            <ProviderCard key={service.id} service={service} viewMode={viewMode} />
                        ))}
                    </div>
                )}
            </div>

            <BottomNav variant="farmer" />
        </div>
    )
}

// ─── Provider Card ───────────────────────────────────────
function ProviderCard({ service, viewMode }: { service: Service; viewMode: "grid" | "list" }) {
    const { t } = useLanguage()
    const tUnit = `unit.${service.price_unit?.toLowerCase()}`
    const translatedUnit = service.price_unit ? t(tUnit) : ""
    const priceUnitLabel = translatedUnit === tUnit ? `/${service.price_unit?.toLowerCase()}` : `/${translatedUnit}`
    const priceUnit = service.price_unit ? priceUnitLabel : ""
    const rating = service.partner_rating ? parseFloat(service.partner_rating) : 0

    if (viewMode === "list") {
        return (
            <Link
                href={`/booking/new/${service.id}`}
                className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden group hover:shadow-lg hover:border-primary/20 transition-all flex"
            >
                {/* Thumbnail */}
                <div className="relative w-28 sm:w-36 shrink-0 overflow-hidden bg-muted flex items-center justify-center">
                    {service.thumbnail || service.partner_profile_picture ? (
                        <Image
                            src={(service.thumbnail || service.partner_profile_picture)!}
                            alt={service.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <span className="text-muted-foreground text-3xl font-bold">
                            {service.partner_name?.charAt(0).toUpperCase() || "P"}
                        </span>
                    )}
                    {!service.is_available && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white text-[10px] font-bold bg-black/40 px-2 py-0.5 rounded">{t("providers.offline")}</span>
                        </div>
                    )}
                    {service.is_available && (
                        <div className="absolute top-2 left-2">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                            </span>
                        </div>
                    )}
                </div>

                {/* Details */}
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
                        <div className="flex items-center gap-1 text-primary bg-primary/5 px-2.5 py-1 rounded-lg">
                            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
                            <span className="text-xs font-semibold">{t("providers.book_now")}</span>
                            <span className="material-symbols-outlined text-[12px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                        </div>
                    </div>
                </div>
            </Link>
        )
    }

    // Grid view
    return (
        <Link
            href={`/booking/new/${service.id}`}
            className="bg-card rounded-2xl p-3 lg:p-4 shadow-sm border border-border/50 flex flex-col gap-2.5 group hover:shadow-lg hover:border-primary/20 transition-all"
        >
            <div className="relative w-full aspect-[4/3] bg-muted/20 rounded-xl overflow-hidden flex items-center justify-center">
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
                {/* Price badge */}
                <div className="absolute top-2 right-2 bg-card/95 backdrop-blur shadow-sm px-2 py-1 rounded-lg flex items-center gap-0.5 z-10 border border-border">
                    <span className="text-navy font-bold text-sm">₹{service.price}</span>
                    <span className="text-muted-foreground text-[10px]">{priceUnit}</span>
                </div>
                {/* Availability indicator */}
                {service.is_available ? (
                    <div className="absolute top-2 left-2">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                        </span>
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold bg-black/40 px-2 py-0.5 rounded">{t("providers.offline")}</span>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <h3 className="font-bold text-foreground text-sm lg:text-base line-clamp-1 group-hover:text-primary transition-colors">
                    {service.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1">
                    {service.partner_name || t("providers.default_name")}
                </p>
                <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1 text-primary">
                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
                        <span className="text-[11px] font-semibold">{t("providers.book_now")}</span>
                    </div>
                    {rating > 0 && (
                        <div className="flex items-center gap-0.5 text-xs font-bold text-success">
                            <span>{rating.toFixed(1)}</span>
                            <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    )
}
