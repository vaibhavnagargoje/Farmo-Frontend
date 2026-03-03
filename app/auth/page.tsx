"use client"

import type React from "react"
import { useState, useRef, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { API_ENDPOINTS } from "@/lib/api"
import { cn } from "@/lib/utils"

type AuthStep = "phone" | "otp" | "register"

interface LocationOption {
  id: number
  name: string
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  )
}

function AuthPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { sendOtp, login, logout, refreshUser, isAuthenticated, isLoading: authLoading, user } = useAuth()

  const [step, setStep] = useState<AuthStep>("phone")
  const [countryCode] = useState("+91")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState(["", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devOtp, setDevOtp] = useState<string | null>(null)

  // Registration fields
  const [fullName, setFullName] = useState("")
  const [states, setStates] = useState<LocationOption[]>([])
  const [districts, setDistricts] = useState<LocationOption[]>([])
  const [tahsils, setTahsils] = useState<LocationOption[]>([])
  const [villages, setVillages] = useState<LocationOption[]>([])
  const [selectedState, setSelectedState] = useState("")
  const [selectedDistrict, setSelectedDistrict] = useState("")
  const [selectedTahsil, setSelectedTahsil] = useState("")
  const [selectedVillage, setSelectedVillage] = useState("")

  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (user && !user.first_name) {
        setStep("register")
      } else if (step !== "register") {
        const redirect = searchParams.get("redirect") || "/"
        router.push(redirect)
      }
    }
  }, [isAuthenticated, authLoading, router, searchParams, step, user])

  // Load states when reaching register step
  useEffect(() => {
    if (step === "register") {
      fetch(API_ENDPOINTS.STATES)
        .then((r) => r.json())
        .then((data: LocationOption[]) => setStates(data))
        .catch(() => {})
    }
  }, [step])

  // Load districts when state changes
  useEffect(() => {
    if (!selectedState) {
      setDistricts([]); setSelectedDistrict(""); setTahsils([]); setSelectedTahsil(""); setVillages([]); setSelectedVillage("")
      return
    }
    fetch(`${API_ENDPOINTS.DISTRICTS}?state_id=${selectedState}`)
      .then((r) => r.json())
      .then((data: LocationOption[]) => { setDistricts(data); setSelectedDistrict(""); setTahsils([]); setSelectedTahsil(""); setVillages([]); setSelectedVillage("") })
      .catch(() => {})
  }, [selectedState])

  // Load tahsils when district changes
  useEffect(() => {
    if (!selectedDistrict) { setTahsils([]); setSelectedTahsil(""); setVillages([]); setSelectedVillage(""); return }
    fetch(`${API_ENDPOINTS.TAHSILS}?district_id=${selectedDistrict}`)
      .then((r) => r.json())
      .then((data: LocationOption[]) => { setTahsils(data); setSelectedTahsil(""); setVillages([]); setSelectedVillage("") })
      .catch(() => {})
  }, [selectedDistrict])

  // Load villages when tahsil changes
  useEffect(() => {
    if (!selectedTahsil) { setVillages([]); setSelectedVillage(""); return }
    fetch(`${API_ENDPOINTS.VILLAGES}?tahsil_id=${selectedTahsil}`)
      .then((r) => r.json())
      .then((data: LocationOption[]) => { setVillages(data); setSelectedVillage("") })
      .catch(() => {})
  }, [selectedTahsil])

  const handleSendOtp = async () => {
    if (phone.length < 10) return
    setIsLoading(true)
    setError(null)
    setDevOtp(null)

    // Format phone number (remove country code if accidentally included)
    const cleanPhone = phone.replace(/\D/g, "").slice(-10)
    const fullPhone = cleanPhone

    const result = await sendOtp(fullPhone)

    setIsLoading(false)

    if (result.success) {
      if (result.otp) setDevOtp(result.otp)
      setStep("otp")
    } else {
      setError(result.error || "Failed to send OTP")
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    const v = value.replace(/\D/g, "").slice(-1)
    const newOtp = [...otp]
    newOtp[index] = v
    setOtp(newOtp)
    if (v && index < 3) otpRefs[index + 1].current?.focus()
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus()
    }
  }

  const handleVerifyOtp = async () => {
    const otpValue = otp.join("")
    if (otpValue.length !== 4) return

    setIsLoading(true)
    setError(null)

    const cleanPhone = phone.replace(/\D/g, "").slice(-10)
    const result = await login(cleanPhone, otpValue)

    setIsLoading(false)

    if (result.success) {
      if (result.isNewUser) {
        setStep("register")
      } else {
        router.push(searchParams.get("redirect") || "/")
      }
    } else {
      setError(result.error || "Invalid OTP")
    }
  }

  const handleRegister = async () => {
    if (!fullName.trim()) return
    setIsLoading(true)
    setError(null)
    const nameParts = fullName.trim().split(" ").filter(Boolean)
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ")
    const response = await fetch("/api/auth/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        state: selectedState ? Number(selectedState) : null,
        district: selectedDistrict ? Number(selectedDistrict) : null,
        tahsil: selectedTahsil ? Number(selectedTahsil) : null,
        village: selectedVillage ? Number(selectedVillage) : null,
      }),
    })
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setIsLoading(false)
      setError(data.message || "Failed to update profile")
      return
    }
    await refreshUser()
    setIsLoading(false)
    router.push(searchParams.get("redirect") || "/")
  }

  const handleResendOtp = async () => {
    setIsLoading(true)
    setError(null)
    const cleanPhone = phone.replace(/\D/g, "").slice(-10)
    const result = await sendOtp(cleanPhone)
    setIsLoading(false)
    if (result.success) {
      if (result.otp) setDevOtp(result.otp)
      setOtp(["", "", "", ""])
      otpRefs[0].current?.focus()
    } else {
      setError(result.error || "Failed to resend OTP")
    }
  }

  // Auto-focus first OTP input when step changes
  useEffect(() => {
    if (step === "otp") otpRefs[0].current?.focus()
  }, [step])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const stepIndex = step === "phone" ? 1 : step === "otp" ? 2 : 3

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* ─── Branded Header ──────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-navy shrink-0">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative px-5 pt-12 pb-8 flex flex-col items-center text-center">
          {step !== "phone" && (
            <button
              onClick={() => { 
                setError(null); 
                if (step === "register" && isAuthenticated) {
                  logout();
                } else {
                  setStep(step === "register" ? "otp" : "phone");
                }
              }}
              aria-label="Go back"
              className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
          )}

          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-3 shadow-lg">
            <span
              className="material-symbols-outlined text-primary text-[30px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              agriculture
            </span>
          </div>
          <h1 className="text-white text-xl font-bold tracking-tight leading-none">Farmo</h1>
          <p className="text-white/50 text-xs mt-1">Farm Services at your fingertips</p>

          
        </div>
      </div>

      {/* ─── Form Panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col -mt-4 min-h-0">
        <div className="flex-1 flex flex-col bg-card rounded-t-3xl shadow-2xl
                        px-5 pt-6 pb-8
                        md:max-w-md md:w-full md:mx-auto md:rounded-3xl md:mt-4 md:mb-8 md:flex-none
                        overflow-y-auto">

          {/* ── Alerts ─────────────────────────────────────────────── */}
          {error && (
            <div className="flex items-start gap-2.5 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl px-4 py-3 mb-4">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
              <span>{error}</span>
            </div>
          )}
          {devOtp && step === "otp" && (
            <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-xl px-4 py-3 mb-4">
              <span className="material-symbols-outlined text-[18px] shrink-0">bug_report</span>
              Dev OTP:&nbsp;<span className="font-mono font-bold tracking-widest">{devOtp}</span>
            </div>
          )}

          {/* ── STEP 1 : Phone ───────────────────────────────────────── */}
          {step === "phone" && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-foreground text-xl font-bold">Welcome back </h2>
                <p className="text-muted text-sm mt-1">Enter your mobile number to continue</p>
              </div>

              <div className="flex flex-col gap-1.5">
                
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 px-3 h-11 bg-background border border-border rounded-xl text-sm font-semibold text-foreground whitespace-nowrap shrink-0 select-none">
                    <span>{countryCode}</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    onKeyDown={(e) => e.key === "Enter" && phone.length === 10 && handleSendOtp()}
                    placeholder="98765 43210"
                    autoFocus
                    className="flex-1 min-w-0 px-4 h-11 rounded-xl bg-background border border-border text-sm font-medium placeholder:text-muted/50 focus:ring-2 focus:ring-primary/20 focus:border-primary/60 outline-none transition-all"
                  />
                </div>
                <p className="text-xs text-muted ml-0.5">We'll send a 4-digit OTP to this number</p>
              </div>

              <button
                onClick={handleSendOtp}
                disabled={phone.length < 10 || isLoading}
                className="w-full h-11 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-md shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /><span>Sending…</span></>
                ) : (
                  <><span>Send OTP</span><span className="material-symbols-outlined text-[18px]">arrow_forward</span></>
                )}
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-muted text-xs font-medium">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <button className="w-full h-11 flex items-center justify-center gap-2 text-navy text-sm font-semibold border border-border rounded-xl hover:bg-background active:scale-[0.98] transition-all">
                <span className="material-symbols-outlined text-[18px]">mail</span>
                Continue with Email
              </button>
            </div>
          )}

          {/* ── STEP 2 : OTP ─────────────────────────────────────────── */}
          {step === "otp" && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-foreground text-xl font-bold">Enter OTP</h2>
                <p className="text-muted text-sm mt-1">
                  Sent to{" "}
                  <span className="text-navy font-semibold tabular-nums">
                    {countryCode} {phone.replace(/(\d{5})(\d{5})/, "$1 $2")}
                  </span>
                </p>
              </div>

              <div className="flex gap-3 justify-between">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={otpRefs[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className={cn(
                      "w-full max-w-17 aspect-square text-center text-2xl font-bold rounded-xl border transition-all outline-none",
                      digit ? "border-navy bg-navy/5 text-navy" : "border-border bg-background text-foreground",
                      "focus:border-primary focus:ring-2 focus:ring-primary/20"
                    )}
                  />
                ))}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-muted">Didn't receive it?</span>
                <button
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-xs font-semibold text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
                >
                  Resend OTP
                </button>
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={otp.join("").length !== 4 || isLoading}
                className="w-full h-11 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-md shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /><span>Verifying…</span></>
                ) : (
                  <><span>Verify & Continue</span><span className="material-symbols-outlined text-[18px]">verified</span></>
                )}
              </button>
            </div>
          )}

          {/* ── STEP 3 : Register ──────────────────────────────────────── */}
          {step === "register" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-foreground text-xl font-bold">Complete your profile</h2>
                <p className="text-muted text-sm mt-1">A few details to personalise your experience</p>
              </div>

              {/* Full name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Kumar"
                  autoFocus
                  className="w-full px-4 h-11 rounded-xl bg-background border border-border text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/60 outline-none transition-all placeholder:text-muted/50"
                />
              </div>

              {/* Location section */}
              <div className="flex items-center gap-2 py-1">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted font-medium">Location (optional)</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* State */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">State</label>
                <div className="relative">
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="appearance-none w-full px-4 h-11 rounded-xl bg-background border border-border text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/60 outline-none transition-all cursor-pointer text-foreground"
                  >
                    <option value="">Select state…</option>
                    {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-muted text-[18px]">expand_more</span>
                </div>
              </div>

              {/* District */}
              <div className="flex flex-col gap-1.5">
                <label className={cn("text-sm font-semibold", !selectedState ? "text-muted" : "text-foreground")}>District</label>
                <div className="relative">
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    disabled={!selectedState || districts.length === 0}
                    className="appearance-none w-full px-4 h-11 rounded-xl bg-background border border-border text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/60 outline-none transition-all cursor-pointer text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <option value="">Select district…</option>
                    {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-muted text-[18px]">expand_more</span>
                </div>
              </div>

              {/* Tahsil */}
              <div className="flex flex-col gap-1.5">
                <label className={cn("text-sm font-semibold", !selectedDistrict ? "text-muted" : "text-foreground")}>Tahsil / Taluka</label>
                <div className="relative">
                  <select
                    value={selectedTahsil}
                    onChange={(e) => setSelectedTahsil(e.target.value)}
                    disabled={!selectedDistrict || tahsils.length === 0}
                    className="appearance-none w-full px-4 h-11 rounded-xl bg-background border border-border text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/60 outline-none transition-all cursor-pointer text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <option value="">Select tahsil…</option>
                    {tahsils.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-muted text-[18px]">expand_more</span>
                </div>
              </div>

              {/* Village */}
              <div className="flex flex-col gap-1.5">
                <label className={cn("text-sm font-semibold", !selectedTahsil ? "text-muted" : "text-foreground")}>Village</label>
                <div className="relative">
                  <select
                    value={selectedVillage}
                    onChange={(e) => setSelectedVillage(e.target.value)}
                    disabled={!selectedTahsil || villages.length === 0}
                    className="appearance-none w-full px-4 h-11 rounded-xl bg-background border border-border text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/60 outline-none transition-all cursor-pointer text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <option value="">Select village…</option>
                    {villages.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-muted text-[18px]">expand_more</span>
                </div>
              </div>

              <button
                onClick={handleRegister}
                disabled={!fullName.trim() || isLoading}
                className="w-full h-11 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-md shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-1"
              >
                {isLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /><span>Setting up…</span></>
                ) : (
                  <><span>Complete Setup</span><span className="material-symbols-outlined text-[18px]">check_circle</span></>
                )}
              </button>
            </div>
          )}

          {/* ── Terms footer ──────────────────────────────────────────── */}
          <p className="text-center text-muted text-xs leading-relaxed mt-auto pt-6">
            By continuing, you agree to our{" "}
            <a href="#" className="text-navy font-semibold hover:underline">Terms</a>
            {" & "}
            <a href="#" className="text-navy font-semibold hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
