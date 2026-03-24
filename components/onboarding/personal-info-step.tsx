"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useMapsLibrary } from "@vis.gl/react-google-maps"
import { useLanguage } from "@/contexts/language-context"

export interface PersonalInfoData {
    fullName: string
    address: string
    lat: number | null
    lng: number | null
}

interface PersonalInfoStepProps {
    data: PersonalInfoData
    onChange: (data: PersonalInfoData) => void
    errors: Record<string, string>
    nameReadOnly?: boolean
    existingLocations?: { address: string }[]
}

export function PersonalInfoStep({ data, onChange, errors, nameReadOnly = false, existingLocations = [] }: PersonalInfoStepProps) {
    const { t } = useLanguage()
    const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [showExistingDropdown, setShowExistingDropdown] = useState(false)
    const [isTyping, setIsTyping] = useState(false)

    const placesLibrary = useMapsLibrary("places")
    const geocodingLibrary = useMapsLibrary("geocoding")

    const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null)
    const geocoder = useRef<google.maps.Geocoder | null>(null)
    const searchRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!placesLibrary) return
        autocompleteService.current = new placesLibrary.AutocompleteService()
    }, [placesLibrary])

    useEffect(() => {
        if (!geocodingLibrary) return
        geocoder.current = new geocodingLibrary.Geocoder()
    }, [geocodingLibrary])

    // Close dropdowns on outside click
    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowSuggestions(false)
                setShowExistingDropdown(false)
            }
        }
        if (showSuggestions || showExistingDropdown) {
            document.addEventListener("mousedown", handleOutside)
        }
        return () => document.removeEventListener("mousedown", handleOutside)
    }, [showSuggestions, showExistingDropdown])

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        onChange({ ...data, address: val, lat: null, lng: null })
        setIsTyping(true)
        setShowExistingDropdown(false)

        if (!val.trim() || !autocompleteService.current) {
            setPredictions([])
            setShowSuggestions(false)
            return
        }

        autocompleteService.current.getPlacePredictions(
            { input: val, componentRestrictions: { country: "in" } },
            (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                    setPredictions(results)
                    setShowSuggestions(true)
                } else {
                    setPredictions([])
                    setShowSuggestions(false)
                }
            }
        )
    }

    const handlePlaceSelect = (prediction: google.maps.places.AutocompletePrediction) => {
        onChange({ ...data, address: prediction.description })
        setShowSuggestions(false)
        setIsTyping(false)

        if (!geocoder.current) return

        geocoder.current.geocode({ placeId: prediction.place_id }, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
                const location = results[0].geometry.location
                onChange({
                    ...data,
                    address: prediction.description,
                    lat: location.lat(),
                    lng: location.lng(),
                })
            }
        })
    }

    const handleExistingLocationSelect = (address: string) => {
        onChange({ ...data, address })
        setShowExistingDropdown(false)
        setIsTyping(false)
    }

    const handleFocus = () => {
        // If user hasn't started typing and there are existing locations, show them
        if (!isTyping && existingLocations.length > 0) {
            setShowExistingDropdown(true)
            setShowSuggestions(false)
        } else if (predictions.length > 0) {
            setShowSuggestions(true)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Section Header */}
            <div>
                <h2 className="text-xl font-bold text-navy lg:text-2xl">{t("onboarding.step1.title")}</h2>
                <p className="text-sm text-muted mt-1">{t("onboarding.step1.desc")}</p>
            </div>

            {/* Full Name Field */}
            <div className="flex flex-col gap-2">
                <Label htmlFor="fullName" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    {t("onboarding.step1.full_name")} <span className="text-destructive">*</span>
                    {nameReadOnly && <span className="material-symbols-outlined text-xs text-muted">lock</span>}
                </Label>
                <Input
                    id="fullName"
                    placeholder={t("onboarding.step1.name_placeholder")}
                    value={data.fullName}
                    onChange={(e) => onChange({ ...data, fullName: e.target.value })}
                    disabled={nameReadOnly}
                    className={`h-12 rounded-xl border ${nameReadOnly ? "bg-muted/10 text-muted cursor-not-allowed" : "bg-card"} ${errors.fullName ? "border-destructive ring-1 ring-destructive/30" : "border-border"} text-foreground placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all`}
                />
                {errors.fullName && (
                    <p className="text-xs text-destructive font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">error</span>
                        {errors.fullName}
                    </p>
                )}
            </div>

            {/* Address Field with Google Places + Existing Locations */}
            <div className="flex flex-col gap-2">
                <Label htmlFor="address" className="text-sm font-semibold text-foreground">
                    {t("onboarding.step1.address")} <span className="text-destructive">*</span>
                </Label>
                <div className="relative" ref={searchRef}>
                    <div className={`flex items-center bg-card border rounded-xl shadow-sm overflow-hidden transition-all ${errors.address ? "border-destructive ring-1 ring-destructive/30" : "border-border"} focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20`}>
                        <span className="material-symbols-outlined text-[20px] text-muted-foreground pl-3 shrink-0">location_on</span>
                        <input
                            id="address"
                            type="text"
                            value={data.address}
                            onChange={handleAddressChange}
                            onFocus={handleFocus}
                            placeholder={existingLocations.length > 0 ? t("onboarding.step1.address_saved_placeholder") : t("onboarding.step1.address_placeholder")}
                            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground px-2.5 py-3 outline-none"
                        />
                        {data.address && (
                            <button
                                type="button"
                                onClick={() => {
                                    onChange({ ...data, address: "", lat: null, lng: null })
                                    setPredictions([])
                                    setShowSuggestions(false)
                                    setShowExistingDropdown(false)
                                    setIsTyping(false)
                                }}
                                className="pr-3 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                        )}
                    </div>

                    {/* Existing Locations Dropdown */}
                    {showExistingDropdown && existingLocations.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                            <div className="px-3 py-2 text-[10px] font-bold text-muted uppercase tracking-wider bg-muted/5 border-b border-border/30">
                                {t("onboarding.step1.saved_addresses")}
                            </div>
                            {existingLocations.map((loc, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleExistingLocationSelect(loc.address)}
                                    className="w-full px-3 py-2.5 text-left text-sm flex items-center gap-2.5 hover:bg-muted/40 transition-colors border-b border-border/30 last:border-b-0"
                                >
                                    <span className="material-symbols-outlined text-[16px] text-primary shrink-0">home</span>
                                    <span className="text-foreground truncate">{loc.address}</span>
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => {
                                    setShowExistingDropdown(false)
                                    setIsTyping(true)
                                }}
                                className="w-full px-3 py-2.5 text-left text-sm flex items-center gap-2.5 hover:bg-primary/5 transition-colors text-primary font-medium"
                            >
                                <span className="material-symbols-outlined text-[16px] shrink-0">add_location</span>
                                <span>{t("onboarding.step1.type_new_address")}</span>
                            </button>
                        </div>
                    )}

                    {/* Google Places Suggestions */}
                    {showSuggestions && predictions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                            {predictions.map((prediction) => (
                                <button
                                    key={prediction.place_id}
                                    type="button"
                                    onClick={() => handlePlaceSelect(prediction)}
                                    className="w-full px-3 py-2.5 text-left text-sm flex items-center gap-2.5 hover:bg-muted/40 transition-colors border-b border-border/30 last:border-b-0"
                                >
                                    <span className="material-symbols-outlined text-[16px] text-muted-foreground shrink-0">location_on</span>
                                    <span className="text-foreground truncate">{prediction.description}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {errors.address && (
                    <p className="text-xs text-destructive font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">error</span>
                        {errors.address}
                    </p>
                )}
            </div>

            {/* Info Card */}
            <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/10 rounded-xl">
                <span className="material-symbols-outlined text-primary text-xl mt-0.5">info</span>
                <div>
                    <p className="text-sm font-medium text-foreground">{t("onboarding.step1.why_need")}</p>
                    <p className="text-xs text-muted mt-0.5 leading-relaxed">
                        {t("onboarding.step1.why_need_desc")}
                    </p>
                </div>
            </div>
        </div>
    )
}
