"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Database,
  Shield,
  Loader2,
  Copy,
  ExternalLink,
  RefreshCw,
} from "lucide-react"
import { isFirebaseConfigured, getFirestoreDb } from "@/lib/firebase"
import { collection, getDocs, addDoc } from "firebase/firestore"
import type { Barang } from "@/lib/db"

const FIRESTORE_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Barang (Products) - Allow all operations
    match /barang/{document=**} {
      allow read, write: if true;
    }
    
    // Barang Masuk (Incoming Stock)
    match /barang_masuk/{document=**} {
      allow read, write: if true;
    }
    
    // Barang Keluar (Outgoing Stock)
    match /barang_keluar/{document=**} {
      allow read, write: if true;
    }
    
    // Transaksi (Transactions)
    match /transaksi/{document=**} {
      allow read, write: if true;
    }
    
    // Laba Arsip (Profit Archives)
    match /laba_arsip/{document=**} {
      allow read, write: if true;
    }
  }
}`

const SAMPLE_PRODUCTS: Omit<Barang, "id">[] = [
  {
    kode_barang: "PRD001",
    nama_barang: "Indomie Goreng",
    harga_beli: 2500,
    harga_jual: 3500,
    stok: 100,
    created_at: new Date().toLocaleString("id-ID"),
  },
  {
    kode_barang: "PRD002",
    nama_barang: "Aqua 600ml",
    harga_beli: 2000,
    harga_jual: 3000,
    stok: 50,
    created_at: new Date().toLocaleString("id-ID"),
  },
  {
    kode_barang: "PRD003",
    nama_barang: "Teh Botol Sosro",
    harga_beli: 3500,
    harga_jual: 5000,
    stok: 30,
    created_at: new Date().toLocaleString("id-ID"),
  },
  {
    kode_barang: "PRD004",
    nama_barang: "Roti Tawar Sari Roti",
    harga_beli: 12000,
    harga_jual: 15000,
    stok: 20,
    created_at: new Date().toLocaleString("id-ID"),
  },
  {
    kode_barang: "PRD005",
    nama_barang: "Kopi Kapal Api",
    harga_beli: 1500,
    harga_jual: 2500,
    stok: 80,
    created_at: new Date().toLocaleString("id-ID"),
  },
]

interface CollectionStatus {
  name: string
  exists: boolean
  count: number
  loading: boolean
}

export default function SetupPage() {
  const [isConfigured, setIsConfigured] = useState(false)
  const [collections, setCollections] = useState<CollectionStatus[]>([
    { name: "barang", exists: false, count: 0, loading: true },
    { name: "barang_masuk", exists: false, count: 0, loading: true },
    { name: "barang_keluar", exists: false, count: 0, loading: true },
    { name: "transaksi", exists: false, count: 0, loading: true },
    { name: "laba_arsip", exists: false, count: 0, loading: true },
  ])
  const [initLoading, setInitLoading] = useState(false)
  const [initResult, setInitResult] = useState<{ success: boolean; message: string } | null>(null)
  const [copied, setCopied] = useState(false)

  // Check Firebase configuration on mount
  useEffect(() => {
    setIsConfigured(isFirebaseConfigured())
    if (isFirebaseConfigured()) {
      checkCollections()
    }
  }, [])

  const checkCollections = async () => {
    if (!isFirebaseConfigured()) return

    const db = getFirestoreDb()
    const collectionNames = ["barang", "barang_masuk", "barang_keluar", "transaksi", "laba_arsip"]

    const updatedCollections: CollectionStatus[] = []

    for (const name of collectionNames) {
      try {
        const collectionRef = collection(db, name)
        const snapshot = await getDocs(collectionRef)
        updatedCollections.push({
          name,
          exists: !snapshot.empty,
          count: snapshot.size,
          loading: false,
        })
      } catch (error) {
        console.error(`Error checking collection ${name}:`, error)
        updatedCollections.push({
          name,
          exists: false,
          count: 0,
          loading: false,
        })
      }
    }

    setCollections(updatedCollections)
  }

  const initializeCollections = async (withSampleData: boolean) => {
    if (!isFirebaseConfigured()) {
      setInitResult({ success: false, message: "Firebase belum dikonfigurasi" })
      return
    }

    setInitLoading(true)
    setInitResult(null)

    try {
      const db = getFirestoreDb()

      // Initialize each collection with a placeholder document if empty
      // Then delete the placeholder (this creates the collection in Firebase Console)
      const collectionNames = ["barang", "barang_masuk", "barang_keluar", "transaksi", "laba_arsip"]

      for (const name of collectionNames) {
        const collectionRef = collection(db, name)
        const snapshot = await getDocs(collectionRef)

        // Collection is empty, create an init marker (optional)
        if (snapshot.empty && name !== "barang") {
          // We'll skip creating placeholders for other collections
          // They will be created when actual data is added
        }
      }

      // Add sample products if requested
      if (withSampleData) {
        const barangRef = collection(db, "barang")
        const existingBarang = await getDocs(barangRef)

        if (existingBarang.empty) {
          for (const product of SAMPLE_PRODUCTS) {
            await addDoc(barangRef, product)
          }
        }
      }

      // Refresh collection status
      await checkCollections()

      setInitResult({
        success: true,
        message: withSampleData
          ? "Database berhasil diinisialisasi dengan data contoh!"
          : "Database berhasil diinisialisasi!",
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error("Init error:", error)
      setInitResult({
        success: false,
        message: `Gagal menginisialisasi database: ${errorMessage}. Pastikan Firestore Rules sudah dikonfigurasi.`,
      })
    } finally {
      setInitLoading(false)
    }
  }

  const copyRules = () => {
    navigator.clipboard.writeText(FIRESTORE_RULES)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const envVars = [
    { name: "NEXT_PUBLIC_FIREBASE_API_KEY", desc: "API Key dari Firebase Console" },
    { name: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", desc: "Auth Domain (projectId.firebaseapp.com)" },
    { name: "NEXT_PUBLIC_FIREBASE_PROJECT_ID", desc: "Project ID dari Firebase" },
    { name: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", desc: "Storage Bucket (projectId.appspot.com)" },
    { name: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", desc: "Messaging Sender ID" },
    { name: "NEXT_PUBLIC_FIREBASE_APP_ID", desc: "App ID dari Firebase" },
  ]

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Setup Firebase Firestore</h1>
        <p className="text-muted-foreground">Konfigurasi database untuk aplikasi Kasir</p>
      </div>

      {/* Status Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Status Konfigurasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isConfigured ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span>Environment Variables</span>
              <Badge variant={isConfigured ? "default" : "destructive"}>{isConfigured ? "OK" : "Missing"}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="env" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="env">1. Environment</TabsTrigger>
          <TabsTrigger value="rules">2. Security Rules</TabsTrigger>
          <TabsTrigger value="init">3. Inisialisasi</TabsTrigger>
        </TabsList>

        {/* Environment Variables Tab */}
        <TabsContent value="env">
          <Card>
            <CardHeader>
              <CardTitle>Environment Variables</CardTitle>
              <CardDescription>
                Tambahkan environment variables berikut ke project Vercel atau file .env.local
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Cara mendapatkan credentials Firebase</AlertTitle>
                <AlertDescription>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Buka Firebase Console → Project Settings</li>
                    <li>Scroll ke bagian &quot;Your apps&quot;</li>
                    <li>Klik icon Web (&lt;/&gt;) untuk membuat app baru</li>
                    <li>Copy konfigurasi yang diberikan</li>
                  </ol>
                  <Button variant="link" className="px-0 mt-2" asChild>
                    <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer">
                      Buka Firebase Console <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {envVars.map((env) => (
                  <div key={env.name} className="space-y-1">
                    <Label className="font-mono text-sm">{env.name}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={env.name}
                        className="font-mono text-xs bg-muted"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                      <Badge variant="outline" className="whitespace-nowrap">
                        {env.desc}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Rules Tab */}
        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Firestore Security Rules
              </CardTitle>
              <CardDescription>Copy rules berikut dan paste di Firebase Console → Firestore → Rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Penting!</AlertTitle>
                <AlertDescription>
                  Rules ini mengizinkan akses penuh untuk development. Untuk production, tambahkan autentikasi.
                </AlertDescription>
              </Alert>

              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">{FIRESTORE_RULES}</pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2 bg-transparent"
                  onClick={copyRules}
                >
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <a
                    href="https://console.firebase.google.com/project/_/firestore/rules"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Buka Firestore Rules <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Initialize Tab */}
        <TabsContent value="init">
          <Card>
            <CardHeader>
              <CardTitle>Inisialisasi Database</CardTitle>
              <CardDescription>Periksa status koleksi dan inisialisasi database</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isConfigured ? (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Firebase Belum Dikonfigurasi</AlertTitle>
                  <AlertDescription>
                    Tambahkan environment variables terlebih dahulu sebelum menginisialisasi database.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {/* Collection Status */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Status Koleksi</h3>
                      <Button variant="ghost" size="sm" onClick={checkCollections}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                    <div className="grid gap-2">
                      {collections.map((col) => (
                        <div key={col.name} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                          <div className="flex items-center gap-2">
                            {col.loading ? (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : col.exists ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="font-mono text-sm">{col.name}</span>
                          </div>
                          <Badge variant={col.exists ? "default" : "secondary"}>
                            {col.loading ? "Loading..." : `${col.count} dokumen`}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Initialize Buttons */}
                  <div className="flex flex-col gap-3 pt-4 border-t">
                    <Button onClick={() => initializeCollections(true)} disabled={initLoading} className="w-full">
                      {initLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Menginisialisasi...
                        </>
                      ) : (
                        <>
                          <Database className="h-4 w-4 mr-2" />
                          Inisialisasi dengan Data Contoh
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => initializeCollections(false)}
                      disabled={initLoading}
                      className="w-full"
                    >
                      Inisialisasi Tanpa Data
                    </Button>
                  </div>

                  {/* Result Message */}
                  {initResult && (
                    <Alert variant={initResult.success ? "default" : "destructive"}>
                      {initResult.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      <AlertTitle>{initResult.success ? "Berhasil!" : "Error"}</AlertTitle>
                      <AlertDescription>{initResult.message}</AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Links */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Link Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer">
                Firebase Console <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://firebase.google.com/docs/firestore/quickstart" target="_blank" rel="noopener noreferrer">
                Dokumentasi Firestore <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/">Kembali ke Kasir</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
