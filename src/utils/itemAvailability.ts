import type { Item, Order } from "../types";

const ACTIVE_RESERVATION_STATUSES: Order["status"][] = [
  "booking",
  "paid",
  "shipped",
  "completed",
];

export type ItemAvailabilityStatus = "ready" | "terbooking" | "habis";

export function buildReservedQuantityByItemMap(orders: Order[]): Record<number, number> {
  const reserved: Record<number, number> = {};

  for (const order of orders || []) {
    if (!ACTIVE_RESERVATION_STATUSES.includes(order.status)) continue;

    for (const orderItem of order.items || []) {
      const itemId = Number(orderItem?.item?.id);
      const qty = Number(orderItem?.quantity || 0);

      if (!Number.isFinite(itemId) || itemId <= 0) continue;
      if (!Number.isFinite(qty) || qty <= 0) continue;

      reserved[itemId] = (reserved[itemId] || 0) + qty;
    }
  }

  return reserved;
}

export function getAvailableStock(
  item: Pick<Item, "id" | "stock">,
  reservedQtyByItem: Record<number, number>,
): number {
  const stock = Number(item.stock) || 0;
  const reservedQty = Number(reservedQtyByItem[item.id]) || 0;
  return Math.max(0, stock - reservedQty);
}

export function getItemAvailabilityStatus(
  item: Pick<Item, "id" | "stock">,
  reservedQtyByItem: Record<number, number>,
): ItemAvailabilityStatus {
  const stock = Number(item.stock) || 0;
  if (stock <= 0) return "habis";

  const availableStock = getAvailableStock(item, reservedQtyByItem);
  if (availableStock <= 0) return "terbooking";

  return "ready";
}