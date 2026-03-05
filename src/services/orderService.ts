import api from './api';
import type { Order, Item } from '../types';
import type { CartItem } from '../store/useCartStore';

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

interface OrderResponse {
  order: Order;
  items: Item[];
}

export const orderService = {
  // Create new order
  createOrder: async (payload: CreateOrderPayload): Promise<Order> => {
    try {
      const formData = new FormData();
      
      // Add customer fields
      formData.append('customer[name]', payload.customer.name);
      formData.append('customer[phone]', payload.customer.phone);
      formData.append('customer[address]', payload.customer.address);
      formData.append('customer[city]', payload.customer.city);
      formData.append('customer[province]', payload.customer.province);
      formData.append('customer[postal_code]', payload.customer.postal_code);
      
      // Add items
      payload.items.forEach((item, index) => {
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
