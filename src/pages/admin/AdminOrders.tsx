import { useState, useEffect, useCallback } from "react";
import { orderService, dashboardService } from "../../services";
import { getLocalOrders, updateLocalOrderStatus } from "../../services/orderService";
import type { Order } from "../../types";
import type { DashboardSummary } from "../../services/dashboardService";

interface OrderStatusOption {
  value: "pending" | "paid" | "shipped" | "completed";
  label: string;
  color: string;
}

interface OrderStats {
  total: number;
  pending: number;
  paid: number;
  shipped: number;
  completed: number;
}

const STATUS_OPTIONS: OrderStatusOption[] = [
  { value: "pending", label: "Menunggu", color: "yellow" },
  { value: "paid", label: "Dibayar", color: "blue" },
  { value: "shipped", label: "Dikirim", color: "purple" },
  { value: "completed", label: "Selesai", color: "green" },
];

const ORDERS_ENDPOINT_AVAILABLE = true;

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    paid: "bg-blue-100 text-blue-800 border-blue-300",
    shipped: "bg-purple-100 text-purple-800 border-purple-300",
    completed: "bg-green-100 text-green-800 border-green-300",
  };
  return colors[status] || "bg-gray-100 text-gray-800 border-gray-300";
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);


 const loadOrders = useCallback(async () => {
  try {
    setLoading(true);
    setError(null); 
    try {
      const summaryData = await dashboardService.getSummary();
      setSummary(summaryData || null);
    } catch {
      setSummary(null);
    }

    if (!ORDERS_ENDPOINT_AVAILABLE) {
      const localOrders = getLocalOrders().sort(
        (a: Order, b: Order) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setOrders(localOrders);
      return;
    }

    const ordersData = await orderService.getAllOrders();
    const sortedOrders = (ordersData as Order[]).sort(
      (a: Order, b: Order) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

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
    newStatus: "pending" | "paid" | "shipped" | "completed"
  ) => {
    try {
      const targetOrder = orders.find((order) => order.id === orderId);

      if (newStatus === "pending" && targetOrder?.status !== "pending") {
        alert("Status 'Menunggu' tidak bisa dipilih sebagai aksi update. Gunakan aksi transaksi yang tersedia.");
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
          await orderService.updateOrderStatus(orderId, newStatus, targetOrder?.invoice_number, trackingNumber);
          console.log(`Order ${orderId} status updated to ${newStatus} via API`);
          
          await loadOrders();
          alert("Status pesanan berhasil diupdate!");
        } catch (apiError: any) {
          console.error("API Error:", apiError);
          const errorMessage = 
            apiError?.message || 
            apiError?.response?.data?.message || 
            "Gagal menghubungi server";
          
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
        
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
        
        alert("Status pesanan lokal berhasil diupdate!");
      }
      
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Gagal mengupdate status pesanan. Silakan coba lagi.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenDetail = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setSelectedOrder(null);
    setShowDetailModal(false);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchQuery.toLowerCase());
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

  const orderStats: OrderStats = summary ? {
    total: summary.total_orders || 0,
    pending: summary.orders_per_status?.pending || 0,
    paid: summary.orders_per_status?.paid || 0,
    shipped: summary.orders_per_status?.shipped || 0,
    completed: summary.orders_per_status?.completed || 0,
  } : {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    paid: orders.filter((o) => o.status === "paid").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    completed: orders.filter((o) => o.status === "completed").length,
  };

  const trendData = [40, 65, 30, 80, 55, 90, 70];
  const maxTrend = Math.max(...trendData);
if (error) {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-md">
        <p className="text-red-600 font-medium mb-4">{error}</p>
        <div className="flex gap-2 justify-center">
          <button 
            onClick={handleRetry}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Coba Lagi
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Refresh Page
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
      <div>
        <h2 className="text-3xl font-bold text-gray-800">Order Management</h2>
        <p className="text-gray-600 mt-1">Pantau dan kelola status pesanan pembeli</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATUS_OPTIONS.map((status) => (
          <div
            key={status.value}
            className={`bg-gradient-to-br from-${status.color}-50 to-${status.color}-100 p-5 rounded-2xl border-2 border-${status.color}-200 text-center hover:shadow-md transition-shadow`}
          >
            <p className={`text-${status.color}-600 text-sm font-medium`}>{status.label}</p>
            <p className={`text-3xl font-bold text-${status.color}-700 mt-1`}>
              {orderStats[status.value]}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Funnel Konversi Pesanan</h3>
          <div className="space-y-3">
            {STATUS_OPTIONS.map((step, i) => {
              const value = orderStats[step.value];
              const percentage = orderStats.total > 0 ? Math.round((value / orderStats.total) * 100) : 0;
              return (
                <div key={step.value} className="relative">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{step.label}</span>
                    <span className="text-gray-500">{value} pesanan ({percentage}%)</span>
                  </div>
                  <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className={`h-full rounded-lg flex items-center justify-end pr-3 transition-all duration-500 bg-${step.color}-500`}
                      style={{ width: `${percentage}%` }}
                    >
                      <span className="text-white text-xs font-bold">{percentage}%</span>
                    </div>
                  </div>
                  {i < STATUS_OPTIONS.length - 1 && orderStats[STATUS_OPTIONS[i].value] > orderStats[STATUS_OPTIONS[i + 1].value] && (
                    <p className="text-xs text-red-400 text-right mt-0.5">
                      -{orderStats[STATUS_OPTIONS[i].value] - orderStats[STATUS_OPTIONS[i + 1].value]} drop-off
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Conversion Rate</span>
              <span className="font-bold text-emerald-600">
                {orderStats.total > 0 ? Math.round((orderStats.completed / orderStats.total) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Tren Volume Pesanan (7 Hari)</h3>
          <div className="h-48 flex items-end justify-between gap-2">
            {trendData.map((h, i) => (
              <div key={i} className="w-full bg-indigo-50 rounded-t hover:bg-indigo-100 transition-colors relative group">
                <div
                  className="absolute bottom-0 w-full bg-indigo-500 rounded-t transition-all duration-500"
                  style={{ height: `${(h / maxTrend) * 100}%` }}
                ></div>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  {h}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Min</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cari Pesanan</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari invoice, nama, atau email..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">Semua Status</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Menampilkan <span className="font-semibold">{filteredOrders.length}</span> dari <span className="font-semibold">{orders.length}</span> pesanan
        </div>
        {!ORDERS_ENDPOINT_AVAILABLE && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Menampilkan daftar pesanan dari data checkout lokal karena backend saat ini belum menyediakan endpoint list order.
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 text-lg">
              {ORDERS_ENDPOINT_AVAILABLE ? "Tidak ada pesanan yang ditemukan" : "Daftar pesanan belum tersedia"}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {ORDERS_ENDPOINT_AVAILABLE
                ? "Coba ubah filter atau pencarian"
                : "Belum ada order tersimpan lokal. Buat order dari halaman checkout agar data muncul di sini."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pelanggan</th>
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
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                      <div className="text-xs text-gray-500">{order.customer_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{formatCurrency(order.total_price)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value as any)}
                        disabled={updatingId === order.id}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full border ${getStatusColor(order.status)} focus:ring-2 focus:ring-emerald-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      {updatingId === order.id && (
                        <span className="ml-2 text-xs text-gray-400">Memproses</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleOpenDetail(order)}
                        className="text-emerald-600 hover:text-emerald-900 font-medium hover:underline"
                      >
                        Detail →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Detail Pesanan</h3>
                <p className="text-sm text-gray-600 mt-1 font-mono">{selectedOrder.invoice_number}</p>
              </div>
              <button onClick={handleCloseDetail} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Status Pesanan</label>
                <div className="flex gap-2 flex-wrap">
                  {STATUS_OPTIONS.map((step) => (
                    <button
                      key={step.value}
                      onClick={() => handleUpdateStatus(selectedOrder.id, step.value)}
                      disabled={updatingId === selectedOrder.id}
                      className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl border-2 transition-all ${
                        selectedOrder.status === step.value
                          ? `border-${step.color}-500 bg-${step.color}-50 text-${step.color}-700 font-semibold`
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {step.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Informasi Pelanggan</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex">
                    <span className="text-gray-600 w-24">Nama</span>
                    <span className="font-medium text-gray-900">: {selectedOrder.customer_name}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-600 w-24">Email</span>
                    <span className="font-medium text-gray-900">: {selectedOrder.customer_email}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-600 w-24">Telepon</span>
                    <span className="font-medium text-gray-900">: {selectedOrder.customer_phone}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-gray-600 w-24">Alamat</span>
                    <span className="font-medium text-gray-900">: {selectedOrder.shipping_address}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Item Pesanan</h4>
                <div className="border border-gray-200 rounded-xl divide-y">
                  {selectedOrder.items?.map((orderItem, index) => (
                    <div key={index} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {orderItem.item?.image_url ? (
                          <img
                            src={orderItem.item.image_url}
                            alt={orderItem.item.name}
                            className="w-16 h-16 object-cover rounded-lg border"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{orderItem.item?.name || "Unknown"}</p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(orderItem.item?.price || 0)} × {orderItem.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="font-semibold text-gray-900">
                        {formatCurrency((orderItem.item?.price || 0) * orderItem.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t-2 border-gray-900 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">Total Pembayaran</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(selectedOrder.total_price)}
                  </span>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <p>Tanggal Pesanan: {formatDate(selectedOrder.created_at)}</p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
              <button
                onClick={handleCloseDetail}
                className="w-full px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}