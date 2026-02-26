// Catalog = Jenis Murai Batu (contoh: Murai Batu Medan, Nias, dll)
export interface Catalog {
  id: number;
  name: string;
  description: string;
  image_url?: string;
}

export interface Item {
  id: number;
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

export interface Product extends Item {}

export interface Order {
  id: number;
  invoice_number: string;
  total_price: number;
  status: 'pending' | 'paid' | 'shipped' | 'completed';
}