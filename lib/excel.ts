// Excel Import/Export menggunakan SheetJS
import * as XLSX from "xlsx"
import type { Barang, BarangMasuk, BarangKeluar, Transaksi } from "./db"

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  sheetName = "Data",
): void {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

export function importFromExcel<T>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<T>(worksheet)
        resolve(jsonData)
      } catch {
        reject(new Error("Gagal membaca file Excel"))
      }
    }
    reader.onerror = () => reject(new Error("Gagal membaca file"))
    reader.readAsArrayBuffer(file)
  })
}

// Export specific data types
export function exportBarang(data: Barang[]): void {
  const exportData = data.map((item) => ({
    "Kode Barang": item.kode_barang,
    "Nama Barang": item.nama_barang,
    "Harga Beli": item.harga_beli,
    "Harga Jual": item.harga_jual,
    Stok: item.stok,
  }))
  exportToExcel(exportData, "data_barang", "Barang")
}

export function exportBarangMasuk(data: BarangMasuk[]): void {
  const exportData = data.map((item) => ({
    Tanggal: item.tanggal,
    "Kode Barang": item.kode_barang,
    "Nama Barang": item.nama_barang,
    Jumlah: item.jumlah,
    "Harga Beli": item.harga_beli,
    "Total Harga": item.total_harga,
  }))
  exportToExcel(exportData, "barang_masuk", "Barang Masuk")
}

export function exportBarangKeluar(data: BarangKeluar[]): void {
  const exportData = data.map((item) => ({
    Tanggal: item.tanggal,
    "Kode Barang": item.kode_barang,
    "Nama Barang": item.nama_barang,
    Jumlah: item.jumlah,
    "Harga Jual": item.harga_jual,
    "Total Harga": item.total_harga,
    Keterangan: item.keterangan,
  }))
  exportToExcel(exportData, "barang_keluar", "Barang Keluar")
}

export function exportTransaksi(data: Transaksi[]): void {
  const exportData = data.map((item) => ({
    ID: item.id,
    Tanggal: item.tanggal,
    "Jumlah Item": item.items.length,
    Total: item.total,
    "Uang Dibayar": item.uang_dibayar,
    Kembalian: item.kembalian,
    Laba: item.laba,
    "Detail Items": JSON.stringify(item.items),
  }))
  exportToExcel(exportData, "transaksi", "Transaksi")
}
