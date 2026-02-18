"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AccountLayout } from "@/components/account-layout"
import { useAuth } from "@/contexts/auth-context"
import type { PartnerProfile } from "@/lib/api"
import { cn } from "@/lib/utils"
import Image from "next/image"

// Quick settings cards
const quickSettings = [
  {
    icon: "manage_accounts",
    label: "Profile Details",
    description: "Update name, email & location",
    href: "/settings",
  },
  {
    icon: "lock",
    label: "Security",
    description: "Password & 2FA",
    href: "/settings",
  },
]

// Mock recent bookings
const recentBookings = [
  {
    id: 1,
    name: "John Deere 5050D",
    type: "Rental",
    date: "Oct 24, 2023",
    status: "Completed",
    statusColor: "bg-green-100 text-green-700",
    price: "₹2,400",
    priceLabel: "Paid",
    icon: "agriculture",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    id: 2,
    name: "Rotavator 6ft",
    type: "Rental",
    date: "Nov 02, 2023",
    status: "Upcoming",
    statusColor: "bg-blue-100 text-blue-700",
    price: "₹800",
    priceLabel: "Pending",
    icon: "hardware",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
]

export default function ProfilePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [partner, setPartner] = useState<PartnerProfile | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
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
      }
    }
    if (!authLoading && isAuthenticated) {
      fetchProfile()
    }
  }, [isAuthenticated, authLoading])

  return (
    <AccountLayout pageTitle="Account Settings">
      {/* Mobile Profile Card */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-card rounded-2xl border border-border shadow-sm lg:hidden">
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md">
            <Image
              src="/indian-farmer-man-portrait-smiling.jpg"
              alt="Profile Picture"
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-success rounded-full ring-2 ring-card"></span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-foreground truncate">Welcome back!</h2>
          <div className="flex items-center gap-1 text-muted text-xs mt-0.5">
            <span className="material-symbols-outlined text-[13px]">location_on</span>
            <span>India</span>
          </div>
        </div>
        <button className="p-2 rounded-full hover:bg-muted/20 transition-colors text-muted">
          <span className="material-symbols-outlined text-xl">edit</span>
        </button>
      </div>

      <div className="space-y-6 lg:space-y-8">
        {/* Partner Dashboard Banner */}
        <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-r from-navy to-[#2a6dc0] shadow-xl group">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
          <div className="absolute left-10 bottom-[-40px] w-40 h-40 bg-blue-300 opacity-20 rounded-full blur-2xl"></div>
          <div className="relative p-6 md:p-8 lg:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/10">
                  {partner ? "Partner Access" : "Join as Partner"}
                </span>
                {partner && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                )}
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2 leading-tight">
                {partner ? "Partner Dashboard" : "Become a Partner"}
              </h2>
              <p className="text-blue-100 text-sm lg:text-base max-w-lg leading-relaxed opacity-90">
                {partner
                  ? "Switch to partner view to manage your equipment listings, track earnings, and respond to bookings instantly."
                  : "List your equipment and start earning extra income by renting out your farm machinery."}
              </p>
            </div>
            <Link
              href={partner ? "/partner" : "/partner/onboarding"}
              className="px-5 py-2.5 lg:px-6 lg:py-3 bg-white text-navy font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-blue-50 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 text-sm lg:text-base whitespace-nowrap"
            >
              {partner ? "Go to Dashboard" : "Get Started"}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Grid: Bookings + Sidebar Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left: Bookings + Quick Settings */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Recent Bookings</h3>
              <Link href="/bookings" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                View All
              </Link>
            </div>

            {recentBookings.map((booking) => (
              <Link
                key={booking.id}
                href="/bookings"
                className="block bg-card rounded-2xl p-4 lg:p-5 border border-border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className={cn("w-12 h-12 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center flex-shrink-0", booking.iconBg, booking.iconColor)}>
                    <span className="material-symbols-outlined text-xl lg:text-2xl">{booking.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-foreground truncate text-sm lg:text-base">{booking.name}</h4>
                      <span className={cn("text-xs font-medium px-2 py-1 rounded-full ml-2 whitespace-nowrap", booking.statusColor)}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-xs lg:text-sm text-muted truncate">
                      {booking.type} • {booking.date}
                    </p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="font-bold text-foreground text-sm lg:text-base">{booking.price}</p>
                    <p className="text-xs text-muted">{booking.priceLabel}</p>
                  </div>
                </div>
              </Link>
            ))}

            {/* Quick Settings */}
            <div className="pt-2 lg:pt-4">
              <h3 className="text-lg font-bold text-foreground mb-4">Quick Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                {quickSettings.map((setting) => (
                  <Link
                    key={setting.label}
                    href={setting.href}
                    className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="material-symbols-outlined text-muted group-hover:text-primary transition-colors">
                        {setting.icon}
                      </span>
                      <span className="font-semibold text-foreground text-sm">{setting.label}</span>
                    </div>
                    <p className="text-xs text-muted pl-9">{setting.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Impact + Help */}
          <div className="space-y-6">
            <div className="bg-background rounded-2xl p-5 lg:p-6 border border-border">
              <h3 className="font-bold text-foreground mb-4">Your Impact</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted">Total Spending</span>
                    <span className="font-bold text-foreground">₹12,400</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-navy h-2 rounded-full transition-all duration-1000" style={{ width: "70%" }}></div>
                  </div>
                </div>
                <div className="pt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted">Bookings this month</span>
                    <span className="font-bold text-foreground">4</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full transition-all duration-1000" style={{ width: "45%" }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 rounded-2xl p-5 lg:p-6 border border-orange-100">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-orange-600">help_outline</span>
                <h3 className="font-bold text-orange-900">Need Help?</h3>
              </div>
              <p className="text-sm text-orange-800/80 mb-4 leading-relaxed">
                Having trouble with a recent booking? Our support team is here for you 24/7.
              </p>
              <Link
                href="/support"
                className="block w-full py-2.5 bg-white text-orange-600 font-medium text-sm rounded-lg shadow-sm hover:bg-orange-50 transition-colors border border-orange-200 text-center"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AccountLayout>
  )
}
