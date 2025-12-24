"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { hasActiveSession, verifyPin, createSession } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lock } from "lucide-react"

export function PinGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if session exists
    if (hasActiveSession()) {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (verifyPin(pin)) {
      createSession()
      setIsAuthenticated(true)
      setError("")
    } else {
      setError("PIN salah. Coba lagi.")
      setPin("")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Memuat...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Kasirio</h1>
            <p className="text-muted-foreground">Masukkan PIN untuk melanjutkan</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Masukkan PIN"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value)
                  setError("")
                }}
                className="text-center text-2xl tracking-widest h-14"
                maxLength={10}
                autoFocus
              />
              {error && <p className="text-sm text-red-500 mt-2 text-center">{error}</p>}
            </div>

            <Button type="submit" className="w-full h-12 text-lg" disabled={!pin}>
              Masuk
            </Button>

            <p className="text-xs text-center text-muted-foreground">PIN default: ****</p>
          </form>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
