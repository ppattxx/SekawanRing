import type { BirdCategory, Item } from "../types";

export const BIRD_CATEGORIES: BirdCategory[] = [
  {
    slug: "trotol",
    name: "Trotol",
    description:
      "Burung murai batu anakan usia muda, bulu masih bercak cokelat. Cocok untuk rawatan jangka panjang.",
    ageRange: "1 - 3 Bulan",
    icon: "🐣",
    color: "from-amber-400",
    colorTo: "to-orange-300",
  },
  {
    slug: "pastol",
    name: "Pastol",
    description:
      "Murai batu mulai berganti bulu dewasa, mulai ada bercak hitam. Suara sudah mulai terbentuk.",
    ageRange: "3 - 6 Bulan",
    icon: "🐥",
    color: "from-emerald-400",
    colorTo: "to-teal-300",
  },
  {
    slug: "remaja",
    name: "Remaja",
    description:
      "Burung bulu sudah dominan hitam mengkilap. Siap dilatih untuk persiapan lomba.",
    ageRange: "6 - 12 Bulan",
    icon: "🦜",
    color: "from-blue-400",
    colorTo: "to-indigo-300",
  },
  {
    slug: "dewasa",
    name: "Dewasa",
    description:
      "Murai batu siap tarung / lomba. Sudah gacor dan mapan mentalnya. Trah juara bersertifikat.",
    ageRange: "12+ Bulan",
    icon: "🦅",
    color: "from-rose-400",
    colorTo: "to-pink-300",
  },
];

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

export function countStockByCategory(items: Item[]): Record<string, number> {
  const counts: Record<string, number> = {
    trotol: 0,
    pastol: 0,
    remaja: 0,
    dewasa: 0,
  };

  for (const item of items) {
    const age = item.age_months || 0;
    const availableUnit = Number(item.stock) > 0 ? 1 : 0;

    if (age >= 1 && age <= 3) counts.trotol += availableUnit;
    else if (age > 3 && age <= 6) counts.pastol += availableUnit;
    else if (age > 6 && age <= 12) counts.remaja += availableUnit;
    else if (age > 12) counts.dewasa += availableUnit;
  }

  return counts;
}

export function filterItemsByCategory(items: Item[], slug: string): Item[] {
  const [min, max] = getAgeRangeForCategory(slug);
  return items.filter((item) => {
    const age = item.age_months || 0;
    if (slug === "trotol") return age >= min && age <= max;
    return age > min && age <= max;
  });
}
