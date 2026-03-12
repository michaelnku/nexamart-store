type CartAvailabilityParams = {
  stock: number;
  requestedQuantity: number;
  productName?: string | null;
};

export function getCartAvailabilityError({
  stock,
  requestedQuantity,
  productName,
}: CartAvailabilityParams): string | null {
  const itemLabel = productName?.trim() || "This item";

  if (stock <= 0) {
    return `${itemLabel} is out of stock.`;
  }

  if (requestedQuantity > stock) {
    return stock === 1
      ? `Only 1 unit of ${itemLabel} is available right now.`
      : `Only ${stock} units of ${itemLabel} are available right now.`;
  }

  return null;
}
