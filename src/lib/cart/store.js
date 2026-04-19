import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem(item) {
        const items = get().items
        const idx = items.findIndex(
          (i) => i.product_id === item.product_id && i.color === item.color
        )
        if (idx >= 0) {
          const updated = [...items]
          updated[idx] = { ...updated[idx], qty: updated[idx].qty + (item.qty || 1) }
          set({ items: updated })
        } else {
          set({ items: [...items, { ...item, qty: item.qty || 1 }] })
        }
      },

      removeItem(product_id, color) {
        set({ items: get().items.filter((i) => !(i.product_id === product_id && i.color === color)) })
      },

      updateQty(product_id, color, qty) {
        if (qty <= 0) { get().removeItem(product_id, color); return }
        set({
          items: get().items.map((i) =>
            i.product_id === product_id && i.color === color ? { ...i, qty } : i
          ),
        })
      },

      clearCart() { set({ items: [] }) },
    }),
    {
      name: 'hkgames-cart-v2',
      storage: createJSONStorage(() => localStorage),
      skipHydration: false,
    }
  )
)
