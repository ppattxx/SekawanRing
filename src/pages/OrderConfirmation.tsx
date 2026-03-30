import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { orderService } from "../services";
import type { Order } from "../types";

export default function OrderConfirmation() {
  const { invoiceNumber } = useParams<{ invoiceNumber: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!invoiceNumber) {
          setError("Nomor invoice tidak ditemukan");
          return;
        }

        const response = await orderService.getOrderByInvoice(invoiceNumber);
        const orderData = response.order || response;
        setOrder(orderData);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Pesanan tidak ditemukan. Pastikan tautan dari invoice valid.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [invoiceNumber]);

  const handleConfirmCompletion = async () => {
    if (!order) return;

    setConfirming(true);
    try {
      await orderService.updateOrderStatus(order.id, "completed", order.invoice_number);
      setConfirmed(true);
    } catch (err) {
      console.error("Error confirming order:", err);
      setError("Gagal mengkonfirmasi pesanan. Silakan coba lagi.");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FBF9] pb-20 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
          <div className="animate-spin w-12 h-12 border-4 border-plant-green border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat pesanan...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#F8FBF9] pb-20">
        <div className="bg-plant-green pt-6 sm:pt-8 pb-16 sm:pb-20 px-4 sm:px-6 md:px-12 rounded-b-[1.5rem] sm:rounded-b-[2rem]">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-white text-2xl sm:text-3xl font-black">Konfirmasi Pesanan</h1>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-10 -mt-8 relative z-10">
          <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-8 sm:p-12 text-center shadow-sm border border-gray-100">
            <h2 className="text-xl sm:text-2xl font-black text-red-600 mb-2">
              Pesanan Tidak Ditemukan
            </h2>
            <p className="text-gray-600 mb-6">
              {error || "Pesanan tidak dapat ditemukan. Pastikan tautan dari invoice valid."}
            </p>
            <button
              onClick={() => navigate("/")}
              className="inline-block bg-plant-dark text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-[#F8FBF9] pb-20">
        <div className="bg-plant-green pt-6 sm:pt-8 pb-16 sm:pb-20 px-4 sm:px-6 md:px-12 rounded-b-[1.5rem] sm:rounded-b-[2rem]">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-white text-2xl sm:text-3xl font-black">Konfirmasi Pesanan</h1>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-10 -mt-8 relative z-10">
          <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-8 sm:p-12 text-center shadow-sm border border-gray-100">
            <h2 className="text-xl sm:text-2xl font-black text-plant-green mb-2">
              Pesanan Dikonfirmasi!
            </h2>
            <p className="text-gray-600 mb-2">
              Terima kasih telah mengkonfirmasi pesanan Anda.
            </p>
            <p className="text-gray-500 mb-6">
              Kami akan segera memproses pesanan dengan nomor invoice{" "}
              <span className="font-bold text-plant-dark">{order.invoice_number}</span>
            </p>
            <button
              onClick={() => navigate("/")}
              className="inline-block bg-plant-dark text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = order.items.reduce(
    (sum, item) => sum + (item.item.price * item.quantity),
    0
  );
  const shipping = subtotal > 10_000_000 ? 0 : 150_000;
  const total = subtotal + shipping;
  const canConfirm = order.status === "shipped";

  return (
    <div className="min-h-screen bg-[#F8FBF9] pb-20">
      <div className="bg-plant-green pt-6 sm:pt-8 pb-16 sm:pb-20 px-4 sm:px-6 md:px-12 rounded-b-[1.5rem] sm:rounded-b-[2rem] relative z-0 overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        <div className="max-w-5xl mx-auto relative z-10">
          <h1 className="text-white text-2xl sm:text-3xl md:text-4xl font-black mb-1">
            Konfirmasi Pesanan
          </h1>
          <p className="text-green-50 text-xs sm:text-sm opacity-90">
            Pesanan sudah diterima? Klik tombol di bawah untuk mengkonfirmasi
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-10 -mt-6 relative z-10">
        <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-8 sm:p-10 shadow-sm border border-gray-100 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-8 border-b border-gray-200">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Nomor Invoice</p>
              <p className="text-lg sm:text-xl font-black text-plant-dark">{order.invoice_number}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Status Pesanan</p>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  order.status === "completed" ? "bg-green-500" : 
                  order.status === "shipped" ? "bg-blue-500" :
                  order.status === "paid" ? "bg-purple-500" :
                  "bg-yellow-500"
                }`}></div>
                <p className="text-lg sm:text-xl font-black capitalize">
                  {order.status === "completed" ? "Selesai" : 
                   order.status === "shipped" ? "Dikirim" :
                   order.status === "paid" ? "Dibayar" :
                   "Menunggu"}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Tracking */}
          <div className="pb-8 border-b border-gray-200">
            <p className="text-gray-500 text-sm font-medium mb-4">Status Pengiriman</p>
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mb-2 ${order.status === "pending" ? "bg-yellow-500" : "bg-green-500"}`}>
                  ✓
                </div>
                <p className="text-xs text-center font-medium">Pesanan Diterima</p>
              </div>
              <div className={`flex-1 h-1 mx-2 ${order.status !== "pending" ? "bg-green-500" : "bg-gray-300"}`}></div>
              
              <div className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mb-2 ${
                  order.status === "paid" || order.status === "shipped" || order.status === "completed" ? "bg-green-500" : "bg-gray-300"
                }`}>
                  {order.status === "paid" || order.status === "shipped" || order.status === "completed" ? "✓" : "2"}
                </div>
                <p className="text-xs text-center font-medium">Pembayaran Dikonfirmasi</p>
              </div>
              <div className={`flex-1 h-1 mx-2 ${order.status === "shipped" || order.status === "completed" ? "bg-green-500" : "bg-gray-300"}`}></div>
              
              <div className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mb-2 ${
                  order.status === "shipped" || order.status === "completed" ? "bg-green-500" : "bg-gray-300"
                }`}>
                  {order.status === "shipped" || order.status === "completed" ? "✓" : "3"}
                </div>
                <p className="text-xs text-center font-medium">Paket Dikirim</p>
              </div>
              <div className={`flex-1 h-1 mx-2 ${order.status === "completed" ? "bg-green-500" : "bg-gray-300"}`}></div>
              
              <div className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mb-2 ${
                  order.status === "completed" ? "bg-green-500" : "bg-gray-300"
                }`}>
                  {order.status === "completed" ? "✓" : "4"}
                </div>
                <p className="text-xs text-center font-medium">Pesanan Selesai</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-8 border-b border-gray-200">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-2">Data Penerima</p>
              <p className="font-bold text-plant-dark mb-1">{order.customer_name}</p>
              <p className="text-gray-600 text-sm mb-1">{order.customer_phone}</p>
              <p className="text-gray-600 text-sm">{order.customer_email}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium mb-2">Alamat Pengiriman</p>
              <p className="text-gray-700 text-sm leading-relaxed">{order.shipping_address}</p>
            </div>
          </div>

          <div className="pb-8 border-b border-gray-200">
            <p className="text-gray-500 text-sm font-medium mb-4">Detail Pesanan</p>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-bold text-plant-dark">{item.item.name}</p>
                    <p className="text-gray-600 text-sm">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-plant-dark">
                    Rp {(item.item.price * item.quantity).toLocaleString("id-ID")}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 pb-8 border-b border-gray-200">
            <div className="flex justify-between text-gray-600">
              <p>Subtotal</p>
              <p className="font-bold">Rp {subtotal.toLocaleString("id-ID")}</p>
            </div>
            <div className="flex justify-between text-gray-600">
              <p>Biaya Pengiriman</p>
              <p className="font-bold">{shipping === 0 ? "Gratis" : `Rp ${shipping.toLocaleString("id-ID")}`}</p>
            </div>
            <div className="flex justify-between text-lg">
              <p className="font-bold text-plant-dark">Total</p>
              <p className="font-black text-plant-dark">Rp {total.toLocaleString("id-ID")}</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-900 text-sm">
              <span className="font-bold">Informasi:</span> Silakan periksa barang yang Anda terima. 
              Jika sesuai dengan pesanan, klik tombol "Konfirmasi Pesanan Selesai" di bawah.
            </p>
          </div>

          <div className="flex gap-3 flex-col sm:flex-row">
            <button
              onClick={() => navigate("/")}
              className="flex-1 px-6 py-3 rounded-xl font-bold border-2 border-gray-300 text-plant-dark hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleConfirmCompletion}
              disabled={confirming || !canConfirm}
              className={`flex-1 px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${
                confirming || !canConfirm
                  ? "bg-gray-300 text-gray-500 hover:bg-gray-300"
                  : "bg-plant-green text-white hover:bg-green-700"
              }`}
            >
              {confirming ? "Mengkonfirmasi..." : "Konfirmasi Pesanan Selesai"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
