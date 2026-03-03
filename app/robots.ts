import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/partner/", "/profile/", "/bookings/", "/settings/", "/booking/"],
      },
    ],
    sitemap: "https://farmo.in/sitemap.xml",
  }
}
