"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { NotificationDropdown } from "@/components/notification-dropdown"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { API_ENDPOINTS, SearchResponse, fetchPublic } from "@/lib/api"

interface NavItem {
  href: string
  icon: string
  label: string
}

const farmerNavItems: NavItem[] = [
]

const partnerNavItems: NavItem[] = [
  { href: "/partner", icon: "dashboard", label: "Dashboard" },
  { href: "/partner/earnings", icon: "account_balance_wallet", label: "Earnings" },
  { href: "/partner/settings", icon: "settings", label: "Settings" },
]

interface DesktopHeaderProps {
  variant?: "farmer" | "partner"
}

export function DesktopHeader({ variant = "farmer" }: DesktopHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const { t, lang } = useLanguage()
  const navItems = variant === "partner" ? partnerNavItems : farmerNavItems

  const [locationName, setLocationName] = useState<string>("India")
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const [hasPartnerAccount, setHasPartnerAccount] = useState<boolean>(false)
  const isPartnerView = pathname?.startsWith('/partner')

  useEffect(() => {
    if (isAuthenticated) {
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
      setHasPartnerAccount(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true)
        fetchPublic(API_ENDPOINTS.SEARCH(searchQuery.trim(), lang))
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
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetch("/api/auth/location")
        .then(res => res.json())
        .then(data => {
          if (data.has_location && data.location?.address) {
            setLocationName(data.location.address.split(',')[0])
          } else {
            setLocationName(t("location.set_location"))
          }
        })
        .catch(() => { })
    } else {
      setLocationName(t("location.set_location"))
    }
  }, [isAuthenticated])

  return (
    <header className="hidden lg:block sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link href={variant === "partner" ? "/partner" : "/"} className="size-10 bg-navy rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">agriculture</span>
            </Link>
            <div className="flex flex-col justify-center">
              <Link href={variant === "partner" ? "/partner" : "/"} className="text-xl font-bold text-navy leading-none tracking-tight">
                Farmo
              </Link>
              <span className="text-xs text-muted-foreground leading-none mt-0.5 max-w-[120px] truncate">{locationName}</span>
            </div>
          </div>


          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="w-[320px] relative" ref={dropdownRef}>
              <form onSubmit={handleSearchSubmit} className="relative flex items-center h-10 rounded-full bg-muted/30 border border-transparent hover:border-primary/20 focus-within:border-primary/50 focus-within:bg-background focus-within:shadow-sm transition-all overflow-hidden group">
                <div className="pl-3 pr-2 text-muted-foreground group-focus-within:text-primary transition-colors flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px] block">search</span>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { if (searchQuery.length >= 2) setIsDropdownOpen(true) }}
                  placeholder={t("header.search_placeholder_desktop")}
                  className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/70 h-full w-full"
                />
                {searchQuery && (
                   <button type="button" onClick={() => { setSearchQuery(''); setIsDropdownOpen(false); }} className="mr-2 size-6 shrink-0 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                      <span className="material-symbols-outlined text-[16px] block">close</span>
                   </button>
                )}
              </form>
              
              {/* Dropdown */}
              {isDropdownOpen && searchResults && (
                 <div className="absolute top-12 left-0 right-0 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-[400px] overflow-y-auto">
                   {/* Categories */}
                   {searchResults.categories?.length > 0 && (
                     <div className="p-2 border-b border-border/50">
                       <div className="text-[10px] font-bold text-muted-foreground px-2 py-1 uppercase tracking-wider">{t("common.categories")}</div>
                       {searchResults.categories.slice(0, 3).map(cat => (
                          <button key={cat.id} type="button" onClick={() => { setSearchQuery(cat.name); handleSearchSubmit(); }} className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 rounded-lg flex items-center gap-2 transition-colors">
                             <span className="material-symbols-outlined text-[18px] text-muted-foreground">category</span>
                             {cat.name}
                          </button>
                       ))}
                     </div>
                   )}
                   
                   {/* Services */}
                   {searchResults.services?.length > 0 ? (
                      <div className="p-2">
                         <div className="text-[10px] font-bold text-muted-foreground px-2 py-1 uppercase tracking-wider">{t("nav.services")}</div>
                         {searchResults.services.slice(0, 5).map(srv => (
                            <Link key={srv.id} href={`/booking/new/${srv.id}`} onClick={() => setIsDropdownOpen(false)} className="px-3 py-2 hover:bg-muted/50 rounded-lg flex gap-3 items-center transition-colors">
                               {srv.thumbnail ? (
                                 <img src={srv.thumbnail} alt={srv.title} className="w-10 h-10 rounded object-cover border border-border/50" />
                               ) : (
                                 <div className="w-10 h-10 rounded bg-muted flex items-center justify-center border border-border/50">
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
                      <div className="p-4 text-center text-sm text-muted-foreground">
                         {isSearching ? t("common.searching") : t("common.no_matching_services")}
                      </div>
                   )}
                   
                   {searchResults.total_services > 5 && (
                      <div className="p-2 border-t border-border/50 bg-muted/10">
                         <button type="button" onClick={() => handleSearchSubmit()} className="w-full py-2 text-sm text-primary font-bold hover:bg-primary/5 rounded-lg transition-colors">
                            {t("common.view_all_results").replace("{count}", String(searchResults.total_services))}
                         </button>
                      </div>
                   )}
                 </div>
              )}
            </div>
            {/* Notifications based on auth */}
            {isAuthenticated && (
              <div className="flex items-center gap-2">
                <NotificationDropdown />
                {hasPartnerAccount && (
                  <Link
                    href={isPartnerView ? "/profile" : "/partner"}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/40 hover:bg-muted font-medium text-xs text-muted-foreground hover:text-navy transition-colors border border-transparent hover:border-border"
                    title={isPartnerView ? t("header.switch_to_farmer") : t("header.switch_to_partner")}
                  >
                    <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                    {isPartnerView ? t("header.switch_farmer") : t("header.switch_partner")}
                  </Link>
                )}
              </div>
            )}

            {/* Profile or Login */}
            {isLoading ? (
              <div className="h-9 w-24 bg-muted animate-pulse rounded-full" />
            ) : isAuthenticated ? (
              <Link
                href="/profile"
                className="flex items-center gap-3 p-1.5 rounded-full bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-primary/20"
              >
                <Avatar className="size-8 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Button asChild variant="default" className="rounded-full px-6">
                <Link href="/auth">
                  {t("common.login")}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
