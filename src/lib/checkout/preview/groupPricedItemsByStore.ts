import type { AuthoritativeCartLine } from "@/lib/checkout/cartPricing";

export function groupPricedItemsByStore(
  pricedCartItems: AuthoritativeCartLine[],
): Map<string, AuthoritativeCartLine[]> {
  const itemsByStore = new Map<string, AuthoritativeCartLine[]>();

  for (const item of pricedCartItems) {
    const storeId = item.product.store.id;
    if (!itemsByStore.has(storeId)) itemsByStore.set(storeId, []);
    itemsByStore.get(storeId)!.push(item);
  }

  return itemsByStore;
}
