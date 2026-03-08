import { getCurrentSellerStore } from "@/lib/settings/getCurrentSellerStore";
import SellerStorefrontFormClient from "../../_components/SellerStorefrontFormClient";

export default async function SellerStorefrontSettingsPage() {
  const store = await getCurrentSellerStore();

  if (!store) return null;

  const isStoreVerified = store.isVerified;

  return (
    <SellerStorefrontFormClient
      initialTagline={store.tagline ?? ""}
      initialLogo={store.logo ?? ""}
      initialLogoKey={store.logoKey ?? ""}
      initialBanner={store.bannerImage ?? ""}
      initialBannerKey={store.bannerKey ?? ""}
      isStoreVerified={isStoreVerified}
    />
  );
}
