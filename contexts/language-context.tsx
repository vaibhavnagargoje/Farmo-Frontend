"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import enTranslations from "@/lib/translations/en.json"
import mrTranslations from "@/lib/translations/mr.json"

type Language = "en" | "mr"
type Translations = Record<string, string>

const translationMap: Record<Language, Translations> = {
  en: enTranslations,
  mr: mrTranslations,
}

interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: string) => string
  showPicker: boolean
  setShowPicker: (show: boolean) => void
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
  showPicker: false,
  setShowPicker: () => {},
})

export function useLanguage() {
  return useContext(LanguageContext)
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en")
  const [showPicker, setShowPicker] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load language from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("farmo_lang") as Language | null
    if (stored && (stored === "en" || stored === "mr")) {
      setLangState(stored)
    } else {
      // First visit — show language picker
      setShowPicker(true)
    }
    setIsInitialized(true)
  }, [])

  // Set language and persist
  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang)
    localStorage.setItem("farmo_lang", newLang)
    setShowPicker(false)

    // Sync to backend (fire-and-forget)
    fetch("/api/auth/language", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: newLang }),
    }).catch(() => {})
  }, [])

  // Translation function
  const t = useCallback(
    (key: string): string => {
      return translationMap[lang]?.[key] || translationMap.en[key] || key
    },
    [lang]
  )

  // Don't render children until language is loaded (prevents flash)
  if (!isInitialized) return null

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, showPicker, setShowPicker }}>
      {children}
    </LanguageContext.Provider>
  )
}
