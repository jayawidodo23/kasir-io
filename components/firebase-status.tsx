"use client"

import { useState, useEffect } from "react"
import { isFirebaseConfigured } from "@/lib/firebase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"

export function FirebaseStatus() {
  const [status, setStatus] = useState<"loading" | "configured" | "not-configured">("loading")

  useEffect(() => {
    // Check if Firebase is configured
    const configured = isFirebaseConfigured()
    setStatus(configured ? "configured" : "not-configured")
  }, [])

  if (status === "loading") {
    return (
      <Alert className="mb-6">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>Memeriksa koneksi database...</AlertTitle>
      </Alert>
    )
  }

  if (status === "not-configured") {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Firebase Belum Dikonfigurasi</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-2">Tambahkan environment variables berikut untuk menggunakan aplikasi:</p>
          <ul className="list-disc list-inside text-sm space-y-1 font-mono">
            <li>NEXT_PUBLIC_FIREBASE_API_KEY</li>
            <li>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</li>
            <li>NEXT_PUBLIC_FIREBASE_PROJECT_ID</li>
            <li>NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET</li>
            <li>NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID</li>
            <li>NEXT_PUBLIC_FIREBASE_APP_ID</li>
          </ul>
        </AlertDescription>
      </Alert>
    )
  }

  return null
}

// Small inline indicator for sidebar/header
export function FirebaseIndicator() {
  const [configured, setConfigured] = useState(true)

  useEffect(() => {
    setConfigured(isFirebaseConfigured())
  }, [])

  if (configured) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-600">
        <CheckCircle2 className="h-3 w-3" />
        <span>Online</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-destructive">
      <AlertTriangle className="h-3 w-3" />
      <span>Offline</span>
    </div>
  )
}
