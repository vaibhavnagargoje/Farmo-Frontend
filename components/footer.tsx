import Link from "next/link"

export function Footer() {
  return (
    <footer className="hidden lg:block bg-navy text-white mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 bg-white/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-xl">agriculture</span>
              </div>
              <span className="text-xl font-bold tracking-tight">My Farmo</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              India's leading farm equipment rental platform. Connecting farmers with quality machinery.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <a href="#" className="size-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <span className="material-symbols-outlined text-[20px]">facebook</span>
              </a>
              <a href="#" className="size-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <span className="material-symbols-outlined text-[20px]">twitter</span>
              </a>
              <a href="#" className="size-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3">
              <li><Link href="/" className="text-white/60 hover:text-white text-sm transition-colors">Home</Link></li>
              <li><Link href="/search" className="text-white/60 hover:text-white text-sm transition-colors">Search Equipment</Link></li>
              <li><Link href="/bookings" className="text-white/60 hover:text-white text-sm transition-colors">My Bookings</Link></li>
              <li><Link href="/profile" className="text-white/60 hover:text-white text-sm transition-colors">Profile</Link></li>
            </ul>
          </div>

          {/* For Operators */}
          <div>
            <h4 className="font-semibold mb-4">For Operators</h4>
            <ul className="space-y-3">
              <li><Link href="/driver/onboarding" className="text-white/60 hover:text-white text-sm transition-colors">List Your Equipment</Link></li>
              <li><Link href="/driver" className="text-white/60 hover:text-white text-sm transition-colors">Driver Dashboard</Link></li>
              <li><Link href="/driver/earnings" className="text-white/60 hover:text-white text-sm transition-colors">Earnings</Link></li>
              <li><a href="#" className="text-white/60 hover:text-white text-sm transition-colors">Partner Support</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-white/60 hover:text-white text-sm transition-colors">Help Center</a></li>
              <li><a href="#" className="text-white/60 hover:text-white text-sm transition-colors">Contact Us</a></li>
              <li><a href="#" className="text-white/60 hover:text-white text-sm transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-white/60 hover:text-white text-sm transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex items-center justify-between">
          <p className="text-white/40 text-sm">© 2026 My Farmo. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-white/40 text-sm">Download our app:</span>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
              <span className="material-symbols-outlined text-[18px]">android</span>
              <span className="text-sm font-medium">Play Store</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
              <span className="material-symbols-outlined text-[18px]">phone_iphone</span>
              <span className="text-sm font-medium">App Store</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
