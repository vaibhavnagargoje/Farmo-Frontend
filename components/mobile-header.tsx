"use client"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { LocationDropdown } from "@/components/location-dropdown"

interface MobileHeaderProps {
  className?: string
  location?: string
}

export function MobileHeader({ className }: MobileHeaderProps) {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isSearchExpanded) {
      inputRef.current?.focus()
    }
  }, [isSearchExpanded])

  return (
    <header className={cn("sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 lg:hidden", className)}>
      <div className="flex items-center justify-between px-4 h-16 relative overflow-hidden">
        
        {/* Logo & Location Section */}
        <div className={cn(
            "flex items-center gap-3 transition-all duration-300 ease-in-out",
            isSearchExpanded ? "opacity-0 -translate-x-full absolute pointer-events-none" : "opacity-100 translate-x-0 relative"
          )}>
            <div className="flex items-center gap-3 shrink-0">
               <Link href="/" className="size-10 bg-navy rounded-xl flex items-center justify-center shadow-sm">
                   <span className="material-symbols-outlined text-primary text-[24px]">agriculture</span>
               </Link>
               <div className="flex flex-col justify-center">
                   <Link href="/" className="text-xl font-bold text-navy leading-none tracking-tight">Farmo</Link>
                   <LocationDropdown variant="mobile" />
               </div>
            </div>
        </div>

        {/* Right Actions / Search Bar */}
        <div className={cn(
             "flex items-center gap-2 transition-all duration-300 ease-in-out",
             isSearchExpanded ? "w-full" : "w-auto ml-auto"
           )}>
            
            {/* Search Input Container */}
             <div className={cn(
                "relative flex items-center transition-all duration-300 ease-in-out", 
                isSearchExpanded ? "w-full" : "w-10"
             )}>
                {isSearchExpanded ? (
                   <div className="relative w-full animate-in fade-in zoom-in-95 duration-200">
                      <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search tractors..."
                        className="w-full h-10 pl-10 pr-9 rounded-full bg-muted/50 border border-transparent focus:bg-background focus:border-primary/50 focus:shadow-sm outline-none text-sm placeholder:text-muted-foreground/60 transition-all"
                        onBlur={(e) => {
                           if(!e.target.value) setIsSearchExpanded(false)
                        }}
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-muted-foreground text-[20px]">search</span>
                      <button 
                        onClick={() => setIsSearchExpanded(false)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 size-6 flex items-center justify-center rounded-full bg-background/50 text-muted-foreground hover:text-foreground"
                      >
                         <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                   </div>
                ) : (
                   <button 
                    onClick={() => setIsSearchExpanded(true)}
                    className="flex items-center justify-center size-10 rounded-full hover:bg-muted/50 text-foreground active:scale-95 transition-transform"
                   >
                     <span className="material-symbols-outlined text-[24px]">search</span>
                   </button>
                )}
             </div>

             {/* Notification Icon (Hidden when searching to give space) */}
             <button className={cn(
                "flex items-center justify-center size-10 rounded-full hover:bg-muted/50 text-foreground active:scale-95 transition-transform relative",
                isSearchExpanded && "hidden"
              )}>
                 <span className="material-symbols-outlined text-[24px]">notifications</span>
                 <span className="absolute top-2.5 right-2 size-2 bg-destructive rounded-full border-2 border-background"></span>
             </button>
        </div>

      </div>
    </header>
  )
}
