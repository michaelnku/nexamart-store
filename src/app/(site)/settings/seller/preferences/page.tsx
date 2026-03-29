import { getCurrentSellerStore } from "@/lib/settings/getCurrentSellerStore";
import SellerPreferencesClient from "../../_components/SellerPreferencesClient";
import { StoreDTO } from "@/lib/types";
import SettingsModuleEmptyState from "../../_components/SettingsModuleEmptyState";
import { SlidersHorizontal } from "lucide-react";

export default async function SellerPreferencesSettingsPage() {
  const store = await getCurrentSellerStore();

  if (!store) {
    return (
      <SettingsModuleEmptyState
        title="Seller Preferences Unavailable"
        description="Create your store first to manage storefront visibility and seller notification preferences."
        ctaLabel="Create Store"
        ctaHref="/marketplace/dashboard/seller/store/create-store"
        icon={SlidersHorizontal}
      />
    );
  }

  return <SellerPreferencesClient store={store as StoreDTO} />;
}
