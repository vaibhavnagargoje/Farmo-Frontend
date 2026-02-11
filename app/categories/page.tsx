import Link from "next/link"
import Image from "next/image"
import { BottomNav } from "@/components/bottom-nav"
import { DesktopHeader } from "@/components/desktop-header"
import { MobileHeader } from "@/components/mobile-header"
import { API_ENDPOINTS, type Category } from "@/lib/api"

async function getCategories(): Promise<Category[]> {
    try {
        const res = await fetch(API_ENDPOINTS.CATEGORIES, {
            next: { revalidate: 3600 },
        })
        if (!res.ok) return []
        const data = await res.json()
        return data.results || data
    } catch {
        return []
    }
}

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

// Icon mapping
const categoryIcons: Record<string, string> = {
    tractor: "agriculture",
    tractors: "agriculture",
    harvesting: "grass",
    harvester: "grass",
    spraying: "water_drop",
    sprayer: "water_drop",
    ploughing: "landscape",
    cultivator: "yard",
    rotavator: "settings",
    transport: "local_shipping",
    excavator: "construction",
}

function getCategoryIcon(slug: string): string {
    const key = Object.keys(categoryIcons).find((k) =>
        slug.toLowerCase().includes(k)
    )
    return key ? categoryIcons[key] : "handyman"
}

export default async function CategoriesPage() {
    const categories = await getCategories()

    return (
        <div className="flex flex-col min-h-screen pb-24 lg:pb-0 bg-background">
            <DesktopHeader variant="farmer" />
            <MobileHeader />

            {/* Mobile Header */}
            <header className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border lg:hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                    <Link
                        href="/"
                        className="size-9 rounded-md bg-card border border-border flex items-center justify-center text-foreground active:scale-95 transition-transform"
                    >
                        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-base font-bold text-foreground">All Categories</h1>
                        <p className="text-[11px] text-muted-foreground">{categories.length} categories available</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 lg:max-w-7xl lg:mx-auto lg:w-full">
                {/* Desktop Header Section */}
                <div className="hidden lg:block px-6 pt-8 pb-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                        <span>/</span>
                        <span className="text-foreground font-medium">All Categories</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Equipment Categories</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Browse {categories.length} categories of farm equipment & machinery
                            </p>
                        </div>
                    </div>
                </div>

                {/* Categories Grid */}
                <section className="px-4 lg:px-6 pb-8">
                    {categories.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {categories.map((category) => {
                                const image = getCategoryImage(category.slug)
                                const icon = getCategoryIcon(category.slug)

                                return (
                                    <Link
                                        key={category.id}
                                        href={`/category/${category.slug}`}
                                        className="group flex gap-0 bg-card border border-border rounded-md overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all active:scale-[0.99]"
                                    >
                                        {/* Image */}
                                        <div className="relative w-28 sm:w-32 shrink-0 overflow-hidden">
                                            <Image
                                                src={category.icon || image}
                                                alt={category.name}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 flex flex-col justify-center px-4 py-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span
                                                    className="material-symbols-outlined text-primary text-[18px]"
                                                    style={{ fontVariationSettings: "'FILL' 1" }}
                                                >
                                                    {icon}
                                                </span>
                                                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                                    {category.name}
                                                </h3>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                                Rent {category.name.toLowerCase()} services for your farm
                                            </p>
                                            <div className="flex items-center gap-1 mt-2 text-primary">
                                                <span className="text-xs font-semibold">View Services</span>
                                                <span className="material-symbols-outlined text-[14px] group-hover:translate-x-0.5 transition-transform">
                                                    arrow_forward
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    ) : (
                        /* Skeleton Loading */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="flex gap-0 bg-card border border-border rounded-md overflow-hidden animate-pulse">
                                    <div className="w-28 sm:w-32 shrink-0 aspect-[4/3] bg-muted/30" />
                                    <div className="flex-1 p-4 space-y-2">
                                        <div className="h-4 bg-muted/30 rounded w-3/4" />
                                        <div className="h-3 bg-muted/20 rounded w-full" />
                                        <div className="h-3 bg-muted/20 rounded w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Empty State */}
                {categories.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                        <span className="material-symbols-outlined text-5xl text-muted-foreground mb-3">inventory_2</span>
                        <h3 className="text-lg font-bold text-foreground mb-1">No Categories Found</h3>
                        <p className="text-sm text-muted-foreground mb-5">
                            Please check back later or try refreshing the page.
                        </p>
                        <Link
                            href="/"
                            className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors"
                        >
                            Go Home
                        </Link>
                    </div>
                )}
            </main>

            <BottomNav variant="farmer" />
        </div>
    )
}
