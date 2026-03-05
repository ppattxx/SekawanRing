import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import type { Catalog, Item } from "../types/index";
import { catalogService, itemService } from "../services";
import { BIRD_CATEGORIES, MOCK_ITEMS, countStockByCategory } from "../data/mockData";
import CategoryCard from "../components/catalog/CategoryCard";

export default function CatalogDetail() {
  const { id } = useParams<{ id: string }>();
  const catalogId = parseInt(id || "1");

  const [currentCatalog, setCurrentCatalog] = useState<Catalog | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all catalogs to find current one
        const catalogsData = await catalogService.getAllCatalogs();
        const currentCatalogData = catalogsData.find((c) => c.id === catalogId);
        setCurrentCatalog(currentCatalogData || null);

        // Fetch items for this catalog
        try {
          const itemsData = await itemService.getItemsByCatalogId(catalogId);
          setItems(itemsData.length > 0 ? itemsData : MOCK_ITEMS.filter((i) => i.catalog_id === catalogId));
        } catch {
          const allItems = await itemService.getAllItems();
          const filtered = allItems.filter((item) => item.catalog_id === catalogId);
          setItems(filtered.length > 0 ? filtered : MOCK_ITEMS.filter((i) => i.catalog_id === catalogId));
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setItems(MOCK_ITEMS.filter((i) => i.catalog_id === catalogId));
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [catalogId]);

  const stockCounts = countStockByCategory(items);

  return (
    <div className="min-h-screen bg-[#F8FBF9] pb-20">
      {/* Hero */}
      <div className="bg-plant-green pt-8 pb-20 px-6 md:px-12 rounded-b-[2rem] relative z-0 overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-8 left-8 w-48 h-48 bg-white/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto relative z-10">
          <span className="bg-white/20 text-white backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-3 inline-block">
            Pilih Kategori Usia
          </span>
          <h1 className="text-white text-3xl md:text-4xl font-black mb-2 leading-tight">
            {currentCatalog?.name || "Memuat..."}
          </h1>
          <p className="text-green-50 text-sm opacity-90 max-w-lg">
            {currentCatalog?.description ||
              "Pilih kategori usia untuk melihat stok burung yang tersedia."}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 -mt-8 relative z-10">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
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
