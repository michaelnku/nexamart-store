import { getRiderStats } from "@/actions/dashboardState";
import RiderPage from "../../_components/RiderPage";

const page = async () => {
  const stats = await getRiderStats();

  return (
    <div>
      <RiderPage stats={stats} />
    </div>
  );
};

export default page;
