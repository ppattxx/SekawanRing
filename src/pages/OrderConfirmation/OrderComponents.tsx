import type { Order } from "../../types";
import {
  ORDER_STATUS_COLORS,
  TRACKING_STEPS_BASE,
  TRACKING_STEPS_WITH_PAYMENT_REQUEST,
} from "./constants";
import {
  formatCurrency,
  calculateOrderPrices,
  getStatusLabel,
  isOrderShipped,
  isOrderPaid,
  isOrderCompleted,
  isOrderBooking,
  isOrderCancelled,
  hasPaymentRequestInfo,
} from "./utils";

interface OrderHeaderProps {
  order: Order;
}

export const OrderHeader = ({ order }: OrderHeaderProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-8 border-b border-gray-200">
    <div>
      <p className="text-gray-500 text-sm font-medium mb-1">Nomor Invoice</p>
      <p className="text-lg sm:text-xl font-black text-plant-dark">{order.invoice_number}</p>
    </div>
    <div>
      <p className="text-gray-500 text-sm font-medium mb-1">Status Pesanan</p>
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${ORDER_STATUS_COLORS[order.status]}`} />
        <p className="text-lg sm:text-xl font-black">
          {getStatusLabel(order.status)}
        </p>
      </div>
    </div>
  </div>
);

interface TrackingStepProps {
  step: number;
  label: string;
  isCompleted: boolean;
  isActive: boolean;
}

const TrackingStep = ({ step, label, isCompleted, isActive }: TrackingStepProps) => (
  <div className="flex flex-col items-center flex-1">
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mb-2 ${
        isCompleted || isActive ? "bg-green-500" : "bg-gray-300"
      }`}
    >
      {isCompleted ? "✓" : step}
    </div>
    <p className="text-xs text-center font-medium">{label}</p>
  </div>
);

interface TrackingLineProps {
  isCompleted: boolean;
}

const TrackingLine = ({ isCompleted }: TrackingLineProps) => (
  <div className={`flex-1 h-1 mx-2 ${isCompleted ? "bg-green-500" : "bg-gray-300"}`} />
);

const getTrackingProgress = (order: Order): number => {
  const paymentRequested = hasPaymentRequestInfo(order);

  if (order.status === "booking") return paymentRequested ? 2 : 1;
  if (order.status === "paid") return paymentRequested ? 3 : 2;
  if (order.status === "shipped") return paymentRequested ? 4 : 3;
  if (order.status === "completed") return paymentRequested ? 5 : 4;
  return paymentRequested ? 2 : 1;
};

export const OrderTracking = ({ order }: OrderHeaderProps) => {
  const status = order.status;
  const isCancelled = isOrderCancelled(status);
  const steps = hasPaymentRequestInfo(order)
    ? TRACKING_STEPS_WITH_PAYMENT_REQUEST
    : TRACKING_STEPS_BASE;
  const currentStep = getTrackingProgress(order);

  return (
    <div className="pb-8 border-b border-gray-200">
      <p className="text-gray-500 text-sm font-medium mb-4">Status Pengiriman</p>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.order}>
            <TrackingStep
              step={step.order}
              label={step.label}
              isCompleted={!isCancelled && step.order < currentStep}
              isActive={!isCancelled && step.order === currentStep}
            />

            {index < steps.length - 1 && (
              <TrackingLine
                isCompleted={!isCancelled && step.order < currentStep}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

interface OrderCustomerProps {
  order: Order;
}

export const OrderCustomerInfo = ({ order }: OrderCustomerProps) => (
  <div className="pb-8 border-b border-gray-200">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
      <div>
        <p className="text-gray-500 text-sm font-medium mb-2">Data Penerima</p>
        <div className="space-y-1.5 text-sm text-gray-700">
          <p className="font-semibold text-plant-dark">{order.customer_name || "-"}</p>
          <p>{order.customer_phone || "-"}</p>
          <p className="text-xs text-gray-500">{order.customer_email || "-"}</p>
        </div>
      </div>

      <div>
        <p className="text-gray-500 text-sm font-medium mb-2">Alamat Pengiriman</p>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
          {order.shipping_address || "Alamat belum tersedia"}
        </p>
      </div>
    </div>

    <div className="mt-4 pt-4 border-t border-gray-100">
      <p className="text-gray-500 text-sm font-medium mb-1">Informasi Pengiriman</p>
      {order.tracking_number ? (
        <p className="text-gray-700 text-sm">
          <span className="font-semibold">Nomor Resi: </span>
          <span className="font-mono">{order.tracking_number}</span>
        </p>
      ) : (
        <p className="text-gray-600 text-sm">Nomor resi akan muncul di sini setelah paket dikirim.</p>
      )}
    </div>
  </div>
);

interface OrderItemsProps {
  items: Order["items"];
}

export const OrderItems = ({ items }: OrderItemsProps) => (
  <div className="pb-8 border-b border-gray-200">
    <p className="text-gray-500 text-sm font-medium mb-4">Detail Pesanan</p>
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="font-bold text-plant-dark">{item.item.name}</p>
            <p className="text-gray-600 text-sm">Qty: {item.quantity}</p>
          </div>
          <p className="font-bold text-plant-dark">
            {formatCurrency(item.item.price * item.quantity)}
          </p>
        </div>
      ))}
    </div>
  </div>
);

interface OrderPricingProps {
  order: Order;
}

export const OrderPricing = ({ order }: OrderPricingProps) => {
  const { subtotal, shipping, total, hasShippingCost } = calculateOrderPrices(order);

  return (
    <div className="space-y-3 pb-8 border-b border-gray-200">
      <div className="flex justify-between text-gray-600">
        <p>Subtotal</p>
        <p className="font-bold">{formatCurrency(subtotal)}</p>
      </div>
      <div className="flex justify-between text-gray-600">
        <p>Biaya Pengiriman</p>
        <p className="font-bold">
          {hasShippingCost ? formatCurrency(shipping) : "Menunggu ongkir"}
        </p>
      </div>
      <div className="flex justify-between text-lg">
        <p className="font-bold text-plant-dark">Total</p>
        <p className="font-black text-plant-dark">{formatCurrency(total)}</p>
      </div>
    </div>
  );
};
