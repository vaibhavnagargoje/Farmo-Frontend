"use client"

import { useState } from "react"
import { AccountLayout } from "@/components/account-layout"
import { cn } from "@/lib/utils"

// Settings sections
const settingsSections = [
    {
        id: "profile",
        icon: "manage_accounts",
        title: "Profile Details",
        description: "Manage your personal information",
    },
    {
        id: "security",
        icon: "lock",
        title: "Security",
        description: "Password and authentication settings",
    },
    {
        id: "preferences",
        icon: "tune",
        title: "Preferences",
        description: "Notifications, language, and display",
    },
]

export default function SettingsPage() {
    const [activeSection, setActiveSection] = useState("profile")

    return (
        <AccountLayout pageTitle="Settings">
            <div className="space-y-6">
                {/* Settings Header */}
                <div>
                    <h2 className="text-xl lg:text-2xl font-bold text-foreground">Settings</h2>
                    <p className="text-sm text-muted mt-1">Manage your account preferences</p>
                </div>

                {/* Section Tabs */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {settingsSections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all",
                                activeSection === section.id
                                    ? "bg-navy text-white shadow-md"
                                    : "bg-card text-foreground border border-border hover:bg-muted/50"
                            )}
                        >
                            <span className="material-symbols-outlined text-lg">{section.icon}</span>
                            {section.title}
                        </button>
                    ))}
                </div>

                {/* Profile Details */}
                {activeSection === "profile" && (
                    <div className="bg-card rounded-2xl border border-border p-5 lg:p-8 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-border">
                            <span className="material-symbols-outlined text-2xl text-navy">manage_accounts</span>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Profile Details</h3>
                                <p className="text-xs text-muted">Update your personal information</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="text-sm font-medium text-foreground block mb-2">First Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter first name"
                                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground block mb-2">Last Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter last name"
                                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground block mb-2">Email Address</label>
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground block mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    placeholder="+91 XXXXX XXXXX"
                                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                                    disabled
                                />
                                <p className="text-xs text-muted mt-1">Phone number cannot be changed</p>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="text-sm font-medium text-foreground block mb-2">Location</label>
                                <input
                                    type="text"
                                    placeholder="Enter your city"
                                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors text-sm">
                                Save Changes
                            </button>
                        </div>
                    </div>
                )}

                {/* Security */}
                {activeSection === "security" && (
                    <div className="space-y-4">
                        <div className="bg-card rounded-2xl border border-border p-5 lg:p-8 space-y-6">
                            <div className="flex items-center gap-3 pb-4 border-b border-border">
                                <span className="material-symbols-outlined text-2xl text-navy">lock</span>
                                <div>
                                    <h3 className="text-lg font-bold text-foreground">Change Password</h3>
                                    <p className="text-xs text-muted">Update your account password</p>
                                </div>
                            </div>

                            <div className="space-y-4 max-w-md">
                                <div>
                                    <label className="text-sm font-medium text-foreground block mb-2">Current Password</label>
                                    <input
                                        type="password"
                                        placeholder="Enter current password"
                                        className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-foreground block mb-2">New Password</label>
                                    <input
                                        type="password"
                                        placeholder="Enter new password"
                                        className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-foreground block mb-2">Confirm New Password</label>
                                    <input
                                        type="password"
                                        placeholder="Confirm new password"
                                        className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                                    />
                                </div>
                                <div className="pt-2">
                                    <button className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors text-sm">
                                        Update Password
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 2FA Section */}
                        <div className="bg-card rounded-2xl border border-border p-5 lg:p-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-2xl">verified_user</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground">Two-Factor Authentication</h3>
                                        <p className="text-xs text-muted mt-0.5">Add an extra layer of security to your account</p>
                                    </div>
                                </div>
                                <button className="px-4 py-2 border border-border text-foreground font-medium rounded-xl hover:bg-muted/30 transition-colors text-sm">
                                    Enable
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Preferences */}
                {activeSection === "preferences" && (
                    <div className="bg-card rounded-2xl border border-border p-5 lg:p-8 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-border">
                            <span className="material-symbols-outlined text-2xl text-navy">tune</span>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Preferences</h3>
                                <p className="text-xs text-muted">Customize your experience</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {/* Notification Preferences */}
                            <div className="flex items-center justify-between py-3">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-muted">notifications_active</span>
                                    <div>
                                        <p className="font-medium text-foreground text-sm">Push Notifications</p>
                                        <p className="text-xs text-muted">Receive alerts for bookings and updates</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" defaultChecked className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between py-3 border-t border-border">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-muted">email</span>
                                    <div>
                                        <p className="font-medium text-foreground text-sm">Email Notifications</p>
                                        <p className="text-xs text-muted">Booking confirmations and receipts via email</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" defaultChecked className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between py-3 border-t border-border">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-muted">sms</span>
                                    <div>
                                        <p className="font-medium text-foreground text-sm">SMS Alerts</p>
                                        <p className="text-xs text-muted">Text updates for booking status changes</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                </label>
                            </div>

                            {/* Language */}
                            <div className="flex items-center justify-between py-3 border-t border-border">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-muted">language</span>
                                    <div>
                                        <p className="font-medium text-foreground text-sm">Language</p>
                                        <p className="text-xs text-muted">Choose your preferred language</p>
                                    </div>
                                </div>
                                <select className="px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20">
                                    <option>English</option>
                                    <option>हिंदी</option>
                                    <option>मराठी</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AccountLayout>
    )
}
