"use client"

import Link from "next/link"
import { BottomNav } from "@/components/bottom-nav"
import { DesktopHeader } from "@/components/desktop-header"
import { LaborListingSection } from "@/components/labor-listing-section"
import { MobileHeader } from "@/components/mobile-header"
import { useLanguage } from "@/contexts/language-context"

export default function LaborPage() {
    const { t } = useLanguage()

    return (
        <div className="flex flex-col min-h-screen pb-24 lg:pb-0 bg-background">
            <DesktopHeader variant="farmer" />
            <MobileHeader />

            <main className="flex-1 lg:max-w-7xl lg:mx-auto lg:w-full">
                <div className="px-4 lg:px-6 pt-3 lg:pt-6 pb-3 lg:pb-5 flex justify-center">
                    <div className="flex gap-0 bg-card rounded-sm border border-border overflow-hidden w-fit">
                        <Link
                            href="/"
                            className="px-5 lg:px-8 flex items-center gap-2 py-2.5 text-sm font-semibold transition-all bg-card text-muted-foreground hover:bg-muted/30"
                        >
                            <span className="material-symbols-outlined text-[18px]">agriculture</span>
                            {t("tabs.equipment")}
                        </Link>
                        <button
                            type="button"
                            aria-current="page"
                            className="px-5 lg:px-8 flex items-center gap-2 py-2.5 text-sm font-semibold border-l border-border transition-all bg-navy text-white cursor-default"
                        >
                            <span className="material-symbols-outlined text-[18px]">engineering</span>
                            {t("tabs.labors")}
                        </button>
                    </div>
                </div>

                <LaborListingSection />
            </main>

            <BottomNav variant="farmer" />
        </div>
    )
}