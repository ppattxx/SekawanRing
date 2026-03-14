import api from './api';
import type { Item } from '../types';

export interface CreateItemPayload {
  catalog_id: number;
  name: string;
  price: number;
  stock: number;
  type?: string;
  description: string;
  age_months?: number;
  certificate?: string;
  image_url?: string;
}

export interface UpdateItemPayload extends Partial<CreateItemPayload> {
  id: number;
}

export const itemService = {
  // ✅ GET all items
  getAllItems: async (): Promise<Item[]> => {
    try {
      const response = await api.get('/items');
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Error fetching items:', error);
      throw error;
    }
  },

  // ✅ GET item by ID
  getItemById: async (id: number): Promise<Item> => {
    try {
      const response = await api.get(`/items/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching item ${id}:`, error);
      throw error;
    }
  },

  // ✅ GET items by catalog ID
  getItemsByCatalogId: async (catalogId: number): Promise<Item[]> => {
    try {
      const response = await api.get(`/catalogs/${catalogId}/items`);
      return response.data.data || response.data || [];
    } catch (error) {
      console.error(`Error fetching items for catalog ${catalogId}:`, error);
      throw error;
    }
  },

  // ✅ POST - Create new item
  createItem: async (payload: CreateItemPayload): Promise<Item> => {
    try {
      const response = await api.post('/items', payload);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  },

  // ✅ PUT/PATCH - Update item
  updateItem: async (id: number, payload: Partial<CreateItemPayload>): Promise<Item> => {
    try {
      const response = await api.put(`/items/${id}`, payload);
      // Fallback ke PATCH jika PUT tidak didukung
      return response.data.data || response.data;
    } catch (error: any) {
      if (error.response?.status === 405) {
        // Method not allowed, coba PATCH
        const response = await api.patch(`/items/${id}`, payload);
        return response.data.data || response.data;
      }
      console.error(`Error updating item ${id}:`, error);
      throw error;
    }
  },

  // ✅ DELETE item
  deleteItem: async (id: number): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await api.delete(`/items/${id}`);
      return response.data.data || response.data || { success: true };
    } catch (error) {
      console.error(`Error deleting item ${id}:`, error);
      throw error;
    }
  },

  // ✅ PATCH - Update stock only (optimasi untuk quick edit)
  updateStock: async (id: number, stock: number): Promise<Item> => {
    try {
      const response = await api.patch(`/items/${id}/stock`, { stock });
      return response.data.data || response.data;
    } catch (error: any) {
      // Fallback: update via updateItem jika endpoint khusus stock tidak ada
      if (error.response?.status === 404) {
        return await itemService.updateItem(id, { stock });
      }
      console.error(`Error updating stock for item ${id}:`, error);
      throw error;
    }
  },

  // ✅ SEARCH items
  searchItems: async (query: string): Promise<Item[]> => {
    try {
      const response = await api.get('/items/search', {
        params: { q: query },
      });
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Error searching items:', error);
      throw error;
    }
  },

  // ✅ FILTER by price
  filterItemsByPrice: async (minPrice?: number, maxPrice?: number): Promise<Item[]> => {
    try {
      const response = await api.get('/items', {
        params: { min_price: minPrice, max_price: maxPrice },
      });
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Error filtering items by price:', error);
      throw error;
    }
  },
};