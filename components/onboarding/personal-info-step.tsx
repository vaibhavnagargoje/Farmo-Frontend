"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface PersonalInfoData {
    firstName: string
    lastName: string
    address: string
    lat: number | null
    lng: number | null
}

interface PersonalInfoStepProps {
    data: PersonalInfoData
    onChange: (data: PersonalInfoData) => void
    errors: Record<string, string>
    nameReadOnly?: boolean
}

export function PersonalInfoStep({ data, onChange, errors, nameReadOnly = false }: PersonalInfoStepProps) {
    const [isFetchingLocation, setIsFetchingLocation] = useState(false)
    const [locationError, setLocationError] = useState("")

    const handleChange = (field: keyof PersonalInfoData, value: string) => {
        onChange({ ...data, [field]: value })
    }

    const fetchLocation = () => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser")
            return
        }

        setIsFetchingLocation(true)
        setLocationError("")

        navigator.geolocation.getCurrentPosition(
            (position) => {
                onChange({
                    ...data,
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                })
                setIsFetchingLocation(false)
            },
            (error) => {
                setLocationError(
                    error.code === 1
                        ? "Location access denied. Please allow location permission."
                        : "Unable to fetch location. Please try again."
                )
                setIsFetchingLocation(false)
            },
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Section Header */}
            <div>
                <h2 className="text-xl font-bold text-navy lg:text-2xl">Personal Information</h2>
                <p className="text-sm text-muted mt-1">Tell us about yourself to get started</p>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="firstName" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        First Name <span className="text-destructive">*</span>
                        {nameReadOnly && <span className="material-symbols-outlined text-xs text-muted">lock</span>}
                    </Label>
                    <Input
                        id="firstName"
                        placeholder="e.g. Rajesh"
                        value={data.firstName}
                        onChange={(e) => handleChange("firstName", e.target.value)}
                        disabled={nameReadOnly}
                        className={`h-12 rounded-xl border ${nameReadOnly ? "bg-muted/10 text-muted cursor-not-allowed" : "bg-card"} ${errors.firstName ? "border-destructive ring-1 ring-destructive/30" : "border-border"} text-foreground placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all`}
                    />
                    {errors.firstName && (
                        <p className="text-xs text-destructive font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">error</span>
                            {errors.firstName}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="lastName" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        Last Name <span className="text-destructive">*</span>
                        {nameReadOnly && <span className="material-symbols-outlined text-xs text-muted">lock</span>}
                    </Label>
                    <Input
                        id="lastName"
                        placeholder="e.g. Kumar"
                        value={data.lastName}
                        onChange={(e) => handleChange("lastName", e.target.value)}
                        disabled={nameReadOnly}
                        className={`h-12 rounded-xl border ${nameReadOnly ? "bg-muted/10 text-muted cursor-not-allowed" : "bg-card"} ${errors.lastName ? "border-destructive ring-1 ring-destructive/30" : "border-border"} text-foreground placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all`}
                    />
                    {errors.lastName && (
                        <p className="text-xs text-destructive font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">error</span>
                            {errors.lastName}
                        </p>
                    )}
                </div>
            </div>

            {/* Address Field */}
            <div className="flex flex-col gap-2">
                <Label htmlFor="address" className="text-sm font-semibold text-foreground">
                    Full Address <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                    <Input
                        id="address"
                        placeholder="e.g. Village Khurd, Taluka Baramati, Pune"
                        value={data.address}
                        onChange={(e) => handleChange("address", e.target.value)}
                        className={`h-12 rounded-xl bg-card border ${errors.address ? "border-destructive ring-1 ring-destructive/30" : "border-border"} text-foreground placeholder:text-muted/60 pr-4 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all`}
                    />
                </div>
                {errors.address && (
                    <p className="text-xs text-destructive font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">error</span>
                        {errors.address}
                    </p>
                )}
            </div>

            {/* Fetch Location Button */}
            <div className="flex flex-col gap-3">
                <button
                    type="button"
                    onClick={fetchLocation}
                    disabled={isFetchingLocation}
                    className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed border-navy/30 bg-navy/5 text-navy font-semibold hover:bg-navy/10 hover:border-navy/50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isFetchingLocation ? (
                        <>
                            <div className="size-5 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
                            <span>Fetching Location...</span>
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-xl">my_location</span>
                            <span>Fetch My Current Location</span>
                        </>
                    )}
                </button>

                {/* Location Coordinates Badge */}
                {data.lat !== null && data.lng !== null && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-success/10 border border-success/20 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                        <span className="material-symbols-outlined text-success text-lg">check_circle</span>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-success">Location Captured</p>
                            <p className="text-xs text-muted font-mono">
                                {data.lat.toFixed(6)}, {data.lng.toFixed(6)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Location Error */}
                {locationError && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                        <span className="material-symbols-outlined text-destructive text-lg">warning</span>
                        <p className="text-sm text-destructive font-medium">{locationError}</p>
                    </div>
                )}
            </div>

            {/* Info Card */}
            <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/10 rounded-xl">
                <span className="material-symbols-outlined text-primary text-xl mt-0.5">info</span>
                <div>
                    <p className="text-sm font-medium text-foreground">Why do we need this?</p>
                    <p className="text-xs text-muted mt-0.5 leading-relaxed">
                        Your name and location help customers find & trust local service providers. Coordinates help us show your services to nearby farmers.
                    </p>
                </div>
            </div>
        </div>
    )
}
