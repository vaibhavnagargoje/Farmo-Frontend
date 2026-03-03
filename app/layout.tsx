import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/auth-context"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Farmo - Farm Equipment & Services Rental | farmo.in",
    template: "%s | Farmo",
  },
  description:
    "Rent tractors, harvesters, rotavators and farm equipment on demand. Book verified farm service providers near you. Fast, affordable & reliable.",
  metadataBase: new URL("https://farmo.in"),
  keywords: [
    "farm equipment rental",
    "tractor rental",
    "harvester rental",
    "farm services",
    "agriculture equipment",
    "farmo",
    "rotavator",
    "farm machinery",
    "kisan services",
    "farming India",
  ],
  authors: [{ name: "Farmo" }],
  creator: "Farmo",
  publisher: "Farmo",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://farmo.in",
    siteName: "Farmo",
    title: "Farmo - Farm Equipment & Services Rental",
    description:
      "Rent tractors, harvesters, rotavators and farm equipment on demand. Book verified farm service providers near you.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Farmo - Farm Equipment & Services Rental",
    description:
      "Rent tractors, harvesters, rotavators and farm equipment on demand. Book verified farm service providers near you.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://farmo.in",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#1a4570",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className={`font-sans antialiased min-h-screen bg-muted/30`}>
        <AuthProvider>
          {/* Mobile: constrained width, Desktop: full width */}
          <div className="mx-auto lg:max-w-none max-w-md min-h-screen bg-background lg:bg-transparent relative">
            {children}
          </div>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
