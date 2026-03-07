"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  icon: string
  label: string
}

const farmerNavItems: NavItem[] = [
  { href: "/", icon: "home", label: "Home" },
  { href: "/search", icon: "search", label: "Search" },
  { href: "/bookings", icon: "calendar_month", label: "Bookings" },
  { href: "/profile", icon: "person", label: "Profile" },
]

const partnerNavItems: NavItem[] = [
  { href: "/partner", icon: "dashboard", label: "Dashboard" },
  { href: "/partner/services", icon: "construction", label: "Services" },
  { href: "/partner/earnings", icon: "account_balance_wallet", label: "Earnings" },
  { href: "/partner/profile", icon: "person", label: "Profile" },
]

interface BottomNavProps {
  variant?: "farmer" | "partner"
}

export function BottomNav({ variant = "farmer" }: BottomNavProps) {
  const pathname = usePathname()
  const navItems = variant === "partner" ? partnerNavItems : farmerNavItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border pb-safe pt-2 px-6 z-50 max-w-md mx-auto shadow-[0_-5px_15px_rgba(0,0,0,0.05)] lg:hidden">
      <ul className="flex justify-between items-center h-16">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== "/" && item.href !== "/partner" && pathname.startsWith(item.href))

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 w-16 transition-colors",
                  isActive ? "text-primary" : "text-muted hover:text-foreground",
                )}
              >
                <div className={cn("px-4 py-1 rounded-full transition-colors", isActive && "bg-primary/10")}>
                  <span
                    className="material-symbols-outlined text-[24px]"
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                </div>
                <span className={cn("text-[10px]", isActive ? "font-bold" : "font-medium")}>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
