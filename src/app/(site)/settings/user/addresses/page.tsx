import AddressSection from "../../_components/AddressSection";
import { getUserAddresses } from "@/components/helper/getUserAddresses";

const page = async () => {
  const address = await getUserAddresses();

  if (!address) {
    return <div>Address not found</div>;
  }

  return (
    <div>
      <AddressSection addresses={address} />
    </div>
  );
};

export default page;
