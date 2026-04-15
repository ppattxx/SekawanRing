import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import type { Catalog, Item } from "../types/index";
import { catalogService, itemService, orderService } from "../services";
import { buildReservedQuantityByItemMap, getItemAvailabilityStatus } from "../utils/itemAvailability";

const resolveMediaUrl = (value?: string | null): string => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const apiBase = import.meta.env.VITE_API_BASE_URL || "https://sekawan-bf.com/api";
  const apiOrigin = apiBase.replace(/\/api\/?$/, "");
  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${apiOrigin}${normalizedPath}`;
};

const getItemImageUrl = (item: Item): string => {
  const rawItem = item as any;
  const mediaImage = Array.isArray(rawItem.media)
    ? rawItem.media.find((media: any) => {
        const mediaType = String(media?.type || "").toLowerCase();
        if (mediaType === "video") return false;
        const mediaPath = String(media?.url || media?.path || "");
        return !/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(mediaPath);
      })
    : null;

  return resolveMediaUrl(
    rawItem.image_url || rawItem.image_path || mediaImage?.url || mediaImage?.path,
  );
};

const getRingCode = (item: Item): string => {
  if (item.certificate && item.certificate.trim()) return item.certificate.trim();
  return `SR-${String(item.id).padStart(4, "0")}`;
};

const getGenderLabel = (item: Item): string => {
  const genderRaw = String(item.jenis_kelamin || item.gender || "").trim();
  if (!genderRaw) return "-";
  const lower = genderRaw.toLowerCase();
  if (lower === "jantan") return "Jantan";
  if (lower === "betina") return "Betina";
  return genderRaw.charAt(0).toUpperCase() + genderRaw.slice(1);
};

const formatRupiahNoDecimal = (value: number | string): string => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "0";

  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericValue);
};

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
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {items.map((item) => {
                  const availabilityStatus = getItemAvailabilityStatus(item, reservedQtyByItem);
                  const imageUrl = getItemImageUrl(item);
                  const ringCode = getRingCode(item);
                  const genderLabel = getGenderLabel(item);
                  const ageLabel = item.age_months ? `${item.age_months} Bulan` : "-";

                  return (
                    <div key={item.id} className="group bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col">
                      <Link
                        to={`/bird/${item.id}`}
                        className="bg-plant-light/60 h-24 sm:h-48 rounded-lg sm:rounded-xl flex items-center justify-center relative overflow-hidden group-hover:bg-plant-light transition-colors"
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-4xl sm:text-6xl transform group-hover:scale-110 transition-all duration-500 drop-shadow-lg">
                            🦅
                          </span>
                        )}

                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/90 backdrop-blur-sm px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-plant-green text-[9px] sm:text-[10px] font-black shadow-sm uppercase tracking-wider">
                          Ring {ringCode}
                        </div>

                        {item.type && (
                          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-white/90 backdrop-blur-sm px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-gray-700 text-[9px] sm:text-[10px] font-bold shadow-sm uppercase tracking-wider max-w-[65%] truncate">
                            {item.type}
                          </div>
                        )}

                        <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 bg-white/90 backdrop-blur-sm px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-gray-700 text-[9px] sm:text-[10px] font-bold shadow-sm">
                          {ageLabel}
                        </div>
                      </Link>

                      <div className="pt-2.5 sm:pt-4 pb-1 px-1 sm:px-2 flex-1 flex flex-col">
                        <Link to={`/bird/${item.id}`}>
                          <h3 className="text-plant-dark font-bold text-sm sm:text-lg mb-1 group-hover:text-plant-green transition-colors line-clamp-1">
                            {item.name}
                          </h3>
                        </Link>
                        <p className="text-gray-400 text-[10px] sm:text-xs leading-relaxed mb-2 sm:mb-3 line-clamp-1 sm:line-clamp-2">
                          {item.description}
                        </p>

                        <div className="flex justify-end mb-2 sm:mb-3 min-h-[20px]">
                          {availabilityStatus !== "ready" && (
                            <span
                              className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider ${
                                availabilityStatus === "terbooking"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              {availabilityStatus === "terbooking" ? "Terbooking" : "TERJUAL"}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-2.5 sm:mb-3 text-[9px] sm:text-[11px]">
                          <div className="rounded-md sm:rounded-lg bg-gray-50 px-1.5 sm:px-2 py-1 sm:py-1.5">
                            <p className="text-gray-400 font-semibold">Umur</p>
                            <p className="font-bold text-gray-700">{ageLabel}</p>
                          </div>
                          <div className="rounded-md sm:rounded-lg bg-gray-50 px-1.5 sm:px-2 py-1 sm:py-1.5">
                            <p className="text-gray-400 font-semibold">Kelamin</p>
                            <p className="font-bold text-gray-700">{genderLabel}</p>
                          </div>
                        </div>

                        <div className="mt-auto pt-2 sm:pt-3 border-t border-gray-50 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                          <div className="w-full sm:min-w-0">
                            <p className="text-[9px] sm:text-[10px] text-gray-400">Harga</p>
                            <p className="text-[11px] sm:text-lg font-black text-plant-dark leading-tight break-words">
                              Rp {formatRupiahNoDecimal(item.price)}
                            </p>
                          </div>

                          <Link
                            to={`/bird/${item.id}`}
                            className="w-full sm:w-auto px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg font-bold text-[10px] sm:text-xs transition-all duration-300 bg-plant-green text-white hover:bg-green-700 text-center whitespace-nowrap"
                          >
                            Lihat Detail
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
