"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { MobileHeader } from "@/components/mobile-header"
import { useAuth } from "@/contexts/auth-context"
import type { PartnerProfile } from "@/lib/api"
import { cn } from "@/lib/utils"

// Sidebar navigation items (desktop only)
const sidebarNavItems = [
    { icon: "person", label: "Profile", href: "/profile", key: "profile" },
    { icon: "calendar_today", label: "My Bookings", href: "/bookings", key: "bookings" },
]

interface AccountLayoutProps {
    children: React.ReactNode
    pageTitle?: string
}

export function AccountLayout({ children, pageTitle = "Account Settings" }: AccountLayoutProps) {
    const router = useRouter()
    const pathname = usePathname()
    const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth()
    const [partner, setPartner] = useState<PartnerProfile | null>(null)
    const [isLoadingProfile, setIsLoadingProfile] = useState(true)


    // Fetch partner profile data
    useEffect(() => {
        const fetchProfile = async () => {
            if (!isAuthenticated) return
            try {
                const response = await fetch("/api/profile", {
                    method: "GET",
                    credentials: "include",
                })
                if (response.ok) {
                    const data = await response.json()
                    setPartner(data.partner)
                }
            } catch (error) {
                console.error("Failed to fetch profile:", error)
            } finally {
                setIsLoadingProfile(false)
            }
        }

        if (!authLoading && isAuthenticated) {
            fetchProfile()
        } else if (!authLoading && !isAuthenticated) {
            setIsLoadingProfile(false)
        }
    }, [isAuthenticated, authLoading])

    // Redirect unauthenticated users (must be in useEffect, not during render)
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push(`/auth?redirect=${pathname}`)
        }
    }, [authLoading, isAuthenticated, router, pathname])



    const handleLogout = async () => {
        await logout()
        router.push("/")
    }

    const displayName = user
        ? user.full_name || "Farmer"
        : "Farmer"

    // Loading state
    if (authLoading || isLoadingProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    // Not authenticated
    // Not authenticated — useEffect above handles the redirect
    if (!isAuthenticated) {
        return null
    }

    // ─── Sidebar Content ───
    const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
        <>
            {/* Logo */}
            <div className="h-20 flex items-center px-8 border-b border-gray-200/50">
                <Link href="/" className="flex items-center gap-3" onClick={onNavClick}>
                    <Image
                        src="/farmo-logo.png"
                        alt="Farmo"
                        width={150}
                        height={44}
                        className="h-8 w-auto object-contain"
                        priority
                    />
                </Link>
            </div>

            {/* Profile Section */}
            <div className="px-6 py-8 flex flex-col items-center border-b border-gray-200/50">
                <div className="relative mb-3 group">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md group-hover:shadow-lg transition-all duration-300">
                        <Image
                            src="/indian-farmer-man-portrait-smiling.jpg"
                            alt="Profile Picture"
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <button className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-500 hover:text-primary transition-colors border border-gray-100">
                        <span className="material-symbols-outlined text-xs">edit</span>
                    </button>
                </div>
                <h2 className="text-base font-bold text-foreground">{displayName}</h2>

            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {sidebarNavItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            onClick={onNavClick}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all group",
                                isActive
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

            {/* Logout */}
            <div className="p-4 border-t border-gray-200">
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

                {/* Mobile Title Bar */}
                <div className="sticky top-16 z-40 bg-card/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-center">
                    <h1 className="text-base font-bold text-foreground">{pageTitle}</h1>
                </div>

                {/* Mobile Content */}
                <main className="flex-1 px-4 py-5">
                    {children}
                </main>

                <BottomNav variant="farmer" />
            </div>

            {/* ═══ DESKTOP LAYOUT ═══ */}
            <div className="hidden lg:flex h-screen overflow-hidden">
                {/* Desktop Sidebar */}
                <aside className="w-72 bg-[#F3F4F6] h-screen flex flex-col shrink-0 border-r border-gray-200">
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
                                    placeholder="Search settings..."
                                    type="text"
                                />
                            </div>
                            <Link href="/notifications" className="p-2 rounded-full hover:bg-gray-50 transition-colors text-gray-400">
                                <span className="material-symbols-outlined">notifications</span>
                            </Link>
                            {partner && (
                                <Link href="/partner" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 font-medium text-xs text-gray-600 hover:text-navy transition-colors border border-transparent">
                                    <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                                    Partner
                                </Link>
                            )}
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
