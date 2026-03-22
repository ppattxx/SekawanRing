import api from './api';
import type { Order, Item } from '../types';
import { useCartStore, type CartItem } from '../store/useCartStore';
import axios from 'axios';

const LOCAL_ORDERS_KEY = 'sekawan_admin_orders';

// Separate API client for transaction endpoints
const transactionApi = axios.create({
  baseURL: 'https://sekawan-bf.com/api',
  // Don't set Content-Type here, let axios auto-set based on data
  timeout: 10000,
});

// Copy auth interceptor to transaction API
transactionApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const normalizeLocalOrders = (value: unknown): Order[] => {
  if (!Array.isArray(value)) return [];
  return value as Order[];
};

const normalizeOrderResponse = (order: any): Order => {
  // Handle different response formats from API
  return {
    id: order.id,
    invoice_number: order.invoice_number,
    total_price: order.total_price || order.total || 0,
    status: order.status || 'pending',
    customer_name: order.customer_name || order.customer?.name || '',
    customer_email: order.customer_email || order.customer?.email || '',
    customer_phone: order.customer_phone || order.customer?.phone || '',
    shipping_address: order.shipping_address || order.customer?.address || '',
    items: normalizeOrderItems(order.items || []),
    created_at: order.created_at || new Date().toISOString(),
    updated_at: order.updated_at,
  };
};

const normalizeOrderItems = (items: any[]): Order['items'] => {
  if (!Array.isArray(items)) return [];
  
  return items.map((item, idx) => {
    console.log(`[OrderItem ${idx}]`, JSON.stringify(item, null, 2));
    
    if (item.item && typeof item.item === 'object' && item.quantity) {
      return {
        item: item.item,
        quantity: item.quantity,
      };
    }
    
    if (item.name && item.price) {
      return {
        item: {
          id: item.id || item.item_id || 0,
          catalog_id: item.catalog_id || 0,
          name: item.name,
          price: Number(item.price),
          stock: item.stock || 0,
          description: item.description || '',
          image_url: item.image_url || '',
        },
        quantity: item.quantity || item.qty || 1,
      };
    }

    if (item.item_id) {
      return {
        item: {
          id: item.item_id,
          catalog_id: item.catalog_id || 0,
          name: item.item_name || item.name || 'Unknown',
          price: item.item_price ? Number(item.item_price) : (item.price ? Number(item.price) : 0),
          stock: item.stock || 0,
          description: item.description || '',
          image_url: item.image_url || '',
        },
        quantity: item.quantity || item.qty || 1,
      };
    }
    
    console.warn(`[OrderItem ${idx}] Could not normalize:`, item);
    return {
      item: {
        id: 0,
        catalog_id: 0,
        name: 'Unknown',
        price: 0,
        stock: 0,
        description: '',
        image_url: '',
      },
      quantity: 1,
    };
  });
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
  items: { item: Item; quantity: number; }[];
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

const getTrackingUrl = (invoiceNumber: string): string => {
  const baseUrl = 'https://sekawan-bf.com';
  return `${baseUrl}/order/confirm/${invoiceNumber}`;
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
      const ordersData = response.data.data || response.data;
      
      // Normalize each order
      if (Array.isArray(ordersData)) {
        return ordersData.map(normalizeOrderResponse);
      }
      
      return [];
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
      const orderData = response.data.data || response.data;
      const order = normalizeOrderResponse(orderData);
      return {
        order,
        items: order.items,
      };
    } catch (error) {
      console.error(`Error fetching order ${id}:`, error);
      throw error;
    }
  },

  getOrderByInvoice: async (invoiceNumber: string): Promise<OrderResponse> => {
    try {
      const response = await api.get(`/orders/invoice/${invoiceNumber}`);
      const orderData = response.data.data || response.data;
      const order = normalizeOrderResponse(orderData);
      return {
        order,
        items: order.items,
      };
    } catch (error) {
      console.error(`Error fetching order with invoice ${invoiceNumber}:`, error);
      throw error;
    }
  },

  updateOrderStatus: async (
    id: number,
    status: 'pending' | 'paid' | 'shipped' | 'completed',
    invoiceNumber?: string,
    trackingNumber?: string
  ): Promise<Order> => {
    try {
      if (status === 'pending') {
        throw new Error('Status pending tidak didukung untuk update via transaction action.');
      }

      const action = getTransactionActionByStatus(status);
      let payload: Record<string, string | number> = {};

      if (action === 'verify') {
        payload = { id };
      } else if (action === 'ship') {
        payload = { id };
        if (trackingNumber) {
          payload.tracking_number = trackingNumber;
        }
      } else if (action === 'complete') {
        if (invoiceNumber) {
          payload.invoice_number = invoiceNumber;
        } else {
          payload = { id };
        }
      }

      // Add tracking URL untuk digunakan di backend saat mengirim notifikasi
      if (invoiceNumber) {
        payload.tracking_url = getTrackingUrl(invoiceNumber);
      }

      console.log(`Sending ${action} request to /checkout/${action}`, payload);
      
      // Checkout endpoints for order status update
      const checkoutUrl = `/checkout/${action}`; // Use /checkout/* path with /api baseURL
      
      // Convert payload to URL-encoded form data
      const params = new URLSearchParams();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      
      const response = await transactionApi.post(checkoutUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      console.log(`${action} response:`, response.data);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error(`Error updating order ${id} status to ${status}:`, error);
      
      let errorMsg = 'Gagal mengupdate status pesanan';
      if (error.response?.status === 404) {
        errorMsg = `Endpoint /checkout/${getTransactionActionByStatus(status as 'paid' | 'shipped' | 'completed')} tidak ditemukan di server`;
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        errorMsg = 'Anda tidak memiliki akses untuk mengupdate pesanan (Unauthorized)';
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      throw new Error(errorMsg);
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

      // Convert payload to URL-encoded form data
      const params = new URLSearchParams();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });

      const response = await transactionApi.post('/checkout/cancel', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error canceling order ${id}:`, error);
      throw error;
    }
  },
};
