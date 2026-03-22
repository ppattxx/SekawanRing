import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authService } from "../../services";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const handleLogout = async () => {
    if (window.confirm("Apakah Anda yakin ingin logout?")) {
      await authService.logout();
      navigate("/admin/login");
    }
  };

  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin",
    },
    {
      name: "Manajemen Produk",
      path: "/admin/products",
    },
    {
      name: "Manajemen Pesanan",
      path: "/admin/orders",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-gradient-to-br from-emerald-600 to-teal-600 text-white transition-all duration-300 z-40 transform md:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:transform-none ${sidebarOpen ? "md:w-64" : "md:w-20"} w-64`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          {(sidebarOpen || mobileSidebarOpen) && (
            <Link to="/admin" className="text-xl font-bold">
              Admin Panel
            </Link>
          )}

          {/* Desktop: collapse */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:block p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <span className="text-sm font-medium">{sidebarOpen ? "Tutup" : "Menu"}</span>
          </button>

          {/* Mobile: close */}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Tutup menu"
          >
            <span className="text-sm font-medium">Tutup</span>
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-white text-emerald-600 shadow-lg"
                    : "hover:bg-white/10"
                }`}
                title={!sidebarOpen ? item.name : ""}
              >
                {sidebarOpen && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout/Back to Store */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-all text-left"
            title={!sidebarOpen ? "Logout" : ""}
          >
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
          <Link
            to="/"
            onClick={() => setMobileSidebarOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-all"
            title={!sidebarOpen ? "Kembali ke Toko" : ""}
          >
            {sidebarOpen && <span className="font-medium">Kembali ke Toko</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ml-0 ${sidebarOpen ? "md:ml-64" : "md:ml-20"}`}
      >
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-30">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                aria-label="Buka menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-800 truncate">Admin Panel - Sekawan Ring</h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-800">{user?.name || "Administrator"}</p>
                <p className="text-xs text-gray-600">{user?.email || ""}</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
