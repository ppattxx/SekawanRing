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

export type Product = Item;

// Kategori umur burung
export type BirdCategorySlug = "trotol" | "pastol" | "remaja" | "dewasa";

export interface BirdCategory {
  slug: BirdCategorySlug;
  name: string;
  description: string;
  ageRange: string;
  icon: string;
  color: string;  // tailwind gradient from
  colorTo: string; // tailwind gradient to
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

export interface OrderResult {
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
}

export interface Order {
  id: number;
  invoice_number: string;
  total_price: number;
  status: "pending" | "paid" | "shipped" | "completed";
}
