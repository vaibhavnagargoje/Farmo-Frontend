"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { DesktopHeader } from "@/components/desktop-header"
import { MobileHeader } from "@/components/mobile-header"

import { BottomNav } from "@/components/bottom-nav"
import { Switch } from "@/components/ui/switch"

interface SettingsItem {
  icon: string
  label: string
  description: string
  href?: string
  toggle?: boolean
  defaultChecked?: boolean
}

interface SettingsGroup {
  title: string
  items: SettingsItem[]
}

const settingsGroups: SettingsGroup[] = [
  {
    title: "Account",
    items: [
      { icon: "person", label: "Personal Information", description: "Update your name, phone, and email", href: "#" },
      { icon: "badge", label: "KYC Documents", description: "Manage your identity documents", href: "/partner/onboarding" },
      { icon: "agriculture", label: "Vehicle Details", description: "Update your tractor information", href: "#" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { icon: "notifications", label: "Notifications", description: "Manage push and SMS notifications", toggle: true, defaultChecked: true },
      { icon: "location_on", label: "Location Services", description: "Allow location tracking for jobs", toggle: true, defaultChecked: true },
      { icon: "dark_mode", label: "Dark Mode", description: "Switch between light and dark theme", toggle: true, defaultChecked: false },
    ],
  },
  {
    title: "Payment",
    items: [
      { icon: "account_balance", label: "Bank Account", description: "HDFC Bank ****4521", href: "#" },
      { icon: "receipt_long", label: "Payment History", description: "View all transactions", href: "/partner/earnings" },
      { icon: "request_quote", label: "Tax Documents", description: "Download tax statements", href: "#" },
    ],
  },
  {
    title: "Support",
    items: [
      { icon: "help", label: "Help Center", description: "FAQs and support articles", href: "#" },
      { icon: "chat", label: "Contact Support", description: "Chat with our support team", href: "#" },
      { icon: "bug_report", label: "Report a Problem", description: "Let us know about issues", href: "#" },
    ],
  },
]

export default function SettingsPage() {
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({
    Notifications: true,
    "Location Services": true,
    "Dark Mode": false,
  })

  const handleToggle = (label: string) => {
    setToggleStates((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <div className="min-h-screen flex flex-col pb-24 lg:pb-0 bg-background">
      {/* Desktop Header */}
      <DesktopHeader variant="partner" />
      <MobileHeader />

      {/* Mobile Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm pt-12 pb-4 px-6 border-b border-border lg:hidden">
        <div className="flex items-center gap-4">
          <Link
            href="/partner"
            className="size-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground shadow-sm"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
        </div>
      </header>

      {/* Desktop Layout */}
      <div className="hidden lg:block max-w-5xl mx-auto w-full px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted mt-1">Manage your account and preferences</p>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="col-span-1">
            <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="size-24 rounded-full overflow-hidden border-2 border-primary/20">
                    <Image
                      src="/indian-tractor-driver-man-portrait.jpg"
                      alt="Profile"
                      width={96}
                      height={96}
                      className="object-cover"
                    />
                  </div>
                  <button className="absolute bottom-0 right-0 size-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                </div>
                <div className="text-center">
                  <h2 className="font-bold text-lg text-foreground">Suresh Sharma</h2>
                  <p className="text-sm text-muted">+91 98765 43210</p>
                </div>
                <div className="w-full pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Member since</span>
                    <span className="font-medium">Jan 2024</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-muted">Verification</span>
                    <span className="flex items-center gap-1 text-success font-medium">
                      <span className="material-symbols-outlined text-[14px]">verified</span>
                      Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Settings List */}
          <div className="col-span-2 flex flex-col gap-6">
            {settingsGroups.map((group) => (
              <div key={group.title} className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="font-bold text-foreground">{group.title}</h3>
                </div>
                <div className="divide-y divide-border">
                  {group.items.map((item) => (
                    <div key={item.label}>
                      {item.toggle ? (
                        <div className="flex items-center justify-between px-6 py-4 hover:bg-muted/20 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="size-10 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground">
                              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{item.label}</p>
                              <p className="text-xs text-muted">{item.description}</p>
                            </div>
                          </div>
                          <Switch
                            checked={toggleStates[item.label]}
                            onCheckedChange={() => handleToggle(item.label)}
                          />
                        </div>
                      ) : (
                        <Link
                          href={item.href || "#"}
                          className="flex items-center justify-between px-6 py-4 hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="size-10 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground">
                              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{item.label}</p>
                              <p className="text-xs text-muted">{item.description}</p>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-muted">chevron_right</span>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Logout */}
            <button className="flex items-center gap-4 px-6 py-4 text-destructive hover:bg-destructive/5 rounded-2xl transition-colors">
              <div className="size-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </div>
              <span className="font-medium">Log Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Content */}
      <main className="flex-1 px-4 py-6 flex flex-col gap-6 lg:hidden">
        {/* Profile Card */}
        <div className="bg-card rounded-2xl p-5 border border-border flex items-center gap-4">
          <div className="relative">
            <div className="size-16 rounded-full overflow-hidden border-2 border-primary/20">
              <Image
                src="/indian-tractor-driver-man-portrait.jpg"
                alt="Profile"
                width={64}
                height={64}
                className="object-cover"
              />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-lg text-foreground">Suresh Sharma</h2>
            <p className="text-sm text-muted">+91 98765 43210</p>
          </div>
          <button className="size-10 rounded-full bg-muted/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">edit</span>
          </button>
        </div>

        {/* Settings Groups */}
        {settingsGroups.map((group) => (
          <div key={group.title}>
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3 px-1">{group.title}</h3>
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {group.items.map((item, index) => (
                <div key={item.label}>
                  {item.toggle ? (
                    <div className={`flex items-center justify-between px-4 py-4 ${index > 0 ? "border-t border-border" : ""}`}>
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground">
                          <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                        </div>
                        <span className="font-medium text-foreground">{item.label}</span>
                      </div>
                      <Switch
                        checked={toggleStates[item.label]}
                        onCheckedChange={() => handleToggle(item.label)}
                      />
                    </div>
                  ) : (
                    <Link
                      href={item.href || "#"}
                      className={`flex items-center justify-between px-4 py-4 ${index > 0 ? "border-t border-border" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground">
                          <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                        </div>
                        <span className="font-medium text-foreground">{item.label}</span>
                      </div>
                      <span className="material-symbols-outlined text-muted">chevron_right</span>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        <button className="flex items-center gap-3 px-4 py-4 text-destructive">
          <div className="size-9 rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </div>
          <span className="font-medium">Log Out</span>
        </button>
      </main>

      <BottomNav variant="partner" />
    </div>
  )
}
