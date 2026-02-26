import { Link } from "react-router-dom";
import type { Catalog } from "../types/index";

const BIRD_CATALOGS: Catalog[] = [
  {
    id: 1,
    name: "Murai Batu Medan",
    description:
      "Dikenal dengan suara kicauannya yang keras dan variatif. Ekor panjang dan postur tegap.",
  },
  {
    id: 2,
    name: "Murai Batu Nias",
    description:
      "Memiliki ekor yang lebih pendek namun gaya fighting yang agresif dan mental juara.",
  },
  {
    id: 3,
    name: "Murai Batu Lampung",
    description:
      "Ciri khas ekor hitam pekat dan suara yang kristal. Cocok untuk pemula.",
  },
  {
    id: 4,
    name: "Murai Batu Aceh",
    description:
      "Burung dengan stamina luar biasa dan mental fighter yang tangguh.",
  },
  {
    id: 5,
    name: "Murai Batu Borneo",
    description:
      "Memiliki variasi warna yang cantik dengan suara merdu dan panjang.",
  },
  {
    id: 6,
    name: "Murai Batu Lahat",
    description:
      "Terkenal dengan gaya bertarungnya yang atraktif dan suara yang lantang.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8FBF9] pb-20">
      <div className="bg-plant-green pt-12 pb-28 px-6 md:px-12 rounded-b-[3rem] shadow-sm relative z-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <span className="bg-white/20 text-white backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-4 inline-block">
              Premium Collection
            </span>
            <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-black mb-3 leading-tight">
              Katalog <br className="hidden md:block" />
              Sekawan Ring
            </h1>
            <p className="text-green-50 text-sm md:text-base opacity-90 max-w-md">
              Temukan burung Murai Batu bersertifikat dengan kualitas kontes dan
              trah juara dari seluruh Nusantara.
            </p>
          </div>

          <div className="hidden md:flex text-[8rem] opacity-20 transform -scale-x-100 rotate-12 drop-shadow-lg">
            🦅
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 -mt-12 relative z-10">
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-2 flex items-center mb-12 border border-gray-100">
          <div className="pl-4">
            <svg
              className="w-6 h-6 text-plant-green"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Cari jenis Murai Batu impianmu..."
            className="w-full py-4 px-4 bg-transparent outline-none text-plant-dark placeholder-gray-400 font-medium"
          />
          <button className="hidden md:block bg-plant-dark text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors">
            Cari
          </button>
        </div>

        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-plant-dark">
              Jenis Murai Batu
            </h2>
            <p className="text-gray-500 font-medium mt-1">
              Pilih kategori untuk melihat stok burung
            </p>
          </div>

          <div className="flex gap-2">
            <span className="bg-plant-green text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
              Semua
            </span>
            <span className="bg-white text-gray-500 hover:text-plant-dark px-4 py-2 rounded-xl text-sm font-bold shadow-sm cursor-pointer transition-colors">
              Terpopuler
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {BIRD_CATALOGS.map((catalog) => (
            <Link
              key={catalog.id}
              to={`/catalog/${catalog.id}`}
              className="group bg-white rounded-[2rem] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-50 flex flex-col"
            >
              <div className="bg-plant-light h-60 rounded-[1.5rem] flex items-center justify-center relative overflow-hidden group-hover:bg-green-100/50 transition-colors">
                <div className="text-8xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 drop-shadow-xl">
                  🦅
                </div>
                <div className="absolute top-4 right-4 bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-full text-plant-green text-xs font-black shadow-sm">
                  KODE 0{catalog.id}
                </div>
              </div>

              <div className="pt-6 pb-2 px-3 flex-1 flex flex-col">
                <h3 className="text-plant-dark font-black text-2xl mb-2 group-hover:text-plant-green transition-colors">
                  {catalog.name.replace("Murai Batu ", "MB ")}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-2">
                  {catalog.description}
                </p>

                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-plant-green font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                    Lihat Koleksi
                    <svg
                      className="w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-300"
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

                  <div className="w-8 h-8 rounded-full bg-plant-light flex items-center justify-center group-hover:bg-plant-green transition-colors">
                    <span className="text-plant-green group-hover:text-white text-xs font-bold transition-colors">
                      +
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="bg-plant-dark rounded-[2.5rem] p-8 md:p-12 shadow-2xl mt-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>

          <div className="relative z-10 text-center max-w-3xl mx-auto">
            <h3 className="text-3xl font-black text-white mb-4">
              Mengapa Memilih Koleksi Kami?
            </h3>
            <p className="text-gray-400 mb-10 text-sm md:text-base">
              Berkomitmen penuh memberikan burung kualitas terbaik untuk para
              penghobi dan petarung sejati.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
