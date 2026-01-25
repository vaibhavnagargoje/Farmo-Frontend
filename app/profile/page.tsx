"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { DesktopHeader } from "@/components/desktop-header"
import { MobileHeader } from "@/components/mobile-header"
import { useAuth } from "@/contexts/auth-context"
import type { PartnerProfile } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

const menuItems = [
  {
    icon: "calendar_month",
    label: "My Bookings",
    href: "/bookings",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    description: "View and manage your equipment rentals",
  },
  {
    icon: "support_agent",
    label: "Help & Support",
    href: "/support",
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
    description: "Get help with your bookings and account",
  },
  {
    icon: "language",
    label: "Language",
    subtitle: "English (US)",
    href: "/settings/language",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    description: "Change your preferred language",
  },
  {
    icon: "notifications",
    label: "Notifications",
    href: "/settings/notifications",
    iconBg: "bg-yellow-50",
    iconColor: "text-yellow-600",
    description: "Manage your notification preferences",
  },
  {
    icon: "security",
    label: "Privacy & Security",
    href: "/settings/privacy",
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
    description: "Manage your account security settings",
  },
]

export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated, logout, refreshUser } = useAuth()
  const [partner, setPartner] = useState<PartnerProfile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const { toast } = useToast()

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    address: "",
  })

  // Update form when data available
  useEffect(() => {
    if (user) {
      setEditForm((prev) => ({
        ...prev,
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        // If user is not a partner, maybe we want to show address here if we had it
      }))
    }
    if (partner) {
      setEditForm((prev) => ({
        ...prev,
        address: partner.base_city || "",
      }))
    }
  }, [user, partner])

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) {
        throw new Error("Failed to update")
      }

      const data = await response.json()
      
      // Refresh context
      await refreshUser()
      
      // Update local partner state if returned
      if (data.partner) {
        setPartner(data.partner)
      }

      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully.",
      })
      setIsEditOpen(false)
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

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

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  // Get display name from user or partner data
  const displayName = user
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Farmer"
    : "Farmer"
  const location = partner?.base_city || "India"
  const totalBookings = partner?.jobs_completed || 0
  const rating = partner?.rating ? parseFloat(partner.rating) : 0

  // Show loading state
  if (authLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // If not authenticated, redirect to auth page
  if (!isAuthenticated) {
    router.push("/auth?redirect=/profile")
    return null
  }
  return (
    <div className="min-h-screen flex flex-col pb-24 lg:pb-0">
      {/* Desktop Header */}
      <DesktopHeader variant="farmer" />
      <MobileHeader />

      {/* Mobile Navy Header */}
      <header className="bg-navy rounded-b-[2.5rem] pt-14 pb-12 px-6 shadow-lg relative overflow-hidden z-10 lg:hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full -ml-12 -mb-12 blur-2xl pointer-events-none"></div>

        <div className="relative flex flex-col items-center gap-5 z-10">
          {/* Profile Avatar */}
          <div className="relative group cursor-pointer">
            <div className="w-28 h-28 rounded-full p-1 bg-white/10 backdrop-blur-sm">
              <Image
                src="/indian-farmer-man-portrait-smiling.jpg"
                alt="Profile picture"
                width={112}
                height={112}
                className="w-full h-full object-cover rounded-full border-2 border-white/20"
              />
            </div>
            <button 
              onClick={() => setIsEditOpen(true)}
              className="absolute bottom-1 right-1 bg-primary text-white p-2 rounded-full shadow-lg hover:bg-white hover:text-primary transition-colors duration-200 border-2 border-navy flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
          </div>

          {/* User Info */}
          <div className="text-center space-y-1">
            <h1 className="text-white text-2xl font-bold tracking-tight">{displayName}</h1>
            <div className="flex items-center justify-center gap-1.5 text-white/60 text-sm font-medium">
              <span className="material-symbols-outlined text-[16px]">location_on</span>
              <span></span>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Layout */}
      <div className="hidden lg:block max-w-7xl mx-auto w-full px-6 py-8">
        <div className="flex flex-col gap-8">
          {/* Top Banner - Monetization CTA */}
          <div className="w-full bg-primary rounded-2xl px-8 py-6 text-white shadow-lg shadow-primary/30 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-32 pointer-events-none transition-transform group-hover:scale-110 duration-500"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="hidden md:block p-3 bg-white/20 rounded-xl">
                    <span className="material-symbols-outlined text-[32px] text-white">agriculture</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold leading-tight">Earn with your Tractor</h2>
                  <p className="text-white/90 text-sm font-medium opacity-90 mt-1">
                    List your equipment for rent today and start earning extra income.
                  </p>
                </div>
              </div>
              <Link
                href="/partner/onboarding"
                className="inline-flex bg-white text-primary hover:bg-gray-50 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-transform active:scale-95 items-center gap-2"
              >
                <span>List Your Service</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 items-start">
            {/* Left Sidebar - Profile Card */}
            <div className="col-span-1">
              <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group cursor-pointer">
                    <div className="w-32 h-32 rounded-full p-1 bg-navy/10">
                      <Image
                        src="/indian-farmer-man-portrait-smiling.jpg"
                        alt="Profile picture"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover rounded-full border-2 border-navy/20"
                      />
                    </div>
                    <button 
                      onClick={() => setIsEditOpen(true)}
                      className="absolute bottom-2 right-2 bg-primary text-white p-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                  </div>
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
                    <div className="flex items-center justify-center gap-1.5 text-muted text-sm font-medium mt-1">
                      <span className="material-symbols-outlined text-[16px]">location_on</span>
                      <span>{location}</span>
                    </div>
                  </div>
                  <div className="w-full pt-4 border-t border-border">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-navy">{totalBookings}</p>
                        <p className="text-xs text-muted">Bookings</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-primary">{rating > 0 ? rating.toFixed(1) : "N/A"}</p>
                        <p className="text-xs text-muted">Rating</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content - Settings */}
            <div className="col-span-2 flex flex-col gap-6">
              {/* Settings Grid */}
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4">Account Settings</h2>
                <div className="grid grid-cols-2 gap-4">
                  {menuItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-start gap-4 p-5 bg-card rounded-xl border border-border hover:shadow-lg transition-all group"
                    >
                      <div
                        className={`w-12 h-12 rounded-xl ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
                      >
                        <span className="material-symbols-outlined">{item.icon}</span>
                      </div>
                      <div className="flex-1">
                        <span className="text-foreground font-semibold block">{item.label}</span>
                        {item.subtitle && <span className="text-xs text-primary font-medium">{item.subtitle}</span>}
                        <p className="text-xs text-muted mt-1">{item.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Log Out */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-4 w-fit px-6 py-3 bg-transparent rounded-xl hover:bg-destructive/5 transition-colors group mt-4"
              >
                <div className="w-10 h-10 rounded-full bg-muted/20 text-muted flex items-center justify-center group-hover:bg-destructive/10 group-hover:text-destructive transition-colors">
                  <span className="material-symbols-outlined">logout</span>
                </div>
                <span className="text-muted font-medium group-hover:text-destructive transition-colors">
                  Log Out
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Main Content */}
      <main className="flex-1 px-5 pt-6 flex flex-col gap-8 lg:hidden">
        {/* Monetization CTA */}
        <div className="bg-primary rounded-2xl p-6 text-white shadow-lg shadow-primary/30 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8 pointer-events-none transition-transform group-hover:scale-110 duration-500"></div>
          <div className="relative z-10 flex flex-col gap-5">
            <div className="space-y-2">
              <h2 className="text-xl font-bold leading-tight">Earn with your Tractor</h2>
              <p className="text-white/90 text-sm font-medium opacity-90 leading-relaxed max-w-[80%]">
                List your equipment for rent today and start earning extra income.
              </p>
            </div>
            <div className="flex justify-start">
              <Link
                href="/partner/onboarding"
                className="bg-white text-primary hover:bg-background-soft active:bg-gray-100 px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-transform active:scale-95 flex items-center gap-2"
              >
                <span>List Your Service</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex flex-col gap-5">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-between w-full p-4 bg-card rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.99] group"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full ${item.iconBg} ${item.iconColor} flex items-center justify-center group-hover:opacity-80 transition-opacity`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-foreground text-base font-semibold">{item.label}</span>
                  {item.subtitle && <span className="text-xs text-muted">{item.subtitle}</span>}
                </div>
              </div>
              <span className="material-symbols-outlined text-muted group-hover:text-primary transition-colors">
                chevron_right
              </span>
            </Link>
          ))}

          {/* Log Out */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-between w-full p-4 bg-transparent rounded-xl hover:bg-destructive/5 transition-colors group mt-2"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-muted/20 text-muted flex items-center justify-center group-hover:bg-destructive/10 group-hover:text-destructive transition-colors">
                <span className="material-symbols-outlined">logout</span>
              </div>
              <span className="text-muted text-base font-medium group-hover:text-destructive transition-colors">
                Log Out
              </span>
            </div>
          </button>
        </div>
      </main>

      <BottomNav variant="farmer" />

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={editForm.first_name}
                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={editForm.last_name}
                onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="address">Location / Village</Label>
              <Input
                id="address"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                placeholder="e.g. Pune, Maharashtra"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
