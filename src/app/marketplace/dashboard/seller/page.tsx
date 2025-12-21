import { getSellerStats } from "@/actions/getSellerState";
import SellerPage from "../../_components/SellerPage";

const page = async () => {
  const stats = await getSellerStats();

  return (
    <div>
      <SellerPage stats={stats} />
    </div>
  );
};

export default page;
