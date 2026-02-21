export type StoreType = "GENERAL" | "FOOD";

export function getCommissionRate(storeType: StoreType): number {
  return storeType === "FOOD" ? 0.15 : 0.1;
}
