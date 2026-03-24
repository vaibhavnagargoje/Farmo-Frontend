"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"

interface NavItem {
  href: string
  icon: string
  labelKey: string
  disabled?: boolean
}

const farmerNavItems: NavItem[] = [
  { href: "/", icon: "home", labelKey: "nav.home" },
  { href: "/search", icon: "search", labelKey: "nav.search" },
  { href: "/bookings", icon: "calendar_month", labelKey: "nav.bookings" },
  { href: "/profile", icon: "person", labelKey: "nav.profile" },
]

const partnerNavItems: NavItem[] = [
  { href: "/partner", icon: "dashboard", labelKey: "nav.dashboard" },
  { href: "/partner/services", icon: "construction", labelKey: "nav.services" },
  { href: "/partner/earnings", icon: "account_balance_wallet", labelKey: "nav.earnings", disabled: true },
  { href: "/partner/profile", icon: "person", labelKey: "nav.profile" },
]

interface BottomNavProps {
  variant?: "farmer" | "partner"
}

export function BottomNav({ variant = "farmer" }: BottomNavProps) {
  const pathname = usePathname()
  const { t } = useLanguage()
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
                href={item.disabled ? "#" : item.href}
                onClick={item.disabled ? (e) => { e.preventDefault(); alert(t("earnings.coming_soon")); } : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 w-16 transition-colors",
                  isActive ? "text-primary" : "text-muted hover:text-foreground",
                  item.disabled && "opacity-50 cursor-not-allowed"
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
                <span className={cn("text-[10px]", isActive ? "font-bold" : "font-medium")}>{t(item.labelKey)}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

