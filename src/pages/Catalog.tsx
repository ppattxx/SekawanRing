import { useState, useEffect } from "react";
import { itemService } from "../services";
import type { Item } from "../types";
import { BIRD_CATEGORIES, MOCK_ITEMS, countStockByCategory } from "../data/mockData";
import CategoryCard from "../components/catalog/CategoryCard";

export default function Catalog() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const data = await itemService.getAllItems();
        setItems(data.length > 0 ? data : MOCK_ITEMS);
        setError(null);
      } catch {
        console.warn("API unavailable, using mock data");
        setItems(MOCK_ITEMS);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const stockCounts = countStockByCategory(items);

  return (
    <div className="min-h-screen bg-[#F8FBF9] pb-20">
      {/* Hero */}
      <div className="bg-plant-green pt-6 sm:pt-8 pb-16 sm:pb-20 px-4 sm:px-6 md:px-12 rounded-b-[1.5rem] sm:rounded-b-[2rem] relative z-0 overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-8 left-8 w-48 h-48 bg-white/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
          <div>
            <span className="bg-white/20 text-white backdrop-blur-md px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-2 sm:mb-3 inline-block">
              Pilih Kategori
            </span>
            <h1 className="text-white text-2xl sm:text-3xl md:text-4xl font-black mb-2 leading-tight">
              Katalog Murai Batu
            </h1>
            <p className="text-green-50 text-xs sm:text-sm opacity-90 max-w-md">
              Pilih kategori usia burung sesuai kebutuhan Anda.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-4 text-white/80">
            <div className="bg-white/10 backdrop-blur-md rounded-xl px-5 py-3 text-center">
              <p className="text-2xl font-black text-white">
                {items.reduce((sum, i) => sum + i.stock, 0)}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5 text-green-100">
                Total Stok
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl px-5 py-3 text-center">
              <p className="text-2xl font-black text-white">{items.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5 text-green-100">
                Jenis Burung
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 -mt-8 relative z-10">

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-plant-green" />
            <p className="mt-4 text-gray-500 font-medium">
              Memuat data burung...
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-20">
            <p className="text-red-500 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-plant-green text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Category Cards Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 md:gap-8">
            {BIRD_CATEGORIES.map((category) => (
              <CategoryCard
                key={category.slug}
                category={category}
                stockCount={stockCounts[category.slug] || 0}
              />
            ))}
          </div>
        )}

        {/* Info Banner */}
        {!loading && !error && (
          <div className="bg-plant-dark rounded-2xl p-6 sm:p-8 md:p-10 shadow-xl mt-8 sm:mt-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />

            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <h3 className="text-xl sm:text-2xl font-black text-white mb-3">
                Mengapa Memilih Koleksi Kami?
              </h3>
              <p className="text-gray-400 mb-6 sm:mb-8 text-xs sm:text-sm">
                Berkomitmen penuh memberikan burung kualitas terbaik untuk para
                penghobi dan petarung sejati.
              </p>

              <div className="grid grid-cols-3 gap-3 sm:gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-plant-green rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-lg transform rotate-3">
                    🏆
                  </div>
                  <h4 className="font-bold text-white mb-2">Trah Juara</h4>
                  <p className="text-sm text-gray-400 text-center">
                    Indukan pilihan dengan rekam jejak juara nasional.
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-plant-green rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-lg transform -rotate-3">
                    📜
                  </div>
                  <h4 className="font-bold text-white mb-2">Bersertifikat</h4>
                  <p className="text-sm text-gray-400 text-center">
                    Setiap burung dilengkapi ring dan sertifikat resmi BnR.
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-plant-green rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-lg transform rotate-3">
                    🚚
                  </div>
                  <h4 className="font-bold text-white mb-2">Kirim Aman</h4>
                  <p className="text-sm text-gray-400 text-center">
                    Pengiriman dengan packaging khusus burung ke seluruh
                    Indonesia.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
