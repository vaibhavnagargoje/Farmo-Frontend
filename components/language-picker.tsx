"use client"

import { useLanguage } from "@/contexts/language-context"

export function LanguagePicker() {
  const { showPicker, setLang, t } = useLanguage()

  if (!showPicker) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card rounded-2xl shadow-2xl border border-border w-[320px] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-6 pt-8 pb-4 text-center">
          <div className="size-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              translate
            </span>
          </div>
          <h2 className="text-lg font-bold text-foreground">
            {t("language.choose")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            तुमची भाषा निवडा
          </p>
        </div>

        {/* Language Options */}
        <div className="px-6 pb-8 space-y-3">
          <button
            onClick={() => setLang("en")}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all active:scale-[0.98]"
          >
            
            <div className="text-left flex-1">
              <p className="font-semibold text-foreground">English</p>
              <p className="text-xs text-muted-foreground">Continue in English</p>
            </div>
            <span className="material-symbols-outlined text-muted-foreground text-[20px]">chevron_right</span>
          </button>

          <button
            onClick={() => setLang("mr")}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all active:scale-[0.98]"
          >
          
            <div className="text-left flex-1">
              <p className="font-semibold text-foreground">मराठी</p>
              <p className="text-xs text-muted-foreground">मराठीत सुरू ठेवा</p>
            </div>
            <span className="material-symbols-outlined text-muted-foreground text-[20px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  )
}
