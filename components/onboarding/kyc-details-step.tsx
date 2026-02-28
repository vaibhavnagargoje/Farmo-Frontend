"use client"

import { useRef } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface KYCDetailsData {
    partnerType: string
    businessName: string
    aadharFront: File | null
    aadharFrontPreview: string
    aadharBack: File | null
    aadharBackPreview: string
}

interface KYCDetailsStepProps {
    data: KYCDetailsData
    onChange: (data: KYCDetailsData) => void
    errors: Record<string, string>
}

const partnerTypes = [
    {
        value: "LABOR",
        label: "Manual Worker",
        icon: "engineering",
        description: "Skilled & unskilled farm labor",
    },
    {
        value: "MACHINERY",
        label: "Machinery Owner",
        icon: "agriculture",
        description: "Tractor, harvester, rotavator",
    },
    {
        value: "TRANSPORT",
        label: "Transporter",
        icon: "local_shipping",
        description: "Tempo, truck, goods transport",
    },
    {
        value: "AGENCY",
        label: "Agency",
        icon: "business",
        description: "Multiple services provider",
    },
]

export function KYCDetailsStep({ data, onChange, errors }: KYCDetailsStepProps) {
    const frontInputRef = useRef<HTMLInputElement>(null)
    const backInputRef = useRef<HTMLInputElement>(null)

    const handlePartnerType = (value: string) => {
        onChange({ ...data, partnerType: value })
    }

    const handleFileChange = (
        side: "front" | "back",
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith("image/")) return

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) return

        const previewUrl = URL.createObjectURL(file)

        if (side === "front") {
            // Revoke previous URL to prevent memory leaks
            if (data.aadharFrontPreview) URL.revokeObjectURL(data.aadharFrontPreview)
            onChange({ ...data, aadharFront: file, aadharFrontPreview: previewUrl })
        } else {
            if (data.aadharBackPreview) URL.revokeObjectURL(data.aadharBackPreview)
            onChange({ ...data, aadharBack: file, aadharBackPreview: previewUrl })
        }
    }

    const removeFile = (side: "front" | "back") => {
        if (side === "front") {
            if (data.aadharFrontPreview) URL.revokeObjectURL(data.aadharFrontPreview)
            onChange({ ...data, aadharFront: null, aadharFrontPreview: "" })
        } else {
            if (data.aadharBackPreview) URL.revokeObjectURL(data.aadharBackPreview)
            onChange({ ...data, aadharBack: null, aadharBackPreview: "" })
        }
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Section Header */}
            <div>
                <h2 className="text-xl font-bold text-navy lg:text-2xl">KYC & Business Details</h2>
                <p className="text-sm text-muted mt-1">Help us verify your identity and classify your services</p>
            </div>

            {/* Partner Type Selection */}
            <div className="flex flex-col gap-3">
                <Label className="text-sm font-semibold text-foreground">
                    What type of partner are you? <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-3">
                    {partnerTypes.map((type) => (
                        <button
                            key={type.value}
                            type="button"
                            onClick={() => handlePartnerType(type.value)}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all active:scale-[0.97] ${data.partnerType === type.value
                                    ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                                    : "border-border bg-card hover:border-primary/30 hover:bg-primary/[0.02]"
                                }`}
                        >
                            <div
                                className={`size-12 rounded-xl flex items-center justify-center transition-colors ${data.partnerType === type.value
                                        ? "bg-primary text-white"
                                        : "bg-navy/5 text-navy"
                                    }`}
                            >
                                <span className="material-symbols-outlined text-2xl">{type.icon}</span>
                            </div>
                            <div className="text-center">
                                <p
                                    className={`text-sm font-bold ${data.partnerType === type.value ? "text-primary" : "text-foreground"
                                        }`}
                                >
                                    {type.label}
                                </p>
                                <p className="text-[11px] text-muted leading-tight mt-0.5">{type.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
                {errors.partnerType && (
                    <p className="text-xs text-destructive font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">error</span>
                        {errors.partnerType}
                    </p>
                )}
            </div>

            {/* Business Name */}
            <div className="flex flex-col gap-2">
                <Label htmlFor="businessName" className="text-sm font-semibold text-foreground">
                    Business / Display Name <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="businessName"
                    placeholder="e.g. Rajesh Tractor Services"
                    value={data.businessName}
                    onChange={(e) => onChange({ ...data, businessName: e.target.value })}
                    className={`h-12 rounded-xl bg-card border ${errors.businessName ? "border-destructive ring-1 ring-destructive/30" : "border-border"} text-foreground placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all`}
                />
                {errors.businessName && (
                    <p className="text-xs text-destructive font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">error</span>
                        {errors.businessName}
                    </p>
                )}
            </div>

            {/* KYC Document Uploads */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-foreground">
                        KYC Documents <span className="text-destructive">*</span>
                    </Label>
                    <span className="px-2 py-1 bg-success/10 text-success text-[10px] font-bold uppercase tracking-wider rounded-md">
                        Required
                    </span>
                </div>
                <p className="text-sm text-muted font-medium -mt-1">
                    Upload your Aadhar Card (front & back)
                </p>

                <div className="grid grid-cols-2 gap-4">
                    {/* Front Side */}
                    <div className="flex flex-col gap-2">
                        <input
                            ref={frontInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange("front", e)}
                            className="hidden"
                        />
                        {data.aadharFrontPreview ? (
                            <div className="relative aspect-[3/2] rounded-xl overflow-hidden border-2 border-primary/30 group">
                                <Image
                                    src={data.aadharFrontPreview}
                                    alt="Aadhar Front"
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => frontInputRef.current?.click()}
                                        className="size-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-lg">edit</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeFile("front")}
                                        className="size-9 rounded-full bg-destructive/80 backdrop-blur-md flex items-center justify-center text-white hover:bg-destructive transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                </div>
                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-md">
                                    <span className="text-[10px] font-bold text-white uppercase">Front</span>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => frontInputRef.current?.click()}
                                className={`aspect-[3/2] rounded-xl border-2 border-dashed ${errors.aadharFront ? "border-destructive bg-destructive/5" : "border-border"} flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all group`}
                            >
                                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-xl">add_a_photo</span>
                                </div>
                                <span className="text-xs font-semibold text-muted group-hover:text-primary transition-colors">
                                    Front Side
                                </span>
                            </button>
                        )}
                    </div>

                    {/* Back Side */}
                    <div className="flex flex-col gap-2">
                        <input
                            ref={backInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange("back", e)}
                            className="hidden"
                        />
                        {data.aadharBackPreview ? (
                            <div className="relative aspect-[3/2] rounded-xl overflow-hidden border-2 border-primary/30 group">
                                <Image
                                    src={data.aadharBackPreview}
                                    alt="Aadhar Back"
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => backInputRef.current?.click()}
                                        className="size-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-lg">edit</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeFile("back")}
                                        className="size-9 rounded-full bg-destructive/80 backdrop-blur-md flex items-center justify-center text-white hover:bg-destructive transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                </div>
                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-md">
                                    <span className="text-[10px] font-bold text-white uppercase">Back</span>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => backInputRef.current?.click()}
                                className={`aspect-[3/2] rounded-xl border-2 border-dashed ${errors.aadharBack ? "border-destructive bg-destructive/5" : "border-border"} flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all group`}
                            >
                                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-xl">add_a_photo</span>
                                </div>
                                <span className="text-xs font-semibold text-muted group-hover:text-primary transition-colors">
                                    Back Side
                                </span>
                            </button>
                        )}
                    </div>
                </div>
                {(errors.aadharFront || errors.aadharBack) && (
                    <p className="text-xs text-destructive font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">error</span>
                        {errors.aadharFront || errors.aadharBack}
                    </p>
                )}
                <p className="text-[11px] text-muted">Accepted: JPG, PNG. Max size: 5MB each.</p>
            </div>
        </div>
    )
}
