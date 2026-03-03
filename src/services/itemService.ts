import api from './api';
import type { Item } from '../types';

// Get all items
export const itemService = {
  getAllItems: async (): Promise<Item[]> => {
    try {
      const response = await api.get('/items');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching items:', error);
      throw error;
    }
  },

  // Get item by ID
  getItemById: async (id: number): Promise<Item> => {
    try {
      const response = await api.get(`/items/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching item ${id}:`, error);
      throw error;
    }
  },

  // Get items by catalog ID
  getItemsByCatalogId: async (catalogId: number): Promise<Item[]> => {
    try {
      const response = await api.get(`/catalogs/${catalogId}`);
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching items for catalog ${catalogId}:`, error);
      throw error;
    }
  },

  // Search items
  searchItems: async (query: string): Promise<Item[]> => {
    try {
      const response = await api.get('/items/search', {
        params: { q: query },
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error searching items:', error);
      throw error;
    }
  },

  // Filter items by price range
  filterItemsByPrice: async (minPrice?: number, maxPrice?: number): Promise<Item[]> => {
    try {
      const response = await api.get('/items', {
        params: {
          min_price: minPrice,
          max_price: maxPrice,
        },
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error filtering items by price:', error);
      throw error;
    }
  },
};
