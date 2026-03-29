import StartVerificationButton from "@/components/verification/StartVerificationButton";
import { getCurrentSellerStore } from "@/lib/settings/getCurrentSellerStore";
import SettingsModuleEmptyState from "../../../_components/SettingsModuleEmptyState";
import { ShieldCheck } from "lucide-react";

export default async function SellerVerificationPage() {
  const store = await getCurrentSellerStore();

  if (!store) {
    return (
      <SettingsModuleEmptyState
        title="Store Verification Starts After Store Setup"
        description="You need a seller store before verification can begin."
        ctaLabel="Create Store"
        ctaHref="/marketplace/dashboard/seller/store/create-store"
        icon={ShieldCheck}
      />
    );
  }

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white px-6 py-12 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h1 className="mb-4 text-2xl font-semibold text-slate-950 dark:text-zinc-100">Verify {store.name}</h1>

      <p className="mb-6 text-gray-600 dark:text-zinc-400">
        Complete identity verification to activate your store and start selling!
      </p>

      <StartVerificationButton role="SELLER" />
    </div>
  );
}
