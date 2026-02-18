"use client"

import { useState } from "react"
import Link from "next/link"
import { PartnerLayout } from "@/components/partner-layout"
import { Switch } from "@/components/ui/switch"

interface SettingsItem { icon: string; label: string; description: string; href?: string; toggle?: boolean; defaultChecked?: boolean }
interface SettingsGroup { title: string; items: SettingsItem[] }

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
      { icon: "help", label: "Help Center", description: "FAQs and support articles", href: "/support" },
      { icon: "chat", label: "Contact Support", description: "Chat with our support team", href: "#" },
      { icon: "bug_report", label: "Report a Problem", description: "Let us know about issues", href: "#" },
    ],
  },
]

export default function SettingsPage() {
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({
    Notifications: true, "Location Services": true, "Dark Mode": false,
  })

  const handleToggle = (label: string) => {
    setToggleStates((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <PartnerLayout pageTitle="Settings">
      <div className="flex flex-col gap-6">
          {settingsGroups.map((group) => (
            <div key={group.title} className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="px-5 lg:px-6 py-4 border-b border-border"><h3 className="font-bold text-foreground">{group.title}</h3></div>
              <div className="divide-y divide-border">
                {group.items.map((item) => (
                  <div key={item.label}>
                    {item.toggle ? (
                      <div className="flex items-center justify-between px-5 lg:px-6 py-4 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-3 lg:gap-4">
                          <div className="size-9 lg:size-10 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground"><span className="material-symbols-outlined text-[18px] lg:text-[20px]">{item.icon}</span></div>
                          <div><p className="font-medium text-foreground">{item.label}</p><p className="text-xs text-muted">{item.description}</p></div>
                        </div>
                        <Switch checked={toggleStates[item.label]} onCheckedChange={() => handleToggle(item.label)} />
                      </div>
                    ) : (
                      <Link href={item.href || "#"} className="flex items-center justify-between px-5 lg:px-6 py-4 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-3 lg:gap-4">
                          <div className="size-9 lg:size-10 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground"><span className="material-symbols-outlined text-[18px] lg:text-[20px]">{item.icon}</span></div>
                          <div><p className="font-medium text-foreground">{item.label}</p><p className="text-xs text-muted">{item.description}</p></div>
                        </div>
                        <span className="material-symbols-outlined text-muted">chevron_right</span>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          
        </div>
    </PartnerLayout>
  )
}
