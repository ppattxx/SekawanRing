import { create } from "zustand";
import type { Product } from "../types/index";

interface CartItem extends Product {
  qty: number;
}

interface CartStore {
  cart: CartItem[];
  addToCart: (item: Product) => void;
  cartCount: () => number;
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
  cartCount: () => get().cart.reduce((total, item) => total + item.qty, 0),
}));
