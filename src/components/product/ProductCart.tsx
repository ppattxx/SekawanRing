import { useCartStore } from "../../store/useCartStore";
import type { Product } from "../../types/index";

interface ProductCartProps {
  product: Product;
}

export default function ProductCart({ product }: ProductCartProps) {
  const addToCart = useCartStore((state) => state.addToCart);

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative bg-gradient-to-br from-plant-light to-green-50 h-64 flex items-center justify-center p-6">
        <div className="absolute top-4 right-4">
          <button
            className="bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition-colors"
            aria-label="Add to wishlist"
          >
            <svg
              className="w-5 h-5 text-gray-400 hover:text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              ></path>
            </svg>
          </button>
        </div>

        <div className="text-center">
          <div className="text-6xl mb-2">🪴</div>
          <p className="text-plant-green text-sm opacity-70">{product.name}</p>
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-plant-dark font-bold text-lg mb-2 line-clamp-1">
          {product.name}
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-plant-green">
              Rp {(product.price / 1000).toFixed(0)}k
            </p>
            <p className="text-xs text-gray-500 mt-1">Stock: {product.stock}</p>
          </div>

          <button
            onClick={() => addToCart(product)}
            className="bg-plant-green text-white p-3 rounded-full hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110"
            aria-label="Add to cart"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
