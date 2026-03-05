import { create } from "zustand";
import type { Product } from "../types/index";

export interface CartItem extends Product {
  qty: number;
}

interface CartStore {
  cart: CartItem[];
  addToCart: (item: Product) => void;
  removeFromCart: (itemId: number) => void;
  updateQty: (itemId: number, qty: number) => void;
  clearCart: () => void;
  cartCount: () => number;
  cartTotal: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  cart: [],
  addToCart: (item) =>
    set((state) => {
      const existingItem = state.cart.find((c) => c.id === item.id);
      if (existingItem) {
        return {
          cart: state.cart.map((c) =>
            c.id === item.id ? { ...c, qty: c.qty + 1 } : c,
          ),
        };
      }
      return { cart: [...state.cart, { ...item, qty: 1 }] };
    }),
  removeFromCart: (itemId) =>
    set((state) => ({
      cart: state.cart.filter((c) => c.id !== itemId),
    })),
  updateQty: (itemId, qty) =>
    set((state) => {
      if (qty <= 0) {
        return { cart: state.cart.filter((c) => c.id !== itemId) };
      }
      return {
        cart: state.cart.map((c) =>
          c.id === itemId ? { ...c, qty } : c,
        ),
      };
    }),
  clearCart: () => set({ cart: [] }),
  cartCount: () => get().cart.reduce((total, item) => total + item.qty, 0),
  cartTotal: () =>
    get().cart.reduce((total, item) => total + item.price * item.qty, 0),
}));
