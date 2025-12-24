import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Sidebar } from "@/components/sidebar"
import { PinGuard } from "@/components/pin-guard"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Kasir - Point of Sale",
  description: "Aplikasi kasir dengan penyimpanan lokal, support barcode scanner dan print nota",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kasir Offline",
  },
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <body className="font-sans antialiased">
        <PinGuard>
          <Sidebar />
          <main className="lg:ml-64 min-h-screen bg-background">
            <div className="p-4 pt-16 lg:pt-4 lg:p-6">{children}</div>
          </main>
        </PinGuard>
      </body>
    </html>
  )
}
