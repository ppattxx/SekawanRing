import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import type { Catalog, Item } from "../types";
import { catalogService, itemService, orderService } from "../services";
import {
  BIRD_CATEGORIES,
  filterItemsByCategory,
} from "../data/birdCategories";
import { buildReservedQuantityByItemMap, getItemAvailabilityStatus } from "../utils/itemAvailability";


export default function CatalogCategoryProducts() {
  const { id, slug } = useParams<{ id: string; slug: string }>();
  const catalogId = parseInt(id || "1");
  const category = BIRD_CATEGORIES.find((c) => c.slug === slug);
  const [currentCatalog, setCurrentCatalog] = useState<Catalog | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [reservedQtyByItem, setReservedQtyByItem] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const hasToken = typeof window !== "undefined" && Boolean(localStorage.getItem("token"));
        const ordersPromise = hasToken ? orderService.getAllOrders().catch(() => []) : Promise.resolve([]);

        // Fetch catalog info + reservation state
        const [catalogs, ordersData] = await Promise.all([
          catalogService.getAllCatalogs(),
          ordersPromise,
        ]);
        setCurrentCatalog(catalogs.find((c) => c.id === catalogId) || null);
        setReservedQtyByItem(buildReservedQuantityByItemMap(ordersData));

        // Fetch items for this catalog, then filter by category
        let catalogItems: Item[] = [];
        try {
          catalogItems = await itemService.getItemsByCatalogId(catalogId);
        } catch {
          const allItems = await itemService.getAllItems();
          catalogItems = allItems.filter((i) => i.catalog_id === catalogId);
        }

        // Filter by age category
        setItems(filterItemsByCategory(catalogItems, slug || ""));
      } catch (err) {
        console.error("Error fetching catalog category products:", err);
        setItems([]);
        setReservedQtyByItem({});
        setError("Gagal memuat produk untuk kategori ini.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [catalogId, slug]);

  const availableItemsCount = items.filter(
    (item) => getItemAvailabilityStatus(item, reservedQtyByItem) === "ready",
  ).length;



  if (!category) {
    return (
      <div className="min-h-screen bg-[#F8FBF9] flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl block mb-4">🔍</span>
          <h2 className="text-2xl font-bold text-plant-dark mb-2">
            Kategori Tidak Ditemukan
          </h2>
          <Link
            to={`/catalog/${catalogId}`}
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
      <div className="bg-plant-green pt-6 sm:pt-8 pb-16 sm:pb-20 px-4 sm:px-6 md:px-12 rounded-b-[1.5rem] sm:rounded-b-[2rem] relative z-0 overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-6 left-6 w-36 h-36 bg-white/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <span className="text-3xl sm:text-4xl md:text-5xl drop-shadow-lg">
                  {category.icon}
                </span>
                <div>
                  <h1 className="text-white text-2xl sm:text-3xl md:text-4xl font-black leading-tight">
                    {category.name}
                  </h1>
                  <span className="text-white/70 text-[10px] sm:text-xs font-bold">
                    {currentCatalog?.name} &middot; Usia {category.ageRange}
                  </span>
                </div>
              </div>
              <p className="text-white/80 text-xs sm:text-sm max-w-lg">
                {category.description}
              </p>
            </div>

            <div className="bg-white/15 backdrop-blur-md rounded-xl px-5 py-3 text-center">
              <p className="text-2xl font-black text-white">{availableItemsCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5 text-white/70">
                Tersedia
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick switch category slider */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 -mt-8 relative z-20">
        <div className="sticky top-14 z-40 pb-2">
          <div className="bg-white border border-gray-100 rounded-full shadow-sm overflow-hidden">
            <div className="overflow-x-auto px-2 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex gap-2 w-max min-w-full">
              {BIRD_CATEGORIES.map((cat) => {
                const isActive = cat.slug === category.slug;
                return (
                  <Link
                    key={cat.slug}
                    to={`/catalog/${catalogId}/kategori/${cat.slug}`}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-plant-green text-white shadow"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <span className="text-base leading-none">{cat.icon}</span>
                    <span>{cat.name}</span>
                  </Link>
                );
              })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 mt-4 relative z-10">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-plant-green" />
            <p className="mt-4 text-gray-500 font-medium">
              Memuat data burung...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-red-200 shadow-sm">
            <span className="text-5xl block mb-3 opacity-50">⚠️</span>
            <h3 className="text-lg font-bold text-red-600">Terjadi Kendala</h3>
            <p className="text-red-500 text-sm mt-1">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 inline-block bg-plant-green text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-green-700 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
            <span className="text-5xl block mb-3 opacity-30">🪹</span>
            <h3 className="text-lg font-bold text-gray-500">Stok Kosong</h3>
            <p className="text-gray-400 text-sm mt-1">
              Belum ada burung tersedia untuk kategori {category.name} di{" "}
              {currentCatalog?.name}.
            </p>
            <Link
              to={`/catalog/${catalogId}`}
              className="mt-5 inline-block bg-plant-green text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-green-700 transition-colors"
            >
              Lihat Kategori Lain
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {items.map((item) => (
              <div key={item.id} className="group bg-white rounded-2xl p-3.5 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col">
                {(() => {
                  const availabilityStatus = getItemAvailabilityStatus(item, reservedQtyByItem);
                  if (availabilityStatus === "ready") return null;

                  return (
                    <div className="mb-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          availabilityStatus === "terbooking"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {availabilityStatus === "terbooking" ? "Terbooking" : "Habis"}
                      </span>
                    </div>
                  );
                })()}

                {/* Image area */}
                <Link
                  to={`/bird/${item.id}`}
                  className="bg-plant-light/60 h-40 sm:h-48 rounded-xl flex items-center justify-center relative overflow-hidden group-hover:bg-plant-light transition-colors"
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
                  </div>

                  {/* Price + Cart */}
                  <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400">Harga</p>
                      <p className="text-base sm:text-lg font-black text-plant-dark truncate">
                        Rp {item.price.toLocaleString("id-ID")}
                      </p>
                    </div>

                    <Link
                      to={`/bird/${item.id}`}
                      className="px-4 py-2 rounded-lg font-bold text-xs transition-all duration-300 bg-plant-green text-white hover:bg-green-700 text-center"
                    >
                      Check Detail
                    </Link>
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
