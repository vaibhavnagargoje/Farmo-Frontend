"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { DesktopHeader } from "@/components/desktop-header"
import { MobileHeader } from "@/components/mobile-header"
import { SearchResultCard } from "@/components/search-result-card"
import { API_ENDPOINTS, SearchResponse, Category, fetchPublic } from "@/lib/api"
import { useLanguage } from "@/contexts/language-context"

function SearchContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""
  const { t, lang } = useLanguage()
  
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResults = async (q: string) => {
      setLoading(true)
      try {
        const res = await fetchPublic(API_ENDPOINTS.SEARCH(q, lang))
        if(res.ok) {
           const data = await res.json()
           setResults(data)
        }
      } catch (error) {
        console.error("Search failed:", error)
      } finally {
        setLoading(false)
      }
    }

    if (initialQuery) {
      fetchResults(initialQuery)
    } else {
      setLoading(false)
      setResults(null)
    }
  }, [initialQuery])

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex justify-between items-center mb-6 max-lg:px-6 max-lg:mt-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("search.title")}</h1>
          <p className="text-sm text-muted mt-1">
             {loading ? t("common.searching") : t("search.results_found").replace("{count}", String(results?.total_services || 0)).replace("{query}", initialQuery)}
          </p>
        </div>
        {!loading && results && results.total_services > 0 && (
          <div className="flex items-center gap-3">
            <button className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
              <span className="material-symbols-outlined text-[18px]">tune</span>
              <span>{t("search.filter")}</span>
            </button>
            <div className="hidden lg:flex border border-border rounded-xl overflow-hidden">
              <button className="size-10 flex items-center justify-center bg-navy text-white">
                <span className="material-symbols-outlined text-[20px]">grid_view</span>
              </button>
              <button className="size-10 flex items-center justify-center bg-card text-muted hover:text-foreground transition-colors">
                <span className="material-symbols-outlined text-[20px]">view_list</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex justify-center items-center h-48">
          <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : results?.services && results.services.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-lg:px-6">
          {results.services.map((srv) => (
            <SearchResultCard
               key={srv.id}
               id={srv.id.toString()}
               name={srv.title}
               image={srv.thumbnail || srv.partner_profile_picture || "/placeholder.svg"}
               price={parseFloat(srv.price) || 0}
               rating={parseFloat(srv.partner_rating || "0")}
               location={srv.partner_location?.address || "Unknown Location"}
               distance={srv.service_radius_km ? `${srv.service_radius_km} km` : "N/A"}
               specs={{
                 power: srv.specifications?.power || "N/A",
                 fuel: srv.specifications?.fuel || "N/A",
                 type: srv.specifications?.type || srv.category_name || "N/A",
               }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card border border-border rounded-2xl max-lg:mx-6">
           <span className="material-symbols-outlined text-muted text-5xl mb-4 text-primary/40">search_off</span>
           <h3 className="text-xl font-bold mb-2">{t("common.no_results")}</h3>
           <p className="text-muted-foreground text-sm max-w-sm">
             {t("search.no_results_desc").replace("{query}", initialQuery)}
           </p>
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const { t, lang } = useLanguage()

  useEffect(() => {
    fetchPublic(API_ENDPOINTS.CATEGORIES)
      .then(res => res.json())
      .then(data => {
        // DRF may return array directly or inside { results: [...] }
        const cats = Array.isArray(data) ? data : (data.results || [])
        setCategories(cats)
      })
      .catch(console.error)
  }, [])

  return (
    <div className="relative min-h-screen flex flex-col pb-24 lg:pb-0 bg-background">
      {/* Desktop Header */}
      <DesktopHeader variant="farmer" />
      <MobileHeader />

      {/* Desktop Layout */}
      <div className="max-w-7xl mx-auto w-full px-6 py-6 gap-6 flex max-lg:px-0">
        {/* Sidebar Filters - Desktop Only */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
            <h3 className="font-bold text-lg text-foreground mb-4">{t("search.filters")}</h3>

            {/* Category Filter */}
            <div className="mb-6">
              <label className="text-sm font-medium text-muted mb-3 block">{t("search.category")}</label>
              <div className="flex flex-col gap-2">
                {categories.map((category) => {
                  const displayName = category.name_translations?.[lang] || category.name
                  return (
                    <Link
                      key={category.id}
                      href={`/search?q=${encodeURIComponent(category.name)}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors text-left"
                    >
                      <span className="size-4 rounded border-2 border-border flex items-center justify-center">
                      </span>
                      {displayName}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Apply Button */}
            <button className="w-full h-11 bg-navy text-white rounded-xl font-semibold hover:bg-navy/90 transition-colors">
              {t("search.apply_filters")}
            </button>
          </div>
        </aside>

        {/* Main Results area acts as Boundary */}
        <Suspense fallback={<div className="flex-1 flex justify-center items-center h-48"><div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
           <SearchContent />
        </Suspense>
      </div>

      <BottomNav variant="farmer" />
    </div>
  )
}
