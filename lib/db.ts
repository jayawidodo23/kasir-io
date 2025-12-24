// Firestore Database untuk Aplikasi Kasir
// Menggantikan IndexedDB dengan Firebase Firestore

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
  Timestamp,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore"
import { getFirestoreDb, isFirebaseConfigured } from "./firebase"

// ============ INTERFACES ============

export interface Barang {
  id?: string
  kode_barang: string
  nama_barang: string
  harga_beli: number
  harga_jual: number
  stok: number
  created_at: string
}

export interface BarangMasuk {
  id?: string
  tanggal: string
  kode_barang: string
  nama_barang: string
  jumlah: number
  harga_beli: number
  total_harga: number
}

export interface BarangKeluar {
  id?: string
  tanggal: string
  kode_barang: string
  nama_barang: string
  jumlah: number
  harga_jual: number
  total_harga: number
  keterangan: string
}

export interface TransaksiItem {
  kode_barang: string
  nama_barang: string
  harga_jual: number
  harga_beli: number
  qty: number
  subtotal: number
}

export interface Transaksi {
  id?: string
  tanggal: string
  items: TransaksiItem[]
  total: number
  uang_dibayar: number
  kembalian: number
  laba: number
  // Timestamp for cleanup queries
  created_at?: Timestamp
}

// Ringkasan laba bulanan (untuk arsip setelah cleanup)
export interface LabaArsip {
  id?: string
  bulan: string // Format: "YYYY-MM"
  tahun: number
  bulan_num: number
  total_penjualan: number
  total_modal: number
  total_laba: number
  total_barang_masuk: number
  total_barang_keluar: number
  jumlah_transaksi: number
  created_at: Timestamp
}

// Collection names
const COLLECTIONS = {
  BARANG: "barang",
  BARANG_MASUK: "barang_masuk",
  BARANG_KELUAR: "barang_keluar",
  TRANSAKSI: "transaksi",
  LABA_ARSIP: "laba_arsip",
} as const

// ============ HELPER FUNCTIONS ============

function mapDocToData<T>(doc: DocumentData): T {
  return {
    id: doc.id,
    ...doc.data(),
  } as T
}

// ============ GENERIC CRUD OPERATIONS ============

export async function getAll<T>(collectionName: string, ...queryConstraints: QueryConstraint[]): Promise<T[]> {
  if (!isFirebaseConfigured()) {
    console.warn("Firebase not configured, returning empty array")
    return []
  }

  const db = getFirestoreDb()
  const collectionRef = collection(db, collectionName)
  const q = queryConstraints.length > 0 ? query(collectionRef, ...queryConstraints) : query(collectionRef)
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => mapDocToData<T>(doc))
}

export async function getById<T>(collectionName: string, id: string): Promise<T | undefined> {
  if (!isFirebaseConfigured()) return undefined

  const db = getFirestoreDb()
  const docRef = doc(db, collectionName, id)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    return mapDocToData<T>(docSnap)
  }
  return undefined
}

export async function getByIndex<T>(collectionName: string, fieldName: string, value: string): Promise<T | undefined> {
  if (!isFirebaseConfigured()) return undefined

  const db = getFirestoreDb()
  const collectionRef = collection(db, collectionName)
  const q = query(collectionRef, where(fieldName, "==", value))
  const snapshot = await getDocs(q)

  if (!snapshot.empty) {
    return mapDocToData<T>(snapshot.docs[0])
  }
  return undefined
}

export async function add<T extends object>(collectionName: string, data: T): Promise<string> {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase not configured")
  }

  const db = getFirestoreDb()
  const collectionRef = collection(db, collectionName)

  // Add timestamp for transaksi
  const dataWithTimestamp = collectionName === COLLECTIONS.TRANSAKSI ? { ...data, created_at: Timestamp.now() } : data

  const docRef = await addDoc(collectionRef, dataWithTimestamp as DocumentData)
  return docRef.id
}

export async function update<T extends { id?: string }>(collectionName: string, data: T): Promise<void> {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase not configured")
  }

  if (!data.id) {
    throw new Error("Document ID is required for update")
  }

  const db = getFirestoreDb()
  const docRef = doc(db, collectionName, data.id)

  // Remove id from data before updating
  const { id, ...updateData } = data
  await updateDoc(docRef, updateData as DocumentData)
}

export async function remove(collectionName: string, id: string): Promise<void> {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase not configured")
  }

  const db = getFirestoreDb()
  const docRef = doc(db, collectionName, id)
  await deleteDoc(docRef)
}

export async function clearStore(collectionName: string): Promise<void> {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase not configured")
  }

  const db = getFirestoreDb()
  const collectionRef = collection(db, collectionName)
  const snapshot = await getDocs(collectionRef)

  const batch = writeBatch(db)
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref)
  })
  await batch.commit()
}

export async function addMany<T extends object>(collectionName: string, items: T[]): Promise<void> {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase not configured")
  }

  const db = getFirestoreDb()
  const collectionRef = collection(db, collectionName)

  // Firestore batch limit is 500
  const BATCH_SIZE = 500

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batchItems = items.slice(i, i + BATCH_SIZE)
    const currentBatch = writeBatch(db)

    for (const item of batchItems) {
      const docRef = doc(collectionRef)
      currentBatch.set(docRef, item as DocumentData)
    }

    await currentBatch.commit()
  }
}

// ============ SPECIFIC QUERIES ============

// Get all barang sorted by name
export async function getAllBarang(): Promise<Barang[]> {
  return getAll<Barang>(COLLECTIONS.BARANG, orderBy("nama_barang"))
}

// Get barang by kode
export async function getBarangByKode(kode: string): Promise<Barang | undefined> {
  return getByIndex<Barang>(COLLECTIONS.BARANG, "kode_barang", kode)
}

// Get all transaksi sorted by date (newest first)
export async function getAllTransaksi(): Promise<Transaksi[]> {
  const transaksi = await getAll<Transaksi>(COLLECTIONS.TRANSAKSI)
  // Sort by id descending (newest first)
  return transaksi.sort((a, b) => {
    if (a.created_at && b.created_at) {
      return b.created_at.toMillis() - a.created_at.toMillis()
    }
    return 0
  })
}

// Get laba arsip
export async function getAllLabaArsip(): Promise<LabaArsip[]> {
  return getAll<LabaArsip>(COLLECTIONS.LABA_ARSIP, orderBy("bulan", "desc"))
}

// ============ CLEANUP SYSTEM ============

// Get transaksi older than specified months
export async function getOldTransaksi(monthsOld = 8): Promise<Transaksi[]> {
  if (!isFirebaseConfigured()) return []

  const db = getFirestoreDb()
  const collectionRef = collection(db, COLLECTIONS.TRANSAKSI)

  // Calculate cutoff date
  const cutoffDate = new Date()
  cutoffDate.setMonth(cutoffDate.getMonth() - monthsOld)
  const cutoffTimestamp = Timestamp.fromDate(cutoffDate)

  const q = query(collectionRef, where("created_at", "<", cutoffTimestamp))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => mapDocToData<Transaksi>(doc))
}

// Archive and cleanup old transactions
export async function archiveOldTransactions(): Promise<{
  archived: number
  deleted: number
  summaries: LabaArsip[]
}> {
  if (!isFirebaseConfigured()) {
    return { archived: 0, deleted: 0, summaries: [] }
  }

  const db = getFirestoreDb()

  // Get all old transactions (8+ months)
  const oldTransaksi = await getOldTransaksi(8)
  const oldBarangMasuk = await getOldBarangMasuk(8)
  const oldBarangKeluar = await getOldBarangKeluar(8)

  if (oldTransaksi.length === 0 && oldBarangMasuk.length === 0 && oldBarangKeluar.length === 0) {
    return { archived: 0, deleted: 0, summaries: [] }
  }

  // Group by month
  const monthlyData = new Map<
    string,
    {
      transaksi: Transaksi[]
      barangMasuk: BarangMasuk[]
      barangKeluar: BarangKeluar[]
    }
  >()

  // Helper to get month key from date string
  const getMonthKey = (tanggal: string): string => {
    try {
      const dateParts = tanggal.split(",")[0].split("/")
      const year = dateParts[2]
      const month = dateParts[1].padStart(2, "0")
      return `${year}-${month}`
    } catch {
      return "unknown"
    }
  }

  // Group transaksi
  for (const t of oldTransaksi) {
    const monthKey = getMonthKey(t.tanggal)
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, { transaksi: [], barangMasuk: [], barangKeluar: [] })
    }
    monthlyData.get(monthKey)!.transaksi.push(t)
  }

  // Group barang masuk
  for (const bm of oldBarangMasuk) {
    const monthKey = getMonthKey(bm.tanggal)
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, { transaksi: [], barangMasuk: [], barangKeluar: [] })
    }
    monthlyData.get(monthKey)!.barangMasuk.push(bm)
  }

  // Group barang keluar
  for (const bk of oldBarangKeluar) {
    const monthKey = getMonthKey(bk.tanggal)
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, { transaksi: [], barangMasuk: [], barangKeluar: [] })
    }
    monthlyData.get(monthKey)!.barangKeluar.push(bk)
  }

  // Create monthly summaries
  const summaries: LabaArsip[] = []

  for (const [monthKey, data] of monthlyData) {
    if (monthKey === "unknown") continue

    const [year, month] = monthKey.split("-")

    // Calculate totals
    const totalPenjualan = data.transaksi.reduce((sum, t) => sum + t.total, 0)
    const totalModal = data.transaksi.reduce((sum, t) => {
      return sum + t.items.reduce((itemSum, item) => itemSum + item.harga_beli * item.qty, 0)
    }, 0)
    const totalLaba = data.transaksi.reduce((sum, t) => sum + t.laba, 0)
    const totalBarangMasuk = data.barangMasuk.reduce((sum, bm) => sum + bm.total_harga, 0)
    const totalBarangKeluar = data.barangKeluar.reduce((sum, bk) => sum + bk.total_harga, 0)

    // Check if summary already exists
    const existingArsip = await getByIndex<LabaArsip>(COLLECTIONS.LABA_ARSIP, "bulan", monthKey)

    if (existingArsip) {
      // Update existing
      await update<LabaArsip>(COLLECTIONS.LABA_ARSIP, {
        ...existingArsip,
        total_penjualan: existingArsip.total_penjualan + totalPenjualan,
        total_modal: existingArsip.total_modal + totalModal,
        total_laba: existingArsip.total_laba + totalLaba,
        total_barang_masuk: existingArsip.total_barang_masuk + totalBarangMasuk,
        total_barang_keluar: existingArsip.total_barang_keluar + totalBarangKeluar,
        jumlah_transaksi: existingArsip.jumlah_transaksi + data.transaksi.length,
      })
    } else {
      // Create new summary
      const arsip: Omit<LabaArsip, "id"> = {
        bulan: monthKey,
        tahun: Number.parseInt(year),
        bulan_num: Number.parseInt(month),
        total_penjualan: totalPenjualan,
        total_modal: totalModal,
        total_laba: totalLaba,
        total_barang_masuk: totalBarangMasuk,
        total_barang_keluar: totalBarangKeluar,
        jumlah_transaksi: data.transaksi.length,
        created_at: Timestamp.now(),
      }

      await add(COLLECTIONS.LABA_ARSIP, arsip)
      summaries.push(arsip as LabaArsip)
    }
  }

  // Delete old records in batches
  const BATCH_SIZE = 500
  let totalDeleted = 0

  // Delete old transaksi
  for (let i = 0; i < oldTransaksi.length; i += BATCH_SIZE) {
    const batch = writeBatch(db)
    const batchItems = oldTransaksi.slice(i, i + BATCH_SIZE)

    for (const t of batchItems) {
      if (t.id) {
        batch.delete(doc(db, COLLECTIONS.TRANSAKSI, t.id))
        totalDeleted++
      }
    }
    await batch.commit()
  }

  // Delete old barang masuk
  for (let i = 0; i < oldBarangMasuk.length; i += BATCH_SIZE) {
    const batch = writeBatch(db)
    const batchItems = oldBarangMasuk.slice(i, i + BATCH_SIZE)

    for (const bm of batchItems) {
      if (bm.id) {
        batch.delete(doc(db, COLLECTIONS.BARANG_MASUK, bm.id))
        totalDeleted++
      }
    }
    await batch.commit()
  }

  // Delete old barang keluar
  for (let i = 0; i < oldBarangKeluar.length; i += BATCH_SIZE) {
    const batch = writeBatch(db)
    const batchItems = oldBarangKeluar.slice(i, i + BATCH_SIZE)

    for (const bk of batchItems) {
      if (bk.id) {
        batch.delete(doc(db, COLLECTIONS.BARANG_KELUAR, bk.id))
        totalDeleted++
      }
    }
    await batch.commit()
  }

  return {
    archived: summaries.length,
    deleted: totalDeleted,
    summaries,
  }
}

// Get old barang masuk
async function getOldBarangMasuk(monthsOld = 8): Promise<BarangMasuk[]> {
  const allBarangMasuk = await getAll<BarangMasuk>(COLLECTIONS.BARANG_MASUK)

  const cutoffDate = new Date()
  cutoffDate.setMonth(cutoffDate.getMonth() - monthsOld)

  return allBarangMasuk.filter((bm) => {
    try {
      const dateParts = bm.tanggal.split(",")[0].split("/")
      const date = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`)
      return date < cutoffDate
    } catch {
      return false
    }
  })
}

// Get old barang keluar
async function getOldBarangKeluar(monthsOld = 8): Promise<BarangKeluar[]> {
  const allBarangKeluar = await getAll<BarangKeluar>(COLLECTIONS.BARANG_KELUAR)

  const cutoffDate = new Date()
  cutoffDate.setMonth(cutoffDate.getMonth() - monthsOld)

  return allBarangKeluar.filter((bk) => {
    try {
      const dateParts = bk.tanggal.split(",")[0].split("/")
      const date = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`)
      return date < cutoffDate
    } catch {
      return false
    }
  })
}

// Check cleanup status
export async function getCleanupStatus(): Promise<{
  oldTransaksiCount: number
  oldBarangMasukCount: number
  oldBarangKeluarCount: number
  totalOldRecords: number
  arsipCount: number
}> {
  const oldTransaksi = await getOldTransaksi(8)
  const oldBarangMasuk = await getOldBarangMasuk(8)
  const oldBarangKeluar = await getOldBarangKeluar(8)
  const arsip = await getAllLabaArsip()

  return {
    oldTransaksiCount: oldTransaksi.length,
    oldBarangMasukCount: oldBarangMasuk.length,
    oldBarangKeluarCount: oldBarangKeluar.length,
    totalOldRecords: oldTransaksi.length + oldBarangMasuk.length + oldBarangKeluar.length,
    arsipCount: arsip.length,
  }
}
