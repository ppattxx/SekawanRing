import { useState, useEffect } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, Tooltip, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import {
  Package,
  Plus,
  Search,
  Filter,
  ChevronDown,
  Archive,
  DollarSign,
  AlertTriangle,
  Edit,
  Trash2,
  UploadCloud,
  X as XIcon,
  CheckCircle,
  FileText,
  Tag,
  ClipboardList,
  Calendar,
  Hash,
  Image as ImageIcon,
  Eye,
  EyeOff,
} from "lucide-react";
import { catalogService, itemService, orderService } from "../../services";
import type { Catalog, Item, Order } from "../../types";
import { showAlert, showConfirm } from "../../utils/appDialog";

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
  unavailableProducts: number;
  totalProducts: number;
  status: "out";
}

interface CategorySale {
  name: string;
  value: number;
  color: string;
}

interface ProductFormData {
  id?: number;
  catalog_id: number;
  code_ring: string;
  name: string;
  price: number;
  stock: number;
  type: string;
  jenis_kelamin: "" | "jantan" | "betina";
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

const MAX_CERTIFICATE_SIZE_MB = 2;
const MAX_IMAGE_SIZE_MB = 2;
const MAX_VIDEO_SIZE_MB = 5;

const bytesFromMb = (mb: number): number => mb * 1024 * 1024;

const compressVideoIfNeeded = async (file: File, maxSizeMb: number): Promise<File> => {
  if (!file.type.startsWith("video/")) return file;
  if (file.size <= bytesFromMb(maxSizeMb)) return file;

  const objectUrl = URL.createObjectURL(file);

  try {
    const video = document.createElement("video");
    video.src = objectUrl;
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Gagal membaca metadata video."));
    });

    const width = Math.max(320, Math.floor((video.videoWidth || 640) * 0.6));
    const height = Math.max(180, Math.floor((video.videoHeight || 360) * 0.6));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    const stream = canvas.captureStream(24);
    const mimeType =
      MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
          ? "video/webm;codecs=vp8"
          : "video/webm";

    const chunks: BlobPart[] = [];
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 900_000,
    });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    const drawFrame = () => {
      if (video.paused || video.ended) return;
      ctx.drawImage(video, 0, 0, width, height);
      requestAnimationFrame(drawFrame);
    };

    recorder.start(250);
    await video.play();
    drawFrame();

    await new Promise<void>((resolve) => {
      video.onended = () => {
        if (recorder.state !== "inactive") recorder.stop();
      };
      recorder.onstop = () => resolve();
    });

    const compressedBlob = new Blob(chunks, { type: mimeType });
    if (!compressedBlob.size || compressedBlob.size >= file.size) {
      return file;
    }

    const baseName = file.name.replace(/\.[^/.]+$/, "");
    return new File([compressedBlob], `${baseName}-compressed.webm`, {
      type: "video/webm",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Item[]>([]);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCatalog, setSelectedCatalog] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogEditMode, setCatalogEditMode] = useState(false);
  const [catalogFormData, setCatalogFormData] = useState<{ id: number; name: string; description: string; stock: number }>({
    id: 0,
    name: "",
    description: "",
    stock: 0,
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
  const [showCertPassword, setShowCertPassword] = useState(false);
  const [passwordCache, setPasswordCache] = useState<Record<number, string>>({});
  const [isCompressingVideo, setIsCompressingVideo] = useState(false);

  const [formData, setFormData] = useState<ProductFormData>({
    catalog_id: 0,
    code_ring: "",
    name: "",
    price: 0,
    stock: 1,
    type: "",
    jenis_kelamin: "",
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
    calculateInventoryStats();
  }, [products]);

  const loadData = async () => {
    try {
      setLoading(true);
      const catalogsData = await catalogService.getAllCatalogs();
      setCatalogs(catalogsData);
      const allProducts = await itemService.getAllItems();
      setProducts(allProducts);

      try {
        const allOrders = await orderService.getAllOrders();
        setOrders(Array.isArray(allOrders) ? allOrders : []);
      } catch (orderError) {
        console.warn("Gagal memuat data order untuk analitik produk:", orderError);
        setOrders([]);
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateInventoryStats = () => {
    const normalizeStock = (stock: unknown): number => {
      const num = Number(stock);
      return Number.isFinite(num) ? num : 0;
    };

    const toAvailability = (stock: unknown): number => (normalizeStock(stock) > 0 ? 1 : 0);

    const normalizePrice = (price: unknown): number => {
      const num = Number(price);
      return Number.isFinite(num) ? num : 0;
    };

    const totalUnits = products.reduce((sum, p) => sum + toAvailability(p.stock), 0);
    const activeProducts = products.filter((p) => toAvailability(p.stock) > 0).length;
    const outOfStock = products.filter((p) => normalizeStock(p.stock) === 0).length;
    const lowStock = 0;
    const totalValue = products.reduce((acc, p) => acc + normalizePrice(p.price) * toAvailability(p.stock), 0);

    setInventoryOverview({
      totalUnits,
      activeProducts,
      outOfStock,
      lowStock,
      totalValue,
    });

    const alerts: StockAlertDetail[] = catalogs
      .map((catalog) => {
        const catalogProducts = products.filter((p) => p.catalog_id === catalog.id);
        const unavailableProducts = catalogProducts.filter((p) => normalizeStock(p.stock) === 0).length;
        return {
          id: catalog.id,
          name: catalog.name,
          unavailableProducts,
          totalProducts: catalogProducts.length,
          status: "out" as const,
        };
      })
      .filter((catalogAlert) => catalogAlert.unavailableProducts > 0)
      .sort((a, b) => b.unavailableProducts - a.unavailableProducts);

    setStockAlerts(alerts);
  };

  const handleOpenModal = (product?: Item) => {
    if (product) {
      setEditMode(true);
      const existingPassword = (product as any).certificate_password;
      const cachedPassword = passwordCache[product.id];
      setFormData({
        id: product.id,
        catalog_id: product.catalog_id,
        code_ring: (product as any).code_ring || "",
        name: product.name,
        price: product.price,
        stock: 1,
        type: product.type || "",
        jenis_kelamin: (product.jenis_kelamin || product.gender || "") as "" | "jantan" | "betina",
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
        code_ring: "",
        name: "",
        price: 0,
        stock: 1,
        type: "",
        jenis_kelamin: "",
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
  };

  const handleSaveProduct = async () => {
    if (!formData.catalog_id || !formData.name || !formData.price || !formData.description) {
      await showAlert("Harap isi semua field wajib (*)", {
        title: "Validasi Form",
        tone: "warning",
      });
      return;
    }

    if (!formData.jenis_kelamin) {
      await showAlert("Jenis kelamin wajib dipilih (jantan/betina).", {
        title: "Validasi Form",
        tone: "warning",
      });
      return;
    }

    if (!Number.isFinite(formData.age_months) || formData.age_months < 1) {
      await showAlert("Umur produk wajib diisi minimal 1 bulan agar masuk kategori usia dengan benar.", {
        title: "Validasi Form",
        tone: "warning",
      });
      return;
    }

    if (formData.certificate_file && formData.certificate_file.size > bytesFromMb(MAX_CERTIFICATE_SIZE_MB)) {
      await showAlert(`Ukuran file sertifikat maksimal ${MAX_CERTIFICATE_SIZE_MB}MB.`, {
        title: "Ukuran File Tidak Valid",
        tone: "warning",
      });
      return;
    }

    if (formData.image_file && formData.image_file.size > bytesFromMb(MAX_IMAGE_SIZE_MB)) {
      await showAlert(`Ukuran gambar maksimal ${MAX_IMAGE_SIZE_MB}MB.`, {
        title: "Ukuran File Tidak Valid",
        tone: "warning",
      });
      return;
    }

    if (formData.video_file && formData.video_file.size > bytesFromMb(MAX_VIDEO_SIZE_MB)) {
      await showAlert(`Ukuran video maksimal ${MAX_VIDEO_SIZE_MB}MB.`, {
        title: "Ukuran File Tidak Valid",
        tone: "warning",
      });
      return;
    }

    try {
      const { id, certificate_file, image_file, video_file, ...plainPayload } = formData;
      const payloadWithFixedStock = {
        ...plainPayload,
        stock: 1,
      };
      const media = {
        certificate_path: certificate_file || undefined,
        image_path: image_file || undefined,
        video_path: video_file || undefined,
      };

      let savedItem: Item | null = null;

      if (editMode && id) {
        savedItem = await itemService.updateItem(id, payloadWithFixedStock, media);
        await showAlert("Produk berhasil diupdate!", {
          title: "Berhasil",
          tone: "success",
        });
      } else {
        savedItem = await itemService.createItem(payloadWithFixedStock as any, media);
        await showAlert("Produk berhasil ditambahkan!", {
          title: "Berhasil",
          tone: "success",
        });
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
      const statusCode = error?.response?.status;
      const errorMsg =
        statusCode === 413 ? `Ukuran upload terlalu besar. Maksimal: sertifikat ${MAX_CERTIFICATE_SIZE_MB}MB, gambar ${MAX_IMAGE_SIZE_MB}MB, video ${MAX_VIDEO_SIZE_MB}MB.` : error.response?.data?.message || "Gagal menyimpan produk!";
      await showAlert(errorMsg, {
        title: "Gagal Menyimpan Produk",
        tone: "danger",
      });
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    const shouldDelete = await showConfirm("Apakah Anda yakin ingin menghapus produk ini?", {
      title: "Konfirmasi Hapus",
      tone: "warning",
      confirmText: "Hapus",
    });
    if (!shouldDelete) return;

    try {
      await itemService.deleteItem(productId);
      await showAlert("Produk berhasil dihapus!", {
        title: "Berhasil",
        tone: "success",
      });
      await loadData();
    } catch (error: any) {
      console.error("Error deleting product:", error);
      const errorMsg = error.response?.data?.message || "Gagal menghapus produk!";
      await showAlert(errorMsg, {
        title: "Gagal Menghapus Produk",
        tone: "danger",
      });
    }
  };

  const handleOpenCatalogModal = (catalog?: Catalog) => {
    if (catalog) {
      setCatalogEditMode(true);
      setCatalogFormData({
        id: catalog.id,
        name: catalog.name,
        description: catalog.description || "",
        stock: Number(catalog.stock) || 0,
      });
    } else {
      setCatalogEditMode(false);
      setCatalogFormData({ id: 0, name: "", description: "", stock: 0 });
    }
    setShowCatalogModal(true);
  };

  const handleCloseCatalogModal = () => {
    setShowCatalogModal(false);
    setCatalogEditMode(false);
    setCatalogFormData({ id: 0, name: "", description: "", stock: 0 });
  };

  const handleSaveCatalog = async () => {
    if (!catalogFormData.name.trim()) {
      await showAlert("Nama katalog wajib diisi.", {
        title: "Validasi Form",
        tone: "warning",
      });
      return;
    }

    try {
      if (catalogEditMode && catalogFormData.id) {
        await catalogService.updateCatalog(catalogFormData.id, {
          name: catalogFormData.name,
          description: catalogFormData.description,
          stock: Math.max(0, Number(catalogFormData.stock) || 0),
        });
        await showAlert("Katalog berhasil diupdate!", {
          title: "Berhasil",
          tone: "success",
        });
      } else {
        await catalogService.createCatalog({
          name: catalogFormData.name,
          description: catalogFormData.description,
          stock: Math.max(0, Number(catalogFormData.stock) || 0),
        });
        await showAlert("Katalog berhasil ditambahkan!", {
          title: "Berhasil",
          tone: "success",
        });
      }
      handleCloseCatalogModal();
      await loadData();
    } catch (error: any) {
      console.error("Error saving catalog:", error);
      const errorMsg = error.response?.data?.message || "Gagal menyimpan katalog!";
      await showAlert(errorMsg, {
        title: "Gagal Menyimpan Katalog",
        tone: "danger",
      });
    }
  };

  const handleDeleteCatalog = async (catalogId: number) => {
    const shouldDelete = await showConfirm("Apakah Anda yakin ingin menghapus katalog ini? Produk dalam katalog ini akan terpengaruh.", {
      title: "Konfirmasi Hapus",
      tone: "warning",
      confirmText: "Hapus",
    });
    if (!shouldDelete) return;

    try {
      await catalogService.deleteCatalog(catalogId);
      await showAlert("Katalog berhasil dihapus!", {
        title: "Berhasil",
        tone: "success",
      });
      await loadData();
    } catch (error: any) {
      console.error("Error deleting catalog:", error);
      const errorMsg = error.response?.data?.message || "Gagal menghapus katalog!";
      await showAlert(errorMsg, {
        title: "Gagal Menghapus Katalog",
        tone: "danger",
      });
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
    const soldByCatalog = new Map<number, number>();

    orders
      .filter((order) => order.status === "completed")
      .forEach((order) => {
        order.items?.forEach((entry) => {
          const catalogId = entry.item?.catalog_id;
          if (!catalogId) return;
          const qty = Number(entry.quantity) || 0;
          soldByCatalog.set(catalogId, (soldByCatalog.get(catalogId) || 0) + qty);
        });
      });

    return catalogs.map((cat) => ({
      name: cat.name,
      stok: products.filter((p) => p.catalog_id === cat.id).reduce((acc, p) => acc + (Number(p.stock) > 0 ? 1 : 0), 0),
      terjual: soldByCatalog.get(cat.id) || 0,
      harga: 500000,
    }));
  };

  const getTopCatalogs = () => {
    return catalogs
      .map((catalog) => {
        const catalogProducts = products.filter((p) => p.catalog_id === catalog.id);
        const availableProducts = catalogProducts.filter((p) => Number(p.stock) > 0).length;
        const totalValue = catalogProducts.reduce((sum, p) => sum + Number(p.price || 0) * (Number(p.stock) > 0 ? 1 : 0), 0);
        return {
          id: catalog.id,
          name: catalog.name,
          totalProducts: catalogProducts.length,
          availableProducts,
          totalValue,
        };
      })
      .sort((a, b) => b.totalValue - a.totalValue)
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
  const topCatalogs = getTopCatalogs();
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
                <div key={alert.id} className="p-3 flex items-center justify-between gap-4 bg-red-50/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="px-2 py-0.5 rounded text-xs font-bold text-white bg-red-600">HABIS</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{alert.name}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {alert.unavailableProducts} dari {alert.totalProducts} produk tidak tersedia
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-sm font-bold text-red-700">{alert.unavailableProducts} produk</span>
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
      {/* Top Catalogs Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">Top 5 Katalog (Nilai Stok Tertinggi)</h3>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-gray-100">
          {topCatalogs.map((catalog) => (
            <div key={catalog.id} className="p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{catalog.name}</p>
                  <p className="text-xs text-gray-500">
                    {catalog.availableProducts}/{catalog.totalProducts} produk tersedia
                  </p>
                </div>
              </div>
              <div className="pt-1 text-sm font-semibold text-emerald-600">Nilai aset: {formatCurrency(catalog.totalValue)}</div>
            </div>
          ))}
          {topCatalogs.length === 0 && <div className="p-6 text-center text-sm text-gray-500">Belum ada katalog dalam daftar ini.</div>}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Katalog</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk Tersedia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Produk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nilai Aset</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topCatalogs.map((catalog) => (
                  <tr key={catalog.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{catalog.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{catalog.availableProducts}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{catalog.totalProducts}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-emerald-600">{formatCurrency(catalog.totalValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Catalog Management */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-bold text-gray-800">Manajemen Katalog</h3>
          <button onClick={() => handleOpenCatalogModal()} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-md flex items-center justify-center gap-2 w-full sm:w-auto">
            <Plus className="w-5 h-5" />
            <span>Tambah Katalog</span>
          </button>
        </div>

        {/* Mobile cards view */}
        <div className="sm:hidden divide-y divide-gray-100">
          {catalogs.map((catalog) => {
            const catalogProducts = products.filter((p) => p.catalog_id === catalog.id);
            return (
              <div key={catalog.id} className="p-4 space-y-3">
                <div>
                  <p className="font-semibold text-gray-900">{catalog.name}</p>
                  {catalog.description && <p className="text-sm text-gray-600 mt-1">{catalog.description}</p>}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded">{catalogProducts.length} produk</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => handleOpenCatalogModal(catalog)} className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200 transition-colors flex items-center justify-center gap-2">
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button onClick={() => handleDeleteCatalog(catalog.id)} className="flex-1 px-3 py-2 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200 transition-colors flex items-center justify-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Hapus
                  </button>
                </div>
              </div>
            );
          })}
          {catalogs.length === 0 && <div className="p-6 text-center text-sm text-gray-500">Belum ada katalog. Silakan tambah katalog baru.</div>}
        </div>

        {/* Desktop table view */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Katalog</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah Produk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {catalogs.map((catalog) => {
                const catalogProducts = products.filter((p) => p.catalog_id === catalog.id);
                return (
                  <tr key={catalog.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{catalog.name}</td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{catalog.description || "-"}</td>
                    <td className="px-6 py-4">
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">{catalogProducts.length}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenCatalogModal(catalog)} className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors" title="Edit Katalog">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteCatalog(catalog.id)} className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors" title="Hapus Katalog">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {catalogs.length === 0 && <div className="p-6 text-center text-sm text-gray-500">Belum ada katalog. Silakan tambah katalog baru.</div>}
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
        <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-lg font-bold text-gray-800">Daftar Produk</h3>
          <button onClick={() => handleOpenModal()} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-md flex items-center justify-center gap-2 w-full sm:w-auto">
            <Plus className="w-5 h-5" />
            <span>Tambah Produk</span>
          </button>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-gray-100">
          {filteredProducts.map((product) => (
            <div key={product.id} className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-7 h-7 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500 truncate">{(product.jenis_kelamin || product.gender) ? (product.jenis_kelamin || product.gender)!.charAt(0).toUpperCase() + (product.jenis_kelamin || product.gender)!.slice(1) : "-"}</p>
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
                <button onClick={() => handleOpenModal(product)} className="px-3 py-1.5 text-xs text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1" title="Edit">
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button onClick={() => handleDeleteProduct(product.id)} className="px-3 py-1.5 text-xs text-red-600 border border-red-100 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1" title="Hapus">
                  <Trash2 className="w-4 h-4" />
                  Hapus
                </button>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && <div className="p-6 text-center text-sm text-gray-500">Tidak ada produk yang cocok dengan filter.</div>}
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
                          <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{(product.jenis_kelamin || product.gender) ? (product.jenis_kelamin || product.gender)!.charAt(0).toUpperCase() + (product.jenis_kelamin || product.gender)!.slice(1) : "-"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{getCatalogName(product.catalog_id)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency(product.price)}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleOpenModal(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stok Produk</label>
                  <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-600">Setiap produk bernilai 1 stok (otomatis)</div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type (Gaya Main)</label>
                  <div className="relative">
                    <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="Contoh: fighter, pukul panjang, durasi, sujud, macul"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Kelamin *</label>
                  <div className="relative">
                    <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={formData.jenis_kelamin}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          jenis_kelamin: e.target.value as "" | "jantan" | "betina",
                        })
                      }
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 appearance-none"
                      required
                    >
                      <option value="">Pilih jenis kelamin</option>
                      <option value="jantan">Jantan</option>
                      <option value="betina">Betina</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kode Ring</label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.code_ring}
                      onChange={(e) => setFormData({ ...formData, code_ring: e.target.value })}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="Contoh: ABC-123"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Sertifikat (PDF)</label>
                <div className="space-y-2">
                  <div className="relative">
                    <UploadCloud className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="file"
                      id="certificate-upload"
                      accept="application/pdf,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (file && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
                          alert("File sertifikat harus berformat PDF.");
                          return;
                        }
                        if (file && file.size > bytesFromMb(MAX_CERTIFICATE_SIZE_MB)) {
                          alert(`Ukuran file sertifikat maksimal ${MAX_CERTIFICATE_SIZE_MB}MB.`);
                          e.currentTarget.value = "";
                          return;
                        }
                        setFormData({
                          ...formData,
                          certificate_file: file,
                          certificate: file ? file.name : formData.certificate,
                        });
                      }}
                      className="hidden"
                    />
                    <label htmlFor="certificate-upload" className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 flex items-center cursor-pointer hover:bg-gray-50">
                      <span className="text-gray-500">{formData.certificate_file ? "Ganti file sertifikat PDF..." : "Pilih file sertifikat PDF..."}</span>
                    </label>
                  </div>

                  {formData.certificate_file && (
                    <div className="mt-1 flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">PDF</div>
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
                  <button type="button" onClick={() => setShowCertPassword((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showCertPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-gray-500">Password ini akan disimpan di data burung dan digunakan pembeli untuk membuka sertifikat di halaman toko.</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Media Burung</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <UploadCloud className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (file && file.size > bytesFromMb(MAX_IMAGE_SIZE_MB)) {
                          alert(`Ukuran gambar maksimal ${MAX_IMAGE_SIZE_MB}MB.`);
                          e.currentTarget.value = "";
                          return;
                        }
                        setFormData({
                          ...formData,
                          image_file: file,
                          image_url: file ? file.name : formData.image_url,
                        });
                      }}
                      className="hidden"
                    />
                    <label htmlFor="image-upload" className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 flex items-center cursor-pointer hover:bg-gray-50">
                      <span className="text-gray-500">{formData.image_file ? "Ganti gambar burung..." : "Pilih 1 gambar burung..."}</span>
                    </label>
                  </div>

                  <div className="relative">
                    <UploadCloud className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="file"
                      id="video-upload"
                      accept="video/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0] || null;
                        if (!file) return;

                        setIsCompressingVideo(true);

                        try {
                          const processedVideo = await compressVideoIfNeeded(file, MAX_VIDEO_SIZE_MB);

                          if (processedVideo.size > bytesFromMb(MAX_VIDEO_SIZE_MB)) {
                            alert(`Ukuran video maksimal ${MAX_VIDEO_SIZE_MB}MB setelah kompresi. Silakan pilih video lain.`);
                            e.currentTarget.value = "";
                            setFormData((prev) => ({
                              ...prev,
                              video_file: null,
                            }));
                            return;
                          }

                          if (processedVideo !== file) {
                            const originalMb = (file.size / (1024 * 1024)).toFixed(2);
                            const compressedMb = (processedVideo.size / (1024 * 1024)).toFixed(2);
                            alert(`Video dikompresi otomatis: ${originalMb}MB -> ${compressedMb}MB`);
                          }

                          setFormData((prev) => ({
                            ...prev,
                            video_file: processedVideo,
                          }));
                        } catch (error) {
                          console.error("Video compression failed:", error);
                          alert("Gagal mengompresi video. Coba video lain atau ukuran lebih kecil.");
                          e.currentTarget.value = "";
                          setFormData((prev) => ({
                            ...prev,
                            video_file: null,
                          }));
                        } finally {
                          setIsCompressingVideo(false);
                        }
                      }}
                      className="hidden"
                    />
                    <label htmlFor="video-upload" className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 flex items-center cursor-pointer hover:bg-gray-50">
                      <span className="text-gray-500">
                        {isCompressingVideo
                          ? "Mengompresi video..."
                          : formData.video_file
                            ? "Ganti video burung..."
                            : "Pilih 1 video burung..."}
                      </span>
                    </label>
                  </div>
                </div>

                {(formData.image_file || formData.video_file) && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1">
                    <p className="text-xs text-gray-600">File media terpilih:</p>
                    {formData.image_file && <p className="text-xs text-blue-700 break-all font-mono">Gambar: {formData.image_file.name}</p>}
                    {formData.video_file && <p className="text-xs text-blue-700 break-all font-mono">Video: {formData.video_file.name}</p>}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button onClick={handleCloseModal} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                Batal
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={isCompressingVideo}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-5 h-5" />
                {isCompressingVideo ? "Mengompresi Video..." : editMode ? "Update Produk" : "Tambah Produk"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Catalog Modal */}
      {showCatalogModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{catalogEditMode ? "Edit Katalog" : "Tambah Katalog Baru"}</h2>
              <button onClick={handleCloseCatalogModal} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Katalog *</label>
                <input
                  type="text"
                  value={catalogFormData.name}
                  onChange={(e) => setCatalogFormData({ ...catalogFormData, name: e.target.value })}
                  placeholder="Contoh: Jenis Cucak Rawa"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
                <textarea
                  value={catalogFormData.description}
                  onChange={(e) => setCatalogFormData({ ...catalogFormData, description: e.target.value })}
                  placeholder="Deskripsi katalog (opsional)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stok *</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={catalogFormData.stock}
                  onChange={(e) =>
                    setCatalogFormData({
                      ...catalogFormData,
                      stock: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  placeholder="Contoh: 10"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                />
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button onClick={handleCloseCatalogModal} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium">
                Batal
              </button>
              <button onClick={handleSaveCatalog} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {catalogEditMode ? "Update Katalog" : "Tambah Katalog"}
              </button>
            </div>
          </div>
        </div>
      )}{" "}
    </div>
  );
}
