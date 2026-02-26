import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import type { Product } from '../types/index';

const PRODUCT_DETAILS: Record<number, any> = {
  7: {
    id: 7,
    catalog_id: 1,
    name: 'Watermelon Peperomia',
    type: 'Indoor',
    price: 350000,
    stock: 12,
    description: 'No green thumb required to keep our artificial watermelon peperomia plant looking lively and lush anywhere you place it.',
    badge: 'Air Purifier',
    rating: 4.8,
    size: '5" h',
    potOptions: [
      { name: 'Grant', color: '#6B8E7F', material: 'Ceramic' },
      { name: 'Terracotta', color: '#D2836B', material: 'Clay' },
      { name: 'Cream', color: '#F5E6D3', material: 'Ceramic' },
      { name: 'Ocean', color: '#4A7C7E', material: 'Ceramic' },
      { name: 'Rose', color: '#C97C7C', material: 'Ceramic' },
      { name: 'Navy', color: '#2C3E50', material: 'Ceramic' },
    ],
    overview: {
      water: '250ml',
      light: '35-40%',
      fertilizer: '250gm',
    },
    gallery: ['🌿', '🪴', '🌱'],
  },
};

// Fallback untuk produk lain
const DEFAULT_PRODUCT = {
  badge: '',
  rating: 4.5,
  size: '5" h',
  potOptions: [
    { name: 'Grant', color: '#6B8E7F', material: 'Ceramic' },
    { name: 'Terracotta', color: '#D2836B', material: 'Clay' },
  ],
  overview: {
    water: '200ml',
    light: '30-50%',
    fertilizer: '200gm',
  },
  gallery: ['🌿', '🪴', '🌱'],
};

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const productId = parseInt(id || '7');
  const addToCart = useCartStore((state) => state.addToCart);
  
  const [selectedPot, setSelectedPot] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  const productDetail = PRODUCT_DETAILS[productId] || {
    ...DEFAULT_PRODUCT,
    id: productId,
    catalog_id: 1,
    name: 'Plant Name',
    type: 'Indoor',
    price: 100000,
    stock: 10,
    description: 'Beautiful plant for your space',
  };

  const totalPrice = productDetail.price * quantity;
  const priceInDollars = Math.floor(productDetail.price / 15000); // Rough conversion

  const handleAddToCart = () => {
    addToCart({
      id: productDetail.id,
      catalog_id: productDetail.catalog_id,
      name: productDetail.name,
      type: productDetail.type,
      price: productDetail.price,
      stock: productDetail.stock,
      description: productDetail.description,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-plant-light pt-6 pb-32 px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-6">
            <Link to={`/category/indoor`} className="p-2 hover:bg-white rounded-full transition-colors">
              <svg className="w-6 h-6 text-plant-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </Link>
            <button className="p-2 hover:bg-white rounded-full transition-colors">
              <svg className="w-6 h-6 text-plant-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>

          {/* Product Title & Badge */}
          <div className="mb-4">
            {productDetail.badge && (
              <div className="inline-flex items-center gap-2 text-xs font-medium text-plant-green bg-white px-3 py-1.5 rounded-full mb-3">
                <span>🌿</span>
                <span>{productDetail.badge}</span>
              </div>
            )}
            <h1 className="text-4xl md:text-5xl font-bold text-plant-dark mb-2">
              {productDetail.name}
            </h1>
          </div>

          {/* Rating */}
          {productDetail.rating && (
            <div className="inline-flex items-center gap-1 bg-white px-3 py-1.5 rounded-full shadow-sm">
              <span className="text-plant-green">⭐</span>
              <span className="font-semibold text-plant-dark">{productDetail.rating}</span>
            </div>
          )}
        </div>

        {/* Decorative curved shape */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3"></div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-24 relative z-20">
        {/* Product Image */}
        <div className="bg-white rounded-3xl p-8 shadow-xl mb-6 relative">
          <div className="flex items-center justify-center h-64">
            <div className="text-9xl">🪴</div>
          </div>

          {/* Action Buttons */}
          <div className="absolute bottom-6 left-6 flex gap-3">
            <button 
              onClick={handleAddToCart}
              className="bg-plant-green text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-all transform hover:scale-110"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
              </svg>
            </button>
            <button 
              onClick={() => setIsFavorite(!isFavorite)}
              className="bg-white text-plant-dark p-4 rounded-full shadow-lg hover:bg-gray-50 transition-all"
            >
              <svg className="w-6 h-6" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
            </button>
          </div>

          {/* Pot Color Selector - Positioned on right side with curve */}
          <div className="absolute top-1/2 right-0 transform translate-x-12 -translate-y-1/2">
            <div className="bg-white rounded-full p-3 shadow-xl">
              <div className="flex flex-col gap-3">
                {productDetail.potOptions.map((pot: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedPot(index)}
                    className={`w-10 h-10 rounded-full transition-all transform hover:scale-110 ${
                      selectedPot === index ? 'ring-4 ring-plant-green ring-offset-2' : 'hover:ring-2 hover:ring-gray-300'
                    }`}
                    style={{ backgroundColor: pot.color }}
                    title={pot.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Price & Size */}
        <div className="bg-white rounded-3xl p-6 shadow-md mb-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-gray-500 text-sm uppercase mb-1">Price</p>
              <p className="text-3xl font-bold text-plant-dark">${priceInDollars}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm uppercase mb-1">Size</p>
              <p className="text-2xl font-bold text-plant-dark">{productDetail.size}</p>
            </div>
          </div>

          {/* Pot Material Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-lg" 
                style={{ backgroundColor: productDetail.potOptions[selectedPot].color }}
              ></div>
              <div>
                <h4 className="font-bold text-plant-dark">{productDetail.potOptions[selectedPot].name}</h4>
                <p className="text-sm text-gray-600">Earthenware bowl</p>
                <div className="flex gap-4 mt-1 text-xs text-gray-500">
                  <span>SIZE: 4"</span>
                  <span>DRAINAGE: NO HOLE</span>
                  <span>MATERIAL: {productDetail.potOptions[selectedPot].material.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overview */}
        <div className="bg-white rounded-3xl p-6 shadow-md mb-6">
          <h3 className="font-bold text-xl text-plant-dark mb-6">Overview</h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">💧</div>
              <p className="font-bold text-plant-dark">{productDetail.overview.water}</p>
              <p className="text-xs text-gray-500 uppercase">Water</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">☀️</div>
              <p className="font-bold text-plant-dark">{productDetail.overview.light}</p>
              <p className="text-xs text-gray-500 uppercase">Light</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🌾</div>
              <p className="font-bold text-plant-dark">{productDetail.overview.fertilizer}</p>
              <p className="text-xs text-gray-500 uppercase">Fertilizer</p>
            </div>
          </div>
        </div>

        {/* Plant Bio */}
        <div className="bg-white rounded-3xl p-6 shadow-md mb-6">
          <h3 className="font-bold text-xl text-plant-dark mb-4">Plant Bio</h3>
          <p className="text-gray-700 leading-relaxed">
            {productDetail.description}
          </p>
        </div>

        {/* Gallery */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {productDetail.gallery.map((emoji: string, index: number) => (
            <div
              key={index}
              className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl h-32 flex items-center justify-center text-5xl shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            >
              {emoji}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Cart Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-plant-green text-white p-4 shadow-2xl z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
              </svg>
            </div>
            <div>
              <p className="text-sm opacity-90">View {quantity} items</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-2xl font-bold">${Math.floor(totalPrice / 15000)}</p>
            </div>
            <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded transition-colors"
              >
                <span className="text-xl">−</span>
              </button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded transition-colors"
              >
                <span className="text-xl">+</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
