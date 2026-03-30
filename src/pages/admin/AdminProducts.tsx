import { useState, useEffect } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, Tooltip, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { Package, Plus, Search, Filter, ChevronDown, Archive, DollarSign, AlertTriangle, Edit, Trash2, UploadCloud, X as XIcon, CheckCircle, Loader, FileText, Tag, ClipboardList, Calendar, Hash, Image as ImageIcon, Eye, EyeOff } from "lucide-react";
import { catalogService, itemService } from "../../services";
import type { Catalog, Item } from "../../types";

interface InventoryOverview {
  totalUnits: number;
  activeProducts: number;
  outOfStock: number;
  lowStock: number;
  totalValue: number;
}

interface ProductStock {
  name: string;
  stok: number;
  terjual: number;
  harga: number;
}

interface StockAlertDetail {
  id: number;
  name: string;
  catalog: string;
  stock: number;
  price: number;
  status: "out" | "critical" | "warning";
}

interface CategorySale {
  name: string;
  value: number;
  color: string;
}

interface ProductFormData {
  id?: number;
  catalog_id: number;
  name: string;
  price: number;
  stock: number;
  type: string;
  description: string;
  age_months: number;
  certificate: string;
  certificate_password: string;
  image_url: string;
  gaya_main: string;
  body: string;
  materi: string;
  volume: string;
  panjang_ekor: string;
  warna: string;
  warna_kaki: string;
  paruh: string;
  jenis_kepala: string;
  voer: string;
  extra_fooding: string;
  embun: string;
  jemur: string;
  mandi: string;
  tenggar: string;
  krodong_ablak: string;
  // media files (not sent directly in JSON)
  certificate_file?: File | null;
  image_file?: File | null;
  video_file?: File | null;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Item[]>([]);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCatalog, setSelectedCatalog] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [inventoryOverview, setInventoryOverview] = useState<InventoryOverview>({
    totalUnits: 0,
    activeProducts: 0,
    outOfStock: 0,
    lowStock: 0,
    totalValue: 0,
  });
  const [stockAlerts, setStockAlerts] = useState<StockAlertDetail[]>([]);
  const [showAlertDetails, setShowAlertDetails] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [showCertPassword, setShowCertPassword] = useState(false);
  const [passwordCache, setPasswordCache] = useState<Record<number, string>>({});

  const [formData, setFormData] = useState<ProductFormData>({
    catalog_id: 0,
    name: "",
    price: 0,
    stock: 1,
    type: "",
    description: "",
    age_months: 0,
    certificate: "",
    certificate_password: "",
    image_url: "",
    gaya_main: "",
    body: "",
    materi: "",
    volume: "",
    panjang_ekor: "",
    warna: "",
    warna_kaki: "",
    paruh: "",
    jenis_kepala: "",
    voer: "",
    extra_fooding: "",
    embun: "",
    jemur: "",
    mandi: "",
    tenggar: "",
    krodong_ablak: "",
    certificate_file: null,
    image_file: null,
    video_file: null,
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
      const catalogsData = await catalogService.getAllCatalogs();
      setCatalogs(catalogsData);
      const allProducts = await itemService.getAllItems();
      setProducts(allProducts);
    } catch (error: any) {
      console.error("Error loading data:", error);
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

    const outOfStockProducts = products.filter((p) => p.stock === 0);
    const criticalStock = products.filter((p) => p.stock > 0 && p.stock <= 3);
    const warningStock = products.filter((p) => p.stock > 3 && p.stock <= 5);

    const alerts: StockAlertDetail[] = [
      ...outOfStockProducts.map((p) => ({
        id: p.id,
        name: p.name,
        catalog: getCatalogName(p.catalog_id),
        stock: p.stock,
        price: p.price,
        status: "out" as const,
      })),
      ...criticalStock.map((p) => ({
        id: p.id,
        name: p.name,
        catalog: getCatalogName(p.catalog_id),
        stock: p.stock,
        price: p.price,
        status: "critical" as const,
      })),
      ...warningStock.map((p) => ({
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

  const handleOpenModal = (product?: Item) => {
    if (product) {
      setEditMode(true);
      const existingPassword = (product as any).certificate_password;
      const cachedPassword = passwordCache[product.id];
      setFormData({
        id: product.id,
        catalog_id: product.catalog_id,
        name: product.name,
        price: product.price,
        stock: product.stock, // Use current stock for editing
        type: product.type || "",
        description: product.description,
        age_months: product.age_months || 0,
        certificate: product.certificate || "",
        certificate_password: (existingPassword as string) || cachedPassword || "",
        image_url: product.image_url || "",
        gaya_main: product.gaya_main || "",
        body: product.body || "",
        materi: product.materi || "",
        volume: product.volume || "",
        panjang_ekor: product.panjang_ekor || "",
        warna: product.warna || "",
        warna_kaki: product.warna_kaki || "",
        paruh: product.paruh || "",
        jenis_kepala: product.jenis_kepala || "",
        voer: product.voer || "",
        extra_fooding: product.extra_fooding || "",
        embun: product.embun || "",
        jemur: product.jemur || "",
        mandi: product.mandi || "",
        tenggar: product.tenggar || "",
        krodong_ablak: product.krodong_ablak || "",
        certificate_file: null,
        image_file: null,
        video_file: null,
      });
    } else {
      setEditMode(false);
      setFormData({
        catalog_id: catalogs[0]?.id || 0,
        name: "",
        price: 0,
        stock: 1,
        type: "",
        description: "",
        age_months: 0,
        certificate: "",
        certificate_password: "",
        image_url: "",
        gaya_main: "",
        body: "",
        materi: "",
        volume: "",
        panjang_ekor: "",
        warna: "",
        warna_kaki: "",
        paruh: "",
        jenis_kepala: "",
        voer: "",
        extra_fooding: "",
        embun: "",
        jemur: "",
        mandi: "",
        tenggar: "",
        krodong_ablak: "",
        certificate_file: null,
        image_file: null,
        video_file: null,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setUploadProgress("");
    setUploadingFile(false);
  };

  const handleSaveProduct = async () => {
    if (!formData.catalog_id || !formData.name || !formData.price || !formData.description) {
      alert("Harap isi semua field wajib (*)");
      return;
    }

    try {
      const { id, certificate_file, image_file, video_file, ...plainPayload } = formData;
      const media = {
        certificate_path: certificate_file || undefined,
        image_path: image_file || undefined,
        video_path: video_file || undefined,
      };

      let savedItem: Item | null = null;

      if (editMode && id) {
        savedItem = await itemService.updateItem(id, plainPayload, media);
        alert("✅ Produk berhasil diupdate!");
      } else {
        savedItem = await itemService.createItem(plainPayload as any, media);
        alert("✅ Produk berhasil ditambahkan!");
      }

      // Cache password sertifikat di sisi frontend supaya tetap tampil saat edit,
      // meskipun backend tidak meng-echo kembali field certificate_password.
      const effectiveId = editMode && id ? id : savedItem?.id;
      if (effectiveId && formData.certificate_password) {
        setPasswordCache((prev) => ({
          ...prev,
          [effectiveId]: formData.certificate_password,
        }));
      }

      handleCloseModal();
      await loadData();
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

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || product.description.toLowerCase().includes(searchQuery.toLowerCase());
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

  const getStockPerCatalog = (): ProductStock[] => {
    return catalogs.map((cat) => ({
      name: cat.name,
      stok: products.filter((p) => p.catalog_id === cat.id).reduce((acc, p) => acc + p.stock, 0),
      terjual: Math.floor(Math.random() * 100), // Mock sold data
      harga: 500000,
    }));
  };

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
  const salesByCategory: CategorySale[] = catalogs.map((cat, i) => ({
    name: cat.name,
    value: products.filter((p) => p.catalog_id === cat.id).length,
    color: ["#10b981", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ef4444", "#ec4899", "#14b8a6"][i % 7],
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Manajemen Produk</h2>
          <p className="text-gray-600 mt-1">Kelola katalog, stok, dan performa produk burung Anda.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-md flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" />
          <span>Tambah Produk</span>
        </button>
      </div>

      {/* Inventory Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 rounded-2xl border-2 border-emerald-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
          <div className="flex items-start justify-between">
            <div className="bg-emerald-200 text-emerald-600 w-12 h-12 rounded-xl flex items-center justify-center">
              <Archive className="w-6 h-6" />
            </div>
            <div className="text-right">
              <p className="text-emerald-700 text-sm font-medium">Total Stok</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">{inventoryOverview.totalUnits.toLocaleString("id-ID")}</h3>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-emerald-200/70 flex justify-between text-xs">
            <span className="text-emerald-700">Produk aktif:</span>
            <span className="font-semibold text-emerald-800">{inventoryOverview.activeProducts}</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-2xl border-2 border-blue-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
          <div className="flex items-start justify-between">
            <div className="bg-blue-200 text-blue-600 w-12 h-12 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="text-right">
              <p className="text-blue-700 text-sm font-medium">Nilai Aset</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">{formatCurrency(inventoryOverview.totalValue).replace("Rp", "Rp ")}</h3>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200/70 text-xs text-blue-700">
            Rata-rata: <span className="font-semibold">{formatCurrency(inventoryOverview.totalValue / (inventoryOverview.activeProducts || 1))}</span>
            /produk
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-2xl border-2 border-amber-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
          <div className="flex items-start justify-between">
            <div className="bg-amber-200 text-amber-600 w-12 h-12 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-right">
              <p className="text-amber-700 text-sm font-medium">Perlu Perhatian</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">{inventoryOverview.lowStock + inventoryOverview.outOfStock}</h3>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-amber-200/70 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-red-600 font-medium">Habis:</span>
              <span className="font-semibold text-red-700">{inventoryOverview.outOfStock} produk</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-amber-600 font-medium">Menipis:</span>
              <span className="font-semibold text-amber-700">{inventoryOverview.lowStock} produk</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Alerts Detail Section */}
      {stockAlerts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-red-50/50 via-amber-50/50 to-yellow-50/50 cursor-pointer hover:bg-opacity-75 transition-colors" onClick={() => setShowAlertDetails(!showAlertDetails)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="font-bold text-gray-800">Peringatan Stok ({stockAlerts.length} produk)</h3>
                  <p className="text-sm text-gray-600">Klik untuk {showAlertDetails ? "sembunyikan" : "lihat"} detail</p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-500 transform transition-transform ${showAlertDetails ? "rotate-180" : ""}`} />
            </div>
          </div>

          {showAlertDetails && (
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {stockAlerts.map((alert) => (
                <div key={alert.id} className={`p-3 flex items-center justify-between gap-4 ${alert.status === "out" ? "bg-red-50/50" : alert.status === "critical" ? "bg-orange-50/50" : "bg-yellow-50/50"}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${alert.status === "out" ? "bg-red-600" : alert.status === "critical" ? "bg-orange-500" : "bg-yellow-500"}`}>
                      {alert.status === "out" ? "HABIS" : alert.status === "critical" ? "KRITIS" : "TIPIS"}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{alert.name}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{alert.catalog}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className={`text-sm font-bold ${alert.status === "out" ? "text-red-700" : "text-gray-800"}`}>{alert.stock} ekor</span>
                    <button
                      onClick={() => {
                        const product = products.find((p) => p.id === alert.id);
                        if (product) handleOpenModal(product);
                      }}
                      className="p-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors"
                      title="Edit Stok"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Inventory Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
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

        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Distribusi Jenis Katalog</h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-full sm:w-1/2 h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={salesByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {salesByCategory.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} produk`, "Total"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2 min-w-0">
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">Top 5 Produk (Nilai Stok Tertinggi)</h3>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-gray-100">
          {topProducts.map((p) => (
            <div key={p.id} className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-500 truncate">{p.type}</p>
                  <p className="text-xs text-gray-500 truncate">{getCatalogName(p.catalog_id)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Harga</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(p.price)}</p>
                </div>
              </div>
              <div className="pt-1 text-sm font-semibold text-emerald-600">
                Nilai aset: {formatCurrency(p.price * p.stock)}
              </div>
            </div>
          ))}
          {topProducts.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-500">Belum ada produk dalam daftar ini.</div>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Katalog</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nilai Aset</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 min-w-[200px]">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            <ImageIcon className="w-5 h-5 text-gray-400" />
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
                    <td className="px-6 py-4 text-sm font-semibold text-emerald-600">{formatCurrency(p.price * p.stock)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="search-product" className="block text-sm font-medium text-gray-700 mb-2">
              Cari Produk
            </label>
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="search-product"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau deskripsi..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          <div>
            <label htmlFor="filter-catalog" className="block text-sm font-medium text-gray-700 mb-2">
              Filter Katalog
            </label>
            <div className="relative">
              <Filter className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                id="filter-catalog"
                value={selectedCatalog}
                onChange={(e) => setSelectedCatalog(e.target.value === "all" ? "all" : Number(e.target.value))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
              >
                <option value="all">Semua Katalog</option>
                {catalogs.map((catalog) => (
                  <option key={catalog.id} value={catalog.id}>
                    {catalog.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          Menampilkan {filteredProducts.length} dari {products.length} produk
        </div>
      </div>

      {/* Products Table */}
      <div id="products-table" className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-gray-100">
          {filteredProducts.map((product) => (
            <div key={product.id} className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-7 h-7 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500 truncate">{product.type}</p>
                  <p className="text-xs text-gray-500 truncate">{getCatalogName(product.catalog_id)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Harga</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(product.price)}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => handleOpenModal(product)}
                  className="px-3 py-1.5 text-xs text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="px-3 py-1.5 text-xs text-red-600 border border-red-100 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus
                </button>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-500">Tidak ada produk yang cocok dengan filter.</div>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Katalog</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 min-w-[200px]">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
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
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(product)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">{editMode ? "Edit Produk" : "Tambah Produk Baru"}</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100">
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama Produk *</label>
                  <div className="relative">
                    <Package className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="Contoh: Murai Batu Medan"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Katalog *</label>
                  <div className="relative">
                    <ClipboardList className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={formData.catalog_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          catalog_id: Number(e.target.value),
                        })
                      }
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 appearance-none"
                      required
                    >
                      <option value={0}>Pilih Katalog</option>
                      {catalogs.map((catalog) => (
                        <option key={catalog.id} value={catalog.id}>
                          {catalog.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Harga (Rp) *</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: Number(e.target.value),
                        })
                      }
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stok *</label>
                  <div className="relative">
                    <Archive className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          stock: Number(e.target.value),
                        })
                      }
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipe/Jenis</label>
                  <div className="relative">
                    <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="Contoh: Burung Kicau"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Umur (Bulan)</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      value={formData.age_months}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          age_months: Number(e.target.value),
                        })
                      }
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sertifikat (Gambar)</label>
                <div className="space-y-2">
                  <div className="relative">
                    <UploadCloud className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="file"
                      id="certificate-upload"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setFormData({
                          ...formData,
                          certificate_file: file,
                          certificate: file ? file.name : formData.certificate,
                        });
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="certificate-upload"
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 flex items-center cursor-pointer hover:bg-gray-50"
                    >
                      <span className="text-gray-500">
                        {formData.certificate_file ? "Ganti gambar sertifikat..." : "Pilih gambar sertifikat..."}
                      </span>
                    </label>
                  </div>

                  {formData.certificate_file && (
                    <div className="mt-1 flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                        <img
                          src={URL.createObjectURL(formData.certificate_file)}
                          alt="Preview sertifikat"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] text-gray-500 mb-0.5">File:</p>
                        <p className="text-[11px] text-gray-700 break-all font-mono">{formData.certificate_file.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password Sertifikat</label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showCertPassword ? "text" : "password"}
                    value={formData.certificate_password}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        certificate_password: e.target.value,
                      })
                    }
                    className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="Password yang akan dikirim ke pembeli"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCertPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCertPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-gray-500">
                  Password ini akan disimpan di data burung dan digunakan pembeli untuk membuka sertifikat di halaman toko.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi *</label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    rows={4}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="Deskripsi produk..."
                    required
                  />
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4 mt-2">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Detail Per Ekor & Setting</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Gaya Main</label>
                    <input
                      type="text"
                      value={formData.gaya_main}
                      onChange={(e) => setFormData({ ...formData, gaya_main: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                      placeholder="Contoh: Nagen, Ngalas, dll"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Body</label>
                    <input
                      type="text"
                      value={formData.body}
                      onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                      placeholder="Contoh: Ideal, Besar, Kecil"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Materi</label>
                    <input
                      type="text"
                      value={formData.materi}
                      onChange={(e) => setFormData({ ...formData, materi: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                      placeholder="Isi materi lagu"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Volume</label>
                    <input
                      type="text"
                      value={formData.volume}
                      onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                      placeholder="Contoh: Keras, Sedang"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Panjang Ekor</label>
                    <input
                      type="text"
                      value={formData.panjang_ekor}
                      onChange={(e) => setFormData({ ...formData, panjang_ekor: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                      placeholder="Contoh: 18 cm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Warna</label>
                    <input
                      type="text"
                      value={formData.warna}
                      onChange={(e) => setFormData({ ...formData, warna: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                      placeholder="Dominan warna bulu"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Warna Kaki</label>
                    <input
                      type="text"
                      value={formData.warna_kaki}
                      onChange={(e) => setFormData({ ...formData, warna_kaki: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                      placeholder="Contoh: Hitam, Pink"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Paruh</label>
                    <input
                      type="text"
                      value={formData.paruh}
                      onChange={(e) => setFormData({ ...formData, paruh: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                      placeholder="Bentuk/warna paruh"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Jenis Kepala</label>
                    <input
                      type="text"
                      value={formData.jenis_kepala}
                      onChange={(e) => setFormData({ ...formData, jenis_kepala: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                      placeholder="Contoh: Kotak, Lonjong"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Voer</label>
                    <input
                      type="text"
                      value={formData.voer}
                      onChange={(e) => setFormData({ ...formData, voer: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                      placeholder="Merk & takaran voer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Extra Fooding</label>
                    <input
                      type="text"
                      value={formData.extra_fooding}
                      onChange={(e) => setFormData({ ...formData, extra_fooding: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                      placeholder="Jangkrik, kroto, dll"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Embun</label>
                    <input
                      type="text"
                      value={formData.embun}
                      onChange={(e) => setFormData({ ...formData, embun: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                      placeholder="Frekuensi embun"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Jemur</label>
                    <input
                      type="text"
                      value={formData.jemur}
                      onChange={(e) => setFormData({ ...formData, jemur: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                      placeholder="Durasi & jam jemur"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Mandi</label>
                    <input
                      type="text"
                      value={formData.mandi}
                      onChange={(e) => setFormData({ ...formData, mandi: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                      placeholder="Frekuensi mandi"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tenggar</label>
                    <input
                      type="text"
                      value={formData.tenggar}
                      onChange={(e) => setFormData({ ...formData, tenggar: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                      placeholder="Posisi & tipe tenggar"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Krodong / Ablak</label>
                    <input
                      type="text"
                      value={formData.krodong_ablak}
                      onChange={(e) => setFormData({ ...formData, krodong_ablak: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                      placeholder="Pola krodong/ablag"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Media (Gambar/Video)</label>
                <div className="flex gap-3 items-center">
                  <div className="relative flex-1">
                    <UploadCloud className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="file"
                      id="file-upload"
                      accept="image/*,video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        const isVideo = file ? file.type.startsWith("video/") : false;
                        setFormData({
                          ...formData,
                          image_file: !isVideo ? file : formData.image_file,
                          video_file: isVideo ? file : formData.video_file,
                          image_url: !isVideo && file ? file.name : formData.image_url,
                        });
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 flex items-center cursor-pointer hover:bg-gray-50"
                    >
                      <span className="text-gray-500">{formData.image_file || formData.video_file ? "Ganti file media..." : "Pilih file media..."}</span>
                    </label>
                  </div>
                </div>
                {(formData.image_file || formData.video_file) && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 mb-1">File media terpilih:</p>
                      <p className="text-xs text-blue-700 break-all font-mono">
                        {formData.image_file?.name || formData.video_file?.name}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button onClick={handleCloseModal} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                Batal
              </button>
              <button onClick={handleSaveProduct} className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                {editMode ? "Update Produk" : "Tambah Produk"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
