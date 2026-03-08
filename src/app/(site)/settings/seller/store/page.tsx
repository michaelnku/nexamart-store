import { getCurrentSellerStore } from "@/lib/settings/getCurrentSellerStore";
import SellerStoreFormClient from "../../_components/SellerStoreFormClient";
import { StoreDTO } from "@/lib/types";

export default async function SellerStoreSettingsPage() {
  const store = await getCurrentSellerStore();

  if (!store) return null;

  return <SellerStoreFormClient store={store as StoreDTO} />;
}
