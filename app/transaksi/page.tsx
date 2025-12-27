"use client"

import { useState, useEffect } from "react"
import { getAll, remove, type Transaksi } from "@/lib/db"
import { formatRupiah } from "@/lib/currency"
import { exportTransaksi } from "@/lib/excel"
import { printNota } from "@/lib/print"
import { PageHeader } from "@/components/page-header"
import { FirebaseStatus } from "@/components/firebase-status"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Receipt, Calendar, Eye, Printer, TrendingUp, Trash2 } from "lucide-react"

export default function TransaksiPage() {
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>([])
  const [selectedTransaksi, setSelectedTransaksi] = useState<Transaksi | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [idToDelete, setIdToDelete] = useState<string | null>(null)
  const [filterBulan, setFilterBulan] = useState("")

  // Load data
  const loadData = async () => {
    const data = await getAll<Transaksi>("transaksi")
    setTransaksiList(
      data.sort((a, b) => {
        if (a.created_at && b.created_at) {
          return b.created_at.toMillis() - a.created_at.toMillis()
        }
        return (b.id || "").localeCompare(a.id || "")
      }),
    )
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filter by month
  const filteredData =
    filterBulan && filterBulan !== "all"
      ? transaksiList.filter((t) => {
          const date = new Date(t.tanggal.split(",")[0].split("/").reverse().join("-"))
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
          return monthKey === filterBulan
        })
      : transaksiList

  // Get unique months
  const months = [
    ...new Set(
      transaksiList.map((t) => {
        const date = new Date(t.tanggal.split(",")[0].split("/").reverse().join("-"))
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      }),
    ),
  ]
    .sort()
    .reverse()

  // Stats
  const totalTransaksi = filteredData.length
  const totalPenjualan = filteredData.reduce((sum, t) => sum + t.total, 0)
  const totalLaba = filteredData.reduce((sum, t) => sum + t.laba, 0)

  // View detail
  const handleViewDetail = (transaksi: Transaksi) => {
    setSelectedTransaksi(transaksi)
    setShowDetail(true)
  }

  // Print nota
  const handlePrintNota = (transaksi: Transaksi) => {
    printNota({
      id: transaksi.id!,
      tanggal: transaksi.tanggal,
      items: transaksi.items,
      total: transaksi.total,
      uang_dibayar: transaksi.uang_dibayar,
      kembalian: transaksi.kembalian,
    })
  }

  // Delete transaction
  const handleDeleteTransaction = async (id: string) => {
    await remove("transaksi", id)
    setShowDeleteConfirm(false)
    setIdToDelete(null)
    loadData()
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Riwayat Transaksi" description="Lihat semua transaksi penjualan">
        <Button variant="outline" onClick={() => exportTransaksi(filteredData)} disabled={filteredData.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
      </PageHeader>

      <FirebaseStatus />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Receipt className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Transaksi</p>
                <p className="text-2xl font-bold">{totalTransaksi}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Penjualan</p>
                <p className="text-2xl font-bold">{formatRupiah(totalPenjualan)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Laba</p>
                <p className="text-2xl font-bold text-green-600">{formatRupiah(totalLaba)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={filterBulan} onValueChange={setFilterBulan}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Semua Bulan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Bulan</SelectItem>
                {months.map((month) => (
                  <SelectItem key={month} value={month}>
                    {new Date(month + "-01").toLocaleDateString("id-ID", {
                      month: "long",
                      year: "numeric",
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filterBulan && filterBulan !== "all" && (
              <Button variant="ghost" size="sm" onClick={() => setFilterBulan("")}>
                Reset Filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">ID</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-center">Item</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Bayar</TableHead>
                  <TableHead className="text-right">Laba</TableHead>
                  <TableHead className="text-center w-24">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Belum ada transaksi
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((transaksi) => (
                    <TableRow key={transaksi.id}>
                      <TableCell className="font-mono text-xs">#{transaksi.id?.slice(-6).toUpperCase()}</TableCell>
                      <TableCell className="text-sm">{transaksi.tanggal}</TableCell>
                      <TableCell className="text-center">{transaksi.items.length}</TableCell>
                      <TableCell className="text-right font-medium">{formatRupiah(transaksi.total)}</TableCell>
                      <TableCell className="text-right">{formatRupiah(transaksi.uang_dibayar)}</TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        {formatRupiah(transaksi.laba)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleViewDetail(transaksi)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handlePrintNota(transaksi)}>
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => {
                              setIdToDelete(transaksi.id!)
                              setShowDeleteConfirm(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Transaksi #{selectedTransaksi?.id?.slice(-6).toUpperCase()}</DialogTitle>
          </DialogHeader>
          {selectedTransaksi && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">{selectedTransaksi.tanggal}</div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Barang</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTransaksi.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.nama_barang}</p>
                            <p className="text-xs text-muted-foreground">{formatRupiah(item.harga_jual)} / pcs</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{item.qty}</TableCell>
                        <TableCell className="text-right">{formatRupiah(item.subtotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatRupiah(selectedTransaksi.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uang Bayar</span>
                  <span>{formatRupiah(selectedTransaksi.uang_dibayar)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kembalian</span>
                  <span>{formatRupiah(selectedTransaksi.kembalian)}</span>
                </div>
                <div className="flex justify-between text-green-600 font-medium pt-2 border-t">
                  <span>Laba</span>
                  <span>{formatRupiah(selectedTransaksi.laba)}</span>
                </div>
              </div>

              <Button onClick={() => handlePrintNota(selectedTransaksi)} className="w-full">
                <Printer className="h-4 w-4 mr-2" />
                Cetak Nota
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Transaksi?</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan. Menghapus transaksi tidak akan mengembalikan stok barang.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={() => idToDelete && handleDeleteTransaction(idToDelete)}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
