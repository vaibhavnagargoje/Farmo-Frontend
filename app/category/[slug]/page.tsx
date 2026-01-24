"use client"

import { useState, useEffect, Fragment } from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { DesktopHeader } from "@/components/desktop-header"
import { API_ENDPOINTS, type Service, type Category } from "@/lib/api"

// Sort Options
const sortOptions = [
  { value: "recommended", label: "Recommended" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
]

// Price Filters
const priceFilters = [
  { value: "all", label: "All" },
  { value: "under_500", label: "Under ₹500" },
  { value: "500_1000", label: "₹500-1000" },
  { value: "above_1000", label: "₹1000+" },
]

export default function CategoryServicesPage() {
  const params = useParams()
  const slug = params.slug as string

  const [services, setServices] = useState<Service[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter States
  const [activePrice, setActivePrice] = useState("all")
  const [activeSort, setActiveSort] = useState("recommended")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  // Fetch category and services
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch categories to get current category info
        const catRes = await fetch(API_ENDPOINTS.CATEGORIES)
        if (catRes.ok) {
          const catData = await catRes.json()
          const categories = catData.results || catData || []
          const currentCat = categories.find((c: Category) => c.slug === slug)
          setCategory(currentCat || null)
        }

        // Fetch services for this category
        const servicesRes = await fetch(`${API_ENDPOINTS.SERVICES}?category=${slug}`)
        if (servicesRes.ok) {
          const servicesData = await servicesRes.json()
          setServices(servicesData.results || servicesData || [])
        } else {
          setServices([])
        }
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Unable to connect to server")
      } finally {
        setIsLoading(false)
      }
    }

    if (slug) {
      fetchData()
    }
  }, [slug])

  // Filter and Sort Services
  const filteredServices = services
    .filter((service) => {
      const price = parseFloat(service.price)
      if (activePrice === "under_500" && price >= 500) return false
      if (activePrice === "500_1000" && (price < 500 || price > 1000)) return false
      if (activePrice === "above_1000" && price <= 1000) return false
      return true
    })
    .sort((a, b) => {
      switch (activeSort) {
        case "price_low":
          return parseFloat(a.price) - parseFloat(b.price)
        case "price_high":
          return parseFloat(b.price) - parseFloat(a.price)
        case "rating":
          return parseFloat(b.partner_rating || "0") - parseFloat(a.partner_rating || "0")
        default:
          return 0
      }
    })

  const categoryName = category?.name || slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())

  return (
    <div className="relative min-h-screen flex flex-col pb-24 lg:pb-0 bg-background">
      {/* Desktop Header */}
      <DesktopHeader variant="farmer" />

      {/* Mobile Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm pt-4 pb-3 px-4 border-b border-border/50 lg:hidden">
        <div className="flex items-center gap-3 mb-3">
          <Link
            href="/"
            className="size-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground shadow-sm active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>

          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">{categoryName}</h1>
            <p className="text-xs text-muted">{filteredServices.length} services</p>
          </div>

          <button
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="size-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground shadow-sm active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined">
              {viewMode === "grid" ? "view_list" : "grid_view"}
            </span>
          </button>
        </div>

        {/* Mobile Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {priceFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActivePrice(filter.value)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold shrink-0 whitespace-nowrap active:scale-95 transition-all ${
                activePrice === filter.value
                  ? "bg-navy text-white"
                  : "bg-card border border-border text-foreground"
              }`}
            >
              {filter.label}
            </button>
          ))}
          
          {/* Sort Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-semibold bg-card border border-border text-foreground shrink-0"
            >
              <span className="material-symbols-outlined text-[14px]">sort</span>
              Sort
            </button>
            {showSortDropdown && (
              <div className="absolute top-full right-0 mt-2 w-44 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setActiveSort(option.value)
                      setShowSortDropdown(false)
                    }}
                    className={`w-full px-4 py-2.5 text-left text-xs font-medium hover:bg-muted/50 transition-colors ${
                      activeSort === option.value ? "text-primary bg-primary/5" : "text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Desktop Layout */}
      <div className="hidden lg:block max-w-6xl mx-auto w-full px-6 py-6">
        {/* Breadcrumb & Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted mb-1">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <span>/</span>
              <span className="text-foreground font-medium">{categoryName}</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">{categoryName}</h1>
            <p className="text-sm text-muted mt-1">{filteredServices.length} services available</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Price Filter Pills */}
            <div className="flex items-center gap-2">
              {priceFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setActivePrice(filter.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activePrice === filter.value
                      ? "bg-navy text-white"
                      : "bg-card border border-border text-foreground hover:bg-muted/50"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                <span>Sort: {sortOptions.find((o) => o.value === activeSort)?.label}</span>
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </button>
              {showSortDropdown && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setActiveSort(option.value)
                        setShowSortDropdown(false)
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-muted/50 transition-colors ${
                        activeSort === option.value ? "text-primary bg-primary/5" : "text-foreground"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View Toggle */}
            <div className="flex border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`size-10 flex items-center justify-center transition-colors ${
                  viewMode === "grid" ? "bg-navy text-white" : "bg-card text-muted hover:text-foreground"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">grid_view</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`size-10 flex items-center justify-center transition-colors ${
                  viewMode === "list" ? "bg-navy text-white" : "bg-card text-muted hover:text-foreground"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">view_list</span>
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-muted mb-4">cloud_off</span>
            <p className="text-lg font-medium text-foreground">{error}</p>
            <p className="text-sm text-muted mt-1">Please try again later</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredServices.length === 0 && (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-muted mb-4">inventory_2</span>
            <p className="text-lg font-medium text-foreground">No services found</p>
            <p className="text-sm text-muted mt-1">Try adjusting your filters or check back later</p>
            <button
              onClick={() => setActivePrice("all")}
              className="mt-4 px-6 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Services Grid */}
        {!isLoading && !error && filteredServices.length > 0 && (
          <div className={viewMode === "grid" ? "grid grid-cols-2 xl:grid-cols-3 gap-5" : "flex flex-col gap-4"}>
            {filteredServices.map((service) => (
              <ServiceCard key={service.id} service={service} viewMode={viewMode} />
            ))}
          </div>
        )}
      </div>

      {/* Mobile Results */}
      <main className="flex-1 flex flex-col gap-4 px-4 pt-4 lg:hidden">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-muted mb-3">cloud_off</span>
            <p className="text-base font-medium text-foreground">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredServices.length === 0 && (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-muted mb-3">inventory_2</span>
            <p className="text-base font-medium text-foreground">No services found</p>
            <button
              onClick={() => setActivePrice("all")}
              className="mt-3 px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Services List */}
        {!isLoading && !error && filteredServices.length > 0 && (
          <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3" : "flex flex-col gap-4"}>
            {filteredServices.map((service) => (
              <ServiceCard key={service.id} service={service} viewMode={viewMode} />
            ))}
          </div>
        )}
      </main>

      <BottomNav variant="farmer" />
    </div>
  )
}

// Service Card Component
function ServiceCard({ service, viewMode }: { service: Service; viewMode: "grid" | "list" }) {
  const priceUnit = service.price_unit === "HOUR" ? "/hr" : service.price_unit === "DAY" ? "/day" : ""
  
  if (viewMode === "list") {
    return (
      <Link
        href={`/booking/${service.id}`}
        className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 flex gap-4 group hover:shadow-lg transition-shadow"
      >
        <div className="relative w-32 h-24 bg-muted/20 rounded-xl overflow-hidden shrink-0">
          <Image
            src={service.thumbnail || "/placeholder.svg"}
            alt={service.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {!service.is_available && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-xs font-bold">Unavailable</span>
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            <h3 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {service.title}
            </h3>
            <p className="text-xs text-muted mt-0.5">{service.partner_name || "Service Provider"}</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-navy">₹{service.price}</span>
              <span className="text-xs text-muted">{priceUnit}</span>
            </div>
            {service.partner_rating && parseFloat(service.partner_rating) > 0 && (
              <div className="flex items-center gap-1 bg-success/10 px-2 py-1 rounded text-xs font-bold text-success">
                <span>{parseFloat(service.partner_rating).toFixed(1)}</span>
                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    )
  }

  // Grid View
  return (
    <Link
      href={`/booking/${service.id}`}
      className="bg-card rounded-2xl p-3 lg:p-4 shadow-sm border border-border/50 flex flex-col gap-3 group hover:shadow-lg transition-shadow"
    >
      <div className="relative w-full aspect-[4/3] bg-muted/20 rounded-xl overflow-hidden">
        <Image
          src={service.thumbnail || "/placeholder.svg"}
          alt={service.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-2 right-2 bg-card/95 backdrop-blur shadow-sm px-2 py-1 rounded-lg flex items-center gap-0.5 z-10 border border-border">
          <span className="text-navy font-bold text-sm">₹{service.price}</span>
          <span className="text-muted text-[10px]">{priceUnit}</span>
        </div>
        {!service.is_available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-xs font-bold px-2 py-1 bg-black/50 rounded">Unavailable</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="font-bold text-foreground text-sm lg:text-base line-clamp-1 group-hover:text-primary transition-colors">
          {service.title}
        </h3>
        <p className="text-xs text-muted line-clamp-1">{service.partner_name || "Service Provider"}</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted">{service.category_name}</p>
          {service.partner_rating && parseFloat(service.partner_rating) > 0 && (
            <div className="flex items-center gap-0.5 text-xs font-bold text-success">
              <span>{parseFloat(service.partner_rating).toFixed(1)}</span>
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
