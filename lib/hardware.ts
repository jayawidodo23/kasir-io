// Hardware Detection Library for Printer & Barcode Scanner
// Uses WebHID API (for HID barcode scanners) and navigator APIs

declare global {
  interface HIDDevice {
    opened: boolean
    vendorId: number
    productId: number
    productName: string
    collections: HIDCollectionInfo[]
    open(): Promise<void>
    close(): Promise<void>
    sendReport(reportId: number, data: BufferSource): Promise<void>
    sendFeatureReport(reportId: number, data: BufferSource): Promise<void>
    receiveFeatureReport(reportId: number): Promise<DataView>
    addEventListener(type: string, listener: EventListener): void
    removeEventListener(type: string, listener: EventListener): void
  }

  interface HIDCollectionInfo {
    usagePage: number
    usage: number
    children: HIDCollectionInfo[]
    inputReports: HIDReportInfo[]
    outputReports: HIDReportInfo[]
    featureReports: HIDReportInfo[]
  }

  interface HIDReportInfo {
    reportId: number
    items: HIDReportItem[]
  }

  interface HIDReportItem {
    isAbsolute: boolean
    isArray: boolean
    isRange: boolean
    hasNull: boolean
    usages: number[]
    usageMinimum: number
    usageMaximum: number
    reportSize: number
    reportCount: number
    logicalMinimum: number
    logicalMaximum: number
  }

  interface HIDDeviceRequestOptions {
    filters: Array<{ vendorId?: number; productId?: number; usagePage?: number; usage?: number }>
  }

  interface HID extends EventTarget {
    getDevices(): Promise<HIDDevice[]>
    requestDevice(options: HIDDeviceRequestOptions): Promise<HIDDevice[]>
  }

  interface Navigator {
    hid?: HID
  }
}

export interface HardwareDevice {
  name: string
  type: "printer" | "scanner" | "unknown"
  vendorId?: number
  productId?: number
  connected: boolean
  lastDetected: Date
}

export interface HardwareStatus {
  printer: {
    connected: boolean
    devices: HardwareDevice[]
    lastCheck: Date | null
  }
  scanner: {
    connected: boolean
    devices: HardwareDevice[]
    lastCheck: Date | null
  }
}

// Known Vendor IDs for common POS hardware
const KNOWN_PRINTER_VENDORS = [
  0x04b8, // Epson
  0x0519, // Star Micronics
  0x0dd4, // Bixolon
  0x0416, // Winbond (some thermal printers)
  0x0483, // STMicroelectronics (some receipt printers)
  0x1504, // HPRT
]

const KNOWN_SCANNER_VENDORS = [
  0x05e0, // Symbol/Zebra
  0x0c2e, // Metrologic/Honeywell
  0x040b, // Datalogic
  0x0536, // Hand Held Products
  0x05f9, // PSC
  0x2dd6, // Generic barcode scanners
  0x1eab, // Newland
  0x0483, // Some barcode scanners
]

// Check if browser supports WebHID
export function supportsWebHID(): boolean {
  return typeof navigator !== "undefined" && "hid" in navigator
}

// Check if browser supports WebUSB
export function supportsWebUSB(): boolean {
  return typeof navigator !== "undefined" && "usb" in navigator
}

// Detect HID devices (barcode scanners typically use HID)
export async function detectHIDDevices(): Promise<HardwareDevice[]> {
  if (!supportsWebHID()) {
    return []
  }

  try {
    const devices = await (navigator as Navigator & { hid: HID }).hid.getDevices()
    return devices.map((device) => ({
      name: device.productName || `HID Device ${device.vendorId}:${device.productId}`,
      type: KNOWN_SCANNER_VENDORS.includes(device.vendorId) ? "scanner" : "unknown",
      vendorId: device.vendorId,
      productId: device.productId,
      connected: device.opened || true,
      lastDetected: new Date(),
    }))
  } catch {
    return []
  }
}

// Request HID device access (requires user gesture)
export async function requestHIDDevice(): Promise<HIDDevice | null> {
  if (!supportsWebHID()) {
    return null
  }

  try {
    const devices = await (navigator as Navigator & { hid: HID }).hid.requestDevice({
      filters: KNOWN_SCANNER_VENDORS.map((vendorId) => ({ vendorId })),
    })
    return devices[0] || null
  } catch {
    return null
  }
}

// Detect USB devices (printers)
export async function detectUSBDevices(): Promise<HardwareDevice[]> {
  if (!supportsWebUSB()) {
    return []
  }

  try {
    const devices = await (navigator as Navigator & { usb: USB }).usb.getDevices()
    return devices.map((device) => ({
      name: device.productName || `USB Device ${device.vendorId}:${device.productId}`,
      type: KNOWN_PRINTER_VENDORS.includes(device.vendorId) ? "printer" : "unknown",
      vendorId: device.vendorId,
      productId: device.productId,
      connected: device.opened || true,
      lastDetected: new Date(),
    }))
  } catch {
    return []
  }
}

// Request USB device access (requires user gesture)
export async function requestUSBDevice(): Promise<USBDevice | null> {
  if (!supportsWebUSB()) {
    return null
  }

  try {
    const device = await (navigator as Navigator & { usb: USB }).usb.requestDevice({
      filters: KNOWN_PRINTER_VENDORS.map((vendorId) => ({ vendorId })),
    })
    return device
  } catch {
    return null
  }
}

// Check system print capability
export function checkPrintCapability(): boolean {
  return typeof window !== "undefined" && typeof window.print === "function"
}

// Combined hardware detection
export async function detectAllHardware(): Promise<HardwareStatus> {
  const [hidDevices, usbDevices] = await Promise.all([detectHIDDevices(), detectUSBDevices()])

  const scanners = hidDevices.filter((d) => d.type === "scanner" || KNOWN_SCANNER_VENDORS.includes(d.vendorId || 0))
  const printers = usbDevices.filter((d) => d.type === "printer" || KNOWN_PRINTER_VENDORS.includes(d.vendorId || 0))

  // Also check for browser print capability as fallback
  const hasBrowserPrint = checkPrintCapability()

  return {
    printer: {
      connected: printers.length > 0 || hasBrowserPrint,
      devices:
        printers.length > 0
          ? printers
          : hasBrowserPrint
            ? [{ name: "Browser Print", type: "printer", connected: true, lastDetected: new Date() }]
            : [],
      lastCheck: new Date(),
    },
    scanner: {
      connected: scanners.length > 0,
      devices: scanners,
      lastCheck: new Date(),
    },
  }
}

// Barcode Scanner Input Handler
export class BarcodeScanner {
  private buffer = ""
  private timeout: NodeJS.Timeout | null = null
  private callback: ((barcode: string) => void) | null = null
  private readonly SCAN_TIMEOUT = 50 // ms between keystrokes for scanner detection

  start(onScan: (barcode: string) => void): void {
    this.callback = onScan
    if (typeof window !== "undefined") {
      window.addEventListener("keypress", this.handleKeyPress)
    }
  }

  stop(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener("keypress", this.handleKeyPress)
    }
    this.callback = null
  }

  private handleKeyPress = (e: KeyboardEvent): void => {
    // Ignore if focus is on an input element
    const target = e.target as HTMLElement
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
      return
    }

    // Clear timeout
    if (this.timeout) {
      clearTimeout(this.timeout)
    }

    // Handle Enter key - end of barcode
    if (e.key === "Enter") {
      if (this.buffer.length >= 3) {
        this.callback?.(this.buffer)
      }
      this.buffer = ""
      return
    }

    // Add to buffer
    this.buffer += e.key

    // Set timeout to clear buffer if no more input
    this.timeout = setTimeout(() => {
      this.buffer = ""
    }, this.SCAN_TIMEOUT)
  }
}
