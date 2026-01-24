import Image from "next/image"
import Link from "next/link"
import { BottomNav } from "@/components/bottom-nav"
import { DesktopHeader } from "@/components/desktop-header"
import { MobileHeader } from "@/components/mobile-header"


const bookings = [
  {
    id: "AG-491",
    equipment: "Mahindra 575 DI",
    service: "Ploughing",
    date: "Today, 2:00 PM",
    status: "upcoming",
    price: 2400,
    image: "/red-mahindra-tractor.jpg",
  },
  {
    id: "AG-488",
    equipment: "John Deere 5310",
    service: "Rotavator Work",
    date: "Yesterday",
    status: "completed",
    price: 1800,
    image: "/placeholder.svg?height=80&width=80",
  },
  {
    id: "AG-485",
    equipment: "Sprayer Unit",
    service: "Pesticide Spray",
    date: "12 Oct 2024",
    status: "completed",
    price: 950,
    image: "/placeholder.svg?height=80&width=80",
  },
]

export default function BookingsPage() {
  return (
    <div className="min-h-screen flex flex-col pb-24 lg:pb-0 bg-background">
      {/* Desktop Header */}
      <DesktopHeader variant="farmer" />
      <MobileHeader />

      {/* Mobile Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm pt-12 pb-4 px-6 border-b border-border lg:hidden">
        <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
        <p className="text-sm text-muted mt-1">Track your equipment rentals</p>
      </header>

      {/* Desktop Content Wrapper */}
      <div className="lg:max-w-7xl lg:mx-auto lg:w-full lg:px-6 lg:py-8">
        {/* Desktop Header */}
        <div className="hidden lg:flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Bookings</h1>
            <p className="text-muted mt-1">Track and manage your equipment rentals</p>
          </div>
          <Link
            href="/search"
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined">add</span>
            New Booking
          </Link>
        </div>

        {/* Tabs */}
        <div className="px-6 lg:px-0 py-4 flex gap-3">
          <button className="px-4 lg:px-6 py-2 lg:py-2.5 bg-navy text-white rounded-full text-sm font-semibold">All</button>
          <button className="px-4 lg:px-6 py-2 lg:py-2.5 bg-card text-foreground rounded-full text-sm font-medium border border-border hover:bg-muted/50 transition-colors">
            Upcoming
          </button>
          <button className="px-4 lg:px-6 py-2 lg:py-2.5 bg-card text-foreground rounded-full text-sm font-medium border border-border hover:bg-muted/50 transition-colors">
            Completed
          </button>
        </div>

        {/* Bookings List */}
        <main className="flex-1 px-6 lg:px-0 flex flex-col lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {bookings.map((booking) => (
            <Link
              key={booking.id}
              href={`/booking/${booking.id}`}
              className="bg-card rounded-2xl p-4 lg:p-5 shadow-sm border border-border flex gap-4 active:scale-[0.99] hover:shadow-lg transition-all"
            >
              <div className="size-20 lg:size-24 rounded-xl overflow-hidden shrink-0">
                <Image
                  src={booking.image || "/placeholder.svg"}
                  alt={booking.equipment}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-foreground truncate lg:text-lg">{booking.equipment}</h3>
                    <p className="text-sm text-muted">{booking.service}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      booking.status === "upcoming" ? "bg-primary/10 text-primary" : "bg-success/10 text-success"
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted">{booking.date}</span>
                  <span className="font-bold text-navy lg:text-lg">₹{booking.price}</span>
                </div>
              </div>
            </Link>
          ))}
        </main>
      </div>

      <BottomNav variant="farmer" />
    </div>
  )
}
