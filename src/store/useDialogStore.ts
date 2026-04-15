import { create } from "zustand";

export type DialogTone = "info" | "success" | "warning" | "danger";
export type DialogType = "alert" | "confirm" | "prompt";

export interface DialogPayload {
  type: DialogType;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  placeholder?: string;
  defaultValue?: string;
  tone?: DialogTone;
}

interface DialogStore {
  dialog: DialogPayload | null;
  resolver: ((value: unknown) => void) | null;
  openDialog: (dialog: DialogPayload, resolver: (value: unknown) => void) => void;
  closeDialog: () => void;
}

export const useDialogStore = create<DialogStore>((set) => ({
  dialog: null,
  resolver: null,
  openDialog: (dialog, resolver) => set({ dialog, resolver }),
  closeDialog: () => set({ dialog: null, resolver: null }),
}));
