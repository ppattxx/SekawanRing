import type { Order } from "../../types";
import { ORDER_STATUS_LABELS } from "./constants";

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export const calculateOrderPrices = (order: Order) => {
  // Total price dari backend adalah sumber kebenaran utama
  const backendTotal = Number(order.total_price) || 0;
  const shippingRaw = order.shipping_cost;
  const parsedShipping = Number(shippingRaw);
  const hasShippingCost =
    shippingRaw !== undefined && shippingRaw !== null && Number.isFinite(parsedShipping);

  // Jika backend tidak mengirim total_price, jatuhkan ke penjumlahan item
  const itemsSum = order.items.reduce(
    (sum, item) => sum + item.item.price * item.quantity,
    0
  );

  const shipping = hasShippingCost ? parsedShipping : 0;
  const total = backendTotal || itemsSum + shipping;

  const subtotal = hasShippingCost ? Math.max(total - shipping, 0) : itemsSum;

  return { subtotal, shipping, total, hasShippingCost };
};

export const getStatusLabel = (status: string): string => {
  return ORDER_STATUS_LABELS[status] || status;
};

export const isOrderCompleted = (status: string): boolean => {
  return status === "completed";
};

export const isOrderShipped = (status: string): boolean => {
  return status === "shipped" || status === "completed";
};

export const isOrderPaid = (status: string): boolean => {
  return status === "paid" || status === "shipped" || status === "completed";
};

export const isOrderBooking = (status: string): boolean => {
  return status === "booking";
};

export const isOrderCancelled = (status: string): boolean => {
  return status === "cancelled";
};

export const hasPaymentRequestInfo = (order: Order): boolean => {
  const shippingValue = Number(order.shipping_cost);
  const hasShippingCost =
    order.shipping_cost !== undefined &&
    order.shipping_cost !== null &&
    Number.isFinite(shippingValue);

  return hasShippingCost || Boolean(order.payment_deadline);
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
