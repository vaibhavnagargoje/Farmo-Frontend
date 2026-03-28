import type { MetadataRoute } from "next"
import { API_ENDPOINTS, type Category } from "@/lib/api"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://farmo.in"

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/auth`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ]

  try {
    const res = await fetch(API_ENDPOINTS.CATEGORIES, { next: { revalidate: 3600 } })
    if (res.ok) {
      const data = await res.json()
      const categories: Category[] = data.results || data || []
      
      const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
        url: `${baseUrl}/category/${c.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      }))
      
      return [...routes, ...categoryRoutes]
    }
  } catch (err) {
    console.warn("Failed to generate sitemap for categories", err)
  }

  return routes
}
