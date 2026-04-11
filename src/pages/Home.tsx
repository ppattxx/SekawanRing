import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { Catalog, Item } from "../types/index";
import { catalogService, itemService, orderService } from "../services";
import { BIRD_CATEGORIES, countStockByCategory } from "../data/birdCategories";
import CategoryCard from "../components/catalog/CategoryCard";
import { buildReservedQuantityByItemMap, getAvailableStock } from "../utils/itemAvailability";

export default function Home() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [reservedQtyByItem, setReservedQtyByItem] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const safeCatalogs = Array.isArray(catalogs) ? catalogs : [];
  const safeItems = Array.isArray(items) ? items : [];

  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        setLoading(true);
        const hasToken = typeof window !== "undefined" && Boolean(localStorage.getItem("token"));
        const ordersPromise = hasToken ? orderService.getAllOrders().catch(() => []) : Promise.resolve([]);

        const [catalogData, itemsDataRaw, ordersData] = await Promise.all([
          catalogService.getAllCatalogs(),
          itemService.getAllItems().catch(() => [] as Item[]),
          ordersPromise,
        ]);

        setCatalogs(catalogData);
        setItems(itemsDataRaw || []);
        setReservedQtyByItem(buildReservedQuantityByItemMap(ordersData));
        setError(null);
      } catch (err) {
        console.error("Failed to fetch catalogs:", err);
        setCatalogs([]);
        setItems([]);
        setReservedQtyByItem({});
        setError("Gagal memuat katalog. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogs();
  }, []);

  const availableItems = safeItems.map((item) => ({
    ...item,
    stock: getAvailableStock(item, reservedQtyByItem),
  }));
  const stockCounts = countStockByCategory(availableItems);
  return (
    <div className="min-h-screen bg-[#F8FBF9] pb-20">
      <div className="bg-plant-green pt-6 sm:pt-8 pb-16 sm:pb-20 px-4 sm:px-6 md:px-12 rounded-b-[1.5rem] sm:rounded-b-[2rem] relative z-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-8 left-8 w-48 h-48 bg-white/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
          <div>
            <span className="bg-white/20 text-white backdrop-blur-md px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-2 sm:mb-3 inline-block">
              Premium Collection
            </span>
            <h1 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-2 leading-tight">
              Katalog Sekawan Ring
            </h1>
            <p className="text-green-50 text-xs sm:text-sm opacity-90 max-w-md">
              Temukan burung Murai Batu bersertifikat dengan kualitas kontes dan
              trah juara dari seluruh Nusantara.
            </p>
          </div>

          <div className="hidden md:flex text-[7rem] opacity-15 transform -scale-x-100 rotate-12">
            🦅
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 -mt-8 relative z-10">

        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-plant-green"></div>
            <p className="mt-4 text-gray-500 font-medium">Memuat katalog...</p>
          </div>
        )}

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

        {!loading && safeCatalogs.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 font-medium">Tidak ada katalog tersedia.</p>
          </div>
        )}

        {!loading && safeCatalogs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {safeCatalogs.map((catalog) => (
              <Link
                key={catalog.id}
                to={`/catalog/${catalog.id}`}
                className="group bg-white rounded-2xl p-3.5 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col"
              >
                <div className="bg-plant-light/60 h-40 sm:h-48 rounded-xl flex items-center justify-center relative overflow-hidden group-hover:bg-plant-light transition-colors">
                  <div className="text-7xl transform group-hover:scale-110 transition-all duration-500 drop-shadow-xl">
                    🦅
                  </div>
                  <div className="absolute top-3 right-3 bg-white/70 backdrop-blur-sm px-2.5 py-1 rounded-full text-plant-green text-[10px] font-black shadow-sm">
                    KODE 0{catalog.id}
                  </div>
                </div>

                <div className="pt-4 pb-1 px-2 flex-1 flex flex-col">
                  <h3 className="text-plant-dark font-bold text-lg mb-1 group-hover:text-plant-green transition-colors">
                    {catalog.name.replace("Murai Batu ", "MB ")}
                  </h3>
                  <p className="text-gray-400 text-xs leading-relaxed mb-4 line-clamp-2">
                    {catalog.description}
                  </p>

                  <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-plant-green font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                      Lihat Koleksi
                      <svg
                        className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        ></path>
                      </svg>
                    </span>

                    <div className="w-7 h-7 rounded-full bg-plant-light flex items-center justify-center group-hover:bg-plant-green transition-colors">
                      <span className="text-plant-green group-hover:text-white text-xs transition-colors">
                        +
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Age category flow: Home -> kategori umur -> list item -> detail */}
        {!loading && (
          <div className="mt-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-plant-dark">
                  Pilih Berdasarkan Usia
                </h2>
                <p className="text-gray-500 text-xs sm:text-sm mt-1">
                  Pilih kategori umur burung untuk melihat daftar item dan detailnya.
                </p>
              </div>
              <Link
                to="/katalog"
                className="inline-flex items-center gap-1.5 text-plant-green text-xs sm:text-sm font-bold hover:underline"
              >
                Lihat semua kategori
                <span>→</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 md:gap-6">
              {BIRD_CATEGORIES.map((category) => (
                <CategoryCard
                  key={category.slug}
                  category={category}
                  stockCount={stockCounts[category.slug] || 0}
                />
              ))}
            </div>
          </div>
        )}

        <div className="bg-plant-dark rounded-2xl p-6 sm:p-8 md:p-10 shadow-xl mt-8 sm:mt-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>

          <div className="relative z-10 text-center max-w-3xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-black text-white mb-3">
              Mengapa Memilih Koleksi Kami?
            </h3>
            <p className="text-gray-400 mb-6 sm:mb-8 text-xs sm:text-sm">
              Berkomitmen penuh memberikan burung kualitas terbaik untuk para
              penghobi dan petarung sejati.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-plant-green rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mb-3 sm:mb-4 shadow-lg transform rotate-3">
                  🏆
                </div>
                <h4 className="font-bold text-white mb-1 sm:mb-2 text-xs sm:text-base">Trah Juara</h4>
                <p className="text-[10px] sm:text-sm text-gray-400 text-center">
                  Indukan pilihan dengan rekam jejak juara nasional.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-plant-light rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mb-3 sm:mb-4 shadow-lg transform -rotate-3">
                  📜
                </div>
                <h4 className="font-bold text-white mb-1 sm:mb-2 text-xs sm:text-base">
                  Bersertifikat
                </h4>
                <p className="text-[10px] sm:text-sm text-gray-400 text-center">
                  Dilengkapi sertifikat asli ring peternak terdaftar.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mb-3 sm:mb-4 shadow-lg transform rotate-3">
                  💚
                </div>
                <h4 className="font-bold text-white mb-1 sm:mb-2 text-xs sm:text-base">Garansi</h4>
                <p className="text-[10px] sm:text-sm text-gray-400 text-center">
                  Jaminan burung rawatan sehat tanpa cacat fisik.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-plant-green/20 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mb-3 sm:mb-4 shadow-lg transform -rotate-3">
                  🚚
                </div>
                <h4 className="font-bold text-white mb-1 sm:mb-2 text-xs sm:text-base">Free Ongkir</h4>
                <p className="text-[10px] sm:text-sm text-gray-400 text-center">
                  Gratis ongkos kirim ke seluruh Indonesia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
