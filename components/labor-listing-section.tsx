"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { APIProvider } from "@vis.gl/react-google-maps"
import { PlacesAutocomplete } from "@/components/PlacesAutocomplete"

interface LaborPartner {
    id: number
    full_name: string
    skills: string
    daily_wage_estimate: string | null
    is_migrant_worker: boolean
    skill_card_photo: string | null
    is_available: boolean
    rating: string
    jobs_completed: number
    distance_km: number
}

interface SelectedLocation {
    lat: number
    lng: number
    address: string
}

const KM_OPTIONS = [5, 10, 20, 50]

export function LaborListingSection() {
    const [labors, setLabors] = useState<LaborPartner[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null)
    const [locationStatus, setLocationStatus] = useState<"checking" | "fetching_gps" | "ready" | "no_location">("checking")
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedKm, setSelectedKm] = useState(5)
    const [totalCount, setTotalCount] = useState(0)
    const hasFetched = useRef(false)

    // Reverse geocode helper (client-side)
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
        } catch { /* ignore */ }
        return null
    }

    // Initialize location from saved profile or GPS
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
            } catch { /* Not logged in */ }

            // Fallback to GPS
            if ("geolocation" in navigator) {
                setLocationStatus("fetching_gps")
                const onSuccess = async (position: GeolocationPosition) => {
                    const { latitude, longitude } = position.coords
                    let address = "Current location"
                    const clientAddress = await reverseGeocodeClient(latitude, longitude)
                    if (clientAddress) address = clientAddress
                    setSelectedLocation({ lat: latitude, lng: longitude, address })
                    setSearchQuery(address)
                    setLocationStatus("ready")
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
            } else {
                setLocationStatus("no_location")
            }
        }
        initLocation()
    }, [])

    // Fetch nearby labors when location or distance changes
    useEffect(() => {
        if (!selectedLocation) return
        const fetchLabors = async () => {
            setIsLoading(true)
            try {
                const params = new URLSearchParams({
                    lat: selectedLocation.lat.toString(),
                    lng: selectedLocation.lng.toString(),
                    distance: selectedKm.toString(),
                })
                const res = await fetch(`/api/partner/nearby-labors?${params}`)
                if (res.ok) {
                    const data = await res.json()
                    setLabors(data.results || [])
                    setTotalCount(data.count || 0)
                } else {
                    setLabors([])
                    setTotalCount(0)
                }
            } catch {
                setLabors([])
            } finally {
                setIsLoading(false)
                hasFetched.current = true
            }
        }
        fetchLabors()
    }, [selectedLocation, selectedKm])

    // Handle "Get My Location"
    const handleGetCurrentLocation = useCallback(() => {
        if (!("geolocation" in navigator)) {
            alert("Geolocation not supported by your browser.")
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
                    () => { setLocationStatus("no_location"); alert("Unable to get location.") },
                    { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
                )
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
        )
    }, [])

    const getStatusInfo = (isAvailable: boolean) =>
        isAvailable
            ? { color: "bg-green-500", label: "Online", textColor: "text-green-700", bgColor: "bg-green-50" }
            : { color: "bg-gray-400", label: "Offline", textColor: "text-gray-600", bgColor: "bg-gray-50" }

    return (
        <section className="px-4 lg:px-6 pb-6">
            {/* ── Location Search Bar + Get Location Button ── */}
            <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 min-w-0">
                    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
                        <PlacesAutocomplete
                            defaultValue={searchQuery}
                            onPlaceSelect={(place) => {
                                setSearchQuery(place.address)
                                setSelectedLocation({ lat: place.lat, lng: place.lng, address: place.address })
                                setLocationStatus("ready")
                            }}
                        />
                    </APIProvider>
                </div>
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
            </div>

            {/* ── KM Range Selector ── */}
            <div className="flex items-center gap-2 mb-5">
                <span className="material-symbols-outlined text-muted-foreground text-[18px]">radar</span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Range:</span>
                <div className="flex gap-1.5">
                    {KM_OPTIONS.map(km => (
                        <button
                            key={km}
                            onClick={() => setSelectedKm(km)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedKm === km
                                ? "bg-navy text-white shadow-sm"
                                : "bg-card text-muted-foreground border border-border hover:bg-muted/30"
                                }`}
                        >
                            {km} km
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Content ── */}
            {locationStatus === "checking" || locationStatus === "fetching_gps" ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
                    <p className="text-sm text-muted-foreground">
                        {locationStatus === "checking" ? "Checking your location..." : "Getting your location..."}
                    </p>
                </div>
            ) : locationStatus === "no_location" ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-orange-500 text-[32px]">location_off</span>
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-1">Location Required</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mb-4">
                        Search for your location or enable GPS to find workers near you.
                    </p>
                    <button onClick={handleGetCurrentLocation} className="px-5 py-2.5 bg-navy text-white text-sm font-semibold rounded-xl hover:bg-navy/90 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>my_location</span>
                        Use My Location
                    </button>
                </div>
            ) : isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
                    <p className="text-sm text-muted-foreground">Finding workers near you...</p>
                </div>
            ) : labors.length === 0 && hasFetched.current ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-primary text-[32px]">person_search</span>
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-1">No Workers Found</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mb-4">
                        No labor workers found within {selectedKm} km of your location. Try expanding your range.
                    </p>
                    {selectedKm < 50 && (
                        <button onClick={() => setSelectedKm(Math.min(selectedKm * 2, 50))} className="px-5 py-2.5 bg-navy text-white text-sm font-semibold rounded-xl hover:bg-navy/90 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">expand_circle_right</span>
                            Expand to {Math.min(selectedKm * 2, 50)} km
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {/* Results count */}
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-foreground">
                            {totalCount} worker{totalCount !== 1 ? "s" : ""} nearby
                        </p>
                        <span className="text-xs text-muted-foreground">Within {selectedKm} km</span>
                    </div>

                    {/* Labor Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {labors.map(labor => {
                            const statusInfo = getStatusInfo(labor.is_available)
                            const skills = labor.skills?.split(",").map(s => s.trim()).filter(Boolean) || []
                            return (
                                <Link key={labor.id} href={`/labor/${labor.id}`} className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow block">
                                    {/* Header: Name + Status */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="relative shrink-0">
                                                <div className="w-11 h-11 rounded-full bg-navy/10 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-navy text-xl">person</span>
                                                </div>
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${statusInfo.color}`} />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-bold text-foreground truncate">{labor.full_name}</h4>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                                                        {statusInfo.label}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">• {labor.distance_km} km away</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Skills */}
                                    {skills.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-3">
                                            {skills.slice(0, 4).map((skill, i) => (
                                                <span key={i} className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-medium">
                                                    {skill}
                                                </span>
                                            ))}
                                            {skills.length > 4 && (
                                                <span className="px-2 py-0.5 rounded-md bg-muted/50 text-muted-foreground text-[11px] font-medium">
                                                    +{skills.length - 4} more
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Bottom Row: Wage, Rating, Jobs */}
                                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                        {labor.daily_wage_estimate && (
                                            <div className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-primary text-[14px]">payments</span>
                                                <span className="text-xs font-bold text-foreground">
                                                    ₹{Number(labor.daily_wage_estimate).toLocaleString("en-IN")}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">/day</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            {parseFloat(labor.rating) > 0 && (
                                                <div className="flex items-center gap-0.5">
                                                    <span className="material-symbols-outlined text-amber-500 text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                    <span className="text-xs font-semibold text-foreground">{parseFloat(labor.rating).toFixed(1)}</span>
                                                </div>
                                            )}
                                            {labor.jobs_completed > 0 && (
                                                <span className="text-[10px] text-muted-foreground">{labor.jobs_completed} jobs</span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </>
            )}
        </section>
    )
}
