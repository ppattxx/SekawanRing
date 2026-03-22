import type { Order } from "../../types";
import { ORDER_STATUS_LABELS, SHIPPING_THRESHOLD, SHIPPING_COST } from "./constants";

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export const calculateOrderPrices = (order: Order) => {
  const subtotal = order.items.reduce(
    (sum, item) => sum + item.item.price * item.quantity,
    0
  );

  const shipping = subtotal > SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;

  return { subtotal, shipping, total };
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

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
