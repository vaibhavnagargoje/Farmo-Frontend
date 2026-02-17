"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export interface ServiceImageItem {
    file: File
    preview: string
    id: string
}

export interface ListServicesData {
    category: string
    title: string
    description: string
    price: string
    priceUnit: string
    locationLat: number | null
    locationLng: number | null
    serviceRadius: number
    images: ServiceImageItem[]
}

interface ListServicesStepProps {
    data: ListServicesData
    onChange: (data: ListServicesData) => void
    errors: Record<string, string>
    defaultLat?: number | null
    defaultLng?: number | null
}

const categories = [
    { value: "agriculture-machinery", label: "Agriculture Machinery", icon: "agriculture" },
    { value: "construction-labor", label: "Construction Labor", icon: "construction" },
    { value: "goods-transport", label: "Goods Transport", icon: "local_shipping" },
    { value: "harvesting", label: "Harvesting Services", icon: "grass" },
    { value: "irrigation", label: "Irrigation Services", icon: "water_drop" },
    { value: "pest-control", label: "Pest Control", icon: "bug_report" },
]

const priceUnits = [
    { value: "HOUR", label: "Per Hour" },
    { value: "DAY", label: "Per Day" },
    { value: "KM", label: "Per Kilometer" },
    { value: "ACRE", label: "Per Acre" },
    { value: "FIXED", label: "Fixed Price" },
]

export function ListServicesStep({
    data,
    onChange,
    errors,
    defaultLat,
    defaultLng,
}: ListServicesStepProps) {
    const imageInputRef = useRef<HTMLInputElement>(null)
    const [isFetchingLocation, setIsFetchingLocation] = useState(false)

    // Pre-fill location from Step 1 if not already set
    const hasLocation = data.locationLat !== null && data.locationLng !== null
    const displayLat = data.locationLat ?? defaultLat
    const displayLng = data.locationLng ?? defaultLng

    const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        const newImages: ServiceImageItem[] = []
        Array.from(files).forEach((file) => {
            if (!file.type.startsWith("image/")) return
            if (file.size > 5 * 1024 * 1024) return

            newImages.push({
                file,
                preview: URL.createObjectURL(file),
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            })
        })

        onChange({ ...data, images: [...data.images, ...newImages] })
        // Reset the input so the same file can be selected again
        e.target.value = ""
    }

    const removeImage = (id: string) => {
        const img = data.images.find((i) => i.id === id)
        if (img) URL.revokeObjectURL(img.preview)
        onChange({ ...data, images: data.images.filter((i) => i.id !== id) })
    }

    const fetchServiceLocation = () => {
        if (!navigator.geolocation) return

        setIsFetchingLocation(true)
        navigator.geolocation.getCurrentPosition(
            (position) => {
                onChange({
                    ...data,
                    locationLat: position.coords.latitude,
                    locationLng: position.coords.longitude,
                })
                setIsFetchingLocation(false)
            },
            () => {
                setIsFetchingLocation(false)
            },
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }

    const useDefaultLocation = () => {
        if (defaultLat && defaultLng) {
            onChange({ ...data, locationLat: defaultLat, locationLng: defaultLng })
        }
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Section Header */}
            <div>
                <h2 className="text-xl font-bold text-navy lg:text-2xl">List Your First Service</h2>
                <p className="text-sm text-muted mt-1">
                    Add the service you want to offer to customers
                </p>
            </div>

            {/* Category Selection */}
            <div className="flex flex-col gap-2">
                <Label className="text-sm font-semibold text-foreground">
                    Service Category <span className="text-destructive">*</span>
                </Label>
                <Select
                    value={data.category}
                    onValueChange={(value) => onChange({ ...data, category: value })}
                >
                    <SelectTrigger
                        className={`h-12 rounded-xl bg-card w-full border ${errors.category ? "border-destructive" : "border-border"} focus:border-primary`}
                    >
                        <SelectValue placeholder="Choose a category" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border rounded-xl">
                        {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value} className="rounded-lg">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg text-primary">
                                        {cat.icon}
                                    </span>
                                    <span>{cat.label}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.category && (
                    <p className="text-xs text-destructive font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">error</span>
                        {errors.category}
                    </p>
                )}
            </div>

            {/* Service Title */}
            <div className="flex flex-col gap-2">
                <Label htmlFor="serviceTitle" className="text-sm font-semibold text-foreground">
                    Service Title <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="serviceTitle"
                    placeholder="e.g. Tractor Ploughing Service"
                    value={data.title}
                    onChange={(e) => onChange({ ...data, title: e.target.value })}
                    className={`h-12 rounded-xl bg-card border ${errors.title ? "border-destructive ring-1 ring-destructive/30" : "border-border"} text-foreground placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all`}
                />
                {errors.title && (
                    <p className="text-xs text-destructive font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">error</span>
                        {errors.title}
                    </p>
                )}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
                <Label htmlFor="serviceDescription" className="text-sm font-semibold text-foreground">
                    Description
                </Label>
                <Textarea
                    id="serviceDescription"
                    placeholder="Describe your service, equipment condition, experience..."
                    value={data.description}
                    onChange={(e) => onChange({ ...data, description: e.target.value })}
                    rows={3}
                    className="rounded-xl bg-card border border-border text-foreground placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
            </div>

            {/* Price & Unit */}
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="price" className="text-sm font-semibold text-foreground">
                        Price <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-muted">
                            ₹
                        </span>
                        <Input
                            id="price"
                            type="number"
                            placeholder="1200"
                            value={data.price}
                            onChange={(e) => onChange({ ...data, price: e.target.value })}
                            className={`h-12 rounded-xl bg-card border ${errors.price ? "border-destructive ring-1 ring-destructive/30" : "border-border"} text-foreground placeholder:text-muted/60 pl-8 text-lg font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all`}
                        />
                    </div>
                    {errors.price && (
                        <p className="text-xs text-destructive font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">error</span>
                            {errors.price}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <Label className="text-sm font-semibold text-foreground">
                        Price Unit <span className="text-destructive">*</span>
                    </Label>
                    <Select
                        value={data.priceUnit}
                        onValueChange={(value) => onChange({ ...data, priceUnit: value })}
                    >
                        <SelectTrigger
                            className={`h-12 rounded-xl bg-card w-full border ${errors.priceUnit ? "border-destructive" : "border-border"} focus:border-primary`}
                        >
                            <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border rounded-xl">
                            {priceUnits.map((unit) => (
                                <SelectItem key={unit.value} value={unit.value} className="rounded-lg">
                                    {unit.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.priceUnit && (
                        <p className="text-xs text-destructive font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">error</span>
                            {errors.priceUnit}
                        </p>
                    )}
                </div>
            </div>

            {/* Service Location */}
            <div className="flex flex-col gap-3">
                <Label className="text-sm font-semibold text-foreground">Service Location</Label>

                {displayLat && displayLng ? (
                    <div className="flex items-center gap-2 px-4 py-3 bg-success/10 border border-success/20 rounded-xl">
                        <span className="material-symbols-outlined text-success text-lg">location_on</span>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-success">Location Set</p>
                            <p className="text-xs text-muted font-mono">
                                {displayLat.toFixed(6)}, {displayLng.toFixed(6)}
                            </p>
                        </div>
                        {!hasLocation && (
                            <span className="text-[10px] px-2 py-1 bg-navy/10 text-navy font-bold rounded-md uppercase">
                                From Profile
                            </span>
                        )}
                    </div>
                ) : null}

                <div className="flex gap-3">
                    {defaultLat && defaultLng && !hasLocation && (
                        <button
                            type="button"
                            onClick={useDefaultLocation}
                            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border border-border bg-card text-foreground font-medium text-sm hover:bg-primary/5 hover:border-primary/30 active:scale-[0.98] transition-all"
                        >
                            <span className="material-symbols-outlined text-lg">home</span>
                            <span>Use Profile Location</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={fetchServiceLocation}
                        disabled={isFetchingLocation}
                        className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border border-navy/30 bg-navy/5 text-navy font-medium text-sm hover:bg-navy/10 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {isFetchingLocation ? (
                            <div className="size-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
                        ) : (
                            <span className="material-symbols-outlined text-lg">my_location</span>
                        )}
                        <span>Current Location</span>
                    </button>
                </div>
            </div>

            {/* Service Radius */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-foreground">Service Radius</Label>
                    <span className="text-sm font-bold text-primary">{data.serviceRadius} km</span>
                </div>
                <Slider
                    value={[data.serviceRadius]}
                    onValueChange={(value) => onChange({ ...data, serviceRadius: value[0] })}
                    min={5}
                    max={50}
                    step={1}
                    className="w-full"
                />
                <div className="flex justify-between text-xs text-muted">
                    <span>5 km</span>
                    <span>50 km</span>
                </div>
            </div>

            {/* Service Images */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-foreground">Service Images</Label>
                    <span className="text-xs text-muted font-medium">
                        {data.images.length} uploaded
                    </span>
                </div>

                <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageAdd}
                    className="hidden"
                />

                <div className="grid grid-cols-3 gap-3">
                    {/* Uploaded Images */}
                    {data.images.map((img) => (
                        <div
                            key={img.id}
                            className="relative aspect-square rounded-xl overflow-hidden border border-border group"
                        >
                            <Image
                                src={img.preview}
                                alt="Service"
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => removeImage(img.id)}
                                    className="size-9 rounded-full bg-destructive/80 backdrop-blur-md flex items-center justify-center text-white hover:bg-destructive transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Add Image Button */}
                    <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1.5 hover:border-primary hover:bg-primary/5 transition-all group bg-card"
                    >
                        <span className="material-symbols-outlined text-2xl text-muted group-hover:text-primary transition-colors">
                            add_photo_alternate
                        </span>
                        <span className="text-[11px] font-semibold text-muted group-hover:text-primary transition-colors">
                            Add Photo
                        </span>
                    </button>
                </div>
                {errors.images && (
                    <p className="text-xs text-destructive font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">error</span>
                        {errors.images}
                    </p>
                )}
                <p className="text-[11px] text-muted">
                    Add photos of your equipment, machinery, or work samples. Max 5MB each.
                </p>
            </div>
        </div>
    )
}
