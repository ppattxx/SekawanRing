import { useState, useEffect, useCallback } from "react";
import { Clock, CreditCard, Truck, CheckCircle, Search, Filter, ChevronDown, AlertCircle, RefreshCw } from "lucide-react";
import { orderService } from "../../services";
import { getLocalOrders, updateLocalOrderStatus } from "../../services/orderService";
import type { Order } from "../../types";

interface OrderStatusOption {
  value: "booking" | "paid" | "shipped" | "completed" | "cancelled";
  label: string;
  color: string;
}

interface OrderStats {
  total: number;
  booking: number;
  paid: number;
  shipped: number;
  completed: number;
  cancelled: number;
}

type OrderStatusValue = "booking" | "paid" | "shipped" | "completed" | "cancelled";

interface PendingStatusChange {
  orderId: number;
  invoiceNumber?: string;
  currentStatus: OrderStatusValue;
  newStatus: OrderStatusValue;
}

const STATUS_OPTIONS: OrderStatusOption[] = [
  { value: "booking", label: "Booking", color: "amber" },
  { value: "paid", label: "Dibayar", color: "blue" },
  { value: "shipped", label: "Dikirim", color: "purple" },
  { value: "completed", label: "Selesai", color: "green" },
  { value: "cancelled", label: "Dibatalkan", color: "red" },
];

const STATUS_ICONS = {
  booking: <Clock className="w-6 h-6" />,
  paid: <CreditCard className="w-6 h-6" />,
  shipped: <Truck className="w-6 h-6" />,
  completed: <CheckCircle className="w-6 h-6" />,
  cancelled: <AlertCircle className="w-6 h-6" />,
};

const ORDERS_ENDPOINT_AVAILABLE = true;

const getStatusAppearance = (status: string) => {
  const appearances: Record<
    string,
    {
      card: string;
      text: string;
      iconContainer: string;
      pill: string;
      funnelBar: string;
    }
  > = {
    booking: {
      card: "from-amber-50 to-amber-100 border-amber-200",
      text: "text-amber-700",
      iconContainer: "bg-amber-200 text-amber-600",
      pill: "bg-amber-100 text-amber-800 border-amber-300",
      funnelBar: "bg-amber-500",
    },
    paid: {
      card: "from-blue-50 to-blue-100 border-blue-200",
      text: "text-blue-700",
      iconContainer: "bg-blue-200 text-blue-600",
      pill: "bg-blue-100 text-blue-800 border-blue-300",
      funnelBar: "bg-blue-500",
    },
    shipped: {
      card: "from-purple-50 to-purple-100 border-purple-200",
      text: "text-purple-700",
      iconContainer: "bg-purple-200 text-purple-600",
      pill: "bg-purple-100 text-purple-800 border-purple-300",
      funnelBar: "bg-purple-500",
    },
    completed: {
      card: "from-green-50 to-green-100 border-green-200",
      text: "text-green-700",
      iconContainer: "bg-green-200 text-green-600",
      pill: "bg-green-100 text-green-800 border-green-300",
      funnelBar: "bg-green-500",
    },
    cancelled: {
      card: "from-red-50 to-red-100 border-red-200",
      text: "text-red-700",
      iconContainer: "bg-red-200 text-red-600",
      pill: "bg-red-100 text-red-800 border-red-300",
      funnelBar: "bg-red-500",
    },
  };
  return (
    appearances[status] || {
      card: "from-gray-50 to-gray-100 border-gray-200",
      text: "text-gray-700",
      iconContainer: "bg-gray-200 text-gray-600",
      pill: "bg-gray-100 text-gray-800 border-gray-300",
      funnelBar: "bg-gray-500",
    }
  );
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingStatusChange, setPendingStatusChange] = useState<PendingStatusChange | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!ORDERS_ENDPOINT_AVAILABLE) {
        const localOrders = getLocalOrders().sort((a: Order, b: Order) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setOrders(localOrders);
        return;
      }

      const ordersData = await orderService.getAllOrders();
      const sortedOrders = (ordersData as Order[]).sort((a: Order, b: Order) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setOrders(sortedOrders);
    } catch (error: any) {
      console.error("Error loading orders:", error);
      setError("Gagal memuat data pesanan. Periksa koneksi API.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleRetry = () => {
    loadOrders();
  };

  const handleUpdateStatus = async (
    orderId: number,
    newStatus: OrderStatusValue
  ) => {
    try {
      const targetOrder = orders.find((order) => order.id === orderId);

      if (newStatus === "booking") {
        alert("Status 'Booking' tidak bisa dipilih sebagai aksi update.");
        return;
      }

      let trackingNumber: string | undefined;
      if (newStatus === "shipped") {
        trackingNumber = prompt("Masukkan nomor tracking pengiriman:") || undefined;
        if (!trackingNumber) {
          alert("Nomor tracking diperlukan untuk status 'Dikirim'");
          return;
        }
      }

      setUpdatingId(orderId);

      if (ORDERS_ENDPOINT_AVAILABLE) {
        try {
          console.log(`Attempting to update order ${orderId} to ${newStatus}`);
          if (newStatus === "cancelled") {
            await orderService.cancelOrder(orderId, targetOrder?.invoice_number);
          } else {
            await orderService.updateOrderStatus(
              orderId,
              newStatus,
              targetOrder?.invoice_number,
              trackingNumber,
              targetOrder?.items
            );
          }
          console.log(`Order ${orderId} status updated to ${newStatus} via API`);

          await loadOrders();
          alert("Status pesanan berhasil diupdate!");
        } catch (apiError: any) {
          console.error("API Error:", apiError);
          const errorMessage = apiError?.message || apiError?.response?.data?.message || "Gagal menghubungi server";

          console.error(`Full error details:`, {
            message: apiError?.message,
            status: apiError?.response?.status,
            data: apiError?.response?.data,
          });

          alert(`Gagal mengupdate status via API:\n${errorMessage}`);
          setUpdatingId(null);
          return;
        }
      } else {
        const updatedOrders = updateLocalOrderStatus(orderId, newStatus);
        setOrders(updatedOrders);

        alert("Status pesanan lokal berhasil diupdate!");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Gagal mengupdate status pesanan. Silakan coba lagi.");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusLabel = (status: OrderStatusValue): string => {
    return STATUS_OPTIONS.find((option) => option.value === status)?.label || status;
  };

  const handleOpenStatusConfirmation = (order: Order, newStatus: OrderStatusValue) => {
    const currentStatus = order.status as OrderStatusValue;
    if (newStatus === currentStatus) return;

    setPendingStatusChange({
      orderId: order.id,
      invoiceNumber: order.invoice_number,
      currentStatus,
      newStatus,
    });
  };

  const handleCancelStatusConfirmation = () => {
    if (updatingId !== null) return;
    setPendingStatusChange(null);
  };

  const handleConfirmStatusChange = async () => {
    if (!pendingStatusChange) return;

    const { orderId, newStatus } = pendingStatusChange;
    await handleUpdateStatus(orderId, newStatus);
    setPendingStatusChange(null);
  };

  const handleRequestPayment = async (order: Order) => {
    const input = prompt("Masukkan ongkir untuk tagihan (angka tanpa titik/koma):");
    if (!input) return;

    const shippingCost = Number(input);
    if (!Number.isFinite(shippingCost) || shippingCost < 0) {
      alert("Ongkir tidak valid.");
      return;
    }

    try {
      setUpdatingId(order.id);
      await orderService.requestPayment(order.id, shippingCost, order.invoice_number);
      await loadOrders();
      alert("Tagihan berhasil dikirim ke pelanggan.");
    } catch (error) {
      console.error("Error requesting payment:", error);
      alert("Gagal mengirim tagihan. Silakan coba lagi.");
    } finally {
      setUpdatingId(null);
    }
  };

  const isBillingRequested = (order: Order): boolean => {
    const shippingValue = Number(order.shipping_cost);
    const hasShippingCost =
      order.shipping_cost !== undefined &&
      order.shipping_cost !== null &&
      Number.isFinite(shippingValue);
    return hasShippingCost || Boolean(order.payment_deadline);
  };

  const handleViewPaymentProof = (order: Order) => {
    if (!order.payment_proof_url) {
      alert("Bukti pembayaran belum tersedia.");
      return;
    }
    window.open(order.payment_proof_url, "_blank");
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) || order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) || order.customer_email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "all" || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number | string): string => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num || 0);
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const orderStats: OrderStats = {
    total: filteredOrders.length,
    booking: filteredOrders.filter((o) => o.status === "booking").length,
    paid: filteredOrders.filter((o) => o.status === "paid").length,
    shipped: filteredOrders.filter((o) => o.status === "shipped").length,
    completed: filteredOrders.filter((o) => o.status === "completed").length,
    cancelled: filteredOrders.filter((o) => o.status === "cancelled").length,
  };

  const trendData = [40, 65, 30, 80, 55, 90, 70];
  const maxTrend = Math.max(...trendData);
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-md shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-red-800">Terjadi Kesalahan</h3>
          <p className="text-red-600 text-sm mt-1 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <button onClick={handleRetry} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Coba Lagi
            </button>
            <button onClick={() => window.location.reload()} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Refresh Halaman
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
        <p className="text-gray-500">Memuat data pesanan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATUS_OPTIONS.map((status) => {
          const appearance = getStatusAppearance(status.value);
          return (
            <div key={status.value} className={`bg-gradient-to-br ${appearance.card} p-5 rounded-2xl border-2 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all`}>
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${appearance.iconContainer}`}>{STATUS_ICONS[status.value]}</div>
                <p className={`text-3xl font-bold ${appearance.text} text-right`}>{orderStats[status.value]}</p>
              </div>
              <p className={`mt-3 font-bold ${appearance.text}`}>{status.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Funnel Konversi Pesanan</h3>
          <div className="space-y-3">
            {STATUS_OPTIONS.map((step, i) => {
              const value = orderStats[step.value];
              const percentage = orderStats.total > 0 ? Math.round((value / orderStats.total) * 100) : 0;
              const appearance = getStatusAppearance(step.value);
              return (
                <div key={step.value}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{step.label}</span>
                    <span className="text-gray-500">
                      {value} pesanan ({percentage}%)
                    </span>
                  </div>
                  <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div className={`h-full rounded-lg flex items-center justify-end pr-3 transition-all duration-500 ${appearance.funnelBar}`} style={{ width: `${percentage}%` }}>
                      <span className="text-white text-xs font-bold">{percentage}%</span>
                    </div>
                  </div>
                  {i < STATUS_OPTIONS.length - 1 && orderStats[STATUS_OPTIONS[i].value] > orderStats[STATUS_OPTIONS[i + 1].value] && (
                    <p className="text-xs text-red-400 text-right mt-0.5">-{orderStats[STATUS_OPTIONS[i].value] - orderStats[STATUS_OPTIONS[i + 1].value]} drop-off</p>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Conversion Rate</span>
              <span className="font-bold text-emerald-600">{orderStats.total > 0 ? Math.round((orderStats.completed / orderStats.total) * 100) : 0}%</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Tren Volume Pesanan (7 Hari)</h3>
          <div className="h-48 flex items-end justify-between gap-2">
            {trendData.map((h, i) => (
              <div key={i} className="w-full bg-indigo-50 rounded-t hover:bg-indigo-100 transition-colors relative group">
                <div className="absolute bottom-0 w-full bg-indigo-500 rounded-t transition-all duration-500" style={{ height: `${(h / maxTrend) * 100}%` }}></div>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">{h}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Sen</span>
            <span>Sel</span>
            <span>Rab</span>
            <span>Kam</span>
            <span>Jum</span>
            <span>Sab</span>
            <span>Min</span>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Rata-rata Harian</p>
              <p className="text-lg font-bold text-gray-800">{Math.round(trendData.reduce((a, b) => a + b, 0) / 7)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Peak Day</p>
              <p className="text-lg font-bold text-emerald-600">{Math.max(...trendData)} orders</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="search-order" className="block text-sm font-medium text-gray-700 mb-2">
              Cari Pesanan
            </label>
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="search-order"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari invoice, nama, atau email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          <div>
            <label htmlFor="filter-status" className="block text-sm font-medium text-gray-700 mb-2">
              Filter Status
            </label>
            <div className="relative">
              <Filter className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                id="filter-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
              >
                <option value="all">Semua Status</option>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          Menampilkan <span className="font-semibold">{filteredOrders.length}</span> dari <span className="font-semibold">{orders.length}</span> pesanan
        </div>
        {!ORDERS_ENDPOINT_AVAILABLE && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">Menampilkan daftar pesanan dari data checkout lokal karena backend saat ini belum menyediakan endpoint list order.</div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 text-lg">{ORDERS_ENDPOINT_AVAILABLE ? "Tidak ada pesanan yang ditemukan" : "Daftar pesanan belum tersedia"}</p>
            <p className="text-sm text-gray-400 mt-1">{ORDERS_ENDPOINT_AVAILABLE ? "Coba ubah filter atau pencarian" : "Belum ada order tersimpan lokal. Buat order dari halaman checkout agar data muncul di sini."}</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-100">
              {filteredOrders.map((order) => {
                const appearance = getStatusAppearance(order.status);
                const statusLabel =
                  STATUS_OPTIONS.find((s) => s.value === order.status)?.label || order.status;
                return (
                  <div key={order.id} className="p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Invoice</p>
                        <p className="font-mono text-sm font-semibold text-gray-900">
                          {order.invoice_number}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full border ${appearance.pill}`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="font-medium text-gray-900">{order.customer_name}</p>
                      <p className="text-xs text-gray-500">{order.customer_email}</p>
                      <p className="text-xs text-gray-500">{order.customer_phone || "-"}</p>
                      <p className="text-xs text-gray-500 line-clamp-2">{order.shipping_address || "-"}</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {formatCurrency(order.total_price)}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                      <div className="pt-1 space-y-1">
                        {order.items?.length ? (
                          order.items.map((orderItem, index) => (
                            <p key={index} className="text-xs text-gray-600">
                              {orderItem.item?.name || "Unknown"} × {orderItem.quantity}
                            </p>
                          ))
                        ) : (
                          <p className="text-xs text-gray-400">Tidak ada item</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 pt-1">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleOpenStatusConfirmation(order, e.target.value as OrderStatusValue)
                        }
                        disabled={updatingId === order.id}
                        className={`w-full px-3 py-1.5 text-xs font-semibold rounded-full border ${
                          appearance.pill
                        } focus:ring-2 focus:ring-emerald-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed appearance-none`}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {order.status === "booking" ? (
                        isBillingRequested(order) ? (
                          <button
                            onClick={() => handleViewPaymentProof(order)}
                            disabled={!order.payment_proof_url}
                            className="w-full inline-flex justify-center items-center px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            Bukti Pembayaran
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRequestPayment(order)}
                            disabled={updatingId === order.id}
                            className="w-full inline-flex justify-center items-center px-3 py-2 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {updatingId === order.id ? "Memproses..." : "Kirim Tagihan"}
                          </button>
                        )
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Telp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alamat</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detail Pesanan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-mono text-sm font-medium text-gray-900">{order.invoice_number}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 min-w-[150px]">{order.customer_name || "-"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">{order.customer_phone || "-"}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-gray-500 max-w-[260px] truncate" title={order.shipping_address || "-"}>
                            {order.shipping_address || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="min-w-[220px] space-y-1">
                            {order.items?.length ? (
                              order.items.map((orderItem, index) => (
                                <div key={index} className="text-xs text-gray-700">
                                  <span className="font-medium">{orderItem.item?.name || "Unknown"}</span>
                                  <span className="text-gray-500"> × {orderItem.quantity}</span>
                                </div>
                              ))
                            ) : (
                              <div className="text-xs text-gray-400">Tidak ada item</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{formatCurrency(order.total_price)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleOpenStatusConfirmation(order, e.target.value as OrderStatusValue)
                            }
                            disabled={updatingId === order.id}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-full border ${
                              getStatusAppearance(order.status).pill
                            } focus:ring-2 focus:ring-emerald-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed appearance-none`}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          {updatingId === order.id && (
                            <span className="ml-2 text-xs text-gray-400">Memproses</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(order.created_at)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {order.status === "booking" ? (
                            isBillingRequested(order) ? (
                              <button
                                onClick={() => handleViewPaymentProof(order)}
                                disabled={!order.payment_proof_url}
                                className="inline-flex items-center justify-center px-3 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                Bukti Pembayaran
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRequestPayment(order)}
                                disabled={updatingId === order.id}
                                className="inline-flex items-center justify-center px-3 py-2 text-xs font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {updatingId === order.id ? "Memproses..." : "Kirim Tagihan"}
                              </button>
                            )
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {pendingStatusChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl border border-gray-100">
            <h3 className="text-base font-bold text-gray-900">Konfirmasi Update Status</h3>
            <p className="mt-2 text-sm text-gray-600">
              Invoice <span className="font-semibold text-gray-800">{pendingStatusChange.invoiceNumber || "-"}</span>
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Ubah status dari <span className="font-semibold text-gray-800">{getStatusLabel(pendingStatusChange.currentStatus)}</span> ke <span className="font-semibold text-gray-800">{getStatusLabel(pendingStatusChange.newStatus)}</span>?
            </p>
            <div className="mt-5 flex gap-2 justify-end">
              <button
                type="button"
                onClick={handleCancelStatusConfirmation}
                disabled={updatingId !== null}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                disabled={updatingId !== null}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {updatingId !== null ? "Memproses..." : "Ya, Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
