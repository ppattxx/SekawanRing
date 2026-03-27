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
  // optional credential for certificate unlocking
  certificate_password?: string;
  image_url?: string;
  gaya_main?: string;
  body?: string;
  materi?: string;
  volume?: string;
  panjang_ekor?: string;
  warna?: string;
  warna_kaki?: string;
  paruh?: string;
  jenis_kepala?: string;
  voer?: string;
  extra_fooding?: string;
  embun?: string;
  jemur?: string;
  mandi?: string;
  tenggar?: string;
  krodong_ablak?: string;
}

export interface UpdateItemPayload extends Partial<CreateItemPayload> {
  id: number;
}

// Media files sent as multipart/form-data, following backend expectations
export interface ItemMediaFiles {
  certificate_path?: File | null;
  image_path?: File | null;
  video_path?: File | null;
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

const buildItemFormData = (payload: Partial<CreateItemPayload>, media?: ItemMediaFiles): FormData => {
  const formData = new FormData();

  const appendIfDefined = (key: string, value: unknown) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, String(value));
    }
  };

  // Basic required fields
  appendIfDefined("catalog_id", payload.catalog_id);
  appendIfDefined("name", payload.name);
  appendIfDefined("description", payload.description);
  appendIfDefined("price", payload.price);
  appendIfDefined("stock", payload.stock);
  appendIfDefined("type", payload.type);

  // Certificate extras
  appendIfDefined("certificate_password", payload.certificate_password);

  // Bird details / per ekor settings (names follow backend Postman)
  appendIfDefined("gaya_main", payload.gaya_main);
  appendIfDefined("body", payload.body);
  appendIfDefined("materi", payload.materi);
  appendIfDefined("volume", payload.volume);
  appendIfDefined("panjang_ekor", payload.panjang_ekor);
  appendIfDefined("warna", payload.warna);
  appendIfDefined("warna_kaki", payload.warna_kaki);
  appendIfDefined("paruh", payload.paruh);
  appendIfDefined("jenis_kepala", payload.jenis_kepala);
  appendIfDefined("voer", payload.voer);
  appendIfDefined("extra_fooding", payload.extra_fooding);
  appendIfDefined("embun", payload.embun);
  appendIfDefined("jemur", payload.jemur);
  appendIfDefined("mandi", payload.mandi);
  appendIfDefined("tenggar", payload.tenggar);
  appendIfDefined("krodong_ablak", payload.krodong_ablak);

  // Map age_months to backend "umur" field if provided
  if (payload.age_months !== undefined) {
    formData.append("umur", String(payload.age_months));
  }

  // Attach media files if any
  if (media?.certificate_path) {
    formData.append("certificate_path", media.certificate_path);
  }
  if (media?.image_path) {
    formData.append("image_path", media.image_path);
  }
  if (media?.video_path) {
    formData.append("video_path", media.video_path);
  }

  return formData;
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

  createItem: async (payload: CreateItemPayload, media?: ItemMediaFiles): Promise<Item> => {
    try {
      // Mengikuti Postman: POST {{sekawan_api_lokal}}items dengan body form-data
      const formData = buildItemFormData(payload, media);
      const response = await api.post('/items', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  },

  updateItem: async (id: number, payload: Partial<CreateItemPayload>, media?: ItemMediaFiles): Promise<Item> => {
    try {
      // Mengikuti Postman: method POST ke /items/{id} dengan form-data dan field _method=PATCH
      const formData = buildItemFormData(payload, media);
      formData.append('_method', 'PATCH');

      const response = await api.post(`/items/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Accept: 'application/json',
        },
      });
      return response.data.data || response.data;
    } catch (error) {
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

  // NOTE: generic uploadMedia endpoint removed in favor of
  // sending files together with create/update item calls as form-data.

  // Verifikasi sertifikat dan kembalikan URL/path sertifikat
  // Mengikuti koleksi Postman: POST {{sekawan_api_lokal}}verify-password-certificate
  getCertificateUrl: async (id: number, password: string): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('item_id', String(id));
      formData.append('password', password);

      const response = await api.post('/verify-password-certificate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = response.data?.data || response.data || {};
      // Backend Anda kemungkinan mengirim path/url sertifikat di salah satu field berikut
      return (
        data.certificate_url ||
        data.certificate_path ||
        data.url ||
        ""
      );
    } catch (error) {
      console.error(`Error fetching certificate for item ${id}:`, error);
      throw error;
    }
  },
};