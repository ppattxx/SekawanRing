import api from './api';
import type { Item } from '../types';

export interface CreateItemPayload {
  catalog_id: number;
  name: string;
  price: number;
  stock: number;
  type?: string;
  gender?: 'jantan' | 'betina' | string;
  jenis_kelamin?: 'jantan' | 'betina' | string;
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

const normalizeAgeMonths = (item: any): number => {
  const directAge = Number(item?.age_months);
  if (Number.isFinite(directAge) && directAge > 0) {
    return directAge;
  }

  const umurAge = Number(item?.umur);
  if (Number.isFinite(umurAge) && umurAge > 0) {
    return umurAge;
  }

  return 0;
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
  
  // Ensure each item has age_months from API fields (age_months/umur)
  // and gender is normalized from dedicated gender fields.
  return items.map(item => {
    const gender = (item as any).jenis_kelamin || (item as any).gender || '';
    return {
      ...item,
      age_months: normalizeAgeMonths(item),
      gender,
      jenis_kelamin: gender,
    };
  });
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

  // Gender now uses dedicated jenis_kelamin field; type remains free text style/type.
  const jenisKelaminValue = payload.jenis_kelamin ?? payload.gender ?? '';
  appendIfDefined("type", payload.type);
  appendIfDefined("jenis_kelamin", jenisKelaminValue);

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

  // Support both possible age key names used by backend variants.
  if (payload.age_months !== undefined) {
    formData.append("umur", String(payload.age_months));
    formData.append("age_months", String(payload.age_months));
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

const resolvePublicFileUrl = (value?: string): string => {
  if (!value) return "";
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://sekawan-bf.com/api';
  const apiOrigin = apiBase.replace(/\/api\/?$/, '');
  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${apiOrigin}${normalizedPath}`;
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
      const item = response.data.data || response.data;
      const gender = item.jenis_kelamin || item.gender || '';
      return { ...item, gender, jenis_kelamin: gender, age_months: normalizeAgeMonths(item) };
    } catch (error) {
      console.error(`Error fetching item ${id}:`, error);
      throw error;
    }
  },

  getItemsByCatalogId: async (catalogId: number): Promise<Item[]> => {
    try {
      // Sebagian backend tidak menyediakan endpoint nested /catalogs/{id}/items.
      // Gunakan endpoint /items lalu filter lokal agar tidak memicu 404 di network.
      const response = await api.get('/items');
      const allItems = normalizeItemList(response.data);
      return allItems.filter((item) => Number(item.catalog_id) === Number(catalogId));
    } catch (error) {
      console.error(`Error fetching items for catalog ${catalogId}:`, error);
      throw error;
    }
  },

  createItem: async (payload: CreateItemPayload, media?: ItemMediaFiles): Promise<Item> => {
    try {
      // Mengikuti Postman: POST {{sekawan_api_lokal}}items dengan body form-data
      const formData = buildItemFormData(payload, media);
      const response = await api.post('/items', formData);
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

      const response = await api.post('/verify-password-certificate', formData);

      const data = response.data?.data || response.data || {};
      // Backend dapat mengirim URL/path di beberapa field, semuanya dinormalisasi ke URL publik.
      const certificateRaw =
        data.certificate_url ||
        data.certificate_path ||
        data.url ||
        data.path ||
        "";

      return resolvePublicFileUrl(certificateRaw);
    } catch (error) {
      console.error(`Error fetching certificate for item ${id}:`, error);
      throw error;
    }
  },
};