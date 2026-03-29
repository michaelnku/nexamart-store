import AddressSection from "../../_components/AddressSection";
import { getUserAddresses } from "@/components/helper/getUserAddresses";
import SettingsModuleEmptyState from "../../_components/SettingsModuleEmptyState";
import { MapPin } from "lucide-react";

const page = async () => {
  const address = await getUserAddresses();

  if (!address) {
    return (
      <SettingsModuleEmptyState
        title="No Addresses Yet"
        description="Add a delivery address so checkout, shipping, and saved locations work smoothly across NexaMart."
        ctaLabel="Add Address"
        ctaHref="/settings/user/addresses"
        icon={MapPin}
      />
    );
  }

  return (
    <div>
      <AddressSection addresses={address} />
    </div>
  );
};

export default page;
