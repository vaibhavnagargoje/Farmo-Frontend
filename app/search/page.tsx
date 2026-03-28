"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
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
    const fetchResults = async () => {
      setLoading(true)
      try {
        // Always call the search API — empty query returns browse mode
        const res = await fetchPublic(API_ENDPOINTS.SEARCH(initialQuery, lang))
        if (res.ok) {
          const data = await res.json()
          setResults(data)
        }
      } catch (error) {
        console.error("Search failed:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [initialQuery, lang])

  // ── Browse Mode: No query → Show categories grid ──
  if (!loading && results?.browse_mode) {
    return (
      <div className="flex-1 flex flex-col">
        {/* Browse Header */}
        <div className="mb-6 max-lg:px-6 max-lg:mt-2">
          <h1 className="text-2xl font-bold text-foreground">{t("search.browse_title")}</h1>
          <p className="text-sm text-muted mt-1">{t("search.browse_desc")}</p>
        </div>

        {/* Categories Grid */}
        {results.categories.length > 0 && (
          <div className="max-lg:px-6 mb-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
              {results.categories.map((cat) => {
                const displayName = cat.name_translations?.[lang] || cat.name
                return (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    className="group bg-card border border-border rounded-2xl p-4 lg:p-5 hover:border-navy/30 hover:shadow-lg transition-all active:scale-[0.98]"
                  >
                    {/* Category Icon */}
                    <div className="size-12 lg:size-14 rounded-xl bg-navy/5 flex items-center justify-center mb-3 group-hover:bg-navy/10 transition-colors overflow-hidden">
                      {cat.icon ? (
                        <Image
                          src={cat.icon}
                          alt={displayName}
                          width={40}
                          height={40}
                          className="object-contain"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-navy text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          agriculture
                        </span>
                      )}
                    </div>

                    {/* Category Name */}
                    <h3 className="text-sm lg:text-base font-bold text-foreground leading-tight mb-1 group-hover:text-navy transition-colors">
                      {displayName}
                    </h3>

                    {/* Instant Price */}
                    {parseFloat(cat.instant_price || "0") > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {t("common.starting_at")} ₹{Math.round(parseFloat(cat.instant_price))}
                      </p>
                    )}

                    {/* View CTA */}
                    <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-navy/70 group-hover:text-navy transition-colors">
                      <span>{t("search.view_category")}</span>
                      <span className="material-symbols-outlined text-[14px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent / Popular Services */}
        {results.services.length > 0 && (
          <div className="max-lg:px-6">
            <h2 className="text-lg font-bold text-foreground mb-4">{t("search.popular_services")}</h2>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
              {results.services.map((srv) => (
                <SearchResultCard
                  key={srv.id}
                  id={srv.id.toString()}
                  name={srv.title}
                  image={srv.thumbnail || srv.partner_profile_picture || "/placeholder.svg"}
                  price={parseFloat(srv.price) || 0}
                  priceUnit={srv.price_unit}
                  rating={parseFloat(srv.partner_rating || "0")}
                  location={srv.partner_location?.address || ""}
                  distance={srv.service_radius_km ? `${srv.service_radius_km} km` : ""}
                  categoryName={srv.category_name || ""}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Search Results Mode ──
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex justify-between items-center mb-6 max-lg:px-6 max-lg:mt-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("search.title")}</h1>
          <p className="text-sm text-muted mt-1">
            {loading
              ? t("common.searching")
              : t("search.results_found")
                  .replace("{count}", String(results?.total_services || 0))
                  .replace("{query}", initialQuery)}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex justify-center items-center h-48">
          <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <>
          {/* Matched Categories as clickable chips */}
          {results?.categories && results.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5 max-lg:px-6">
              {results.categories.map((cat) => {
                const displayName = cat.name_translations?.[lang] || cat.name
                return (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl hover:border-navy/30 hover:bg-navy/5 transition-all text-sm font-medium text-foreground active:scale-[0.97]"
                  >
                    {cat.icon && (
                      <div className="size-6 rounded overflow-hidden shrink-0">
                        <Image src={cat.icon} alt="" width={24} height={24} className="object-contain" />
                      </div>
                    )}
                    <span>{displayName}</span>
                    <span className="material-symbols-outlined text-[14px] text-muted-foreground">arrow_forward</span>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Service Results */}
          {results?.services && results.services.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-lg:px-6">
              {results.services.map((srv) => (
                <SearchResultCard
                  key={srv.id}
                  id={srv.id.toString()}
                  name={srv.title}
                  image={srv.thumbnail || srv.partner_profile_picture || "/placeholder.svg"}
                  price={parseFloat(srv.price) || 0}
                  priceUnit={srv.price_unit}
                  rating={parseFloat(srv.partner_rating || "0")}
                  location={srv.partner_location?.address || ""}
                  distance={srv.service_radius_km ? `${srv.service_radius_km} km` : ""}
                  categoryName={srv.category_name || ""}
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
        </>
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
        const cats = Array.isArray(data) ? data : (data.results || [])
        setCategories(cats)
      })
      .catch(console.error)
  }, [])

  return (
    <div className="relative min-h-screen flex flex-col pb-24 lg:pb-0 bg-background">
      <DesktopHeader variant="farmer" />
      <MobileHeader />

      <div className="max-w-7xl mx-auto w-full px-6 py-6 gap-6 flex max-lg:px-0">
        {/* Sidebar Filters - Desktop Only */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
            <h3 className="font-bold text-lg text-foreground mb-4">{t("search.filters")}</h3>

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

            <button className="w-full h-11 bg-navy text-white rounded-xl font-semibold hover:bg-navy/90 transition-colors">
              {t("search.apply_filters")}
            </button>
          </div>
        </aside>

        {/* Main Results */}
        <Suspense fallback={<div className="flex-1 flex justify-center items-center h-48"><div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
          <SearchContent />
        </Suspense>
      </div>

      <BottomNav variant="farmer" />
    </div>
  )
}
