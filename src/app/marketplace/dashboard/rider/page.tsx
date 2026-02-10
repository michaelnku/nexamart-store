import { CurrentUser } from "@/lib/currentUser";
import RiderPage from "../../_components/RiderPage";

const page = async () => {
  const user = await CurrentUser();
  if (!user || user.role !== "RIDER") return;
  return (
    <div>
      <RiderPage />
    </div>
  );
};

export default page;
