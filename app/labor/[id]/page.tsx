"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { BottomNav } from "@/components/bottom-nav"
import { DesktopHeader } from "@/components/desktop-header"
import { MobileHeader } from "@/components/mobile-header"

interface LaborProfile {
    id: number
    user_phone: string
    full_name: string
    partner_type: string
    about: string
    is_available: boolean
    rating: string
    jobs_completed: number
    created_at: string
    labor_details?: {
        skills: string
        daily_wage_estimate: string
        is_migrant_worker: boolean
        skill_card_photo: string | null
    }
}

export default function LaborDetailPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [labor, setLabor] = useState<LaborProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchLabor = async () => {
            try {
                const res = await fetch(`/api/partner/${id}`)
                if (res.ok) {
                    const data = await res.json()
                    setLabor(data)
                } else {
                    setError("Worker not found")
                }
            } catch {
                setError("Failed to load")
            } finally {
                setIsLoading(false)
            }
        }
        if (id) fetchLabor()
    }, [id])

    const skills = labor?.labor_details?.skills?.split(",").map(s => s.trim()).filter(Boolean) || []
    const statusInfo = labor?.is_available
        ? { color: "bg-green-500", label: "Online", textColor: "text-green-700", bgColor: "bg-green-50", ringColor: "ring-green-500/20" }
        : { color: "bg-gray-400", label: "Offline", textColor: "text-gray-600", bgColor: "bg-gray-50", ringColor: "ring-gray-400/20" }

    return (
        <div className="relative min-h-screen flex flex-col pb-24 lg:pb-0 bg-background">
            <DesktopHeader variant="farmer" />
            <MobileHeader />

            <main className="flex-1 max-w-2xl mx-auto w-full px-4 lg:px-6 py-4">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="size-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground shadow-sm active:scale-95 transition-transform mb-4"
                >
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                </button>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : error || !labor ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-red-500 text-[32px]">error</span>
                        </div>
                        <h2 className="text-lg font-bold text-foreground mb-1">{error || "Not Found"}</h2>
                        <p className="text-sm text-muted-foreground mb-4">This worker profile could not be loaded.</p>
                        <Link href="/" className="px-5 py-2.5 bg-navy text-white text-sm font-semibold rounded-xl">Go Home</Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* ── Profile Header Card ── */}
                        <div className="bg-card rounded-2xl border border-border p-5 lg:p-6">
                            <div className="flex items-start gap-4">
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    <div className="w-16 h-16 rounded-2xl bg-navy/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-navy text-3xl">person</span>
                                    </div>
                                    <div className={`absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full border-[2.5px] border-card ${statusInfo.color} ring-4 ${statusInfo.ringColor}`} />
                                </div>
                                {/* Name + Status */}
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-xl font-bold text-foreground">{labor.full_name}</h1>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                                            {statusInfo.label}
                                        </span>
                                        <span className="text-xs text-muted-foreground">Manual Worker</span>
                                    </div>
                                    {/* Rating + Jobs */}
                                    <div className="flex items-center gap-3 mt-2">
                                        {parseFloat(labor.rating) > 0 && (
                                            <div className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-amber-500 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                <span className="text-sm font-bold text-foreground">{parseFloat(labor.rating).toFixed(1)}</span>
                                            </div>
                                        )}
                                        {labor.jobs_completed > 0 && (
                                            <span className="text-xs text-muted-foreground">{labor.jobs_completed} job{labor.jobs_completed !== 1 ? "s" : ""} done</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {labor.about && (
                                <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{labor.about}</p>
                            )}
                        </div>

                        {/* ── Skills & Details Card ── */}
                        {labor.labor_details && (
                            <div className="bg-card rounded-2xl border border-border p-5 lg:p-6 space-y-4">
                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-[18px]">handyman</span>
                                    Skills & Details
                                </h3>

                                {/* Skills */}
                                {skills.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground mb-2">Skills</p>
                                        <div className="flex flex-wrap gap-2">
                                            {skills.map((skill, i) => (
                                                <span key={i} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Wage + Migrant */}
                                <div className="grid grid-cols-2 gap-3">
                                    {labor.labor_details.daily_wage_estimate && (
                                        <div className="bg-background rounded-xl p-3 border border-border/50">
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Daily Wage</p>
                                            <p className="text-lg font-bold text-foreground">
                                                ₹{Number(labor.labor_details.daily_wage_estimate).toLocaleString("en-IN")}
                                                <span className="text-xs font-medium text-muted-foreground ml-1">/day</span>
                                            </p>
                                        </div>
                                    )}
                                    <div className="bg-background rounded-xl p-3 border border-border/50">
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Migrant Worker</p>
                                        <p className="text-lg font-bold text-foreground">
                                            {labor.labor_details.is_migrant_worker ? "Yes" : "No"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Call Button (sticky on mobile) ── */}
                        <div className="bg-card rounded-2xl border border-border p-5 lg:p-6">
                            <a
                                href={`tel:${labor.user_phone}`}
                                className="w-full h-14 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-base flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] transition-all"
                            >
                                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
                                Call {labor.full_name.split(" ")[0]}
                            </a>
                        </div>
                    </div>
                )}
            </main>

            <BottomNav variant="farmer" />
        </div>
    )
}
