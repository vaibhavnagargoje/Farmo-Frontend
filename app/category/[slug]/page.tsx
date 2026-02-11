"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { DesktopHeader } from "@/components/desktop-header"
import { MobileHeader } from "@/components/mobile-header"
import { type Service, type Category } from "@/lib/api"

// Distance Options
const distanceOptions = [
  { value: "all", label: "All Areas" },
  { value: "5", label: "Within 5 km" },
  { value: "10", label: "Within 10 km" },
  { value: "20", label: "Within 20 km" },
  { value: "50", label: "Within 50 km" },
]

export default function CategoryServicesPage() {
  const params = useParams()
  const slug = params.slug as string

  const [services, setServices] = useState<Service[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter States
  const [locationSearch, setLocationSearch] = useState("")
  const [activeDistance, setActiveDistance] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([])

  // Fetch category and services
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch categories via Next.js proxy (avoids CORS)
        const catRes = await fetch("/api/services/categories")
        if (catRes.ok) {
          const catData = await catRes.json()
          const categories = catData.results || catData || []
          const currentCat = categories.find((c: Category) => c.slug === slug)
          setCategory(currentCat || null)
        }

        // Fetch services for this category via Next.js proxy
        const servicesRes = await fetch(`/api/services?category=${slug}`)
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

  // Handle location search
  const handleLocationSearch = (value: string) => {
    setLocationSearch(value)
    if (value.length > 2) {
      // Mock suggestions - in real implementation, this would call an API
      const mockSuggestions = [
        "Surat", "Bardoli", "Navsari", "Valsad", "Ankleshwar",
        "Bharuch", "Vyara", "Mandvi", "Kamrej", "Olpad"
      ].filter(location =>
        location.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5)
      setLocationSuggestions(mockSuggestions)
      setShowLocationDropdown(true)
    } else {
      setLocationSuggestions([])
      setShowLocationDropdown(false)
    }
  }

  // Filter Services by location and distance (UI only)
  const filteredServices = services.filter((service) => {
    // Location filtering logic will be implemented with backend
    // For now, just return all services
    return true
  })

  const categoryName = category?.name || slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())

  return (
    <div className="relative min-h-screen flex flex-col pb-24 lg:pb-0 bg-background">
      {/* Desktop Header */}
      <DesktopHeader variant="farmer" />
      <MobileHeader />

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

        {/* Mobile Location Search & Distance Filter */}
        <div className="space-y-3">
          {/* Location Search */}
          <div className="relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Search village, taluka..."
                value={locationSearch}
                onChange={(e) => handleLocationSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[20px]">search</span>
            </div>

            {/* Location Suggestions Dropdown */}
            {showLocationDropdown && locationSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                {locationSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setLocationSearch(suggestion)
                      setShowLocationDropdown(false)
                      setLocationSuggestions([])
                    }}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-muted/50 transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px] text-muted">location_on</span>
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Distance Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {distanceOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setActiveDistance(option.value)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold shrink-0 whitespace-nowrap active:scale-95 transition-all ${activeDistance === option.value
                  ? "bg-navy text-white"
                  : "bg-card border border-border text-foreground"
                  }`}
              >
                {option.label}
              </button>
            ))}
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

          <div className="flex items-center gap-4">
            {/* Location Search */}
            <div className="relative min-w-[300px]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search village, taluka..."
                  value={locationSearch}
                  onChange={(e) => handleLocationSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[20px]">search</span>
              </div>

              {/* Location Suggestions Dropdown */}
              {showLocationDropdown && locationSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                  {locationSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setLocationSearch(suggestion)
                        setShowLocationDropdown(false)
                        setLocationSuggestions([])
                      }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-muted/50 transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px] text-muted">location_on</span>
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Distance Filter Pills */}
            <div className="flex items-center gap-2">
              {distanceOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setActiveDistance(option.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeDistance === option.value
                    ? "bg-navy text-white"
                    : "bg-card border border-border text-foreground hover:bg-muted/50"
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* View Toggle */}
            <div className="flex border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`size-10 flex items-center justify-center transition-colors ${viewMode === "grid" ? "bg-navy text-white" : "bg-card text-muted hover:text-foreground"
                  }`}
              >
                <span className="material-symbols-outlined text-[20px]">grid_view</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`size-10 flex items-center justify-center transition-colors ${viewMode === "list" ? "bg-navy text-white" : "bg-card text-muted hover:text-foreground"
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
              onClick={() => {
                setLocationSearch("")
                setActiveDistance("all")
                setLocationSuggestions([])
                setShowLocationDropdown(false)
              }}
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
              onClick={() => {
                setLocationSearch("")
                setActiveDistance("all")
                setLocationSuggestions([])
                setShowLocationDropdown(false)
              }}
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
        href={`/booking/new/${service.id}`}
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
      href={`/booking/new/${service.id}`}
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
