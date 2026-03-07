import { useCartStore } from "../store/useCartStore";
import { Link } from "react-router-dom";

export default function Cart() {
  const cart = useCartStore((state) => state.cart);
  const cartCount = useCartStore((state) => state.cartCount);

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

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
          <div className="space-y-6 pb-32">
            {cart.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
              >
                <div className="flex items-center gap-3 sm:gap-5">
                  <div className="bg-plant-light rounded-xl w-14 h-14 sm:w-20 sm:h-20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl sm:text-2xl">🦅</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-plant-dark text-sm sm:text-lg mb-1 truncate">
                      {item.name}
                    </h3>
                    {item.type && <p className="text-sm text-gray-500 mb-2">{item.type}</p>}
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-plant-light text-plant-green px-3 py-1 rounded-full font-bold tracking-wide uppercase">
                        Qty: {item.qty}
                      </span>
                      <span className="text-gray-400">×</span>
                      <span className="text-sm text-gray-600">
                        Rp {item.price.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-sm sm:text-xl font-bold text-plant-green">
                      Rp {(item.price * item.qty).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <div className="fixed bottom-0 left-0 right-0 md:relative md:bottom-auto bg-white/95 backdrop-blur-md border-t border-gray-100 md:border md:rounded-2xl p-5 shadow-xl md:mt-4 z-40 md:shadow-sm">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-200">
                  <div>
                    <p className="text-gray-500 text-xs sm:text-sm mb-1">Total Belanja</p>
                    <p className="text-xl sm:text-3xl font-bold text-plant-green">
                      Rp {totalPrice.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{cartCount()} items</p>
                  </div>
                </div>

                <Link
                  to="/checkout"
                  className="block w-full bg-plant-dark text-white py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg hover:bg-gray-800 transition-colors text-center"
                >
                  Checkout Sekarang
                </Link>

                <Link
                  to="/"
                  className="block text-center text-gray-500 text-sm mt-4 hover:text-plant-green transition-colors font-medium"
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
