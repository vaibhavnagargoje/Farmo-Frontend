"use client"

import { createContext, useContext, useState, useRef, useCallback, type ReactNode } from "react"
import { useLanguage } from "@/contexts/language-context"

interface PermissionContextType {
  /** Show custom notification prompt. Resolves true if browser permission granted. */
  showNotificationPrompt: () => Promise<boolean>
  /** Check location permission & show custom prompt if undecided. */
  requestLocationPermission: () => Promise<"granted" | "denied" | "dismissed" | "already_granted">
  /** Show the location-denied recovery modal with steps to re-enable. */
  showLocationDeniedPrompt: () => void
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined)

export function usePermission() {
  const context = useContext(PermissionContext)
  if (context === undefined) {
    throw new Error("usePermission must be used within a PermissionProvider")
  }
  return context
}

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage()

  // ── Notification prompt state ──
  const [showNotif, setShowNotif] = useState(false)
  const notifResolveRef = useRef<((v: boolean) => void) | null>(null)

  // ── Location pre-prompt state ──
  const [showLocation, setShowLocation] = useState(false)
  const locationResolveRef = useRef<((v: "granted" | "denied" | "dismissed" | "already_granted") => void) | null>(null)

  // ── Location denied recovery state ──
  const [showDenied, setShowDenied] = useState(false)

  /* ═══════════════════════════════════════════
     NOTIFICATION
  ═══════════════════════════════════════════ */
  const showNotificationPrompt = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !("Notification" in window)) { resolve(false); return }
      if (Notification.permission === "granted") { resolve(true); return }
      if (Notification.permission === "denied") { resolve(false); return }
      notifResolveRef.current = resolve
      setShowNotif(true)
    })
  }, [])

  const handleNotifAllow = useCallback(async () => {
    setShowNotif(false)
    try {
      const permission = await Notification.requestPermission()
      notifResolveRef.current?.(permission === "granted")
    } catch { notifResolveRef.current?.(false) }
    notifResolveRef.current = null
  }, [])

  const handleNotifDismiss = useCallback(() => {
    setShowNotif(false)
    notifResolveRef.current?.(false)
    notifResolveRef.current = null
  }, [])

  /* ═══════════════════════════════════════════
     LOCATION PRE-PROMPT
  ═══════════════════════════════════════════ */
  const requestLocationPermission = useCallback((): Promise<"granted" | "denied" | "dismissed" | "already_granted"> => {
    return new Promise(async (resolve) => {
      if (typeof window === "undefined" || !("geolocation" in navigator)) { resolve("denied"); return }

      // Check current state via Permissions API
      try {
        if (navigator.permissions) {
          const result = await navigator.permissions.query({ name: "geolocation" })
          if (result.state === "granted") { resolve("already_granted"); return }
          if (result.state === "denied") { setShowDenied(true); resolve("denied"); return }
        }
      } catch { /* permissions API not supported – fall through to show prompt */ }

      locationResolveRef.current = resolve
      setShowLocation(true)
    })
  }, [])

  const handleLocationAllow = useCallback(() => {
    setShowLocation(false)
    locationResolveRef.current?.("granted")
    locationResolveRef.current = null
  }, [])

  const handleLocationDismiss = useCallback(() => {
    setShowLocation(false)
    locationResolveRef.current?.("dismissed")
    locationResolveRef.current = null
  }, [])

  /* ═══════════════════════════════════════════
     LOCATION DENIED RECOVERY
  ═══════════════════════════════════════════ */
  const showLocationDeniedPrompt = useCallback(() => { setShowDenied(true) }, [])
  const handleDeniedClose = useCallback(() => { setShowDenied(false) }, [])

  /* ═══════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════ */
  return (
    <PermissionContext.Provider value={{ showNotificationPrompt, requestLocationPermission, showLocationDeniedPrompt }}>
      {children}

      {/* ─── Notification Permission Prompt ─── */}
      {showNotif && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleNotifDismiss} />
          <div className="relative bg-card rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border border-border">
            {/* Gradient Header */}
            <div className="bg-gradient-to-br from-navy via-navy/95 to-primary/80 px-6 pt-8 pb-6 text-center relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/5 rounded-full blur-xl" />
              <div className="relative">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-4 shadow-lg border border-white/10">
                  <span className="material-symbols-outlined text-white text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>notifications_active</span>
                </div>
                <h2 className="text-xl font-bold text-white">{t("permission.notif_title")}</h2>
                <p className="text-white/70 text-sm mt-2 leading-relaxed">{t("permission.notif_desc")}</p>
              </div>
            </div>
            {/* Benefits */}
            <div className="px-6 py-5 space-y-3">
              {(["permission.notif_benefit_1", "permission.notif_benefit_2", "permission.notif_benefit_3"] as const).map((key, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-primary text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-snug">{t(key)}</p>
                </div>
              ))}
            </div>
            {/* CTA */}
            <div className="px-6 pb-6 space-y-2">
              <button onClick={handleNotifAllow} className="w-full py-3.5 bg-navy hover:bg-navy/95 text-white font-bold text-sm rounded-xl shadow-lg transition-all active:scale-[0.98]">
                {t("permission.notif_allow")}
              </button>
              <button onClick={handleNotifDismiss} className="w-full py-2.5 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
                {t("permission.notif_later")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Location Permission Prompt ─── */}
      {showLocation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleLocationDismiss} />
          <div className="relative bg-card rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border border-border">
            <div className="bg-gradient-to-br from-primary via-primary/95 to-navy/80 px-6 pt-8 pb-6 text-center relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/5 rounded-full blur-xl" />
              <div className="relative">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-4 shadow-lg border border-white/10">
                  <span className="material-symbols-outlined text-white text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                </div>
                <h2 className="text-xl font-bold text-white">{t("permission.location_title")}</h2>
                <p className="text-white/70 text-sm mt-2 leading-relaxed">{t("permission.location_desc")}</p>
              </div>
            </div>
            <div className="px-6 py-5 space-y-3">
              {(["permission.location_benefit_1", "permission.location_benefit_2"] as const).map((key, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-primary text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-snug">{t(key)}</p>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6 space-y-2">
              <button onClick={handleLocationAllow} className="w-full py-3.5 bg-primary hover:bg-primary/95 text-white font-bold text-sm rounded-xl shadow-lg transition-all active:scale-[0.98]">
                {t("permission.location_allow")}
              </button>
              <button onClick={handleLocationDismiss} className="w-full py-2.5 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
                {t("permission.location_later")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Location Denied Recovery ─── */}
      {showDenied && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleDeniedClose} />
          <div className="relative bg-card rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border border-border">
            <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500/80 px-6 pt-8 pb-6 text-center relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
              <div className="relative">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-4 shadow-lg border border-white/10">
                  <span className="material-symbols-outlined text-white text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>wrong_location</span>
                </div>
                <h2 className="text-xl font-bold text-white">{t("permission.location_denied_title")}</h2>
                <p className="text-white/80 text-sm mt-2 leading-relaxed">{t("permission.location_denied_desc")}</p>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              {[
                { num: 1, key: "permission.location_denied_step1" },
                { num: 2, key: "permission.location_denied_step2" },
                { num: 3, key: "permission.location_denied_step3" },
              ].map((step) => (
                <div key={step.num} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                    <span className="text-amber-600 text-xs font-bold">{step.num}</span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-snug pt-0.5">{t(step.key)}</p>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6">
              <button onClick={handleDeniedClose} className="w-full py-3.5 bg-navy hover:bg-navy/95 text-white font-bold text-sm rounded-xl shadow-lg transition-all active:scale-[0.98]">
                {t("permission.location_denied_ok")}
              </button>
            </div>
          </div>
        </div>
      )}
    </PermissionContext.Provider>
  )
}
