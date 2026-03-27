import type { Order } from "../../../types";
import type { DashboardSummary as DashboardSumType } from "../../../services/dashboardService";
import { STATUS_COLOR_MAP, type OrderStats } from "./constants";

export const getStatusColor = (status: string): string => {
  return STATUS_COLOR_MAP[status] || "bg-gray-100 text-gray-800 border-gray-300";
};

export const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num || 0);
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const buildOrderStats = (
  summary: DashboardSumType | null,
  orders: Order[]
): OrderStats => {
  if (summary) {
    return {
      total: summary.total_orders || 0,
      pending: summary.orders_per_status?.pending || 0,
      paid: summary.orders_per_status?.paid || 0,
      shipped: summary.orders_per_status?.shipped || 0,
      completed: summary.orders_per_status?.completed || 0,
    };
  }

  return {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    paid: orders.filter((o) => o.status === "paid").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    completed: orders.filter((o) => o.status === "completed").length,
  };
};

export const filterOrders = (
  orders: Order[],
  searchQuery: string,
  selectedStatus: string
): Order[] => {
  return orders.filter((order) => {
    const matchesSearch =
      order.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === "all" || order.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });
};

export const promptTrackingNumber = (): string | undefined => {
  const input = prompt("Masukkan nomor tracking pengiriman:");
  return input || undefined;
};
