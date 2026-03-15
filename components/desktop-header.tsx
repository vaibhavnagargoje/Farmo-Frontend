"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { NotificationDropdown } from "@/components/notification-dropdown"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

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
  const { user, isAuthenticated, isLoading } = useAuth()
  const navItems = variant === "partner" ? partnerNavItems : farmerNavItems

  const [locationName, setLocationName] = useState<string>("India")

  useEffect(() => {
    if (isAuthenticated) {
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
    } else {
      setLocationName("Set your location")
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
            <div className="w-[280px]">
              <div className="relative flex items-center h-10 rounded-full bg-muted/30 border border-transparent hover:border-primary/20 focus-within:border-primary/50 focus-within:bg-background focus-within:shadow-sm transition-all overflow-hidden group">
                <div className="pl-3 pr-2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </div>
                <input
                  type="text"
                  placeholder="Search for tractors..."
                  className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/70 h-full w-full"
                />
                <button className="mr-1 p-1.5 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[18px]">tune</span>
                </button>
              </div>
            </div>
            {/* Notifications based on auth */}
            {isAuthenticated && <NotificationDropdown />}

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
                  Login
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
