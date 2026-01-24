import Image from "next/image"
import Link from "next/link"
import { BottomNav } from "@/components/bottom-nav"
import { DesktopHeader } from "@/components/desktop-header"
import { MobileHeader } from "@/components/mobile-header"
import { EquipmentCard } from "@/components/equipment-card"
import { PopularItemCard } from "@/components/popular-item-card"
import { API_ENDPOINTS, type Category } from "@/lib/api"

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(API_ENDPOINTS.CATEGORIES, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })
    
    if (!res.ok) {
      console.error("Failed to fetch categories")
      return []
    }
    
    const data = await res.json()
    return data.results || data // Handle pagination or direct array
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
}

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

export default async function HomePage() {
  const categories = await getCategories()

  return (
    <div className="flex flex-col min-h-screen pb-24 lg:pb-0 bg-background">
      {/* Desktop Header */}
      <DesktopHeader variant="farmer" />

      {/* Mobile Header */}
      <MobileHeader />

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
            {categories.length > 0 ? (
              categories.map((item) => (
                <EquipmentCard 
                  key={item.id} 
                  name={item.name}
                  slug={item.slug}
                  image={item.icon || "/placeholder.svg"} 
                  price="View Services" 
                />
              ))
            ) : (
              // Fallback if no categories found or error
              <div className="col-span-2 lg:col-span-4 text-center py-8 text-muted">
                <p>Loading categories...</p>
              </div>
            )}
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
