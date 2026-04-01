import { BottomNav } from "@/components/bottom-nav"
import { DesktopHeader } from "@/components/desktop-header"
import { MobileHeader } from "@/components/mobile-header"
import { ServiceTabs } from "@/components/service-tabs"
import { API_ENDPOINTS, type Category } from "@/lib/api"

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(API_ENDPOINTS.CATEGORIES, {
      next: { revalidate: 60 },
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Farmo",
    "url": "https://farmo.in",
    "description": "Find machinery and labour at your doorstep with Farmo.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://farmo.in/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }

  return (
    <div className="flex flex-col min-h-screen pb-24 lg:pb-0 bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DesktopHeader variant="farmer" />
      <MobileHeader />

      <main className="flex-1 lg:max-w-7xl lg:mx-auto lg:w-full">
        <ServiceTabs categories={categories} />
      </main>

      <BottomNav variant="farmer" />
    </div>
  )
}
