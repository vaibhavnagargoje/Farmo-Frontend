"use client"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { NotificationDropdown } from "@/components/notification-dropdown"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { API_ENDPOINTS, SearchResponse, fetchPublic } from "@/lib/api"

interface MobileHeaderProps {
  className?: string
  location?: string
}

export function MobileHeader({ className }: MobileHeaderProps) {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [locationName, setLocationName] = useState<string>("India")
  const [hasPartnerAccount, setHasPartnerAccount] = useState<boolean>(false)

  const isPartnerView = pathname?.startsWith('/partner')

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch location
      fetch("/api/auth/location")
        .then(res => res.json())
        .then(data => {
          if (data.has_location && data.location?.address) {
            setLocationName(data.location.address.split(',')[0])
          } else {
            setLocationName("Set your location")
          }
        })
        .catch(() => { })

      // Fetch partner status
      fetch("/api/profile")
        .then(res => res.json())
        .then(data => {
          if (data.partner) {
            setHasPartnerAccount(true)
          }
        })
        .catch(() => { })
    } else {
      setLocationName("Set your location")
      setHasPartnerAccount(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isSearchExpanded) {
      inputRef.current?.focus()
    }
  }, [isSearchExpanded])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true)
        fetchPublic(API_ENDPOINTS.SEARCH(searchQuery.trim()))
          .then(res => res.json())
          .then(data => {
            setSearchResults(data)
            setIsDropdownOpen(true)
            setIsSearching(false)
          })
          .catch(() => setIsSearching(false))
      } else {
        setSearchResults(null)
        setIsDropdownOpen(false)
      }
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (searchQuery.trim()) {
      setIsDropdownOpen(false)
      setIsSearchExpanded(false)
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className={cn("sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 lg:hidden", className)}>
      <div className="flex items-center justify-between px-4 h-16 relative">

        {/* Logo & Location Section */}
        <div className={cn(
          "flex items-center gap-3 transition-all duration-300 ease-in-out",
          isSearchExpanded ? "opacity-0 -translate-x-full absolute pointer-events-none" : "opacity-100 translate-x-0 relative"
        )}>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="size-10 bg-navy rounded-xl flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-primary text-[24px]">agriculture</span>
            </Link>
            <div className="flex flex-col justify-center">
              <Link href="/" className="text-xl font-bold text-navy leading-none tracking-tight">Farmo</Link>
              <span className="text-xs text-muted-foreground leading-none mt-0.5 max-w-[120px] truncate">{locationName}</span>
            </div>
          </div>
        </div>

        {/* Right Actions / Search Bar */}
        <div className={cn(
          "flex items-center gap-2 transition-all duration-300 ease-in-out",
          isSearchExpanded ? "w-full" : "w-auto ml-auto"
        )}>

          {/* Search Input Container */}
          <div className={cn(
            "relative flex items-center transition-all duration-300 ease-in-out",
            isSearchExpanded ? "w-full" : "w-10"
          )}>
            {isSearchExpanded ? (
              <div className="relative w-full animate-in fade-in zoom-in-95 duration-200">
                <form onSubmit={handleSearchSubmit}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tractors, labors..."
                    className="w-full h-10 pl-10 pr-9 rounded-full bg-muted/50 border border-transparent focus:bg-background focus:border-primary/50 focus:shadow-sm outline-none text-sm placeholder:text-muted-foreground/60 transition-all"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-muted-foreground text-[20px]">search</span>
                  <button
                    type="button"
                    onClick={() => { setIsSearchExpanded(false); setSearchQuery(""); setIsDropdownOpen(false); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 size-6 flex items-center justify-center rounded-full bg-background/50 text-muted-foreground hover:text-foreground"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </form>
                
                {/* Mobile Dropdown */}
                {isDropdownOpen && searchResults && (
                   <div className="absolute top-12 left-0 right-0 bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden max-h-[70vh] overflow-y-auto">
                     {/* Categories */}
                     {searchResults.categories?.length > 0 && (
                       <div className="p-2 border-b border-border/50">
                         <div className="text-[10px] font-bold text-muted-foreground px-2 py-1 uppercase tracking-wider">Categories</div>
                         {searchResults.categories.slice(0, 3).map(cat => (
                            <button key={cat.id} type="button" onClick={() => { setSearchQuery(cat.name); handleSearchSubmit(); }} className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 rounded-lg flex items-center gap-2">
                               <span className="material-symbols-outlined text-[18px] text-muted-foreground">category</span>
                               {cat.name}
                            </button>
                         ))}
                       </div>
                     )}
                     
                     {/* Services */}
                     {searchResults.services?.length > 0 ? (
                        <div className="p-2">
                           <div className="text-[10px] font-bold text-muted-foreground px-2 py-1 uppercase tracking-wider">Services</div>
                           {searchResults.services.slice(0, 5).map(srv => (
                              <Link key={srv.id} href={`/booking/new/${srv.id}`} onClick={() => { setIsDropdownOpen(false); setIsSearchExpanded(false); }} className="px-3 py-2 hover:bg-muted/50 rounded-lg flex gap-3 items-center">
                                 {srv.thumbnail ? (
                                   <img src={srv.thumbnail} alt={srv.title} className="w-12 h-12 rounded object-cover border border-border/50" />
                                 ) : (
                                   <div className="w-12 h-12 rounded bg-muted flex items-center justify-center border border-border/50">
                                     <span className="material-symbols-outlined text-muted-foreground">image</span>
                                   </div>
                                 )}
                                 <div className="flex-1 min-w-0">
                                   <div className="text-sm font-medium truncate">{srv.title}</div>
                                   <div className="text-xs text-muted-foreground truncate">{srv.category_name || srv.category?.name} • ₹{srv.price}/{srv.price_unit}</div>
                                 </div>
                              </Link>
                           ))}
                        </div>
                     ) : (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                           {isSearching ? "Searching..." : "No matching services found"}
                        </div>
                     )}
                     
                     {searchResults.total_services > 5 && (
                        <div className="p-2 border-t border-border/50 bg-muted/10">
                           <button type="button" onClick={() => handleSearchSubmit()} className="w-full py-2.5 text-sm text-primary font-bold hover:bg-primary/5 rounded-lg">
                              View all {searchResults.total_services} results
                           </button>
                        </div>
                     )}
                   </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsSearchExpanded(true)}
                className="flex items-center justify-center size-10 rounded-full hover:bg-muted/50 text-foreground active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[24px]">search</span>
              </button>
            )}
          </div>

          {/* Notification Icon (Hidden when searching to give space) */}
          <div className={cn(
            "flex items-center gap-1 transition-all duration-300 ease-in-out",
            isSearchExpanded ? "opacity-0 scale-95 pointer-events-none absolute right-4" : "opacity-100 scale-100"
          )}>
            <NotificationDropdown />
            {hasPartnerAccount && (
              <Link
                href={isPartnerView ? "/" : "/partner"}
                className="flex flex-col items-center justify-center size-10 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-navy transition-colors"
                title={isPartnerView ? "Switch to Farmer" : "Switch to Partner"}
              >
                <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                <span className="text-[8px] font-bold leading-none mt-0.5">{isPartnerView ? "Farmer" : "Partner"}</span>
              </Link>
            )}
          </div>
        </div>

      </div>
    </header>
  )
}
