import { useCartStore } from '../../store/useCartStore';
import type { Item } from '../../types/index';

interface ProductCardProps {
  item: Item;
}

export default function BirdProductCard({ item }: ProductCardProps) {
  const addToCart = useCartStore((state) => state.addToCart);

  const handleAddToCart = () => {
    addToCart({
      id: item.id,
      catalog_id: item.catalog_id,
      name: item.name,
      price: item.price,
      stock: item.stock,
      description: item.description,
    });
  };

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Bird Image */}
      <div className="relative bg-gradient-to-br from-amber-50 to-orange-100 h-56 flex items-center justify-center p-6">
        {/* Certificate badge if available */}
        {item.certificate && (
          <div className="absolute top-4 right-4">
            <span className="bg-white text-amber-600 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-md">
              📜 Certified
            </span>
          </div>
        )}
        
        {/* Bird illustration */}
        <div className="text-center">
          <div className="text-7xl mb-2">🦅</div>
          <p className="text-amber-700 text-xs opacity-70">{item.name}</p>
        </div>

        {/* Age badge */}
        {item.age_months && (
          <div className="absolute bottom-4 left-4">
            <span className="bg-white/90 backdrop-blur text-slate-700 px-3 py-1 rounded-full text-xs font-semibold">
              {item.age_months} bulan
            </span>
          </div>
        )}
      </div>
      
      {/* Product Info - DENGAN HARGA */}
      <div className="p-5">
        <h3 className="text-slate-800 font-bold text-lg mb-2 line-clamp-1">
          {item.name}
        </h3>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {item.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-slate-800">
              Rp {(item.price / 1000).toFixed(0)}jt
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Stock: {item.stock}
            </p>
          </div>
          
          {/* Add to Cart Button */}
          <button 
            onClick={handleAddToCart}
            disabled={item.stock === 0}
            className={`p-3 rounded-full transition-all duration-300 shadow-lg transform hover:scale-110 ${
              item.stock > 0
                ? 'bg-slate-800 text-white hover:bg-slate-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            aria-label="Add to cart"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
