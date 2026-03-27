import { useParams, useNavigate } from "react-router-dom";
import { LoadingState, ErrorState, SuccessState } from "./StateComponents";
import {
  OrderHeader,
  OrderTracking,
  OrderCustomerInfo,
  OrderItems,
  OrderPricing,
} from "./OrderComponents";
import { ConfirmationInfo, ActionButtons } from "./InfoComponents";
import { useFetchOrder, useConfirmOrder } from "./hooks";
import { CSS_CLASSES, ORDER_CONFIRMATION_MESSAGES } from "./constants";

const OrderConfirmationPage = () => {
  const { invoiceNumber } = useParams<{ invoiceNumber: string }>();
  const navigate = useNavigate();

  const { order, loading, error } = useFetchOrder(invoiceNumber);
  const { confirming, confirm } = useConfirmOrder(order?.id ?? 0, invoiceNumber ?? "");

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

  // Hanya izinkan konfirmasi jika status pesanan sudah dikirim (shipped)
  const canConfirm = order.status === "shipped";

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
          <OrderCustomerInfo order={order} />
          <OrderItems items={order.items} />
          <OrderPricing order={order} />
          <ConfirmationInfo />
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
