import { create } from "zustand";
import type { Product } from "../types/index";

export interface CartItem extends Product {
  qty: number;
}

interface CartStore {
  cart: CartItem[];
  selectedIds: Set<number>;
  addToCart: (item: Product) => void;
  removeFromCart: (itemId: number) => void;
  updateQty: (itemId: number, qty: number) => void;
  clearCart: () => void;
  cartCount: () => number;
  cartTotal: () => number;
  toggleSelected: (itemId: number) => void;
  selectAll: () => void;
  clearSelection: () => void;
  selectedItems: () => CartItem[];
  selectedTotal: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  cart: [],
  selectedIds: new Set<number>(),
  addToCart: (item) =>
    set((state) => {
      const existingItem = state.cart.find((c) => c.id === item.id);
      if (existingItem) {
        return { cart: state.cart };
      }
      // Auto-select newly added item
      const newSelectedIds = new Set(state.selectedIds);
      newSelectedIds.add(item.id);
      return { cart: [...state.cart, { ...item, qty: 1 }], selectedIds: newSelectedIds };
    }),
  removeFromCart: (itemId) =>
    set((state) => {
      const newSelectedIds = new Set(state.selectedIds);
      newSelectedIds.delete(itemId);
      return {
        cart: state.cart.filter((c) => c.id !== itemId),
        selectedIds: newSelectedIds,
      };
    }),
  updateQty: (itemId, qty) =>
    set((state) => {
      if (qty <= 0) {
        return { cart: state.cart.filter((c) => c.id !== itemId) };
      }
      const safeQty = qty > 1 ? 1 : qty;
      return {
        cart: state.cart.map((c) =>
          c.id === itemId ? { ...c, qty: safeQty } : c,
        ),
      };
    }),
  clearCart: () => set({ cart: [], selectedIds: new Set() }),
  cartCount: () => get().cart.reduce((total, item) => total + item.qty, 0),
  cartTotal: () =>
    get().cart.reduce((total, item) => total + item.price * item.qty, 0),
  toggleSelected: (itemId) =>
    set((state) => {
      const newSet = new Set(state.selectedIds);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return { selectedIds: newSet };
    }),
  selectAll: () =>
    set((state) => ({
      selectedIds: new Set(state.cart.map((c) => c.id)),
    })),
  clearSelection: () => set({ selectedIds: new Set() }),
  selectedItems: () => {
    const { cart, selectedIds } = get();
    return cart.filter((c) => selectedIds.has(c.id));
  },
  selectedTotal: () => {
    const { cart, selectedIds } = get();
    return cart
      .filter((c) => selectedIds.has(c.id))
      .reduce((total, item) => total + item.price * item.qty, 0);
  },
}));
