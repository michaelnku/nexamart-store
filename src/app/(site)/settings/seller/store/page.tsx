import { getCurrentSellerStore } from "@/lib/settings/getCurrentSellerStore";
import SellerStoreFormClient from "../../_components/SellerStoreFormClient";
import { StoreDTO } from "@/lib/types";
import { CurrentUser } from "@/lib/currentUser";
import { UnverifiedEmailBanner } from "@/components/email-verification/UnverifiedEmailBanner";

export default async function SellerStoreSettingsPage() {
  const user = await CurrentUser();
  const store = await getCurrentSellerStore();

  if (!store) return null;

  return (
    <div className="space-y-6">
      {!user?.isEmailVerified ? (
        <UnverifiedEmailBanner description="Your store already exists, so you can keep managing it. Verify your email to secure your seller account and avoid future setup restrictions." />
      ) : null}
      <SellerStoreFormClient store={store as StoreDTO} />
    </div>
  );
}
