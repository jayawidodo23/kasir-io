"use client"

import { useState, useEffect } from "react"
import { getAll, add, update, getByIndex, type Barang, type BarangKeluar } from "@/lib/db"
import { formatRupiah } from "@/lib/currency"
import { exportBarangKeluar } from "@/lib/excel"
import { PageHeader } from "@/components/page-header"
import { FirebaseStatus } from "@/components/firebase-status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Download, ArrowUpFromLine, Calendar } from "lucide-react"

export default function BarangKeluarPage() {
  const [dataList, setDataList] = useState<BarangKeluar[]>([])
  const [barangList, setBarangList] = useState<Barang[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [selectedBarang, setSelectedBarang] = useState<Barang | null>(null)
  const [jumlah, setJumlah] = useState("")
  const [keterangan, setKeterangan] = useState("")
  const [error, setError] = useState("")
  const [filterBulan, setFilterBulan] = useState("")

  const loadData = async () => {
    const keluar = await getAll<BarangKeluar>("barang_keluar")
    const barang = await getAll<Barang>("barang")
    setDataList(keluar.sort((a, b) => (b.id || "").localeCompare(a.id || "")))
    setBarangList(barang)
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredData =
    filterBulan && filterBulan !== "all" ? dataList.filter((d) => d.tanggal.includes(filterBulan)) : dataList

  const months = [
    ...new Set(
      dataList.map((d) => {
        const date = new Date(d.tanggal.split(",")[0].split("/").reverse().join("-"))
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      }),
    ),
  ]
    .sort()
    .reverse()

  const handleSelectBarang = (kode: string) => {
    const barang = barangList.find((b) => b.kode_barang === kode)
    setSelectedBarang(barang || null)
  }

  const handleSave = async () => {
    if (!selectedBarang) {
      setError("Pilih barang terlebih dahulu")
      return
    }

    const qty = Number.parseInt(jumlah) || 0

    if (qty <= 0) {
      setError("Jumlah harus lebih dari 0")
      return
    }

    if (qty > selectedBarang.stok) {
      setError(`Stok tidak mencukupi. Stok tersedia: ${selectedBarang.stok}`)
      return
    }

    const data: BarangKeluar = {
      tanggal: new Date().toLocaleString("id-ID"),
      kode_barang: selectedBarang.kode_barang,
      nama_barang: selectedBarang.nama_barang,
      jumlah: qty,
      harga_jual: selectedBarang.harga_jual,
      total_harga: qty * selectedBarang.harga_jual,
      keterangan: keterangan.trim() || "Rusak/Hilang",
    }

    await add("barang_keluar", data)

    const currentBarang = await getByIndex<Barang>("barang", "kode_barang", selectedBarang.kode_barang)
    if (currentBarang) {
      await update("barang", {
        ...currentBarang,
        stok: currentBarang.stok - qty,
      })
    }

    setShowDialog(false)
    setSelectedBarang(null)
    setJumlah("")
    setKeterangan("")
    setError("")
    loadData()
  }

  const totalKeluar = filteredData.reduce((sum, d) => sum + d.jumlah, 0)
  const totalNilai = filteredData.reduce((sum, d) => sum + d.total_harga, 0)

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Barang Keluar" description="Catat barang yang keluar selain penjualan (rusak, hilang, dll)">
        <Button variant="outline" onClick={() => exportBarangKeluar(filteredData)} disabled={filteredData.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Barang Keluar
        </Button>
      </PageHeader>

      <FirebaseStatus />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <ArrowUpFromLine className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Barang Keluar</p>
                <p className="text-2xl font-bold">{totalKeluar.toLocaleString("id-ID")} unit</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <ArrowUpFromLine className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Nilai Kerugian</p>
                <p className="text-2xl font-bold text-red-600">{formatRupiah(totalNilai)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="text-right">Nilai</TableHead>
                  <TableHead>Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Belum ada data barang keluar
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm">{item.tanggal}</TableCell>
                      <TableCell className="font-mono">{item.kode_barang}</TableCell>
                      <TableCell className="font-medium">{item.nama_barang}</TableCell>
                      <TableCell className="text-right">{item.jumlah}</TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        {formatRupiah(item.total_harga)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.keterangan}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Barang Keluar</DialogTitle>
            <DialogDescription>Catat barang keluar (rusak, hilang, expired, dll)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
              <Label>Pilih Barang</Label>
              <Select onValueChange={handleSelectBarang}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih barang..." />
                </SelectTrigger>
                <SelectContent>
                  {barangList
                    .filter((b) => b.stok > 0)
                    .map((barang) => (
                      <SelectItem key={barang.id} value={barang.kode_barang}>
                        {barang.kode_barang} - {barang.nama_barang} (Stok: {barang.stok})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {selectedBarang && (
              <div className="p-3 bg-accent rounded-lg text-sm">
                <p>
                  Stok saat ini: <strong>{selectedBarang.stok}</strong>
                </p>
                <p>
                  Harga jual: <strong>{formatRupiah(selectedBarang.harga_jual)}</strong>
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Jumlah</Label>
              <Input
                type="number"
                placeholder="0"
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value)}
                min={1}
                max={selectedBarang?.stok || 0}
              />
            </div>
            <div className="space-y-2">
              <Label>Keterangan</Label>
              <Textarea
                placeholder="Contoh: Rusak, Expired, Hilang..."
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                rows={2}
              />
            </div>
            {jumlah && selectedBarang && (
              <div className="p-3 bg-red-500/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Nilai Kerugian</p>
                <p className="text-xl font-bold text-red-600">
                  {formatRupiah((Number.parseInt(jumlah) || 0) * selectedBarang.harga_jual)}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSave}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
