"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DesktopHeader } from "@/components/desktop-header"
import { MobileHeader } from "@/components/mobile-header"


export default function ActiveJobPage() {
  const [elapsed, setElapsed] = useState({ hours: 1, minutes: 42, seconds: 18 })

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => {
        let { hours, minutes, seconds } = prev
        seconds++
        if (seconds >= 60) {
          seconds = 0
          minutes++
        }
        if (minutes >= 60) {
          minutes = 0
          hours++
        }
        return { hours, minutes, seconds }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (val: number) => val.toString().padStart(2, "0")

  return (
    <div className="bg-background font-sans min-h-screen flex flex-col overflow-hidden">
      {/* Desktop Header */}
      <DesktopHeader variant="partner" />
      <MobileHeader />

      {/* Desktop Layout */}
      <div className="hidden lg:flex max-w-7xl mx-auto w-full h-[calc(100vh-80px)]">
        {/* Left Panel - Job Details */}
        <div className="w-[400px] bg-card border-r border-border flex flex-col">
          {/* Job Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <Link
                href="/partner"
                className="size-10 rounded-full bg-background flex items-center justify-center text-navy hover:bg-muted/20 transition-colors"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </Link>
              <h1 className="text-navy font-bold text-lg">Job ID: #AG-492</h1>
              <button className="size-10 rounded-full bg-background flex items-center justify-center text-navy hover:bg-muted/20 transition-colors">
                <span className="material-symbols-outlined">more_vert</span>
              </button>
            </div>

            {/* Status & Timer */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 bg-success/10 px-3 py-1 rounded-full border border-success/20">
                <div className="w-2.5 h-2.5 bg-success rounded-full animate-pulse"></div>
                <span className="text-success text-xs font-bold uppercase tracking-wider">Work in Progress</span>
              </div>
              <div className="text-[4rem] leading-none font-black text-navy tracking-tighter tabular-nums mt-2">
                {formatTime(elapsed.hours)}:{formatTime(elapsed.minutes)}:{formatTime(elapsed.seconds)}
              </div>
              <p className="text-muted text-sm font-medium">Started at 09:30 AM</p>
            </div>
          </div>

          {/* Job Info */}
          <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">
            {/* Farmer & Equipment */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background rounded-2xl p-4 flex flex-col gap-1 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-muted text-lg">person</span>
                  <span className="text-xs font-semibold text-muted uppercase tracking-wide">Farmer</span>
                </div>
                <div className="font-bold text-navy text-lg truncate">Rajesh Kumar</div>
                <div className="text-xs text-muted">+91 98765 43210</div>
              </div>
              <div className="bg-background rounded-2xl p-4 flex flex-col gap-1 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-muted text-lg">handyman</span>
                  <span className="text-xs font-semibold text-muted uppercase tracking-wide">Equipment</span>
                </div>
                <div className="font-bold text-navy text-lg truncate">Rotavator</div>
                <div className="text-xs text-muted">7 Feet • Heavy Duty</div>
              </div>
            </div>

            {/* Earnings & Area */}
            <div className="bg-background rounded-2xl p-5 border border-border">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wide">Est. Earnings</span>
                  <div className="text-3xl font-black text-navy flex items-baseline gap-1">
                    <span className="text-xl font-bold">₹</span>
                    1,250
                    <span className="text-sm font-medium text-muted">.00</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wide">Area Covered</span>
                  <div className="text-2xl font-bold text-navy">
                    1.2 <span className="text-sm text-muted font-medium">Acres</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Stats */}
            <div className="bg-background rounded-2xl p-5 border border-border">
              <h3 className="font-bold text-foreground mb-4">Job Progress</h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Total Area</span>
                  <span className="font-semibold">2.5 Acres</span>
                </div>
                <div className="w-full h-3 bg-muted/20 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: "48%" }}></div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Completed: 1.2 Acres</span>
                  <span className="font-semibold text-primary">48%</span>
                </div>
              </div>
            </div>

            {/* Contact Farmer */}
            <div className="flex gap-3">
              <button className="flex-1 h-12 bg-primary/10 text-primary rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-xl">call</span>
                Call Farmer
              </button>
              <button className="flex-1 h-12 bg-muted/20 text-foreground rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-muted/30 transition-colors">
                <span className="material-symbols-outlined text-xl">chat</span>
                Message
              </button>
            </div>
          </div>

          {/* End Job Button */}
          <div className="p-6 border-t border-border">
            <Link
              href="/partner"
              className="relative w-full h-14 bg-primary rounded-2xl overflow-hidden shadow-lg shadow-primary/30 group cursor-pointer select-none flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-white text-2xl">stop</span>
              <span className="text-white font-bold text-lg">End Job</span>
            </Link>
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="flex-1 relative bg-background bg-grid-pattern">
          <div className="absolute inset-0 flex items-center justify-center opacity-60 pointer-events-none">
            <svg className="w-full h-full text-primary opacity-20 fill-current" viewBox="0 0 200 200">
              <path d="M40,60 L160,40 L180,140 L20,160 Z" />
            </svg>
          </div>

          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.1))" }}>
            <path d="M 200 300 Q 400 350 500 500" fill="none" stroke="#ee8839" strokeDasharray="10,5" strokeLinecap="round" strokeWidth="6" />
            <g transform="translate(500, 500)">
              <circle className="animate-ping" cx="0" cy="0" fill="#1a4570" fillOpacity="0.2" r="20" />
              <circle cx="0" cy="0" fill="#1a4570" r="10" stroke="white" strokeWidth="3" />
            </g>
          </svg>

          {/* Speed Indicator */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card p-3 rounded-xl shadow-lg border border-border flex items-center gap-3">
            <div className="bg-navy text-white p-2 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">agriculture</span>
            </div>
            <div className="pr-2">
              <div className="text-xs text-muted font-semibold uppercase">Current Speed</div>
              <div className="text-lg font-bold text-navy">4.2 km/h</div>
            </div>
          </div>

          {/* Map Controls */}
          <div className="absolute right-6 top-6 flex flex-col gap-2">
            <button className="size-12 bg-card rounded-xl shadow-md flex items-center justify-center text-muted hover:text-navy active:scale-95 transition">
              <span className="material-symbols-outlined">my_location</span>
            </button>
            <button className="size-12 bg-card rounded-xl shadow-md flex items-center justify-center text-muted hover:text-navy active:scale-95 transition">
              <span className="material-symbols-outlined">layers</span>
            </button>
            <button className="size-12 bg-card rounded-xl shadow-md flex items-center justify-center text-muted hover:text-navy active:scale-95 transition">
              <span className="material-symbols-outlined">fullscreen</span>
            </button>
          </div>

          {/* Live Stats Bar */}
          <div className="absolute bottom-6 left-6 right-6 bg-card/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">speed</span>
                  <div>
                    <p className="text-xs text-muted">Avg Speed</p>
                    <p className="font-bold text-foreground">3.8 km/h</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">local_gas_station</span>
                  <div>
                    <p className="text-xs text-muted">Fuel Used</p>
                    <p className="font-bold text-foreground">8.5 L</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">route</span>
                  <div>
                    <p className="text-xs text-muted">Distance</p>
                    <p className="font-bold text-foreground">2.4 km</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 bg-muted/20 rounded-xl text-sm font-medium hover:bg-muted/30 transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">pause</span>
                  Pause
                </button>
                <button className="px-4 py-2 bg-destructive/10 text-destructive rounded-xl text-sm font-medium hover:bg-destructive/20 transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">flag</span>
                  Report Issue
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col flex-1">
        {/* Header */}
        <header className="bg-card pt-12 pb-4 px-6 shadow-sm z-20 flex flex-col gap-4 relative">
          <div className="flex justify-between items-center">
            <Link
              href="/partner"
              className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-navy hover:bg-muted/20 transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="text-navy font-bold text-lg tracking-tight">Job ID: #AG-492</h1>
            <button className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-navy hover:bg-muted/20 transition-colors">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>

          <div className="flex flex-col items-center justify-center gap-1">
            <div className="flex items-center gap-2 bg-success/10 px-3 py-1 rounded-full border border-success/20">
              <div className="w-2.5 h-2.5 bg-success rounded-full status-dot"></div>
              <span className="text-success text-xs font-bold uppercase tracking-wider">Work in Progress</span>
            </div>
            <div className="text-[3.5rem] leading-none font-black text-navy tracking-tighter tabular-nums mt-2">
              {formatTime(elapsed.hours)}:{formatTime(elapsed.minutes)}:{formatTime(elapsed.seconds)}
            </div>
            <p className="text-muted text-sm font-medium">Started at 09:30 AM</p>
          </div>
        </header>

      {/* Map Area */}
      <div className="flex-grow relative w-full bg-background bg-grid-pattern overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-60 pointer-events-none">
          <svg className="w-full h-full text-primary opacity-20 fill-current" viewBox="0 0 200 200">
            <path d="M40,60 L160,40 L180,140 L20,160 Z" />
          </svg>
        </div>

        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.1))" }}
        >
          <path
            d="M 80 180 Q 120 220 180 300"
            fill="none"
            stroke="#ee8839"
            strokeDasharray="10,5"
            strokeLinecap="round"
            strokeWidth="6"
          />
          <g transform="translate(180, 300)">
            <circle className="animate-ping" cx="0" cy="0" fill="#1a4570" fillOpacity="0.2" r="16" />
            <circle cx="0" cy="0" fill="#1a4570" r="8" stroke="white" strokeWidth="2" />
          </g>
        </svg>

        {/* Speed Indicator */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card p-2 rounded-xl shadow-lg border border-border flex items-center gap-2">
          <div className="bg-navy text-white p-1.5 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-lg">agriculture</span>
          </div>
          <div className="pr-2">
            <div className="text-[10px] text-muted font-semibold uppercase">Speed</div>
            <div className="text-sm font-bold text-navy">4.2 km/h</div>
          </div>
        </div>

        {/* Map Controls */}
        <div className="absolute right-4 top-4 flex flex-col gap-2">
          <button className="w-10 h-10 bg-card rounded-xl shadow-md flex items-center justify-center text-muted hover:text-navy active:scale-95 transition">
            <span className="material-symbols-outlined">my_location</span>
          </button>
          <button className="w-10 h-10 bg-card rounded-xl shadow-md flex items-center justify-center text-muted hover:text-navy active:scale-95 transition">
            <span className="material-symbols-outlined">layers</span>
          </button>
        </div>
      </div>

      {/* Bottom Panel */}
      <div className="bg-card rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.1)] -mt-6 z-10 relative flex flex-col">
        <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-muted/30 rounded-full"></div>
        </div>

        <div className="px-6 pb-6 pt-2 flex flex-col gap-6">
          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background rounded-2xl p-4 flex flex-col gap-1 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-muted text-lg">person</span>
                <span className="text-xs font-semibold text-muted uppercase tracking-wide">Farmer</span>
              </div>
              <div className="font-bold text-navy text-lg truncate">Rajesh Kumar</div>
              <div className="text-xs text-muted">+91 98765 43210</div>
            </div>
            <div className="bg-background rounded-2xl p-4 flex flex-col gap-1 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-muted text-lg">handyman</span>
                <span className="text-xs font-semibold text-muted uppercase tracking-wide">Equipment</span>
              </div>
              <div className="font-bold text-navy text-lg truncate">Rotavator</div>
              <div className="text-xs text-muted">7 Feet • Heavy Duty</div>
            </div>
          </div>

          {/* Earnings & Area */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-muted uppercase tracking-wide">Est. Earnings</span>
              <div className="text-2xl font-black text-navy flex items-baseline gap-1">
                <span className="text-lg font-bold">₹</span>
                1,250
                <span className="text-sm font-medium text-muted">.00</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs font-semibold text-muted uppercase tracking-wide">Area Covered</span>
              <div className="text-xl font-bold text-navy">
                1.2 <span className="text-sm text-muted font-medium">Acres</span>
              </div>
            </div>
          </div>

          {/* Slide to End */}
          <div className="pt-2 pb-8 sm:pb-4">
            <Link
              href="/partner"
              className="relative w-full h-16 bg-primary rounded-full overflow-hidden shadow-lg shadow-primary/30 group cursor-pointer select-none flex items-center"
            >
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <span className="text-white font-bold text-lg tracking-wider uppercase pl-8">Slide to End Job</span>
                <span className="material-symbols-outlined text-white/50 animate-pulse ml-2">chevron_right</span>
                <span className="material-symbols-outlined text-white/30 animate-pulse">chevron_right</span>
              </div>
              <div className="absolute left-1 top-1 bottom-1 w-14 h-14 bg-card rounded-full shadow-md flex items-center justify-center z-20 transition-transform group-active:translate-x-[calc(100%-3.5rem)] duration-200 ease-out">
                <span className="material-symbols-outlined text-primary text-2xl font-bold">stop</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
