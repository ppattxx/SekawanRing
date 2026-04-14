import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import type { Catalog, Item } from "../types/index";
import { catalogService, itemService, orderService } from "../services";
import { buildReservedQuantityByItemMap, getItemAvailabilityStatus } from "../utils/itemAvailability";

export default function CatalogDetail() {
  const { id } = useParams<{ id: string }>();
  const catalogId = parseInt(id || "1");

  const [currentCatalog, setCurrentCatalog] = useState<Catalog | null>(null);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
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

        // Fetch all catalogs to find current one
        const [catalogsData, ordersData] = await Promise.all([
          catalogService.getAllCatalogs(),
          ordersPromise,
        ]);
        const currentCatalogData = catalogsData.find((c) => c.id === catalogId);
        setCurrentCatalog(currentCatalogData || null);
        setCatalogs(catalogsData || []);
        setReservedQtyByItem(buildReservedQuantityByItemMap(ordersData));

        // Fetch items for this catalog
        try {
          const itemsData = await itemService.getItemsByCatalogId(catalogId);
          setItems(itemsData || []);
        } catch {
          const allItems = await itemService.getAllItems();
          const filtered = allItems.filter((item) => item.catalog_id === catalogId);
          setItems(filtered);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setCatalogs([]);
        setItems([]);
        setReservedQtyByItem({});
        setError("Gagal memuat detail katalog. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [catalogId]);

  const readyCount = items.filter(
    (item) => getItemAvailabilityStatus(item, reservedQtyByItem) === "ready",
  ).length;
  const otherCatalogs = catalogs.filter((catalog) => Number(catalog.id) !== Number(catalogId));

  return (
    <div className="min-h-screen bg-[#F8FBF9] pb-20">
      {/* Hero */}
      <div className="bg-plant-green pt-6 sm:pt-8 pb-16 sm:pb-20 px-4 sm:px-6 md:px-12 rounded-b-[1.5rem] sm:rounded-b-[2rem] relative z-0 overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-8 left-8 w-48 h-48 bg-white/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto relative z-10">
          <span className="bg-white/20 text-white backdrop-blur-md px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-2 sm:mb-3 inline-block">
            Koleksi Katalog
          </span>
          <h1 className="text-white text-2xl sm:text-3xl md:text-4xl font-black mb-2 leading-tight">
            {currentCatalog?.name || "Memuat..."}
          </h1>
          <p className="text-green-50 text-xs sm:text-sm opacity-90 max-w-lg">
            {currentCatalog?.description || "Daftar item yang tersedia pada katalog ini."}
          </p>

          {!loading && !error && (
            <div className="mt-4 bg-white/15 backdrop-blur-md rounded-xl px-4 py-3 inline-block">
              <p className="text-2xl font-black text-white leading-none">{readyCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-1 text-white/80">
                Item Tersedia
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 -mt-8 relative z-10">
        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-plant-green" />
            <p className="mt-4 text-gray-500 font-medium">Memuat data...</p>
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

        {/* Items Grid */}
        {!loading && !error && (
          <>
            {items.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
                <span className="text-5xl block mb-3 opacity-30">🪹</span>
                <h3 className="text-lg font-bold text-gray-500">Belum Ada Item</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Item pada katalog ini belum tersedia.
                </p>
                <Link
                  to="/katalog"
                  className="mt-5 inline-block bg-plant-green text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-green-700 transition-colors"
                >
                  Kembali ke Katalog
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {items.map((item) => {
                  const availabilityStatus = getItemAvailabilityStatus(item, reservedQtyByItem);

                  return (
                    <div key={item.id} className="group bg-white rounded-2xl p-3.5 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col">
                      {availabilityStatus !== "ready" && (
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
                      )}

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

                      <div className="pt-4 pb-1 px-2 flex-1 flex flex-col">
                        <Link to={`/bird/${item.id}`}>
                          <h3 className="text-plant-dark font-bold text-lg mb-1 group-hover:text-plant-green transition-colors">
                            {item.name}
                          </h3>
                        </Link>
                        <p className="text-gray-400 text-xs leading-relaxed mb-3 line-clamp-2">
                          {item.description}
                        </p>

                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {item.type && (
                            <span className="bg-plant-light text-plant-green px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                              {item.type}
                            </span>
                          )}
                        </div>

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
                  );
                })}
              </div>
            )}

            {otherCatalogs.length > 0 && (
              <div className="mt-10 sm:mt-12 border-t border-gray-200 pt-7">
                <h3 className="text-center text-2xl md:text-3xl font-light tracking-wide text-gray-700">
                  Jelajahi Katalog Lain
                </h3>
                <p className="text-center text-xs text-gray-400 mt-1 mb-5">
                  Geser untuk melihat katalog lainnya
                </p>

                <div className="overflow-x-auto -mx-4 px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex gap-3 w-max pb-1">
                    {otherCatalogs.map((catalog) => (
                      <Link
                        key={catalog.id}
                        to={`/catalog/${catalog.id}`}
                        className="group w-[68vw] max-w-[240px] h-[220px] rounded-[1.25rem] relative overflow-hidden border border-gray-200 bg-white shadow-sm"
                      >
                        <div className="w-full h-full bg-gradient-to-b from-emerald-100 to-teal-200 flex items-center justify-center text-5xl group-hover:scale-105 transition-transform duration-500">
                          🦅
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

                        <div className="absolute top-3 left-3">
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/85 text-gray-700">
                            Katalog {String(catalog.id).padStart(2, "0")}
                          </span>
                        </div>

                        <div className="absolute bottom-3 left-3 right-3 bg-white rounded-xl px-3 py-2.5 shadow">
                          <p className="text-xs font-bold text-gray-800 line-clamp-1">{catalog.name}</p>
                          <p className="text-[11px] text-gray-500 font-semibold mt-0.5 line-clamp-1">
                            {catalog.description || "Lihat koleksi pada katalog ini"}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
