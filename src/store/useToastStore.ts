import { create } from "zustand";

interface ToastItem {
  id: number;
  itemName: string;
}

interface ToastStore {
  toasts: ToastItem[];
  showCartToast: (itemName: string) => void;
  dismissToast: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  showCartToast: (itemName) => {
    const id = nextId++;
    set((state) => ({
      toasts: [...state.toasts, { id, itemName }],
    }));
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 3000);
  },
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
