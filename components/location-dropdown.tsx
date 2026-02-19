"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"

interface LocationDropdownProps {
  className?: string
  variant?: "mobile" | "desktop"
}

type LocationStatus = "idle" | "syncing" | "success" | "error"

export function LocationDropdown({ className, variant = "mobile" }: LocationDropdownProps) {
  const { isAuthenticated } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle")
  const [address, setAddress] = useState<string>("Set Location")
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Fetch saved location on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchSavedLocation()
    }
  }, [isAuthenticated])

  const fetchSavedLocation = async () => {
    try {
      const response = await fetch("/api/auth/location", {
        method: "GET",
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.has_location && data.location?.address) {
          // Shorten address for display (first 2 parts)
          const short = data.location.address.split(",").slice(0, 2).join(",").trim()
          setAddress(short || data.location.address)
          setLocationStatus("success")
        }
      }
    } catch (err) {
      console.error("Failed to fetch saved location:", err)
    }
  }

  const isMobile = variant === "mobile"

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* Location Trigger */}
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="flex items-center gap-0.5 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <span
          className={cn(
            "font-medium leading-none truncate max-w-[120px]",
            isMobile ? "text-xs text-muted-foreground" : "text-xs text-muted-foreground"
          )}
        >
          {address}
        </span>
        <span
          className={cn(
            "material-symbols-outlined transition-transform duration-200",
            isMobile ? "text-[14px] text-muted-foreground" : "text-[14px] text-muted-foreground",
            isOpen && "rotate-180"
          )}
        >
          arrow_drop_down
        </span>
        {/* {locationStatus === "success" && (
          <span className="material-symbols-outlined text-[6px] text-green-500 ml-0.5">check_circle</span>
        )} */}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            "absolute top-full mt-2 bg-card border border-border rounded-xl shadow-lg animate-in fade-in zoom-in-95 duration-150 z-[9999]",
            isMobile ? "left-0 w-56" : "left-0 w-64"
          )}
        >
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
          
              <span className="text-sm font-semibold text-foreground">Your Location</span>
            </div>

            {/* Current Location Display */}
            <div className="bg-muted/30 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">Current</p>
                  <p className="text-sm font-medium text-foreground truncate">{address}</p>
                </div>
                {locationStatus === "success" && (
                  <span className="material-symbols-outlined text-green-500 text-[16px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                )}
              </div>
            </div>

            {/* Detect current location */}
            <button
              onClick={async () => {
                setLocationStatus("syncing")
                if ("geolocation" in navigator) {
                  navigator.geolocation.getCurrentPosition(
                    async (position) => {
                      const { latitude, longitude } = position.coords
                      let detectedAddress = "Current location"
                      try {
                        const geocodeRes = await fetch(
                          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
                        )
                        if (geocodeRes.ok) {
                          const geocodeData = await geocodeRes.json()
                          if (geocodeData.results?.[0]?.formatted_address) {
                            detectedAddress = geocodeData.results[0].formatted_address
                          }
                        }
                      } catch { /* ignore geocode errors */ }

                      // Save to profile
                      try {
                        await fetch("/api/auth/location", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          body: JSON.stringify({ latitude, longitude, address: detectedAddress }),
                        })
                      } catch { /* ignore save errors */ }

                      const short = detectedAddress.split(",").slice(0, 2).join(",").trim()
                      setAddress(short || detectedAddress)
                      setLocationStatus("success")
                      setIsOpen(false)
                    },
                    () => {
                      setLocationStatus("error")
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
                  )
                } else {
                  setLocationStatus("error")
                }
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>my_location</span>
              {locationStatus === "syncing" ? "Detecting..." : "Use Current Location"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
