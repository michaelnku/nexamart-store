import { getCurrentSellerStore } from "@/lib/settings/getCurrentSellerStore";
import SellerPreferencesClient from "../../_components/SellerPreferencesClient";
import { StoreDTO } from "@/lib/types";

export default async function SellerPreferencesSettingsPage() {
  const store = await getCurrentSellerStore();

  if (!store) return null;

  return <SellerPreferencesClient store={store as StoreDTO} />;
}
