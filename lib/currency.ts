// Format mata uang Rupiah
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function parseRupiah(value: string): number {
  // Remove all non-numeric characters except minus
  const cleaned = value.replace(/[^\d-]/g, "")
  return Number.parseInt(cleaned, 10) || 0
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("id-ID").format(num)
}
