import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/auth-context"
import { LanguageProvider } from "@/contexts/language-context"
import { LanguagePicker } from "@/components/language-picker"
import { PwaInstallPrompt } from "@/components/pwa-install-prompt"
import { PermissionProvider } from "@/contexts/permission-context"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Farmo - Farm Equipment & Services Rental | farmo.in",
    template: "%s | Farmo",
  },
  description:
    "Find machinery and labour at your doorstep. Book trusted farm services quickly with Farmo.",
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
      "Find machinery and labour at your doorstep with Farmo.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Farmo - Farm Equipment & Services Rental",
    description:
      "Find machinery and labour at your doorstep with Farmo.",
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
  icons: {
    icon: [
      { url: "/farmo-icon.ico", type: "image/x-icon" },
    ],
    shortcut: ["/farmo-icon.ico"],
    apple: [
      { url: "/farmo%20mobile%20logo.png", type: "image/png" },
    ],
  },
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
        <LanguageProvider>
          <PermissionProvider>
            <AuthProvider>
              {/* Mobile: constrained width, Desktop: full width */}
              <div className="mx-auto lg:max-w-none max-w-md min-h-screen bg-background lg:bg-transparent relative">
                {children}
              </div>
            </AuthProvider>
          </PermissionProvider>
          <LanguagePicker />
          <PwaInstallPrompt />
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  )
}
