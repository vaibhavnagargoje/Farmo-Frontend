import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface EquipmentCardProps {
  name: string
  image: string
  price: string
  className?: string
}

export function EquipmentCard({ name, image, price, className }: EquipmentCardProps) {
  return (
    <Link
      href={`/search?category=${name.toLowerCase()}`}
      className={cn(
        "group relative flex flex-col items-center p-1 rounded-xl lg:rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg transition-all active:scale-[0.98]",
        className,
      )}
    >
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4 lg:p-6 bg-background-soft rounded-lg lg:rounded-xl">
        <div className="w-full aspect-[4/3] relative rounded-lg lg:rounded-xl overflow-hidden mb-1">
          <Image 
            src={image || "/placeholder.svg"} 
            alt={name} 
            fill 
            className="object-cover group-hover:scale-105 transition-transform duration-500" 
          />
        </div>
        <div className="flex flex-col items-center text-center">
          <span className="text-base lg:text-lg font-bold text-foreground">{name}</span>
          <span className="text-xs lg:text-sm text-muted mt-0.5">{price}</span>
        </div>
      </div>
    </Link>
  )
}
