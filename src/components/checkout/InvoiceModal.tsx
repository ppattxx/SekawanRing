import { Link } from "react-router-dom";
import type { OrderResult } from "../../types";

interface InvoiceModalProps {
  order: OrderResult;
  onClose: () => void;
}

export default function InvoiceModal({ order, onClose }: InvoiceModalProps) {
  const formattedDate = new Date(order.created_at).toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-[2rem] max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in">
        {/* Success Header */}
        <div className="bg-gradient-to-br from-plant-green to-emerald-600 px-5 sm:px-8 pt-8 sm:pt-10 pb-6 sm:pb-8 rounded-t-[2rem] text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-xl" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

          <div className="relative z-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg
                className="w-8 h-8 sm:w-10 sm:h-10 text-plant-green"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-white text-xl sm:text-2xl font-black mb-1">
              Pesanan Berhasil!
            </h2>
            <p className="text-green-100 text-sm">
              Terima kasih atas pembelian Anda
            </p>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="px-5 sm:px-8 py-5 sm:py-6 space-y-5">
          {/* Invoice Number */}
          <div className="bg-plant-light rounded-xl p-4 text-center">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
              Nomor Invoice
            </p>
            <p className="text-lg sm:text-xl font-black text-plant-green">
              {order.invoice_number}
            </p>
            <p className="text-xs text-gray-400 mt-1">{formattedDate}</p>
          </div>

          {/* Customer Info */}
          <div className="space-y-2">
            <h4 className="font-bold text-plant-dark text-sm">
              Informasi Pembeli
            </h4>
            <div className="grid grid-cols-2 gap-y-1.5 text-sm">
              <span className="text-gray-400">Nama</span>
              <span className="font-medium text-plant-dark">
                {order.customer_name}
              </span>
              <span className="text-gray-400">Email</span>
              <span className="font-medium text-plant-dark">
                {order.customer_email}
              </span>
              <span className="text-gray-400">WhatsApp</span>
              <span className="font-medium text-plant-dark">
                {order.customer_phone}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-plant-dark text-sm">
              Alamat Pengiriman
            </h4>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
              {order.shipping_address}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-plant-dark text-sm">Detail Pesanan</h4>
            <div className="space-y-2">
              {order.items.map(({ item, quantity }, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded-xl"
                >
                  <div className="flex items-center gap-2">
                    <span>🦅</span>
                    <span className="font-medium text-plant-dark">
                      {item.name}
                    </span>
                    <span className="text-gray-400">×{quantity}</span>
                  </div>
                  <span className="font-bold text-plant-dark">
                    Rp {(item.price * quantity).toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-600">Total Bayar</span>
              <span className="text-xl sm:text-2xl font-black text-plant-green">
                Rp {order.total_price.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-amber-700 font-bold text-sm">
              ⏳ Status: Menunggu Pembayaran
            </p>
            <p className="text-amber-600 text-xs mt-1">
              Silakan lakukan pembayaran sesuai instruksi yang dikirim ke email Anda.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-blue-900 font-bold text-sm mb-3">
              🔗 Link Konfirmasi Pesanan
            </p>
            <p className="text-blue-800 text-xs mb-3">
              Bagikan link ini ke nomor WhatsApp Anda untuk memproses pesanan setelah pembayaran diterima:
            </p>
            <div className="bg-white border border-blue-200 rounded-lg p-3 mb-3 break-all">
              <p className="text-blue-600 text-xs font-mono">
                {`${window.location.origin}/order/confirm/${order.invoice_number}`}
              </p>
            </div>
            <button
              onClick={() => {
                const link = `${window.location.origin}/order/confirm/${order.invoice_number}`;
                navigator.clipboard.writeText(link);
                alert("Link copied to clipboard!");
              }}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-2 rounded-lg transition-colors"
            >
              Salin Link
            </button>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Link
              to="/"
              onClick={onClose}
              className="w-full bg-plant-dark text-white py-3.5 rounded-xl font-bold text-center hover:bg-gray-800 transition-colors"
            >
              Kembali ke Beranda
            </Link>
            <Link
              to="/katalog"
              onClick={onClose}
              className="w-full text-center text-plant-green font-bold text-sm hover:underline"
            >
              Lanjut Belanja
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .animate-in {
          animation: modalIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
