import { Link } from "react-router-dom";
import { useCartStore } from "../../store/useCartStore";
import type { CartItem } from "../../store/useCartStore";

export default function CartRecap() {
  const cart = useCartStore((s) => s.cart);
  const removeFromCart = useCartStore((s) => s.removeFromCart);

  if (cart.length === 0) {
    return (
      <div className="bg-white rounded-[2rem] p-8 text-center shadow-sm border border-gray-100">
        <span className="text-5xl block mb-3">🛍️</span>
        <h3 className="text-lg font-bold text-gray-500 mb-2">Keranjang Kosong</h3>
        <p className="text-gray-400 text-sm mb-4">
          Tambahkan burung ke keranjang terlebih dahulu.
        </p>
        <Link
          to="/katalog"
          className="inline-block bg-plant-green text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-green-700 transition-colors"
        >
          Lihat Katalog
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-plant-dark">Keranjang Belanja</h3>
        <span className="text-xs font-semibold text-gray-400">
          {cart.length} item
        </span>
      </div>

      {/* Items */}
      <div className="divide-y divide-gray-50">
        {cart.map((item: CartItem) => (
          <div key={item.id} className="px-4 sm:px-5 py-3 sm:py-4 flex items-center gap-3">
            {/* Thumbnail */}
            <div className="bg-plant-light/60 rounded-xl w-12 h-12 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🦅</span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-plant-dark text-sm truncate leading-tight">
                {item.name}
              </h4>
              {item.type && (
                <p className="text-[11px] text-gray-400 leading-tight">{item.type}</p>
              )}
              <p className="text-plant-green font-bold text-xs mt-0.5">
                Rp {item.price.toLocaleString("id-ID")} × {item.qty}
              </p>
            </div>

            {/* Delete Button */}
            <button
              onClick={() => removeFromCart(item.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 text-xs font-bold transition-colors"
            >
              Hapus
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
