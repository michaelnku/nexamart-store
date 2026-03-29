export function buildSellerGroupCodes(orderId: string, storeId: string) {
  const seed = crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  const storeSeed = storeId
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-6)
    .toUpperCase();
  const orderSeed = orderId
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-6)
    .toUpperCase();

  return {
    hubInboundCode: `HUB-${storeSeed}-${seed}`,
    internalTrackingNumber: `SG-${orderSeed}-${seed}`,
  };
}

