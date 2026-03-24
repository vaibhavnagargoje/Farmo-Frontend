"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import type { Category } from "@/lib/api"
import { LaborListingSection } from "@/components/labor-listing-section"
import { useLanguage } from "@/contexts/language-context"

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
    const { t, lang } = useLanguage()

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
                        {t("tabs.equipment")}
                    </button>
                    <button
                        onClick={() => setActiveTab("labors")}
                        className={`px-5 lg:px-8 flex items-center gap-2 py-2.5 text-sm font-semibold border-l border-border transition-all ${activeTab === "labors"
                            ? "bg-navy text-white"
                            : "bg-card text-muted-foreground hover:bg-muted/30"
                            }`}
                    >
                        <span className="material-symbols-outlined text-[18px]">engineering</span>
                        {t("tabs.labors")}
                    </button>
                </div>
            </div>

            {/* Equipment Content */}
            {activeTab === "equipment" && (
                <>
                    {/* Section Header */}
                    <div className="flex items-center justify-between px-4 lg:px-6 pb-4">
                        <h2 className="text-base lg:text-xl font-bold text-foreground">{t("tabs.all_categories")}</h2>
                    </div>

                    {/* Equipment Categories Grid */}
                    <section className="pb-6">
                        {categories.length > 0 ? (
                            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 lg:gap-6 px-4 lg:px-6 pb-2">
                                {categories.slice(0, 9).map((category) => {
                                    const image = getCategoryImage(category.slug)
                                    const displayName = category.name_translations?.[lang] || category.name
                                    return (
                                        <Link
                                            key={category.id}
                                            href={`/category/${category.slug}`}
                                            className="group flex flex-col overflow-hidden rounded-md bg-card border border-border shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                                        >
                                            <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted/20">
                                                <Image
                                                    src={category.icon || image}
                                                    alt={displayName}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            </div>
                                            <div className="px-2 py-2.5 lg:px-4 lg:py-3 flex flex-col justify-center items-center">
                                                <h3 className="text-foreground text-[12px] md:text-sm font-semibold leading-tight text-center w-full">
                                                    {displayName}
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
                                {t("common.view_all")}
                            </Link>
                        </div>
                    </section>
                </>
            )}

            {/* Labors Content — Live Listing */}
            {activeTab === "labors" && (
                <LaborListingSection />
            )}
        </>
    )
}

