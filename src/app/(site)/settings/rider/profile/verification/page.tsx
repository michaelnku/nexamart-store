import StartVerificationButton from "@/components/verification/StartVerificationButton";
import { getCurrentRiderProfile } from "@/lib/settings/getCurrentRiderProfile";
import SettingsModuleEmptyState from "../../../_components/SettingsModuleEmptyState";
import { ShieldCheck } from "lucide-react";

export default async function RidererVerificationPage() {
  const profile = await getCurrentRiderProfile();

  if (!profile) {
    return (
      <SettingsModuleEmptyState
        title="Rider Verification Starts After Profile Setup"
        description="Create your rider profile first so we can start verification on the correct account and vehicle details."
        ctaLabel="Set Up Rider Profile"
        ctaHref="/settings/rider/profile"
        icon={ShieldCheck}
      />
    );
  }

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white px-6 py-12 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h1 className="mb-4 text-2xl font-semibold text-slate-950 dark:text-zinc-100">Verify Your Rider Profile</h1>

      <p className="mb-6 text-gray-600 dark:text-zinc-400">
        Complete identity verification to activate your profile and start
        operating.
      </p>

      <StartVerificationButton role="RIDER" />
    </div>
  );
}
