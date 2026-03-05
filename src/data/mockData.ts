import type { BirdCategory, Item } from "../types";

// =========================================
// KATEGORI UMUR BURUNG
// =========================================
export const BIRD_CATEGORIES: BirdCategory[] = [
  {
    slug: "trotol",
    name: "Trotol",
    description: "Burung murai batu anakan usia muda, bulu masih bercak cokelat. Cocok untuk rawatan jangka panjang.",
    ageRange: "1 - 3 Bulan",
    icon: "🐣",
    color: "from-amber-400",
    colorTo: "to-orange-300",
  },
  {
    slug: "pastol",
    name: "Pastol",
    description: "Murai batu mulai berganti bulu dewasa, mulai ada bercak hitam. Suara sudah mulai terbentuk.",
    ageRange: "3 - 6 Bulan",
    icon: "🐥",
    color: "from-emerald-400",
    colorTo: "to-teal-300",
  },
  {
    slug: "remaja",
    name: "Remaja",
    description: "Burung bulu sudah dominan hitam mengkilap. Siap dilatih untuk persiapan lomba.",
    ageRange: "6 - 12 Bulan",
    icon: "🦜",
    color: "from-blue-400",
    colorTo: "to-indigo-300",
  },
  {
    slug: "dewasa",
    name: "Dewasa",
    description: "Murai batu siap tarung / lomba. Sudah gacor dan mapan mentalnya. Trah juara bersertifikat.",
    ageRange: "12+ Bulan",
    icon: "🦅",
    color: "from-rose-400",
    colorTo: "to-pink-300",
  },
];

// Mapping slug → rentang age_months
export function getAgeRangeForCategory(slug: string): [number, number] {
  switch (slug) {
    case "trotol":
      return [1, 3];
    case "pastol":
      return [3, 6];
    case "remaja":
      return [6, 12];
    case "dewasa":
      return [12, 999];
    default:
      return [0, 999];
  }
}

// =========================================
// MOCK ITEMS  (dipakai kalau API belum jalan)
// =========================================
export const MOCK_ITEMS: Item[] = [
  // Trotol (1-3 bulan)
  { id: 101, catalog_id: 1, name: "MB Trotol Super A", price: 850000, stock: 4, type: "Trotol", description: "Anakan murai batu bulu trotol, indukan juara nasional.", age_months: 2, certificate: "BnR-2026-101" },
  { id: 102, catalog_id: 1, name: "MB Trotol Lampung", price: 750000, stock: 6, type: "Trotol", description: "Trotol asal Lampung, mental berani dari kecil.", age_months: 1, certificate: "BnR-2026-102" },
  { id: 103, catalog_id: 1, name: "MB Trotol Borneo", price: 950000, stock: 3, type: "Trotol", description: "Anakan ekor panjang khas Borneo. Prospek lomba tinggi.", age_months: 3 },
  { id: 104, catalog_id: 1, name: "MB Trotol Medan", price: 700000, stock: 2, type: "Trotol", description: "Trotol Medan, indukan trah jawara lokal.", age_months: 2 },

  // Pastol (3-6 bulan)
  { id: 201, catalog_id: 2, name: "MB Pastol Nias", price: 1500000, stock: 3, type: "Pastol", description: "Pastol Nias ekor panjang, sudah mulai ngeriwik.", age_months: 4, certificate: "BnR-2026-201" },
  { id: 202, catalog_id: 2, name: "MB Pastol Aceh", price: 1800000, stock: 5, type: "Pastol", description: "Pastol Aceh fighter, mental baja.", age_months: 5, certificate: "BnR-2026-202" },
  { id: 203, catalog_id: 2, name: "MB Pastol Bahorok", price: 1600000, stock: 2, type: "Pastol", description: "Pastol Bahorok, volume suara besar.", age_months: 4 },

  // Remaja (6-12 bulan)
  { id: 301, catalog_id: 3, name: "MB Remaja Lampung", price: 3500000, stock: 2, type: "Remaja", description: "Murai remaja Lampung, bulu sudah penuh hitam mengkilat.", age_months: 8, certificate: "BnR-2026-301" },
  { id: 302, catalog_id: 3, name: "MB Remaja Borneo", price: 4000000, stock: 3, type: "Remaja", description: "Remaja Borneo ekor 30cm, siap latih kontes.", age_months: 10, certificate: "BnR-2026-302" },
  { id: 303, catalog_id: 3, name: "MB Remaja Medan", price: 3800000, stock: 1, type: "Remaja", description: "Remaja Medan, volume keras dan variasi tinggi.", age_months: 9 },

  // Dewasa (12+ bulan)
  { id: 401, catalog_id: 4, name: "MB Dewasa Jawara Nasional", price: 15000000, stock: 1, type: "Dewasa", description: "Murai dewasa pemenang kontes nasional 2025. Mental tempur luar biasa.", age_months: 24, certificate: "BnR-2026-401" },
  { id: 402, catalog_id: 4, name: "MB Dewasa Nias Fighter", price: 8500000, stock: 2, type: "Dewasa", description: "Dewasa Nias fighter mapan, sudah sering juara.", age_months: 18, certificate: "BnR-2026-402" },
  { id: 403, catalog_id: 4, name: "MB Dewasa Lampung Gacor", price: 7000000, stock: 2, type: "Dewasa", description: "Dewasa Lampung gacor full isian, cocok untuk masteran.", age_months: 14, certificate: "BnR-2026-403" },
  { id: 404, catalog_id: 4, name: "MB Dewasa Bahorok Super", price: 12000000, stock: 1, type: "Dewasa", description: "Dewasa Bahorok super, ekor 35cm, mental juara.", age_months: 20 },
];

/**
 * Hitung total stok per kategori dari daftar item
 */
export function countStockByCategory(items: Item[]): Record<string, number> {
  const counts: Record<string, number> = {
    trotol: 0,
    pastol: 0,
    remaja: 0,
    dewasa: 0,
  };

  for (const item of items) {
    const age = item.age_months || 0;
    if (age >= 1 && age <= 3) counts.trotol += item.stock;
    else if (age > 3 && age <= 6) counts.pastol += item.stock;
    else if (age > 6 && age <= 12) counts.remaja += item.stock;
    else if (age > 12) counts.dewasa += item.stock;
  }

  return counts;
}

/**
 * Filter items berdasarkan slug kategori
 */
export function filterItemsByCategory(items: Item[], slug: string): Item[] {
  const [min, max] = getAgeRangeForCategory(slug);
  return items.filter((item) => {
    const age = item.age_months || 0;
    if (slug === "trotol") return age >= min && age <= max;
    return age > min && age <= max;
  });
}
