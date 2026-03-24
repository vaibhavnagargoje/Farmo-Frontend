"use client"

import { useRef } from "react"
import Image from "next/image"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/language-context"

export interface KYCDetailsData {
    partnerType: string
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

export function KYCDetailsStep({ data, onChange, errors }: KYCDetailsStepProps) {
    const { t } = useLanguage()

    const partnerTypes = [
        {
            value: "LABOR",
            label: t("onboarding.step2.type_labor"),
            icon: "engineering",
            description: t("onboarding.step2.desc_labor"),
        },
        {
            value: "MACHINERY",
            label: t("onboarding.step2.type_machinery"),
            icon: "agriculture",
            description: t("onboarding.step2.desc_machinery"),
        },
        {
            value: "TRANSPORT",
            label: t("onboarding.step2.type_transport"),
            icon: "local_shipping",
            description: t("onboarding.step2.desc_transport"),
        },
    ]

    const frontInputRef = useRef<HTMLInputElement>(null)
    const backInputRef = useRef<HTMLInputElement>(null)

    const handlePartnerType = (value: string) => {
        onChange({ ...data, partnerType: value })
    }

    /**
     * Compress an image file using Canvas API.
     * Resizes to max 1200px and re-encodes as JPEG at 70% quality.
     * This keeps each file well under ~500KB, preventing Vercel's 4.5MB body limit.
     */
    const compressImage = (file: File, maxSize = 1200, quality = 0.7): Promise<File> => {
        return new Promise((resolve, reject) => {
            const img = new window.Image()
            img.onload = () => {
                let { width, height } = img
                // Scale down if needed, preserving aspect ratio
                if (width > maxSize || height > maxSize) {
                    if (width > height) {
                        height = Math.round((height * maxSize) / width)
                        width = maxSize
                    } else {
                        width = Math.round((width * maxSize) / height)
                        height = maxSize
                    }
                }
                const canvas = document.createElement("canvas")
                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext("2d")
                if (!ctx) { resolve(file); return }
                ctx.drawImage(img, 0, 0, width, height)
                canvas.toBlob(
                    (blob) => {
                        if (!blob) { resolve(file); return }
                        const compressed = new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
                            type: "image/jpeg",
                            lastModified: Date.now(),
                        })
                        resolve(compressed)
                    },
                    "image/jpeg",
                    quality
                )
            }
            img.onerror = () => reject(new Error("Failed to load image"))
            img.src = URL.createObjectURL(file)
        })
    }

    const handleFileChange = async (
        side: "front" | "back",
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith("image/")) return

        // Validate file size (max 10MB raw — will be compressed)
        if (file.size > 10 * 1024 * 1024) return

        // Compress image to stay under Vercel's 4.5MB body limit
        const compressed = await compressImage(file)
        const previewUrl = URL.createObjectURL(compressed)

        if (side === "front") {
            if (data.aadharFrontPreview) URL.revokeObjectURL(data.aadharFrontPreview)
            onChange({ ...data, aadharFront: compressed, aadharFrontPreview: previewUrl })
        } else {
            if (data.aadharBackPreview) URL.revokeObjectURL(data.aadharBackPreview)
            onChange({ ...data, aadharBack: compressed, aadharBackPreview: previewUrl })
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
                <h2 className="text-xl font-bold text-navy lg:text-2xl">{t("onboarding.step2.title")}</h2>
                <p className="text-sm text-muted mt-1">{t("onboarding.step2.desc")}</p>
            </div>

            {/* Partner Type Selection */}
            <div className="flex flex-col gap-3">
                <Label className="text-sm font-semibold text-foreground">
                    {t("onboarding.step2.partner_type")} <span className="text-destructive">*</span>
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


            {/* KYC Document Uploads */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-foreground">
                        {t("onboarding.step2.kyc_docs")} <span className="text-destructive">*</span>
                    </Label>
                    <span className="px-2 py-1 bg-success/10 text-success text-[10px] font-bold uppercase tracking-wider rounded-md">
                        {t("onboarding.step2.required")}
                    </span>
                </div>
                <p className="text-sm text-muted font-medium -mt-1">
                    {t("onboarding.step2.upload_aadhar")}
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
                                    <span className="text-[10px] font-bold text-white uppercase">{t("onboarding.step2.front")}</span>
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
                                    {t("onboarding.step2.front_side")}
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
                                    <span className="text-[10px] font-bold text-white uppercase">{t("onboarding.step2.back")}</span>
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
                                    {t("onboarding.step2.back_side")}
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
                <p className="text-[11px] text-muted">{t("onboarding.step2.accepted_files")}</p>
            </div>
        </div>
    )
}
