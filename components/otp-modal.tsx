"use client"

interface OTPModalProps {
  code: string
  onDismiss: () => void
  isOpen: boolean
}

export function OTPModal({ code, onDismiss, isOpen }: OTPModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-[360px] bg-white rounded-xl border-[6px] border-primary flex flex-col items-center text-center p-8 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
        {/* Lock Icon */}
        <div className="mb-6 rounded-full bg-primary/10 p-4 flex items-center justify-center">
          <span className="material-symbols-outlined text-5xl text-primary font-bold">lock_open</span>
        </div>

        {/* Title */}
        <h2 className="text-foreground text-2xl font-bold mb-2">Start Service</h2>

        {/* Helper Text */}
        <p className="text-muted text-sm font-medium mb-6 leading-relaxed px-2">Verify the equipment ID matches.</p>

        {/* OTP Digits */}
        <div className="w-full bg-background border border-border rounded-lg py-6 mb-6">
          <div className="text-6xl font-black text-foreground tracking-[0.15em] leading-none pl-[0.15em]">{code}</div>
        </div>

        {/* Instruction */}
        <p className="text-muted-foreground text-base font-medium leading-normal mb-8 max-w-[280px]">
          Share this code with the equipment owner to begin the rental.
        </p>

        {/* Actions */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={onDismiss}
            className="w-full h-12 flex items-center justify-center rounded-full bg-primary text-white text-base font-bold tracking-wide hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
          >
            Dismiss
          </button>
          <button className="w-full h-12 flex items-center justify-center rounded-full bg-transparent text-muted text-sm font-semibold hover:text-foreground transition-colors">
            Problem with code?
          </button>
        </div>
      </div>
    </div>
  )
}
