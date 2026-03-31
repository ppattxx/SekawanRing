import { useCartStore } from "../../store/useCartStore";

interface OrderSummaryProps {
  onConfirm: () => void;
  isSubmitting: boolean;
}

export default function OrderSummary({ onConfirm, isSubmitting }: OrderSummaryProps) {
  const cart = useCartStore((s) => s.cart);
  const cartTotal = useCartStore((s) => s.cartTotal);
  const cartCount = useCartStore((s) => s.cartCount);

  const subtotal = cartTotal();
  const total = subtotal;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-black text-plant-dark flex items-center gap-2">
        Ringkasan Pesanan
      </h3>

      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-50 space-y-4">
        {/* Items list */}
        <div className="space-y-3">
          {cart.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg">🦅</span>
                <span className="font-medium text-plant-dark truncate">
                  {item.name}
                </span>
                <span className="text-gray-400 flex-shrink-0">×{item.qty}</span>
              </div>
              <span className="font-bold text-plant-dark flex-shrink-0 ml-2">
                Rp {(item.price * item.qty).toLocaleString("id-ID")}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal ({cartCount()} item)</span>
            <span className="font-bold text-plant-dark">
              Rp {subtotal.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Ongkir</span>
            <span className="font-bold text-plant-dark">Ditentukan admin</span>
          </div>
          <p className="text-xs text-gray-500">
            Total akhir akan diperbarui setelah admin menginput ongkir.
          </p>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-600">Total Bayar</span>
            <span className="text-xl sm:text-2xl font-black text-plant-green">
              Rp {total.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* Confirm button */}
        <button
          onClick={onConfirm}
          disabled={isSubmitting || cart.length === 0}
          className={`w-full py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 ${
            isSubmitting || cart.length === 0
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-plant-dark text-white hover:bg-gray-800 shadow-lg hover:shadow-xl active:scale-[0.98]"
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Memproses Pesanan...
            </span>
          ) : (
            "Buat Booking"
          )}
        </button>
      </div>
    </div>
  );
}
