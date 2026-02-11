import { BottomNav } from "@/components/bottom-nav"
import { DesktopHeader } from "@/components/desktop-header"
import { MobileHeader } from "@/components/mobile-header"
import { ServiceTabs } from "@/components/service-tabs"
import { API_ENDPOINTS, type Category } from "@/lib/api"

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(API_ENDPOINTS.CATEGORIES, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.results || data
  } catch {
    return []
  }
}

export default async function HomePage() {
  const categories = await getCategories()

  return (
    <div className="flex flex-col min-h-screen pb-24 lg:pb-0 bg-background">
      <DesktopHeader variant="farmer" />
      <MobileHeader />

      <main className="flex-1 lg:max-w-7xl lg:mx-auto lg:w-full">
        <ServiceTabs categories={categories} />
      </main>

      <BottomNav variant="farmer" />
    </div>
  )
}
