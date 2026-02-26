import { Link, useLocation } from "react-router-dom";
import { useCartStore } from "../../store/useCartStore";

export default function Navigation() {
  const location = useLocation();
  const cartCount = useCartStore((state) => state.cartCount);

  const menuItems = [
    { name: "Katalog", path: "/", icon: "🦅" },
    { name: "Perawatan", path: "/care", icon: "🏥" },
    { name: "Lacak Pesanan", path: "/track-order", icon: "📦" },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] md:hidden z-50">
        <div className="flex justify-around items-center h-16">
          <Link
            to="/"
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              location.pathname === "/"
                ? "text-plant-green font-bold"
                : "text-gray-500"
            }`}
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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              ></path>
            </svg>
            <span className="text-xs mt-1">Home</span>
          </Link>

          <Link
            to="/cart"
            className={`relative flex flex-col items-center justify-center flex-1 h-full ${
              location.pathname === "/cart"
                ? "text-plant-green font-bold"
                : "text-gray-500"
            }`}
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
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              ></path>
            </svg>
            {cartCount() > 0 && (
              <span className="absolute top-2 right-1/4 bg-plant-green text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-sm">
                {cartCount()}
              </span>
            )}
            <span className="text-xs mt-1">Cart</span>
          </Link>
        </div>
      </nav>

      {!location.pathname.startsWith("/catalog/") && (
        <aside className="hidden md:block fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 p-6 z-40 shadow-sm">
          <div className="mb-10">
            <span className="bg-plant-light text-plant-green px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase inline-block mb-4">
              Sekawan Ring
            </span>
            <h1 className="text-2xl font-black text-plant-dark">
              Sekawan Ring
            </h1>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? "bg-plant-green text-white font-bold shadow-sm"
                    : "text-gray-500 hover:bg-plant-light hover:text-plant-dark"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {cartCount() > 0 && (
            <div className="absolute bottom-6 left-6 right-6">
              <Link
                to="/cart"
                className="flex items-center justify-between bg-plant-dark text-white px-4 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
              >
                <span>Keranjang</span>
                <span className="bg-white text-plant-dark rounded-full h-6 w-6 flex items-center justify-center text-sm font-black">
                  {cartCount()}
                </span>
              </Link>
            </div>
          )}
        </aside>
      )}
    </>
  );
}
