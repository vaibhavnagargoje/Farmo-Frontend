import Image from "next/image"

interface PopularItemCardProps {
  name: string
  image: string
  price: number
  rating: number
}

export function PopularItemCard({ name, image, price, rating }: PopularItemCardProps) {
  return (
    <div className="snap-start min-w-[280px] lg:min-w-0 lg:w-full bg-card rounded-xl lg:rounded-2xl p-3 lg:p-4 border border-border shadow-sm hover:shadow-lg transition-shadow">
      <div className="relative w-full aspect-video rounded-lg lg:rounded-xl overflow-hidden mb-3">
        <Image src={image || "/placeholder.svg"} alt={name} fill className="object-cover hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-2 left-2 bg-card/90 backdrop-blur px-2 py-1 rounded text-xs font-bold">
          {rating} ★
        </div>
        <button className="absolute top-2 right-2 size-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-destructive transition-all">
          <span className="material-symbols-outlined text-[18px]">favorite</span>
        </button>
      </div>
      <div className="flex flex-col gap-1 px-1">
        <h4 className="text-lg lg:text-xl font-bold text-foreground">{name}</h4>
        <div className="flex justify-between items-center mt-1 lg:mt-2">
          <p className="text-primary font-bold text-lg">
            ₹{price}
            <span className="text-sm text-muted font-normal">/hr</span>
          </p>
          <button className="bg-primary text-white px-4 lg:px-6 py-1.5 lg:py-2 rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors">
            Book Now
          </button>
        </div>
      </div>
    </div>
  )
}
