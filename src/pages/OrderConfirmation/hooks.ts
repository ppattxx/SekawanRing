import { useState, useEffect, useCallback } from "react";
import { orderService } from "../../services";
import type { Order } from "../../types";
import { ORDER_CONFIRMATION_MESSAGES } from "./constants";

interface UseFetchOrderResult {
  order: Order | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useFetchOrder = (invoiceNumber: string | undefined): UseFetchOrderResult => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!invoiceNumber) {
      setError(ORDER_CONFIRMATION_MESSAGES.INVOICE_NOT_FOUND);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await orderService.getOrderByInvoice(invoiceNumber);
      const orderData = response.order || response;

      setOrder(orderData);
    } catch (err) {
      console.error("Error fetching order:", err);
      setError(ORDER_CONFIRMATION_MESSAGES.FETCH_ERROR);
    } finally {
      setLoading(false);
    }
  }, [invoiceNumber]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return { order, loading, error, refetch: fetchOrder };
};

interface UseConfirmOrderResult {
  confirming: boolean;
  confirm: () => Promise<boolean>;
}

export const useConfirmOrder = (orderId: number, invoiceNumber: string): UseConfirmOrderResult => {
  const [confirming, setConfirming] = useState(false);

  const confirm = useCallback(async (): Promise<boolean> => {
    try {
      setConfirming(true);
      await orderService.updateOrderStatus(orderId, "completed", invoiceNumber);
      return true;
    } catch (err) {
      console.error("Error confirming order:", err);
      return false;
    } finally {
      setConfirming(false);
    }
  }, [orderId, invoiceNumber]);

  return { confirming, confirm };
};
