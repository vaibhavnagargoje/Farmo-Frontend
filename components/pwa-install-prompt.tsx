"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { useLanguage } from "@/contexts/language-context"
import { cn } from "@/lib/utils"

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e)
      
      // Check if we should show the prompt (e.g., if they haven't dismissed it recently)
      const hasDismissed = localStorage.getItem("farmo_pwa_dismissed")
      if (hasDismissed !== "true") {
        // Delay showing to not overwhelm the user immediately
        setTimeout(() => {
          setShowPrompt(true)
        }, 3000)
      }
    }

    // Listen for successful install
    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setShowPrompt(false)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === "accepted") {
      console.log("User accepted the install prompt")
    } else {
      console.log("User dismissed the install prompt")
    }
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Remember that the user dismissed it so we don't nag them again soon
    localStorage.setItem("farmo_pwa_dismissed", "true")
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="mx-auto max-w-md bg-navy rounded-2xl shadow-2xl p-4 flex flex-col gap-3 border border-white/10 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        
        <button 
          onClick={handleDismiss}
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center text-white/50 hover:text-white transition-colors rounded-full"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-inner shrink-0">
            <Image
              src="/farmo mobile logo.png"
              alt="Farmo"
              width={48}
              height={48}
              className="h-12 w-12 rounded-xl object-cover"
            />
          </div>
          <div>
            <h3 className="font-bold text-white text-[15px]">{t("pwa.install_title")}</h3>
            <p className="text-white/70 text-xs mt-0.5 leading-snug pr-4">
              {t("pwa.install_desc")}
            </p>
          </div>
        </div>

        <button
          onClick={handleInstallClick}
          className="w-full mt-1 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-sm rounded-xl shadow-md transition-transform active:scale-95"
        >
          {t("pwa.install_btn")}
        </button>
      </div>
    </div>
  )
}
