import Image from "next/image"
import Link from "next/link"
import { BottomNav } from "@/components/bottom-nav"
import { DesktopHeader } from "@/components/desktop-header"
import { EquipmentCard } from "@/components/equipment-card"
import { PopularItemCard } from "@/components/popular-item-card"

const equipmentCategories = [
  {
    name: "Tractor",
    image: "/red-farm-tractor-in-field.jpg",
    price: "Starting ₹600/hr",
  },
  {
    name: "Harvester",
    image: "/green-combine-harvester-wheat-field.jpg",
    price: "Starting ₹1200/hr",
  },
  {
    name: "Sprayer",
    image: "/agricultural-sprayer-machinery.jpg",
    price: "Starting ₹400/hr",
  },
  {
    name: "Cultivator",
    image: "/soil-cultivator-farm-implement.jpg",
    price: "Starting ₹300/hr",
  },
]

const popularItems = [
  {
    name: "Mahindra 575 DI",
    image: "/mahindra-red-tractor-side-profile.jpg",
    price: 800,
    rating: 4.8,
  },
  {
    name: "John Deere 5310",
    image: "/green-john-deere-tractor-field.jpg",
    price: 950,
    rating: 4.9,
  },
  {
    name: "New Holland 3630",
    image: "/blue-new-holland-tractor.jpg",
    price: 850,
    rating: 4.6,
  },
]

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen pb-24 lg:pb-0 bg-background">
      {/* Desktop Header */}
      <DesktopHeader variant="farmer" />

      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="flex items-center justify-center size-10 rounded-full bg-card text-primary shadow-sm group-active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-[20px]">location_on</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted font-medium uppercase tracking-wide">Location</span>
              <div className="flex items-center gap-1">
                <h2 className="text-lg font-bold leading-none tracking-tight">Rampur Village</h2>
                <span className="material-symbols-outlined text-[20px] text-foreground">arrow_drop_down</span>
              </div>
            </div>
          </div>
          <button className="flex items-center justify-center size-10 rounded-full bg-card text-foreground shadow-sm hover:bg-muted/10 active:scale-95 transition-transform relative">
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="absolute top-2 right-2.5 size-2 bg-destructive rounded-full border border-card"></span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4 pt-1">
          <Link
            href="/search"
            className="relative flex items-center w-full h-14 rounded-full shadow-sm bg-card overflow-hidden group focus-within:ring-2 focus-within:ring-primary/50 transition-all"
          >
            <div className="pl-5 pr-3 text-muted">
              <span className="material-symbols-outlined text-[24px]">search</span>
            </div>
            <span className="flex-1 text-muted text-base font-medium">Find tractors, harvesters...</span>
            <button className="mr-2 p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20">
              <span className="material-symbols-outlined text-[20px]">mic</span>
            </button>
          </Link>
        </div>
      </header>

      {/* Desktop Search Bar */}
      <div className="hidden lg:block bg-background border-b border-border/50 py-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/search"
              className="flex-1 max-w-2xl relative flex items-center h-12 rounded-full shadow-sm bg-card border border-border overflow-hidden group hover:shadow-md transition-all"
            >
              <div className="pl-5 pr-3 text-muted">
                <span className="material-symbols-outlined text-[22px]">search</span>
              </div>
              <span className="flex-1 text-muted text-sm font-medium">Search for tractors, harvesters, sprayers...</span>
              <button className="mr-2 p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20">
                <span className="material-symbols-outlined text-[18px]">mic</span>
              </button>
            </Link>
            <button className="h-12 px-6 bg-primary text-white rounded-full font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">tune</span>
              <span>Filters</span>
            </button>
          </div>
        </div>
      </div>

      <main className="flex flex-col gap-6 pt-2 lg:pt-8 lg:max-w-7xl lg:mx-auto lg:px-6 lg:w-full">
        {/* Promo Banner */}
        <section className="px-4 lg:px-0">
          <div className="relative w-full overflow-hidden rounded-xl lg:rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
            <div className="relative z-10 flex flex-row items-center justify-between p-5 lg:p-8 min-h-[140px] lg:min-h-[200px]">
              <div className="flex flex-col gap-3 lg:gap-4 max-w-[60%] lg:max-w-[50%]">
                <div className="inline-flex items-center px-2 lg:px-3 py-1 lg:py-1.5 rounded-md bg-white/20 backdrop-blur-sm w-fit">
                  <span className="text-xs lg:text-sm font-bold tracking-wide uppercase">Harvest Special</span>
                </div>
                <h3 className="text-2xl lg:text-4xl font-bold leading-tight">
                  Flat ₹500 OFF
                  <br />
                  <span className="text-lg lg:text-xl font-medium opacity-90">on first booking</span>
                </h3>
                <Link
                  href="/search"
                  className="mt-1 px-4 lg:px-6 py-2 lg:py-3 bg-white text-primary text-sm lg:text-base font-bold rounded-full w-fit hover:bg-gray-50 active:scale-95 transition-transform"
                >
                  Book Now
                </Link>
              </div>
              <div className="absolute right-[-10px] lg:right-4 bottom-[-10px] lg:bottom-4 w-40 lg:w-64 h-40 lg:h-64">
                <Image src="/orange-tractor-illustration-promotional.jpg" alt="Tractor illustration" fill className="object-contain" />
              </div>
            </div>
          </div>
        </section>

        {/* Equipment Categories */}
        <section className="px-4 lg:px-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl lg:text-2xl font-bold text-foreground">Equipment</h3>
            <Link href="/search" className="text-primary font-semibold text-sm lg:text-base hover:underline">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {equipmentCategories.map((item) => (
              <EquipmentCard key={item.name} name={item.name} image={item.image} price={item.price} />
            ))}
          </div>
        </section>

        {/* Popular Now */}
        <section className="pb-6 lg:pb-12">
          <div className="flex items-center justify-between px-4 lg:px-0 mb-4">
            <h3 className="text-xl lg:text-2xl font-bold text-foreground">Popular Now</h3>
            <Link href="/search" className="text-primary font-semibold text-sm lg:text-base hover:underline hidden lg:block">
              View All
            </Link>
          </div>
          <div className="flex lg:grid lg:grid-cols-3 gap-4 overflow-x-auto lg:overflow-visible px-4 lg:px-0 pb-4 lg:pb-0 no-scrollbar snap-x snap-mandatory">
            {popularItems.map((item) => (
              <PopularItemCard
                key={item.name}
                name={item.name}
                image={item.image}
                price={item.price}
                rating={item.rating}
              />
            ))}
          </div>
        </section>
      </main>

      <BottomNav variant="farmer" />
    </div>
  )
}
