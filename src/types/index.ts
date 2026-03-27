// src/types/index.ts

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
  certificate_password?: string;
  image_url?: string;
  // Bird sub-details / per ekor settings
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

export type Product = Item;

// Kategori umur burung
export type BirdCategorySlug = "trotol" | "pastol" | "remaja" | "dewasa";

export interface BirdCategory {
  slug: BirdCategorySlug;
  name: string;
  description: string;
  ageRange: string;
  icon: string;
  color: string;
  colorTo: string;
}

// Checkout
export interface BuyerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  notes: string;
  paymentProof?: File | null;
}

// ✅ FIX: Gabungkan Order dan OrderResult menjadi satu type lengkap
export interface Order {
  id: number;
  invoice_number: string;
  total_price: number;
  status: "pending" | "paid" | "shipped" | "completed";
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  items: { item: Item; quantity: number }[];
  created_at: string;
  updated_at?: string;
}

// OrderResult sekarang sama dengan Order (untuk backward compatibility)
export type OrderResult = Order;