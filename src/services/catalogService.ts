import api from './api';
import type { Catalog } from '../types';

// Get all catalogs
export const catalogService = {
  getAllCatalogs: async (): Promise<Catalog[]> => {
    try {
      const response = await api.get('/catalogs');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching catalogs:', error);
      throw error;
    }
  },

  // Get catalog by ID
  getCatalogById: async (id: number): Promise<Catalog> => {
    try {
      const response = await api.get(`/catalogs/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching catalog ${id}:`, error);
      throw error;
    }
  },

  // Search catalogs
  searchCatalogs: async (query: string): Promise<Catalog[]> => {
    try {
      const response = await api.get('/catalogs/search', {
        params: { q: query },
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error searching catalogs:', error);
      throw error;
    }
  },

};
