import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  LogOut,
  Store,
  PanelLeftClose,
  PanelRightClose,
  Menu as MenuIcon,
} from "lucide-react";
import { authService } from "../../services";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      name: "Sales Summary",
      path: "/admin",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      name: "Stock Summary",
      path: "/admin/products",
      icon: <Package className="w-5 h-5" />,
    },
    {
      name: "Order Status",
      path: "/admin/orders",
      icon: <ShoppingCart className="w-5 h-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-gradient-to-br from-emerald-600 to-teal-600 text-white transition-all duration-300 z-40 transform lg:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${sidebarOpen ? "w-64" : "w-20"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 h-16">
          {(sidebarOpen || mobileSidebarOpen) && (
            <Link to="/admin" className="text-xl font-bold whitespace-nowrap">
              Admin Panel
            </Link>
          )}

          {/* Desktop: collapse */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:block p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="w-5 h-5" />
            ) : (
              <PanelRightClose className="w-5 h-5" />
            )}
          </button>

          {/* Mobile: close */}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Tutup menu"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-2 space-y-2 mt-2">
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
                } ${!sidebarOpen && "justify-center"}`}
                title={!sidebarOpen ? item.name : ""}
              >
                {item.icon}
                {sidebarOpen && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout/Back to Store */}
        <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-white/10">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-all text-left ${
              !sidebarOpen && "justify-center"
            }`}
            title={!sidebarOpen ? "Logout" : ""}
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
          <Link
            to="/"
            onClick={() => setMobileSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-all ${
              !sidebarOpen && "justify-center"
            }`}
            title={!sidebarOpen ? "Kembali ke Toko" : ""}
          >
            <Store className="w-5 h-5" />
            {sidebarOpen && (
              <span className="font-medium">Kembali ke Toko</span>
            )}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? "lg:ml-64" : "lg:ml-20"
        }`}
      >
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-20 h-16 flex items-center">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                aria-label="Buka menu"
              >
                <MenuIcon className="w-5 h-5" />
              </button>
              <h1 className="text-lg sm:text-xl font-bold text-gray-800 truncate">
                {menuItems.find((item) => item.path === location.pathname)
                  ?.name || "Admin Panel"}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-800">
                  {user?.name || "Administrator"}
                </p>
                <p className="text-xs text-gray-600">{user?.email || ""}</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
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
