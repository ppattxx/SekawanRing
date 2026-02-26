import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import type { Catalog, Item } from "../types/index";

// --- DUMMY DATA ---
const BIRD_CATALOGS: Catalog[] = [
  { id: 1, name: "Murai Batu Medan", description: "Suara keras dan variatif" },
  { id: 2, name: "Murai Batu Nias", description: "Fighting agresif" },
];

const BIRD_ITEMS: Record<number, Item[]> = {
  1: [
    { id: 101, catalog_id: 1, name: "MB Medan Super - Ring RJ001", price: 3500000, stock: 2, description: "Ekor 28cm, mental fighter", certificate: "RJ001", type: "Medan" },
    { id: 102, catalog_id: 1, name: "MB Medan Junior - Ring RJ002", price: 2800000, stock: 5, description: "Muda siap latber, ekor 25cm", certificate: "RJ002", type: "Medan" },
    { id: 103, catalog_id: 1, name: "MB Medan Prospek - Ring RJ003", price: 2200000, stock: 3, description: "Prospek juara, suara kristal", certificate: "RJ003", type: "Medan" },
    { id: 104, catalog_id: 1, name: "MB Medan Gacor - Ring RJ004", price: 4200000, stock: 1, description: "Menang lomba 3x", certificate: "RJ004", type: "Medan" },
    { id: 105, catalog_id: 1, name: "MB Medan Champion - Ring RJ005", price: 5000000, stock: 1, description: "Mental Juara Nasional", certificate: "RJ005", type: "Medan" },
    { id: 106, catalog_id: 1, name: "MB Medan Legend - Ring RJ006", price: 6500000, stock: 1, description: "Indukan trah juara", certificate: "RJ006", type: "Medan" },
  ],
  2: [
    { id: 201, catalog_id: 2, name: "MB Nias Fighter - Ring NI001", price: 3800000, stock: 2, description: "Mental baja", certificate: "NI001", type: "Nias" },
    { id: 202, catalog_id: 2, name: "MB Nias Muda - Ring NI002", price: 2500000, stock: 3, description: "Prospek masa depan", certificate: "NI002", type: "Nias" },
  ],
};

const ANGLE_GAP = 18;

export default function CatalogDetail() {
  const { id } = useParams<{ id: string }>();
  const catalogId = parseInt(id || "1");

  // States
  const [activeCatalog, setActiveCatalog] = useState(catalogId);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Refs
  const wheelContainerRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const lastRotation = useRef(0);
  const autoCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isWheelOpenRef = useRef(isWheelOpen);

  const currentCatalog = BIRD_CATALOGS.find((c) => c.id === activeCatalog);
  const items = BIRD_ITEMS[activeCatalog] || [];
  const selectedItem = items[activeIndex] || null;

  const isMobile = windowWidth < 768;
  const RADIUS = isMobile ? 280 : 450;
  const RIGHT_OFFSET = isMobile ? -380 : -580;

  useEffect(() => {
    isWheelOpenRef.current = isWheelOpen;
    if (isWheelOpen) {
      setRotationAngle(activeIndex * -ANGLE_GAP);
      lastRotation.current = activeIndex * -ANGLE_GAP;
    }
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isWheelOpen, activeIndex]);

  useEffect(() => {
    setActiveCatalog(catalogId);
    setActiveIndex(0);
    setRotationAngle(0);
  }, [catalogId]);

  const handleMovement = useCallback(
    (deltaY: number) => {
      if (!isWheelOpenRef.current) return;

      const sensitivity = isMobile ? 0.3 : 0.15;
      const newRotation = lastRotation.current + deltaY * sensitivity;

      setRotationAngle(newRotation);
      lastRotation.current = newRotation;

      let nearestIndex = Math.round(newRotation / ANGLE_GAP) * -1;
      nearestIndex = Math.max(0, Math.min(nearestIndex, items.length - 1));

      if (nearestIndex !== activeIndex) {
        setActiveIndex(nearestIndex);
      }

      if (autoCloseTimeoutRef.current) clearTimeout(autoCloseTimeoutRef.current);
      autoCloseTimeoutRef.current = setTimeout(() => {
        if (isWheelOpenRef.current) {
          const finalRotation = nearestIndex * -ANGLE_GAP;
          setRotationAngle(finalRotation);
          lastRotation.current = finalRotation;
          setTimeout(() => setIsWheelOpen(false), 200);
        }
      }, 400);
    },
    [activeIndex, items.length, isMobile],
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

  return (
    <div className="flex min-h-screen bg-plant-light overflow-hidden relative">
      {/* SIDEBAR KIRI */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-24 lg:w-64 bg-white shadow-xl z-40">
        <div className="p-6">
          <Link to="/" className="text-2xl font-bold text-plant-green mb-10 block">
            <span className="hidden lg:inline">MuraiShop</span>
            <span className="lg:hidden">MS</span>
          </Link>
          <nav className="space-y-4">
            {BIRD_CATALOGS.map((catalog) => (
              <Link
                key={catalog.id}
                to={`/catalog/${catalog.id}`}
                className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${catalog.id === activeCatalog ? "bg-plant-green text-white shadow-lg" : "text-gray-500 hover:bg-plant-light"}`}
              >
                <span className="text-xl">🦅</span>
                <span className="hidden lg:block font-medium">{catalog.name.replace("Murai Batu ", "")}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-24 lg:ml-64 p-6 lg:p-12 pr-10 md:pr-12 transition-all relative z-10 w-full overflow-y-auto h-screen no-scrollbar">
        {selectedItem ? (
          <div className="max-w-3xl pb-20">
            <div className="mb-4 pt-4 md:pt-0">
              <span className="text-plant-green font-bold text-xs md:text-sm tracking-widest uppercase flex items-center gap-2">{currentCatalog?.name}</span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-plant-dark mt-2 mb-6 leading-tight transition-all">{selectedItem.name.split(" - ")[0]}</h1>
            </div>
            <div className="relative w-full h-64 lg:h-[450px] bg-gradient-to-tr from-plant-green/20 to-transparent rounded-[2.5rem] lg:rounded-[3rem] flex items-center justify-center mb-8 shadow-inner">
              <span className="text-8xl md:text-9xl lg:text-[12rem] transform -scale-x-100 drop-shadow-2xl">🦅</span>
              <div className="absolute top-4 right-4 md:top-6 md:right-6 bg-white/90 backdrop-blur px-4 py-2 rounded-2xl shadow-sm font-bold text-plant-dark text-xs md:text-sm">{selectedItem.certificate}</div>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="flex-1">
                <h3 className="text-xl md:text-2xl font-bold text-plant-dark mb-2">Overview</h3>
                <p className="text-gray-600 max-w-md text-sm md:text-base leading-relaxed">{selectedItem.description}</p>
                <p className="text-3xl md:text-4xl font-black text-plant-green mt-4 transition-all">Rp {(selectedItem.price / 1000000).toFixed(1)} Jt</p>
              </div>
              <button className="w-full md:w-auto px-8 py-4 md:py-5 bg-plant-dark text-white font-bold rounded-2xl hover:bg-gray-800 transition-all shadow-xl hover:scale-105 active:scale-95 z-20 text-lg">Masukkan Keranjang</button>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">Belum ada burung di kategori ini.</div>
        )}
      </main>

      <button
        onClick={() => setIsWheelOpen(true)}
        className={`fixed top-1/2 right-0 -translate-y-1/2 bg-plant-green text-white w-10 h-24 md:w-14 md:h-32 rounded-l-full shadow-[-4px_0_20px_rgba(13,152,106,0.5)] z-[45] flex items-center justify-center transition-transform duration-500 hover:w-12 md:hover:w-16 ${isWheelOpen ? "translate-x-full" : "translate-x-0"}`}
      >
        <div className="flex flex-col gap-1.5 opacity-80">
          <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full"></div>
          <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full"></div>
          <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full"></div>
        </div>
      </button>

      <div className={`fixed inset-0 bg-plant-dark/20 backdrop-blur-sm z-40 transition-opacity duration-500 ${isWheelOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"}`} onClick={handleOutsideClick} />

      <div
        ref={wheelContainerRef}
        className={`fixed top-1/2 rounded-full border-[8px] md:border-[12px] border-plant-green bg-white shadow-[-15px_0_50px_rgba(0,0,0,0.15)] z-50 transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]`}
        style={{
          width: RADIUS * 2,
          height: RADIUS * 2,
          right: RIGHT_OFFSET,
          marginTop: -RADIUS,
          transform: isWheelOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* POROS PUTARAN TENGAH RODA */}
        <div
          className="absolute top-1/2 left-1/2 w-0 h-0"
          style={{
            transform: `rotate(${rotationAngle}deg)`,
            transition: isDragging ? "none" : "transform 0.3s ease-out",
          }}
        >
          {items.map((item, index) => {
            const isActive = index === activeIndex;
            const itemAngle = index * ANGLE_GAP;

            return (
              <div
                key={item.id}
                className="absolute flex items-center justify-center"
                style={{
                  transform: `rotate(${itemAngle}deg) translateX(${-RADIUS}px)`,
                }}
              >
                <div
                  className="flex items-center cursor-pointer group"
                  style={{ transform: `rotate(${-itemAngle - rotationAngle}deg)` }}
                  onClick={() => {
                    setActiveIndex(index);
                    setRotationAngle(index * -ANGLE_GAP);
                    setTimeout(() => setIsWheelOpen(false), 200);
                  }}
                >
                  <div
                    className={`absolute right-[85%] mr-2 bg-white/95 backdrop-blur-md px-4 py-2 md:px-5 md:py-3 rounded-2xl shadow-lg border border-gray-100 whitespace-nowrap transition-all duration-300 origin-right ${
                      isActive ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
                    }`}
                  >
                    <p className="text-[10px] md:text-xs tracking-widest text-gray-400 font-bold mb-1 uppercase">Sertifikat Resmi</p>
                    <p className="font-bold text-plant-dark text-sm md:text-base">{item.certificate}</p>
                    <p className="font-black text-plant-green mt-0.5 text-xs md:text-sm">{(item.price / 1000000).toFixed(1)} Jt</p>
                  </div>

                  <div
                    className={`rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                      isActive
                        ? "w-16 h-16 md:w-20 md:h-20 bg-plant-green text-white scale-[1.15] border-[3px] border-white shadow-[0_0_20px_rgba(13,152,106,0.6)] z-20"
                        : "w-12 h-12 md:w-16 md:h-16 bg-plant-light text-plant-green opacity-70 group-hover:opacity-100 group-hover:bg-green-100 z-10"
                    }`}
                  >
                    <span className={isActive ? "text-3xl md:text-4xl" : "text-xl md:text-3xl"}>🦅</span>
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
