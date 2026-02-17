"use client"

import Link from "next/link"

interface VerificationStepProps {
    serviceName: string
    category: string
    price: string
    priceUnit: string
    businessName: string
}

const priceUnitLabels: Record<string, string> = {
    HOUR: "Per Hour",
    DAY: "Per Day",
    KM: "Per Kilometer",
    ACRE: "Per Acre",
    FIXED: "Fixed Price",
}

export function VerificationStep({
    serviceName,
    category,
    price,
    priceUnit,
    businessName,
}: VerificationStepProps) {
    return (
        <div className="flex flex-col items-center gap-6 py-4">
            {/* Animated Success Icon */}
            <div className="relative">
                <div className="size-28 rounded-full bg-primary/10 flex items-center justify-center animate-in zoom-in duration-500">
                    <div className="size-20 rounded-full bg-primary/20 flex items-center justify-center">
                        <span
                            className="material-symbols-outlined text-primary text-5xl"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                            verified
                        </span>
                    </div>
                </div>
                {/* Decorative rings */}
                <div className="absolute inset-0 rounded-full border-2 border-primary/10 animate-ping" style={{ animationDuration: "3s" }} />
            </div>

            {/* Title & Message */}
            <div className="text-center max-w-sm">
                <h2 className="text-2xl font-bold text-navy lg:text-3xl">Under Verification</h2>
                <p className="text-muted text-sm mt-2 leading-relaxed">
                    Your profile and services have been submitted for review. Our team will verify your
                    details within <strong className="text-foreground">24-48 hours</strong>.
                </p>
            </div>

            {/* Status Timeline */}
            <div className="w-full max-w-sm bg-card rounded-2xl border border-border p-5">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-success flex items-center justify-center text-white shrink-0">
                            <span className="material-symbols-outlined text-base">check</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-foreground">Profile Submitted</p>
                            <p className="text-xs text-muted">Personal info & KYC uploaded</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-success flex items-center justify-center text-white shrink-0">
                            <span className="material-symbols-outlined text-base">check</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-foreground">Service Listed</p>
                            <p className="text-xs text-muted">Your service is saved and queued</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <div className="size-3 rounded-full bg-primary animate-pulse" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-primary">Verification In Progress</p>
                            <p className="text-xs text-muted">Our team is reviewing your details</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 opacity-40">
                        <div className="size-8 rounded-full bg-muted/20 flex items-center justify-center text-muted shrink-0">
                            <span className="material-symbols-outlined text-base">schedule</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-muted">Go Live</p>
                            <p className="text-xs text-muted">Start receiving bookings</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Submission Summary Card */}
            <div className="w-full max-w-sm bg-navy/5 rounded-2xl border border-navy/10 p-5">
                <h3 className="text-sm font-bold text-navy uppercase tracking-wider mb-3">
                    Submission Summary
                </h3>
                <div className="flex flex-col gap-2.5">
                    {businessName && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted">Business</span>
                            <span className="text-sm font-semibold text-foreground">{businessName}</span>
                        </div>
                    )}
                    {serviceName && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted">Service</span>
                            <span className="text-sm font-semibold text-foreground">{serviceName}</span>
                        </div>
                    )}
                    {category && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted">Category</span>
                            <span className="text-sm font-semibold text-foreground capitalize">
                                {category.replace(/-/g, " ")}
                            </span>
                        </div>
                    )}
                    {price && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted">Price</span>
                            <span className="text-sm font-bold text-primary">
                                ₹{price} {priceUnitLabels[priceUnit] || priceUnit}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Info Note */}
            <div className="w-full max-w-sm flex items-start gap-3 p-4 bg-primary/5 border border-primary/10 rounded-xl">
                <span className="material-symbols-outlined text-primary text-xl mt-0.5">
                    notifications_active
                </span>
                <p className="text-xs text-muted leading-relaxed">
                    You&apos;ll receive a notification once your profile is verified. After verification, your
                    services will be visible to farmers in your area.
                </p>
            </div>

            {/* Action Button */}
            <Link
                href="/partner"
                className="w-full max-w-sm h-14 bg-navy hover:bg-navy/90 text-white rounded-2xl text-base font-bold tracking-wide shadow-lg shadow-navy/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
            >
                <span>Go to Dashboard</span>
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                    arrow_forward
                </span>
            </Link>
        </div>
    )
}
