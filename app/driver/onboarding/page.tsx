"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

export default function OnboardingPage() {
  const [pricePerAcre, setPricePerAcre] = useState(1200)
  const [isNegotiable, setIsNegotiable] = useState(true)

  return (
    <div className="bg-background font-sans min-h-screen flex flex-col items-center p-4 sm:p-6">
      <div className="w-full max-w-[400px] flex flex-col gap-6 pb-24">
        {/* Header */}
        <header className="flex items-center justify-between py-2">
          <Link
            href="/profile"
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-navy shadow-sm hover:bg-muted/10 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-navy text-lg font-bold">Details & Pricing</h1>
          <div className="w-10 h-10"></div>
        </header>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 px-1">
          <div className="h-1.5 flex-1 bg-navy rounded-full"></div>
          <div className="h-1.5 flex-1 bg-navy rounded-full"></div>
          <div className="h-1.5 flex-1 bg-navy rounded-full"></div>
          <div className="h-1.5 flex-1 bg-muted/30 rounded-full"></div>
        </div>

        {/* KYC Documents Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-navy font-bold text-lg">KYC Documents</h2>
            <span className="px-2 py-1 bg-success/10 text-success text-[10px] font-bold uppercase tracking-wider rounded-md">
              Required
            </span>
          </div>

          <div className="bg-card p-5 rounded-2xl shadow-sm">
            <p className="text-sm text-muted mb-4 font-medium">Upload Government ID (Aadhar/Voter ID)</p>
            <div className="grid grid-cols-2 gap-4">
              <button className="relative group h-32 w-full border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-xl">add_a_photo</span>
                </div>
                <span className="text-xs font-semibold text-muted group-hover:text-primary">Front Side</span>
              </button>
              <button className="relative group h-32 w-full border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-xl">add_a_photo</span>
                </div>
                <span className="text-xs font-semibold text-muted group-hover:text-primary">Back Side</span>
              </button>
            </div>
          </div>
        </section>

        {/* Vehicle Photos Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-navy font-bold text-lg">Vehicle Photos</h2>
            <span className="text-xs text-muted font-medium">Max 4 photos</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden group shadow-sm">
              <Image src="/red-tractor-front-view-farm.jpg" alt="Tractor Front" fill className="object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40">
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
                <button className="w-8 h-8 rounded-full bg-destructive/80 backdrop-blur-md flex items-center justify-center text-white hover:bg-destructive">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
            <button className="aspect-[4/3] rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-navy hover:bg-navy/5 transition-all bg-card">
              <span className="material-symbols-outlined text-3xl text-muted">add_circle</span>
              <span className="text-sm font-medium text-muted">Add Photo</span>
            </button>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-navy font-bold text-lg">Pricing Configuration</h2>
            <div className="group relative flex items-center">
              <span className="material-symbols-outlined text-muted text-lg cursor-help hover:text-primary transition-colors">
                info
              </span>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-navy text-white text-xs rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center pointer-events-none">
                Pricing includes fuel costs and operator charges.
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-navy"></div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-sm flex flex-col gap-6">
            <div className="flex flex-col items-center gap-3">
              <label className="text-sm font-semibold text-muted uppercase tracking-wide">Price Per Acre</label>
              <div className="relative w-full max-w-[200px]">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted">₹</span>
                <input
                  type="number"
                  value={pricePerAcre}
                  onChange={(e) => setPricePerAcre(Number(e.target.value))}
                  className="w-full text-center text-4xl font-extrabold text-navy bg-transparent border-b-2 border-border focus:border-primary focus:ring-0 px-8 py-2 transition-all placeholder-muted/50"
                />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-sm font-medium text-muted">/acre</span>
              </div>
              <p className="text-xs text-success font-medium bg-success/10 px-3 py-1 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">trending_up</span>
                Good market rate
              </p>
            </div>

            <div className="h-px bg-border w-full"></div>

            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">Negotiable</span>
                <span className="text-xs text-muted">Open to bargaining</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNegotiable}
                  onChange={(e) => setIsNegotiable(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </section>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card/80 backdrop-blur-md border-t border-border flex justify-center z-50">
        <div className="w-full max-w-[400px]">
          <Link
            href="/driver"
            className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl text-base font-bold tracking-wide shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
          >
            <span>Save & Continue</span>
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
