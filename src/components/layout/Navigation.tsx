import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCartStore } from "../../store/useCartStore";

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const cart = useCartStore((state) => state.cart);
  const cartCount = cart.reduce((total, item) => total + item.qty, 0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isHome = location.pathname === "/";

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const menuItems = [
    { name: "Beranda", path: "/", icon: "🏠" },
    { name: "Katalog", path: "/katalog", icon: "🦅" },
    { name: "Keranjang", path: "/cart", icon: "🛒" },
  ];

  return (
    <>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-14">
          {/* Left side */}
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

          {/* Right side — hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="relative p-2 rounded-lg text-gray-600 hover:bg-plant-light hover:text-plant-dark transition-colors"
            aria-label="Menu"
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
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-plant-green text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-50 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <span className="text-lg font-black text-plant-dark">
            Sekawan Ring
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Tutup menu"
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
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Sidebar menu */}
        <nav className="px-4 py-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                location.pathname === item.path
                  ? "bg-plant-green text-white shadow-sm"
                  : "text-gray-600 hover:bg-plant-light hover:text-plant-dark"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.name}</span>
              {item.path === "/cart" && cartCount > 0 && (
                <span className="ml-auto bg-white/20 text-current text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
