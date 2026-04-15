import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LoadingState, ErrorState } from "./StateComponents";
import {
  OrderHeader,
  OrderTracking,
  ShippingTrackingInfo,
  OrderItems,
  OrderPricing,
  CertificatePasswords,
} from "./OrderComponents";
import { ConfirmationInfo, ActionButtons } from "./InfoComponents";
import { useFetchOrder, useConfirmOrder } from "./hooks";
import {
  CSS_CLASSES,
  ORDER_CONFIRMATION_MESSAGES,
  PAYMENT_DESTINATION,
} from "./constants";
import { orderService } from "../../services";
import {
  isOrderCompleted,
  isOrderShipped,
  isOrderBooking,
  isOrderCancelled,
} from "./utils";

const OrderConfirmationPage = () => {
  const { invoiceNumber } = useParams<{ invoiceNumber: string }>();
  const navigate = useNavigate();

  const { order, loading, error, refetch } = useFetchOrder(invoiceNumber);
  const { confirming, confirm } = useConfirmOrder(
    order?.id ?? 0,
    invoiceNumber ?? "",
    order?.items
  );
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // State machines
  if (loading) return <LoadingState />;
  if (error || !order) return <ErrorState error={error} />;

  const handleConfirmCompletion = async () => {
    const success = await confirm();

    if (success) {
      // Reset state and show success screen
      navigate(`/order/confirm/${invoiceNumber}`, { replace: true });
      window.location.reload();
    } else {
      alert(ORDER_CONFIRMATION_MESSAGES.CONFIRM_ERROR);
    }
  };

  const handleCancel = () => navigate("/");

  const handleUploadPayment = async () => {
    if (!invoiceNumber || !paymentProof) {
      setUploadError("Bukti pembayaran wajib diunggah.");
      return;
    }

    if (paymentProof.size > 5 * 1024 * 1024) {
      setUploadError("Ukuran file maksimal 5MB.");
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      await orderService.uploadPaymentProof(invoiceNumber, paymentProof);
      setUploadSuccess(true);
      await refetch();
    } catch (err) {
      console.error("Error uploading payment proof:", err);
      setUploadError("Gagal mengunggah bukti pembayaran. Silakan coba lagi.");
    } finally {
      setUploading(false);
    }
  };

  // Hanya izinkan konfirmasi jika status pesanan sudah dikirim (shipped)
  // dan belum berstatus selesai (completed)
  const canConfirm = isOrderShipped(order.status) && !isOrderCompleted(order.status);
  const canUploadPayment =
    isOrderBooking(order.status) && !isOrderCancelled(order.status);

  return (
    <div className={CSS_CLASSES.pageContainer}>
      {/* Header */}
      <div className={CSS_CLASSES.headerBase}>
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        <div className={CSS_CLASSES.headerContent}>
          <h1 className="text-white text-2xl sm:text-3xl md:text-4xl font-black mb-1">
            Konfirmasi Pesanan
          </h1>
          <p className="text-green-50 text-xs sm:text-sm opacity-90">
            Pesanan sudah diterima? Klik tombol di bawah untuk mengkonfirmasi
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className={CSS_CLASSES.mainContent}>
        <div className={`${CSS_CLASSES.card} space-y-8`}>
          <OrderHeader order={order} />
          <OrderTracking order={order} />
          <ShippingTrackingInfo order={order} />
          <OrderItems items={order.items} />
          <OrderPricing order={order} />
          <CertificatePasswords order={order} />
          {isOrderBooking(order.status) && !isOrderCancelled(order.status) && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-900 text-sm font-bold mb-1">Menunggu Konfirmasi Pembayaran</p>
              <p className="text-amber-700 text-xs sm:text-sm">
                Silakan transfer ke rekening tujuan berikut, lalu unggah bukti transfer Anda.
              </p>
              {order.payment_deadline && (
                <p className="text-amber-700 text-xs mt-2">
                  Batas waktu pembayaran: {new Date(order.payment_deadline).toLocaleString("id-ID")}
                </p>
              )}
            </div>
          )}

          {canUploadPayment && (
            <div className="bg-white border border-amber-200 rounded-2xl p-5 space-y-4">
              <div>
                <p className="text-sm font-bold text-plant-dark">Step 2: Upload Bukti Transfer</p>
                <p className="text-xs text-gray-600 mt-1">
                  Lakukan transfer ke rekening berikut, lalu unggah bukti transfer pada form di bawah ini.
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                <p className="text-xs text-amber-700 mb-1">Nomor Rekening Tujuan</p>
                <p className="text-lg font-black text-plant-dark tracking-wide">{PAYMENT_DESTINATION.accountNumber}</p>
                <p className="text-sm text-amber-800 mt-1">
                  {PAYMENT_DESTINATION.bankName} a.n. {PAYMENT_DESTINATION.accountHolder}
                </p>
              </div>

              <p className="text-sm font-bold text-plant-dark">Upload Bukti Transfer</p>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  setPaymentProof(e.target.files?.[0] || null);
                  setUploadError(null);
                  setUploadSuccess(false);
                }}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-plant-green file:text-white hover:file:bg-green-700"
              />
              {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
              {uploadSuccess && (
                <p className="text-xs text-green-600">
                  Bukti pembayaran berhasil dikirim. Menunggu verifikasi admin.
                </p>
              )}
              <button
                onClick={handleUploadPayment}
                disabled={uploading || !paymentProof}
                className={`w-full px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                  uploading || !paymentProof
                    ? "bg-gray-200 text-gray-500"
                    : "bg-plant-green text-white hover:bg-green-700"
                }`}
              >
                {uploading ? "Mengunggah..." : "Kirim Bukti Pembayaran"}
              </button>
            </div>
          )}

          {isOrderCancelled(order.status) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm font-bold">Pesanan Dibatalkan</p>
              <p className="text-red-600 text-xs mt-1">
                Batas waktu pembayaran terlewat. Silakan buat pesanan baru jika masih berminat.
              </p>
            </div>
          )}

          {canConfirm && <ConfirmationInfo />}

          <ActionButtons
            onCancel={handleCancel}
            onConfirm={handleConfirmCompletion}
            isLoading={confirming}
            disabled={!canConfirm}
          />
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
