import { Link } from 'react-router-dom';
import type { Catalog } from '../types/index';

// Dummy data - Jenis-jenis Murai Batu
const BIRD_CATALOGS: Catalog[] = [
  {
    id: 1,
    name: 'Murai Batu Medan',
    description: 'Dikenal dengan suara kicauannya yang keras dan variatif. Ekor panjang dan postur tegap.',
    image_url: '',
  },
  {
    id: 2,
    name: 'Murai Batu Nias',
    description: 'Memiliki ekor yang lebih pendek namun gaya fighting yang agresif dan mental juara.',
    image_url: '',
  },
  {
    id: 3,
    name: 'Murai Batu Lampung',
    description: 'Ciri khas ekor hitam pekat dan suara yang kristal. Cocok untuk pemula.',
    image_url: '',
  },
  {
    id: 4,
    name: 'Murai Batu Aceh',
    description: 'Burung dengan stamina luar biasa dan mental fighter yang tangguh.',
    image_url: '',
  },
  {
    id: 5,
    name: 'Murai Batu Borneo',
    description: 'Memiliki variasi warna yang cantik dengan suara merdu dan panjang.',
    image_url: '',
  },
  {
    id: 6,
    name: 'Murai Batu Lahat',
    description: 'Terkenal dengan gaya bertarungnya yang atraktif dan suara yang lantang.',
    image_url: '',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600 pt-8 pb-16 px-6 md:px-10 rounded-b-[3rem] shadow-xl">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-white text-4xl md:text-5xl font-bold mb-3">
              Katalog Murai Batu<br />
              Premium Collection 🦅
            </h1>
            <p className="text-slate-200 text-sm md:text-base">
              Pilih jenis Murai Batu yang Anda inginkan
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Cari jenis Murai Batu..."
              className="w-full py-4 pl-12 pr-5 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-slate-400 transition-all text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 -mt-8 pb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Jenis Murai Batu
          </h2>
          <p className="text-gray-600">Pilih untuk melihat burung yang tersedia</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BIRD_CATALOGS.map((catalog) => (
            <Link
              key={catalog.id}
              to={`/catalog/${catalog.id}`}
              className="group"
            >
              <div className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                {/* Image Area - Hanya Ilustrasi */}
                <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 h-64 flex items-center justify-center p-6">
                  {/* Ilustrasi Burung */}
                  <div className="text-center">
                    <div className="text-8xl mb-2 transform group-hover:scale-110 transition-transform">
                      🦅
                    </div>
                    <p className="text-slate-600 text-sm opacity-70">{catalog.name}</p>
                  </div>
                  
                  {/* Decorative corner */}
                  <div className="absolute top-4 right-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-white text-xs font-bold opacity-20">
                      {catalog.id}
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-slate-800 font-bold text-xl mb-2">
                    {catalog.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {catalog.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-semibold">Lihat Burung</span>
                    <svg 
                      className="w-5 h-5 text-slate-700 transform group-hover:translate-x-1 transition-transform" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Info Banner */}
        <div className="bg-white rounded-3xl p-8 shadow-md mt-8">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-slate-800 mb-3">
              Mengapa Memilih Kami? 🏆
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div>
                <div className="text-3xl mb-2">✨</div>
                <h4 className="font-semibold text-slate-800 mb-1">Burung Berkualitas</h4>
                <p className="text-sm text-gray-600">Pilihan terbaik dari peternak terpercaya</p>
              </div>
              <div>
                <div className="text-3xl mb-2">📜</div>
                <h4 className="font-semibold text-slate-800 mb-1">Bersertifikat</h4>
                <p className="text-sm text-gray-600">Dilengkapi sertifikat resmi</p>
              </div>
              <div>
                <div className="text-3xl mb-2">💚</div>
                <h4 className="font-semibold text-slate-800 mb-1">Garansi Kesehatan</h4>
                <p className="text-sm text-gray-600">Jaminan burung sehat dan terawat</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
