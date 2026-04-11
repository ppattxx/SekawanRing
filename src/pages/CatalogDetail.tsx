import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import type { Catalog, Item } from "../types/index";
import { catalogService, itemService, orderService } from "../services";
import { BIRD_CATEGORIES, countStockByCategory } from "../data/birdCategories";
import CategoryCard from "../components/catalog/CategoryCard";
import { buildReservedQuantityByItemMap, getAvailableStock } from "../utils/itemAvailability";

export default function CatalogDetail() {
  const { id } = useParams<{ id: string }>();
  const catalogId = parseInt(id || "1");

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

        // Fetch all catalogs to find current one
        const [catalogsData, ordersData] = await Promise.all([
          catalogService.getAllCatalogs(),
          ordersPromise,
        ]);
        const currentCatalogData = catalogsData.find((c) => c.id === catalogId);
        setCurrentCatalog(currentCatalogData || null);
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
        setItems([]);
        setReservedQtyByItem({});
        setError("Gagal memuat detail katalog. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [catalogId]);

  const availableItems = items.map((item) => ({
    ...item,
    stock: getAvailableStock(item, reservedQtyByItem),
  }));
  const stockCounts = countStockByCategory(availableItems);

  return (
    <div className="min-h-screen bg-[#F8FBF9] pb-20">
      {/* Hero */}
      <div className="bg-plant-green pt-6 sm:pt-8 pb-16 sm:pb-20 px-4 sm:px-6 md:px-12 rounded-b-[1.5rem] sm:rounded-b-[2rem] relative z-0 overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-8 left-8 w-48 h-48 bg-white/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto relative z-10">
          <span className="bg-white/20 text-white backdrop-blur-md px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-2 sm:mb-3 inline-block">
            Pilih Kategori Usia
          </span>
          <h1 className="text-white text-2xl sm:text-3xl md:text-4xl font-black mb-2 leading-tight">
            {currentCatalog?.name || "Memuat..."}
          </h1>
          <p className="text-green-50 text-xs sm:text-sm opacity-90 max-w-lg">
            {currentCatalog?.description ||
              "Pilih kategori usia untuk melihat stok burung yang tersedia."}
          </p>
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

        {/* Category Cards — always show all 4 categories */}
        {!loading && !error && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 md:gap-8">
            {BIRD_CATEGORIES.map((category) => (
              <CategoryCard
                key={category.slug}
                category={category}
                stockCount={stockCounts[category.slug] || 0}
                linkTo={`/catalog/${catalogId}/kategori/${category.slug}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
