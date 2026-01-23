"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowRight, CheckCircle, Mail, ChevronDown } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

type AuthStep = "phone" | "otp" | "register"

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { sendOtp, login, refreshUser, isAuthenticated, isLoading: authLoading } = useAuth()

  const [step, setStep] = useState<AuthStep>("phone")
  const [countryCode, setCountryCode] = useState("+91")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState(["", "", "", ""])
  const [isNewUser, setIsNewUser] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devOtp, setDevOtp] = useState<string | null>(null) // For development testing

  // Registration fields
  const [fullName, setFullName] = useState("")
  const [village, setVillage] = useState("")

  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  // Redirect if already authenticated
  useEffect(() => {
    // Avoid redirecting while onboarding a new user
    if (!authLoading && isAuthenticated && step !== "register") {
      const redirect = searchParams.get("redirect") || "/"
      router.push(redirect)
    }
  }, [isAuthenticated, authLoading, router, searchParams, step])

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
      // In development, show the OTP for testing
      if (result.otp) {
        setDevOtp(result.otp)
        console.log("Development OTP:", result.otp)
      }
      setStep("otp")
    } else {
      setError(result.error || "Failed to send OTP")
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1)
    }

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 3) {
      otpRefs[index + 1].current?.focus()
    }
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
        // New user - show registration form
        setIsNewUser(true)
        setStep("register")
      } else {
        // Existing user - redirect
        const redirect = searchParams.get("redirect") || "/"
        router.push(redirect)
      }
    } else {
      setError(result.error || "Invalid OTP")
    }
  }

  const handleRegister = async () => {
    if (!fullName || !village) return

    setIsLoading(true)
    setError(null)

    // Split full name into first/last for backend user fields
    const nameParts = fullName.trim().split(" ").filter(Boolean)
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ")

    const response = await fetch("/api/auth/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        village,
      }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setIsLoading(false)
      setError(data.message || "Failed to update profile")
      return
    }

    // Refresh user state in context
    await refreshUser()

    setIsLoading(false)

    // Registration complete - redirect
    const redirect = searchParams.get("redirect") || "/"
    router.push(redirect)
  }

  const handleResendOtp = async () => {
    setIsLoading(true)
    setError(null)

    const cleanPhone = phone.replace(/\D/g, "").slice(-10)
    const result = await sendOtp(cleanPhone)

    setIsLoading(false)

    if (result.success) {
      if (result.otp) {
        setDevOtp(result.otp)
      }
      setOtp(["", "", "", ""])
      otpRefs[0].current?.focus()
    } else {
      setError(result.error || "Failed to resend OTP")
    }
  }

  // Auto-focus first OTP input when step changes
  useEffect(() => {
    if (step === "otp") {
      otpRefs[0].current?.focus()
    }
  }, [step])

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[400px] flex flex-col gap-6">
        {/* Back Button (shown on OTP and Register steps) */}
        {step !== "phone" && (
          <div className="flex items-center pt-8 pb-2 px-1">
            <button
              onClick={() => {
                setError(null)
                setStep(step === "register" ? "otp" : "phone")
              }}
              className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-sm text-navy hover:bg-muted/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Logo Section (only on phone step) */}
        {step === "phone" && (
          <div className="flex flex-col items-center justify-center pt-8 pb-4">
            <div className="w-20 h-20 bg-navy/10 rounded-2xl flex items-center justify-center mb-4">
              <svg
                className="w-12 h-12 text-navy"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 7V17C3 18.1 3.9 19 5 19H19C20.1 19 21 18.1 21 17V7" />
                <path d="M21 7L12 13L3 7" />
                <circle cx="12" cy="5" r="2" />
                <path d="M12 3V1" />
                <path d="M9 4L7 2" />
                <path d="M15 4L17 2" />
              </svg>
            </div>
            <h1 className="text-navy text-2xl font-bold tracking-tight">My Farmo</h1>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-card rounded-2xl shadow-lg p-6 sm:p-8 flex flex-col gap-6 relative overflow-hidden">
          {/* Decorative accent */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-xl" />

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Development OTP Display */}
          {devOtp && step === "otp" && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-xl px-4 py-3">
              <span className="font-semibold">Dev Mode:</span> OTP is <span className="font-mono font-bold">{devOtp}</span>
            </div>
          )}

          {/* STEP 1: Phone Input */}
          {step === "phone" && (
            <>
              <div className="text-center">
                <h2 className="text-foreground text-[22px] font-bold leading-tight pb-2">Welcome back!</h2>
                <p className="text-muted text-sm">Enter your mobile number to login</p>
              </div>

              <div className="flex flex-col gap-4">
                <label className="flex flex-col gap-2">
                  <span className="text-navy text-xs font-semibold uppercase tracking-wider ml-1">Mobile Number</span>
                  <div className="flex gap-3">
                    {/* Country Code Select */}
                    <div className="relative w-[88px]">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="appearance-none w-full bg-background text-foreground h-14 rounded-2xl border-0 px-4 pr-8 focus:ring-2 focus:ring-navy font-medium text-lg cursor-pointer transition-all"
                      >
                        <option value="+91">+91</option>
                        <option value="+1">+1</option>
                        <option value="+44">+44</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Phone Input */}
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="98765 43210"
                      className="flex-1 bg-background text-foreground h-14 rounded-2xl border-0 px-4 focus:ring-2 focus:ring-navy font-medium text-lg placeholder:text-muted/60 transition-all"
                    />
                  </div>
                </label>
              </div>

              <button
                onClick={handleSendOtp}
                disabled={phone.length < 10 || isLoading}
                className="w-full h-14 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl text-base font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
              >
                <span>{isLoading ? "Sending..." : "Send OTP"}</span>
                {!isLoading && <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 py-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-muted text-xs font-medium">OR</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Alternative Login */}
              <button className="w-full py-3 flex items-center justify-center gap-2 text-navy font-medium text-sm hover:opacity-80 transition-opacity">
                <Mail className="w-5 h-5" />
                Continue with Email
              </button>
            </>
          )}

          {/* STEP 2: OTP Verification */}
          {step === "otp" && (
            <>
              <div>
                <h2 className="text-foreground text-[22px] font-bold leading-tight pb-2">Verification Code</h2>
                <p className="text-muted text-sm">
                  Please enter the code we sent to <br />
                  <span className="text-navy font-semibold text-base">
                    {countryCode} {phone.replace(/(\d{5})(\d{5})/, "$1 $2")}
                  </span>
                </p>
              </div>

              {/* OTP Input */}
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-4 gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={otpRefs[index]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className={`w-full aspect-square text-center text-2xl font-bold rounded-2xl transition-all ${
                        digit
                          ? "border-2 border-navy bg-card text-navy"
                          : "border border-border bg-background/50 text-foreground"
                      } focus:ring-2 focus:ring-navy focus:bg-card`}
                    />
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                  >
                    Resend Code?
                  </button>
                </div>
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={otp.join("").length !== 4 || isLoading}
                className="w-full h-14 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl text-base font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group mt-2"
              >
                <span>{isLoading ? "Verifying..." : "Verify OTP"}</span>
                {!isLoading && <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />}
              </button>
            </>
          )}

          {/* STEP 3: Registration (New Users Only) */}
          {step === "register" && (
            <>
              <div>
                <h2 className="text-foreground text-[22px] font-bold leading-tight pb-2">Complete Profile</h2>
                <p className="text-muted text-sm">Just a few more details to get started</p>
              </div>

              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-muted text-xs font-semibold ml-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Kumar"
                    className="w-full bg-background text-foreground h-14 rounded-2xl border-0 px-4 focus:ring-2 focus:ring-navy font-medium text-lg placeholder:text-muted/60 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-muted text-xs font-semibold ml-1">Select Village</label>
                  <div className="relative w-full">
                    <select
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      className="appearance-none w-full bg-background text-foreground h-14 rounded-2xl border-0 px-4 pr-10 focus:ring-2 focus:ring-navy font-medium text-lg cursor-pointer transition-all"
                    >
                      <option value="" disabled>
                        Choose location...
                      </option>
                      <option value="rampur">Rampur</option>
                      <option value="kishanpur">Kishanpur</option>
                      <option value="lakhanpur">Lakhanpur</option>
                      <option value="sultanpur">Sultanpur</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted">
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleRegister}
                disabled={!fullName || !village || isLoading}
                className="w-full h-14 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl text-base font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group mt-2"
              >
                <span>{isLoading ? "Creating Account..." : "Verify & Login"}</span>
                {!isLoading && <CheckCircle className="w-5 h-5 transition-transform group-hover:scale-110" />}
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-muted text-xs px-8 leading-relaxed max-w-[300px] mx-auto">
          By continuing, you agree to our{" "}
          <a href="#" className="text-navy font-semibold hover:underline">
            Terms of Service
          </a>{" "}
          &{" "}
          <a href="#" className="text-navy font-semibold hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  )
}
