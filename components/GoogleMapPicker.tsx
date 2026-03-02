"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { APIProvider, Map, AdvancedMarker, useMap, useApiIsLoaded } from "@vis.gl/react-google-maps"

// ── Types ──
interface SelectedLocation {
    lat: number
    lng: number
    address: string
}

interface ServiceMarker {
    id: number
    lat: number
    lng: number
    title: string
    partnerName?: string
}

interface GoogleMapPickerProps {
    onLocationSelect: (location: SelectedLocation) => void
    selectedLocation?: SelectedLocation | null
    serviceMarkers?: ServiceMarker[]
    className?: string
    defaultCenter?: { lat: number; lng: number }
    defaultZoom?: number
}

// ── Default center: Surat, Gujarat ──
const DEFAULT_CENTER = { lat: 21.1702, lng: 72.8311 }
const DEFAULT_ZOOM = 11
const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

// ── Inner Map Component (has access to map instance) ──
function MapContent({
    onLocationSelect,
    selectedLocation,
    serviceMarkers = [],
    defaultCenter = DEFAULT_CENTER,
    defaultZoom = DEFAULT_ZOOM,
}: Omit<GoogleMapPickerProps, "className">) {
    const map = useMap()
    const geocoderRef = useRef<google.maps.Geocoder | null>(null)
    const [isLocating, setIsLocating] = useState(false)
    const apiIsLoaded = useApiIsLoaded()

    // Init geocoder when API is loaded
    useEffect(() => {
        if (apiIsLoaded && !geocoderRef.current) {
            geocoderRef.current = new google.maps.Geocoder()
        }
    }, [apiIsLoaded])

    // Pan to selected location when it changes
    useEffect(() => {
        if (map && selectedLocation) {
            map.panTo({ lat: selectedLocation.lat, lng: selectedLocation.lng })
        }
    }, [map, selectedLocation?.lat, selectedLocation?.lng])

    // Reverse geocode lat/lng to address
    const reverseGeocode = useCallback(
        async (lat: number, lng: number): Promise<string> => {
            if (!geocoderRef.current) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
            try {
                const response = await geocoderRef.current.geocode({
                    location: { lat, lng },
                })
                if (response.results && response.results.length > 0) {
                    // Prefer a short, meaningful address
                    const result = response.results[0]
                    return result.formatted_address
                }
            } catch (err) {
                console.error("Geocoding failed:", err)
            }
            return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        },
        []
    )

    // Handle map click to pick location
    const handleMapClick = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (e: any) => {
            const latLng = e?.detail?.latLng
            if (!latLng) return
            const lat = latLng.lat as number
            const lng = latLng.lng as number
            const address = await reverseGeocode(lat, lng)
            onLocationSelect({ lat, lng, address })
        },
        [onLocationSelect, reverseGeocode]
    )

    // Use current GPS location
    const handleUseCurrentLocation = useCallback(async () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser")
            return
        }
        setIsLocating(true)
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude
                const lng = position.coords.longitude
                const address = await reverseGeocode(lat, lng)
                onLocationSelect({ lat, lng, address })
                if (map) {
                    map.panTo({ lat, lng })
                    map.setZoom(14)
                }
                setIsLocating(false)
            },
            (error) => {
                console.error("Geolocation error:", error)
                alert("Unable to get your location. Please allow location access or pick on the map.")
                setIsLocating(false)
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        )
    }, [map, onLocationSelect, reverseGeocode])

    return (
        <div className="relative w-full h-full">
            <Map
                defaultCenter={defaultCenter}
                defaultZoom={defaultZoom}
                mapId="farmo-location-picker"
                gestureHandling="greedy"
                disableDefaultUI={false}
                zoomControl={true}
                streetViewControl={false}
                mapTypeControl={false}
                fullscreenControl={false}
                onClick={handleMapClick}
                style={{ width: "100%", height: "100%" }}
            >
                {/* ── Selected Location Marker ── */}
                {selectedLocation && (
                    <AdvancedMarker
                        position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                        title={selectedLocation.address}
                    >
                        <div className="flex flex-col items-center">
                            <div className="bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-lg mb-1 shadow-lg whitespace-nowrap max-w-[200px] truncate">
                                {selectedLocation.address.split(",").slice(0, 2).join(",")}
                            </div>
                            <div className="relative">
                                <span
                                    className="material-symbols-outlined text-primary text-[40px] drop-shadow-lg"
                                    style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                    location_on
                                </span>
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary/30 rounded-full animate-ping" />
                            </div>
                        </div>
                    </AdvancedMarker>
                )}

                {/* ── Service Location Markers ── */}
                {serviceMarkers.map((marker) => (
                    <AdvancedMarker
                        key={marker.id}
                        position={{ lat: marker.lat, lng: marker.lng }}
                        title={`${marker.title} — ${marker.partnerName || "Provider"}`}
                    >
                        <div className="flex flex-col items-center">
                            <div className="w-4 h-4 bg-navy rounded-full shadow-lg border-2 border-white animate-pulse" />
                        </div>
                    </AdvancedMarker>
                ))}
            </Map>




            {/* ── No-location overlay ── */}
            {!selectedLocation && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/10 dark:bg-black/30 backdrop-blur-[6px] rounded-2xl pointer-events-none">
                    <div className="flex flex-col items-center gap-2 px-6 text-center pointer-events-auto">
                        <div className="size-14 rounded-full bg-card/90 border border-border shadow-lg flex items-center justify-center">
                            <span
                                className="material-symbols-outlined text-primary text-[28px]"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                                pin_drop
                            </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-foreground">
                            Set Your Location
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground max-w-[220px] leading-relaxed">
                            Click on the map or use current location to see nearby providers
                        </p>
                        <button
                            onClick={handleUseCurrentLocation}
                            disabled={isLocating}
                            className="mt-1 inline-flex items-center gap-2 px-4 py-2 bg-navy text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-navy/90 transition-colors disabled:opacity-50 shadow-lg"
                        >
                            <span
                                className="material-symbols-outlined text-[16px]"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                                my_location
                            </span>
                            {isLocating ? "Locating..." : "Use Current Location"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Main Exported Component ──
export default function GoogleMapPicker(props: GoogleMapPickerProps) {
    const { className = "", ...rest } = props

    return (
        <div className={`relative w-full overflow-hidden rounded-2xl border border-border shadow-sm ${className}`}>
            <APIProvider apiKey={MAPS_API_KEY}>
                <MapContent {...rest} />
            </APIProvider>
        </div>
    )
}

// Re-export the type for use in parent components
export type { SelectedLocation, ServiceMarker }
