import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import type { Catalog, Item } from "../types/index";
import { catalogService, itemService } from "../services";
import { useCartStore } from "../store/useCartStore";

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
  const [showCertModal, setShowCertModal] = useState(false);
  const [certPassword, setCertPassword] = useState("");
  const [certError, setCertError] = useState<string | null>(null);
  const [isVerifyingCert, setIsVerifyingCert] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const catalogId = currentItem?.catalog_id || null;
  const currentCatalog = catalogId ? catalogs.find((c) => c.id === catalogId) || null : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const catalogsData = await catalogService.getAllCatalogs();
        setCatalogs(catalogsData);

        const allItems = await itemService.getAllItems();

        const item = allItems.find((i) => i.id === currentItemId);
        if (item) {
          setCurrentItem(item);
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

  const cart = useCartStore((state) => state.cart);
  const addToCart = useCartStore((state) => state.addToCart);

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
  const mediaList = ((currentItem as any).media || []) as { url: string; type?: string }[];
  const hasMedia = mediaList.length > 0;
  const isInCart = cart.some((c) => c.id === currentItem.id);
  const hasCertificateMeta = !!currentItem.certificate;

  // Reset media yang aktif saat berpindah burung
  useEffect(() => {
    setActiveMediaIndex(0);
  }, [currentItem.id]);

  return (
    <div className="flex-1 flex min-h-screen bg-white overflow-x-hidden relative">
      <div className="absolute top-0 left-0 w-full h-[50vh] md:h-[75vh] bg-[#C1ECD5] z-0 origin-top-left" style={{ borderBottomRightRadius: "min(45vw, 600px)" }} />

      <main className="flex-1 transition-all relative z-10 w-full overflow-y-auto h-screen no-scrollbar pb-32" style={{ scrollbarWidth: "none" }}>
        <style>{`::-webkit-scrollbar { display: none; }`}</style>

        <div className="max-w-[1100px] mx-auto w-full pt-6 md:pt-10 px-5 sm:px-8 md:px-12">
          {/* <div className="flex justify-end items-start mb-6 md:mb-2">
            <div className="bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl shadow-sm flex items-center gap-1.5">
              <span className="text-plant-green text-xs md:text-sm">★</span>
              <span className="font-bold text-plant-dark text-xs md:text-base">4.8</span>
            </div>
          </div> */}

          <div className="flex flex-col gap-6 md:gap-10 mt-4 md:mt-6">
            {/* Header: Nama burung & harga */}
            <div className="text-center md:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-[3rem] lg:text-[3.5rem] font-serif font-black text-[#0B2F2D] leading-tight mb-4">
                {currentItem.name.split(" ").map((word: string, i: number) => (
                  <span key={i} className="block">
                    {word}
                  </span>
                ))}
              </h1>
              <div className="inline-flex flex-col items-center md:items-start">
                <p className="text-gray-500/80 font-bold text-[10px] md:text-xs tracking-widest uppercase mb-1">Price</p>
                <p className="text-3xl sm:text-4xl md:text-[2.5rem] font-black text-[#0B2F2D]">Rp {(currentItem.price / 1000000).toFixed(1)} Jt</p>
              </div>
            </div>

            {/* Media utama: foto/video besar di tengah */}
            {hasMedia && (
              <div className="flex flex-col items-center gap-4 md:gap-5">
                {mediaList[activeMediaIndex] && (
                  <button
                    type="button"
                    onClick={() => window.open(mediaList[activeMediaIndex].url, "_blank", "noopener")}
                    className="relative w-full max-w-xl aspect-[4/3] rounded-[1.5rem] overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.12)] border border-white bg-black/5 group"
                  >
                    <img src={mediaList[activeMediaIndex].url} alt={`Media utama ${activeMediaIndex + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" loading="lazy" />
                    {mediaList[activeMediaIndex].type === "video" && (
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                        <div className="w-14 h-14 md:w-16 md:h-16 border border-white/70 rounded-full flex items-center justify-center backdrop-blur-md bg-white/30 shadow-[0_6px_16px_rgba(0,0,0,0.25)] group-hover:scale-110 transition-transform">
                          <svg className="w-6 h-6 md:w-7 md:h-7 text-white ml-1 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                )}

                {/* Thumbnail kecil di bawah */}
                {mediaList.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
                    {mediaList.map((media, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveMediaIndex(idx)}
                        className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border-2 transition-all duration-300 shadow-sm ${
                          idx === activeMediaIndex ? "border-plant-green shadow-[0_8px_16px_rgba(13,152,106,0.35)]" : "border-transparent opacity-80 hover:opacity-100"
                        }`}
                      >
                        <img src={media.url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                        {media.type === "video" && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tombol aksi */}
            <div className="flex gap-4 pt-1 md:pt-2 justify-center md:justify-start">
              <button
                onClick={() => {
                  if (!isInCart && currentItem.stock > 0) {
                    addToCart(currentItem as any);
                  }
                }}
                disabled={currentItem.stock <= 0 || isInCart}
                className={`flex-1 md:flex-none w-auto md:w-16 h-12 md:h-16 rounded-[1rem] md:rounded-[1.2rem] flex items-center justify-center text-white shadow-[0_10px_20px_rgba(13,152,106,0.3)] transition-colors ${
                  currentItem.stock <= 0 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : isInCart ? "bg-plant-green/70 hover:bg-plant-green/70 cursor-default" : "bg-plant-green hover:bg-[#0A875D]"
                }`}
              >
                <svg className="w-5 h-5 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                </svg>
                <span className="ml-2 font-bold text-sm md:hidden">{currentItem.stock <= 0 ? "Habis" : isInCart ? "Di Keranjang" : "Beli"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!hasCertificateMeta) {
                    alert("Sertifikat belum tersedia untuk burung ini.");
                    return;
                  }
                  setCertPassword("");
                  setCertError(null);
                  setShowCertModal(true);
                }}
                className="w-12 h-12 md:w-16 md:h-16 bg-white hover:bg-gray-50 transition-colors rounded-[1rem] md:rounded-[1.2rem] flex flex-col items-center justify-center text-[#0B2F2D] shadow-[0_10px_20px_rgba(0,0,0,0.05)] text-[9px] md:text-[10px] font-semibold"
              >
                <svg className="w-5 h-5 md:w-7 md:h-7 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7V5a5 5 0 0110 0v2m-9 4h8a2 2 0 012 2v5a2 2 0 01-2 2H8a2 2 0 01-2-2v-5a2 2 0 012-2z" />
                </svg>
                <span>Sertif</span>
              </button>
            </div>
          </div>

          <div className="mt-24 sm:mt-28 md:mt-40">
            <h3 className="text-[#0B2F2D] text-lg md:text-xl lg:text-2xl font-black mb-4 md:mb-6">Overview</h3>
            <div className="border-b border-gray-100 pb-10 space-y-6">
              <div>
                <p className="text-[11px] md:text-xs font-semibold text-gray-500 tracking-[0.18em] uppercase mb-3">Karakter Burung</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                  {[
                    { label: "Type", value: currentItem.type },
                    { label: "Gaya Main", value: (currentItem as any).gaya_main },
                    { label: "Body", value: (currentItem as any).body },
                    { label: "Umur", value: currentItem.age_months ? `${currentItem.age_months} Bulan` : undefined },
                    { label: "Stock", value: currentItem.stock > 0 ? `${currentItem.stock} Ekor` : undefined },
                    { label: "Materi", value: (currentItem as any).materi },
                    { label: "Volume", value: (currentItem as any).volume },
                    { label: "Panjang Ekor", value: (currentItem as any).panjang_ekor },
                    { label: "Warna", value: (currentItem as any).warna },
                    { label: "Warna Kaki", value: (currentItem as any).warna_kaki },
                    { label: "Paruh", value: (currentItem as any).paruh },
                    { label: "Jenis Kepala", value: (currentItem as any).jenis_kepala },
                  ]
                    .filter((item) => item.value)
                    .map((item, idx) => (
                      <div key={idx} className="bg-white/95 rounded-xl px-3 py-2.5 md:px-4 md:py-3 border border-gray-100/80 shadow-sm">
                        <p className="text-[9px] md:text-[10px] lg:text-xs text-gray-400 font-semibold tracking-[0.18em] uppercase mb-0.5">{item.label}</p>
                        <p className="font-semibold text-plant-green text-xs sm:text-sm md:text-base leading-snug break-words">{item.value}</p>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] md:text-xs font-semibold text-gray-500 tracking-[0.18em] uppercase mb-3">Setting Rawatan</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                  {[
                    { label: "Voer", value: (currentItem as any).voer },
                    { label: "Extra Fooding", value: (currentItem as any).extra_fooding },
                    { label: "Embun", value: (currentItem as any).embun },
                    { label: "Jemur", value: (currentItem as any).jemur },
                    { label: "Mandi", value: (currentItem as any).mandi },
                    { label: "Tenggar", value: (currentItem as any).tenggar },
                    { label: "Krodong / Ablak", value: (currentItem as any).krodong_ablak },
                  ]
                    .filter((item) => item.value)
                    .map((item, idx) => (
                      <div key={idx} className="bg-white/95 rounded-xl px-3 py-2.5 md:px-4 md:py-3 border border-gray-100/80 shadow-sm">
                        <p className="text-[9px] md:text-[10px] lg:text-xs text-gray-400 font-semibold tracking-[0.18em] uppercase mb-0.5">{item.label}</p>
                        <p className="font-semibold text-plant-green text-xs sm:text-sm md:text-base leading-snug break-words">{item.value}</p>
                      </div>
                    ))}
                </div>

                {[(currentItem as any).voer, (currentItem as any).extra_fooding, (currentItem as any).jemur, (currentItem as any).embun, (currentItem as any).mandi, (currentItem as any).tenggar, (currentItem as any).krodong_ablak].every(
                  (v) => !v,
                ) && <div className="mt-3 text-[11px] md:text-xs text-gray-400 font-medium">Detail rawatan harian seperti voer, jemur, dan extra fooding akan tampil di sini jika diisi pada menu admin.</div>}
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
              <div className="flex items-center justify-between mb-3 md:mb-4 px-1 sm:px-0">
                <h3 className="text-[#0B2F2D] text-lg md:text-xl lg:text-2xl font-black">Foto &amp; Video</h3>
                <p className="text-[11px] md:text-xs text-gray-400 font-medium">Klik untuk melihat versi penuh</p>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-6 -mx-5 px-5 sm:mx-0 sm:px-0" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
                {(currentItem as any).media.map((media: any, idx: number) => (
                  <a
                    key={idx}
                    href={media.url}
                    target="_blank"
                    rel="noreferrer"
                    className="relative flex-shrink-0 w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-[1.2rem] md:rounded-[1.5rem] overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.06)] group border-2 border-transparent hover:border-plant-green transition-all duration-300 bg-black/5"
                  >
                    <img src={media.url} alt={`Media ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" loading="lazy" />

                    {media.type === "video" && (
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                        <div className="w-10 h-10 md:w-12 md:h-12 border border-white/60 rounded-full flex items-center justify-center backdrop-blur-md bg-white/30 shadow-[0_4px_10px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform">
                          <svg className="w-4 h-4 md:w-5 md:h-5 text-white ml-1 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {showCertModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-lg md:text-xl font-bold text-[#0B2F2D] mb-2">Buka Sertifikat</h3>
            <p className="text-xs md:text-sm text-gray-500 mb-4">Masukkan password sertifikat yang dikirim penjual melalui WhatsApp pada invoice setelah pesanan selesai.</p>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-[0.16em]">Password Sertifikat</label>
            <input
              type="password"
              value={certPassword}
              onChange={(e) => {
                setCertPassword(e.target.value);
                setCertError(null);
              }}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-plant-green focus:border-plant-green text-sm"
              placeholder="••••••"
            />
            {certError && <p className="mt-2 text-xs text-red-500">{certError}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowCertModal(false);
                  setCertPassword("");
                  setCertError(null);
                }}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isVerifyingCert || !certPassword}
                onClick={async () => {
                  if (!certPassword) {
                    setCertError("Password tidak boleh kosong.");
                    return;
                  }
                  try {
                    setIsVerifyingCert(true);
                    const url = await itemService.getCertificateUrl(currentItem.id, certPassword);
                    if (!url) {
                      setCertError("Sertifikat tidak ditemukan atau password salah.");
                      return;
                    }
                    window.open(url, "_blank", "noopener");
                    setShowCertModal(false);
                    setCertPassword("");
                    setCertError(null);
                  } catch (err) {
                    console.error("Failed to open certificate", err);
                    setCertError("Gagal membuka sertifikat. Periksa password atau coba lagi nanti.");
                  } finally {
                    setIsVerifyingCert(false);
                  }
                }}
                className={`px-4 py-2 text-sm rounded-lg font-semibold text-white flex items-center gap-2 ${isVerifyingCert || !certPassword ? "bg-plant-green/60 cursor-not-allowed" : "bg-plant-green hover:bg-[#0A875D]"}`}
              >
                {isVerifyingCert && <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Buka Sertifikat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
