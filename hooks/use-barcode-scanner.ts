"use client"

import { useEffect, useCallback, useRef } from "react"

interface UseBarcodeSccannerOptions {
  onScan: (barcode: string) => void
  enabled?: boolean
  minLength?: number
  scanTimeout?: number
}

export function useBarcodeScanner({
  onScan,
  enabled = true,
  minLength = 3,
  scanTimeout = 100,
}: UseBarcodeSccannerOptions) {
  const bufferRef = useRef("")
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastKeyTimeRef = useRef(0)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return

      // Skip if focus is on input/textarea (let them handle it)
      const target = e.target as HTMLElement
      const isInputFocused = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable

      // For inputs, we still track but don't prevent default
      const currentTime = Date.now()
      const timeDiff = currentTime - lastKeyTimeRef.current
      lastKeyTimeRef.current = currentTime

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // If time between keys is too long, reset buffer
      if (timeDiff > scanTimeout && bufferRef.current.length > 0) {
        bufferRef.current = ""
      }

      // Handle Enter key - end of barcode
      if (e.key === "Enter" && bufferRef.current.length >= minLength) {
        const barcode = bufferRef.current
        bufferRef.current = ""

        // Only trigger callback if not in an input (inputs handle this themselves)
        if (!isInputFocused) {
          e.preventDefault()
          onScan(barcode)
        }
        return
      }

      // Only add printable characters
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        bufferRef.current += e.key
      }

      // Set timeout to clear buffer
      timeoutRef.current = setTimeout(() => {
        bufferRef.current = ""
      }, scanTimeout * 3)
    },
    [enabled, minLength, scanTimeout, onScan],
  )

  useEffect(() => {
    if (enabled) {
      window.addEventListener("keydown", handleKeyDown, true)
      return () => window.removeEventListener("keydown", handleKeyDown, true)
    }
  }, [enabled, handleKeyDown])

  return {
    clearBuffer: () => {
      bufferRef.current = ""
    },
  }
}
