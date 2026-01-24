"use client"

import { useState } from "react"
import Link from "next/link"
import { BottomNav } from "@/components/bottom-nav"
import { DesktopHeader } from "@/components/desktop-header"
import { MobileHeader } from "@/components/mobile-header"
import { SearchResultCard } from "@/components/search-result-card"

const searchResults = [
  {
    id: "1",
    name: "John Deere 5050D",
    image: "/green-john-deere-tractor-field.jpg",
    price: 600,
    rating: 4.8,
    location: "Iowa City Center",
    distance: "2.5 km",
    specs: { power: "50 HP", fuel: "Diesel", type: "Manual" },
  },
  {
    id: "2",
    name: "Mahindra Jivo 245",
    image: "/red-mahindra-compact-tractor.jpg",
    price: 450,
    rating: 4.6,
    location: "West Branch",
    distance: "5.2 km",
    specs: { power: "24 HP", fuel: "Diesel", type: "4WD" },
  },
  {
    id: "3",
    name: "CAT Heavy Excavator",
    image: "/yellow-cat-excavator-construction.jpg",
    price: 1200,
    rating: 4.9,
    location: "Coralville",
    distance: "8.0 km",
    specs: { power: "75 HP", fuel: "Heavy", type: "Auto" },
  },
]

const filters = ["All", "Under ₹500/hr", "Compact", "4WD", "Brand"]
const categoryFilters = ["Tractors", "Harvesters", "Sprayers", "Cultivators", "Excavators"]

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("John Deere Tractor")
  const [activeFilter, setActiveFilter] = useState("All")

  return (
    <div className="relative min-h-screen flex flex-col pb-24 lg:pb-0 bg-background">
      {/* Desktop Header */}
      <DesktopHeader variant="farmer" />
      <MobileHeader />

      {/* Mobile Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm pt-6 pb-2 px-6 lg:hidden">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/"
            className="size-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground shadow-sm active:scale-95 transition-transform hover:bg-muted/10"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>

          <div className="flex-1 bg-card h-12 rounded-full border border-border shadow-sm flex items-center px-4 gap-2 focus-within:ring-2 focus-within:ring-navy/10 transition-all">
            <span className="material-symbols-outlined text-muted">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none text-foreground placeholder-muted focus:ring-0 text-sm font-medium h-full outline-none"
              placeholder="Search equipment..."
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-muted hover:text-navy transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            )}
          </div>

          <button className="size-10 rounded-full bg-navy text-white flex items-center justify-center shadow-lg shadow-navy/20 active:scale-95 transition-transform hover:bg-navy/90">
            <span className="material-symbols-outlined">tune</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-semibold shadow-sm shrink-0 whitespace-nowrap active:scale-95 transition-all ${
                activeFilter === filter
                  ? "bg-navy text-white"
                  : "bg-card border border-border text-foreground hover:bg-muted/10"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </header>

      {/* Desktop Layout */}
      <div className="hidden lg:flex max-w-7xl mx-auto w-full px-6 py-6 gap-6">
        {/* Sidebar Filters */}
        <aside className="w-72 shrink-0">
          <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
            <h3 className="font-bold text-lg text-foreground mb-4">Filters</h3>
            
            {/* Search in sidebar */}
            <div className="mb-6">
              <label className="text-sm font-medium text-muted mb-2 block">Search</label>
              <div className="bg-background h-11 rounded-xl border border-border flex items-center px-3 gap-2 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <span className="material-symbols-outlined text-muted text-[20px]">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none text-foreground placeholder-muted focus:ring-0 text-sm font-medium h-full outline-none"
                  placeholder="Search..."
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <label className="text-sm font-medium text-muted mb-3 block">Category</label>
              <div className="flex flex-col gap-2">
                {categoryFilters.map((category) => (
                  <button
                    key={category}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors text-left"
                  >
                    <span className="size-4 rounded border-2 border-border"></span>
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <label className="text-sm font-medium text-muted mb-3 block">Price Range</label>
              <div className="flex flex-wrap gap-2">
                {filters.slice(1).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                      activeFilter === filter
                        ? "bg-primary text-white"
                        : "bg-muted/30 text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Apply Button */}
            <button className="w-full h-11 bg-navy text-white rounded-xl font-semibold hover:bg-navy/90 transition-colors">
              Apply Filters
            </button>
          </div>
        </aside>

        {/* Main Results */}
        <main className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Search Results</h1>
              <p className="text-sm text-muted mt-1">{searchResults.length} equipment found</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
                <span>Sort by: Recommended</span>
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </button>
              <div className="flex border border-border rounded-xl overflow-hidden">
                <button className="size-10 flex items-center justify-center bg-navy text-white">
                  <span className="material-symbols-outlined text-[20px]">grid_view</span>
                </button>
                <button className="size-10 flex items-center justify-center bg-card text-muted hover:text-foreground transition-colors">
                  <span className="material-symbols-outlined text-[20px]">view_list</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {searchResults.map((result) => (
              <SearchResultCard key={result.id} {...result} />
            ))}
          </div>
        </main>
      </div>

      {/* Mobile Results */}
      <main className="flex-1 flex flex-col gap-5 px-6 pt-2 lg:hidden">
        <div className="flex justify-between items-end px-1">
          <p className="text-sm text-muted font-medium">{searchResults.length} Results found</p>
          <div className="flex items-center gap-1 text-navy text-xs font-bold cursor-pointer hover:opacity-80 transition-opacity">
            <span>Sort by: Recommended</span>
            <span className="material-symbols-outlined text-[16px]">expand_more</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {searchResults.map((result) => (
            <SearchResultCard key={result.id} {...result} />
          ))}
        </div>
      </main>

      <BottomNav variant="farmer" />
    </div>
  )
}
