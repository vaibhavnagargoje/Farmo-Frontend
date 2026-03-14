"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import type { Category } from "@/lib/api"

// Map category slugs to available images
const categoryImages: Record<string, string> = {
    tractor: "/red-farm-tractor-in-field.jpg",
    tractors: "/red-farm-tractor-in-field.jpg",
    ploughing: "/soil-cultivator-farm-implement.jpg",
    cultivator: "/soil-cultivator-farm-implement.jpg",
    rotavator: "/soil-cultivator-farm-implement.jpg",
    harvesting: "/green-combine-harvester-wheat-field.jpg",
    harvester: "/green-combine-harvester-wheat-field.jpg",
    spraying: "/agricultural-sprayer-machinery.jpg",
    sprayer: "/agricultural-sprayer-machinery.jpg",
    transport: "/mahindra-red-tractor-side-profile.jpg",
    excavator: "/yellow-cat-excavator-construction.jpg",
    construction: "/yellow-cat-excavator-construction.jpg",
}

function getCategoryImage(slug: string): string {
    const key = Object.keys(categoryImages).find((k) =>
        slug.toLowerCase().includes(k)
    )
    return key ? categoryImages[key] : "/red-mahindra-tractor.jpg"
}

interface ServiceTabsProps {
    categories: Category[]
}

export function ServiceTabs({ categories }: ServiceTabsProps) {
    const [activeTab, setActiveTab] = useState<"equipment" | "labors">("equipment")

    return (
        <>
            {/* Service Type Tabs */}
            <div className="px-4 lg:px-6 pt-3 lg:pt-6 pb-3 lg:pb-5">
                <div className="flex gap-0 bg-card rounded-md border border-border overflow-hidden w-fit">
                    <button
                        onClick={() => setActiveTab("equipment")}
                        className={`px-5 lg:px-8 flex items-center gap-2 py-2.5 text-sm font-semibold transition-all ${activeTab === "equipment"
                            ? "bg-navy text-white"
                            : "bg-card text-muted-foreground hover:bg-muted/30"
                            }`}
                    >
                        <span className="material-symbols-outlined text-[18px]">agriculture</span>
                        Equipment
                    </button>
                    <button
                        onClick={() => setActiveTab("labors")}
                        className={`px-5 lg:px-8 flex items-center gap-2 py-2.5 text-sm font-semibold border-l border-border transition-all ${activeTab === "labors"
                            ? "bg-navy text-white"
                            : "bg-card text-muted-foreground hover:bg-muted/30"
                            }`}
                    >
                        <span className="material-symbols-outlined text-[18px]">engineering</span>
                        Labors
                    </button>
                </div>
            </div>

            {/* Equipment Content */}
            {activeTab === "equipment" && (
                <>
                    {/* Section Header */}
                    <div className="flex items-center justify-between px-4 lg:px-6 pb-4">
                        <h2 className="text-base lg:text-xl font-bold text-foreground">All Categories</h2>
                    </div>

                    {/* Equipment Categories Grid */}
                    <section className="pb-6">
                        {categories.length > 0 ? (
                            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 lg:gap-6 px-4 lg:px-6 pb-2">
                                {categories.slice(0, 9).map((category) => {
                                    const image = getCategoryImage(category.slug)
                                    return (
                                        <Link
                                            key={category.id}
                                            href={`/category/${category.slug}`}
                                            className="group flex flex-col overflow-hidden rounded-md bg-card border border-border shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                                        >
                                            <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted/20">
                                                <Image
                                                    src={category.icon || image}
                                                    alt={category.name}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            </div>
                                            <div className="px-2 py-2.5 lg:px-4 lg:py-3 flex flex-col justify-center items-center">
                                                <h3 className="text-foreground text-[12px] md:text-sm font-semibold leading-tight text-center w-full">
                                                    {category.name}
                                                </h3>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 lg:gap-6 px-4 lg:px-6 pb-2">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="rounded-md overflow-hidden bg-card border border-border animate-pulse">
                                        <div className="w-full aspect-[4/3] bg-muted/30" />
                                        <div className="px-3 py-2.5 lg:px-4 lg:py-3">
                                            <div className="h-4 bg-muted/30 rounded w-3/4 mx-auto" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div className="flex items-center justify-center mt-6">
                            <Link href="/categories" className="px-8 py-2.5 rounded-lg border border-border text-sm font-bold text-foreground hover:bg-muted/50 transition-colors shadow-sm">
                                View All
                            </Link>
                        </div>
                    </section>

                    {/* How It Works */}
                    <section className="px-4 lg:px-6 pb-6 lg:pb-10">
                        <div className="bg-card border border-border rounded-md px-4 py-4 lg:px-6">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">How It Works</h3>
                            <div className="grid grid-cols-3 gap-4 lg:gap-8">
                                {[
                                    { icon: "search", title: "Browse", desc: "Find equipment near you" },
                                    { icon: "calendar_month", title: "Book", desc: "Select date & confirm" },
                                    { icon: "check_circle", title: "Get Service", desc: "Equipment at your farm" },
                                ].map((step, i) => (
                                    <div key={i} className="flex flex-col items-center text-center gap-1.5">
                                        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-primary text-[20px]">{step.icon}</span>
                                        </div>
                                        <p className="text-xs font-semibold text-foreground">{step.title}</p>
                                        <p className="text-[10px] lg:text-xs text-muted-foreground leading-tight hidden sm:block">{step.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </>
            )}

            {/* Labors Content — Coming Soon */}
            {activeTab === "labors" && (
                <section className="px-4 lg:px-6 pb-6">
                    <div className="flex flex-col items-center justify-center py-20 lg:py-32">
                        {/* Icon */}
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                            <span className="material-symbols-outlined text-primary text-[40px]">engineering</span>
                        </div>

                        {/* Badge */}
                        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider mb-4">
                            Coming Soon
                        </span>

                        {/* Text */}
                        <h2 className="text-xl lg:text-2xl font-bold text-foreground text-center mb-2">
                            Hire Farm Workers
                        </h2>
                        <p className="text-sm text-muted-foreground text-center max-w-sm leading-relaxed">
                            Book skilled farm laborers for planting, harvesting, weeding, and more.
                            We&apos;re working hard to bring this to you.
                        </p>

                        {/* Notify Button */}
                        <button className="mt-6 px-6 py-2.5 bg-navy text-white text-sm font-semibold rounded-md hover:bg-navy/90 transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">notifications</span>
                            Notify Me
                        </button>
                    </div>
                </section>
            )}
        </>
    )
}
