import api from './api';
import type { Order, Item } from '../types';
import { useCartStore, type CartItem } from '../store/useCartStore';

const LOCAL_ORDERS_KEY = 'sekawan_admin_orders';

const normalizeLocalOrders = (value: unknown): Order[] => {
  if (!Array.isArray(value)) return [];
  return value as Order[];
};

export const getLocalOrders = (): Order[] => {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return normalizeLocalOrders(parsed);
  } catch {
    return [];
  }
};

export const saveLocalOrder = (order: Order): void => {
  const existing = getLocalOrders();
  const idx = existing.findIndex((o) => o.id === order.id || o.invoice_number === order.invoice_number);
  if (idx >= 0) {
    existing[idx] = order;
  } else {
    existing.unshift(order);
  }
  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(existing));
};

export const updateLocalOrderStatus = (
  orderId: number,
  status: 'pending' | 'paid' | 'shipped' | 'completed'
): Order[] => {
  const updated = getLocalOrders().map((order) =>
    order.id === orderId ? { ...order, status, updated_at: new Date().toISOString() } : order
  );
  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updated));
  return updated;
};

export const convertCartToOrderItems = (cartItems: CartItem[]): { item_id: number; qty: number }[] => {
  return cartItems.map((item) => ({
    item_id: item.id,
    qty: item.qty,
  }));
};

export const getCurrentCartAsOrderItems = (): { item_id: number; qty: number }[] => {
  const cart = useCartStore.getState().cart;
  return convertCartToOrderItems(cart);
};

interface CreateOrderPayload {
  customer: {
    name: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postal_code: string;
  };
  items: {
    item_id: number;
    qty: number;
  }[];
  payment_proof: File;
}

type OrderItemsInput = { item_id: number; qty: number }[] | CartItem[];

interface CreateOrderFromCartPayload {
  customer: CreateOrderPayload['customer'];
  items: OrderItemsInput;
  payment_proof: File;
}

interface OrderResponse {
  order: Order;
  items: Item[];
}

type TransactionAction = 'verify' | 'ship' | 'complete' | 'cancel';

const getTransactionActionByStatus = (
  status: 'paid' | 'shipped' | 'completed'
): TransactionAction => {
  switch (status) {
    case 'paid':
      return 'verify';
    case 'shipped':
      return 'ship';
    case 'completed':
      return 'complete';
    default:
      return 'verify';
  }
};

export const orderService = {
  createOrder: async (
    payload: CreateOrderFromCartPayload
  ): Promise<Order> => {
    try {
      const formData = new FormData();
      
      const normalizedItems = payload.items?.map((item) => {
        if ('id' in item) {
          return { item_id: item.id, qty: item.qty };
        }
        return item;
      }) || [];
      
      formData.append('customer[name]', payload.customer.name);
      formData.append('customer[phone]', payload.customer.phone);
      formData.append('customer[address]', payload.customer.address);
      formData.append('customer[city]', payload.customer.city);
      formData.append('customer[province]', payload.customer.province);
      formData.append('customer[postal_code]', payload.customer.postal_code);
      
      normalizedItems.forEach((item, index) => {
        formData.append(`items[${index}][item_id]`, item.item_id.toString());
        formData.append(`items[${index}][qty]`, item.qty.toString());
      });
      
      // Add payment proof file
      formData.append('payment_proof', payload.payment_proof);
      
      const response = await api.post('/checkout', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  getAllOrders: async (): Promise<Order[]> => {
    try {
      const response = await api.get('/orders');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  createOrderFromCart: async (
    customer: CreateOrderPayload['customer'],
    paymentProof: File
  ): Promise<Order> => {
    const cartItems = useCartStore.getState().cart;
    if (cartItems.length === 0) {
      throw new Error('Cart is empty');
    }
    
    const items = convertCartToOrderItems(cartItems);
    
    return orderService.createOrder({
      customer,
      items,
      payment_proof: paymentProof,
    });
  },

  getOrderById: async (id: number): Promise<OrderResponse> => {
    try {
      const response = await api.get(`/orders/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching order ${id}:`, error);
      throw error;
    }
  },

  getOrderByInvoice: async (invoiceNumber: string): Promise<OrderResponse> => {
    try {
      const response = await api.get(`/orders/invoice/${invoiceNumber}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching order with invoice ${invoiceNumber}:`, error);
      throw error;
    }
  },

  updateOrderStatus: async (
    id: number,
    status: 'pending' | 'paid' | 'shipped' | 'completed',
    invoiceNumber?: string
  ): Promise<Order> => {
    try {
      if (status === 'pending') {
        throw new Error('Status pending tidak didukung untuk update via transaction action.');
      }

      const action = getTransactionActionByStatus(status);
      const payload: Record<string, string | number> = {
        id,
        order_id: id,
      };

      if (invoiceNumber) {
        payload.invoice_number = invoiceNumber;
      }

      const response = await api.post(`/transaction/${action}`, payload);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error updating order ${id} status:`, error);
      throw error;
    }
  },

  cancelOrder: async (id: number, invoiceNumber?: string): Promise<Order> => {
    try {
      const payload: Record<string, string | number> = {
        id,
        order_id: id,
      };

      if (invoiceNumber) {
        payload.invoice_number = invoiceNumber;
      }

      const response = await api.post('/transaction/cancel', payload);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error canceling order ${id}:`, error);
      throw error;
    }
  },
};
