import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { Catalog, Item } from '../types/index';

// --- DUMMY DATA ---
const BIRD_CATALOGS: Catalog[] = [
  { id: 1, name: 'Murai Batu Medan', description: 'Suara keras dan variatif' },
  { id: 2, name: 'Murai Batu Nias', description: 'Fighting agresif' },
];

const BIRD_ITEMS: Record<number, Item[]> = {
  1: [
    { id: 101, catalog_id: 1, name: 'MB Medan Super', price: 3500000, stock: 2, description: 'Ekor 28cm, mental fighter, gaya main sujud dan ngeplay. Suara tembakan tajam.', certificate: 'RJ001', type: 'Medan', age_months: 8 },
    { id: 102, catalog_id: 1, name: 'MB Medan Junior', price: 2800000, stock: 5, description: 'Muda siap latber, ekor 25cm. Rajin ngeriwik dan mulai ngeplong.', certificate: 'RJ002', type: 'Medan', age_months: 6 },
    { id: 103, catalog_id: 1, name: 'MB Medan Prospek', price: 2200000, stock: 3, description: 'Prospek juara, suara kristal. Perawatan sangat mudah dan voer total.', certificate: 'RJ003', type: 'Medan', age_months: 5 },
    { id: 104, catalog_id: 1, name: 'MB Medan Gacor', price: 4200000, stock: 1, description: 'Menang lomba 3x di tingkat regional. Mental baja siap ditrek kapanpun.', certificate: 'RJ004', type: 'Medan', age_months: 12 },
  ],
  2: [
    { id: 201, catalog_id: 2, name: 'MB Nias Fighter', price: 3800000, stock: 2, description: 'Mental baja, gaya tempur sangat agresif. Ekor hitam legam menawan.', certificate: 'NI001', type: 'Nias', age_months: 10 },
    { id: 202, catalog_id: 2, name: 'MB Nias Muda', price: 2500000, stock: 3, description: 'Prospek masa depan, sudah mulai pecah suara dan ngeriwik kasar.', certificate: 'NI002', type: 'Nias', age_months: 7 },
  ],
};

function getBirdData(birdId: number) {
  let currentItem: Item | null = null;
  let itemsList: Item[] = [];
  let catalogId: number | null = null;

  for (const catId in BIRD_ITEMS) {
    const numericCatId = Number(catId);
    const found = BIRD_ITEMS[numericCatId].find(item => item.id === birdId);
    if (found) {
      currentItem = found;
      itemsList = BIRD_ITEMS[numericCatId];
      catalogId = numericCatId;
      break;
    }
  }
  return { currentItem, itemsList, catalogId };
}

const ANGLE_GAP = 18; 

export default function BirdDetail() {
  const params = useParams();
  const currentItemId = parseInt(params.itemId || params.id || '0', 10);
  const navigate = useNavigate();

  const { currentItem, itemsList, catalogId } = getBirdData(currentItemId);
  const currentCatalog = catalogId ? BIRD_CATALOGS.find(c => c.id === catalogId) || null : null;

  const initialIndex = currentItem ? itemsList.findIndex(i => i.id === currentItem.id) : 0;

  const [activeIndex, setActiveIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [rotationAngle, setRotationAngle] = useState((initialIndex >= 0 ? initialIndex : 0) * -ANGLE_GAP); 
  const [isDragging, setIsDragging] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const wheelContainerRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const lastRotation = useRef((initialIndex >= 0 ? initialIndex : 0) * -ANGLE_GAP);
  const autoCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isWheelOpenRef = useRef(isWheelOpen);

  const isMobile = windowWidth < 768;
  const RADIUS = isMobile ? 280 : 450; 
  const RIGHT_OFFSET = isMobile ? -380 : -580; 

  useEffect(() => {
    const newIndex = itemsList.findIndex(i => i.id === currentItemId);
    if (newIndex !== -1) {
      setActiveIndex(newIndex);
      setRotationAngle(newIndex * -ANGLE_GAP);
      lastRotation.current = newIndex * -ANGLE_GAP;
    }
  }, [currentItemId, itemsList]);

  useEffect(() => {
    isWheelOpenRef.current = isWheelOpen;
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isWheelOpen]);

  const handleMovement = useCallback((deltaY: number) => {
    if (!isWheelOpenRef.current) return;

    const sensitivity = isMobile ? 0.3 : 0.15;
    const newRotation = lastRotation.current + (deltaY * sensitivity);
    setRotationAngle(newRotation);
    lastRotation.current = newRotation;

    let nearestIndex = Math.round(newRotation / ANGLE_GAP) * -1;
    nearestIndex = Math.max(0, Math.min(nearestIndex, itemsList.length - 1));
    
    if (nearestIndex !== activeIndex) setActiveIndex(nearestIndex);

    if (autoCloseTimeoutRef.current) clearTimeout(autoCloseTimeoutRef.current);
    autoCloseTimeoutRef.current = setTimeout(() => {
        if (isWheelOpenRef.current) {
             const finalRotation = nearestIndex * -ANGLE_GAP;
             setRotationAngle(finalRotation);
             lastRotation.current = finalRotation;
             const selectedBird = itemsList[nearestIndex];
             if (selectedBird) navigate(`/bird/${selectedBird.id}`, { replace: true });
             setTimeout(() => setIsWheelOpen(false), 200);
        }
    }, 400);
  }, [activeIndex, itemsList, isMobile, navigate]);

  useEffect(() => {
    const container = wheelContainerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => { e.preventDefault(); handleMovement(e.deltaY); };
    const onTouchStart = (e: TouchEvent) => { setIsDragging(true); dragStartY.current = e.touches[0].clientY; if (autoCloseTimeoutRef.current) clearTimeout(autoCloseTimeoutRef.current); };
    const onTouchMove = (e: TouchEvent) => { if (!isDragging) return; e.preventDefault(); const deltaY = dragStartY.current - e.touches[0].clientY; handleMovement(deltaY); dragStartY.current = e.touches[0].clientY; };
    const onTouchEnd = () => setIsDragging(false);

    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);
    return () => {
        container.removeEventListener('wheel', onWheel);
        container.removeEventListener('touchstart', onTouchStart);
        container.removeEventListener('touchmove', onTouchMove);
        container.removeEventListener('touchend', onTouchEnd);
    };
  }, [handleMovement, isDragging]);

  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setIsWheelOpen(false);
  };

  if (!currentItem) {
      return (
          <div className="flex-1 flex flex-col items-center justify-center h-screen bg-white p-10">
              <span className="text-6xl mb-4">🔍</span><h2 className="text-2xl font-bold text-slate-800">Tidak Ditemukan</h2>
              <Link to="/" className="mt-4 bg-plant-green text-white px-6 py-3 rounded-xl font-bold">Kembali</Link>
          </div>
      );
  }

  return (
    <div className="flex-1 flex min-h-screen bg-white overflow-x-hidden relative">
      
      {/* 1. BACKGROUND SHAPE HIJAU (Plantify Style) */}
      <div className="absolute top-0 left-0 w-[120%] md:w-full h-[55vh] md:h-[65vh] bg-[#C1ECD5] rounded-br-[150px] md:rounded-br-[300px] z-0 -ml-10 md:ml-0" 
           style={{ borderBottomRightRadius: '35vw' }} />

      {/* MAIN CONTENT LAYER */}
      <main className="flex-1 transition-all relative z-10 w-full overflow-y-auto h-screen no-scrollbar pb-32">
        <div className="max-w-4xl mx-auto w-full pt-8 md:pt-12">
          
          {/* HEADER SECTION */}
          <div className="px-6 md:px-12 flex justify-between items-start">
             <div>
                <Link to={`/catalog/${currentItem.catalog_id}`} className="text-plant-dark font-bold text-sm md:text-base flex items-center gap-2 mb-2 hover:opacity-70 transition-opacity">
                  <span className="text-xl">←</span> {currentCatalog?.name || 'Katalog Murai'} 🐾
                </Link>
                <h1 className="text-4xl md:text-[3.5rem] font-serif font-black text-[#0B2F2D] leading-[1.1] mt-1 max-w-sm">
                  {currentItem.name}
                </h1>
             </div>
             {/* Rating Badge */}
             <div className="bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.05)] flex items-center gap-1.5">
                <span className="text-plant-green text-sm">★</span>
                <span className="font-bold text-plant-dark text-sm md:text-base">4.8</span>
             </div>
          </div>

          {/* HERO IMAGE & FLOATING CARD SECTION */}
          <div className="mt-12 px-6 md:px-12 flex flex-col md:flex-row relative">
              
              {/* Kiri: Harga & Action Buttons (Posisi menyesuaikan Plantify) */}
              <div className="md:w-1/3 flex flex-col justify-center space-y-8 z-20 order-2 md:order-1 mt-16 md:mt-0">
                 <div>
                    <p className="text-gray-500/80 font-bold text-[10px] md:text-xs tracking-widest uppercase mb-1">Price</p>
                    <p className="text-3xl md:text-4xl font-black text-[#0B2F2D]">Rp {(currentItem.price / 1000000).toFixed(1)} Jt</p>
                 </div>
                 <div>
                    <p className="text-gray-500/80 font-bold text-[10px] md:text-xs tracking-widest uppercase mb-1">Stock</p>
                    <p className="text-xl md:text-2xl font-bold text-[#0B2F2D]">{currentItem.stock} Ekor</p>
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button className="w-14 h-14 md:w-16 md:h-16 bg-plant-green hover:bg-[#0A875D] transition-colors rounded-[1.2rem] flex items-center justify-center text-white shadow-[0_10px_20px_rgba(13,152,106,0.3)]">
                      <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                    </button>
                    <button className="w-14 h-14 md:w-16 md:h-16 bg-white hover:bg-gray-50 transition-colors rounded-[1.2rem] flex items-center justify-center text-[#0B2F2D] shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
                      <svg className="w-6 h-6 md:w-7 md:h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                    </button>
                 </div>
              </div>

              {/* Tengah: Gambar Utama & Floating Card */}
              <div className="md:w-2/3 relative flex justify-center order-1 md:order-2">
                 {/* Gambar Burung */}
                 <div className="relative z-10 transform -scale-x-100 drop-shadow-[0_30px_30px_rgba(0,0,0,0.15)] mt-4 md:mt-0">
                    <span className="text-[14rem] md:text-[20rem] leading-none block">🦅</span>
                 </div>

                 {/* Floating Info Card (Seperti card "Grant Earthenware bowl") */}
                 <div className="absolute -bottom-16 md:-bottom-10 right-0 md:right-10 bg-white/95 backdrop-blur-md p-5 md:p-6 rounded-[1.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.08)] z-30 w-64 md:w-72 border border-white">
                    <h4 className="font-bold text-[#0B2F2D] text-lg md:text-xl mb-4 leading-tight">
                       Sertifikat<br/>Ring {currentItem.certificate}
                    </h4>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs md:text-sm">
                       <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] md:text-xs">Type</span>
                       <span className="font-black text-[#0B2F2D]">{currentItem.type || 'Medan'}</span>
                       <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] md:text-xs">Age</span>
                       <span className="font-black text-[#0B2F2D]">{currentItem.age_months || '8'} Months</span>
                       <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] md:text-xs">Grade</span>
                       <span className="font-black text-plant-green uppercase">Premium</span>
                    </div>
                    {/* Tab Ekor (Panah ke Wheel) */}
                    <div className="absolute top-1/2 -right-3 -translate-y-1/2 w-0 h-0 border-t-[10px] border-t-transparent border-l-[12px] border-l-white border-b-[10px] border-b-transparent drop-shadow-[2px_0_2px_rgba(0,0,0,0.05)]"></div>
                 </div>
              </div>
          </div>

          {/* OVERVIEW SECTION (Icon Stats) */}
          <div className="mt-28 md:mt-32 px-6 md:px-12">
             <h3 className="text-[#0B2F2D] text-xl font-black mb-6">Overview</h3>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                <div className="flex items-center gap-3">
                   <div className="text-2xl text-yellow-500 drop-shadow-sm">💧</div>
                   <div>
                     <p className="font-black text-plant-green text-sm md:text-base">Voer Total</p>
                     <p className="text-[9px] md:text-[10px] text-gray-400 font-bold tracking-widest uppercase">Pakan</p>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="text-2xl text-yellow-400 drop-shadow-sm">☀️</div>
                   <div>
                     <p className="font-black text-plant-green text-sm md:text-base">30-45 Mnt</p>
                     <p className="text-[9px] md:text-[10px] text-gray-400 font-bold tracking-widest uppercase">Jemur</p>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="text-2xl text-orange-400 drop-shadow-sm">💊</div>
                   <div>
                     <p className="font-black text-plant-green text-sm md:text-base">Extra Food</p>
                     <p className="text-[9px] md:text-[10px] text-gray-400 font-bold tracking-widest uppercase">Jangkrik / Kroto</p>
                   </div>
                </div>
             </div>
          </div>

          {/* BIO SECTION */}
          <div className="mt-12 px-6 md:px-12">
             <h3 className="text-[#0B2F2D] text-xl font-black mb-4">Bird Bio</h3>
             <p className="text-gray-500 leading-relaxed text-sm md:text-base pr-4 md:pr-16 font-medium">
               {currentItem.description} Perawatan burung ini sangat mudah dan cocok untuk koleksi maupun persiapan lomba. Rawatan harian konsisten akan memaksimalkan performa suaranya di lapangan.
             </p>
          </div>

        </div>
      </main>

      <button 
        onClick={() => setIsWheelOpen(true)}
        className={`absolute top-1/2 right-0 -translate-y-1/2 bg-[#0D986A] w-5 h-16 md:w-7 md:h-24 rounded-l-full z-[45] flex items-center justify-center pl-0.5 md:pl-1 transition-all duration-300 hover:w-7 md:hover:w-9 group cursor-pointer
        ${isWheelOpen ? 'translate-x-full' : 'translate-x-0'}`}
        aria-label="Buka pilihan burung"
      >
        {/* Dua Garis Vertikal (||) Sangat Tipis */}
        <div className="flex gap-[2px] md:gap-[3px] opacity-60 group-hover:opacity-100 transition-opacity">
           <div className="w-[1.5px] h-3.5 md:h-4 bg-[#C1ECD5] rounded-full"></div>
           <div className="w-[1.5px] h-3.5 md:h-4 bg-[#C1ECD5] rounded-full"></div>
        </div>
      </button>

      {/* Overlay Gelap */}
      <div className={`absolute inset-0 bg-[#0B2F2D]/20 backdrop-blur-sm z-40 transition-opacity duration-500 ${isWheelOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`} onClick={handleOutsideClick} />

      {/* Roda Putar Inti */}
      <div ref={wheelContainerRef} className={`absolute top-1/2 rounded-full border-[8px] md:border-[12px] border-[#0D986A] bg-white shadow-[-15px_0_50px_rgba(0,0,0,0.15)] z-50 transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]`}
        style={{ width: RADIUS * 2, height: RADIUS * 2, right: RIGHT_OFFSET, marginTop: -RADIUS, transform: isWheelOpen ? 'translateX(0)' : 'translateX(100%)' }}
      >
          <div className="absolute top-1/2 left-1/2 w-0 h-0" style={{ transform: `rotate(${rotationAngle}deg)`, transition: isDragging ? 'none' : 'transform 0.3s ease-out' }}>
              {itemsList.map((item, index) => {
                  const isActive = index === activeIndex;
                  const itemAngle = index * ANGLE_GAP;

                  return (
                      <div key={item.id} className="absolute flex items-center justify-center" style={{ transform: `rotate(${itemAngle}deg) translateX(${-RADIUS}px)` }}>
                          <div className="flex items-center cursor-pointer group" style={{ transform: `rotate(${-itemAngle - rotationAngle}deg)` }}
                              onClick={() => {
                                  setActiveIndex(index);
                                  setRotationAngle(index * -ANGLE_GAP);
                                  navigate(`/bird/${item.id}`, { replace: true });
                                  setTimeout(() => setIsWheelOpen(false), 200);
                              }}
                          >
                              {/* Label Info Roda */}
                              <div className={`absolute right-[85%] mr-2 bg-white/95 backdrop-blur-md px-4 py-2 md:px-5 md:py-3 rounded-2xl shadow-lg border border-gray-100 whitespace-nowrap transition-all duration-300 origin-right ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}`}>
                                  <p className="text-[10px] md:text-xs tracking-widest text-gray-400 font-bold mb-1 uppercase">Sertifikat Resmi</p>
                                  <p className="font-bold text-[#0B2F2D] text-sm md:text-base">{item.certificate}</p>
                                  <p className="font-black text-plant-green mt-0.5 text-xs md:text-sm">{((item.price || 0) / 1000000).toFixed(1)} Jt</p>
                              </div>
                              {/* Ikon Burung Roda */}
                              <div className={`rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${isActive ? 'w-16 h-16 md:w-20 md:h-20 bg-plant-green text-white scale-[1.15] border-[3px] border-white shadow-[0_0_20px_rgba(13,152,106,0.6)] z-20' : 'w-12 h-12 md:w-16 md:h-16 bg-[#D2EFE1] text-plant-green opacity-70 group-hover:opacity-100 group-hover:bg-[#C1ECD5] z-10'}`}>
                                  <span className={isActive ? 'text-3xl md:text-4xl' : 'text-xl md:text-3xl'}>🦅</span>
                              </div>
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>
    </div>
  );
}