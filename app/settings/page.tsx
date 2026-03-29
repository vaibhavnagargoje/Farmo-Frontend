"use client"

import { useState } from "react"
import { AccountLayout } from "@/components/account-layout"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"

export default function SettingsPage() {
    const { lang, setLang } = useLanguage()
    const { logout } = useAuth()
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)

    const handleDeleteAccount = async () => {
        setIsDeleting(true)
        try {
            // Send request to delete account if API available
            await fetch("/api/auth/delete-account", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include"
            });
            
            // Regardless of response locally, trigger logout to drop session
            await logout();
        } catch (error) {
            console.error("Delete account error:", error)
        } finally {
            setIsDeleting(false)
            setShowDeleteModal(false)
        }
    }

    return (
        <AccountLayout pageTitle="Settings">
            <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                    <h2 className="text-xl lg:text-2xl font-bold text-foreground">Settings</h2>
                    <p className="text-sm text-muted mt-1">Manage your account preferences</p>
                </div>

                <div className="bg-card rounded-2xl border border-border p-5 lg:p-8 space-y-6 shadow-sm">
                    <div className="flex items-center gap-3 pb-4 border-b border-border">
                        <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl text-navy">tune</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Account Preferences</h3>
                            <p className="text-xs text-muted">Customize your experience and manage data</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {/* Notification Preferences */}
                        <div className="flex items-center justify-between py-4 group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                    <span className="material-symbols-outlined text-blue-600">notifications_active</span>
                                </div>
                                <div>
                                    <p className="font-medium text-foreground text-sm">Push Notifications</p>
                                    <p className="text-xs text-muted mt-0.5">Receive alerts for bookings and updates</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                            </label>
                        </div>

                        {/* Language */}
                        <div className="flex items-center justify-between py-4 border-t border-border group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                                    <span className="material-symbols-outlined text-emerald-600">language</span>
                                </div>
                                <div>
                                    <p className="font-medium text-foreground text-sm">Language</p>
                                    <p className="text-xs text-muted mt-0.5">Choose your preferred language</p>
                                </div>
                            </div>
                            <select 
                                className="px-4 py-2.5 rounded-xl bg-background border border-border text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20 hover:bg-muted/30 transition-colors cursor-pointer"
                                value={lang}
                                onChange={(e) => setLang(e.target.value as "en" | "mr")}
                            >
                                <option value="en">English</option>
                                <option value="mr">मराठी</option>
                            </select>
                        </div>
                        
                        {/* Delete Account */}
                        <div className="flex items-center justify-between py-4 border-t border-border mt-4 group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                                    <span className="material-symbols-outlined text-red-600">delete_forever</span>
                                </div>
                                <div>
                                    <p className="font-medium text-red-600 text-sm">Delete Account</p>
                                    <p className="text-xs text-muted mt-0.5">Permanently remove your account and data</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowDeleteModal(true)}
                                className="px-5 py-2.5 border-2 border-red-500/20 text-red-600 bg-red-50 font-semibold rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 transition-all text-sm whitespace-nowrap active:scale-95"
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                        onClick={() => !isDeleting && setShowDeleteModal(false)}
                    ></div>
                    <div className="relative bg-card w-full max-w-sm rounded-3xl p-6 md:p-8 shadow-2xl border border-border/50 animate-in zoom-in-95 fade-in duration-200">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-2 relative">
                                <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></div>
                                <span className="material-symbols-outlined text-4xl relative z-10">warning</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-foreground">Delete Account completely?</h3>
                                <p className="text-sm text-muted mt-3 leading-relaxed">
                                    This action is <span className="font-semibold text-foreground">irreversible</span>. 
                                    All your bookings, personal data, and preferences will be permanently wiped from our secure servers.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3 w-full mt-6 pt-2">
                                <button
                                    onClick={handleDeleteAccount}
                                    className="w-full py-3.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all flex items-center justify-center shadow-lg shadow-red-500/30 active:scale-95"
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        "Yes, delete my account"
                                    )}
                                </button>
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="w-full py-3.5 rounded-xl bg-muted/50 text-foreground font-semibold hover:bg-muted transition-all active:scale-95"
                                    disabled={isDeleting}
                                >
                                    Cancel, keep account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AccountLayout>
    )
}
