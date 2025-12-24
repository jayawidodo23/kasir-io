"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useKasirStore } from "@/lib/store"
import { getAll, getByIndex, add, update, type Barang, type Transaksi } from "@/lib/db"
import { formatRupiah } from "@/lib/currency"
import { printNota } from "@/lib/print"
import { PageHeader } from "@/components/page-header"
import { FirebaseStatus } from "@/components/firebase-status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus, Minus, Printer, ShoppingCart, Search } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner"

export default function KasirPage() {
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const [kodeBarang, setKodeBarang] = useState("")
  const [qty, setQty] = useState(1)
  const [selectedBarang, setSelectedBarang] = useState<Barang | null>(null)
  const [uangBayar, setUangBayar] = useState("")
  const [showPayDialog, setShowPayDialog] = useState(false)
  const [error, setError] = useState("")
  const [allBarang, setAllBarang] = useState<Barang[]>([])
  const [searchResults, setSearchResults] = useState<Barang[]>([])
  const [showSearch, setShowSearch] = useState(false)

  const { cart, addToCart, updateCartQty, removeFromCart, clearCart, getTotal, getTotalLaba } = useKasirStore()

  const handleBarcodeScan = useCallback(
    async (barcode: string) => {
      const barang = await getByIndex<Barang>("barang", "kode_barang", barcode.trim().toUpperCase())
      if (barang) {
        if (document.activeElement === barcodeInputRef.current) {
          setKodeBarang(barcode)
          setSelectedBarang(barang)
          setShowSearch(false)
        } else {
          if (barang.stok > 0) {
            addToCart(barang, 1)
          }
        }
      }
    },
    [addToCart],
  )

  useBarcodeScanner({
    onScan: handleBarcodeScan,
    enabled: !showPayDialog,
  })

  useEffect(() => {
    const loadBarang = async () => {
      const data = await getAll<Barang>("barang")
      setAllBarang(data)
    }
    loadBarang()
  }, [])

  useEffect(() => {
    barcodeInputRef.current?.focus()
  }, [])

  const handleSearch = useCallback(
    (value: string) => {
      setKodeBarang(value)
      if (value.length >= 2) {
        const results = allBarang.filter(
          (b) =>
            b.kode_barang.toLowerCase().includes(value.toLowerCase()) ||
            b.nama_barang.toLowerCase().includes(value.toLowerCase()),
        )
        setSearchResults(results)
        setShowSearch(results.length > 0)
      } else {
        setSearchResults([])
        setShowSearch(false)
      }
      setError("")
    },
    [allBarang],
  )

  const handleBarcodeSubmit = async () => {
    if (!kodeBarang.trim()) return

    const barang = await getByIndex<Barang>("barang", "kode_barang", kodeBarang.trim().toUpperCase())
    if (barang) {
      setSelectedBarang(barang)
      setShowSearch(false)
    } else {
      setError("Barang tidak ditemukan")
      setSelectedBarang(null)
    }
  }

  const handleAddToCart = () => {
    if (!selectedBarang) return

    if (qty > selectedBarang.stok) {
      setError(`Stok tidak cukup. Stok tersedia: ${selectedBarang.stok}`)
      return
    }

    addToCart(selectedBarang, qty)
    setKodeBarang("")
    setSelectedBarang(null)
    setQty(1)
    setError("")
    barcodeInputRef.current?.focus()
  }

  const handlePayment = async () => {
    const total = getTotal()
    const bayar = Number.parseInt(uangBayar.replace(/\D/g, "")) || 0

    if (bayar < total) {
      setError("Uang bayar kurang dari total")
      return
    }

    const kembalian = bayar - total
    const laba = getTotalLaba()

    const transaksi: Omit<Transaksi, "id" | "created_at"> = {
      tanggal: new Date().toLocaleString("id-ID"),
      items: [...cart],
      total,
      uang_dibayar: bayar,
      kembalian,
      laba,
    }

    const transaksiId = await add("transaksi", transaksi)

    for (const item of cart) {
      const barang = await getByIndex<Barang>("barang", "kode_barang", item.kode_barang)
      if (barang) {
        await update("barang", { ...barang, stok: barang.stok - item.qty })
      }
    }

    printNota({
      id: transaksiId,
      tanggal: transaksi.tanggal,
      items: transaksi.items,
      total,
      uang_dibayar: bayar,
      kembalian,
    })

    clearCart()
    setUangBayar("")
    setShowPayDialog(false)
    setError("")

    const updatedBarang = await getAll<Barang>("barang")
    setAllBarang(updatedBarang)

    barcodeInputRef.current?.focus()
  }

  const total = getTotal()
  const kembalian = Number.parseInt(uangBayar.replace(/\D/g, "")) - total

  const selectBarang = (barang: Barang) => {
    setSelectedBarang(barang)
    setShowSearch(false)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Kasir"
        description="Scan barcode atau cari barang untuk menambahkan ke keranjang"
        showHardwareStatus={true}
      />

      <FirebaseStatus />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5" />
                Cari Barang
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Input
                  ref={barcodeInputRef}
                  placeholder="Scan barcode / ketik kode / nama..."
                  value={kodeBarang}
                  onChange={(e) => handleSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleBarcodeSubmit()
                    }
                  }}
                  className="text-lg h-12"
                  autoComplete="off"
                />

                {showSearch && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((barang) => (
                      <button
                        key={barang.id}
                        onClick={() => selectBarang(barang)}
                        className="w-full px-4 py-3 text-left hover:bg-accent transition-colors border-b border-border last:border-0"
                      >
                        <div className="font-medium">{barang.nama_barang}</div>
                        <div className="text-sm text-muted-foreground flex justify-between">
                          <span>{barang.kode_barang}</span>
                          <span>{formatRupiah(barang.harga_jual)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              {selectedBarang && (
                <div className="p-4 bg-accent rounded-lg space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Nama Barang</p>
                    <p className="font-semibold text-lg">{selectedBarang.nama_barang}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Harga</p>
                      <p className="font-semibold">{formatRupiah(selectedBarang.harga_jual)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Stok</p>
                      <p className="font-semibold">{selectedBarang.stok}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Jumlah</p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => setQty(Math.max(1, qty - 1))}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={qty}
                        onChange={(e) => setQty(Math.max(1, Number.parseInt(e.target.value) || 1))}
                        className="w-20 text-center"
                        min={1}
                      />
                      <Button variant="outline" size="icon" onClick={() => setQty(qty + 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button onClick={handleAddToCart} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah ke Keranjang
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Keranjang ({cart.length} item)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {cart.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  Keranjang kosong. Scan barcode untuk menambahkan barang.
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Barang</TableHead>
                          <TableHead className="text-center w-32">Qty</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cart.map((item) => (
                          <TableRow key={item.kode_barang}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.nama_barang}</p>
                                <p className="text-sm text-muted-foreground">{formatRupiah(item.harga_jual)}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => updateCartQty(item.kode_barang, Math.max(1, item.qty - 1))}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center">{item.qty}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => updateCartQty(item.kode_barang, item.qty + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">{formatRupiah(item.subtotal)}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => removeFromCart(item.kode_barang)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border space-y-4">
                    <div className="flex justify-between items-center text-xl font-bold">
                      <span>TOTAL</span>
                      <span>{formatRupiah(total)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (confirm("Hapus semua item di keranjang?")) {
                            clearCart()
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Kosongkan
                      </Button>
                      <Button onClick={() => setShowPayDialog(true)} disabled={cart.length === 0}>
                        <Printer className="h-4 w-4 mr-2" />
                        Bayar & Cetak
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pembayaran</DialogTitle>
            <DialogDescription>Masukkan jumlah uang yang dibayarkan</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center text-lg">
              <span>Total:</span>
              <span className="font-bold">{formatRupiah(total)}</span>
            </div>
            <div className="space-y-2">
              <Label>Uang Bayar</Label>
              <Input
                type="text"
                placeholder="Masukkan nominal..."
                value={uangBayar}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "")
                  setUangBayar(value ? Number.parseInt(value).toLocaleString("id-ID") : "")
                }}
                className="text-lg h-12"
                autoFocus
              />
            </div>
            {uangBayar && (
              <div className="flex justify-between items-center text-lg">
                <span>Kembalian:</span>
                <span className={kembalian >= 0 ? "font-bold text-green-600" : "font-bold text-destructive"}>
                  {formatRupiah(Math.max(0, kembalian))}
                </span>
              </div>
            )}
            <div className="grid grid-cols-4 gap-2">
              {[10000, 20000, 50000, 100000].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const current = Number.parseInt(uangBayar.replace(/\D/g, "")) || 0
                    setUangBayar((current + amount).toLocaleString("id-ID"))
                  }}
                >
                  +{amount / 1000}rb
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => setUangBayar(total.toLocaleString("id-ID"))}
            >
              Uang Pas
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayDialog(false)}>
              Batal
            </Button>
            <Button onClick={handlePayment} disabled={kembalian < 0}>
              <Printer className="h-4 w-4 mr-2" />
              Proses & Cetak Nota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
