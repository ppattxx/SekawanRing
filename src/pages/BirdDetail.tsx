import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import type { Catalog, Item } from "../types/index";
import { catalogService, itemService } from "../services";

const ANGLE_GAP = 18;

export default function BirdDetail() {
  const params = useParams();
  const currentItemId = parseInt(params.itemId || params.id || "0", 10);
  const navigate = useNavigate();

  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const [itemsList, setItemsList] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const catalogId = currentItem?.catalog_id || null;
  const currentCatalog = catalogId ? catalogs.find((c) => c.id === catalogId) || null : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all catalogs
        const catalogsData = await catalogService.getAllCatalogs();
        setCatalogs(catalogsData);

        // Fetch all items - more efficient approach
        const allItems = await itemService.getAllItems();

        // Find current item
        const item = allItems.find((i) => i.id === currentItemId);
        if (item) {
          setCurrentItem(item);
          // Get all items from the same catalog
          const catalogItems = allItems.filter((i) => i.catalog_id === item.catalog_id);
          setItemsList(catalogItems);
        } else {
          setError("Item tidak ditemukan");
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Gagal memuat data. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentItemId]);

  const initialIndex = currentItem ? itemsList.findIndex((i) => i.id === currentItem.id) : 0;

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
  const RADIUS = isMobile ? 240 : 450;
  const RIGHT_OFFSET = isMobile ? -330 : -580;

  useEffect(() => {
    const newIndex = itemsList.findIndex((i) => i.id === currentItemId);
    if (newIndex !== -1) {
      setActiveIndex(newIndex);
      setRotationAngle(newIndex * -ANGLE_GAP);
      lastRotation.current = newIndex * -ANGLE_GAP;
    }
  }, [currentItemId, itemsList]);

  useEffect(() => {
    isWheelOpenRef.current = isWheelOpen;
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isWheelOpen]);

  const handleMovement = useCallback(
    (deltaY: number) => {
      if (!isWheelOpenRef.current) return;

      const sensitivity = isMobile ? 0.3 : 0.15;
      const newRotation = lastRotation.current + deltaY * sensitivity;
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
    },
    [activeIndex, itemsList, isMobile, navigate],
  );

  useEffect(() => {
    const container = wheelContainerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      handleMovement(e.deltaY);
    };
    const onTouchStart = (e: TouchEvent) => {
      setIsDragging(true);
      dragStartY.current = e.touches[0].clientY;
      if (autoCloseTimeoutRef.current) clearTimeout(autoCloseTimeoutRef.current);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const deltaY = dragStartY.current - e.touches[0].clientY;
      handleMovement(deltaY);
      dragStartY.current = e.touches[0].clientY;
    };
    const onTouchEnd = () => setIsDragging(false);

    container.addEventListener("wheel", onWheel, { passive: false });
    container.addEventListener("touchstart", onTouchStart, { passive: false });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd);
    return () => {
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
    };
  }, [handleMovement, isDragging]);

  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setIsWheelOpen(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-white p-10">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-plant-green mb-4"></div>
        <p className="text-gray-500 font-medium">Memuat data...</p>
      </div>
    );
  }

  if (error || !currentItem) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-white p-10">
        <span className="text-6xl mb-4">🔍</span>
        <h2 className="text-2xl font-bold text-slate-800">{error || "Tidak Ditemukan"}</h2>
        <Link to="/" className="mt-4 bg-plant-green text-white px-6 py-3 rounded-xl font-bold">
          Kembali
        </Link>
      </div>
    );
  }

  const hasMedia = (currentItem as any).media && (currentItem as any).media.length > 0;

  return (
    <div className="flex-1 flex min-h-screen bg-white overflow-x-hidden relative">
      <div className="absolute top-0 left-0 w-full h-[50vh] md:h-[75vh] bg-[#C1ECD5] z-0 origin-top-left" style={{ borderBottomRightRadius: "min(45vw, 600px)" }} />

      <main className="flex-1 transition-all relative z-10 w-full overflow-y-auto h-screen no-scrollbar pb-32" style={{ scrollbarWidth: "none" }}>
        <style>{`::-webkit-scrollbar { display: none; }`}</style>

        <div className="max-w-[1100px] mx-auto w-full pt-6 md:pt-10 px-5 sm:px-8 md:px-12">
          <div className="flex justify-end items-start mb-6 md:mb-2">
            <div className="bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl shadow-sm flex items-center gap-1.5">
              <span className="text-plant-green text-xs md:text-sm">★</span>
              <span className="font-bold text-plant-dark text-xs md:text-base">4.8</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row relative items-center md:items-stretch">
            <div className="w-full md:w-5/12 flex flex-col justify-center z-20 order-2 md:order-1 mt-8 md:mt-0 pt-0 md:pt-8 lg:pt-16">
              <h1 className="text-4xl sm:text-5xl md:text-[4rem] lg:text-[4.5rem] font-serif font-black text-[#0B2F2D] leading-[1.05] mb-8 md:mb-12 drop-shadow-sm">
                {currentItem.name.split(" ").map((word: string, i: number) => (
                  <span key={i} className="block">
                    {word}
                  </span>
                ))}
              </h1>

              <div className="flex flex-row md:flex-col justify-between md:justify-start items-end md:items-start md:space-y-8 mb-6 md:mb-8">
                <div>
                  <p className="text-gray-500/80 font-bold text-[10px] md:text-xs tracking-widest uppercase mb-0.5 md:mb-1">Price</p>
                  <p className="text-3xl sm:text-4xl md:text-[2.5rem] font-black text-[#0B2F2D]">Rp {(currentItem.price / 1000000).toFixed(1)} Jt</p>
                </div>
                <div className="text-right md:text-left">
                  <p className="text-gray-500/80 font-bold text-[10px] md:text-xs tracking-widest uppercase mb-0.5 md:mb-1">Stock</p>
                  <p className="text-xl sm:text-2xl font-bold text-[#0B2F2D]">{currentItem.stock} Ekor</p>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button className="flex-1 md:flex-none w-auto md:w-16 h-12 md:h-16 bg-plant-green hover:bg-[#0A875D] transition-colors rounded-[1rem] md:rounded-[1.2rem] flex items-center justify-center text-white shadow-[0_10px_20px_rgba(13,152,106,0.3)]">
                  <svg className="w-5 h-5 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                  </svg>
                  <span className="ml-2 font-bold text-sm md:hidden">Beli</span>
                </button>
                <button className="w-12 h-12 md:w-16 md:h-16 bg-white hover:bg-gray-50 transition-colors rounded-[1rem] md:rounded-[1.2rem] flex items-center justify-center text-[#0B2F2D] shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
                  <svg className="w-5 h-5 md:w-7 md:h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                  </svg>
                </button>
              </div>
            </div>

            <div className="w-full md:w-7/12 relative flex justify-center md:justify-end items-center order-1 md:order-2">
              <div className="relative inline-flex flex-col items-center md:items-end mt-4 md:mt-10 lg:mt-20">
                <div className="relative z-10 transform -scale-x-100 drop-shadow-[0_20px_20px_rgba(0,0,0,0.15)] md:drop-shadow-[0_30px_30px_rgba(0,0,0,0.15)] md:pr-10 lg:pr-20">
                  <span className="text-[12rem] sm:text-[16rem] md:text-[20rem] lg:text-[24rem] leading-none block">🦅</span>
                </div>

                <div className="absolute -bottom-12 md:-bottom-16 right-0 md:right-0 lg:right-4 bg-white/95 backdrop-blur-md p-4 sm:p-5 md:p-6 rounded-[1.2rem] md:rounded-[1.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.1)] z-30 w-[85%] max-w-[260px] md:w-[280px] lg:w-[320px] border border-white">
                  <h4 className="font-bold text-[#0B2F2D] text-base md:text-xl lg:text-2xl mb-3 md:mb-5 leading-tight">
                    {currentItem.certificate ? (
                      <>
                        Sertifikat
                        <br />
                        Ring {currentItem.certificate}
                      </>
                    ) : (
                      <>
                        Produk
                        <br />
                        Premium
                      </>
                    )}
                  </h4>
                  <div className="grid grid-cols-2 gap-y-2 md:gap-y-4 gap-x-2 text-[11px] md:text-sm">
                    {currentItem.type && (
                      <>
                        <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px] md:text-xs">Type</span>
                        <span className="font-black text-[#0B2F2D]">{currentItem.type}</span>
                      </>
                    )}
                    {currentItem.age_months && (
                      <>
                        <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px] md:text-xs">Age</span>
                        <span className="font-black text-[#0B2F2D]">{currentItem.age_months} Months</span>
                      </>
                    )}
                    <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px] md:text-xs">Stock</span>
                    <span className="font-black text-plant-green">{currentItem.stock} Ekor</span>
                  </div>

                  <div className="hidden md:block absolute top-1/2 -right-3 md:-right-4 -translate-y-1/2 w-0 h-0 border-t-[8px] md:border-t-[12px] border-t-transparent border-l-[10px] md:border-l-[16px] border-l-white border-b-[8px] md:border-b-[12px] border-b-transparent drop-shadow-[2px_0_2px_rgba(0,0,0,0.05)]"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-24 sm:mt-28 md:mt-40">
            <h3 className="text-[#0B2F2D] text-lg md:text-xl lg:text-2xl font-black mb-4 md:mb-6">Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-10 border-b border-gray-100 pb-10">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="text-2xl md:text-3xl lg:text-4xl text-yellow-500 drop-shadow-sm">💧</div>
                <div>
                  <p className="font-black text-plant-green text-xs sm:text-sm md:text-base lg:text-lg">Voer Total</p>
                  <p className="text-[8px] md:text-[10px] lg:text-xs text-gray-400 font-bold tracking-widest uppercase mt-0.5">Pakan</p>
                </div>
              </div>
              <div className="flex items-center gap-3 md:gap-4">
                <div className="text-2xl md:text-3xl lg:text-4xl text-yellow-400 drop-shadow-sm">☀️</div>
                <div>
                  <p className="font-black text-plant-green text-xs sm:text-sm md:text-base lg:text-lg">30-45 Mnt</p>
                  <p className="text-[8px] md:text-[10px] lg:text-xs text-gray-400 font-bold tracking-widest uppercase mt-0.5">Jemur</p>
                </div>
              </div>
              <div className="flex items-center gap-3 md:gap-4 col-span-2 md:col-span-1">
                <div className="text-2xl md:text-3xl lg:text-4xl text-orange-400 drop-shadow-sm">💊</div>
                <div>
                  <p className="font-black text-plant-green text-xs sm:text-sm md:text-base lg:text-lg">Extra Food</p>
                  <p className="text-[8px] md:text-[10px] lg:text-xs text-gray-400 font-bold tracking-widest uppercase mt-0.5">Jangkrik / Kroto</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 md:mt-12">
            <h3 className="text-[#0B2F2D] text-lg md:text-xl lg:text-2xl font-black mb-3 md:mb-4">Bird Bio</h3>
            <p className="text-gray-500 leading-relaxed text-xs sm:text-sm md:text-base lg:text-lg pr-2 sm:pr-4 md:pr-16 lg:pr-32 font-medium">
              {currentItem.description} Perawatan burung ini sangat mudah dan cocok untuk koleksi maupun persiapan lomba. Rawatan harian konsisten akan memaksimalkan performa suaranya di lapangan.
            </p>
          </div>

          {hasMedia && (
            <div className="mt-10 md:mt-14 w-full">
              <div className="flex gap-4 overflow-x-auto pb-6 -mx-5 px-5 sm:mx-0 sm:px-0" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
                {(currentItem as any).media.map((media: any, idx: number) => (
                  <div
                    key={idx}
                    className="relative flex-shrink-0 w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-[1.2rem] md:rounded-[1.5rem] overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.06)] group cursor-pointer border-2 border-transparent hover:border-plant-green transition-all duration-300"
                  >
                    <img src={media.url} alt={`Media ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" loading="lazy" />

                    {media.type === "video" && (
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                        <div className="w-10 h-10 md:w-12 md:h-12 border border-white/60 rounded-full flex items-center justify-center backdrop-blur-md bg-white/30 shadow-[0_4px_10px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform">
                          <svg className="w-4 h-4 md:w-5 md:h-5 text-white ml-1 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <button
        onClick={() => setIsWheelOpen(true)}
        className={`absolute top-1/2 right-0 -translate-y-1/2 bg-[#0D986A] w-8 h-20 md:w-11 md:h-24 rounded-l-[1.2rem] md:rounded-l-[1.5rem] shadow-[-4px_0_15px_rgba(13,152,106,0.25)] z-[45] flex items-center justify-center pl-1 md:pl-2 transition-all duration-300 hover:w-10 md:hover:w-12 group cursor-pointer active:scale-95
        ${isWheelOpen ? "translate-x-full" : "translate-x-0"}`}
        aria-label="Buka pilihan burung"
      >
        <div className="flex gap-[3px] md:gap-[4px] opacity-80 group-hover:opacity-100 transition-opacity">
          <div className="w-[2px] md:w-[2.5px] h-5 md:h-6 bg-[#C1ECD5] rounded-full"></div>
          <div className="w-[2px] md:w-[2.5px] h-5 md:h-6 bg-[#C1ECD5] rounded-full"></div>
        </div>
      </button>

      <div className={`absolute inset-0 bg-[#0B2F2D]/20 backdrop-blur-sm z-40 transition-opacity duration-500 ${isWheelOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"}`} onClick={handleOutsideClick} />

      <div
        ref={wheelContainerRef}
        className={`absolute top-1/2 rounded-full border-[6px] md:border-[12px] border-[#0D986A] bg-white shadow-[-15px_0_50px_rgba(0,0,0,0.15)] z-50 transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]`}
        style={{ width: RADIUS * 2, height: RADIUS * 2, right: RIGHT_OFFSET, marginTop: -RADIUS, transform: isWheelOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        <div className="absolute top-1/2 left-1/2 w-0 h-0" style={{ transform: `rotate(${rotationAngle}deg)`, transition: isDragging ? "none" : "transform 0.3s ease-out" }}>
          {itemsList.map((item, index) => {
            const isActive = index === activeIndex;
            const itemAngle = index * ANGLE_GAP;

            return (
              <div key={item.id} className="absolute flex items-center justify-center" style={{ transform: `rotate(${itemAngle}deg) translateX(${-RADIUS}px)` }}>
                <div
                  className="flex items-center cursor-pointer group"
                  style={{ transform: `rotate(${-itemAngle - rotationAngle}deg)` }}
                  onClick={() => {
                    setActiveIndex(index);
                    setRotationAngle(index * -ANGLE_GAP);
                    navigate(`/bird/${item.id}`, { replace: true });
                    setTimeout(() => setIsWheelOpen(false), 200);
                  }}
                >
                  <div
                    className={`absolute right-[85%] mr-1 sm:mr-2 bg-white/95 backdrop-blur-md px-3 py-1.5 md:px-5 md:py-3 rounded-xl md:rounded-2xl shadow-lg border border-gray-100 whitespace-nowrap transition-all duration-300 origin-right ${isActive ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"}`}
                  >
                    <p className="text-[8px] md:text-xs tracking-widest text-gray-400 font-bold mb-0.5 md:mb-1 uppercase">{item.certificate ? "Sertifikat Resmi" : "Produk"}</p>
                    <p className="font-bold text-[#0B2F2D] text-xs sm:text-sm md:text-base">{item.certificate || item.name}</p>
                    <p className="font-black text-plant-green mt-0.5 text-[10px] md:text-sm">{((item.price || 0) / 1000000).toFixed(1)} Jt</p>
                  </div>
                  <div
                    className={`rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${isActive ? "w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-plant-green text-white scale-[1.15] border-[2px] md:border-[3px] border-white shadow-[0_0_20px_rgba(13,152,106,0.6)] z-20" : "w-10 h-10 md:w-16 md:h-16 bg-[#D2EFE1] text-plant-green opacity-70 group-hover:opacity-100 group-hover:bg-[#C1ECD5] z-10"}`}
                  >
                    <span className={isActive ? "text-2xl sm:text-3xl md:text-4xl" : "text-lg sm:text-xl md:text-3xl"}>🦅</span>
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
