import api from './api';
import type { Catalog } from '../types';

export interface CreateCatalogPayload {
  name: string;
  description?: string;
  image_url?: string;
}

export const catalogService = {
  // ✅ GET all catalogs
  getAllCatalogs: async (): Promise<Catalog[]> => {
    try {
      const response = await api.get('/catalogs');
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Error fetching catalogs:', error);
      throw error;
    }
  },

  // ✅ GET catalog by ID
  getCatalogById: async (id: number): Promise<Catalog> => {
    try {
      const response = await api.get(`/catalogs/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching catalog ${id}:`, error);
      throw error;
    }
  },

  // ✅ POST - Create catalog
  createCatalog: async (payload: CreateCatalogPayload): Promise<Catalog> => {
    try {
      const response = await api.post('/catalogs', payload);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error creating catalog:', error);
      throw error;
    }
  },

  // ✅ PUT/PATCH - Update catalog
  updateCatalog: async (id: number, payload: Partial<CreateCatalogPayload>): Promise<Catalog> => {
    try {
      const response = await api.put(`/catalogs/${id}`, payload);
      return response.data.data || response.data;
    } catch (error: any) {
      if (error.response?.status === 405) {
        const response = await api.patch(`/catalogs/${id}`, payload);
        return response.data.data || response.data;
      }
      console.error(`Error updating catalog ${id}:`, error);
      throw error;
    }
  },

  // ✅ DELETE catalog
  deleteCatalog: async (id: number): Promise<{ success: boolean }> => {
    try {
      const response = await api.delete(`/catalogs/${id}`);
      return response.data.data || response.data || { success: true };
    } catch (error) {
      console.error(`Error deleting catalog ${id}:`, error);
      throw error;
    }
  },

  // ✅ SEARCH catalogs
  searchCatalogs: async (query: string): Promise<Catalog[]> => {
    try {
      const response = await api.get('/catalogs/search', {
        params: { q: query },
      });
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Error searching catalogs:', error);
      throw error;
    }
  },
};