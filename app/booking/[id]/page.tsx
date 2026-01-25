"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { OTPModal } from "@/components/otp-modal"
import { DesktopHeader } from "@/components/desktop-header"

export default function BookingDetailsPage() {
  const params = useParams()
  const [showOTP, setShowOTP] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Desktop Header */}
      <DesktopHeader variant="farmer" />

      {/* Mobile Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm pt-12 pb-4 px-6 border-b border-border lg:hidden">
        <div className="flex items-center gap-4">
          <Link
            href="/bookings"
            className="size-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground shadow-sm"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground">Booking #{params.id}</h1>
            <p className="text-xs text-muted">View booking details</p>
          </div>
        </div>
      </header>

      {/* Desktop Layout */}
      <div className="hidden lg:block max-w-5xl mx-auto w-full px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/bookings"
            className="size-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground shadow-sm hover:bg-muted/50 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Booking #{params.id}</h1>
            <p className="text-muted">View and manage your booking details</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="col-span-2 flex flex-col gap-6">
            {/* Equipment Card */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <div className="flex gap-6">
                <div className="size-32 rounded-xl overflow-hidden shrink-0">
                  <Image
                    src="/red-mahindra-tractor.jpg"
                    alt="Mahindra 575 DI"
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Mahindra 575 DI</h2>
                      <p className="text-muted">Ploughing Service</p>
                    </div>
                    <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-bold rounded-full">Upcoming</span>
                  </div>
                  <div className="flex items-center gap-1 mt-3">
                    <span
                      className="material-symbols-outlined text-yellow-500 text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span className="text-sm font-bold">4.8</span>
                    <span className="text-sm text-muted">• 45 HP • Diesel</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <h3 className="font-bold text-lg text-foreground mb-4">Booking Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between items-center py-3 px-4 bg-background rounded-xl">
                  <span className="text-muted">Date & Time</span>
                  <span className="font-semibold text-foreground">Today, 2:00 PM</span>
                </div>
                <div className="flex justify-between items-center py-3 px-4 bg-background rounded-xl">
                  <span className="text-muted">Duration</span>
                  <span className="font-semibold text-foreground">4 Hours</span>
                </div>
                <div className="flex justify-between items-center py-3 px-4 bg-background rounded-xl">
                  <span className="text-muted">Area</span>
                  <span className="font-semibold text-foreground">3 Acres</span>
                </div>
                <div className="flex justify-between items-center py-3 px-4 bg-background rounded-xl">
                  <span className="text-muted">Location</span>
                  <span className="font-semibold text-foreground">Rampur Village</span>
                </div>
              </div>
              <div className="flex justify-between items-center py-4 mt-4 border-t border-border">
                <span className="text-lg font-medium text-foreground">Total Amount</span>
                <span className="font-bold text-2xl text-primary">₹2,400</span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-1 flex flex-col gap-6">
            {/* Partner Info */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <h3 className="font-bold text-lg text-foreground mb-4">Operator Details</h3>
              <div className="flex flex-col items-center gap-4">
                <div className="size-20 rounded-full overflow-hidden border-2 border-primary/20">
                  <Image
                    src="/placeholder.svg?height=80&width=80"
                    alt="Partner"
                    width={80}
                    height={80}
                    className="object-cover"
                  />
                </div>
                <div className="text-center">
                  <p className="font-bold text-foreground text-lg">Suresh Sharma</p>
                  <p className="text-sm text-muted">5 years experience</p>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <span className="material-symbols-outlined text-yellow-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="text-sm font-bold">4.9</span>
                    <span className="text-xs text-muted">• 150 jobs</span>
                  </div>
                </div>
                <div className="flex gap-3 w-full">
                  <button className="flex-1 h-11 rounded-xl bg-success/10 text-success flex items-center justify-center gap-2 font-medium hover:bg-success/20 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">call</span>
                    Call
                  </button>
                  <button className="flex-1 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center gap-2 font-medium hover:bg-primary/20 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">chat</span>
                    Chat
                  </button>
                </div>
              </div>
            </div>

            {/* Action */}
            <button
              onClick={() => setShowOTP(true)}
              className="w-full h-14 bg-primary text-white rounded-2xl font-bold text-lg shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors"
            >
              Start Service
            </button>

            {/* Help */}
            <div className="bg-muted/30 rounded-2xl p-4 text-center">
              <p className="text-sm text-muted">Need help with your booking?</p>
              <button className="text-primary font-semibold text-sm mt-1 hover:underline">Contact Support</button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Content */}
      <main className="flex-1 p-6 flex flex-col gap-6 lg:hidden">
        {/* Equipment Card */}
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
          <div className="flex gap-4">
            <div className="size-24 rounded-xl overflow-hidden shrink-0">
              <Image
                src="/red-mahindra-tractor.jpg"
                alt="Mahindra 575 DI"
                width={96}
                height={96}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">Mahindra 575 DI</h2>
              <p className="text-muted text-sm">Ploughing Service</p>
              <div className="flex items-center gap-1 mt-2">
                <span
                  className="material-symbols-outlined text-yellow-500 text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
                <span className="text-sm font-bold">4.8</span>
                <span className="text-xs text-muted">• 45 HP • Diesel</span>
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border flex flex-col gap-4">
          <h3 className="font-bold text-foreground">Booking Details</h3>

          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-muted text-sm">Date & Time</span>
            <span className="font-semibold text-foreground">Today, 2:00 PM</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-muted text-sm">Duration</span>
            <span className="font-semibold text-foreground">4 Hours</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-muted text-sm">Area</span>
            <span className="font-semibold text-foreground">3 Acres</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-muted text-sm">Total Amount</span>
            <span className="font-bold text-xl text-primary">₹2,400</span>
          </div>
        </div>

        {/* Partner Info */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
          <h3 className="font-bold text-foreground mb-4">Operator Details</h3>
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-full overflow-hidden border-2 border-primary/20">
              <Image
                src="/placeholder.svg?height=56&width=56"
                alt="Partner"
                width={56}
                height={56}
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="font-bold text-foreground">Suresh Sharma</p>
              <p className="text-sm text-muted">5 years experience</p>
            </div>
            <button className="size-12 rounded-full bg-success/10 text-success flex items-center justify-center">
              <span className="material-symbols-outlined">call</span>
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Action */}
      <div className="p-6 bg-card border-t border-border lg:hidden">
        <button
          onClick={() => setShowOTP(true)}
          className="w-full h-14 bg-primary text-white rounded-2xl font-bold text-lg shadow-lg shadow-primary/25 active:scale-[0.98] transition-transform"
        >
          Start Service
        </button>
      </div>

      <OTPModal code="4829" isOpen={showOTP} onDismiss={() => setShowOTP(false)} />
    </div>
  )
}
