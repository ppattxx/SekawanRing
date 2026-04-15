import { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCartStore } from "../../store/useCartStore";

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const cart = useCartStore((state) => state.cart);
  const cartCount = cart.reduce((total, item) => total + item.qty, 0);

  const isHome = location.pathname === "/";

  const showBottomNav = useMemo(() => {
    return location.pathname !== "/checkout";
  }, [location.pathname]);

  const isActivePath = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-14">
          {isHome ? (
            <Link to="/" className="flex items-center gap-2">
              <span className="text-lg font-black text-plant-dark tracking-tight">
                Sekawan Ring
              </span>
            </Link>
          ) : (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-plant-dark/70 hover:text-plant-green transition-colors font-semibold text-sm"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Kembali
            </button>
          )}

          <div className="flex items-center gap-1">
            <Link
              to="/cart"
              className="relative p-2 rounded-lg text-gray-600 hover:bg-plant-light hover:text-plant-dark transition-colors md:inline-flex hidden"
              aria-label="Keranjang"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-plant-green text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </nav>

      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] z-50">
          <div className="grid grid-cols-2 h-16">
            <Link
              to="/"
              className={`flex flex-col items-center justify-center text-[11px] font-semibold transition-colors ${
                isActivePath("/") ? "text-plant-green" : "text-gray-500"
              }`}
            >
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-10.5z" />
              </svg>
              Beranda
            </Link>

            <Link
              to="/cart"
              className={`relative flex flex-col items-center justify-center text-[11px] font-semibold transition-colors ${
                isActivePath("/cart") ? "text-plant-green" : "text-gray-500"
              }`}
            >
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              Keranjang
              {cartCount > 0 && (
                <span className="absolute top-2 right-[32%] bg-plant-green text-white text-[10px] rounded-full h-4 min-w-4 px-1 flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}
