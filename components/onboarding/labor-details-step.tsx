"use client"

import { useRef } from "react"
import Image from "next/image"
import { Label } from "@/components/ui/label"

export interface LaborDetailsData {
    skills: string
    dailyWage: string
    isMigrant: boolean
    skillCardPhoto: File | null
    skillCardPhotoPreview: string
}

interface LaborDetailsStepProps {
    data: LaborDetailsData
    onChange: (data: LaborDetailsData) => void
    errors: Record<string, string>
}

const commonSkills = [
    "Mason",
    "Helper",
    "Harvester",
    "Plumber",
    "Painter",
    "Welder",
    "Carpenter",
    "Electrician",
]

/**
 * Compress an image file using Canvas API.
 */
const compressImage = (file: File, maxSize = 1200, quality = 0.7): Promise<File> => {
    return new Promise((resolve, reject) => {
        const img = new window.Image()
        img.onload = () => {
            let { width, height } = img
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

export function LaborDetailsStep({ data, onChange, errors }: LaborDetailsStepProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const selectedSkills = data.skills
        ? data.skills.split(",").map((s) => s.trim()).filter(Boolean)
        : []

    const toggleSkill = (skill: string) => {
        const updated = selectedSkills.includes(skill)
            ? selectedSkills.filter((s) => s !== skill)
            : [...selectedSkills, skill]
        onChange({ ...data, skills: updated.join(", ") })
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith("image/")) return
        if (file.size > 10 * 1024 * 1024) return

        const compressed = await compressImage(file)
        const previewUrl = URL.createObjectURL(compressed)

        if (data.skillCardPhotoPreview) URL.revokeObjectURL(data.skillCardPhotoPreview)
        onChange({ ...data, skillCardPhoto: compressed, skillCardPhotoPreview: previewUrl })
    }

    const removeFile = () => {
        if (data.skillCardPhotoPreview) URL.revokeObjectURL(data.skillCardPhotoPreview)
        onChange({ ...data, skillCardPhoto: null, skillCardPhotoPreview: "" })
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Section Header */}
            <div>
                <h2 className="text-xl font-bold text-navy lg:text-2xl">Labor Details</h2>
                <p className="text-sm text-muted mt-1">Tell us about your skills and work preferences</p>
            </div>

            {/* Skills Selection */}
            <div className="flex flex-col gap-3">
                <Label className="text-sm font-semibold text-foreground">
                    Your Skills <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted -mt-1">Select all skills that apply</p>
                <div className="flex flex-wrap gap-2">
                    {commonSkills.map((skill) => {
                        const isSelected = selectedSkills.includes(skill)
                        return (
                            <button
                                key={skill}
                                type="button"
                                onClick={() => toggleSkill(skill)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all active:scale-[0.97] ${isSelected
                                    ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10"
                                    : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-primary/[0.02]"
                                    }`}
                            >
                                {isSelected && (
                                    <span className="material-symbols-outlined text-sm mr-1 align-middle">check</span>
                                )}
                                {skill}
                            </button>
                        )
                    })}
                </div>
                {errors.skills && (
                    <p className="text-xs text-destructive font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">error</span>
                        {errors.skills}
                    </p>
                )}
            </div>

            {/* Daily Wage Estimate */}
            <div className="flex flex-col gap-2">
                <Label className="text-sm font-semibold text-foreground">
                    Daily Wage Estimate (₹) <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-semibold">₹</span>
                    <input
                        type="number"
                        inputMode="numeric"
                        placeholder="e.g. 500"
                        value={data.dailyWage}
                        onChange={(e) => onChange({ ...data, dailyWage: e.target.value })}
                        className={`w-full h-12 pl-9 pr-4 rounded-xl border-2 bg-card text-foreground text-sm font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 ${errors.dailyWage ? "border-destructive" : "border-border"
                            }`}
                    />
                </div>
                {errors.dailyWage && (
                    <p className="text-xs text-destructive font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">error</span>
                        {errors.dailyWage}
                    </p>
                )}
                <p className="text-[11px] text-muted">Estimated daily earnings to display on your profile</p>
            </div>

            {/* Migrant Worker Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl border-2 border-border bg-card">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-navy/5 flex items-center justify-center text-navy">
                        <span className="material-symbols-outlined">travel_explore</span>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">Migrant Worker</p>
                        <p className="text-xs text-muted">Do you travel to different areas for work?</p>
                    </div>
                </div>
                <button
                    type="button"
                    role="switch"
                    aria-checked={data.isMigrant}
                    onClick={() => onChange({ ...data, isMigrant: !data.isMigrant })}
                    className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${data.isMigrant ? "bg-primary" : "bg-muted/30"
                        }`}
                >
                    <span
                        className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow-md transition-transform ${data.isMigrant ? "translate-x-5" : "translate-x-0"
                            }`}
                    />
                </button>
            </div>

            {/* Skill Card Photo (Optional) */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-foreground">
                        Skill Card Photo
                    </Label>
                    <span className="px-2 py-1 bg-muted/10 text-muted text-[10px] font-bold uppercase tracking-wider rounded-md">
                        Optional
                    </span>
                </div>
                <p className="text-sm text-muted font-medium -mt-1">
                    Upload a photo of your skill/training certificate if available
                </p>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />

                {data.skillCardPhotoPreview ? (
                    <div className="relative aspect-[3/2] max-w-xs rounded-xl overflow-hidden border-2 border-primary/30 group">
                        <Image
                            src={data.skillCardPhotoPreview}
                            alt="Skill Card"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="size-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button
                                type="button"
                                onClick={removeFile}
                                className="size-9 rounded-full bg-destructive/80 backdrop-blur-md flex items-center justify-center text-white hover:bg-destructive transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                        </div>
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-md">
                            <span className="text-[10px] font-bold text-white uppercase">Skill Card</span>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-[3/2] max-w-xs rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-xl">add_a_photo</span>
                        </div>
                        <span className="text-xs font-semibold text-muted group-hover:text-primary transition-colors">
                            Upload Skill Card
                        </span>
                    </button>
                )}
                <p className="text-[11px] text-muted">Accepted: JPG, PNG. Max size: 5MB.</p>
            </div>
        </div>
    )
}
