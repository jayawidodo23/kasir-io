"use client"

import { useEffect, useState } from "react"
import { getAll, type Transaksi } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export function MostSoldTrendline() {
  const [topItems, setTopItems] = useState<{ name: string; qty: number }[]>([])

  useEffect(() => {
    const loadTrends = async () => {
      const transactions = await getAll<Transaksi>("transaksi")
      const lastWeek = new Date()
      lastWeek.setDate(lastWeek.getDate() - 7)

      const sales: Record<string, number> = {}

      transactions.forEach((t) => {
        const tDate = new Date(t.tanggal.split(",")[0].split("/").reverse().join("-"))
        if (tDate >= lastWeek) {
          t.items.forEach((item) => {
            sales[item.nama_barang] = (sales[item.nama_barang] || 0) + item.qty
          })
        }
      })

      const sorted = Object.entries(sales)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5)

      setTopItems(sorted)
    }
    loadTrends()
  }, [])

  if (topItems.length === 0) return null

  const maxQty = topItems[0]?.qty || 1

  return (
    <Card className="bg-primary/5 border-primary/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-primary">
          <TrendingUp className="h-4 w-4" />
          Top 5 Barang (7 Hari Terakhir)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {topItems.map((item) => (
          <div key={item.name} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium truncate max-w-[150px]">{item.name}</span>
              <span className="text-muted-foreground">{item.qty} terjual</span>
            </div>
            <Progress value={(item.qty / maxQty) * 100} className="h-1" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
