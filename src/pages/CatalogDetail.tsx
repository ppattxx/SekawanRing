import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import type { Catalog, Item } from "../types/index";
import { catalogService, itemService } from "../services";

export default function CatalogDetail() {
  const { id } = useParams<{ id: string }>();
  const catalogId = parseInt(id || "1");

  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [currentCatalog, setCurrentCatalog] = useState<Catalog | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all catalogs for sidebar
        const catalogsData = await catalogService.getAllCatalogs();
        setCatalogs(catalogsData);

        // Fetch current catalog
        const currentCatalogData = catalogsData.find((c) => c.id === catalogId);
        setCurrentCatalog(currentCatalogData || null);

        // Fetch items - try catalog-specific endpoint first, fallback to all items
        try {
          const itemsData = await itemService.getItemsByCatalogId(catalogId);
          setItems(itemsData);
        } catch (itemError: any) {
          // If catalog-specific endpoint doesn't exist (404), fetch all items and filter
          console.log("Catalog-specific endpoint not available, fetching all items...");
          const allItems = await itemService.getAllItems();
          const filteredItems = allItems.filter(item => item.catalog_id === catalogId);
          setItems(filteredItems);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Gagal memuat data. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [catalogId]);

  return (
    <div className="flex min-h-screen bg-plant-light">
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-24 lg:w-64 bg-white shadow-xl z-40">
        <div className="p-6">
          <Link
            to="/"
            className="text-2xl font-bold text-plant-green mb-10 block"
          >
            <span className="hidden lg:inline">Sekawan Ring</span>
            <span className="lg:hidden">MS</span>
          </Link>
          <nav className="space-y-4">
            {catalogs.map((catalog) => (
              <Link
                key={catalog.id}
                to={`/catalog/${catalog.id}`}
                className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${catalog.id === catalogId ? "bg-plant-green text-white shadow-lg" : "text-gray-500 hover:bg-plant-light"}`}
              >
                <span className="text-xl">🦅</span>
                <span className="hidden lg:block font-medium">
                  {catalog.name.replace("Murai Batu ", "")}
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex-1 md:ml-24 lg:ml-64 p-6 lg:p-12">
        {loading ? (
          <div className="text-center py-32">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-plant-green"></div>
            <p className="mt-4 text-gray-500 font-medium">Memuat data...</p>
          </div>
        ) : error ? (
          <div className="text-center py-32">
            <p className="text-red-500 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-plant-green text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <>
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <Link
                  to="/"
                  className="text-plant-green text-sm font-bold flex items-center gap-2 mb-4 hover:underline"
                >
                  ← Kembali ke Beranda
                </Link>
                <h1 className="text-4xl font-black text-plant-dark">
                  {currentCatalog?.name}
                </h1>
                <p className="text-gray-500 font-medium mt-2 max-w-lg">
                  {currentCatalog?.description}
                </p>
              </div>
              <div className="bg-white px-4 py-2 rounded-xl text-plant-green font-bold shadow-sm border border-gray-100">
                {items.length} Burung Tersedia
              </div>
            </div>

            {items.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map((item) => (
              <Link
                key={item.id}
                to={`/bird/${item.id}`}
                className="group bg-white rounded-[2rem] p-4 shadow-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-50 flex flex-col relative"
              >
                <div className="bg-plant-light h-56 rounded-[1.5rem] flex items-center justify-center relative overflow-hidden group-hover:bg-green-100/50 transition-colors">
                  <div className="text-7xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 drop-shadow-lg">
                    🦅
                  </div>
                  {item.certificate && (
                    <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-plant-green text-xs font-black shadow-sm uppercase tracking-wider">
                      {item.certificate}
                    </div>
                  )}
                </div>

                <div className="pt-6 pb-2 px-3 flex-1 flex flex-col">
                  <h3 className="text-plant-dark font-black text-xl mb-1 group-hover:text-plant-green transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-gray-500 text-xs md:text-sm leading-relaxed mb-6 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-plant-green font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                      LIHAT DETAIL
                      <svg
                        className="w-4 h-4 transform group-hover:translate-x-2 transition-transform duration-300"
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
                    <span className="font-black text-plant-dark bg-gray-50 px-3 py-1.5 rounded-lg text-sm group-hover:bg-plant-green group-hover:text-white transition-colors">
                      Rp {(item.price / 1000000).toFixed(1)} Jt
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-gray-200">
            <div className="text-6xl mb-4 opacity-30">🪹</div>
            <h3 className="text-xl font-bold text-gray-500">Stok Kosong</h3>
            <p className="text-gray-400 mt-2">
              Belum ada burung yang tersedia untuk jenis ini.
            </p>
          </div>
        )}
          </>
        )}
      </main>
    </div>
  );
}
