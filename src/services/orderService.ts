import api from './api';
import type { Order, Item } from '../types';
import { useCartStore, type CartItem } from '../store/useCartStore';

// Helper function to convert CartItem to order items format
export const convertCartToOrderItems = (cartItems: CartItem[]): { item_id: number; qty: number }[] => {
  return cartItems.map((item) => ({
    item_id: item.id,
    qty: item.qty,
  }));
};

// Helper function to get current cart items from store and convert to order format
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

// Type for cart items that can be converted to order items
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

export const orderService = {
  // Create order - accepts either CartItem[] or manual items format
  createOrder: async (
    payload: CreateOrderFromCartPayload
  ): Promise<Order> => {
    try {
      const formData = new FormData();
      
      // Normalize items to order format if CartItem[] is passed
      const normalizedItems = payload.items?.map((item) => {
        if ('id' in item) {
          // It's a CartItem
          return { item_id: item.id, qty: item.qty };
        }
        // It's already in order format
        return item;
      }) || [];
      
      // Add customer fields
      formData.append('customer[name]', payload.customer.name);
      formData.append('customer[phone]', payload.customer.phone);
      formData.append('customer[address]', payload.customer.address);
      formData.append('customer[city]', payload.customer.city);
      formData.append('customer[province]', payload.customer.province);
      formData.append('customer[postal_code]', payload.customer.postal_code);
      
      // Add items
      normalizedItems.forEach((item, index) => {
        formData.append(`items[${index}][item_id]`, item.item_id.toString());
        formData.append(`items[${index}][qty]`, item.qty.toString());
      });
      
      // Add payment proof file
      formData.append('payment_proof', payload.payment_proof);
      
      const response = await api.post('/orders/checkout', formData, {
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

  // Get all orders
  getAllOrders: async (): Promise<Order[]> => {
    try {
      const response = await api.get('/orders');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  // Create order directly from current cart in store
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

  // Get order by ID
  getOrderById: async (id: number): Promise<OrderResponse> => {
    try {
      const response = await api.get(`/orders/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching order ${id}:`, error);
      throw error;
    }
  },

  // Get order by invoice number
  getOrderByInvoice: async (invoiceNumber: string): Promise<OrderResponse> => {
    try {
      const response = await api.get(`/orders/invoice/${invoiceNumber}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching order with invoice ${invoiceNumber}:`, error);
      throw error;
    }
  },

  // Update order status
  updateOrderStatus: async (
    id: number,
    status: 'pending' | 'paid' | 'shipped' | 'completed'
  ): Promise<Order> => {
    try {
      const response = await api.patch(`/orders/${id}/status`, { status });
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error updating order ${id} status:`, error);
      throw error;
    }
  },
};
