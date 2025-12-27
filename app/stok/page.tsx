"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { getAll, add, update, remove, clearStore, addMany, type Barang } from "@/lib/db"
import { formatRupiah } from "@/lib/currency"
import { exportBarang, importFromExcel } from "@/lib/excel"
import { PageHeader } from "@/components/page-header"
import { FirebaseStatus } from "@/components/firebase-status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash2, Download, Upload, Search, Package } from "lucide-react"
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner"

interface BarangForm {
  kode_barang: string
  nama_barang: string
  harga_beli: string
  harga_jual: string
  stok: string
}

const emptyForm: BarangForm = {
  kode_barang: "",
  nama_barang: "",
  harga_beli: "",
  harga_jual: "",
  stok: "",
}

export default function StokPage() {
  const [barangList, setBarangList] = useState<Barang[]>([])
  const [filteredList, setFilteredList] = useState<Barang[]>([])
  const [search, setSearch] = useState("")
  const [showDialog, setShowDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<BarangForm>(emptyForm)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const kodeBarangInputRef = useRef<HTMLInputElement>(null)

  const handleBarcodeScan = useCallback(
    (barcode: string) => {
      if (showDialog && !editingId) {
        setForm((prev) => ({ ...prev, kode_barang: barcode.toUpperCase() }))
      } else {
        setSearch(barcode)
      }
    },
    [showDialog, editingId],
  )

  useBarcodeScanner({
    onScan: handleBarcodeScan,
    enabled: true,
  })

  const loadData = async () => {
    const data = await getAll<Barang>("barang")
    setBarangList(data)
    setFilteredList(data)
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!search.trim()) {
      setFilteredList(barangList)
    } else {
      const query = search.toLowerCase()
      setFilteredList(
        barangList.filter(
          (b) => b.kode_barang.toLowerCase().includes(query) || b.nama_barang.toLowerCase().includes(query),
        ),
      )
    }
  }, [search, barangList])

  const handleAdd = () => {
    setForm(emptyForm)
    setEditingId(null)
    setError("")
    setShowDialog(true)
  }

  const handleEdit = (barang: Barang) => {
    setForm({
      kode_barang: barang.kode_barang,
      nama_barang: barang.nama_barang,
      harga_beli: barang.harga_beli.toString(),
      harga_jual: barang.harga_jual.toString(),
      stok: barang.stok.toString(),
    })
    setEditingId(barang.id!)
    setError("")
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!form.kode_barang.trim() || !form.nama_barang.trim()) {
      setError("Kode dan nama barang harus diisi")
      return
    }

    const hargaBeli = Number.parseInt(form.harga_beli) || 0
    const hargaJual = Number.parseInt(form.harga_jual) || 0
    const stok = Number.parseInt(form.stok) || 0

    if (hargaJual < hargaBeli) {
      setError("Harga jual tidak boleh lebih kecil dari harga beli")
      return
    }

    const barangData: Barang = {
      kode_barang: form.kode_barang.trim().toUpperCase(),
      nama_barang: form.nama_barang.trim(),
      harga_beli: hargaBeli,
      harga_jual: hargaJual,
      stok: stok,
      created_at: new Date().toISOString(),
    }

    try {
      if (editingId) {
        await update("barang", { ...barangData, id: editingId })
      } else {
        const newId = await add("barang", barangData)
        if (stok > 0) {
          await add("barang_masuk", {
            tanggal: new Date().toLocaleString("id-ID"),
            kode_barang: barangData.kode_barang,
            nama_barang: barangData.nama_barang,
            jumlah: stok,
            harga_beli: hargaBeli,
            total_harga: stok * hargaBeli,
          })
        }
      }
      setShowDialog(false)
      loadData()
    } catch {
      setError("Kode barang sudah digunakan")
    }
  }

  const handleDelete = async () => {
    if (deleteId) {
      await remove("barang", deleteId)
      setShowDeleteDialog(false)
      setDeleteId(null)
      loadData()
    }
  }

  const handleExport = () => {
    exportBarang(barangList)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      interface ImportedBarang {
        "Kode Barang"?: string
        kode_barang?: string
        "Nama Barang"?: string
        nama_barang?: string
        "Harga Beli"?: number
        harga_beli?: number
        "Harga Jual"?: number
        harga_jual?: number
        Stok?: number
        stok?: number
      }

      const data = await importFromExcel<ImportedBarang>(file)

      const barangData: Barang[] = data
        .map((row) => ({
          kode_barang: (row["Kode Barang"] || row.kode_barang || "").toString().toUpperCase(),
          nama_barang: row["Nama Barang"] || row.nama_barang || "",
          harga_beli: Number.parseInt(String(row["Harga Beli"] || row.harga_beli)) || 0,
          harga_jual: Number.parseInt(String(row["Harga Jual"] || row.harga_jual)) || 0,
          stok: Number.parseInt(String(row.Stok || row.stok)) || 0,
          created_at: new Date().toISOString(),
        }))
        .filter((b) => b.kode_barang && b.nama_barang)

      if (barangData.length === 0) {
        alert("File tidak berisi data yang valid")
        return
      }

      const confirmReplace = confirm(
        `Ditemukan ${barangData.length} barang. Apakah Anda ingin mengganti semua data yang ada?`,
      )

      if (confirmReplace) {
        await clearStore("barang")
        await addMany("barang", barangData)
        loadData()
        alert(`${barangData.length} barang berhasil diimport`)
      }
    } catch {
      alert("Gagal import file Excel")
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const totalBarang = barangList.length
  const totalStok = barangList.reduce((sum, b) => sum + b.stok, 0)
  const totalNilai = barangList.reduce((sum, b) => sum + b.harga_beli * b.stok, 0)

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Stok Barang" description="Kelola data barang dan stok" showHardwareStatus={true}>
        <Button variant="outline" onClick={handleExport} disabled={barangList.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4 mr-2" />
          Import Excel
        </Button>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Barang
        </Button>
      </PageHeader>

      <FirebaseStatus />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Jenis Barang</p>
                <p className="text-2xl font-bold">{totalBarang}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Stok</p>
                <p className="text-2xl font-bold">{totalStok.toLocaleString("id-ID")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nilai Inventori</p>
                <p className="text-2xl font-bold">{formatRupiah(totalNilai)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari kode atau nama barang..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
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
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead className="text-right">Harga Beli</TableHead>
                  <TableHead className="text-right">Harga Jual</TableHead>
                  <TableHead className="text-right">Stok</TableHead>
                  <TableHead className="text-center w-24">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {search ? "Tidak ada barang yang cocok" : "Belum ada data barang"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredList.map((barang) => (
                    <TableRow key={barang.id}>
                      <TableCell className="font-mono">{barang.kode_barang}</TableCell>
                      <TableCell className="font-medium">{barang.nama_barang}</TableCell>
                      <TableCell className="text-right">{formatRupiah(barang.harga_beli)}</TableCell>
                      <TableCell className="text-right">{formatRupiah(barang.harga_jual)}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            barang.stok <= 5
                              ? "text-destructive font-bold"
                              : barang.stok <= 10
                                ? "text-yellow-600 font-medium"
                                : ""
                          }
                        >
                          {barang.stok}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(barang)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => {
                              setDeleteId(barang.id!)
                              setShowDeleteDialog(true)
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

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Barang" : "Tambah Barang Baru"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Ubah informasi barang"
                : "Masukkan informasi barang baru. Scan barcode untuk mengisi kode barang otomatis."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
              <Label>Kode Barang</Label>
              <Input
                ref={kodeBarangInputRef}
                placeholder="Scan barcode atau ketik manual..."
                value={form.kode_barang}
                onChange={(e) => setForm({ ...form, kode_barang: e.target.value })}
                disabled={!!editingId}
                autoFocus={!editingId}
              />
              {!editingId && <p className="text-xs text-muted-foreground">Tip: Scan barcode untuk mengisi otomatis</p>}
            </div>
            <div className="space-y-2">
              <Label>Nama Barang</Label>
              <Input
                placeholder="Contoh: Indomie Goreng"
                value={form.nama_barang}
                onChange={(e) => setForm({ ...form, nama_barang: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Harga Beli</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.harga_beli}
                  onChange={(e) => setForm({ ...form, harga_beli: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Harga Jual</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.harga_jual}
                  onChange={(e) => setForm({ ...form, harga_jual: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Stok Awal</Label>
              <Input
                type="number"
                placeholder="0"
                value={form.stok}
                onChange={(e) => setForm({ ...form, stok: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSave}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Barang?</AlertDialogTitle>
            <AlertDialogDescription>
              Barang akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
