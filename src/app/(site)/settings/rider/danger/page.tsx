import { TriangleAlert } from "lucide-react";
import { getCurrentRiderProfile } from "@/lib/settings/getCurrentRiderProfile";
import SettingsModuleEmptyState from "../../_components/SettingsModuleEmptyState";
import RiderDangerFormClient from "./RiderDangerFormClient";

export default async function RiderDangerSettingsPage() {
  const profile = await getCurrentRiderProfile();

  if (!profile) {
    return (
      <SettingsModuleEmptyState
        title="No Rider Profile Found"
        description="There is no rider profile to manage yet. Set up your rider profile first to unlock rider-specific controls."
        ctaLabel="Set Up Rider Profile"
        ctaHref="/settings/rider/profile"
        icon={TriangleAlert}
      />
    );
  }

  return <RiderDangerFormClient />;
}
