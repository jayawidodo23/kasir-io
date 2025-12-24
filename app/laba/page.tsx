"use client"

import { useState, useEffect, useMemo } from "react"
import { getAll, getAllLabaArsip, type Transaksi, type BarangMasuk, type BarangKeluar, type LabaArsip } from "@/lib/db"
import { formatRupiah } from "@/lib/currency"
import { PageHeader } from "@/components/page-header"
import { FirebaseStatus } from "@/components/firebase-status"
import { CleanupManager } from "@/components/cleanup-manager"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Calendar,
  ArrowUp,
  ArrowDown,
  Archive,
} from "lucide-react"
import * as XLSX from "xlsx"

interface LabaPerHari {
  tanggal: string
  totalPenjualan: number
  totalModal: number
  totalBarangMasuk: number
  totalBarangKeluar: number
  labaBersih: number
  jumlahTransaksi: number
}

export default function LabaPage() {
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>([])
  const [barangMasukList, setBarangMasukList] = useState<BarangMasuk[]>([])
  const [barangKeluarList, setBarangKeluarList] = useState<BarangKeluar[]>([])
  const [arsipList, setArsipList] = useState<LabaArsip[]>([])
  const [filterBulan, setFilterBulan] = useState("")
  const [activeTab, setActiveTab] = useState("aktif")

  useEffect(() => {
    const loadData = async () => {
      const [transaksi, masuk, keluar, arsip] = await Promise.all([
        getAll<Transaksi>("transaksi"),
        getAll<BarangMasuk>("barang_masuk"),
        getAll<BarangKeluar>("barang_keluar"),
        getAllLabaArsip(),
      ])
      setTransaksiList(transaksi)
      setBarangMasukList(masuk)
      setBarangKeluarList(keluar)
      setArsipList(arsip)
    }
    loadData()
  }, [])

  const months = useMemo(() => {
    const allDates = [...transaksiList.map((t) => t.tanggal), ...barangMasukList.map((b) => b.tanggal)]
    return [
      ...new Set(
        allDates.map((d) => {
          const date = new Date(d.split(",")[0].split("/").reverse().join("-"))
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        }),
      ),
    ]
      .sort()
      .reverse()
  }, [transaksiList, barangMasukList])

  const labaPerHari = useMemo(() => {
    const dataMap = new Map<string, LabaPerHari>()

    const filterByMonth = (tanggal: string) => {
      if (!filterBulan || filterBulan === "all") return true
      const date = new Date(tanggal.split(",")[0].split("/").reverse().join("-"))
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      return monthKey === filterBulan
    }

    transaksiList
      .filter((t) => filterByMonth(t.tanggal))
      .forEach((t) => {
        const dateKey = t.tanggal.split(",")[0]
        const existing = dataMap.get(dateKey) || {
          tanggal: dateKey,
          totalPenjualan: 0,
          totalModal: 0,
          totalBarangMasuk: 0,
          totalBarangKeluar: 0,
          labaBersih: 0,
          jumlahTransaksi: 0,
        }

        const modal = t.items.reduce((sum, item) => sum + item.harga_beli * item.qty, 0)

        existing.totalPenjualan += t.total
        existing.totalModal += modal
        existing.labaBersih += t.laba
        existing.jumlahTransaksi += 1

        dataMap.set(dateKey, existing)
      })

    barangMasukList
      .filter((b) => filterByMonth(b.tanggal))
      .forEach((b) => {
        const dateKey = b.tanggal.split(",")[0]
        const existing = dataMap.get(dateKey) || {
          tanggal: dateKey,
          totalPenjualan: 0,
          totalModal: 0,
          totalBarangMasuk: 0,
          totalBarangKeluar: 0,
          labaBersih: 0,
          jumlahTransaksi: 0,
        }

        existing.totalBarangMasuk += b.total_harga

        dataMap.set(dateKey, existing)
      })

    barangKeluarList
      .filter((b) => filterByMonth(b.tanggal))
      .forEach((b) => {
        const dateKey = b.tanggal.split(",")[0]
        const existing = dataMap.get(dateKey) || {
          tanggal: dateKey,
          totalPenjualan: 0,
          totalModal: 0,
          totalBarangMasuk: 0,
          totalBarangKeluar: 0,
          labaBersih: 0,
          jumlahTransaksi: 0,
        }

        existing.totalBarangKeluar += b.total_harga
        existing.labaBersih -= b.total_harga

        dataMap.set(dateKey, existing)
      })

    return Array.from(dataMap.values()).sort((a, b) => {
      const dateA = new Date(a.tanggal.split("/").reverse().join("-"))
      const dateB = new Date(b.tanggal.split("/").reverse().join("-"))
      return dateB.getTime() - dateA.getTime()
    })
  }, [transaksiList, barangMasukList, barangKeluarList, filterBulan])

  const summary = useMemo(() => {
    const totalPenjualan = labaPerHari.reduce((sum, d) => sum + d.totalPenjualan, 0)
    const totalModal = labaPerHari.reduce((sum, d) => sum + d.totalModal, 0)
    const totalBarangMasuk = labaPerHari.reduce((sum, d) => sum + d.totalBarangMasuk, 0)
    const totalBarangKeluar = labaPerHari.reduce((sum, d) => sum + d.totalBarangKeluar, 0)
    const labaBersih = labaPerHari.reduce((sum, d) => sum + d.labaBersih, 0)
    const jumlahTransaksi = labaPerHari.reduce((sum, d) => sum + d.jumlahTransaksi, 0)
    const marginLaba = totalPenjualan > 0 ? (labaBersih / totalPenjualan) * 100 : 0

    return {
      totalPenjualan,
      totalModal,
      totalBarangMasuk,
      totalBarangKeluar,
      labaBersih,
      jumlahTransaksi,
      marginLaba,
    }
  }, [labaPerHari])

  const arsipSummary = useMemo(() => {
    const totalPenjualan = arsipList.reduce((sum, d) => sum + d.total_penjualan, 0)
    const totalModal = arsipList.reduce((sum, d) => sum + d.total_modal, 0)
    const totalLaba = arsipList.reduce((sum, d) => sum + d.total_laba, 0)
    const jumlahTransaksi = arsipList.reduce((sum, d) => sum + d.jumlah_transaksi, 0)

    return { totalPenjualan, totalModal, totalLaba, jumlahTransaksi }
  }, [arsipList])

  const handleExport = () => {
    const exportData = labaPerHari.map((d) => ({
      Tanggal: d.tanggal,
      "Jumlah Transaksi": d.jumlahTransaksi,
      "Total Penjualan": d.totalPenjualan,
      "Total Modal": d.totalModal,
      "Barang Masuk": d.totalBarangMasuk,
      "Barang Keluar (Kerugian)": d.totalBarangKeluar,
      "Laba Bersih": d.labaBersih,
    }))

    exportData.push({
      Tanggal: "TOTAL",
      "Jumlah Transaksi": summary.jumlahTransaksi,
      "Total Penjualan": summary.totalPenjualan,
      "Total Modal": summary.totalModal,
      "Barang Masuk": summary.totalBarangMasuk,
      "Barang Keluar (Kerugian)": summary.totalBarangKeluar,
      "Laba Bersih": summary.labaBersih,
    })

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Laba")
    XLSX.writeFile(workbook, `laporan_laba_${filterBulan || "semua"}.xlsx`)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Laporan Laba Rugi" description="Analisis keuntungan dan kerugian usaha">
        <Button variant="outline" onClick={handleExport} disabled={labaPerHari.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
      </PageHeader>

      <FirebaseStatus />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Penjualan</p>
                <p className="text-xl font-bold">{formatRupiah(summary.totalPenjualan)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <TrendingDown className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Modal Penjualan</p>
                <p className="text-xl font-bold">{formatRupiah(summary.totalModal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${summary.labaBersih >= 0 ? "bg-green-500/10" : "bg-red-500/10"}`}>
                <TrendingUp className={`h-6 w-6 ${summary.labaBersih >= 0 ? "text-green-600" : "text-red-600"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Laba Bersih</p>
                <p className={`text-xl font-bold ${summary.labaBersih >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatRupiah(summary.labaBersih)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${summary.marginLaba >= 0 ? "bg-green-500/10" : "bg-red-500/10"}`}>
                <Percent className={`h-6 w-6 ${summary.marginLaba >= 0 ? "text-green-600" : "text-red-600"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Margin Laba</p>
                <p className={`text-xl font-bold ${summary.marginLaba >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {summary.marginLaba.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <ArrowDown className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Barang Masuk</p>
                <p className="text-lg font-bold">{formatRupiah(summary.totalBarangMasuk)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <ArrowUp className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Kerugian (Barang Keluar)</p>
                <p className="text-lg font-bold text-red-600">{formatRupiah(summary.totalBarangKeluar)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Transaksi</p>
                <p className="text-lg font-bold">{summary.jumlahTransaksi} transaksi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="aktif">Data Aktif</TabsTrigger>
          <TabsTrigger value="arsip" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Arsip Bulanan ({arsipList.length})
          </TabsTrigger>
          <TabsTrigger value="kelola">Kelola Database</TabsTrigger>
        </TabsList>

        <TabsContent value="aktif" className="space-y-6">
          {/* Filter */}
          <Card>
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
            <CardHeader>
              <CardTitle className="text-lg">Rincian Laba Per Hari</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead className="text-center">Transaksi</TableHead>
                      <TableHead className="text-right">Penjualan</TableHead>
                      <TableHead className="text-right">Modal</TableHead>
                      <TableHead className="text-right">Kerugian</TableHead>
                      <TableHead className="text-right">Laba Bersih</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {labaPerHari.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Belum ada data
                        </TableCell>
                      </TableRow>
                    ) : (
                      labaPerHari.map((data, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{data.tanggal}</TableCell>
                          <TableCell className="text-center">{data.jumlahTransaksi}</TableCell>
                          <TableCell className="text-right">{formatRupiah(data.totalPenjualan)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatRupiah(data.totalModal)}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {data.totalBarangKeluar > 0 ? formatRupiah(data.totalBarangKeluar) : "-"}
                          </TableCell>
                          <TableCell
                            className={`text-right font-bold ${data.labaBersih >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {formatRupiah(data.labaBersih)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="arsip" className="space-y-6">
          {arsipList.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Belum ada data arsip. Data akan diarsipkan secara otomatis setelah 8 bulan.
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Arsip Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total Penjualan (Arsip)</p>
                    <p className="text-xl font-bold">{formatRupiah(arsipSummary.totalPenjualan)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total Modal (Arsip)</p>
                    <p className="text-xl font-bold">{formatRupiah(arsipSummary.totalModal)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total Laba (Arsip)</p>
                    <p className="text-xl font-bold text-green-600">{formatRupiah(arsipSummary.totalLaba)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total Transaksi (Arsip)</p>
                    <p className="text-xl font-bold">{arsipSummary.jumlahTransaksi}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Archive className="h-5 w-5" />
                    Ringkasan Laba Bulanan (Diarsipkan)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bulan</TableHead>
                          <TableHead className="text-center">Transaksi</TableHead>
                          <TableHead className="text-right">Penjualan</TableHead>
                          <TableHead className="text-right">Modal</TableHead>
                          <TableHead className="text-right">Laba</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {arsipList.map((arsip) => (
                          <TableRow key={arsip.id}>
                            <TableCell className="font-medium">
                              {new Date(`${arsip.bulan}-01`).toLocaleDateString("id-ID", {
                                month: "long",
                                year: "numeric",
                              })}
                            </TableCell>
                            <TableCell className="text-center">{arsip.jumlah_transaksi}</TableCell>
                            <TableCell className="text-right">{formatRupiah(arsip.total_penjualan)}</TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {formatRupiah(arsip.total_modal)}
                            </TableCell>
                            <TableCell
                              className={`text-right font-bold ${arsip.total_laba >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {formatRupiah(arsip.total_laba)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="kelola">
          <CleanupManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
