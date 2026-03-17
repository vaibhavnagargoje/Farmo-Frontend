import Image from "next/image"
import Link from "next/link"

interface SearchResultCardProps {
  id: string
  name: string
  image: string
  price: number
  rating: number
  location: string
  distance: string
  specs: {
    power: string
    fuel: string
    type: string
  }
}

export function SearchResultCard({ id, name, image, price, rating, location, distance, specs }: SearchResultCardProps) {
  return (
    <div className="bg-card rounded-2xl p-4 lg:p-5 shadow-sm border border-border/50 flex flex-col gap-4 group hover:shadow-lg transition-shadow">
      <div className="relative w-full aspect-[16/10] bg-muted/20 rounded-xl overflow-hidden">
        <Image
          src={image || "/placeholder.svg"}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <button className="absolute top-3 left-3 size-9 lg:size-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-destructive hover:text-white transition-all active:scale-90">
          <span className="material-symbols-outlined text-[20px]">favorite</span>
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg lg:text-xl font-bold text-foreground leading-tight group-hover:text-navy transition-colors">
              {name}
            </h3>
            <div className="flex items-center gap-1 text-muted mt-1">
              <span className="material-symbols-outlined text-[14px]">location_on</span>
              <span className="text-xs lg:text-sm">
                {location} • {distance}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-success/10 px-2 lg:px-3 py-1 lg:py-1.5 rounded lg:rounded-lg text-xs lg:text-sm font-bold text-success">
            <span>{rating}</span>
            <span className="material-symbols-outlined text-[12px] lg:text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              star
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 lg:gap-4 py-2 lg:py-3 border-t border-b border-border/50">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-muted text-[18px]">payments</span>
            <span className="text-xs lg:text-sm font-medium text-muted-foreground">₹{price}/hr</span>
          </div>
          <div className="w-px h-3 lg:h-4 bg-border"></div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-muted text-[18px]">settings</span>
            <span className="text-xs lg:text-sm font-medium text-muted-foreground">{specs.type}</span>
          </div>
        </div>

        <Link
          href={`/booking/new/${id}`}
          className="w-full py-3 lg:py-3.5 rounded-xl bg-primary text-white font-bold text-sm lg:text-base hover:bg-primary/90 transition-all active:scale-[0.98] shadow-sm hover:shadow-md text-center"
        >
          Book Now
        </Link>
      </div>
    </div>
  )
}
