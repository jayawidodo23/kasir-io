"use client"

import { useState } from "react"
import { useHardware } from "@/hooks/use-hardware"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Printer, ScanBarcode, RefreshCw, Plus, Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

export function HardwareIndicator() {
  const [showDialog, setShowDialog] = useState(false)
  const { status, isScanning, error, scan, requestPrinter, requestScanner, supportsWebHID, supportsWebUSB } =
    useHardware()

  const printerConnected = status.printer.connected
  const scannerConnected = status.scanner.connected

  return (
    <>
      {/* Compact Indicator Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowDialog(true)}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors",
            printerConnected
              ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
              : "bg-red-500/10 text-red-600 hover:bg-red-500/20",
          )}
          title={printerConnected ? "Printer terhubung" : "Printer tidak terhubung"}
        >
          <Printer className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{printerConnected ? "ON" : "OFF"}</span>
        </button>

        <button
          onClick={() => setShowDialog(true)}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors",
            scannerConnected
              ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
          title={scannerConnected ? "Scanner terhubung" : "Scanner tidak terhubung"}
        >
          <ScanBarcode className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{scannerConnected ? "ON" : "OFF"}</span>
        </button>
      </div>

      {/* Hardware Status Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">Status Hardware</DialogTitle>
            <DialogDescription>Status koneksi printer dan barcode scanner</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">{error}</div>}

            {/* Printer Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Printer className="h-5 w-5" />
                  <span className="font-medium">Printer</span>
                </div>
                <Badge
                  variant={printerConnected ? "default" : "secondary"}
                  className={cn(printerConnected ? "bg-green-500 hover:bg-green-500" : "")}
                >
                  {printerConnected ? (
                    <>
                      <Wifi className="h-3 w-3 mr-1" /> CONNECT
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 mr-1" /> DISCONNECT
                    </>
                  )}
                </Badge>
              </div>

              {status.printer.devices.length > 0 ? (
                <div className="space-y-2 pl-7">
                  {status.printer.devices.map((device, idx) => (
                    <div key={idx} className="text-sm p-2 bg-muted rounded-md">
                      <p className="font-medium">{device.name}</p>
                      {device.vendorId && (
                        <p className="text-muted-foreground text-xs">
                          VID: {device.vendorId.toString(16).padStart(4, "0")} | PID:{" "}
                          {device.productId?.toString(16).padStart(4, "0") || "N/A"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground pl-7">Tidak ada printer terdeteksi</p>
              )}

              {supportsWebUSB && (
                <Button variant="outline" size="sm" className="ml-7 bg-transparent" onClick={requestPrinter}>
                  <Plus className="h-3 w-3 mr-1" />
                  Tambah Printer USB
                </Button>
              )}
            </div>

            {/* Scanner Section */}
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ScanBarcode className="h-5 w-5" />
                  <span className="font-medium">Barcode Scanner</span>
                </div>
                <Badge
                  variant={scannerConnected ? "default" : "secondary"}
                  className={cn(scannerConnected ? "bg-green-500 hover:bg-green-500" : "")}
                >
                  {scannerConnected ? (
                    <>
                      <Wifi className="h-3 w-3 mr-1" /> CONNECT
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 mr-1" /> DISCONNECT
                    </>
                  )}
                </Badge>
              </div>

              {status.scanner.devices.length > 0 ? (
                <div className="space-y-2 pl-7">
                  {status.scanner.devices.map((device, idx) => (
                    <div key={idx} className="text-sm p-2 bg-muted rounded-md">
                      <p className="font-medium">{device.name}</p>
                      {device.vendorId && (
                        <p className="text-muted-foreground text-xs">
                          VID: {device.vendorId.toString(16).padStart(4, "0")} | PID:{" "}
                          {device.productId?.toString(16).padStart(4, "0") || "N/A"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pl-7 space-y-2">
                  <p className="text-sm text-muted-foreground">Scanner USB HID tidak terdeteksi</p>
                  <p className="text-xs text-muted-foreground">
                    Tip: Kebanyakan scanner barcode bekerja sebagai keyboard. Cukup fokuskan kursor pada kolom input dan
                    scan barcode.
                  </p>
                </div>
              )}

              {supportsWebHID && (
                <Button variant="outline" size="sm" className="ml-7 bg-transparent" onClick={requestScanner}>
                  <Plus className="h-3 w-3 mr-1" />
                  Tambah Scanner HID
                </Button>
              )}
            </div>

            {/* Last Check Info */}
            <div className="pt-3 border-t text-xs text-muted-foreground">
              {status.printer.lastCheck && (
                <p>Terakhir dicek: {status.printer.lastCheck.toLocaleTimeString("id-ID")}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => window.print()} disabled={!printerConnected}>
              <Printer className="h-4 w-4 mr-2" />
              Test Print
            </Button>
            <Button onClick={scan} disabled={isScanning}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isScanning && "animate-spin")} />
              {isScanning ? "Scanning..." : "Rescan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
