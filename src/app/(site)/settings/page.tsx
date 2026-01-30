import { getUserAddresses } from "@/components/helper/getUserAddresses";
import SettingsClient from "./_components/SettingsClient";
import AddressSectionSkeleton from "@/components/skeletons/AddressSectionSkeleton";
import { getUserPreferences } from "@/components/helper/getUserPreferences";

export default async function SettingsPage() {
  const addresses = await getUserAddresses();
  const preferences = await getUserPreferences();

  if (!addresses) return <AddressSectionSkeleton />;

  return (
    <>
      <SettingsClient addresses={addresses} preferences={preferences} />
    </>
  );
}
