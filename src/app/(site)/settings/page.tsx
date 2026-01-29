import { getUserAddresses } from "@/components/helper/getUserAddresses";
import SettingsClient from "./_components/SettingsClient";
import AddressSectionSkeleton from "@/components/skeletons/AddressSectionSkeleton";

export default async function SettingsPage() {
  const addresses = await getUserAddresses();

  if (!addresses) return <AddressSectionSkeleton />;

  return <SettingsClient addresses={addresses} />;
}
