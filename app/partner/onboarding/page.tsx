"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DesktopHeader } from "@/components/desktop-header"
import { MobileHeader } from "@/components/mobile-header"
import {
  PersonalInfoStep,
  type PersonalInfoData,
} from "@/components/onboarding/personal-info-step"
import {
  KYCDetailsStep,
  type KYCDetailsData,
} from "@/components/onboarding/kyc-details-step"
import {
  ListServicesStep,
  type ListServicesData,
} from "@/components/onboarding/list-services-step"
import { VerificationStep } from "@/components/onboarding/verification-step"

// Step metadata for progress display
const steps = [
  { id: 1, label: "Personal Info", icon: "person", description: "Your basic details" },
  { id: 2, label: "KYC Details", icon: "verified_user", description: "Verification documents" },
  { id: 3, label: "List Service", icon: "add_business", description: "Add your first service" },
  { id: 4, label: "Verification", icon: "task_alt", description: "Review & submit" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Step 1: Personal Info
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoData>({
    firstName: "",
    lastName: "",
    address: "",
    lat: null,
    lng: null,
  })

  // Step 2: KYC Details
  const [kycDetails, setKYCDetails] = useState<KYCDetailsData>({
    partnerType: "",
    businessName: "",
    aadharFront: null,
    aadharFrontPreview: "",
    aadharBack: null,
    aadharBackPreview: "",
    baseCity: "",
  })

  // Step 3: List Services
  const [serviceData, setServiceData] = useState<ListServicesData>({
    category: "",
    title: "",
    description: "",
    price: "",
    priceUnit: "",
    locationLat: null,
    locationLng: null,
    serviceRadius: 15,
    images: [],
  })

  // Validation for each step
  const validateStep = useCallback(
    (step: number): boolean => {
      const newErrors: Record<string, string> = {}

      if (step === 1) {
        if (!personalInfo.firstName.trim())
          newErrors.firstName = "First name is required"
        if (!personalInfo.lastName.trim())
          newErrors.lastName = "Last name is required"
        if (!personalInfo.address.trim())
          newErrors.address = "Address is required"
      }

      if (step === 2) {
        if (!kycDetails.partnerType)
          newErrors.partnerType = "Please select a partner type"
        if (!kycDetails.businessName.trim())
          newErrors.businessName = "Business name is required"
        if (!kycDetails.aadharFront)
          newErrors.aadharFront = "Please upload Aadhar front side"
        if (!kycDetails.aadharBack)
          newErrors.aadharBack = "Please upload Aadhar back side"
        if (!kycDetails.baseCity.trim())
          newErrors.baseCity = "Base city is required"
      }

      if (step === 3) {
        if (!serviceData.category) newErrors.category = "Please select a category"
        if (!serviceData.title.trim()) newErrors.title = "Service title is required"
        if (!serviceData.price || Number(serviceData.price) <= 0)
          newErrors.price = "Enter a valid price"
        if (!serviceData.priceUnit) newErrors.priceUnit = "Select a price unit"
      }

      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    },
    [personalInfo, kycDetails, serviceData]
  )

  // Submit all onboarding data to backend
  const handleSubmitOnboarding = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Step 1: Update user profile (name, address, location)
      const profileRes = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: personalInfo.firstName,
          last_name: personalInfo.lastName,
          address: personalInfo.address,
          default_lat: personalInfo.lat,
          default_lng: personalInfo.lng,
        }),
      })

      if (!profileRes.ok) {
        const err = await profileRes.json()
        throw new Error(err.message || "Failed to save personal info")
      }

      // Step 2: Register as partner with KYC documents
      const partnerFormData = new FormData()
      partnerFormData.append("partner_type", kycDetails.partnerType)
      partnerFormData.append("business_name", kycDetails.businessName)
      partnerFormData.append("base_city", kycDetails.baseCity)
      if (kycDetails.aadharFront) {
        partnerFormData.append("aadhar_card_front", kycDetails.aadharFront)
      }
      if (kycDetails.aadharBack) {
        partnerFormData.append("aadhar_card_back", kycDetails.aadharBack)
      }

      const partnerRes = await fetch("/api/partner/onboarding", {
        method: "POST",
        body: partnerFormData,
      })

      if (!partnerRes.ok) {
        const err = await partnerRes.json()
        throw new Error(err.message || "Failed to register as partner")
      }

      // Step 3: Create the first service with images
      const serviceFormData = new FormData()
      serviceFormData.append("category", serviceData.category)
      serviceFormData.append("title", serviceData.title)
      if (serviceData.description) {
        serviceFormData.append("description", serviceData.description)
      }
      serviceFormData.append("price", serviceData.price)
      serviceFormData.append("price_unit", serviceData.priceUnit)
      if (serviceData.locationLat) {
        serviceFormData.append("location_lat", String(serviceData.locationLat))
      }
      if (serviceData.locationLng) {
        serviceFormData.append("location_lng", String(serviceData.locationLng))
      }
      serviceFormData.append("service_radius_km", String(serviceData.serviceRadius))
      for (const image of serviceData.images) {
        serviceFormData.append("images", image.file)
      }

      const serviceRes = await fetch("/api/partner/services", {
        method: "POST",
        body: serviceFormData,
      })

      if (!serviceRes.ok) {
        const err = await serviceRes.json()
        throw new Error(err.message || "Failed to create service")
      }

      // All steps succeeded — move to verification
      setCurrentStep(4)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (error: any) {
      console.error("Onboarding submission error:", error)
      setSubmitError(error.message || "Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 3) {
        // On the last input step, submit everything to the backend
        handleSubmitOnboarding()
      } else {
        setCurrentStep((prev) => Math.min(prev + 1, 4))
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    }
  }

  const handleBack = () => {
    setErrors({})
    setSubmitError(null)
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return "completed"
    if (stepId === currentStep) return "active"
    return "pending"
  }

  return (
    <div className="bg-background font-sans min-h-screen flex flex-col relative">
      {/* Error Toast */}
      {submitError && (
        <div className="fixed top-4 right-4 z-[100] max-w-sm animate-in slide-in-from-top-2 fade-in">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg flex items-start gap-3">
            <span className="material-symbols-outlined text-red-500 mt-0.5">error</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">Submission Error</p>
              <p className="text-sm text-red-600 mt-0.5">{submitError}</p>
            </div>
            <button
              onClick={() => setSubmitError(null)}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[90] bg-background/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-card rounded-2xl border border-border p-8 flex flex-col items-center gap-4 shadow-xl max-w-xs mx-4">
            <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="font-semibold text-foreground text-center">Submitting your details...</p>
            <p className="text-sm text-muted text-center">Setting up your partner account, uploading KYC documents, and creating your service.</p>
          </div>
        </div>
      )}
      {/* Desktop Header */}
      <DesktopHeader variant="partner" />
      <MobileHeader />

      {/* Mobile Header Bar */}
      <header className="flex items-center justify-between py-2 px-4 pt-12 lg:hidden">
        {currentStep > 1 && currentStep < 4 ? (
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-navy shadow-sm hover:bg-muted/10 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        ) : (
          <Link
            href={currentStep === 4 ? "/partner" : "/partner"}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-navy shadow-sm hover:bg-muted/10 transition-colors"
          >
            <span className="material-symbols-outlined">
              {currentStep === 4 ? "close" : "arrow_back"}
            </span>
          </Link>
        )}
        <h1 className="text-navy text-lg font-bold">
          {steps[currentStep - 1].label}
        </h1>
        <div className="w-10 h-10 flex items-center justify-center">
          <span className="text-xs font-bold text-muted bg-muted/10 px-2 py-1 rounded-md">
            {currentStep}/4
          </span>
        </div>
      </header>

      {/* Desktop Layout */}
      <div className="hidden lg:flex max-w-6xl mx-auto w-full px-6 py-8 gap-8">
        {/* Left - Progress Sidebar */}
        <div className="w-72 shrink-0">
          <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
            <h2 className="font-bold text-lg text-foreground mb-6">
              Onboarding Progress
            </h2>
            <div className="flex flex-col gap-1">
              {steps.map((step, index) => {
                const status = getStepStatus(step.id)
                return (
                  <div key={step.id}>
                    <div className="flex items-center gap-3 py-3">
                      <div
                        className={`size-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-all ${status === "completed"
                          ? "bg-success text-white"
                          : status === "active"
                            ? "bg-primary text-white shadow-md shadow-primary/30"
                            : "bg-muted/15 text-muted"
                          }`}
                      >
                        {status === "completed" ? (
                          <span className="material-symbols-outlined text-lg">check</span>
                        ) : (
                          <span className="material-symbols-outlined text-lg">
                            {step.icon}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-semibold text-sm ${status === "active"
                            ? "text-primary"
                            : status === "completed"
                              ? "text-foreground"
                              : "text-muted"
                            }`}
                        >
                          {step.label}
                        </p>
                        <p className="text-xs text-muted truncate">
                          {status === "completed"
                            ? "Completed"
                            : status === "active"
                              ? "In Progress"
                              : step.description}
                        </p>
                      </div>
                    </div>
                    {/* Connector line */}
                    {index < steps.length - 1 && (
                      <div className="ml-5 h-4 w-px bg-border" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Desktop Title */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {steps[currentStep - 1].label}
            </h1>
            <p className="text-muted mt-1">
              Step {currentStep} of 4 — {steps[currentStep - 1].description}
            </p>
          </div>

          {/* Desktop Progress Bar */}
          <div className="flex items-center gap-2">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`h-2 flex-1 rounded-full transition-all duration-500 ${step.id <= currentStep ? "bg-primary" : "bg-muted/20"
                  }`}
              />
            ))}
          </div>

          {/* Step Content */}
          <div className="bg-card rounded-2xl border border-border p-8">
            {currentStep === 1 && (
              <PersonalInfoStep
                data={personalInfo}
                onChange={setPersonalInfo}
                errors={errors}
              />
            )}
            {currentStep === 2 && (
              <KYCDetailsStep
                data={kycDetails}
                onChange={setKYCDetails}
                errors={errors}
              />
            )}
            {currentStep === 3 && (
              <ListServicesStep
                data={serviceData}
                onChange={setServiceData}
                errors={errors}
                defaultLat={personalInfo.lat}
                defaultLng={personalInfo.lng}
              />
            )}
            {currentStep === 4 && (
              <VerificationStep
                serviceName={serviceData.title}
                category={serviceData.category}
                price={serviceData.price}
                priceUnit={serviceData.priceUnit}
                businessName={kycDetails.businessName}
              />
            )}
          </div>

          {/* Desktop Navigation */}
          {currentStep < 4 && (
            <div className="flex justify-between items-center">
              {currentStep > 1 ? (
                <button
                  onClick={handleBack}
                  className="px-6 h-12 bg-card border border-border hover:bg-muted/10 text-foreground rounded-xl text-sm font-semibold transition-all flex items-center gap-2 active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={handleNext}
                disabled={isSubmitting}
                className="px-8 h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl text-base font-bold tracking-wide shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>{currentStep === 3 ? "Submit & Verify" : "Save & Continue"}</span>
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                  {currentStep === 3 ? "check_circle" : "arrow_forward"}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ---- Mobile Layout ---- */}
      <div className="flex-1 flex flex-col items-center p-4 lg:hidden">
        <div className="w-full max-w-[420px] flex flex-col gap-6 pb-24">
          {/* Mobile Progress Bar */}
          <div className="flex items-center gap-2 px-1">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step.id <= currentStep ? "bg-primary" : "bg-muted/20"
                  }`}
              />
            ))}
          </div>

          {/* Step Content */}
          {currentStep === 1 && (
            <PersonalInfoStep
              data={personalInfo}
              onChange={setPersonalInfo}
              errors={errors}
            />
          )}
          {currentStep === 2 && (
            <KYCDetailsStep
              data={kycDetails}
              onChange={setKYCDetails}
              errors={errors}
            />
          )}
          {currentStep === 3 && (
            <ListServicesStep
              data={serviceData}
              onChange={setServiceData}
              errors={errors}
              defaultLat={personalInfo.lat}
              defaultLng={personalInfo.lng}
            />
          )}
          {currentStep === 4 && (
            <VerificationStep
              serviceName={serviceData.title}
              category={serviceData.category}
              price={serviceData.price}
              priceUnit={serviceData.priceUnit}
              businessName={kycDetails.businessName}
            />
          )}
        </div>
      </div>

      {/* Fixed Bottom Button - Mobile only */}
      {currentStep < 4 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-card/80 backdrop-blur-md border-t border-border flex justify-center z-50 lg:hidden">
          <div className="w-full max-w-[420px] flex gap-3">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="w-14 h-14 bg-card border border-border rounded-2xl flex items-center justify-center text-navy hover:bg-muted/10 active:scale-95 transition-all shrink-0"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="flex-1 h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl text-base font-bold tracking-wide shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>{currentStep === 3 ? "Submit & Verify" : "Save & Continue"}</span>
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                {currentStep === 3 ? "check_circle" : "arrow_forward"}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
