import { getCurrentSellerStore } from "@/lib/settings/getCurrentSellerStore";
import SellerStorefrontFormClient from "../../_components/SellerStorefrontFormClient";
import { CurrentUser } from "@/lib/currentUser";
import { UnverifiedEmailBanner } from "@/components/email-verification/UnverifiedEmailBanner";
import SettingsModuleEmptyState from "../../_components/SettingsModuleEmptyState";
import { ImageIcon } from "lucide-react";

export default async function SellerStorefrontSettingsPage() {
  const user = await CurrentUser();
  const store = await getCurrentSellerStore();

  if (!store) {
    return (
      <SettingsModuleEmptyState
        title="Set Up Your Storefront"
        description="A storefront needs an active store before you can upload a logo, banner, and brand assets."
        ctaLabel="Create Store"
        ctaHref="/marketplace/dashboard/seller/store/create-store"
        icon={ImageIcon}
      />
    );
  }

  const isStoreVerified = store.isVerified;

  return (
    <div className="space-y-6">
      {!user?.isEmailVerified ? (
        <UnverifiedEmailBanner description="Your seller storefront is already live, so you can keep using it. Verify your email to secure your account and complete the new rollout." />
      ) : null}
      <SellerStorefrontFormClient
        initialTagline={store.tagline ?? ""}
        initialLogo={store.logo ?? ""}
        initialLogoKey={store.logoKey ?? ""}
        initialBanner={store.bannerImage ?? ""}
        initialBannerKey={store.bannerKey ?? ""}
        isStoreVerified={isStoreVerified}
      />
    </div>
  );
}
