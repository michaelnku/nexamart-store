export function getCommissionRate(storeType: "GENERAL" | "FOOD"): number {
  return storeType === "FOOD" ? 0.15 : 0.1;
}
