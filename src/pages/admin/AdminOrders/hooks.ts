import { useState, useEffect, useCallback } from "react";
import { orderService, dashboardService } from "../../../services";
import { getLocalOrders, updateLocalOrderStatus } from "../../../services/orderService";
import type { Order } from "../../../types";
import type { DashboardSummary } from "../../../services/dashboardService";
import { MESSAGES, ORDERS_ENDPOINT_AVAILABLE } from "./constants";
import { showAlert, showPrompt } from "../../../utils/appDialog";

interface UseOrdersResult {
  orders: Order[];
  summary: DashboardSummary | null;
  loading: boolean;
  error: string | null;
  loadOrders: () => Promise<void>;
}

export const useOrders = (): UseOrdersResult => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch summary
      try {
        const summaryData = await dashboardService.getSummary();
        setSummary(summaryData || null);
      } catch {
        setSummary(null);
      }

      // Fetch orders
      if (!ORDERS_ENDPOINT_AVAILABLE) {
        const localOrders = getLocalOrders().sort(
          (a: Order, b: Order) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setOrders(localOrders);
        return;
      }

      const ordersData = await orderService.getAllOrders();
      const sortedOrders = (ordersData as Order[]).sort(
        (a: Order, b: Order) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setOrders(sortedOrders);
    } catch (err) {
      console.error("Error loading orders:", err);
      setError(MESSAGES.FETCH_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return { orders, summary, loading, error, loadOrders };
};

interface UseOrderStatusUpdateResult {
  updatingId: number | null;
  updateStatus: (
    orderId: number,
    newStatus: "booking" | "paid" | "shipped" | "completed" | "cancelled",
    targetOrder: Order | undefined,
    orders: Order[]
  ) => Promise<boolean>;
}

export const useOrderStatusUpdate = (
  onSuccess: (updatedOrders: Order[]) => void
): UseOrderStatusUpdateResult => {
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const updateStatus = useCallback(
    async (
      orderId: number,
      newStatus: "booking" | "paid" | "shipped" | "completed" | "cancelled",
      targetOrder: Order | undefined,
      orders: Order[]
    ): Promise<boolean> => {
      try {
        setUpdatingId(orderId);

        if (ORDERS_ENDPOINT_AVAILABLE) {
          if (newStatus === "booking") {
            await showAlert(MESSAGES.INVALID_PENDING_STATUS, {
              title: "Aksi Tidak Diizinkan",
              tone: "warning",
            });
            setUpdatingId(null);
            return false;
          }

          let trackingNumber: string | undefined;
          if (newStatus === "shipped") {
            trackingNumber =
              (await showPrompt(MESSAGES.TRACKING_PROMPT, {
                title: "Input Nomor Resi",
                confirmText: "Simpan",
                cancelText: "Batal",
                placeholder: "Contoh: JNE123456789",
                tone: "info",
              })) || undefined;
            if (!trackingNumber) {
              await showAlert(MESSAGES.TRACKING_REQUIRED, {
                title: "Input Wajib",
                tone: "warning",
              });
              setUpdatingId(null);
              return false;
            }
          }

          try {
            if (newStatus === "cancelled") {
              await orderService.cancelOrder(orderId, targetOrder?.invoice_number);
            } else {
              await orderService.updateOrderStatus(
                orderId,
                newStatus,
                targetOrder?.invoice_number,
                trackingNumber
              );
            }
          } catch (apiError: any) {
            const errorMessage = apiError?.message ?? "Gagal menghubungi server";
            await showAlert(`${MESSAGES.UPDATE_ERROR_API}\n${errorMessage}`, {
              title: "Update Gagal",
              tone: "danger",
            });
            setUpdatingId(null);
            return false;
          }
        }

        const updatedOrders = updateLocalOrderStatus(orderId, newStatus);
        onSuccess(updatedOrders);
        return true;
      } catch (error) {
        console.error("Error updating order status:", error);
        await showAlert(MESSAGES.UPDATE_ERROR, {
          title: "Update Gagal",
          tone: "danger",
        });
        return false;
      } finally {
        setUpdatingId(null);
      }
    },
    [onSuccess]
  );

  return { updatingId, updateStatus };
};
