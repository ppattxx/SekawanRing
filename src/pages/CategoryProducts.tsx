import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import type { Item } from "../types";
import { itemService } from "../services";
import {
  BIRD_CATEGORIES,
  MOCK_ITEMS,
  filterItemsByCategory,
} from "../data/mockData";
import { useCartStore } from "../store/useCartStore";

export default function CategoryProducts() {
  const { slug } = useParams<{ slug: string }>();
  const category = BIRD_CATEGORIES.find((c) => c.slug === slug);
  const addToCart = useCartStore((s) => s.addToCart);

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const data = await itemService.getAllItems();
        const source = data.length > 0 ? data : MOCK_ITEMS;
        setItems(filterItemsByCategory(source, slug || ""));
      } catch {
        setItems(filterItemsByCategory(MOCK_ITEMS, slug || ""));
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [slug]);

  const handleAddToCart = (item: Item) => {
    addToCart(item);
    setAddedIds((prev) => new Set(prev).add(item.id));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 1500);
  };

  if (!category) {
    return (
      <div className="min-h-screen bg-[#F8FBF9] flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl block mb-4">🔍</span>
          <h2 className="text-2xl font-bold text-plant-dark mb-2">
            Kategori Tidak Ditemukan
          </h2>
          <Link
            to="/katalog"
            className="mt-4 inline-block bg-plant-green text-white px-6 py-3 rounded-xl font-bold"
          >
            Kembali ke Katalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FBF9] pb-20">
      {/* Hero */}
      <div className="bg-plant-green pt-8 pb-20 px-6 md:px-12 rounded-b-[2rem] relative z-0 overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-6 left-6 w-36 h-36 bg-white/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl md:text-5xl drop-shadow-lg">
                  {category.icon}
                </span>
                <div>
                  <h1 className="text-white text-3xl md:text-4xl font-black leading-tight">
                    {category.name}
                  </h1>
                  <span className="text-white/70 text-xs font-bold">
                    Usia {category.ageRange}
                  </span>
                </div>
              </div>
              <p className="text-white/80 text-sm max-w-lg">
                {category.description}
              </p>
            </div>

            <div className="bg-white/15 backdrop-blur-md rounded-xl px-5 py-3 text-center">
              <p className="text-2xl font-black text-white">{items.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5 text-white/70">
                Tersedia
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 -mt-8 relative z-10">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-plant-green" />
            <p className="mt-4 text-gray-500 font-medium">
              Memuat data burung...
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
            <span className="text-5xl block mb-3 opacity-30">🪹</span>
            <h3 className="text-lg font-bold text-gray-500">Stok Kosong</h3>
            <p className="text-gray-400 text-sm mt-1">
              Belum ada burung tersedia untuk kategori {category.name}.
            </p>
            <Link
              to="/katalog"
              className="mt-5 inline-block bg-plant-green text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-green-700 transition-colors"
            >
              Lihat Kategori Lain
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="group bg-white rounded-2xl p-3.5 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col"
              >
                {/* Image area */}
                <Link
                  to={`/bird/${item.id}`}
                  className="bg-plant-light/60 h-48 rounded-xl flex items-center justify-center relative overflow-hidden group-hover:bg-plant-light transition-colors"
                >
                  <span className="text-6xl transform group-hover:scale-110 transition-all duration-500 drop-shadow-lg">
                    🦅
                  </span>

                  {item.certificate && (
                    <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full text-plant-green text-[10px] font-black shadow-sm uppercase tracking-wider">
                      {item.certificate}
                    </div>
                  )}

                  {item.age_months && (
                    <div className="absolute bottom-3 left-3 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full text-gray-600 text-[10px] font-bold shadow-sm">
                      {item.age_months} Bulan
                    </div>
                  )}
                </Link>

                {/* Content */}
                <div className="pt-4 pb-1 px-2 flex-1 flex flex-col">
                  <Link to={`/bird/${item.id}`}>
                    <h3 className="text-plant-dark font-bold text-lg mb-1 group-hover:text-plant-green transition-colors">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="text-gray-400 text-xs leading-relaxed mb-3 line-clamp-2">
                    {item.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {item.type && (
                      <span className="bg-plant-light text-plant-green px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        {item.type}
                      </span>
                    )}
                    <span className="bg-gray-50 text-gray-500 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                      Stok: {item.stock}
                    </span>
                  </div>

                  {/* Price + Cart */}
                  <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400">Harga</p>
                      <p className="text-lg font-black text-plant-dark">
                        Rp {item.price.toLocaleString("id-ID")}
                      </p>
                    </div>

                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={item.stock === 0}
                      className={`px-4 py-2 rounded-lg font-bold text-xs transition-all duration-300 ${
                        addedIds.has(item.id)
                          ? "bg-green-500 text-white scale-95"
                          : item.stock > 0
                          ? "bg-plant-green text-white hover:bg-green-700"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {addedIds.has(item.id) ? "✓ Ditambahkan" : "+ Keranjang"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
