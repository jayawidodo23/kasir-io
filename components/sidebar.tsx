"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  ShoppingCart,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  Receipt,
  TrendingUp,
  Menu,
  X,
  Lock,
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FirebaseIndicator } from "@/components/firebase-status"

const menuItems = [
  { href: "/", label: "Kasir", icon: ShoppingCart },
  { href: "/stok", label: "Stok Barang", icon: Package },
  { href: "/barang-masuk", label: "Barang Masuk", icon: ArrowDownToLine },
  { href: "/barang-keluar", label: "Barang Keluar", icon: ArrowUpFromLine },
  { href: "/transaksi", label: "Transaksi", icon: Receipt },
  { href: "/laba", label: "Laporan Laba", icon: TrendingUp },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-transparent"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 bg-card border-r border-border transition-transform lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <h1 className="text-xl font-bold text-foreground">Kasirio</h1>
            <p className="text-sm text-muted-foreground mt-1">Point of Sale</p>
            <div className="mt-2">
              <FirebaseIndicator />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="px-4 pb-2">
            <Link
              href="/ganti-pin"
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                pathname === "/ganti-pin"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Lock className="h-4 w-4" />
              Ganti PIN
            </Link>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">Data tersimpan di Firebase Cloud</p>
          </div>
        </div>
      </aside>
    </>
  )
}
