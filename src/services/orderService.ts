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
  const customer = order.customer || {};
  const composedAddress = [
    customer.address,
    customer.city,
    customer.province,
    customer.postal_code,
  ]
    .filter(Boolean)
    .join(', ');
  const rawStatus = order.status || 'booking';
  const normalizedStatus = rawStatus === 'pending' ? 'booking' : rawStatus;
  const rawShippingCost = order.shipping_cost ?? order.ongkir;
  const parsedShippingCost = Number(rawShippingCost);
  const shippingCost =
    rawShippingCost !== undefined && rawShippingCost !== null && Number.isFinite(parsedShippingCost)
      ? parsedShippingCost
      : undefined;

  return {
    id: order.id,
    invoice_number: order.invoice_number,
    total_price: order.total_price || order.total || 0,
    status: normalizedStatus,
    customer_name: order.customer_name || customer.name || '',
    customer_email: order.customer_email || customer.email || '',
    customer_phone: order.customer_phone || customer.phone || '',
    shipping_address: order.shipping_address || composedAddress || customer.address || '',
    tracking_number: order.tracking_number || order.resi || order.awb || order.tracking_no || undefined,
    shipping_cost: shippingCost,
    payment_deadline: order.payment_deadline ?? order.payment_due ?? undefined,
    payment_proof_url: order.payment_proof_url ?? order.payment_proof ?? undefined,
    items: normalizeOrderItems(order.items || []),
    created_at: order.created_at || new Date().toISOString(),
    updated_at: order.updated_at,
  };
};

const normalizeOrderItems = (items: any[]): Order['items'] => {
  if (!Array.isArray(items)) return [];
  
  return items.map((item, idx) => {
    console.log(`[OrderItem ${idx}]`, JSON.stringify(item, null, 2));
    
    if (item.item && typeof item.item === 'object' && (item.quantity || item.qty)) {
      // Beberapa endpoint mengirim struktur { item: {...}, quantity, price }
      // dan menyimpan harga di level luar, bukan di dalam item.
      const baseItem: any = item.item;
      const quantity = item.quantity || item.qty || 1;
      let price = baseItem.price;

      if (!price && (item.item_price || item.price || item.total_price || item.total || item.subtotal)) {
        const rawUnit =
          item.item_price ??
          item.price ??
          item.total_price ??
          item.total ??
          item.subtotal;
        const unitNumber = Number(rawUnit);
        price = Number.isFinite(unitNumber) && quantity ? unitNumber / quantity : unitNumber;
      }

      return {
        item: {
          ...baseItem,
          price: price ? Number(price) : 0,
        },
        quantity,
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
          certificate: item.certificate,
          certificate_path: item.certificate_path,
          certificate_url: item.certificate_url,
          certificate_password: item.certificate_password,
          image_url: item.image_url || '',
        },
        quantity: item.quantity || item.qty || 1,
      };
    }

    if (item.item_id) {
      const quantity = item.quantity || item.qty || 1;
      let unitPrice: number | undefined;

      if (item.unit_price) {
        unitPrice = Number(item.unit_price);
      } else if (item.item_price) {
        unitPrice = Number(item.item_price);
      } else if (item.price) {
        unitPrice = Number(item.price);
      } else if (item.subtotal) {
        const subtotalNum = Number(item.subtotal);
        unitPrice = quantity ? subtotalNum / quantity : subtotalNum;
      }

      return {
        item: {
          id: item.item_id,
          catalog_id: item.catalog_id || 0,
          name: item.item_name || item.name || 'Unknown',
          price: unitPrice ? Number(unitPrice) : 0,
          stock: item.stock || 0,
          description: item.description || '',
          certificate: item.certificate,
          certificate_path: item.certificate_path,
          certificate_url: item.certificate_url,
          certificate_password: item.certificate_password,
          image_url: item.image_url || '',
        },
        quantity,
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

const getCertificatePasswordsFromOrderItems = (items?: Order['items']) => {
  if (!items?.length) return [] as { item_name: string; password: string }[];

  const result = items
    .map((entry) => {
      const password = entry?.item?.certificate_password?.toString().trim();
      if (!password) return null;

      return {
        item_name: entry.item?.name || 'Item',
        password,
      };
    })
    .filter((entry): entry is { item_name: string; password: string } => Boolean(entry));

  const dedupedMap = new Map<string, { item_name: string; password: string }>();
  result.forEach((entry) => {
    const key = `${entry.item_name}::${entry.password}`;
    if (!dedupedMap.has(key)) {
      dedupedMap.set(key, entry);
    }
  });

  return Array.from(dedupedMap.values());
};

const buildCertificateDeliveryPayload = (items?: Order['items']) => {
  const certPasswords = getCertificatePasswordsFromOrderItems(items);
  if (!certPasswords.length) {
    return {
      certificatePassword: undefined,
      certificatePasswordsJson: undefined,
      certificatePasswordsText: undefined,
    };
  }

  return {
    certificatePassword: certPasswords[0].password,
    certificatePasswordsJson: JSON.stringify(certPasswords),
    certificatePasswordsText: certPasswords
      .map((entry) => `${entry.item_name}: ${entry.password}`)
      .join('\n'),
  };
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
  status: 'booking' | 'paid' | 'shipped' | 'completed' | 'cancelled'
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
    notes?: string;
  };
  items: {
    item_id: number;
    qty: number;
  }[];
}

type OrderItemsInput = { item_id: number; qty: number }[] | CartItem[];

interface CreateOrderFromCartPayload {
  customer: CreateOrderPayload['customer'];
  items: OrderItemsInput;
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
      const normalizedItems = payload.items?.map((item) => {
        if ('id' in item) {
          return { item_id: item.id, qty: item.qty };
        }
        return item;
      }) || [];

      const response = await api.post('/checkout', {
        customer: payload.customer,
        items: normalizedItems,
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
    customer: CreateOrderPayload['customer']
  ): Promise<Order> => {
    const cartItems = useCartStore.getState().cart;
    if (cartItems.length === 0) {
      throw new Error('Cart is empty');
    }
    
    const items = convertCartToOrderItems(cartItems);
    
    return orderService.createOrder({
      customer,
      items,
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
      // Endpoint API khusus untuk mengambil data pesanan berdasarkan nomor invoice
      // Berbeda dengan URL tracking/frontend `/order/confirm/:invoiceNumber`
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
    status: 'paid' | 'shipped' | 'completed',
    invoiceNumber?: string,
    trackingNumber?: string,
    orderItems?: Order['items']
  ): Promise<Order> => {
    try {
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

        let completionItems = orderItems;
        if (!completionItems?.length && invoiceNumber) {
          try {
            const orderByInvoice = await orderService.getOrderByInvoice(invoiceNumber);
            completionItems = orderByInvoice.order?.items || orderByInvoice.items;
          } catch (fetchError) {
            console.warn('Failed to fetch order items for certificate password payload:', fetchError);
          }
        }

        const {
          certificatePassword,
          certificatePasswordsJson,
          certificatePasswordsText,
        } = buildCertificateDeliveryPayload(completionItems);

        if (certificatePassword) {
          payload.certificate_password = certificatePassword;
        }
        if (certificatePasswordsJson) {
          payload.certificate_passwords = certificatePasswordsJson;
        }
        if (certificatePasswordsText) {
          payload.certificate_password_text = certificatePasswordsText;
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

  uploadPaymentProof: async (invoiceNumber: string, paymentProof: File): Promise<Order> => {
    try {
      const formData = new FormData();
      formData.append('invoice_number', invoiceNumber);
      formData.append('payment_proof', paymentProof);

      const response = await api.post('/checkout/payment', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.data || response.data;
    } catch (error) {
      console.error('Error uploading payment proof:', error);
      throw error;
    }
  },

  requestPayment: async (
    orderId: number,
    shippingCost: number,
    invoiceNumber?: string
  ): Promise<Order> => {
    try {
      const payload: Record<string, number | string> = {
        id: orderId,
        shipping_cost: shippingCost,
      };

      if (invoiceNumber) {
        payload.invoice_number = invoiceNumber;
      }

      const response = await api.post('/checkout/request-payment', payload);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error requesting payment:', error);
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
