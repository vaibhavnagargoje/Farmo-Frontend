"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { APIProvider } from "@vis.gl/react-google-maps"
import { PlacesAutocomplete } from "@/components/PlacesAutocomplete"
import { signInWithGoogle } from "@/lib/firebase"

type AuthStep = "phone" | "method" | "otp" | "register"

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
  const { sendOtp, login, googleLogin, logout, updateUser, isAuthenticated, isLoading: authLoading, user } = useAuth()
  const { t } = useLanguage()

  const [step, setStep] = useState<AuthStep>("phone")
  const [countryCode] = useState("+91")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState(["", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Registration fields
  const [fullName, setFullName] = useState("")

  // Location state
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [userAddress, setUserAddress] = useState<string>("")

  // Ref to prevent redirect useEffect from racing with handleVerifyOtp
  const isVerifyingRef = useRef(false)
  // Ref to prevent redirect useEffect from racing with handleRegister
  const isRegisteringRef = useRef(false)
  // Ref to prevent OTP auto-submit race condition
  const isOtpSubmittingRef = useRef(false)
  const errorRef = useRef<HTMLDivElement>(null)

  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  // Redirect if already authenticated (skip when OTP verification or registration is in flight)
  // Let this single useEffect handle all successful auth navigation
  useEffect(() => {
    if (isVerifyingRef.current || isRegisteringRef.current) return

    // If step is already register (e.g., from new user Google login), don't redirect them away.
    // They must finish the address step.
    if (step === "register") {
      // If Google provided a name, pre-fill it
      if (user?.full_name && !fullName) {
        setFullName(user.full_name)
      }
      return
    }

    if (!authLoading && isAuthenticated) {
      if (user && !user.full_name) {
        setStep("register")
      } else {
        // User is authenticated and has a full name. They should be redirected no matter what step they are on.
        const redirect = searchParams.get("redirect") || "/"
        router.push(redirect)
      }
    }
  }, [isAuthenticated, authLoading, router, searchParams, user, step, fullName])

  // Scroll to error when it changes
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [error])

  const handlePhoneSubmit = () => {
    const isValidPhone = /^[6-9]\d{9}$/.test(phone)
    if (!isValidPhone) {
      setError(phone.length < 10 ? t("auth.phone.enter_first") : t("auth.phone.invalid"))
      return
    }
    setError(null)
    setStep("method")
  }

  const handleSendOtp = async () => {
    const isValidPhone = /^[6-9]\d{9}$/.test(phone)
    if (!isValidPhone || !email.trim()) return
    setIsLoading(true)
    setError(null)

    // Format phone number (remove country code if accidentally included)
    const cleanPhone = phone.replace(/\D/g, "").slice(-10)
    const fullPhone = cleanPhone

    const result = await sendOtp(fullPhone, email.trim())

    setIsLoading(false)

    if (result.success) {
      setStep("otp")
    } else {
      setError(result.error || "Failed to send OTP")
    }
  }

  const handleGoogleLogin = async () => {
    const isValidPhone = /^[6-9]\d{9}$/.test(phone)
    if (!isValidPhone) {
      setError(phone.length < 10 ? t("auth.phone.enter_first") : t("auth.phone.invalid"))
      return
    }
    setIsLoading(true)
    setError(null)

    try {
      const idToken = await signInWithGoogle()
      if (!idToken) {
        // User closed the popup
        setIsLoading(false)
        return
      }

      const cleanPhone = phone.replace(/\D/g, "").slice(-10)
      isVerifyingRef.current = true
      const result = await googleLogin(idToken, cleanPhone)

      if (result.success) {
        if (result.isNewUser) {
          setStep("register")
          setIsLoading(false)
          isVerifyingRef.current = false
        } else {
          window.location.href = searchParams.get("redirect") || "/"
        }
      } else {
        setError(result.error || "Google login failed")
        setIsLoading(false)
        isVerifyingRef.current = false
      }
    } catch (err) {
      console.error("Google login error:", err)
      setError(t("auth.google.error"))
      setIsLoading(false)
      isVerifyingRef.current = false
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, "")

    // Handle multi-character input (paste or autofill into a single field)
    if (digits.length > 1) {
      const chars = digits.slice(0, 4).split("")
      const newOtp = ["", "", "", ""]
      chars.forEach((ch, i) => { newOtp[i] = ch })
      setOtp(newOtp)
      // Focus the next empty input or the last filled one
      const focusIdx = Math.min(chars.length, 3)
      otpRefs[focusIdx]?.current?.focus()
      return
    }

    const v = digits.slice(-1)
    const newOtp = [...otp]
    newOtp[index] = v
    setOtp(newOtp)
    if (v && index < 3) otpRefs[index + 1].current?.focus()
  }

  // Handle paste on any OTP input — distribute digits across all fields
  const handleOtpPaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4)
    if (!pasted) return
    const chars = pasted.split("")
    const newOtp = ["", "", "", ""]
    chars.forEach((ch, i) => { newOtp[i] = ch })
    setOtp(newOtp)
    const focusIdx = Math.min(chars.length, 3)
    otpRefs[focusIdx]?.current?.focus()
  }, [])

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus()
    }
  }

  const handleVerifyOtp = useCallback(async () => {
    const otpValue = otp.join("")
    if (otpValue.length !== 4 || isOtpSubmittingRef.current) return

    // Prevent the redirect useEffect and auto-submit from racing
    isVerifyingRef.current = true
    isOtpSubmittingRef.current = true
    setIsLoading(true)
    setError(null)

    const cleanPhone = phone.replace(/\D/g, "").slice(-10)
    const result = await login(cleanPhone, email.trim(), otpValue)

    if (result.success) {
      // Clear OTP inputs immediately to prevent auto-submit useEffect re-firing
      setOtp(["", "", "", ""])
      if (result.isNewUser) {
        setStep("register")
        setIsLoading(false)
        isOtpSubmittingRef.current = false
        isVerifyingRef.current = false
      } else {
        // Hard redirect for existing users — same bulletproof approach as registration
        window.location.href = searchParams.get("redirect") || "/"
      }
    } else {
      setError(result.error || "Invalid OTP")
      // Clear OTP inputs on failure so user can retry or resend
      setOtp(["", "", "", ""])
      setIsLoading(false)
      isOtpSubmittingRef.current = false
      isVerifyingRef.current = false
      otpRefs[0].current?.focus()
    }
  }, [otp, phone, email, login, router, searchParams])

  // Auto-submit OTP when all 4 digits are entered
  useEffect(() => {
    if (step === "otp" && otp.join("").length === 4 && !isOtpSubmittingRef.current) {
      handleVerifyOtp()
    }
  }, [otp, step, handleVerifyOtp])


  const handleRegister = async () => {
    if (!fullName.trim() || isLoading) return
    isRegisteringRef.current = true
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        // Show specific field errors if available
        if (data.errors) {
          const firstError = Object.values(data.errors).flat()[0]
          setError(typeof firstError === "string" ? firstError : data.message || "Failed to update profile")
        } else {
          setError(data.message || "Failed to update profile. Please try again.")
        }
        setIsLoading(false)
        isRegisteringRef.current = false
        return
      }

      // Directly update the user in auth context with the response data
      if (data.user) {
        updateUser(data.user)
      }

      // Also persist coordinates via the dedicated location endpoint (fire-and-forget)
      if (latitude && longitude) {
        fetch("/api/auth/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude, longitude, address: userAddress }),
        }).catch(() => { }) // non-critical
      }

      // Use window.location.href for a hard redirect that CANNOT be swallowed
      // by React 18 transitions, Google Maps API scripts, or any other interference.
      // router.push() is unreliable here because context updates trigger re-renders
      // that abort the soft navigation on mobile browsers.
      const redirect = searchParams.get("redirect") || "/"
      window.location.href = redirect
    } catch (err) {
      console.error("Registration error:", err)
      setIsLoading(false)
      isRegisteringRef.current = false
      setError("Network error. Please check your connection and try again.")
    }
  }

  const handleResendOtp = async () => {
    setIsLoading(true)
    setError(null)
    const cleanPhone = phone.replace(/\D/g, "").slice(-10)
    const result = await sendOtp(cleanPhone, email.trim())
    setIsLoading(false)
    if (result.success) {
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
          <h1 className="text-white text-xl font-bold tracking-tight leading-none">{t("auth.title")}</h1>
          <p className="text-white/50 text-xs mt-1">{t("auth.subtitle")}</p>


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
            <div ref={errorRef} className="flex items-start gap-2.5 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl px-4 py-3 mb-4">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* ── STEP 1 : Phone ───────────────────────── */}
          {step === "phone" && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-foreground text-xl font-bold">{t("auth.phone.welcome")}</h2>
                <p className="text-muted text-sm mt-1">{t("auth.phone.subtitle")}</p>
              </div>

              {/* Phone Number */}
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
                    onKeyDown={(e) => e.key === "Enter" && /^[6-9]\d{9}$/.test(phone) && handlePhoneSubmit()}
                    placeholder={t("auth.phone.placeholder")}
                    autoFocus
                    className="flex-1 min-w-0 px-4 h-11 rounded-xl bg-background border border-border text-sm font-medium placeholder:text-muted/50 focus:ring-2 focus:ring-primary/20 focus:border-primary/60 outline-none transition-all"
                  />
                </div>
                <p className="text-xs text-muted ml-0.5">{t("auth.phone.hint_mobile")}</p>
              </div>

              {/* Note about phone requirement */}
              {(!/^[6-9]\d{9}$/.test(phone)) && (
                <p className={cn("text-xs text-center", phone.length === 10 ? "text-destructive" : "text-muted")}>
                  {phone.length < 10 ? t("auth.phone.enter_first") : t("auth.phone.invalid")}
                </p>
              )}

              {/* Continue Button */}
              <button
                onClick={handlePhoneSubmit}
                disabled={!/^[6-9]\d{9}$/.test(phone)}
                className="w-full h-11 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-md shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
              >
                <span>{t("auth.phone.continue")}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          )}

          {/* ── STEP 1.5 : Method Selection ───────────────────────────────── */}
          {step === "method" && (
            <div className="flex flex-col gap-5 relative">
              <button
                onClick={() => setStep("phone")}
                className="absolute -top-1 right-0 p-1 text-muted hover:text-foreground transition-colors"
                title="Go back"
              >
                <span className="material-symbols-outlined text-[20px]">edit</span>
              </button>
              
              <div className="pr-8">
                <h2 className="text-foreground text-xl font-bold">{t("auth.method.title")}</h2>
                <p className="text-muted text-sm mt-1 text-balance">
                  {t("auth.method.subtitle")}<span className="font-semibold text-foreground whitespace-nowrap">{countryCode} {phone}</span>?
                </p>
              </div>

              {/* Continue with Google */}
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full h-12 flex items-center justify-center gap-2.5 text-foreground text-[15px] font-bold border border-border rounded-xl hover:bg-muted/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>{t("auth.google.continue")}</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-muted text-xs font-medium uppercase tracking-wider">{t("auth.or")}</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5 -mt-1">
                <label className="text-sm font-semibold text-foreground">{t("auth.email.label")}</label>
                <input
                  type="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && email.trim() && handleSendOtp()}
                  placeholder={t("auth.email.placeholder")}
                  className="w-full px-4 h-11 rounded-xl bg-background border border-border text-sm font-medium placeholder:text-muted/50 focus:ring-2 focus:ring-primary/20 focus:border-primary/60 outline-none transition-all"
                />
                <p className="text-xs text-muted ml-0.5">{t("auth.email.hint")}</p>
              </div>

              {/* Send Email OTP Button */}
              <button
                onClick={handleSendOtp}
                disabled={!email.trim() || isLoading}
                className="w-full h-11 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-md shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /><span>{t("auth.phone.sending")}</span></>
                ) : (
                  <><span className="material-symbols-outlined text-[18px]">mail</span><span>{t("auth.email.send_otp")}</span><span className="material-symbols-outlined text-[18px]">arrow_forward</span></>
                )}
              </button>

            </div>
          )}

          {/* ── STEP 2 : OTP ─────────────────────────────────────────── */}
          {step === "otp" && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-foreground text-xl font-bold">{t("auth.otp.title")}</h2>
                <p className="text-muted text-sm mt-1">
                  {t("auth.otp.sent_to_email")}
                  <span className="text-navy font-semibold">
                    {email}
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
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    maxLength={4}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={handleOtpPaste}
                    className={cn(
                      "w-full max-w-17 aspect-square text-center text-2xl font-bold rounded-xl border transition-all outline-none",
                      digit ? "border-navy bg-navy/5 text-navy" : "border-border bg-background text-foreground",
                      "focus:border-primary focus:ring-2 focus:ring-primary/20"
                    )}
                  />
                ))}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-muted">{t("auth.otp.didnt_receive")}</span>
                <button
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-xs font-semibold text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
                >
                  {t("auth.otp.resend")}
                </button>
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={otp.join("").length !== 4 || isLoading}
                className="w-full h-11 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-md shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /><span>{t("auth.otp.verifying")}</span></>
                ) : (
                  <><span>{t("auth.otp.verify")}</span><span className="material-symbols-outlined text-[18px]">verified</span></>
                )}
              </button>
            </div>
          )}

          {/* ── STEP 3 : Register (simplified — name + GPS only) ──────── */}
          {step === "register" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-foreground text-xl font-bold">{t("auth.register.title")}</h2>
                <p className="text-muted text-sm mt-1">{t("auth.register.subtitle")}</p>
              </div>

              {/* Full name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">
                  {t("auth.register.full_name")} <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t("auth.register.name_placeholder")}
                  autoFocus
                  className="w-full px-4 h-11 rounded-xl bg-background border border-border text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/60 outline-none transition-all placeholder:text-muted/50"
                />
              </div>

              {/* Location section */}
              <div className="flex items-center gap-2 py-1">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted font-medium">
                  {t("auth.register.location_required")} <span className="text-destructive">*</span>
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Address Autocomplete */}
              <div className="w-full">
                <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
                  <PlacesAutocomplete
                    placeholder={t("auth.register.search_address")}
                    onPlaceSelect={(place) => {
                      setUserAddress(place.address)
                      setLatitude(place.lat)
                      setLongitude(place.lng)
                    }}
                  />
                </APIProvider>
              </div>

              {/* Show detected address */}
              {userAddress && (
                <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-xl px-3 py-2.5">
                  <span
                    className="material-symbols-outlined text-primary text-[16px] shrink-0 mt-0.5"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    location_on
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-relaxed wrap-break-word">{userAddress}</p>
                    <button
                      type="button"
                      onClick={() => { setLatitude(null); setLongitude(null); setUserAddress("") }}
                      className="text-[11px] text-muted hover:text-destructive mt-1 transition-colors"
                    >
                      {t("auth.register.remove")}
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleRegister}
                disabled={!fullName.trim() || !latitude || !longitude || isLoading}
                className="w-full h-11 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-md shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-1"
              >
                {isLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /><span>{t("auth.register.setting_up")}</span></>
                ) : (
                  <><span>{t("auth.register.complete")}</span><span className="material-symbols-outlined text-[18px]">check_circle</span></>
                )}
              </button>
            </div>
          )}

          {/* ── Terms footer ──────────────────────────────────────────── */}
          <p className="text-center text-muted text-xs leading-relaxed mt-auto pt-6">
            {t("auth.terms.agree")}
            <a href="/terms" className="text-navy font-semibold hover:underline">{t("auth.terms.terms")}</a>
            {t("auth.terms.and")}
            <a href="/privacy" className="text-navy font-semibold hover:underline">{t("auth.terms.privacy")}</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
