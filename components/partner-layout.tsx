"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { MobileHeader } from "@/components/mobile-header"
import { useAuth } from "@/contexts/auth-context"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

// Sidebar navigation items
const sidebarNavItems = [
    { icon: "dashboard", label: "Dashboard", href: "/partner", key: "dashboard" },
    { icon: "construction", label: "Manage Services", href: "/partner/services", key: "services" },
    { icon: "account_balance_wallet", label: "Earnings", href: "/partner/earnings", key: "earnings" },
    { icon: "person", label: "Profile", href: "/partner/profile", key: "profile" },
]

interface PartnerLayoutProps {
    children: React.ReactNode
    pageTitle?: string
}

export function PartnerLayout({ children, pageTitle = "Partner Dashboard" }: PartnerLayoutProps) {
    const router = useRouter()
    const pathname = usePathname()
    const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth()
    const [partnerName, setPartnerName] = useState("Partner")
    const [isOnline, setIsOnline] = useState(true)
    const [isLoadingProfile, setIsLoadingProfile] = useState(true)

    // Fetch partner profile data
    const fetchProfile = useCallback(async () => {
        if (!isAuthenticated) return
        try {
            const response = await fetch("/api/partner/onboarding", {
                method: "GET",
                credentials: "include",
            })
            if (response.ok) {
                const data = await response.json()
                if (data.user) {
                    const name = data.user.full_name || ""
                    setPartnerName(name || "Partner")
                }
                if (data.partner) {
                    setIsOnline(data.partner.is_available !== false)
                }
            }
        } catch (error) {
            console.error("Failed to fetch partner profile:", error)
        } finally {
            setIsLoadingProfile(false)
        }
    }, [isAuthenticated])

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            fetchProfile()
        } else if (!authLoading && !isAuthenticated) {
            setIsLoadingProfile(false)
        }
    }, [isAuthenticated, authLoading, fetchProfile])

    // Switch online status toggle to API


    const handleLogout = async () => {
        await logout()
        router.push("/")
    }

    const handleToggleOnline = async (checked: boolean) => {
        setIsOnline(checked)
        try {
            await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_available: checked }),
            })
        } catch (error) {
            console.error("Toggle error:", error)
            setIsOnline(!checked)
        }
    }

    // Check if a nav item is active
    const isActiveItem = (href: string) => {
        if (href === "/partner") return pathname === "/partner"
        return pathname.startsWith(href)
    }

    // Loading state
    if (authLoading || isLoadingProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    // Not authenticated
    if (!isAuthenticated) {
        router.push("/auth?redirect=/partner")
        return null
    }

    // ─── Sidebar Content ───
    const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
        <>
            {/* Logo */}
            <div className="h-20 flex items-center px-8 border-b border-gray-200/50">
                <Link href="/partner" className="flex items-center gap-3" onClick={onNavClick}>
                    <div className="w-9 h-9 bg-navy rounded-xl flex items-center justify-center text-white shadow-md">
                        <span className="material-symbols-outlined text-lg">agriculture</span>
                    </div>
                    <div>
                        <span className="font-bold text-xl tracking-tight text-navy">Farmo</span>
                        <span className="ml-1.5 text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">PARTNER</span>
                    </div>
                </Link>
            </div>

            {/* Profile Section */}
            <div className="px-6 py-6 flex flex-col items-center border-b border-gray-200/50">
                <div className="relative mb-3">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md">
                        <Image
                            src="/indian-tractor-driver-man-portrait.jpg"
                            alt="Partner Profile"
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <span className={cn(
                        "absolute bottom-0 right-0 w-4 h-4 rounded-full ring-2 ring-white",
                        isOnline ? "bg-green-500" : "bg-gray-400"
                    )}></span>
                </div>
                <h2 className="text-base font-bold text-foreground">{partnerName}</h2>

                {/* Online/Offline Toggle */}
                <div className="flex items-center gap-2 mt-2.5 px-3 py-1.5 bg-background rounded-full border border-border">
                    <Switch
                        checked={isOnline}
                        onCheckedChange={handleToggleOnline}
                        className="scale-90 data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300"
                    />
                    <span className={cn(
                        "text-xs font-bold",
                        isOnline ? "text-green-600" : "text-muted"
                    )}>
                        {isOnline ? "Online" : "Offline"}
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {sidebarNavItems.map((item) => {
                    const active = isActiveItem(item.href)
                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            onClick={onNavClick}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all group",
                                active
                                    ? "text-navy bg-white shadow-md"
                                    : "text-muted hover:bg-white hover:text-navy hover:shadow-md"
                            )}
                        >
                            <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">
                                {item.icon}
                            </span>
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            {/* Switch to Farmer + Logout */}
            <div className="p-4 border-t border-gray-200 space-y-1">
                <Link
                    href="/profile"
                    onClick={onNavClick}
                    className="flex items-center gap-3 px-4 py-3 w-full text-sm font-medium text-navy hover:bg-navy/5 rounded-xl transition-colors"
                >
                    <span className="material-symbols-outlined text-xl">swap_horiz</span>
                    Switch to Farmer
                </Link>
                <button
                    onClick={() => {
                        onNavClick?.()
                        handleLogout()
                    }}
                    className="flex items-center gap-3 px-4 py-3 w-full text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                    <span className="material-symbols-outlined text-xl rotate-180">logout</span>
                    Log Out
                </button>
            </div>
        </>
    )

    return (
        <div className="min-h-screen flex flex-col">
            {/* ═══ MOBILE LAYOUT ═══ */}
            <div className="lg:hidden flex flex-col min-h-screen pb-24">
                <MobileHeader />

                <div className="sticky top-16 z-40 bg-card/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
                    <h1 className="text-base font-bold text-foreground">{pageTitle}</h1>
                    <div className="flex items-center gap-1.5 ml-auto">
                        <span className={cn(
                            "w-2 h-2 rounded-full",
                            isOnline ? "bg-green-500" : "bg-gray-400"
                        )}></span>
                        <span className={cn(
                            "text-xs font-bold",
                            isOnline ? "text-green-600" : "text-muted"
                        )}>
                            {isOnline ? "Online" : "Offline"}
                        </span>
                    </div>
                </div>

                {/* Mobile Content */}
                <main className="flex-1 px-4 py-5">
                    {children}
                </main>

                <BottomNav variant="partner" />
            </div>

            {/* ═══ DESKTOP LAYOUT ═══ */}
            <div className="hidden lg:flex h-screen overflow-hidden">
                {/* Desktop Sidebar */}
                <aside className="w-72 bg-[#F3F4F6] h-screen flex flex-col flex-shrink-0 border-r border-gray-200">
                    <SidebarContent />
                </aside>

                {/* Desktop Main */}
                <main className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
                    {/* Desktop Header Bar */}
                    <header className="h-20 flex items-center justify-between px-8 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                        <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
                        <div className="flex items-center gap-4">
                            <div className="hidden xl:flex relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-gray-400 text-lg">search</span>
                                </span>
                                <input
                                    className="block w-64 pl-10 pr-4 py-2 border-none rounded-full bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20 placeholder-gray-400 transition-all hover:bg-gray-100"
                                    placeholder="Search..."
                                    type="text"
                                />
                            </div>
                            <Link href="/partner/profile" className="p-2 rounded-full hover:bg-gray-50 transition-colors text-gray-400">
                                <span className="material-symbols-outlined">person</span>
                            </Link>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200">
                                <Switch
                                    checked={isOnline}
                                    onCheckedChange={handleToggleOnline}
                                    className="scale-90 data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300"
                                />
                                <span className={cn(
                                    "text-xs font-bold",
                                    isOnline ? "text-green-600" : "text-muted"
                                )}>
                                    {isOnline ? "Online" : "Offline"}
                                </span>
                            </div>
                        </div>
                    </header>

                    {/* Desktop Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-8">
                        <div className="max-w-5xl mx-auto">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
