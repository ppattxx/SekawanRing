import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { dashboardService } from "../../services";
import type { DashboardSummary, SalesDataMonthly } from "../../services/dashboardService";

export default function AdminDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [salesData, setSalesData] = useState<SalesDataMonthly | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2026);

  useEffect(() => {
    loadDashboardData();
  }, [selectedYear]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load dashboard summary
      const summaryData = await dashboardService.getSummary();
      setSummary(summaryData);

      // Load sales data for the year
      const salesDataYear = await dashboardService.getSalesByYear(selectedYear);
      setSalesData(salesDataYear);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getMonthName = (month: number) => {
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return months[month - 1] || "";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Gagal memuat data dashboard</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h2>
        <p className="text-gray-600">Selamat datang di Admin Panel Sekawan Ring</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Orders */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Pesanan</p>
              <h3 className="text-3xl font-bold mt-2">{summary.total_orders}</h3>
              <p className="text-blue-100 text-xs mt-1">{summary.orders_per_status.pending} menunggu</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Menunggu Pembayaran</p>
              <h3 className="text-3xl font-bold mt-2">{summary.orders_per_status.pending}</h3>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Completed Orders */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Pesanan Selesai</p>
              <h3 className="text-3xl font-bold mt-2">{summary.orders_per_status.completed}</h3>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Total Pendapatan</p>
              <h3 className="text-2xl font-bold mt-2">{formatCurrency(summary.revenue)}</h3>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Aksi Cepat</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/products"
            className="flex items-center gap-3 p-4 border-2 border-emerald-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-400 transition-all"
          >
            <div className="bg-emerald-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Tambah Produk</p>
              <p className="text-sm text-gray-600">Buat produk baru</p>
            </div>
          </Link>

          <Link
            to="/admin/orders"
            className="flex items-center gap-3 p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 hover:border-purple-400 transition-all"
          >
            <div className="bg-purple-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Kelola Pesanan</p>
              <p className="text-sm text-gray-600">Update status pesanan</p>
            </div>
          </Link>

          <button
            onClick={loadDashboardData}
            className="flex items-center gap-3 p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all"
          >
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Refresh Data</p>
              <p className="text-sm text-gray-600">Perbarui statistik</p>
            </div>
          </button>
        </div>
      </div>

      {/* Stock per Catalog & Orders per Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock per Catalog */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Stok per Katalog</h3>
          <div className="space-y-3">
            {summary.stock_per_catalog.map((catalog) => (
              <div key={catalog.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">{catalog.name}</p>
                  <p className="text-sm text-gray-600">Total Stok</p>
                </div>
                <div className="text-2xl font-bold text-emerald-600">
                  {catalog.items_sum_stock}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Orders per Catalog */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Penjualan per Katalog</h3>
          <div className="space-y-3">
            {summary.orders_per_catalog.map((catalog) => (
              <div key={catalog.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">{catalog.name}</p>
                  <p className="text-sm text-gray-600">Total Terjual</p>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {catalog.total_sold}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sales Chart */}
      {salesData && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Penjualan Tahun {selectedYear}</h3>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <div className="flex items-end gap-4 min-w-max pb-4" style={{ height: '300px' }}>
              {salesData.data.map((item) => {
                const maxValue = Math.max(...salesData.data.map(d => parseFloat(d.total)));
                const height = (parseFloat(item.total) / maxValue) * 250;
                return (
                  <div key={item.month} className="flex flex-col items-center gap-2">
                    <div className="text-xs font-semibold text-emerald-600">
                      {formatCurrency(parseFloat(item.total))}
                    </div>
                    <div
                      className="w-16 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg hover:from-emerald-700 hover:to-emerald-500 transition-all cursor-pointer"
                      style={{ height: `${height}px` }}
                      title={`${getMonthName(item.month)}: ${formatCurrency(parseFloat(item.total))}`}
                    />
                    <div className="text-sm font-medium text-gray-700">
                      {getMonthName(item.month)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Order Status Breakdown */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Status Pesanan</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-3xl font-bold text-yellow-600">{summary.orders_per_status.pending}</div>
            <div className="text-sm text-gray-600 mt-1">Menunggu</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-3xl font-bold text-blue-600">{summary.orders_per_status.paid}</div>
            <div className="text-sm text-gray-600 mt-1">Dibayar</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-3xl font-bold text-purple-600">{summary.orders_per_status.shipped}</div>
            <div className="text-sm text-gray-600 mt-1">Dikirim</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-3xl font-bold text-green-600">{summary.orders_per_status.completed}</div>
            <div className="text-sm text-gray-600 mt-1">Selesai</div>
          </div>
        </div>
      </div>
    </div>
  );
}
