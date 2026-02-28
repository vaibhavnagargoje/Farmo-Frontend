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

// Sidebar navigation items
const sidebarNavItems = [
    { icon: "person", label: "Profile", href: "/profile", key: "profile" },
    { icon: "calendar_today", label: "My Bookings", href: "/bookings", key: "bookings" },
    { icon: "settings", label: "Settings", href: "/settings", key: "settings" },
    { icon: "headset_mic", label: "Help & Support", href: "/support", key: "support" },
    { icon: "notifications", label: "Notifications", href: "/notifications", key: "notifications" },
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
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

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

    // Close sidebar on escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsMobileSidebarOpen(false)
        }
        window.addEventListener("keydown", handleEsc)
        return () => window.removeEventListener("keydown", handleEsc)
    }, [])

    // Lock body scroll when mobile sidebar is open
    useEffect(() => {
        if (isMobileSidebarOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = ""
        }
        return () => { document.body.style.overflow = "" }
    }, [isMobileSidebarOpen])

    // Close sidebar on route change
    useEffect(() => {
        setIsMobileSidebarOpen(false)
    }, [pathname])

    const handleLogout = async () => {
        await logout()
        router.push("/")
    }

    const displayName = user
        ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Farmer"
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
    if (!isAuthenticated) {
        router.push("/auth?redirect=/profile")
        return null
    }

    // ─── Sidebar Content ───
    const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
        <>
            {/* Logo */}
            <div className="h-20 flex items-center px-8 border-b border-gray-200/50">
                <Link href="/" className="flex items-center gap-3" onClick={onNavClick}>
                    <div className="w-9 h-9 bg-navy rounded-xl flex items-center justify-center text-white shadow-md">
                        <span className="material-symbols-outlined text-lg">agriculture</span>
                    </div>
                    <span className="font-bold text-xl tracking-tight text-navy">Farmo</span>
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

                {/* Mobile Top Bar with Menu Button */}
                <div className="sticky top-16 z-40 bg-card/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
                    <button
                        onClick={() => setIsMobileSidebarOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-muted/30 transition-colors"
                    >
                        <span className="material-symbols-outlined text-foreground">menu</span>
                        <span className="text-sm font-semibold text-foreground">Menu</span>
                    </button>
                    <h1 className="text-base font-bold text-foreground">{pageTitle}</h1>
                    <button className="p-2 rounded-full hover:bg-muted/30 transition-colors text-muted">
                        <span className="material-symbols-outlined text-xl">notifications</span>
                    </button>
                </div>

                {/* Mobile Slide-Out Sidebar */}
                {isMobileSidebarOpen && (
                    <div className="fixed inset-0 z-[100] flex">
                        <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
                            onClick={() => setIsMobileSidebarOpen(false)}
                        />
                        <div className="relative w-[280px] max-w-[80vw] bg-card h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
                            <button
                                onClick={() => setIsMobileSidebarOpen(false)}
                                className="absolute top-5 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-muted/20 hover:bg-muted/40 transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg text-foreground">close</span>
                            </button>
                            <SidebarContent onNavClick={() => setIsMobileSidebarOpen(false)} />
                        </div>
                    </div>
                )}

                {/* Mobile Content */}
                <main className="flex-1 px-4 py-5">
                    {children}
                </main>

                <BottomNav variant="farmer" />
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
                                    placeholder="Search settings..."
                                    type="text"
                                />
                            </div>
                            <Link href="/notifications" className="p-2 rounded-full hover:bg-gray-50 transition-colors text-gray-400">
                                <span className="material-symbols-outlined">notifications</span>
                            </Link>
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
