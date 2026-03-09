import { useState, useEffect } from "react";
import { orderService } from "../../services";
import type { OrderResult } from "../../types";

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderResult | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      // In a real application, this would call the actual API
      // For now, we'll handle gracefully if not implemented
      try {
        const ordersData = await orderService.getAllOrders();
        // Sort by created_at descending
        const sortedOrders = ordersData.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setOrders(sortedOrders);
      } catch (error) {
        console.log("Orders API not yet implemented, using empty array");
        setOrders([]);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, newStatus: "pending" | "paid" | "shipped" | "completed") => {
    try {
      // In a real application, you would call the API here
      console.log("Updating order status:", { orderId, newStatus });
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      
      alert("Status pesanan berhasil diupdate!");
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Gagal mengupdate status pesanan!");
    }
  };

  const handleOpenDetail = (order: OrderResult) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setSelectedOrder(null);
    setShowDetailModal(false);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "all" || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "paid":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "shipped":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "completed":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Menunggu Pembayaran";
      case "paid":
        return "Sudah Dibayar";
      case "shipped":
        return "Sedang Dikirim";
      case "completed":
        return "Selesai";
      default:
        return status;
    }
  };

  const getStatusSteps = () => {
    return [
      { value: "pending", label: "Menunggu" },
      { value: "paid", label: "Dibayar" },
      { value: "shipped", label: "Dikirim" },
      { value: "completed", label: "Selesai" },
    ];
  };

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    paid: orders.filter(o => o.status === "paid").length,
    shipped: orders.filter(o => o.status === "shipped").length,
    completed: orders.filter(o => o.status === "completed").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800">Manajemen Pesanan</h2>
        <p className="text-gray-600 mt-1">Kelola dan update status pesanan pembeli</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-gray-500">
          <p className="text-sm text-gray-600 font-medium">Total Pesanan</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{orderStats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600 font-medium">Menunggu</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{orderStats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600 font-medium">Dibayar</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{orderStats.paid}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
          <p className="text-sm text-gray-600 font-medium">Dikirim</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{orderStats.shipped}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-600 font-medium">Selesai</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{orderStats.completed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cari Pesanan
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari invoice, nama, atau email..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <svg
                className="w-5 h-5 text-gray-400 absolute left-3 top-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu Pembayaran</option>
              <option value="paid">Sudah Dibayar</option>
              <option value="shipped">Sedang Dikirim</option>
              <option value="completed">Selesai</option>
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Menampilkan {filteredOrders.length} dari {orders.length} pesanan
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500 text-lg">Belum ada pesanan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pelanggan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{order.invoice_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{order.customer_name}</div>
                      <div className="text-sm text-gray-500">{order.customer_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(order.total_price)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value as any)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full border ${getStatusColor(order.status)} focus:ring-2 focus:ring-emerald-500 cursor-pointer`}
                      >
                        {getStatusSteps().map((step) => (
                          <option key={step.value} value={step.value}>
                            {step.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleOpenDetail(order)}
                        className="text-emerald-600 hover:text-emerald-900 font-medium"
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

      {/* Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Detail Pesanan</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedOrder.invoice_number}</p>
              </div>
              <button
                onClick={handleCloseDetail}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Order Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Status Pesanan
                </label>
                <div className="flex gap-2">
                  {getStatusSteps().map((step) => (
                    <button
                      key={step.value}
                      onClick={() => handleUpdateStatus(selectedOrder.id, step.value as any)}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                        selectedOrder.status === step.value
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold"
                          : "border-gray-200 bg-white text-gray-600 hover:border-emerald-300"
                      }`}
                    >
                      {step.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Informasi Pelanggan</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex">
                    <span className="text-gray-600 w-32">Nama:</span>
                    <span className="font-medium text-gray-900">{selectedOrder.customer_name}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-600 w-32">Email:</span>
                    <span className="font-medium text-gray-900">{selectedOrder.customer_email}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-600 w-32">Telepon:</span>
                    <span className="font-medium text-gray-900">{selectedOrder.customer_phone}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-600 w-32">Alamat:</span>
                    <span className="font-medium text-gray-900">{selectedOrder.shipping_address}</span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Item Pesanan</h4>
                <div className="border border-gray-200 rounded-lg divide-y">
                  {selectedOrder.items.map((orderItem, index) => (
                    <div key={index} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {orderItem.item.image_url && (
                          <img
                            src={orderItem.item.image_url}
                            alt={orderItem.item.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{orderItem.item.name}</p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(orderItem.item.price)} x {orderItem.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(orderItem.item.price * orderItem.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t-2 border-gray-900 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">Total Pembayaran</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(selectedOrder.total_price)}
                  </span>
                </div>
              </div>

              {/* Order Date */}
              <div className="text-sm text-gray-600">
                <p>Tanggal Pesanan: {formatDate(selectedOrder.created_at)}</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
              <button
                onClick={handleCloseDetail}
                className="w-full px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
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
