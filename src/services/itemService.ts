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

/**
 * Map catalog_id to age_months range
 */
const getDefaultAgeMonths = (catalogId: number): number => {
  switch (catalogId) {
    case 1: return 2; // Trotol (1-3 bulan)
    case 2: return 4; // Pastol (3-6 bulan)
    case 3: return 9; // Remaja (6-12 bulan)
    case 4: return 15; // Dewasa (12+ bulan)
    default: return 0;
  }
};

const normalizeItemList = (raw: unknown): Item[] => {
  let items: Item[] = [];
  
  if (Array.isArray(raw)) {
    items = raw as Item[];
  } else if (raw && typeof raw === 'object') {
    const maybeData = (raw as any).data;
    if (Array.isArray(maybeData)) {
      items = maybeData as Item[];
    }
  }
  
  // Ensure each item has age_months based on catalog_id
  return items.map(item => ({
    ...item,
    age_months: item.age_months ?? getDefaultAgeMonths(item.catalog_id),
  }));
};

export const itemService = {
  getAllItems: async (): Promise<Item[]> => {
    try {
      const response = await api.get('/items');
      return normalizeItemList(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
      throw error;
    }
  },

  getItemById: async (id: number): Promise<Item> => {
    try {
      const response = await api.get(`/items/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching item ${id}:`, error);
      throw error;
    }
  },

  getItemsByCatalogId: async (catalogId: number): Promise<Item[]> => {
    try {
      const response = await api.get(`/catalogs/${catalogId}/items`);
      return normalizeItemList(response.data);
    } catch (error) {
      console.error(`Error fetching items for catalog ${catalogId}:`, error);
      throw error;
    }
  },

  createItem: async (payload: CreateItemPayload): Promise<Item> => {
    try {
      const response = await api.post('/items', payload);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  },

  updateItem: async (id: number, payload: Partial<CreateItemPayload>): Promise<Item> => {
    try {
      const response = await api.put(`/items/${id}`, payload);
      return response.data.data || response.data;
    } catch (error: any) {
      if (error.response?.status === 405) {
        const response = await api.patch(`/items/${id}`, payload);
        return response.data.data || response.data;
      }
      console.error(`Error updating item ${id}:`, error);
      throw error;
    }
  },

  deleteItem: async (id: number): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await api.delete(`/items/${id}`);
      return response.data.data || response.data || { success: true };
    } catch (error) {
      console.error(`Error deleting item ${id}:`, error);
      throw error;
    }
  },

  updateStock: async (id: number, stock: number): Promise<Item> => {
    try {
      const response = await api.patch(`/items/${id}/stock`, { stock });
      return response.data.data || response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return await itemService.updateItem(id, { stock });
      }
      console.error(`Error updating stock for item ${id}:`, error);
      throw error;
    }
  },

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

  uploadMedia: async (file: File): Promise<{ url: string; message?: string }> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/items/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data || response.data || { url: '' };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },
};