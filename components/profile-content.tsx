"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import type { PartnerProfile } from "@/lib/api"
import Image from "next/image"
import { useRouter } from "next/navigation"

const getProfileMenuItems = (t: (key: string) => string) => [
    {
        icon: "settings",
        label: t("profile.settings"),
        description: t("profile.settings_desc"),
        href: "/settings",
    },
    {
        icon: "notifications",
        label: t("profile.notifications"),
        description: t("profile.notifications_desc"),
        href: "/notifications",
    },
]

export function ProfileContent({ isPartnerView = false }: { isPartnerView?: boolean }) {
    const { user, isAuthenticated, isLoading: authLoading, logout, updateUser } = useAuth()
    const { t } = useLanguage()
    const [partner, setPartner] = useState<PartnerProfile | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editName, setEditName] = useState("")
    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
    const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
    const [profileError, setProfileError] = useState("")
    const [isSavingProfile, setIsSavingProfile] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    
    const profileMenuItems = getProfileMenuItems(t)

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

    const handleLogout = async () => {
        await logout()
        router.push("/")
    }

    useEffect(() => {
        return () => {
            if (photoPreviewUrl?.startsWith("blob:")) {
                URL.revokeObjectURL(photoPreviewUrl)
            }
        }
    }, [photoPreviewUrl])

    const openEditModal = () => {
        setEditName(user?.full_name || "")
        setSelectedPhoto(null)
        setPhotoPreviewUrl(user?.profile_picture || null)
        setProfileError("")
        setIsEditModalOpen(true)
    }

    const closeEditModal = () => {
        setIsEditModalOpen(false)
        setSelectedPhoto(null)
        setPhotoPreviewUrl(null)
        setProfileError("")
    }

    const handlePhotoChange = (event: any) => {
        const file = event?.target?.files?.[0] as File | undefined
        if (!file) {
            return
        }

        if (!file.type.startsWith("image/")) {
            setProfileError(t("profile.photo_type_invalid"))
            return
        }

        const maxSizeBytes = 5 * 1024 * 1024
        if (file.size > maxSizeBytes) {
            setProfileError(t("profile.photo_too_large"))
            return
        }

        if (photoPreviewUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(photoPreviewUrl)
        }

        setSelectedPhoto(file)
        setPhotoPreviewUrl(URL.createObjectURL(file))
        setProfileError("")
    }

    const handleSaveProfile = async () => {
        const fullName = editName.trim()
        if (!fullName) {
            setProfileError(t("auth.register.full_name"))
            return
        }

        setIsSavingProfile(true)
        setProfileError("")

        try {
            let response: Response

            if (selectedPhoto) {
                const formData = new FormData()
                formData.append("full_name", fullName)
                formData.append("profile_picture", selectedPhoto)

                response = await fetch("/api/profile", {
                    method: "PATCH",
                    credentials: "include",
                    body: formData,
                })
            } else {
                response = await fetch("/api/profile", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ full_name: fullName }),
                })
            }

            const data = await response.json()

            if (!response.ok) {
                setProfileError(data?.message || t("profile.update_failed"))
                return
            }

            if (data?.user) {
                updateUser(data.user)
            }

            closeEditModal()
        } catch (error) {
            console.error("Failed to update profile:", error)
            setProfileError(t("profile.update_failed"))
        } finally {
            setIsSavingProfile(false)
        }
    }

    return (
        <>
            {/* Mobile Profile Card */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-card rounded-2xl border border-border shadow-sm">
                <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md bg-navy flex items-center justify-center text-white text-2xl font-bold">
                        {user?.profile_picture ? (
                            <Image
                                src={user.profile_picture}
                                alt="Profile Picture"
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"
                        )}
                    </div>
                    {/* Active dot omitted since user wants simple portrait */}
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-base font-bold text-foreground truncate">{user?.full_name || "User"}</h2>
                    <div className="flex items-center gap-1 text-muted text-xs mt-0.5">
                        <span className="material-symbols-outlined text-[13px]">call</span>
                        <span>{user?.phone_number || "—"}</span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={openEditModal}
                    className="p-2 rounded-full hover:bg-muted/20 transition-colors text-muted"
                >
                    <span className="material-symbols-outlined text-xl">edit</span>
                </button>
            </div>

            <div className="space-y-6 lg:space-y-8">
                {/* Become a Partner CTA — only shown for non-partner users on the farmer profile */}
                {!isPartnerView && !partner && (
                    <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl bg-linear-to-r from-navy to-[#2a6dc0] shadow-xl group">
                        <div className="absolute -right-16 -top-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
                        <div className="absolute left-10 -bottom-10 w-40 h-40 bg-blue-300 opacity-20 rounded-full blur-2xl"></div>
                        <div className="relative p-6 md:p-8 lg:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/10">
                                        {t("profile.join_as_partner")}
                                    </span>
                                </div>
                                <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2 leading-tight">
                                    {t("profile.become_partner")}
                                </h2>
                                <p className="text-blue-100 text-sm lg:text-base max-w-lg leading-relaxed opacity-90">
                                    {t("profile.become_partner_desc")}
                                </p>
                            </div>
                            <Link
                                href="/partner/onboarding"
                                className="px-5 py-2.5 lg:px-6 lg:py-3 bg-white text-navy font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-blue-50 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 text-sm lg:text-base whitespace-nowrap"
                            >
                                {t("profile.get_started")}
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </Link>
                        </div>
                    </div>
                )}

                {/* Menu Items — Settings, Help & Support, Notifications */}
                <div>
                    <h3 className="text-lg font-bold text-foreground mb-4">{t("profile.account")}</h3>
                    <div className="flex flex-col gap-3">
                        {profileMenuItems.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
                            >
                                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                    <span className="material-symbols-outlined text-primary text-xl">{item.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-foreground text-sm">{item.label}</p>
                                    <p className="text-xs text-muted mt-0.5">{item.description}</p>
                                </div>
                                <span className="material-symbols-outlined text-muted text-lg group-hover:text-primary transition-colors">chevron_right</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Logout Button */}
                <div className="lg:hidden">
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 w-full py-3.5 bg-red-50 text-red-600 font-semibold rounded-2xl border border-red-100 hover:bg-red-100 transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl rotate-180">logout</span>
                        {t("profile.log_out")}
                    </button>
                </div>

                {/* Need Help Card */}
                <div className="bg-orange-50 rounded-2xl p-5 lg:p-6 border border-orange-100">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="material-symbols-outlined text-orange-600">help_outline</span>
                        <h3 className="font-bold text-orange-900">{t("profile.need_help")}</h3>
                    </div>
                    <p className="text-sm text-orange-800/80 mb-4 leading-relaxed">
                        {t("profile.need_help_desc")}
                    </p>
                    <Link
                        href="/support"
                        className="block w-full py-2.5 bg-white text-orange-600 font-medium text-sm rounded-lg shadow-sm hover:bg-orange-50 transition-colors border border-orange-200 text-center"
                    >
                        {t("profile.contact_support")}
                    </Link>
                </div>

                {/* Footer Links */}
                <div className="flex items-center justify-center gap-4 pt-2 pb-6 text-xs text-muted">
                    <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
                    <span>•</span>
                    <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                </div>
            </div >

            {isEditModalOpen && (
                <div className="fixed inset-0 z-80 flex items-center justify-center p-4">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={closeEditModal}
                    />

                    <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-foreground">{t("profile.edit_profile")}</h3>
                            <button
                                type="button"
                                className="size-8 rounded-full hover:bg-muted/30 text-muted-foreground"
                                onClick={closeEditModal}
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md bg-navy flex items-center justify-center text-white text-2xl font-bold">
                                {photoPreviewUrl ? (
                                    <Image
                                        src={photoPreviewUrl}
                                        alt="Profile Picture Preview"
                                        width={64}
                                        height={64}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    editName?.charAt(0)?.toUpperCase() || "U"
                                )}
                            </div>

                            <div className="flex-1">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-base">photo_camera</span>
                                    {t("profile.change_photo")}
                                </button>
                                <p className="text-xs text-muted mt-2">{t("profile.photo_hint")}</p>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                                onChange={handlePhotoChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">{t("auth.register.full_name")}</label>
                            <input
                                type="text"
                                value={editName}
                                onChange={(event) => {
                                    setEditName(event.target.value)
                                    setProfileError("")
                                }}
                                placeholder={t("auth.register.name_placeholder")}
                                className="w-full h-11 px-3 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        {profileError && (
                            <p className="text-sm text-red-600">{profileError}</p>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-1">
                            <button
                                type="button"
                                onClick={closeEditModal}
                                className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/20 transition-colors"
                            >
                                {t("common.cancel")}
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveProfile}
                                disabled={isSavingProfile}
                                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-70 transition-colors"
                            >
                                {isSavingProfile ? t("common.saving") : t("common.save")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
