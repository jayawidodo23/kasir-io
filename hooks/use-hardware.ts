"use client"

import { useState, useEffect, useCallback } from "react"
import {
  detectAllHardware,
  requestHIDDevice,
  requestUSBDevice,
  supportsWebHID,
  supportsWebUSB,
  type HardwareStatus,
} from "@/lib/hardware"

const initialStatus: HardwareStatus = {
  printer: { connected: false, devices: [], lastCheck: null },
  scanner: { connected: false, devices: [], lastCheck: null },
}

export function useHardware() {
  const [status, setStatus] = useState<HardwareStatus>(initialStatus)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Scan for hardware
  const scan = useCallback(async () => {
    setIsScanning(true)
    setError(null)
    try {
      const result = await detectAllHardware()
      setStatus(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hardware detection failed")
    } finally {
      setIsScanning(false)
    }
  }, [])

  // Request new device access
  const requestPrinter = useCallback(async () => {
    if (!supportsWebUSB()) {
      setError("Browser tidak mendukung WebUSB")
      return null
    }
    try {
      const device = await requestUSBDevice()
      if (device) {
        await scan() // Refresh status
      }
      return device
    } catch {
      setError("Gagal menambahkan printer")
      return null
    }
  }, [scan])

  const requestScanner = useCallback(async () => {
    if (!supportsWebHID()) {
      setError("Browser tidak mendukung WebHID")
      return null
    }
    try {
      const device = await requestHIDDevice()
      if (device) {
        await scan() // Refresh status
      }
      return device
    } catch {
      setError("Gagal menambahkan scanner")
      return null
    }
  }, [scan])

  // Initial scan on mount
  useEffect(() => {
    scan()

    // Set up periodic scanning every 10 seconds
    const interval = setInterval(scan, 10000)
    return () => clearInterval(interval)
  }, [scan])

  return {
    status,
    isScanning,
    error,
    scan,
    requestPrinter,
    requestScanner,
    supportsWebHID: supportsWebHID(),
    supportsWebUSB: supportsWebUSB(),
  }
}
