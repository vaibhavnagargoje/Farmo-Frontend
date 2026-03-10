"use client"

export default function OfflinePage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <div className="size-20 rounded-full bg-muted/20 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-4xl text-muted">wifi_off</span>
            </div>
            <h1 className="text-2xl font-bold text-navy mb-2 lg:text-3xl">You are offline</h1>
            <p className="text-muted mb-8 max-w-sm">
                It looks like you&apos;ve lost your connection. Please check your internet connection and try again.
            </p>
            <button
                onClick={() => window.location.reload()}
                className="px-6 h-12 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
                <span className="material-symbols-outlined text-lg">refresh</span>
                <span>Try Again</span>
            </button>
        </div>
    )
}
