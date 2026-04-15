export const ORDER_CONFIRMATION_MESSAGES = {
  LOADING: "Memuat pesanan...",
  NOT_FOUND: "Pesanan tidak ditemukan",
  NOT_FOUND_DESCRIPTION: "Pesanan tidak dapat ditemukan. Pastikan tautan dari invoice valid.",
  INVOICE_NOT_FOUND: "Nomor invoice tidak ditemukan",
  FETCH_ERROR: "Pesanan tidak ditemukan. Pastikan tautan dari invoice valid.",
  CONFIRM_ERROR: "Gagal mengkonfirmasi pesanan. Silakan coba lagi.",
  CONFIRM_SUCCESS: "Pesanan Dikonfirmasi!",
  CONFIRM_SUCCESS_SUBTITLE: "Terima kasih telah mengkonfirmasi pesanan Anda.",
  COPY_SUCCESS: "Link tracking berhasil disalin!",
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  booking: "Menunggu Konfirmasi Pembayaran",
  paid: "Dibayar",
  shipped: "Dikirim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
} as const;

export const ORDER_STATUS_COLORS: Record<string, string> = {
  booking: "bg-amber-500",
  paid: "bg-purple-500",
  shipped: "bg-blue-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
} as const;

export const TRACKING_STEPS_BASE = [
  { label: "Menunggu Konfirmasi Pembayaran", order: 1 },
  { label: "Pembayaran Dikonfirmasi", order: 2 },
  { label: "Paket Dikirim", order: 3 },
  { label: "Pesanan Selesai", order: 4 },
] as const;

export const PAYMENT_DESTINATION = {
  bankName: "BCA",
  accountNumber: "1234567890",
  accountHolder: "SEKAWAN BIRD FARM",
} as const;

export const CSS_CLASSES = {
  pageContainer: "min-h-screen bg-[#F8FBF9] pb-20",
  headerBase: "bg-plant-green pt-6 sm:pt-8 pb-16 sm:pb-20 px-4 sm:px-6 md:px-12 rounded-b-[1.5rem] sm:rounded-b-[2rem]",
  headerContent: "max-w-4xl mx-auto",
  mainContent: "max-w-4xl mx-auto px-4 sm:px-6 md:px-10 -mt-8 relative z-10",
  card: "bg-white rounded-[1.5rem] sm:rounded-[2rem] p-8 sm:p-10 shadow-sm border border-gray-100",
  button: {
    primary: "bg-plant-green text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed",
    secondary: "border-2 border-gray-300 text-plant-dark hover:bg-gray-50",
    small: "bg-green-600 text-white hover:bg-green-700",
  },
} as const;
