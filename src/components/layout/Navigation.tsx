import { Link, useLocation } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';

export default function Navigation() {
  const location = useLocation();
  const cartCount = useCartStore((state) => state.cartCount);

  const menuItems = [
    { name: 'Katalog', path: '/', icon: '🦅' },
    { name: 'Perawatan', path: '/care', icon: '🏥' },
    { name: 'Komunitas', path: '/community', icon: '👥' },
    { name: 'Akun Saya', path: '/account', icon: '👤' },
    { name: 'Lacak Pesanan', path: '/track-order', icon: '📦' },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
        <div className="flex justify-around items-center h-16">
          <Link
            to="/"
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              location.pathname === '/' ? 'text-slate-800' : 'text-gray-500'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
            <span className="text-xs mt-1">Home</span>
          </Link>

          <Link
            to="/cart"
            className={`relative flex flex-col items-center justify-center flex-1 h-full ${
              location.pathname === '/cart' ? 'text-slate-800' : 'text-gray-500'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
            </svg>
            {cartCount() > 0 && (
              <span className="absolute top-2 right-1/4 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cartCount()}
              </span>
            )}
            <span className="text-xs mt-1">Cart</span>
          </Link>

          <Link
            to="/account"
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              location.pathname === '/account' ? 'text-slate-800' : 'text-gray-500'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </nav>

      {/* Desktop Sidebar - Hanya muncul di pages yang bukan CatalogDetail */}
      {!location.pathname.startsWith('/catalog/') && (
        <aside className="hidden md:block fixed left-0 top-0 h-full w-64 bg-slate-800 text-white p-6 z-40">
          <div className="mb-10">
            <h1 className="text-2xl font-bold">Sekawan Ring🦅</h1>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-white text-slate-800 font-semibold'
                    : 'hover:bg-slate-700'
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
                className="flex items-center justify-between bg-white text-slate-800 px-4 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                <span>Keranjang</span>
                <span className="bg-slate-800 text-white rounded-full h-6 w-6 flex items-center justify-center text-sm">
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
