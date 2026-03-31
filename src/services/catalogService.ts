import api from './api';
import type { Catalog } from '../types';

export interface CreateCatalogPayload {
  name: string;
  description?: string;
  stock?: number;
  image_url?: string;
}

const normalizeCatalogList = (raw: unknown): Catalog[] => {
  if (Array.isArray(raw)) return raw as Catalog[];
  if (raw && typeof raw === 'object') {
    const maybeData = (raw as any).data;
    if (Array.isArray(maybeData)) return maybeData as Catalog[];
  }
  return [];
};

export const catalogService = {
  getAllCatalogs: async (): Promise<Catalog[]> => {
    try {
      const response = await api.get('/catalogs');
      return normalizeCatalogList(response.data);
    } catch (error) {
      console.error('Error fetching catalogs:', error);
      throw error;
    }
  },

  getCatalogById: async (id: number): Promise<Catalog> => {
    try {
      const response = await api.get(`/catalogs/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching catalog ${id}:`, error);
      throw error;
    }
  },

  createCatalog: async (payload: CreateCatalogPayload): Promise<Catalog> => {
    try {
      const response = await api.post('/catalogs', payload);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error creating catalog:', error);
      throw error;
    }
  },

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

  deleteCatalog: async (id: number): Promise<{ success: boolean }> => {
    try {
      const response = await api.delete(`/catalogs/${id}`);
      return response.data.data || response.data || { success: true };
    } catch (error) {
      console.error(`Error deleting catalog ${id}:`, error);
      throw error;
    }
  },

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