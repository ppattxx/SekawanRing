export interface OrderStatusOption {
  value: "booking" | "paid" | "shipped" | "completed" | "cancelled";
  label: string;
  color: string;
}

export interface OrderStats {
  total: number;
  booking: number;
  paid: number;
  shipped: number;
  completed: number;
  cancelled: number;
}

export const STATUS_OPTIONS: OrderStatusOption[] = [
  { value: "booking", label: "Booking", color: "amber" },
  { value: "paid", label: "Dibayar", color: "blue" },
  { value: "shipped", label: "Dikirim", color: "purple" },
  { value: "completed", label: "Selesai", color: "green" },
  { value: "cancelled", label: "Dibatalkan", color: "red" },
];

export const STATUS_COLOR_MAP: Record<string, string> = {
  booking: "bg-amber-100 text-amber-800 border-amber-300",
  paid: "bg-blue-100 text-blue-800 border-blue-300",
  shipped: "bg-purple-100 text-purple-800 border-purple-300",
  completed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
};

export const ORDERS_ENDPOINT_AVAILABLE = true;

export const MESSAGES = {
  LOADING: "Memuat data pesanan...",
  NO_INVOICE: "Tidak ada pesanan yang ditemukan",
  LOCAL_NO_ORDERS: "Daftar pesanan belum tersedia",
  FETCH_ERROR: "Gagal memuat data pesanan. Periksa koneksi API.",
  UPDATE_SUCCESS: "Status pesanan berhasil diupdate!",
  UPDATE_ERROR: "Gagal mengupdate status pesanan. Silakan coba lagi.",
  UPDATE_ERROR_API: "Gagal mengupdate status via API:",
  TRACKING_PROMPT: "Masukkan nomor tracking pengiriman:",
  TRACKING_REQUIRED: "Nomor tracking diperlukan untuk status 'Dikirim'",
  INVALID_PENDING_STATUS: "Status 'Booking' tidak bisa dipilih sebagai aksi update. Gunakan aksi transaksi yang tersedia.",
  RETRY_BUTTON: "Coba Lagi",
  REFRESH_PAGE: "Refresh Page",
  FETCH_ERROR_TITLE: "Gagal Memuat",
} as const;

export const SHIPPING_STATUSES = ["booking", "paid", "shipped", "completed"] as const;
