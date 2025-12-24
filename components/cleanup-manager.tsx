"use client"

import { useState, useEffect } from "react"
import { getCleanupStatus, archiveOldTransactions } from "@/lib/db"
import { isFirebaseConfigured } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Archive, Trash2, CheckCircle2, AlertTriangle } from "lucide-react"

interface CleanupStatus {
  oldTransaksiCount: number
  oldBarangMasukCount: number
  oldBarangKeluarCount: number
  totalOldRecords: number
  arsipCount: number
}

export function CleanupManager() {
  const [status, setStatus] = useState<CleanupStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [cleaning, setCleaning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    if (!isFirebaseConfigured()) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const data = await getCleanupStatus()
      setStatus(data)
    } catch (error) {
      console.error("Failed to get cleanup status:", error)
    }
    setLoading(false)
  }

  const handleCleanup = async () => {
    setCleaning(true)
    setResult(null)

    try {
      const result = await archiveOldTransactions()
      setResult({
        success: true,
        message: `Berhasil mengarsipkan ${result.archived} bulan data dan menghapus ${result.deleted} record lama.`,
      })
      loadStatus()
    } catch (error) {
      setResult({
        success: false,
        message: "Gagal melakukan pembersihan data. Silakan coba lagi.",
      })
    }

    setCleaning(false)
  }

  if (!isFirebaseConfigured()) {
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Memeriksa status database...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Archive className="h-5 w-5" />
          Manajemen Database
        </CardTitle>
        <CardDescription>
          Data transaksi lebih dari 8 bulan akan diarsipkan menjadi ringkasan bulanan untuk menghemat ruang database.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-accent rounded-lg">
              <p className="text-sm text-muted-foreground">Transaksi Lama</p>
              <p className="text-xl font-bold">{status.oldTransaksiCount}</p>
            </div>
            <div className="p-3 bg-accent rounded-lg">
              <p className="text-sm text-muted-foreground">Barang Masuk Lama</p>
              <p className="text-xl font-bold">{status.oldBarangMasukCount}</p>
            </div>
            <div className="p-3 bg-accent rounded-lg">
              <p className="text-sm text-muted-foreground">Barang Keluar Lama</p>
              <p className="text-xl font-bold">{status.oldBarangKeluarCount}</p>
            </div>
            <div className="p-3 bg-accent rounded-lg">
              <p className="text-sm text-muted-foreground">Arsip Bulanan</p>
              <p className="text-xl font-bold">{status.arsipCount}</p>
            </div>
          </div>
        )}

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}

        {status && status.totalOldRecords > 0 && (
          <Button onClick={handleCleanup} disabled={cleaning} variant="outline" className="w-full bg-transparent">
            {cleaning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Arsipkan & Hapus Data Lama ({status.totalOldRecords} record)
              </>
            )}
          </Button>
        )}

        {status && status.totalOldRecords === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">Tidak ada data lama yang perlu diarsipkan.</p>
        )}
      </CardContent>
    </Card>
  )
}
