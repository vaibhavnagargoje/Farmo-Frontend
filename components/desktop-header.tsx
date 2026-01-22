"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

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
            {/* Location Selector */}
            {variant === "farmer" && (
              <button className="hidden xl:flex items-center gap-2 px-3 py-2 rounded-full bg-muted/30 hover:bg-muted/50 transition-colors">
                <span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
                <span className="text-sm font-medium">Rampur Village</span>
                <span className="material-symbols-outlined text-[16px] text-muted">expand_more</span>
              </button>
            )}

            {/* Notifications */}
            <button className="relative size-10 rounded-full bg-muted/30 hover:bg-muted/50 flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-2 right-2 size-2 bg-destructive rounded-full"></span>
            </button>

            {/* Profile */}
            <Link
              href={variant === "driver" ? "/driver/profile" : "/profile"}
              className="flex items-center gap-3 pl-3 pr-4 py-1.5 rounded-full bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="size-8 rounded-full overflow-hidden border-2 border-primary/20">
                <Image
                  src={variant === "driver" ? "/indian-tractor-driver-man-portrait.jpg" : "/indian-farmer-man-portrait-smiling.jpg"}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="object-cover"
                />
              </div>
              <span className="text-sm font-semibold hidden xl:block">
                {variant === "driver" ? "Driver" : "Rajesh Kumar"}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
