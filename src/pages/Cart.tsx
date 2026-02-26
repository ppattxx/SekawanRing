import { useCartStore } from '../store/useCartStore';
import { Link } from 'react-router-dom';

export default function Cart() {
  const cart = useCartStore((state) => state.cart);
  const cartCount = useCartStore((state) => state.cartCount);

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-plant-green to-green-600 pt-8 pb-16 px-6 md:px-10 rounded-b-[3rem] shadow-xl">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center text-white mb-6 hover:text-green-100 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Kembali
          </Link>
          <h1 className="text-white text-4xl font-bold mb-2">
            Your Bag 🛒
          </h1>
          <p className="text-green-100 text-sm">
            {cartCount()} item{cartCount() !== 1 ? 's' : ''} in your cart
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 md:px-10 -mt-8">
        {cart.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-lg">
            <div className="text-7xl mb-4">🛍️</div>
            <h2 className="text-2xl font-bold text-plant-dark mb-2">Keranjang Anda Kosong</h2>
            <p className="text-gray-500 mb-6">Yuk, mulai belanja tanaman favoritmu!</p>
            <Link
              to="/"
              className="inline-block bg-plant-green text-white px-8 py-3 rounded-full font-semibold hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="space-y-6 pb-32">
            {/* Cart Items */}
            {cart.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-5 shadow-md hover:shadow-xl transition-all"
              >
                <div className="flex items-center gap-5">
                  {/* Product Image */}
                  <div className="bg-gradient-to-br from-plant-light to-green-50 rounded-2xl w-24 h-24 flex items-center justify-center flex-shrink-0">
                    <span className="text-3xl">🪴</span>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-plant-dark text-lg mb-1 truncate">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">{item.type}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-plant-light text-plant-green px-3 py-1 rounded-full font-medium">
                        Qty: {item.qty}
                      </span>
                      <span className="text-gray-400">×</span>
                      <span className="text-sm text-gray-600">
                        Rp {item.price.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-plant-green">
                      Rp {(item.price * item.qty).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Summary Card - Fixed at bottom on mobile */}
            <div className="fixed bottom-0 left-0 right-0 md:relative md:bottom-auto bg-white border-t md:border-0 md:rounded-3xl p-6 shadow-2xl md:mt-6 z-40">
              <div className="max-w-4xl mx-auto">
                {/* Total */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Total Belanja</p>
                    <p className="text-3xl font-bold text-plant-green">
                      Rp {totalPrice.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{cartCount()} items</p>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  className="w-full bg-gradient-to-r from-plant-green to-green-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Checkout Sekarang
                </button>

                <Link
                  to="/"
                  className="block text-center text-gray-500 text-sm mt-4 hover:text-plant-green transition-colors"
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
