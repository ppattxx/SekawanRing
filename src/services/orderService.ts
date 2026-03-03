import api from './api';
import type { Order, Item } from '../types';

interface CreateOrderPayload {
  items: {
    item_id: number;
    quantity: number;
  }[];
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  shipping_address?: string;
}

interface OrderResponse {
  order: Order;
  items: Item[];
}

export const orderService = {
  // Create new order
  createOrder: async (payload: CreateOrderPayload): Promise<Order> => {
    try {
      const response = await api.post('/orders', payload);
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
