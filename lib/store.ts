// Zustand Store untuk State Management
import { create } from "zustand"
import type { Barang, TransaksiItem } from "./db"

interface CartItem extends TransaksiItem {}

interface KasirStore {
  cart: CartItem[]
  addToCart: (barang: Barang, qty: number) => void
  updateCartQty: (kode_barang: string, qty: number) => void
  removeFromCart: (kode_barang: string) => void
  clearCart: () => void
  getTotal: () => number
  getTotalLaba: () => number
}

export const useKasirStore = create<KasirStore>((set, get) => ({
  cart: [],

  addToCart: (barang: Barang, qty: number) => {
    set((state) => {
      const existingItem = state.cart.find((item) => item.kode_barang === barang.kode_barang)

      if (existingItem) {
        return {
          cart: state.cart.map((item) =>
            item.kode_barang === barang.kode_barang
              ? {
                  ...item,
                  qty: item.qty + qty,
                  subtotal: (item.qty + qty) * item.harga_jual,
                }
              : item,
          ),
        }
      }

      return {
        cart: [
          ...state.cart,
          {
            kode_barang: barang.kode_barang,
            nama_barang: barang.nama_barang,
            harga_jual: barang.harga_jual,
            harga_beli: barang.harga_beli,
            qty: qty,
            subtotal: qty * barang.harga_jual,
          },
        ],
      }
    })
  },

  updateCartQty: (kode_barang: string, qty: number) => {
    set((state) => ({
      cart: state.cart.map((item) =>
        item.kode_barang === kode_barang ? { ...item, qty, subtotal: qty * item.harga_jual } : item,
      ),
    }))
  },

  removeFromCart: (kode_barang: string) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.kode_barang !== kode_barang),
    }))
  },

  clearCart: () => set({ cart: [] }),

  getTotal: () => {
    return get().cart.reduce((sum, item) => sum + item.subtotal, 0)
  },

  getTotalLaba: () => {
    return get().cart.reduce((sum, item) => sum + (item.harga_jual - item.harga_beli) * item.qty, 0)
  },
}))
