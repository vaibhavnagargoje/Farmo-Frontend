import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "My Farmo - Farm Equipment Rental",
  description: "Rent tractors, harvesters, and farm equipment on demand",
  generator: "v0.app",
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
        {/* Mobile: constrained width, Desktop: full width */}
        <div className="mx-auto lg:max-w-none max-w-md min-h-screen bg-background lg:bg-transparent relative">
          {children}
        </div>
        <Analytics />
      </body>
    </html>
  )
}
