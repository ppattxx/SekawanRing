import { useCartStore } from "../store/useCartStore";
import { Link, useNavigate } from "react-router-dom";

export default function Cart() {
  const cart = useCartStore((state) => state.cart);
  const cartCount = useCartStore((state) => state.cartCount);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const selectedIds = useCartStore((state) => state.selectedIds);
  const toggleSelected = useCartStore((state) => state.toggleSelected);
  const selectAll = useCartStore((state) => state.selectAll);
  const clearSelection = useCartStore((state) => state.clearSelection);
  const selectedTotal = useCartStore((state) => state.selectedTotal);

  const navigate = useNavigate();

  const allSelected = cart.length > 0 && cart.every((item) => selectedIds.has(item.id));
  const someSelected = selectedIds.size > 0;

  const handleCheckout = () => {
    if (selectedIds.size === 0) return;
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen bg-[#F8FBF9] pb-20">
      <div className="bg-plant-green pt-6 sm:pt-8 pb-16 sm:pb-20 px-4 sm:px-6 md:px-12 rounded-b-[1.5rem] sm:rounded-b-[2rem] relative z-0 overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-white text-2xl sm:text-3xl md:text-4xl font-black mb-1 leading-tight">
            Keranjang Belanja
          </h1>
          <p className="text-green-50 text-xs sm:text-sm opacity-90">
            {cartCount()} item pilihanmu siap diproses checkout.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-10 -mt-8 relative z-10">
        {cart.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
            <div className="text-5xl mb-3">🛒</div>
            <h2 className="text-xl font-black text-plant-dark mb-1">
              Keranjang Anda Kosong
            </h2>
            <p className="text-gray-400 text-sm mb-5">
              Yuk, mulai belanja burung murai favoritmu!
            </p>
            <Link
              to="/"
              className="inline-block bg-plant-dark text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors"
            >
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="space-y-3 pb-36">
            {/* Select All Header */}
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={allSelected ? clearSelection : selectAll}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
                    allSelected
                      ? "bg-plant-green border-plant-green"
                      : "border-gray-300 bg-white hover:border-plant-green"
                  }`}
                >
                  {allSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-bold text-plant-dark">Pilih Semua</span>
              </label>
              {someSelected && (
                <span className="text-xs text-plant-green font-semibold">
                  {selectedIds.size} dipilih
                </span>
              )}
            </div>

            {/* Cart Items */}
            {cart.map((item) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelected(item.id)}
                  className={`bg-white rounded-2xl p-4 shadow-sm transition-all duration-300 border cursor-pointer ${
                    isSelected
                      ? "border-plant-green shadow-[0_0_0_1px_rgba(13,152,106,0.3)]"
                      : "border-gray-100 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Checkbox */}
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? "bg-plant-green border-plant-green"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    {/* Image */}
                    <div className="bg-plant-light rounded-xl w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl sm:text-2xl">🦅</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-plant-dark text-sm sm:text-base mb-1 truncate">
                        {item.name}
                      </h3>
                      {item.type && (
                        <p className="text-xs text-gray-500 mb-1">{item.type}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-plant-light text-plant-green px-2.5 py-0.5 rounded-full font-bold uppercase">
                          Qty: {item.qty}
                        </span>
                        <span className="text-gray-300">×</span>
                        <span className="text-xs text-gray-500">
                          Rp {item.price.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>

                    {/* Price + Delete */}
                    <div
                      className="flex flex-col items-end gap-2 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-sm sm:text-base font-bold text-plant-green">
                        Rp {(item.price * item.qty).toLocaleString("id-ID")}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="px-3 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 text-xs font-bold transition-colors"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 md:relative md:bottom-auto bg-white/95 backdrop-blur-md border-t border-gray-100 md:border md:rounded-2xl p-4 sm:p-5 shadow-xl md:mt-4 z-40 md:shadow-sm">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                  <div>
                    <p className="text-gray-400 text-xs mb-0.5">
                      {someSelected ? `${selectedIds.size} item dipilih` : "Belum ada yang dipilih"}
                    </p>
                    <p className={`text-lg sm:text-2xl font-black transition-colors ${someSelected ? "text-plant-green" : "text-gray-300"}`}>
                      Rp {selectedTotal().toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{cartCount()} total item</p>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={!someSelected}
                  className={`block w-full py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 text-center ${
                    someSelected
                      ? "bg-plant-dark text-white hover:bg-gray-800 shadow-md active:scale-[0.98]"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Bayar Sekarang
                  {someSelected && (
                    <span className="ml-2 text-sm font-normal opacity-70">
                      ({selectedIds.size} item)
                    </span>
                  )}
                </button>

                <Link
                  to="/"
                  className="block text-center text-gray-500 text-sm mt-3 hover:text-plant-green transition-colors font-medium"
                >
                  Lanjut Belanja
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
