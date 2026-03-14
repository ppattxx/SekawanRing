  import { useState, useEffect } from "react";
  import { BarChart, Bar, PieChart, Pie, Cell, Tooltip, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
  import { catalogService, itemService } from "../../services";
  import type { Catalog, Item } from "../../types";

  interface ProductFormData {
    id?: number;
    catalog_id: number;
    name: string;
    price: number;
    stock: number;
    type: string;
    description: string;
    age_months?: number;
    certificate?: string;
    image_url?: string;
  }

  interface InventoryStats {
    lowStock: number;
    outOfStock: number;
    totalValue: number;
    totalProducts: number;
  }

  interface InventoryOverview {
    totalUnits: number;
    activeProducts: number;
    outOfStock: number;
    lowStock: number;
    totalValue: number;
  }

  interface StockAlertDetail {
    id: number;
    name: string;
    catalog: string;
    stock: number;
    price: number;
    status: "out" | "critical" | "warning";
  }

  interface ProductStock {
    name: string;
    stok: number;
    terjual: number;
    harga: number;
  }

  interface CategorySale {
    name: string;
    value: number;
    color: string;
  }

  export default function AdminProducts() {
    const [products, setProducts] = useState<Item[]>([]);
    const [catalogs, setCatalogs] = useState<Catalog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCatalog, setSelectedCatalog] = useState<number | "all">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [inventoryStats, setInventoryStats] = useState<InventoryStats>({
      lowStock: 0,
      outOfStock: 0,
      totalValue: 0,
      totalProducts: 0,
    });
    const [inventoryOverview, setInventoryOverview] = useState<InventoryOverview>({
      totalUnits: 0,
      activeProducts: 0,
      outOfStock: 0,
      lowStock: 0,
      totalValue: 0,
    });
    const [stockAlerts, setStockAlerts] = useState<StockAlertDetail[]>([]);
    const [showAlertDetails, setShowAlertDetails] = useState(false);

    const [formData, setFormData] = useState<ProductFormData>({
      catalog_id: 0,
      name: "",
      price: 0,
      stock: 0,
      type: "",
      description: "",
      age_months: 0,
      certificate: "",
      image_url: "",
    });

    useEffect(() => {
      loadData();
    }, []);

    useEffect(() => {
      if (products.length > 0) {
        calculateInventoryStats();
      }
    }, [products]);

    const loadData = async () => {
  try {
    setLoading(true);
    
    // Load catalogs first
    const catalogsData = await catalogService.getAllCatalogs();
    setCatalogs(catalogsData);
    
    // Load all items (lebih efisien daripada loop per catalog)
    const allProducts = await itemService.getAllItems();
    setProducts(allProducts);
    
  } catch (error: any) {
    console.error("Error loading data:", error);
    // Optional: show toast notification
  } finally {
    setLoading(false);
  }
};

    const calculateInventoryStats = () => {
      const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);
      const activeProducts = products.filter((p) => p.stock > 0).length;
      const outOfStock = products.filter((p) => p.stock === 0).length;
      const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
      const totalValue = products.reduce((acc, p) => acc + p.price * p.stock, 0);
      
      setInventoryOverview({
        totalUnits,
        activeProducts,
        outOfStock,
        lowStock,
        totalValue,
      });

      // Legacy stats for backward compatibility
      setInventoryStats({
        lowStock: lowStock,
        outOfStock: outOfStock,
        totalValue: totalValue,
        totalProducts: products.length,
      });
      
      // Siapkan detail alerts
      const outOfStockProducts = products.filter((p) => p.stock === 0);
      const criticalStock = products.filter((p) => p.stock > 0 && p.stock <= 3);
      const warningStock = products.filter((p) => p.stock > 3 && p.stock <= 5);
      
      const alerts: StockAlertDetail[] = [
        ...outOfStockProducts.map(p => ({
          id: p.id,
          name: p.name,
          catalog: getCatalogName(p.catalog_id),
          stock: p.stock,
          price: p.price,
          status: "out" as const,
        })),
        ...criticalStock.map(p => ({
          id: p.id,
          name: p.name,
          catalog: getCatalogName(p.catalog_id),
          stock: p.stock,
          price: p.price,
          status: "critical" as const,
        })),
        ...warningStock.map(p => ({
          id: p.id,
          name: p.name,
          catalog: getCatalogName(p.catalog_id),
          stock: p.stock,
          price: p.price,
          status: "warning" as const,
        })),
      ];
      
      setStockAlerts(alerts.sort((a, b) => a.stock - b.stock));
    };

    // Helper untuk hitung total unit per status
    const getTotalUnitsByStatus = (status: "out" | "critical" | "warning") => {
      return stockAlerts
        .filter(a => a.status === status)
        .reduce((sum, item) => sum + item.stock, 0);
    };

    const handleOpenModal = (product?: Item) => {
      if (product) {
        setEditMode(true);
        setFormData({
          id: product.id,
          catalog_id: product.catalog_id,
          name: product.name,
          price: product.price,
          stock: product.stock,
          type: product.type || "",
          description: product.description,
          age_months: product.age_months || 0,
          certificate: product.certificate || "",
          image_url: product.image_url || "",
        });
      } else {
        setEditMode(false);
        setFormData({
          catalog_id: catalogs[0]?.id || 0,
          name: "",
          price: 0,
          stock: 0,
          type: "",
          description: "",
          age_months: 0,
          certificate: "",
          image_url: "",
        });
      }
      setShowModal(true);
    };

    const handleCloseModal = () => {
      setShowModal(false);
      setEditMode(false);
      setFormData({
        catalog_id: 0,
        name: "",
        price: 0,
        stock: 0,
        type: "",
        description: "",
        age_months: 0,
        certificate: "",
        image_url: "",
      });
    };

    const handleSaveProduct = async () => {
  // Validasi minimal
  if (!formData.catalog_id || !formData.name || !formData.price || !formData.description) {
    alert("Harap isi semua field wajib (*)");
    return;
  }

  try {
    if (editMode && formData.id) {
      // ✅ Update existing product
      const { id, ...updatePayload } = formData;
      await itemService.updateItem(id, updatePayload);
      alert("✅ Produk berhasil diupdate!");
    } else {
      // ✅ Create new product
      await itemService.createItem(formData);
      alert("✅ Produk berhasil ditambahkan!");
    }
    
    handleCloseModal();
    await loadData(); // Refresh data
    
  } catch (error: any) {
    console.error("Error saving product:", error);
    const errorMsg = error.response?.data?.message || "Gagal menyimpan produk!";
    alert(`❌ ${errorMsg}`);
  }
};

    const handleDeleteProduct = async (productId: number) => {
  if (!window.confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;
  
  try {
    await itemService.deleteItem(productId);
    alert("✅ Produk berhasil dihapus!");
    await loadData();
  } catch (error: any) {
    console.error("Error deleting product:", error);
    const errorMsg = error.response?.data?.message || "Gagal menghapus produk!";
    alert(`❌ ${errorMsg}`);
  }
};

    const handleUpdateStock = async (productId: number, newStock: number) => {
  if (newStock < 0) {
    alert("Stok tidak boleh negatif!");
    return;
  }
  
  try {
    await itemService.updateStock(productId, newStock);
    
    // Optimistic update untuk UX yang lebih smooth
    setProducts(products.map(p => 
      p.id === productId ? { ...p, stock: newStock } : p
    ));
    
    // Optional: small toast instead of alert
    // toast.success("Stok berhasil diupdate!");
    
  } catch (error: any) {
    console.error("Error updating stock:", error);
    alert("❌ Gagal mengupdate stok!");
    // Revert optimistic update jika perlu
    await loadData();
  }
};

    const filteredProducts = products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCatalog = selectedCatalog === "all" || product.catalog_id === selectedCatalog;
      return matchesSearch && matchesCatalog;
    });

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(amount);
    };

    const getCatalogName = (catalogId: number) => {
      return catalogs.find((c) => c.id === catalogId)?.name || "Unknown";
    };

    // Calculate stock per catalog for bar chart
    const getStockPerCatalog = (): ProductStock[] => {
      return catalogs.map((cat) => ({
        name: cat.name,
        stok: products.filter((p) => p.catalog_id === cat.id).reduce((acc, p) => acc + p.stock, 0),
        terjual: Math.floor(Math.random() * 100), // Mock sold data
        harga: 500000,
      }));
    };

    // Get top products by stock value
    const getTopProducts = () => {
      return [...products]
        .map((p) => ({ ...p, value: p.price * p.stock }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      );
    }

    const stockPerCatalog = getStockPerCatalog();
    
    const topProducts = getTopProducts();

    // Pie chart data
    const salesByCategory: CategorySale[] = catalogs.map((cat, i) => ({
      name: cat.name,
      value: products.filter((p) => p.catalog_id === cat.id).length,
      color: ["#10b981", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ef4444", "#ec4899", "#14b8a6"][i % 7],
    }));

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Product & Inventory</h2>
            <p className="text-gray-600 mt-1">Kelola katalog, stok, dan performa produk burung</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors shadow-md"
          >
            Tambah Produk
          </button>
        </div>

        {/* INVENTORY DASHBOARD */}
        
        {/* Simplified Inventory Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Stock Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-2xl border-2 border-emerald-200 shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-emerald-600 text-sm font-medium">Total Stok</p>
                <h3 className="text-4xl font-bold text-gray-800 mt-2">
                  {inventoryOverview.totalUnits.toLocaleString('id-ID')}
                </h3>
                <p className="text-emerald-600 text-xs mt-1">ekor burung</p>
                
                <div className="mt-3 pt-3 border-t border-emerald-200 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-700">Produk aktif:</span>
                    <span className="font-semibold text-emerald-800">
                      {inventoryOverview.activeProducts}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-700">Total varian:</span>
                    <span className="font-semibold text-emerald-800">
                      {products.length}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-emerald-200 w-12 h-12 rounded-xl" />
            </div>
          </div>

          {/* Nilai Total Aset Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border-2 border-blue-200 shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Nilai Total Aset</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-2">
                  {formatCurrency(inventoryOverview.totalValue)}
                </h3>
                <p className="text-blue-500 text-xs mt-1">dari stok tersedia</p>
                
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-xs text-blue-700">
                    Rata-rata: <span className="font-semibold">
                      {formatCurrency(inventoryOverview.totalValue / (inventoryOverview.activeProducts || 1))}
                    </span> /produk
                  </p>
                </div>
              </div>
              <div className="bg-blue-200 w-12 h-12 rounded-xl" />
            </div>
          </div>

          {/* Rekomendasi Card */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border-2 border-purple-200 shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Rekomendasi</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-2">
                  {inventoryOverview.lowStock > 0 ? (
                    <span className="text-amber-600">{inventoryOverview.lowStock} produk</span>
                  ) : inventoryOverview.outOfStock > 0 ? (
                    <span className="text-red-600">{inventoryOverview.outOfStock} produk</span>
                  ) : (
                    <span className="text-emerald-600">Stok Aman</span>
                  )}
                </h3>
                <p className="text-purple-500 text-xs mt-1">perlu perhatian</p>
                
                <div className="mt-3 pt-3 border-t border-purple-200">
                  {inventoryOverview.outOfStock > 0 && (
                    <p className="text-xs text-red-600 font-medium mb-1">
                      {inventoryOverview.outOfStock} habis total
                    </p>
                  )}
                  {inventoryOverview.lowStock > 0 && (
                    <p className="text-xs text-amber-600 font-medium">
                      {inventoryOverview.lowStock} menipis (≤5)
                    </p>
                  )}
                  {inventoryOverview.outOfStock === 0 && inventoryOverview.lowStock === 0 && (
                    <p className="text-xs text-emerald-600 font-medium">
                      Semua stok dalam kondisi baik
                    </p>
                  )}
                </div>
              </div>
              <div className="bg-purple-200 w-12 h-12 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Live Stock Alert Banner */}
        {(inventoryOverview.outOfStock > 0 || inventoryOverview.lowStock > 0) && (
          <div className="bg-gradient-to-r from-amber-50 to-red-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-800 mb-1">
                  Peringatan Stok
                </h4>
                <div className="flex flex-wrap gap-4 text-sm">
                  {inventoryOverview.outOfStock > 0 && (
                    <span className="text-red-600 font-medium">
                      {inventoryOverview.outOfStock} produk habis
                    </span>
                  )}
                  {inventoryOverview.lowStock > 0 && (
                    <span className="text-amber-600 font-medium">
                      {inventoryOverview.lowStock} produk stok menipis
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Lihat detail produk di bawah untuk tindakan segera
                </p>
              </div>
              <button
                onClick={() => document.getElementById('products-table')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex-shrink-0 px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded hover:bg-amber-600 transition-colors"
              >
                Lihat Detail
              </button>
            </div>
          </div>
        )}

        {inventoryOverview.outOfStock === 0 && inventoryOverview.lowStock === 0 && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-l-4 border-emerald-500 p-4 rounded-r-lg shadow-sm">
            <div className="flex items-center gap-3">
              <div>
                <h4 className="text-sm font-bold text-emerald-800">
                  Semua Stok dalam Kondisi Baik
                </h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  {inventoryOverview.totalUnits} ekor tersedia dari {inventoryOverview.activeProducts} produk
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stock Alerts Detail Section */}
        {stockAlerts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div 
              className="p-4 border-b border-gray-100 bg-gradient-to-r from-red-50 to-amber-50 cursor-pointer hover:bg-opacity-75 transition-colors"
              onClick={() => setShowAlertDetails(!showAlertDetails)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      Peringatan Stok ({stockAlerts.length} produk perlu perhatian)
                    </h3>
                    <p className="text-sm text-gray-600">
                      Klik untuk {showAlertDetails ? "sembunyikan" : "lihat"} detail produk
                    </p>
                  </div>
                </div>
                <svg 
                  className={`w-6 h-6 text-gray-500 transform transition-transform ${showAlertDetails ? "rotate-180" : ""}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {showAlertDetails && (
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {/* Out of Stock */}
                {stockAlerts.filter(a => a.status === "out").length > 0 && (
                  <div className="p-4 bg-red-50">
                    <h4 className="text-sm font-bold text-red-800 mb-3 flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-red-600 text-white rounded text-xs">HABIS</span>
                      Stok = 0 ({stockAlerts.filter(a => a.status === "out").length} produk)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {stockAlerts.filter(a => a.status === "out").map(alert => (
                        <div key={alert.id} className="bg-white p-3 rounded-lg border border-red-200 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-800 truncate">{alert.name}</p>
                              <p className="text-xs text-gray-600 mt-1">{alert.catalog}</p>
                              <p className="text-xs text-red-600 font-medium mt-2">
                                Harga: {formatCurrency(alert.price)}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                const product = products.find(p => p.id === alert.id);
                                if (product) handleOpenModal(product);
                              }}
                              className="ml-2 p-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors"
                              title="Edit Stok"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Critical Stock (1-3) */}
                {stockAlerts.filter(a => a.status === "critical").length > 0 && (
                  <div className="p-4 bg-orange-50">
                    <h4 className="text-sm font-bold text-orange-800 mb-3 flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-orange-500 text-white rounded text-xs">KRITIS</span>
                      Stok 1-3 unit ({stockAlerts.filter(a => a.status === "critical").length} produk)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {stockAlerts.filter(a => a.status === "critical").map(alert => (
                        <div key={alert.id} className="bg-white p-3 rounded-lg border border-orange-200 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-800 truncate">{alert.name}</p>
                              <p className="text-xs text-gray-600 mt-1">{alert.catalog}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                                  {alert.stock} ekor
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatCurrency(alert.price)}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const product = products.find(p => p.id === alert.id);
                                if (product) handleOpenModal(product);
                              }}
                              className="ml-2 p-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors"
                              title="Edit Stok"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warning Stock (4-5) */}
                {stockAlerts.filter(a => a.status === "warning").length > 0 && (
                  <div className="p-4 bg-yellow-50">
                    <h4 className="text-sm font-bold text-yellow-800 mb-3 flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-yellow-500 text-white rounded text-xs">PERINGATAN</span>
                      Stok 4-5 unit ({stockAlerts.filter(a => a.status === "warning").length} produk)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {stockAlerts.filter(a => a.status === "warning").map(alert => (
                        <div key={alert.id} className="bg-white p-3 rounded-lg border border-yellow-200 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-800 truncate">{alert.name}</p>
                              <p className="text-xs text-gray-600 mt-1">{alert.catalog}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                                  {alert.stock} ekor
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatCurrency(alert.price)}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const product = products.find(p => p.id === alert.id);
                                if (product) handleOpenModal(product);
                              }}
                              className="ml-2 p-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors"
                              title="Edit Stok"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Inventory Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Stok Sisa per Katalog</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stockPerCatalog} layout="vertical" margin={{ top: 0, right: 10, left: 60, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={55} />
                <Tooltip formatter={(v) => [`${v} ekor`, "Stok"]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="stok" name="Stok Tersisa" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Distribusi Jenis Katalog</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie
                    data={salesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {salesByCategory.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} produk`, "Total"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {salesByCategory.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 truncate">{item.name}</p>
                      <p className="text-sm font-bold text-gray-800">{item.value} produk</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Products Table */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-800">Top 5 Produk (Nilai Stok Tertinggi)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Katalog</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stok</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nilai Aset</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{p.name}</div>
                          <div className="text-xs text-gray-500">{p.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{getCatalogName(p.catalog_id)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency(p.price)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        p.stock > 10 ? "bg-green-100 text-green-800" :
                        p.stock > 0 ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-emerald-600">{formatCurrency(p.price * p.stock)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CRUD SECTION */}
        
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cari Produk</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama atau deskripsi..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter Katalog</label>
              <select
                value={selectedCatalog}
                onChange={(e) => setSelectedCatalog(e.target.value === "all" ? "all" : Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">Semua Katalog</option>
                {catalogs.map((catalog) => (
                  <option key={catalog.id} value={catalog.id}>{catalog.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Menampilkan {filteredProducts.length} dari {products.length} produk
          </div>
        </div>

        {/* Products Table - Tambahkan id */}
        <div id="products-table" className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Katalog</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stok</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{getCatalogName(product.catalog_id)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency(product.price)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                          product.stock > 10 ? "bg-green-100 text-green-800" :
                          product.stock > 0 ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {product.stock}
                        </span>
                        <input
                          type="number"
                          min="0"
                          defaultValue={product.stock}
                          onBlur={(e) => {
                            const newStock = parseInt(e.target.value);
                            if (newStock !== product.stock) {
                              handleUpdateStock(product.id, newStock);
                            }
                          }}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(product)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-800">{editMode ? "Edit Produk" : "Tambah Produk Baru"}</h3>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Katalog *</label>
                  <select
                    value={formData.catalog_id}
                    onChange={(e) => setFormData({ ...formData, catalog_id: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value={0}>Pilih Katalog</option>
                    {catalogs.map((catalog) => (
                      <option key={catalog.id} value={catalog.id}>{catalog.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama Produk *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="Contoh: Murai Batu Medan"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipe/Jenis</label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="Contoh: Burung Kicau"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Harga (Rp) *</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stok *</label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Umur (Bulan)</label>
                    <input
                      type="number"
                      value={formData.age_months}
                      onChange={(e) => setFormData({ ...formData, age_months: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sertifikat</label>
                    <input
                      type="text"
                      value={formData.certificate}
                      onChange={(e) => setFormData({ ...formData, certificate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="Nomor sertifikat"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="Deskripsi produk..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL Gambar</label>
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button onClick={handleCloseModal} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">Batal</button>
                <button onClick={handleSaveProduct} className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                  {editMode ? "Update Produk" : "Tambah Produk"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } 