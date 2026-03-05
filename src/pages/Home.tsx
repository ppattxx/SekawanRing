import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { Catalog } from "../types/index";
import { catalogService } from "../services";

export default function Home() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        setLoading(true);
        const data = await catalogService.getAllCatalogs();
        setCatalogs(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch catalogs:", err);
        setError("Gagal memuat katalog. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogs();
  }, []);
  return (
    <div className="min-h-screen bg-[#F8FBF9] pb-20">
      <div className="bg-plant-green pt-8 pb-20 px-6 md:px-12 rounded-b-[2rem] relative z-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-8 left-8 w-48 h-48 bg-white/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
          <div>
            <span className="bg-white/20 text-white backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-3 inline-block">
              Premium Collection
            </span>
            <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-black mb-2 leading-tight">
              Katalog Sekawan Ring
            </h1>
            <p className="text-green-50 text-sm opacity-90 max-w-md">
              Temukan burung Murai Batu bersertifikat dengan kualitas kontes dan
              trah juara dari seluruh Nusantara.
            </p>
          </div>

          <div className="hidden md:flex text-[7rem] opacity-15 transform -scale-x-100 rotate-12">
            🦅
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 -mt-8 relative z-10">

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

        {!loading && !error && catalogs.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 font-medium">Tidak ada katalog tersedia.</p>
          </div>
        )}

        {!loading && !error && catalogs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalogs.map((catalog) => (
            <Link
              key={catalog.id}
              to={`/catalog/${catalog.id}`}
              className="group bg-white rounded-2xl p-3.5 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col"
            >
              <div className="bg-plant-light/60 h-48 rounded-xl flex items-center justify-center relative overflow-hidden group-hover:bg-plant-light transition-colors">
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

        <div className="bg-plant-dark rounded-2xl p-8 md:p-10 shadow-xl mt-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>

          <div className="relative z-10 text-center max-w-3xl mx-auto">
            <h3 className="text-2xl font-black text-white mb-3">
              Mengapa Memilih Koleksi Kami?
            </h3>
            <p className="text-gray-400 mb-8 text-sm">
              Berkomitmen penuh memberikan burung kualitas terbaik untuk para
              penghobi dan petarung sejati.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <div className="w-16 h-16 bg-plant-light rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-lg transform -rotate-3">
                  📜
                </div>
                <h4 className="font-bold text-white mb-2">
                  Bersertifikat Resmi
                </h4>
                <p className="text-sm text-gray-400 text-center">
                  Dilengkapi sertifikat asli ring peternak terdaftar.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-lg transform rotate-3">
                  💚
                </div>
                <h4 className="font-bold text-white mb-2">Garansi Kesehatan</h4>
                <p className="text-sm text-gray-400 text-center">
                  Jaminan burung rawatan sehat tanpa cacat fisik.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
