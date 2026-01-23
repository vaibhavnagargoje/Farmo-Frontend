"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { NotificationDropdown } from "@/components/notification-dropdown"
import { useAuth } from "@/contexts/auth-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface NavItem {
  href: string
  icon: string
  label: string
}

const farmerNavItems: NavItem[] = [
  { href: "/", icon: "home", label: "Home" },
  { href: "/search", icon: "search", label: "Search Equipment" },
  { href: "/bookings", icon: "calendar_month", label: "My Bookings" },
]

const driverNavItems: NavItem[] = [
  { href: "/driver", icon: "dashboard", label: "Dashboard" },
  { href: "/driver/earnings", icon: "account_balance_wallet", label: "Earnings" },
  { href: "/driver/settings", icon: "settings", label: "Settings" },
]

interface DesktopHeaderProps {
  variant?: "farmer" | "driver"
}

export function DesktopHeader({ variant = "farmer" }: DesktopHeaderProps) {
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading } = useAuth()
  const navItems = variant === "driver" ? driverNavItems : farmerNavItems

  return (
    <header className="hidden lg:block sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={variant === "driver" ? "/driver" : "/"} className="flex items-center gap-3">
            <div className="size-10 bg-navy rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">agriculture</span>
            </div>
            <span className="text-xl font-bold text-navy tracking-tight">My Farmo</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && item.href !== "/driver" && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Notifications based on auth */}
            {isAuthenticated && <NotificationDropdown variant={variant} />}

            {/* Profile or Login */}
            {isLoading ? (
               <div className="h-9 w-24 bg-muted animate-pulse rounded-full" />
            ) : isAuthenticated ? (
              <Link
                href={variant === "driver" ? "/driver/profile" : "/profile"}
                className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-primary/20"
              >
                <Avatar className="size-8 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {user?.first_name ? user.first_name.charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex flex-col items-start gap-0.5">
                    <span className="text-sm font-semibold leading-none">
                        {user?.first_name || "User"}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-none">
                        View Profile
                    </span>
                </div>
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
