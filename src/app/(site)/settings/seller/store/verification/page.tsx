import StartVerificationButton from "@/components/verification/StartVerificationButton";
import { getCurrentSellerStore } from "@/lib/settings/getCurrentSellerStore";

export default async function SellerVerificationPage() {
  const store = await getCurrentSellerStore();

  if (!store) return null;

  return (
    <div className="max-w-xl mx-auto py-12">
      <h1 className="text-2xl font-semibold mb-4">Verify {store.name}</h1>

      <p className="text-gray-600 mb-6">
        Complete identity verification to activate your store and start selling!
      </p>

      <StartVerificationButton role="SELLER" />
    </div>
  );
}
