import { useCartStore } from "../store/useCartStore";
import { Link } from "react-router-dom";

export default function Cart() {
  const cart = useCartStore((state) => state.cart);
  const cartCount = useCartStore((state) => state.cartCount);

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="min-h-screen bg-[#F8FBF9] pb-20">
      <div className="bg-plant-green pt-12 pb-24 px-6 md:px-12 rounded-b-[3rem] shadow-sm relative z-0">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center text-white/90 mb-6 hover:text-white transition-colors font-semibold"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              ></path>
            </svg>
            Kembali
          </Link>
          <h1 className="text-white text-4xl md:text-5xl font-black mb-2 leading-tight">
            Keranjang <br className="hidden md:block" /> Belanja
          </h1>
          <p className="text-green-50 text-sm md:text-base opacity-90">
            {cartCount()} item pilihanmu siap diproses checkout.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-10 -mt-10 relative z-10">
        {cart.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-12 text-center shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-100">
            <div className="text-7xl mb-4">🛍️</div>
            <h2 className="text-2xl font-black text-plant-dark mb-2">
              Keranjang Anda Kosong
            </h2>
            <p className="text-gray-500 mb-6">
              Yuk, mulai belanja burung murai favoritmu!
            </p>
            <Link
              to="/"
              className="inline-block bg-plant-dark text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
            >
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="space-y-6 pb-32">
            {cart.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-[2rem] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-2xl transition-all duration-300 border border-gray-50"
              >
                <div className="flex items-center gap-5">
                  <div className="bg-plant-light rounded-[1.2rem] w-24 h-24 flex items-center justify-center flex-shrink-0">
                    <span className="text-3xl">🦅</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-plant-dark text-lg mb-1 truncate">
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
                    <p className="text-xl font-bold text-plant-green">
                      Rp {(item.price * item.qty).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <div className="fixed bottom-0 left-0 right-0 md:relative md:bottom-auto bg-white/95 backdrop-blur-md border-t border-gray-100 md:border md:rounded-[2rem] p-6 shadow-2xl md:mt-6 z-40 md:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Total Belanja</p>
                    <p className="text-3xl font-bold text-plant-green">
                      Rp {totalPrice.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{cartCount()} items</p>
                  </div>
                </div>

                <button className="w-full bg-plant-dark text-white py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-colors">
                  Checkout Sekarang
                </button>

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
