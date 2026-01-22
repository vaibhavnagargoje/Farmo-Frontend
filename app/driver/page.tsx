import Image from "next/image"
import Link from "next/link"
import { BottomNav } from "@/components/bottom-nav"
import { DesktopHeader } from "@/components/desktop-header"
import { Switch } from "@/components/ui/switch"

const upcomingSchedule = [
  {
    id: "1",
    title: "Rotavator Work",
    icon: "agriculture",
    iconBg: "bg-blue-50",
    iconColor: "text-navy",
    date: "Tomorrow",
    time: "9:00 AM",
    area: "2 Acres",
  },
  {
    id: "2",
    title: "Crop Transport",
    icon: "local_shipping",
    iconBg: "bg-orange-50",
    iconColor: "text-primary",
    date: "Fri, 12 Oct",
    time: "2:00 PM",
    area: null,
  },
]

const recentEarnings = [
  { id: "1", job: "Ploughing", farmer: "Suresh Sharma", amount: 2400, date: "Today" },
  { id: "2", job: "Rotavator Work", farmer: "Amit Singh", amount: 1800, date: "Yesterday" },
  { id: "3", job: "Harvesting", farmer: "Rajesh Kumar", amount: 3500, date: "2 days ago" },
]

export default function DriverDashboard() {
  return (
    <div className="relative flex h-full w-full flex-col overflow-x-hidden bg-background min-h-screen">
      {/* Desktop Header */}
      <DesktopHeader variant="driver" />

      {/* Mobile Header */}
      <header className="bg-navy pt-14 pb-6 px-5 sticky top-0 z-30 rounded-b-[2rem] shadow-lg lg:hidden">
        <div className="flex items-center justify-between">
          {/* User Profile & Status */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="size-12 rounded-full border-2 border-white/30 overflow-hidden">
                <Image
                  src="/indian-tractor-driver-man-portrait.jpg"
                  alt="Driver profile"
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </div>
              <div className="absolute bottom-0 right-0 size-3.5 bg-success border-2 border-navy rounded-full"></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                defaultChecked 
                className="scale-125 data-[state=checked]:bg-success data-[state=unchecked]:bg-muted"
              />
            </div>
          </div>

          {/* Wallet Balance */}
          <div className="flex flex-col items-end">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">account_balance_wallet</span>
              <span className="text-white text-lg font-bold tracking-wide">₹4,500</span>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Layout */}
      <div className="hidden lg:block max-w-7xl mx-auto w-full px-6 py-8">
        {/* Desktop Status Bar */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="size-16 rounded-full border-2 border-navy/20 overflow-hidden">
                    <Image
                      src="/indian-tractor-driver-man-portrait.jpg"
                      alt="Driver profile"
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute bottom-0 right-0 size-4 bg-success border-2 border-card rounded-full"></div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Welcome back, Driver!</h2>
                  <p className="text-muted">Ready to accept jobs</p>
                </div>
              </div>
              <div className="flex items-center gap-3 pl-6 border-l border-border">
                <span className="text-sm font-medium text-muted">Status:</span>
                <Switch 
                  defaultChecked 
                  className="scale-125 data-[state=checked]:bg-success data-[state=unchecked]:bg-muted"
                />
                <span className="text-sm font-semibold text-success">Online</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-navy/5 rounded-xl px-6 py-3 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-2xl">account_balance_wallet</span>
                <div>
                  <p className="text-xs text-muted">Wallet Balance</p>
                  <p className="text-xl font-bold text-navy">₹4,500</p>
                </div>
              </div>
              <Link
                href="/driver/earnings"
                className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                View Earnings
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Main Content - Incoming Request */}
          <div className="col-span-2">
            <div className="w-full relative">
              <div className="absolute -top-3 left-6 z-20 bg-navy text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg border border-white/20">
                Incoming Request
              </div>

              <div className="bg-card rounded-2xl shadow-lg overflow-hidden flex flex-col relative z-10 border border-border">
                <div className="flex">
                  {/* Map Preview */}
                  <div className="w-1/2 h-80 relative bg-muted/20 group">
                    <Image
                      src="/satellite-farm-field-map-view-punjab-india.jpg"
                      alt="Farm location map"
                      fill
                      className="object-cover opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20"></div>

                    <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-white">
                      <span className="material-symbols-outlined text-primary">location_on</span>
                      <span className="text-sm font-bold drop-shadow-md">2.4 km away</span>
                    </div>

                    <button className="absolute top-4 right-4 size-10 bg-card rounded-full flex items-center justify-center shadow-md text-navy hover:bg-muted/10 transition-colors">
                      <span className="material-symbols-outlined">open_in_full</span>
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="w-1/2 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-navy text-2xl font-extrabold leading-tight">Ploughing</h3>
                        <p className="text-muted font-bold text-lg mt-1">4 Acres</p>
                      </div>
                      <div className="text-right">
                        <p className="text-primary text-2xl font-black tracking-tight">₹3,200</p>
                        <p className="text-xs text-muted font-medium">Fixed Price</p>
                      </div>
                    </div>

                    <hr className="border-dashed border-border mb-4" />

                    {/* Farmer Info */}
                    <div className="flex items-center gap-3 mb-6 bg-background p-3 rounded-xl border border-border">
                      <div className="size-11 rounded-full overflow-hidden border-2 border-card shadow-sm">
                        <Image
                          src="/indian-farmer-portrait.png"
                          alt="Farmer"
                          width={44}
                          height={44}
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-navy font-bold text-base">Ramesh Kumar</p>
                        <div className="flex items-center gap-1">
                          <span
                            className="material-symbols-outlined text-sm text-yellow-500"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            star
                          </span>
                          <span className="text-sm font-bold text-foreground">4.8</span>
                          <span className="text-xs text-muted font-medium">• 12 Jobs</span>
                        </div>
                      </div>
                      <button className="size-10 rounded-full bg-card border border-border text-navy flex items-center justify-center shadow-sm hover:bg-muted/10 transition-colors">
                        <span className="material-symbols-outlined">call</span>
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button className="flex-1 h-12 rounded-xl border-2 border-border text-muted font-bold flex items-center justify-center hover:bg-muted/10 transition-all">
                        Reject
                      </button>
                      <Link
                        href="/driver/job/active"
                        className="flex-[1.5] h-12 rounded-xl bg-primary text-white font-bold flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all"
                      >
                        ACCEPT JOB
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-1 flex flex-col gap-6">
            {/* Quick Stats */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-bold text-lg text-foreground mb-4">Today's Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-navy">3</p>
                  <p className="text-xs text-muted">Jobs Completed</p>
                </div>
                <div className="bg-background rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-primary">₹5,400</p>
                  <p className="text-xs text-muted">Earned Today</p>
                </div>
              </div>
            </div>

            {/* Recent Earnings */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-foreground">Recent Earnings</h3>
                <Link href="/driver/earnings" className="text-primary text-sm font-semibold">See All</Link>
              </div>
              <div className="flex flex-col gap-3">
                {recentEarnings.map((earning) => (
                  <div key={earning.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-foreground text-sm">{earning.job}</p>
                      <p className="text-xs text-muted">{earning.farmer}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-success text-sm">+₹{earning.amount}</p>
                      <p className="text-xs text-muted">{earning.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Schedule */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-foreground">Upcoming</h3>
                <button className="text-primary text-sm font-semibold">See All</button>
              </div>
              <div className="flex flex-col gap-3">
                {upcomingSchedule.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border"
                  >
                    <div
                      className={`size-10 rounded-xl ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0`}
                    >
                      <span className="material-symbols-outlined text-xl">{item.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-foreground font-semibold truncate text-sm">{item.title}</h4>
                      <p className="text-xs text-muted">{item.date} • {item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Main Content */}
      <main className="flex-1 px-4 py-6 flex flex-col gap-6 pb-28 lg:hidden">
        {/* Incoming Request Card */}
        <div className="w-full relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 bg-navy text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg border border-white/20">
            Incoming Request
          </div>

          <div className="bg-card rounded-[2rem] shadow-lg overflow-hidden flex flex-col relative z-10">
            {/* Map Preview */}
            <div className="h-48 w-full relative bg-muted/20 group">
              <Image
                src="/satellite-farm-field-map-view-punjab-india.jpg"
                alt="Farm location map"
                fill
                className="object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>

              <div className="absolute bottom-3 left-4 flex items-center gap-1.5 text-white">
                <span className="material-symbols-outlined text-primary">location_on</span>
                <span className="text-sm font-bold drop-shadow-md">2.4 km away</span>
              </div>

              <button className="absolute top-3 right-3 size-10 bg-card rounded-full flex items-center justify-center shadow-md text-navy active:scale-95 transition-transform">
                <span className="material-symbols-outlined">open_in_full</span>
              </button>
            </div>

            {/* Card Body */}
            <div className="p-5 pt-4">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-navy text-2xl font-extrabold leading-tight">Ploughing</h3>
                  <p className="text-muted font-bold text-lg mt-1">4 Acres</p>
                </div>
                <div className="text-right">
                  <p className="text-primary text-2xl font-black tracking-tight">₹3,200</p>
                  <p className="text-xs text-muted font-medium">Fixed Price</p>
                </div>
              </div>

              <hr className="border-dashed border-border mb-4" />

              {/* Farmer Info */}
              <div className="flex items-center gap-3 mb-6 bg-background p-3 rounded-xl border border-border">
                <div className="size-11 rounded-full overflow-hidden border-2 border-card shadow-sm">
                  <Image
                    src="/indian-farmer-portrait.png"
                    alt="Farmer"
                    width={44}
                    height={44}
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-navy font-bold text-base">Ramesh Kumar</p>
                  <div className="flex items-center gap-1">
                    <span
                      className="material-symbols-outlined text-sm text-yellow-500"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span className="text-sm font-bold text-foreground">4.8</span>
                    <span className="text-xs text-muted font-medium">• 12 Jobs</span>
                  </div>
                </div>
                <button className="size-10 rounded-full bg-card border border-border text-navy flex items-center justify-center shadow-sm active:scale-90 transition-transform">
                  <span className="material-symbols-outlined">call</span>
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 h-14">
                <button className="flex-1 rounded-full border-2 border-border text-muted font-bold text-lg flex items-center justify-center hover:bg-muted/10 active:scale-95 transition-all">
                  Reject
                </button>
                <Link
                  href="/driver/job/active"
                  className="flex-[1.5] rounded-full bg-primary text-white font-bold text-lg flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-95 transition-all"
                >
                  ACCEPT JOB
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Schedule */}
        <div className="mt-2">
          <div className="flex items-center justify-between px-2 mb-3">
            <h3 className="text-navy text-xl font-bold">Upcoming Schedule</h3>
            <button className="text-primary text-sm font-bold">See All</button>
          </div>

          <div className="flex flex-col gap-3">
            {upcomingSchedule.map((item, index) => (
              <div
                key={item.id}
                className={`bg-card p-4 rounded-2xl shadow-sm border border-border flex items-center gap-4 active:scale-[0.98] transition-transform ${index > 0 ? "opacity-80" : ""}`}
              >
                <div
                  className={`size-14 rounded-2xl ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0`}
                >
                  <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-foreground text-lg font-bold truncate">{item.title}</h4>
                  <div className="flex items-center gap-2 text-muted text-sm font-medium mt-0.5">
                    <span className="bg-background px-1.5 py-0.5 rounded text-xs font-semibold text-foreground">
                      {item.date}
                    </span>
                    <span>•</span>
                    <span>{item.time}</span>
                    {item.area && (
                      <>
                        <span>•</span>
                        <span>{item.area}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className="material-symbols-outlined text-muted/50">chevron_right</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <BottomNav variant="driver" />
    </div>
  )
}
